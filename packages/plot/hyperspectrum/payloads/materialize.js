import {
    SCALAR_COLOR_MAP_TEXTURE_SIZE,
    clampUnit,
    colorFromScale,
    matrixFiniteRange,
    resolveExternalHeatmapColorscale,
    resolveHeatmapColorscale
} from "../shared.js"
import { normalizeMip } from "./normalize.js"

const scalarColorMapTextureSources = new Map()
const scalarIntensityTextureSources = new WeakMap()

function buildScalarColorMapTextureSource( colorscale ){

    const resolvedColorscale = resolveHeatmapColorscale( colorscale )
    const cachedTextureSource = scalarColorMapTextureSources.get( resolvedColorscale ) ?? null
    if( cachedTextureSource !== null ){
        return cachedTextureSource
    }

    const scale = resolveExternalHeatmapColorscale( resolvedColorscale )
    const textureData = new Uint8Array( SCALAR_COLOR_MAP_TEXTURE_SIZE * 4 )

    for( var index = 0; index < SCALAR_COLOR_MAP_TEXTURE_SIZE; index++ ){

        const normalizedValue = SCALAR_COLOR_MAP_TEXTURE_SIZE <= 1
            ? 0
            : index / ( SCALAR_COLOR_MAP_TEXTURE_SIZE - 1 )
        const color = colorFromScale( scale, normalizedValue )
        const offset = index * 4

        textureData[offset] = color[0]
        textureData[offset + 1] = color[1]
        textureData[offset + 2] = color[2]
        textureData[offset + 3] = 255
    }

    const textureSource = {
        width: SCALAR_COLOR_MAP_TEXTURE_SIZE,
        height: 1,
        format: "rgba8unorm",
        data: textureData
    }

    scalarColorMapTextureSources.set( resolvedColorscale, textureSource )
    return textureSource
}

function buildScalarIntensityTextureSource( matrix ){

    const normalizedMatrix = normalizeMip( matrix )
    const cachedTextureSource = scalarIntensityTextureSources.get( normalizedMatrix ) ?? null
    if( cachedTextureSource !== null ){
        return cachedTextureSource
    }

    const height = normalizedMatrix.length
    const width = normalizedMatrix[0].length
    const valueRange = matrixFiniteRange( normalizedMatrix )
    const textureData = new Uint8Array( width * height * 2 )
    let offset = 0

    for( let row = 0; row < height; row++ ){
        for( let col = 0; col < width; col++ ){

            const value = Number( normalizedMatrix[row][col] )
            if( Number.isFinite( value ) === false ){
                textureData[offset++] = 0
                textureData[offset++] = 0
                continue
            }

            const normalizedValue = clampUnit(( value - valueRange.minimum ) / ( valueRange.maximum - valueRange.minimum ))
            textureData[offset++] = Math.max( 0, Math.min( 255, Math.round( normalizedValue * 255 )))
            textureData[offset++] = 255
        }
    }

    const textureSource = {
        width,
        height,
        format: "rg8unorm",
        data: textureData
    }

    scalarIntensityTextureSources.set( normalizedMatrix, textureSource )
    return textureSource
}

function buildCanvasImagePayload( canvas, width, height, extra = {}, options = {} ){

    const payload = {
        kind: "bitmap",
        canvas,
        width,
        height,
        ...extra
    }

    if( options.includeSource !== false ){
        payload.source = canvas.toDataURL( "image/png" )
    }

    return payload
}

function buildCanvasFromRgbaPayload( rgbaPayload ){

    const width = Math.max( 1, Number.parseInt( rgbaPayload?.width, 10 ) || 1 )
    const height = Math.max( 1, Number.parseInt( rgbaPayload?.height, 10 ) || 1 )
    const rgba = rgbaPayload?.rgba instanceof Uint8ClampedArray
        ? rgbaPayload.rgba
        : new Uint8ClampedArray( rgbaPayload?.rgba ?? [] )

    if( typeof document === "undefined" ){
        throw new Error( "Bitmap payload materialization requires a browser environment." )
    }

    const canvas = document.createElement( "canvas" )
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext( "2d" )
    if( context === null ){
        throw new Error( "Unable to create canvas context for bitmap payload materialization." )
    }

    const imageData = context.createImageData( width, height )
    imageData.data.set( rgba )
    context.putImageData( imageData, 0, 0 )

    return { canvas, width, height }
}

async function buildBitmapPayloadFromRgbaPayloadAsync( rgbaPayload, extra = {}, options = {} ){

    const width = Math.max( 1, Number.parseInt( rgbaPayload?.width, 10 ) || 1 )
    const height = Math.max( 1, Number.parseInt( rgbaPayload?.height, 10 ) || 1 )
    const rgba = rgbaPayload?.rgba instanceof Uint8ClampedArray
        ? rgbaPayload.rgba
        : new Uint8ClampedArray( rgbaPayload?.rgba ?? [] )

    if( typeof createImageBitmap === "function" && typeof ImageData !== "undefined" ){
        try{
            const imageData = new ImageData( rgba, width, height )
            const image = await createImageBitmap( imageData )
            return {
                kind: "bitmap",
                image,
                width,
                height,
                ...extra
            }
        } catch( error ){
            console.log( error )
        }
    }

    const { canvas } = buildCanvasFromRgbaPayload({ width, height, rgba })
    return buildCanvasImagePayload( canvas, width, height, extra, options )
}

function dimensionStubMatrix( width, height ){

    const normalizedWidth = Math.max( 1, Number.parseInt( width, 10 ) || 1 )
    const normalizedHeight = Math.max( 1, Number.parseInt( height, 10 ) || 1 )
    const rows = new Array( normalizedHeight )
    rows[0] = { length: normalizedWidth }

    return rows
}

function buildScalarHeatmapPayload( matrix, colorscale ){

    const normalizedMatrix = normalizeMip( matrix )
    const height = normalizedMatrix.length
    const width = normalizedMatrix[0].length

    return {
        kind: "scalar-texture",
        width,
        height,
        textureSource: buildScalarIntensityTextureSource( normalizedMatrix ),
        colorMapTexture: buildScalarColorMapTextureSource( colorscale )
    }
}

export {
    buildBitmapPayloadFromRgbaPayloadAsync,
    buildCanvasImagePayload,
    buildScalarHeatmapPayload,
    dimensionStubMatrix
}
