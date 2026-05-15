import { componentColor } from "../pcaColors.js"
import {
    DEFAULT_UMAP_CHANNEL_COLOR_STRINGS,
    buildRobustScale,
    clampUnit,
    matrixFiniteRange,
    normalizeByScale,
    parseColorValue
} from "../shared.js"
import {
    buildCanvasImagePayload,
    buildScalarHeatmapPayload
} from "./materialize.js"
import {
    normalizeMip,
    normalizePcaMip,
    normalizePcaScores,
    normalizeUmapChannels,
    normalizeZBlendSource
} from "./normalize.js"

const robustScaleCache = new WeakMap()
const pcaRgbNormalizedChannelsCache = new WeakMap()
const zBlendIntensityTextureCache = new WeakMap()

function buildRgbMipImage( rgbMatrix, options = {} ){

    const height = rgbMatrix.length
    const width = rgbMatrix[0].length

    if( typeof document === "undefined" ){
        throw new Error( "RGB MIP rendering requires a browser environment." )
    }

    const canvas = document.createElement( "canvas" )
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext( "2d" )
    if( context === null ){
        throw new Error( "Unable to create canvas context for RGB MIP rendering." )
    }

    const imageData = context.createImageData( width, height )
    const includePixelMetrics = options?.includePixelMetrics === true
    var intensityMatrix = includePixelMetrics
        ? Array.from({ length: height }, () => Array( width ).fill( 0 ))
        : null

    var offset = 0
    for( var row = 0; row < height; row++ ){
        for( var col = 0; col < width; col++ ){

            const pixel = rgbMatrix[row][col]
            const red = Number( pixel[0] ) || 0
            const green = Number( pixel[1] ) || 0
            const blue = Number( pixel[2] ) || 0

            imageData.data[offset++] = Math.max( 0, Math.min( 255, Math.round( red )))
            imageData.data[offset++] = Math.max( 0, Math.min( 255, Math.round( green )))
            imageData.data[offset++] = Math.max( 0, Math.min( 255, Math.round( blue )))
            imageData.data[offset++] = 255

            if( includePixelMetrics ){
                intensityMatrix[row][col] = ( red + green + blue ) / ( 3 * 255 )
            }
        }
    }

    context.putImageData( imageData, 0, 0 )

    const extraPayload = includePixelMetrics ? { intensityMatrix } : {}
    return buildCanvasImagePayload( canvas, width, height, extraPayload, options )
}

function resolveUmapChannelColors( channelColors ){

    return {
        r: parseColorValue( channelColors?.r ) ?? parseColorValue( DEFAULT_UMAP_CHANNEL_COLOR_STRINGS.r ) ?? [ 255, 0, 0 ],
        g: parseColorValue( channelColors?.g ) ?? parseColorValue( DEFAULT_UMAP_CHANNEL_COLOR_STRINGS.g ) ?? [ 0, 255, 0 ],
        b: parseColorValue( channelColors?.b ) ?? parseColorValue( DEFAULT_UMAP_CHANNEL_COLOR_STRINGS.b ) ?? [ 0, 0, 255 ]
    }
}

function buildUmapImage( umapChannels, options = {} ){

    const redMatrix = umapChannels.r
    const greenMatrix = umapChannels.g
    const blueMatrix = umapChannels.b

    const height = redMatrix.length
    const width = redMatrix[0].length

    if( typeof document === "undefined" ){
        throw new Error( "UMAP rendering requires a browser environment." )
    }

    const channelColors = resolveUmapChannelColors( options.channelColors )

    const canvas = document.createElement( "canvas" )
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext( "2d" )
    if( context === null ){
        throw new Error( "Unable to create canvas context for UMAP rendering." )
    }

    const imageData = context.createImageData( width, height )
    const includePixelMetrics = options?.includePixelMetrics === true
    var intensityMatrix = includePixelMetrics
        ? Array.from({ length: height }, () => Array( width ).fill( 0 ))
        : null

    var offset = 0
    for( var row = 0; row < height; row++ ){
        for( var col = 0; col < width; col++ ){

            const redWeight = clampUnit( redMatrix[row][col] )
            const greenWeight = clampUnit( greenMatrix[row][col] )
            const blueWeight = clampUnit( blueMatrix[row][col] )

            const redValue = Math.max( 0,
                                       Math.min( 255,
                                                 Math.round(
                                                     ( redWeight * channelColors.r[0] ) +
                                                     ( greenWeight * channelColors.g[0] ) +
                                                     ( blueWeight * channelColors.b[0] )
                                                 ) ) )
            const greenValue = Math.max( 0,
                                         Math.min( 255,
                                                   Math.round(
                                                       ( redWeight * channelColors.r[1] ) +
                                                       ( greenWeight * channelColors.g[1] ) +
                                                       ( blueWeight * channelColors.b[1] )
                                                   ) ) )
            const blueValue = Math.max( 0,
                                        Math.min( 255,
                                                  Math.round(
                                                      ( redWeight * channelColors.r[2] ) +
                                                      ( greenWeight * channelColors.g[2] ) +
                                                      ( blueWeight * channelColors.b[2] )
                                                  ) ) )

            imageData.data[offset++] = redValue
            imageData.data[offset++] = greenValue
            imageData.data[offset++] = blueValue
            imageData.data[offset++] = 255

            if( includePixelMetrics ){
                intensityMatrix[row][col] = ( redWeight + greenWeight + blueWeight ) / 3
            }
        }
    }

    context.putImageData( imageData, 0, 0 )

    const extraPayload = includePixelMetrics ? { intensityMatrix } : {}
    return buildCanvasImagePayload( canvas, width, height, extraPayload, options )
}

function buildPcaMipImage( pcaMipMatrix, options = {} ){

    const height = pcaMipMatrix.length
    const width = pcaMipMatrix[0].length
    const useEncodedBrightness = options.useEncodedBrightness !== false

    if( typeof document === "undefined" ){
        throw new Error( "PCA MIP rendering requires a browser environment." )
    }

    const canvas = document.createElement( "canvas" )
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext( "2d" )
    if( context === null ){
        throw new Error( "Unable to create canvas context for PCA MIP rendering." )
    }

    const imageData = context.createImageData( width, height )
    const includePixelMetrics = options?.includePixelMetrics === true
    var intensityMatrix = includePixelMetrics
        ? Array.from({ length: height }, () => Array( width ).fill( 0 ))
        : null

    var offset = 0
    for( var row = 0; row < height; row++ ){
        for( var col = 0; col < width; col++ ){

            const encodedPixel = pcaMipMatrix[row][col]
            const baseColor = encodedPixel === null ? [ 0, 0, 0 ] : componentColor( encodedPixel.componentIndex )
            const brightness = encodedPixel === null
                ? 0
                : ( useEncodedBrightness ? clampUnit( encodedPixel.brightness ) : 1 )

            imageData.data[offset++] = Math.max( 0, Math.min( 255, Math.round( baseColor[0] * brightness )))
            imageData.data[offset++] = Math.max( 0, Math.min( 255, Math.round( baseColor[1] * brightness )))
            imageData.data[offset++] = Math.max( 0, Math.min( 255, Math.round( baseColor[2] * brightness )))
            imageData.data[offset++] = 255

            if( includePixelMetrics ){
                intensityMatrix[row][col] = brightness
            }
        }
    }

    context.putImageData( imageData, 0, 0 )

    const extraPayload = includePixelMetrics ? { intensityMatrix } : {}
    return buildCanvasImagePayload( canvas, width, height, extraPayload, options )
}

function buildPcaClassificationImage( componentScores, options = {} ){

    const width = componentScores[0].matrix[0].length
    const height = componentScores[0].matrix.length

    var maxAbs = 0

    for( const entry of componentScores ){
        for( var row = 0; row < height; row++ ){
            for( var col = 0; col < width; col++ ){
                const value = entry.matrix[row][col]
                if( value === null ) continue

                const absolute = Math.abs( value )
                if( absolute > maxAbs ) maxAbs = absolute
            }
        }
    }

    if( maxAbs <= 0 ) maxAbs = 1

    if( typeof document === "undefined" ){
        throw new Error( "PCA classification rendering requires a browser environment." )
    }

    const canvas = document.createElement( "canvas" )
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext( "2d" )
    if( context === null ){
        throw new Error( "Unable to create canvas context for PCA classification rendering." )
    }

    const imageData = context.createImageData( width, height )
    const includePixelMetrics = options?.includePixelMetrics === true
    var magnitudeMatrix = includePixelMetrics
        ? Array.from({ length: height }, () => Array( width ).fill( 0 ))
        : null

    var offset = 0
    for( var row = 0; row < height; row++ ){
        for( var col = 0; col < width; col++ ){

            var dominantAbs = -1
            var dominantComponent = componentScores[0].componentIndex

            for( const entry of componentScores ){
                const value = entry.matrix[row][col]
                const absolute = value === null ? 0 : Math.abs( value )

                if( absolute > dominantAbs ){
                    dominantAbs = absolute
                    dominantComponent = entry.componentIndex
                }
            }

            if( dominantAbs < 0 ) dominantAbs = 0

            const normalizedMagnitude = clampUnit( dominantAbs / maxAbs )
            const brightness = Math.sqrt( normalizedMagnitude )

            const baseColor = componentColor( dominantComponent )

            imageData.data[offset++] = Math.round( baseColor[0] * brightness )
            imageData.data[offset++] = Math.round( baseColor[1] * brightness )
            imageData.data[offset++] = Math.round( baseColor[2] * brightness )
            imageData.data[offset++] = 255

            if( includePixelMetrics ){
                magnitudeMatrix[row][col] = normalizedMagnitude
            }
        }
    }

    context.putImageData( imageData, 0, 0 )

    const extraPayload = includePixelMetrics ? { magnitudeMatrix } : {}
    return buildCanvasImagePayload( canvas, width, height, extraPayload, options )
}

function resolveRgbChannels( componentScores, requestedChannels ){

    const available = componentScores.map(( entry ) => entry.componentIndex )
    const availableSet = new Set( available )

    return {
        r: resolveSingleRgbChannel( requestedChannels?.r, 1, available, availableSet, 0 ),
        g: resolveSingleRgbChannel( requestedChannels?.g, 2, available, availableSet, 1 ),
        b: resolveSingleRgbChannel( requestedChannels?.b, 3, available, availableSet, 2 )
    }
}

function normalizedPcaRgbChannels( componentScores ){

    if( pcaRgbNormalizedChannelsCache.has( componentScores ) ){
        return pcaRgbNormalizedChannelsCache.get( componentScores )
    }

    const width = componentScores[0].matrix[0].length
    const height = componentScores[0].matrix.length
    const matrixByComponent = new Map()
    for( const entry of componentScores ){
        matrixByComponent.set( entry.componentIndex, entry.matrix )
    }

    const cached = {
        width,
        height,
        matrixByComponent,
        channels: new Map()
    }
    pcaRgbNormalizedChannelsCache.set( componentScores, cached )

    return cached
}

function normalizedPcaRgbChannel( channelContext, componentIndex ){

    if( channelContext === null || typeof channelContext !== "object" ){
        return null
    }

    if( channelContext.channels.has( componentIndex ) ){
        return channelContext.channels.get( componentIndex )
    }

    const matrix = channelContext.matrixByComponent.get( componentIndex )
    if( Array.isArray( matrix ) === false ){
        return null
    }

    const width = channelContext.width
    const height = channelContext.height
    const totalPixels = width * height
    const normalized = new Uint8Array( totalPixels )
    const scale = buildRobustScale( matrix, 0.02, 0.98, robustScaleCache )

    var pixelIndex = 0
    for( var row = 0; row < height; row++ ){
        for( var col = 0; col < width; col++ ){
            normalized[pixelIndex] = Math.round( 255 * normalizeByScale( matrix[row][col], scale ))
            pixelIndex += 1
        }
    }

    channelContext.channels.set( componentIndex, normalized )
    return normalized
}

function resolveSingleRgbChannel( requested, preferredDefault, available, availableSet, fallbackOffset ){

    const requestedIndex = Number.parseInt( requested, 10 )
    if( Number.isInteger( requestedIndex ) && availableSet.has( requestedIndex ) ){
        return requestedIndex
    }

    if( availableSet.has( preferredDefault ) ){
        return preferredDefault
    }

    const fallbackIndex = Math.max( 0, Math.min( fallbackOffset, available.length - 1 ))
    return available[fallbackIndex]
}

function buildPcaRgbImage( componentScores, options = {} ){

    const channelContext = normalizedPcaRgbChannels( componentScores )
    const width = channelContext.width
    const height = channelContext.height

    if( typeof document === "undefined" ){
        throw new Error( "PCA RGB rendering requires a browser environment." )
    }

    const selectedChannels = resolveRgbChannels( componentScores, options.channels )
    const totalPixels = width * height
    const zeroChannel = new Uint8Array( totalPixels )
    const redChannel = normalizedPcaRgbChannel( channelContext, selectedChannels.r ) ?? zeroChannel
    const greenChannel = normalizedPcaRgbChannel( channelContext, selectedChannels.g ) ?? zeroChannel
    const blueChannel = normalizedPcaRgbChannel( channelContext, selectedChannels.b ) ?? zeroChannel

    const canvas = document.createElement( "canvas" )
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext( "2d" )
    if( context === null ){
        throw new Error( "Unable to create canvas context for PCA RGB rendering." )
    }

    const imageData = context.createImageData( width, height )
    const includePixelMetrics = options?.includePixelMetrics === true
    var magnitudeMatrix = includePixelMetrics
        ? Array.from({ length: height }, () => Array( width ).fill( 0 ))
        : null

    var offset = 0
    var pixelIndex = 0

    if( includePixelMetrics ){
        for( var row = 0; row < height; row++ ){
            for( var col = 0; col < width; col++ ){

                const red = redChannel[pixelIndex]
                const green = greenChannel[pixelIndex]
                const blue = blueChannel[pixelIndex]

                imageData.data[offset++] = red
                imageData.data[offset++] = green
                imageData.data[offset++] = blue
                imageData.data[offset++] = 255

                magnitudeMatrix[row][col] = ( red + green + blue ) / ( 3 * 255 )
                pixelIndex += 1
            }
        }
    } else {
        for( ; pixelIndex < totalPixels; pixelIndex++ ){
            imageData.data[offset++] = redChannel[pixelIndex]
            imageData.data[offset++] = greenChannel[pixelIndex]
            imageData.data[offset++] = blueChannel[pixelIndex]
            imageData.data[offset++] = 255
        }
    }

    context.putImageData( imageData, 0, 0 )

    const extraPayload = includePixelMetrics ? { magnitudeMatrix } : {}
    return buildCanvasImagePayload( canvas, width, height, extraPayload, options )
}

function clampZBlendWindowValue( value, fallback, maximum = Infinity ){

    const numeric = Number( value )
    if( Number.isFinite( numeric ) === false ){
        return fallback
    }

    const safeMaximum = Number.isFinite( Number( maximum ) ) && Number( maximum ) > 0
        ? Number( maximum )
        : Infinity

    return Math.max( 0, Math.min( safeMaximum, numeric ) )
}

function resolveZBlendIntensityMaximum( value, matrix ){

    const numeric = Number( value )
    if( Number.isFinite( numeric ) && numeric > 0 ){
        return numeric
    }

    const range = matrixFiniteRange( matrix )
    const maximum = Number( range?.maximum )
    if( Number.isFinite( maximum ) && maximum > 0 ){
        return maximum
    }

    return 1
}

function zBlendTextureCacheKey( intensityMaximum ){

    const maximum = Number( intensityMaximum )
    if( Number.isFinite( maximum ) === false || maximum <= 0 ){
        return "1.000000"
    }

    return maximum.toFixed( 6 )
}

function buildZBlendChannelTexture( matrix, intensityMaximum ){

    const normalizedMatrix = normalizeMip( matrix )
    const cacheKey = zBlendTextureCacheKey( intensityMaximum )
    let cachedTextures = zBlendIntensityTextureCache.get( normalizedMatrix ) ?? null

    if( cachedTextures !== null && cachedTextures.has( cacheKey ) ){
        return cachedTextures.get( cacheKey )
    }

    const height = normalizedMatrix.length
    const width = normalizedMatrix[0].length
    const safeMaximum = resolveZBlendIntensityMaximum( intensityMaximum, normalizedMatrix )

    if( typeof document === "undefined" ){
        throw new Error( "Z-blend channel textures require a browser environment." )
    }

    const canvas = document.createElement( "canvas" )
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext( "2d" )
    if( context === null ){
        throw new Error( "Unable to create canvas context for z-blend texture rendering." )
    }

    const imageData = context.createImageData( width, height )
    let offset = 0

    for( let row = 0; row < height; row++ ){
        for( let col = 0; col < width; col++ ){
            const rawValue = Math.max( 0, Number( normalizedMatrix[row][col] ) || 0 )
            const normalizedValue = clampUnit( rawValue / safeMaximum )
            const byteValue = Math.max( 0, Math.min( 255, Math.round( normalizedValue * 255 )))

            imageData.data[offset++] = byteValue
            imageData.data[offset++] = byteValue
            imageData.data[offset++] = byteValue
            imageData.data[offset++] = 255
        }
    }

    context.putImageData( imageData, 0, 0 )

    const texturePayload = {
        kind: "z-blend-channel-texture",
        canvas,
        width,
        height,
        intensityMaximum: safeMaximum
    }

    if( cachedTextures === null ){
        cachedTextures = new Map()
        zBlendIntensityTextureCache.set( normalizedMatrix, cachedTextures )
    }

    cachedTextures.set( cacheKey, texturePayload )
    return texturePayload
}

function normalizeZBlendContrastLimit( value, intensityMaximum ){

    const safeMaximum = resolveZBlendIntensityMaximum( intensityMaximum, [ [ intensityMaximum ] ] )
    return clampUnit(( Number( value ) || 0 ) / safeMaximum )
}

function buildZBlendRendererPayload( zBlendSource ){

    const normalizedSource = normalizeZBlendSource( zBlendSource )

    return {
        kind: "z-blend",
        width: normalizedSource.width,
        height: normalizedSource.height,
        channels: normalizedSource.channels.map(( channel ) => {
            const texturePayload = buildZBlendChannelTexture( channel.matrix, channel.intensityMaximum )
            return {
                enabled: channel.enabled !== false,
                color: channel.color,
                contrastLimits: [
                    normalizeZBlendContrastLimit( channel.clampMin, channel.intensityMaximum ),
                    normalizeZBlendContrastLimit( channel.clampMax, channel.intensityMaximum )
                ],
                image: texturePayload.canvas
            }
        })
    }
}

function clampIntensityWindow( normalizedValue, minimum, maximum ){

    const value = Math.max( 0, Number( normalizedValue ) || 0 )
    const low = Math.max( 0, Number( minimum ) || 0 )
    const high = Math.max( low, Number( maximum ) || low )

    if( high <= low ){
        return value >= high ? 1 : 0
    }

    return clampUnit(( value - low ) / ( high - low ))
}

function buildZBlendImage( zBlendSource, options = {} ){

    const normalizedSource = normalizeZBlendSource( zBlendSource )
    const width = normalizedSource.width
    const height = normalizedSource.height

    if( typeof document === "undefined" ){
        throw new Error( "Z-blend rendering requires a browser environment." )
    }

    const canvas = document.createElement( "canvas" )
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext( "2d" )
    if( context === null ){
        throw new Error( "Unable to create canvas context for z-blend rendering." )
    }

    const imageData = context.createImageData( width, height )
    const includePixelMetrics = options?.includePixelMetrics === true
    const magnitudeMatrix = includePixelMetrics
        ? Array.from({ length: height }, () => Array( width ).fill( 0 ))
        : null

    for( let row = 0; row < height; row++ ){
        for( let col = 0; col < width; col++ ){

            let red = 0
            let green = 0
            let blue = 0

            for( let channelIndex = 0; channelIndex < normalizedSource.channels.length; channelIndex++ ){
                const channel = normalizedSource.channels[channelIndex]
                if( channel.enabled === false ) continue
                const rawValue = Math.max( 0, Number( channel.matrix[row][col] ) || 0 )
                const clampedValue = clampIntensityWindow( rawValue, channel.clampMin, channel.clampMax )

                if( clampedValue <= 0 ) continue

                red += channel.color[0] * clampedValue
                green += channel.color[1] * clampedValue
                blue += channel.color[2] * clampedValue
            }

            const pixelOffset = ( row * width + col ) * 4
            imageData.data[pixelOffset] = Math.max( 0, Math.min( 255, Math.round( red )))
            imageData.data[pixelOffset + 1] = Math.max( 0, Math.min( 255, Math.round( green )))
            imageData.data[pixelOffset + 2] = Math.max( 0, Math.min( 255, Math.round( blue )))
            imageData.data[pixelOffset + 3] = 255

            if( includePixelMetrics ){
                magnitudeMatrix[row][col] = clampUnit( Math.max( red, green, blue ) / 255 )
            }
        }
    }

    context.putImageData( imageData, 0, 0 )

    const extraPayload = includePixelMetrics ? { magnitudeMatrix } : {}
    return buildCanvasImagePayload( canvas, width, height, extraPayload, options )
}

export {
    buildPcaClassificationImage,
    buildPcaMipImage,
    buildPcaRgbImage,
    buildRgbMipImage,
    buildScalarHeatmapPayload,
    buildUmapImage,
    buildZBlendImage,
    buildZBlendRendererPayload
}
