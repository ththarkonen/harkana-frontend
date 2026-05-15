const EXTERNAL_HEATMAP_PAYLOAD_CACHE_LIMIT = 40
const heatmapPayloadObjectIDs = new WeakMap()
let nextHeatmapPayloadObjectID = 1

function normalizeExternalHeatmapPayloadCache( graphContainer ){

    if( !graphContainer ) return null

    if( graphContainer.__harkanaExternalHeatmapPayloadCache instanceof Map ){
        return graphContainer.__harkanaExternalHeatmapPayloadCache
    }

    const cache = new Map()
    graphContainer.__harkanaExternalHeatmapPayloadCache = cache
    return cache
}

function heatmapPayloadObjectKey( value ){

    if( value !== null && typeof value === "object" ){

        if( heatmapPayloadObjectIDs.has( value ) === false ){
            heatmapPayloadObjectIDs.set( value, nextHeatmapPayloadObjectID )
            nextHeatmapPayloadObjectID += 1
        }

        return "object:" + heatmapPayloadObjectIDs.get( value )
    }

    return "primitive:" + String( value )
}

function stringifyHeatmapPayloadKeyPart( value ){

    if( Array.isArray( value ) ){
        return "[" + value.map(( entry ) => stringifyHeatmapPayloadKeyPart( entry )).join( "," ) + "]"
    }

    if( value !== null && typeof value === "object" ){
        const keys = Object.keys( value ).sort()
        return "{" + keys.map(( key ) => key + ":" + stringifyHeatmapPayloadKeyPart( value[key] )).join( "," ) + "}"
    }

    return String( value )
}

function buildExternalHeatmapPayloadCacheKey( kind, source, options = {} ){

    const entries = Object.entries( options )
        .filter(([, value ]) => value !== undefined )
        .sort(([ left ], [ right ]) => left.localeCompare( right ))
        .map(([ key, value ]) => key + "=" + stringifyHeatmapPayloadKeyPart( value ))

    return kind + "|" + heatmapPayloadSourceKey( kind, source ) + "|" + entries.join( "|" )
}

function heatmapPayloadSourceKey( kind, source ){

    if( kind === "umap" || kind === "pca-classification" || kind === "pca-rgb" ){
        return structuredHeatmapPayloadObjectKey( source )
    }

    return heatmapPayloadObjectKey( source )
}

function structuredHeatmapPayloadObjectKey( value ){

    if( value === null || typeof value !== "object" ){
        return heatmapPayloadObjectKey( value )
    }

    if( Array.isArray( value ) ){
        if( value.length > 0 &&
            Array.isArray( value[0] ) &&
            value[0].length > 0 &&
            Array.isArray( value[0][0] ) ){
            return "array:[" + value.map(( entry, index ) => {
                return index + ":" + heatmapPayloadObjectKey( entry )
            }).join( "|" ) + "]"
        }

        return heatmapPayloadObjectKey( value )
    }

    const keys = Object.keys( value ).sort()
    return "object:{" + keys.map(( key ) => {
        return key + ":" + heatmapPayloadObjectKey( value[key] )
    }).join( "|" ) + "}"
}

function getCachedExternalHeatmapPayload( graphContainer, cacheKey ){

    if( typeof cacheKey !== "string" || cacheKey.length === 0 ) return null

    const cache = normalizeExternalHeatmapPayloadCache( graphContainer )
    if( cache === null ) return null

    const payload = cache.get( cacheKey ) ?? null
    if( payload !== null ){
        cache.delete( cacheKey )
        cache.set( cacheKey, payload )
    }

    return payload
}

function setCachedExternalHeatmapPayload( graphContainer, cacheKey, payload ){

    if( typeof cacheKey !== "string" || cacheKey.length === 0 ) return
    if( payload === null || typeof payload !== "object" ) return

    const cache = normalizeExternalHeatmapPayloadCache( graphContainer )
    if( cache === null ) return

    if( cache.has( cacheKey ) ){
        cache.delete( cacheKey )
    }

    cache.set( cacheKey, payload )

    while( cache.size > EXTERNAL_HEATMAP_PAYLOAD_CACHE_LIMIT ){
        const oldestKey = cache.keys().next().value
        cache.delete( oldestKey )
    }
}

export {
    buildExternalHeatmapPayloadCacheKey,
    getCachedExternalHeatmapPayload,
    heatmapPayloadObjectKey,
    setCachedExternalHeatmapPayload
}
