import {
    DEFAULT_Z_BLEND_PALETTE_COLOR_STRINGS,
    clampUnit,
    matrixFiniteRange,
    parseColorValue
} from "../shared.js"
import { heatmapPayloadObjectKey } from "./cache.js"

const normalizedMipCache = new WeakMap()
const normalizedPcaScoresCache = new WeakMap()

function normalizeMip( mip ){

    if( mip !== null &&
        typeof mip === "object" &&
        normalizedMipCache.has( mip ) ){
        return normalizedMipCache.get( mip )
    }

    if( Array.isArray( mip ) === false || mip.length === 0 ){
        throw new Error( "MIP must be a non-empty 2D array." )
    }

    const width = Array.isArray( mip[0] ) ? mip[0].length : 0
    if( width === 0 ) throw new Error( "MIP must be a non-empty 2D array." )

    var matrix = []
    for( const row of mip ){

        if( Array.isArray( row ) === false || row.length !== width ){
            throw new Error( "MIP must be a rectangular 2D array." )
        }

        matrix.push( row.map(( value ) => Number.isFinite( Number( value )) ? Number( value ) : null ))
    }

    if( mip !== null && typeof mip === "object" ){
        normalizedMipCache.set( mip, matrix )
    }

    return matrix
}

function normalizeRgbMip( mipRgb ){

    if( Array.isArray( mipRgb ) === false || mipRgb.length === 0 ){
        throw new Error( "RGB MIP must be a non-empty 3D array." )
    }

    const width = Array.isArray( mipRgb[0] ) ? mipRgb[0].length : 0
    if( width === 0 ){
        throw new Error( "RGB MIP must be a non-empty 3D array." )
    }

    var matrix = []
    var maxChannelValue = 0

    for( const row of mipRgb ){

        if( Array.isArray( row ) === false || row.length !== width ){
            throw new Error( "RGB MIP must be a rectangular 3D array." )
        }

        var normalizedRow = []
        for( const pixel of row ){

            if( Array.isArray( pixel ) === false || pixel.length < 3 ){
                throw new Error( "RGB MIP pixels must contain at least three channels." )
            }

            const red = Number( pixel[0] )
            const green = Number( pixel[1] )
            const blue = Number( pixel[2] )

            const normalizedPixel = [
                Number.isFinite( red ) ? red : 0,
                Number.isFinite( green ) ? green : 0,
                Number.isFinite( blue ) ? blue : 0
            ]

            maxChannelValue = Math.max( maxChannelValue,
                                        normalizedPixel[0],
                                        normalizedPixel[1],
                                        normalizedPixel[2] )

            normalizedRow.push( normalizedPixel )
        }

        matrix.push( normalizedRow )
    }

    const scaleToByte = maxChannelValue <= 1 ? 255 : 1

    return matrix.map(( row ) => {
        return row.map(( pixel ) => {
            return pixel.map(( value ) => {
                return Math.max( 0, Math.min( 255, Math.round( value * scaleToByte )))
            })
        })
    })
}

function normalizeUmapChannels( umapChannels ){

    if( umapChannels === null || typeof umapChannels !== "object" ){
        throw new Error( "UMAP channels must be an object with r, g, and b matrices." )
    }

    const redMatrix = normalizeMip( umapChannels.r )
    const greenMatrix = normalizeMip( umapChannels.g )
    const blueMatrix = normalizeMip( umapChannels.b )

    const width = redMatrix[0].length
    const height = redMatrix.length

    if( greenMatrix.length !== height || blueMatrix.length !== height ){
        throw new Error( "All UMAP channel matrices must have the same dimensions." )
    }

    if( greenMatrix[0].length !== width || blueMatrix[0].length !== width ){
        throw new Error( "All UMAP channel matrices must have the same dimensions." )
    }

    return {
        r: redMatrix,
        g: greenMatrix,
        b: blueMatrix
    }
}

function normalizePcaMip( pcaMip ){

    if( Array.isArray( pcaMip ) === false || pcaMip.length === 0 ){
        throw new Error( "PCA MIP must be a non-empty 2D array." )
    }

    const width = Array.isArray( pcaMip[0] ) ? pcaMip[0].length : 0
    if( width === 0 ){
        throw new Error( "PCA MIP must be a non-empty 2D array." )
    }

    var matrix = []

    for( const row of pcaMip ){

        if( Array.isArray( row ) === false || row.length !== width ){
            throw new Error( "PCA MIP must be a rectangular 2D array." )
        }

        matrix.push( row.map(( value ) => {
            const numeric = Number( value )
            if( Number.isFinite( numeric ) === false ) return null

            const componentIndex = Math.floor( numeric )
            if( Number.isInteger( componentIndex ) === false ) return null
            if( componentIndex < 0 || componentIndex > 9 ) return null

            const brightness = clampUnit( numeric - componentIndex )

            return {
                componentIndex: componentIndex + 1,
                brightness
            }
        }) )
    }

    return matrix
}

function normalizePcaScores( scoresByComponent ){

    if( scoresByComponent !== null &&
        typeof scoresByComponent === "object" &&
        normalizedPcaScoresCache.has( scoresByComponent ) ){
        return normalizedPcaScoresCache.get( scoresByComponent )
    }

    var entries = []

    if( Array.isArray( scoresByComponent ) ){
        entries = scoresByComponent.map(( matrix, index ) => {
            return { componentIndex: index + 1, matrix: normalizeMip( matrix ) }
        })
    } else if( scoresByComponent !== null && typeof scoresByComponent === "object" ){
        entries = Object.entries( scoresByComponent ).map(([ key, matrix ]) => {
            return { componentIndex: parsePcaComponentKey( key ), matrix: normalizeMip( matrix ) }
        })
    } else {
        throw new Error( "PCA scores must be an object or array of 2D arrays." )
    }

    entries = entries.filter(( entry ) => Number.isInteger( entry.componentIndex ))

    if( entries.length === 0 ){
        throw new Error( "At least one PCA score matrix is required." )
    }

    entries.sort(( left, right ) => left.componentIndex - right.componentIndex )

    const referenceWidth = entries[0].matrix[0].length
    const referenceHeight = entries[0].matrix.length

    for( const entry of entries ){
        if( entry.matrix.length !== referenceHeight || entry.matrix[0].length !== referenceWidth ){
            throw new Error( "All PCA score matrices must have the same dimensions." )
        }
    }

    if( scoresByComponent !== null && typeof scoresByComponent === "object" ){
        normalizedPcaScoresCache.set( scoresByComponent, entries )
    }

    return entries
}

function resolveZBlendPalette( palette ){

    const source = Array.isArray( palette ) && palette.length > 0
        ? palette
        : DEFAULT_Z_BLEND_PALETTE_COLOR_STRINGS

    const resolvedPalette = source
        .map(( color ) => parseColorValue( color ))
        .filter(( color ) => color !== null )

    if( resolvedPalette.length > 0 ){
        return resolvedPalette
    }

    return DEFAULT_Z_BLEND_PALETTE_COLOR_STRINGS
        .map(( color ) => parseColorValue( color ))
        .filter(( color ) => color !== null )
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

function normalizeZBlendSource( zBlendSource ){

    if( zBlendSource === null || typeof zBlendSource !== "object" ){
        throw new Error( "Z-blend source must be an object." )
    }

    const channels = Array.isArray( zBlendSource.channels ) ? zBlendSource.channels : []
    if( channels.length === 0 ){
        throw new Error( "Z-blend source must include at least one channel." )
    }

    const palette = resolveZBlendPalette( zBlendSource.palette )
    var normalizedChannels = []

    for( let index = 0; index < channels.length; index++ ){
        const channel = channels[index] ?? {}
        const matrix = normalizeMip( channel.matrix )
        const color = parseColorValue( channel.color ) ?? palette[index % palette.length]
        const intensityMaximum = resolveZBlendIntensityMaximum( channel.intensityMaximum, matrix )
        const clampMin = clampZBlendWindowValue( channel.clampMin, 0, intensityMaximum )
        const clampMax = clampZBlendWindowValue( channel.clampMax, intensityMaximum, intensityMaximum )

        normalizedChannels.push({
            enabled: channel.enabled !== false,
            requestedZ: Number.isFinite( Number( channel.requestedZ )) ? Number( channel.requestedZ ) : index,
            resolvedLayerIndex: Number.isInteger( Number( channel.resolvedLayerIndex ) )
                ? Number( channel.resolvedLayerIndex )
                : index,
            resolvedZ: Number.isFinite( Number( channel.resolvedZ ))
                ? Number( channel.resolvedZ )
                : index,
            clampMin: Math.min( clampMin, clampMax ),
            clampMax: Math.max( clampMin, clampMax ),
            intensityMaximum,
            color,
            matrix
        })
    }

    const width = normalizedChannels[0].matrix[0].length
    const height = normalizedChannels[0].matrix.length

    for( const channel of normalizedChannels ){
        if( channel.matrix.length !== height || channel.matrix[0].length !== width ){
            throw new Error( "All z-blend channel matrices must have the same dimensions." )
        }
    }

    return {
        kind: "z-blend-source",
        palette,
        channels: normalizedChannels,
        width,
        height
    }
}

function zBlendPayloadSignature( zBlendSource ){

    const normalizedSource = normalizeZBlendSource( zBlendSource )

    return normalizedSource.channels.map(( channel ) => {
        return [
            "req=" + channel.requestedZ,
            "layer=" + channel.resolvedLayerIndex,
            "z=" + channel.resolvedZ,
            "enabled=" + ( channel.enabled === false ? "0" : "1" ),
            "max=" + channel.intensityMaximum.toFixed( 6 ),
            "clamp=" + channel.clampMin.toFixed( 4 ) + ":" + channel.clampMax.toFixed( 4 ),
            "color=" + channel.color.join( "," ),
            "matrix=" + heatmapPayloadObjectKey( channel.matrix )
        ].join( "," )
    }).join( "|" )
}

function parsePcaComponentKey( key ){

    if( typeof key === "number" && Number.isInteger( key ) ) return key
    if( typeof key !== "string" ) return null

    const numeric = Number.parseInt( key, 10 )
    if( Number.isInteger( numeric ) ) return numeric

    const match = key.match(/^pc(\d+)$/i)
    if( match === null ) return null

    const parsed = Number.parseInt( match[1], 10 )
    if( Number.isInteger( parsed ) === false ) return null

    return parsed
}

export {
    normalizeMip,
    normalizePcaMip,
    normalizePcaScores,
    normalizeRgbMip,
    normalizeUmapChannels,
    normalizeZBlendSource,
    zBlendPayloadSignature
}
