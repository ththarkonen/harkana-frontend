import { Deck, OrthographicView } from "@deck.gl/core"
import { BitmapLayer } from "@deck.gl/layers"

const VIEW_ID = "harkana-heatmap-view"
const MAX_Z_BLEND_CHANNELS = 10
const Z_BLEND_ADDITIVE_PARAMETERS = {
	blend: true,
	blendColorOperation: "add",
	blendColorSrcFactor: "one",
	blendColorDstFactor: "one",
	blendAlphaOperation: "add",
	blendAlphaSrcFactor: "one",
	blendAlphaDstFactor: "one"
}
const zBlendChannelUniforms = {
	name: "harkanaZBlendChannel",
	fs: `\
uniform harkanaZBlendChannelUniforms {
	vec3 color;
	vec2 contrastLimits;
	float enabled;
} harkanaZBlendChannel;
`,
	uniformTypes: {
		color: "vec3<f32>",
		contrastLimits: "vec2<f32>",
		enabled: "f32"
	}
}
const zBlendBitmapFragmentShader = `\
#version 300 es
#define SHADER_NAME harkana-z-blend-bitmap-layer-fragment-shader

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D bitmapTexture;

in vec2 vTexCoord;
in vec2 vTexPos;

out vec4 fragColor;

const float TILE_SIZE = 512.0;
const float PI = 3.1415926536;
const float WORLD_SCALE = TILE_SIZE / PI / 2.0;

vec2 lnglat_to_mercator(vec2 lnglat) {
	float x = lnglat.x;
	float y = clamp(lnglat.y, -89.9, 89.9);
	return vec2(
		radians(x) + PI,
		PI + log(tan(PI * 0.25 + radians(y) * 0.5))
	) * WORLD_SCALE;
}

vec2 mercator_to_lnglat(vec2 xy) {
	xy /= WORLD_SCALE;
	return degrees(vec2(
		xy.x - PI,
		atan(exp(xy.y - PI)) * 2.0 - PI * 0.5
	));
}

vec2 getUV(vec2 pos) {
	return vec2(
		(pos.x - bitmap.bounds[0]) / (bitmap.bounds[2] - bitmap.bounds[0]),
		(pos.y - bitmap.bounds[3]) / (bitmap.bounds[1] - bitmap.bounds[3])
	);
}

vec3 packUVsIntoRGB(vec2 uv) {
	vec2 uv8bit = floor(uv * 256.);
	vec2 uvFraction = fract(uv * 256.);
	vec2 uvFraction4bit = floor(uvFraction * 16.);
	float fractions = uvFraction4bit.x + uvFraction4bit.y * 16.;
	return vec3(uv8bit, fractions) / 255.;
}

float applyContrastWindow(float intensity) {
	float low = clamp(harkanaZBlendChannel.contrastLimits.x, 0.0, 1.0);
	float high = clamp(harkanaZBlendChannel.contrastLimits.y, low, 1.0);

	if (high <= low) {
		return intensity >= high ? 1.0 : 0.0;
	}

	return clamp((intensity - low) / (high - low), 0.0, 1.0);
}

void main(void) {
	vec2 uv = vTexCoord;
	if (bitmap.coordinateConversion < -0.5) {
		vec2 lnglat = mercator_to_lnglat(vTexPos);
		uv = getUV(lnglat);
	} else if (bitmap.coordinateConversion > 0.5) {
		vec2 commonPos = lnglat_to_mercator(vTexPos);
		uv = getUV(commonPos);
	}

	vec4 bitmapColor = texture(bitmapTexture, uv);
	float channelIntensity = harkanaZBlendChannel.enabled <= 0.5
		? 0.0
		: applyContrastWindow(bitmapColor.r);
	vec3 channelColor = harkanaZBlendChannel.color * channelIntensity * layer.opacity;

	fragColor = vec4(channelColor, channelIntensity * layer.opacity);

	geometry.uv = uv;
	DECKGL_FILTER_COLOR(fragColor, geometry);

	if (bool(picking.isActive) && !bool(picking.isAttribute)) {
		fragColor.rgb = packUVsIntoRGB(uv);
	}
}
`
let blackPixelCanvas = null
const zBlendVertexShader = `#version 300 es
in vec2 aPosition;
out vec2 vUv;

void main(void) {
	vUv = (aPosition + 1.0) * 0.5;
	gl_Position = vec4(aPosition, 0.0, 1.0);
}
`
const zBlendFragmentShader = `#version 300 es
precision highp float;

#define MAX_Z_BLEND_CHANNELS ${MAX_Z_BLEND_CHANNELS}

uniform sampler2D uTexture0;
uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform sampler2D uTexture3;
uniform sampler2D uTexture4;
uniform sampler2D uTexture5;
uniform sampler2D uTexture6;
uniform sampler2D uTexture7;
uniform sampler2D uTexture8;
uniform sampler2D uTexture9;
uniform vec3 uColors[MAX_Z_BLEND_CHANNELS];
uniform vec2 uContrastLimits[MAX_Z_BLEND_CHANNELS];
uniform float uEnabled[MAX_Z_BLEND_CHANNELS];
uniform int uChannelCount;
uniform vec4 uBounds;
uniform vec2 uXRange;
uniform vec2 uYRange;

in vec2 vUv;
out vec4 fragColor;

float applyContrastWindow(float intensity, vec2 contrastLimits) {
	float low = clamp(contrastLimits.x, 0.0, 1.0);
	float high = clamp(contrastLimits.y, low, 1.0);

	if (high <= low + 0.0005) {
		return intensity >= high ? 1.0 : 0.0;
	}

	return max(0.0, (intensity - low) / (high - low));
}

float sampleChannelIntensity(int index, vec2 uv) {
	if (index == 0) return texture(uTexture0, uv).r;
	if (index == 1) return texture(uTexture1, uv).r;
	if (index == 2) return texture(uTexture2, uv).r;
	if (index == 3) return texture(uTexture3, uv).r;
	if (index == 4) return texture(uTexture4, uv).r;
	if (index == 5) return texture(uTexture5, uv).r;
	if (index == 6) return texture(uTexture6, uv).r;
	if (index == 7) return texture(uTexture7, uv).r;
	if (index == 8) return texture(uTexture8, uv).r;
	if (index == 9) return texture(uTexture9, uv).r;
	return 0.0;
}

void main(void) {
	vec2 world = vec2(
		mix(uXRange.x, uXRange.y, vUv.x),
		mix(uYRange.x, uYRange.y, vUv.y)
	);
	vec2 texUv = vec2(
		(world.x - uBounds.x) / max(0.000001, (uBounds.z - uBounds.x)),
		(world.y - uBounds.y) / max(0.000001, (uBounds.w - uBounds.y))
	);

	if (texUv.x < 0.0 || texUv.x > 1.0 || texUv.y < 0.0 || texUv.y > 1.0) {
		fragColor = vec4(0.0, 0.0, 0.0, 1.0);
		return;
	}

	vec3 rgb = vec3(0.0);

	for (int i = 0; i < MAX_Z_BLEND_CHANNELS; i++) {
		if (i >= uChannelCount) {
			break;
		}

		if (uEnabled[i] <= 0.5) {
			continue;
		}

		float intensity = sampleChannelIntensity(i, texUv);
		float mapped = max(0.0, min(1.0, applyContrastWindow(intensity, uContrastLimits[i])));
		rgb += mapped * uColors[i];
	}

	fragColor = vec4(rgb, 1.0);
}
`
const scalarFragmentShader = `#version 300 es
precision highp float;

uniform sampler2D uIntensityTexture;
uniform sampler2D uColorMapTexture;
uniform vec4 uBounds;
uniform vec2 uXRange;
uniform vec2 uYRange;

in vec2 vUv;
out vec4 fragColor;

void main(void) {
	vec2 world = vec2(
		mix(uXRange.x, uXRange.y, vUv.x),
		mix(uYRange.x, uYRange.y, vUv.y)
	);
	vec2 texUv = vec2(
		(world.x - uBounds.x) / max(0.000001, (uBounds.z - uBounds.x)),
		(world.y - uBounds.y) / max(0.000001, (uBounds.w - uBounds.y))
	);

	if (texUv.x < 0.0 || texUv.x > 1.0 || texUv.y < 0.0 || texUv.y > 1.0) {
		fragColor = vec4(0.0, 0.0, 0.0, 0.0);
		return;
	}

	vec2 intensitySample = texture(uIntensityTexture, texUv).rg;
	float intensity = intensitySample.r;
	float valid = intensitySample.g;

	if (valid <= 0.001) {
		fragColor = vec4(0.0, 0.0, 0.0, 0.0);
		return;
	}

	vec3 color = texture(uColorMapTexture, vec2(clamp(intensity, 0.0, 1.0), 0.5)).rgb;
	fragColor = vec4(color, 1.0);
}
`

class ZBlendBitmapLayer extends BitmapLayer {
	static layerName = "HarkanaZBlendBitmapLayer"
	static defaultProps = {
		...BitmapLayer.defaultProps,
		channelColor: [ 255, 255, 255 ],
		contrastLimits: [ 0, 1 ],
		channelEnabled: true
	}

	getShaders(){
		const shaders = super.getShaders()
		const modules = Array.isArray( shaders.modules ) ? [ ...shaders.modules, zBlendChannelUniforms ] : [ zBlendChannelUniforms ]
		return {
			...shaders,
			modules,
			fs: zBlendBitmapFragmentShader
		}
	}

	draw( opts ){
		const { shaderModuleProps } = opts
		const { model, coordinateConversion, bounds, disablePicking } = this.state
		const { image, desaturate, transparentColor, tintColor, channelColor, contrastLimits, channelEnabled } = this.props

		if( shaderModuleProps.picking.isActive && disablePicking ){
			return
		}

		if( image && model ){
			model.shaderInputs.setProps({
				bitmap: {
					bitmapTexture: image,
					bounds,
					coordinateConversion,
					desaturate,
					tintColor: tintColor.slice( 0, 3 ).map(( value ) => value / 255 ),
					transparentColor: transparentColor.map(( value ) => value / 255 )
				},
				harkanaZBlendChannel: {
					color: channelColor.slice( 0, 3 ).map(( value ) => value / 255 ),
					contrastLimits: [
						Math.max( 0, Math.min( 1, Number( contrastLimits?.[0] ) || 0 )),
						Math.max( 0, Math.min( 1, Number( contrastLimits?.[1] ) || 0 ))
					],
					enabled: channelEnabled === false ? 0 : 1
				}
			})
			model.draw( this.context.renderPass )
		}
	}
}

function normalizeOrigin( origin ){
	return origin === "bottom-left" ? "bottom-left" : "top-left"
}

function bitmapBounds( payload ){
	return [ -0.5, -0.5, payload.width - 0.5, payload.height - 0.5 ]
}

function viewStateFromPane( paneState ){

	const xRange = Array.isArray( paneState?.xRange ) ? paneState.xRange : [ -0.5, 0.5 ]
	const yRange = Array.isArray( paneState?.renderYRange )
		? paneState.renderYRange
		: ( Array.isArray( paneState?.yRange ) ? paneState.yRange : [ -0.5, 0.5 ] )
	const pixelBounds = paneState?.pixelBounds ?? {}

	const spanX = Math.max( Math.abs( Number( xRange[1] ) - Number( xRange[0] )), 1e-6 )
	const spanY = Math.max( Math.abs( Number( yRange[1] ) - Number( yRange[0] )), 1e-6 )
	const pixelWidth = Math.max( 1, Number( pixelBounds.width ) || 1 )
	const pixelHeight = Math.max( 1, Number( pixelBounds.height ) || 1 )

	return {
		target: [
			( Number( xRange[0] ) + Number( xRange[1] )) / 2,
			( Number( yRange[0] ) + Number( yRange[1] )) / 2,
			0
		],
		zoom: [
			Math.log2( pixelWidth / spanX ),
			Math.log2( pixelHeight / spanY )
		]
	}
}

function nextAnimationFrame(){
	return new Promise(( resolve ) => {
		requestAnimationFrame(() => resolve() )
	})
}

function createLayer( payload, currentSequence ){
	return new BitmapLayer({
		id: "harkana-heatmap-bitmap-" + currentSequence,
		bounds: bitmapBounds( payload ),
		image: payload.image ?? payload.canvas,
		textureParameters: {
			minFilter: "nearest",
			magFilter: "nearest",
			mipmapFilter: "none"
		},
		pickable: false
	})
}

function blackCanvas(){

	if( blackPixelCanvas !== null ){
		return blackPixelCanvas
	}

	if( typeof document === "undefined" ){
		return null
	}

	const canvas = document.createElement( "canvas" )
	canvas.width = 1
	canvas.height = 1

	const context = canvas.getContext( "2d" )
	if( context === null ){
		return null
	}

	context.fillStyle = "#000000"
	context.fillRect( 0, 0, 1, 1 )

	blackPixelCanvas = canvas
	return blackPixelCanvas
}

function compileShader( gl, type, source ){

	const shader = gl.createShader( type )
	if( shader === null ){
		throw new Error( "Failed to create heatmap shader." )
	}

	gl.shaderSource( shader, source )
	gl.compileShader( shader )

	if( gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ){
		return shader
	}

	const message = gl.getShaderInfoLog( shader ) || "Unknown shader compilation error."
	gl.deleteShader( shader )
	throw new Error( message )
}

function createProgram( gl, fragmentSource = zBlendFragmentShader ){

	const vertexShader = compileShader( gl, gl.VERTEX_SHADER, zBlendVertexShader )
	const fragmentShader = compileShader( gl, gl.FRAGMENT_SHADER, fragmentSource )
	const program = gl.createProgram()

	if( program === null ){
		gl.deleteShader( vertexShader )
		gl.deleteShader( fragmentShader )
		throw new Error( "Failed to create heatmap shader program." )
	}

	gl.attachShader( program, vertexShader )
	gl.attachShader( program, fragmentShader )
	gl.linkProgram( program )
	gl.deleteShader( vertexShader )
	gl.deleteShader( fragmentShader )

	if( gl.getProgramParameter( program, gl.LINK_STATUS ) ){
		return program
	}

	const message = gl.getProgramInfoLog( program ) || "Unknown shader link error."
	gl.deleteProgram( program )
	throw new Error( message )
}

function materializeScalarCanvas( payload ){

	if( payload?.kind !== "scalar-texture" ){
		return null
	}

	if( typeof document === "undefined" ){
		return null
	}

	const width = Math.max( 1, Number( payload?.width ) || 1 )
	const height = Math.max( 1, Number( payload?.height ) || 1 )
	const intensitySource = payload?.textureSource ?? null
	const colorMapSource = payload?.colorMapTexture ?? null
	const intensityData = intensitySource?.data instanceof Uint8Array ? intensitySource.data : null
	const colorMapData = colorMapSource?.data instanceof Uint8Array ? colorMapSource.data : null
	const colorMapWidth = Math.max( 1, Number( colorMapSource?.width ) || 1 )

	if( intensityData === null || colorMapData === null ){
		return null
	}

	const canvas = document.createElement( "canvas" )
	canvas.width = width
	canvas.height = height

	const context = canvas.getContext( "2d" )
	if( context === null ){
		return null
	}

	const imageData = context.createImageData( width, height )
	let offset = 0

	for( let pixelIndex = 0; pixelIndex < width * height; pixelIndex++ ){
		const intensityOffset = pixelIndex * 2
		const intensity = intensityData[intensityOffset] ?? 0
		const valid = intensityData[intensityOffset + 1] ?? 0

		if( valid <= 0 ){
			imageData.data[offset++] = 0
			imageData.data[offset++] = 0
			imageData.data[offset++] = 0
			imageData.data[offset++] = 0
			continue
		}

		const normalizedIntensity = Math.max( 0, Math.min( 255, intensity )) / 255
		const colorSampleIndex = Math.max( 0, Math.min( colorMapWidth - 1, Math.round( normalizedIntensity * ( colorMapWidth - 1 ))))
		const colorIndex = colorSampleIndex * 4
		imageData.data[offset++] = colorMapData[colorIndex] ?? 0
		imageData.data[offset++] = colorMapData[colorIndex + 1] ?? 0
		imageData.data[offset++] = colorMapData[colorIndex + 2] ?? 0
		imageData.data[offset++] = 255
	}

	context.putImageData( imageData, 0, 0 )

	return {
		kind: "bitmap",
		canvas,
		width,
		height
	}
}

function createZBlendWebglRenderer( container, options = {} ){

	let canvas = null
	let gl = null
	let program = null
	let quadBuffer = null
	let attributeLocation = -1
	let uniformLocations = null
	let fallbackTexture = null
	const textureCache = new Map()

	const hideCanvas = () => {
		if( canvas !== null ){
			canvas.style.display = "none"
		}
	}

	const showCanvas = () => {
		if( canvas !== null ){
			canvas.style.display = "block"
		}
	}

	const ensureCanvas = () => {

		if( canvas !== null ){
			return canvas
		}

		if( typeof document === "undefined" ){
			return null
		}

		canvas = document.createElement( "canvas" )
		canvas.style.position = "absolute"
		canvas.style.inset = "0"
		canvas.style.width = "100%"
		canvas.style.height = "100%"
		canvas.style.pointerEvents = "none"
		canvas.style.imageRendering = "pixelated"
		canvas.style.display = "none"
		container.appendChild( canvas )

		return canvas
	}

	const createSolidTexture = ( rgba = [ 0, 0, 0, 255 ]) => {

		if( gl === null ){
			return null
		}

		const texture = gl.createTexture()
		if( texture === null ){
			return null
		}

		gl.bindTexture( gl.TEXTURE_2D, texture )
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST )
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST )
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE )
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE )
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			1,
			1,
			0,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			new Uint8Array( rgba )
		)

		return texture
	}

	const ensureContext = () => {

		if( gl !== null ){
			return gl
		}

		const targetCanvas = ensureCanvas()
		if( targetCanvas === null ){
			return null
		}

		gl = targetCanvas.getContext( "webgl2", {
			alpha: true,
			antialias: false,
			desynchronized: true,
			preserveDrawingBuffer: false,
			powerPreference: "high-performance"
		})

		if( gl === null ){
			return null
		}

		program = createProgram( gl )
		quadBuffer = gl.createBuffer()
		attributeLocation = gl.getAttribLocation( program, "aPosition" )
		uniformLocations = {
			textures: Array.from({ length: MAX_Z_BLEND_CHANNELS }, (_, index ) => gl.getUniformLocation( program, "uTexture" + index )),
			colors: gl.getUniformLocation( program, "uColors[0]" ),
			contrastLimits: gl.getUniformLocation( program, "uContrastLimits[0]" ),
			enabled: gl.getUniformLocation( program, "uEnabled[0]" ),
			channelCount: gl.getUniformLocation( program, "uChannelCount" ),
			bounds: gl.getUniformLocation( program, "uBounds" ),
			xRange: gl.getUniformLocation( program, "uXRange" ),
			yRange: gl.getUniformLocation( program, "uYRange" )
		}
		fallbackTexture = createSolidTexture()

		gl.bindBuffer( gl.ARRAY_BUFFER, quadBuffer )
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([
				-1, -1,
				1, -1,
				-1, 1,
				-1, 1,
				1, -1,
				1, 1
			]),
			gl.STATIC_DRAW
		)
		gl.pixelStorei( gl.UNPACK_ALIGNMENT, 1 )
		gl.disable( gl.DEPTH_TEST )
		gl.disable( gl.BLEND )

		return gl
	}

	const ensureTexture = ( image ) => {

		if( gl === null || image === null || typeof image !== "object" ){
			return fallbackTexture
		}

		const cached = textureCache.get( image ) ?? null
		const width = Math.max( 1, Number( image.width ) || 1 )
		const height = Math.max( 1, Number( image.height ) || 1 )

		if( cached !== null && cached.width === width && cached.height === height ){
			return cached.texture
		}

		if( cached?.texture ){
			gl.deleteTexture( cached.texture )
		}

		const texture = gl.createTexture()
		if( texture === null ){
			return fallbackTexture
		}

		gl.bindTexture( gl.TEXTURE_2D, texture )
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST )
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST )
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE )
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE )
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image )

		textureCache.set( image, { texture, width, height })
		return texture
	}

	const resizeCanvas = ( paneState ) => {

		if( canvas === null ){
			return
		}

		const width = Math.max( 1, Math.round( Number( paneState?.pixelBounds?.width ) || 1 ))
		const height = Math.max( 1, Math.round( Number( paneState?.pixelBounds?.height ) || 1 ))

		if( canvas.width !== width ){
			canvas.width = width
		}

		if( canvas.height !== height ){
			canvas.height = height
		}
	}

	const render = async ({ payload, paneState }) => {

		if( payload?.kind !== "z-blend" || paneState === null ){
			hideCanvas()
			return false
		}

		const context = ensureContext()
		if( context === null || program === null || quadBuffer === null || uniformLocations === null ){
			hideCanvas()
			return false
		}

		showCanvas()
		resizeCanvas( paneState )

		const xRange = Array.isArray( paneState?.xRange ) ? paneState.xRange : [ -0.5, Number( payload?.width ) - 0.5 ]
		const yRange = Array.isArray( paneState?.renderYRange )
			? paneState.renderYRange
			: ( Array.isArray( paneState?.yRange ) ? paneState.yRange : [ -0.5, Number( payload?.height ) - 0.5 ] )
		const bounds = bitmapBounds( payload )
		const colors = new Float32Array( MAX_Z_BLEND_CHANNELS * 3 )
		const contrastLimits = new Float32Array( MAX_Z_BLEND_CHANNELS * 2 )
		const enabled = new Float32Array( MAX_Z_BLEND_CHANNELS )
		const channels = Array.isArray( payload?.channels ) ? payload.channels.slice( 0, MAX_Z_BLEND_CHANNELS ) : []

		context.viewport( 0, 0, canvas.width, canvas.height )
		context.clearColor( 0, 0, 0, 1 )
		context.clear( context.COLOR_BUFFER_BIT )
		context.useProgram( program )
		context.bindBuffer( context.ARRAY_BUFFER, quadBuffer )
		context.enableVertexAttribArray( attributeLocation )
		context.vertexAttribPointer( attributeLocation, 2, context.FLOAT, false, 0, 0 )
		context.uniform1i( uniformLocations.channelCount, channels.length )
		context.uniform4f( uniformLocations.bounds, bounds[0], bounds[1], bounds[2], bounds[3] )
		context.uniform2f( uniformLocations.xRange, Number( xRange[0] ) || 0, Number( xRange[1] ) || 0 )
		context.uniform2f( uniformLocations.yRange, Number( yRange[0] ) || 0, Number( yRange[1] ) || 0 )

		for( let index = 0; index < MAX_Z_BLEND_CHANNELS; index++ ){
			const channel = channels[index] ?? null
			const colorOffset = index * 3
			const contrastOffset = index * 2
			const texture = ensureTexture( channel?.image ?? null ) ?? fallbackTexture

			context.activeTexture( context.TEXTURE0 + index )
			context.bindTexture( context.TEXTURE_2D, texture )
			if( uniformLocations.textures[index] !== null ){
				context.uniform1i( uniformLocations.textures[index], index )
			}

			if( channel !== null ){
				const color = Array.isArray( channel.color ) ? channel.color : [ 255, 255, 255 ]
				colors[colorOffset] = Math.max( 0, Math.min( 1, ( Number( color[0] ) || 0 ) / 255 ))
				colors[colorOffset + 1] = Math.max( 0, Math.min( 1, ( Number( color[1] ) || 0 ) / 255 ))
				colors[colorOffset + 2] = Math.max( 0, Math.min( 1, ( Number( color[2] ) || 0 ) / 255 ))
				contrastLimits[contrastOffset] = Math.max( 0, Math.min( 1, Number( channel.contrastLimits?.[0] ) || 0 ))
				contrastLimits[contrastOffset + 1] = Math.max( 0, Math.min( 1, Number( channel.contrastLimits?.[1] ) || 0 ))
				enabled[index] = channel.enabled === false ? 0 : 1
			}
		}

		context.uniform3fv( uniformLocations.colors, colors )
		context.uniform2fv( uniformLocations.contrastLimits, contrastLimits )
		context.uniform1fv( uniformLocations.enabled, enabled )
		context.drawArrays( context.TRIANGLES, 0, 6 )

		return true
	}

	const clear = () => {
		hideCanvas()
		if( gl !== null ){
			gl.viewport( 0, 0, canvas?.width ?? 1, canvas?.height ?? 1 )
			gl.clearColor( 0, 0, 0, 0 )
			gl.clear( gl.COLOR_BUFFER_BIT )
		}
	}

	const destroy = () => {
		for( const entry of textureCache.values() ){
			entry?.texture?.delete?.()
			if( gl !== null && entry?.texture ){
				gl.deleteTexture( entry.texture )
			}
		}
		textureCache.clear()

		if( gl !== null ){
			if( fallbackTexture !== null ){
				gl.deleteTexture( fallbackTexture )
			}
			if( quadBuffer !== null ){
				gl.deleteBuffer( quadBuffer )
			}
			if( program !== null ){
				gl.deleteProgram( program )
			}
		}

		if( canvas !== null ){
			canvas.remove()
		}

		canvas = null
		gl = null
		program = null
		quadBuffer = null
		uniformLocations = null
		fallbackTexture = null
	}

	return {
		render,
		clear,
		destroy,
		hide: hideCanvas,
		show: showCanvas
	}
}

function createScalarWebglRenderer( container, options = {} ){

	let canvas = null
	let gl = null
	let program = null
	let quadBuffer = null
	let attributeLocation = -1
	let uniformLocations = null
	let intensityTexture = null
	let colorMapTexture = null
	let boundIntensitySource = null
	let boundColorMapSource = null

	const hideCanvas = () => {
		if( canvas !== null ){
			canvas.style.display = "none"
		}
	}

	const showCanvas = () => {
		if( canvas !== null ){
			canvas.style.display = "block"
		}
	}

	const ensureCanvas = () => {

		if( canvas !== null ){
			return canvas
		}

		if( typeof document === "undefined" ){
			return null
		}

		canvas = document.createElement( "canvas" )
		canvas.style.position = "absolute"
		canvas.style.inset = "0"
		canvas.style.width = "100%"
		canvas.style.height = "100%"
		canvas.style.pointerEvents = "none"
		canvas.style.imageRendering = "pixelated"
		canvas.style.display = "none"
		container.appendChild( canvas )

		return canvas
	}

	const createTexture = ( filter = "nearest" ) => {

		if( gl === null ){
			return null
		}

		const texture = gl.createTexture()
		if( texture === null ){
			return null
		}

		gl.bindTexture( gl.TEXTURE_2D, texture )
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter === "linear" ? gl.LINEAR : gl.NEAREST )
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter === "linear" ? gl.LINEAR : gl.NEAREST )
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE )
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE )

		return texture
	}

	const ensureContext = () => {

		if( gl !== null ){
			return gl
		}

		const targetCanvas = ensureCanvas()
		if( targetCanvas === null ){
			return null
		}

		gl = targetCanvas.getContext( "webgl2", {
			alpha: true,
			antialias: false,
			desynchronized: true,
			preserveDrawingBuffer: false,
			powerPreference: "high-performance"
		})

		if( gl === null ){
			return null
		}

		program = createProgram( gl, scalarFragmentShader )
		quadBuffer = gl.createBuffer()
		attributeLocation = gl.getAttribLocation( program, "aPosition" )
		uniformLocations = {
			intensityTexture: gl.getUniformLocation( program, "uIntensityTexture" ),
			colorMapTexture: gl.getUniformLocation( program, "uColorMapTexture" ),
			bounds: gl.getUniformLocation( program, "uBounds" ),
			xRange: gl.getUniformLocation( program, "uXRange" ),
			yRange: gl.getUniformLocation( program, "uYRange" )
		}
		intensityTexture = createTexture( "nearest" )
		colorMapTexture = createTexture( "linear" )

		gl.bindBuffer( gl.ARRAY_BUFFER, quadBuffer )
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([
				-1, -1,
				1, -1,
				-1, 1,
				-1, 1,
				1, -1,
				1, 1
			]),
			gl.STATIC_DRAW
		)
		gl.pixelStorei( gl.UNPACK_ALIGNMENT, 1 )
		gl.disable( gl.DEPTH_TEST )
		gl.disable( gl.BLEND )

		return gl
	}

	const resizeCanvas = ( paneState ) => {

		if( canvas === null ){
			return
		}

		const width = Math.max( 1, Math.round( Number( paneState?.pixelBounds?.width ) || 1 ))
		const height = Math.max( 1, Math.round( Number( paneState?.pixelBounds?.height ) || 1 ))

		if( canvas.width !== width ){
			canvas.width = width
		}

		if( canvas.height !== height ){
			canvas.height = height
		}
	}

	const updateIntensityTexture = ( source ) => {

		if( gl === null || intensityTexture === null || source === null || typeof source !== "object" ){
			return
		}

		if( boundIntensitySource === source ){
			return
		}

		const width = Math.max( 1, Number( source.width ) || 1 )
		const height = Math.max( 1, Number( source.height ) || 1 )
		const data = source.data instanceof Uint8Array ? source.data : null
		if( data === null ){
			return
		}

		gl.activeTexture( gl.TEXTURE0 )
		gl.bindTexture( gl.TEXTURE_2D, intensityTexture )
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RG8, width, height, 0, gl.RG, gl.UNSIGNED_BYTE, data )
		boundIntensitySource = source
	}

	const updateColorMapTexture = ( source ) => {

		if( gl === null || colorMapTexture === null || source === null || typeof source !== "object" ){
			return
		}

		if( boundColorMapSource === source ){
			return
		}

		const width = Math.max( 1, Number( source.width ) || 1 )
		const height = Math.max( 1, Number( source.height ) || 1 )
		const data = source.data instanceof Uint8Array ? source.data : null
		if( data === null ){
			return
		}

		gl.activeTexture( gl.TEXTURE1 )
		gl.bindTexture( gl.TEXTURE_2D, colorMapTexture )
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data )
		boundColorMapSource = source
	}

	const render = async ({ payload, paneState }) => {

		if( payload?.kind !== "scalar-texture" || paneState === null ){
			hideCanvas()
			return false
		}

		const context = ensureContext()
		if( context === null || program === null || quadBuffer === null || uniformLocations === null || intensityTexture === null || colorMapTexture === null ){
			hideCanvas()
			return false
		}

		showCanvas()
		resizeCanvas( paneState )
		updateIntensityTexture( payload.textureSource )
		updateColorMapTexture( payload.colorMapTexture )

		const xRange = Array.isArray( paneState?.xRange ) ? paneState.xRange : [ -0.5, Number( payload?.width ) - 0.5 ]
		const yRange = Array.isArray( paneState?.renderYRange )
			? paneState.renderYRange
			: ( Array.isArray( paneState?.yRange ) ? paneState.yRange : [ -0.5, Number( payload?.height ) - 0.5 ] )
		const bounds = bitmapBounds( payload )

		context.viewport( 0, 0, canvas.width, canvas.height )
		context.clearColor( 0, 0, 0, 0 )
		context.clear( context.COLOR_BUFFER_BIT )
		context.useProgram( program )
		context.bindBuffer( context.ARRAY_BUFFER, quadBuffer )
		context.enableVertexAttribArray( attributeLocation )
		context.vertexAttribPointer( attributeLocation, 2, context.FLOAT, false, 0, 0 )

		context.activeTexture( context.TEXTURE0 )
		context.bindTexture( context.TEXTURE_2D, intensityTexture )
		context.activeTexture( context.TEXTURE1 )
		context.bindTexture( context.TEXTURE_2D, colorMapTexture )

		context.uniform1i( uniformLocations.intensityTexture, 0 )
		context.uniform1i( uniformLocations.colorMapTexture, 1 )
		context.uniform4f( uniformLocations.bounds, bounds[0], bounds[1], bounds[2], bounds[3] )
		context.uniform2f( uniformLocations.xRange, Number( xRange[0] ) || 0, Number( xRange[1] ) || 0 )
		context.uniform2f( uniformLocations.yRange, Number( yRange[0] ) || 0, Number( yRange[1] ) || 0 )
		context.drawArrays( context.TRIANGLES, 0, 6 )

		return true
	}

	const clear = () => {
		hideCanvas()
		if( gl !== null ){
			gl.viewport( 0, 0, canvas?.width ?? 1, canvas?.height ?? 1 )
			gl.clearColor( 0, 0, 0, 0 )
			gl.clear( gl.COLOR_BUFFER_BIT )
		}
	}

	const destroy = () => {
		if( gl !== null ){
			if( intensityTexture !== null ){
				gl.deleteTexture( intensityTexture )
			}
			if( colorMapTexture !== null ){
				gl.deleteTexture( colorMapTexture )
			}
			if( quadBuffer !== null ){
				gl.deleteBuffer( quadBuffer )
			}
			if( program !== null ){
				gl.deleteProgram( program )
			}
		}

		if( canvas !== null ){
			canvas.remove()
		}

		canvas = null
		gl = null
		program = null
		quadBuffer = null
		uniformLocations = null
		intensityTexture = null
		colorMapTexture = null
		boundIntensitySource = null
		boundColorMapSource = null
	}

	return {
		render,
		clear,
		destroy,
		hide: hideCanvas,
		show: showCanvas
	}
}

function createZBlendLayers( payload, currentSequence ){

	const bounds = bitmapBounds( payload )
	const layers = []
	const backgroundImage = blackCanvas()

	if( backgroundImage !== null ){
		layers.push(new BitmapLayer({
			id: "harkana-heatmap-z-blend-background",
			bounds,
			image: backgroundImage,
			textureParameters: {
				minFilter: "nearest",
				magFilter: "nearest",
				mipmapFilter: "none"
			},
			pickable: false
		}))
	}

	const channels = Array.isArray( payload?.channels ) ? payload.channels : []
	for( let index = 0; index < channels.length; index++ ){
		const channel = channels[index] ?? {}
		if( channel.enabled === false || channel.image == null ){
			continue
		}

		layers.push(new ZBlendBitmapLayer({
			id: "harkana-heatmap-z-blend-channel-" + index,
			bounds,
			image: channel.image,
			textureParameters: {
				minFilter: "nearest",
				magFilter: "nearest",
				mipmapFilter: "none"
			},
			channelColor: Array.isArray( channel.color ) ? channel.color : [ 255, 255, 255 ],
			contrastLimits: Array.isArray( channel.contrastLimits ) ? channel.contrastLimits : [ 0, 1 ],
			channelEnabled: channel.enabled !== false,
			parameters: Z_BLEND_ADDITIVE_PARAMETERS,
			pickable: false
		}))
	}

	return layers
}

function createLayers( payload, currentSequence ){

	if( payload?.kind === "z-blend" ){
		return createZBlendLayers( payload, currentSequence )
	}

	if( payload?.kind === "scalar-texture" ){
		const fallbackPayload = materializeScalarCanvas( payload )
		if( fallbackPayload !== null ){
			return [ createLayer( fallbackPayload, currentSequence ) ]
		}
		return []
	}

	return [ createLayer( payload, currentSequence ) ]
}

function createRenderer( container, options = {} ){

	let deck = null
	let zBlendRenderer = null
	let scalarRenderer = null
	let renderSequence = 0

	const ensureDeck = ( origin ) => {

		if( deck !== null ){
			return deck
		}

		deck = new Deck({
			parent: container,
			width: "100%",
			height: "100%",
			style: {
				pointerEvents: "none",
				imageRendering: "pixelated"
			},
			useDevicePixels: true,
			controller: false,
			views: [ new OrthographicView({
				id: VIEW_ID,
				flipY: origin === "bottom-left"
			}) ],
			layers: [],
			deviceProps: {
				webgl: {
					antialias: false
				}
			},
			parameters: {
				clearColor: [ 0, 0, 0, 0 ]
			},
			onError: ( error ) => {
				console.error( error )
				if( typeof options.onError === "function" ){
					options.onError( error )
				}
			}
		})

		return deck
	}

	const ensureZBlendRenderer = () => {

		if( zBlendRenderer !== null ){
			return zBlendRenderer
		}

		zBlendRenderer = createZBlendWebglRenderer( container, options )
		return zBlendRenderer
	}

	const ensureScalarRenderer = () => {

		if( scalarRenderer !== null ){
			return scalarRenderer
		}

		scalarRenderer = createScalarWebglRenderer( container, options )
		return scalarRenderer
	}

	const render = async ({ payload, paneState }) => {

		if( container === null || payload === null || paneState === null ){
			return
		}

		const origin = normalizeOrigin( paneState.heatmapOrigin )
		const currentSequence = renderSequence + 1
		renderSequence = currentSequence

		if( payload?.kind === "z-blend" ){
			if( scalarRenderer !== null ){
				scalarRenderer.hide()
			}
			const activeZBlendRenderer = ensureZBlendRenderer()
			const renderedWithWebgl = await activeZBlendRenderer.render({ payload, paneState })

			if( renderedWithWebgl ){
				if( deck !== null ){
					deck.setProps({ layers: [] })
					if( deck.canvas ){
						deck.canvas.style.display = "none"
					}
				}
				await nextAnimationFrame()
				return
			}
		} else if( zBlendRenderer !== null ){
			zBlendRenderer.hide()
		}

		if( payload?.kind === "scalar-texture" ){
			const activeScalarRenderer = ensureScalarRenderer()
			const renderedWithWebgl = await activeScalarRenderer.render({ payload, paneState })

			if( renderedWithWebgl ){
				if( deck !== null ){
					deck.setProps({ layers: [] })
					if( deck.canvas ){
						deck.canvas.style.display = "none"
					}
				}
				await nextAnimationFrame()
				return
			}
		} else if( scalarRenderer !== null ){
			scalarRenderer.hide()
		}

		const deckInstance = ensureDeck( origin )
		if( deckInstance.canvas ){
			deckInstance.canvas.style.display = "block"
		}

		await new Promise(( resolve, reject ) => {

			let settled = false

			deckInstance.setProps({
				width: Math.max( 1, Number( paneState?.pixelBounds?.width ) || 1 ),
				height: Math.max( 1, Number( paneState?.pixelBounds?.height ) || 1 ),
				views: [ new OrthographicView({
					id: VIEW_ID,
					flipY: origin === "bottom-left"
				}) ],
					viewState: viewStateFromPane( paneState ),
					layers: createLayers( payload, currentSequence ),
				onAfterRender: () => {
					if( settled || currentSequence !== renderSequence ) return
					settled = true
					resolve()
				},
				onError: ( error ) => {
					console.error( error )
					if( settled || currentSequence !== renderSequence ) return
					settled = true
					if( typeof options.onError === "function" ){
						options.onError( error )
					}
					reject( error )
				}
			})
		})

		await nextAnimationFrame()
	}

	const clear = () => {
		renderSequence += 1
		if( deck !== null ){
			deck.setProps({ layers: [] })
		}
		if( zBlendRenderer !== null ){
			zBlendRenderer.clear()
		}
		if( scalarRenderer !== null ){
			scalarRenderer.clear()
		}
	}

	const destroy = () => {
		renderSequence += 1
		if( deck !== null ){
			deck.finalize()
			deck = null
		}
		if( zBlendRenderer !== null ){
			zBlendRenderer.destroy()
			zBlendRenderer = null
		}

		if( scalarRenderer !== null ){
			scalarRenderer.destroy()
			scalarRenderer = null
		}
	}

	return {
		render,
		clear,
		destroy
	}
}

export default {
	createRenderer
}
