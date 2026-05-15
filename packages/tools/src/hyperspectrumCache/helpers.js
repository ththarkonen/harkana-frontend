const DEFAULT_PCA_MAX_COMPONENT = 10

function cacheKey( projectID, mode ){
    return projectID + "::" + mode
}

function modeFromCacheKey( projectID, key ){

    if( typeof key !== "string" ) return ""

    const prefix = projectID + "::"
    if( key.startsWith( prefix ) === false ){
        return ""
    }

    return key.slice( prefix.length )
}

function layerIndexFromMode( mode ){

    if( typeof mode !== "string" ) return null
    if( mode.startsWith( "layers/" ) === false ) return null

    const index = Number.parseInt( mode.replace( "layers/", "" ), 10 )
    if( Number.isInteger( index ) === false ) return null
    if( index < 0 ) return null

    return index
}

function pcaIndexFromMode( mode ){

    if( typeof mode !== "string" ) return null

    const match = mode.match(/^pca\/scores\/pc(\d{2})$/)
    if( match === null ) return null

    const index = Number.parseInt( match[1], 10 )
    if( Number.isInteger( index ) === false ) return null
    if( index < 1 || index > DEFAULT_PCA_MAX_COMPONENT ) return null

    return index
}

function normalizeLayerIndex( value ){

    const index = Number.parseInt( value, 10 )
    if( Number.isInteger( index ) === false || index < 0 ){
        throw new Error( "Layer index must be a non-negative integer." )
    }

    return index
}

function normalizePcaIndex( value ){

    const index = Number.parseInt( value, 10 )
    if( Number.isInteger( index ) === false ){
        throw new Error( "PCA component index must be an integer from 1 to 10." )
    }

    if( index < 1 || index > DEFAULT_PCA_MAX_COMPONENT ){
        throw new Error( "PCA component index must be an integer from 1 to 10." )
    }

    return index
}

function normalizeDecompositionFamily( value ){

    if( value === "rpca" ){
        return "rpca"
    }

    return "pca"
}

function pcaModeFromIndex( componentIndex ){

    return decompositionScoreModeFromIndex( "pca", componentIndex )
}

function pcaMipModeFromCount( componentCount ){

    return decompositionMipModeFromCount( "pca", componentCount )
}

function rpcaModeFromIndex( componentIndex ){

    return decompositionScoreModeFromIndex( "rpca", componentIndex )
}

function rpcaMipModeFromCount( componentCount ){

    return decompositionMipModeFromCount( "rpca", componentCount )
}

function decompositionScoreModeFromIndex( family, componentIndex ){

    const normalizedFamily = normalizeDecompositionFamily( family )
    const normalized = normalizePcaIndex( componentIndex )
    const suffix = String( normalized ).padStart( 2, "0" )
    return normalizedFamily + "/scores/pc" + suffix
}

function decompositionMipModeFromCount( family, componentCount ){

    const normalizedFamily = normalizeDecompositionFamily( family )
    const normalized = normalizePcaIndex( componentCount )
    const suffix = String( normalized ).padStart( 2, "0" )
    return normalizedFamily + "/pca_mip/pc" + suffix
}

function normalizePositiveInteger( value ){

    const number = Number( value )
    if( Number.isInteger( number ) === false ) return null
    if( number <= 0 ) return null

    return number
}

function normalizeOptionalNonNegativeInteger( value ){

    const number = Number( value )
    if( Number.isInteger( number ) === false ) return null
    if( number < 0 ) return null

    return number
}

function clampLayerIndexToMaximum( layerIndex, maxLayerIndex ){

    const maximum = normalizeOptionalNonNegativeInteger( maxLayerIndex )
    if( maximum === null ){
        return layerIndex
    }

    return Math.max( 0, Math.min( maximum, layerIndex ))
}

function resolveLayerWindowBounds( centerLayer, radius = 1, maxLayerIndex = null ){

    const center = Math.max( 0, normalizeLayerIndex( centerLayer ))
    const safeRadius = normalizePositiveInteger( radius ) ?? 1
    const maximum = normalizeOptionalNonNegativeInteger( maxLayerIndex )

    let start = Math.max( 0, center - safeRadius )
    let end = center + safeRadius

    if( maximum === null ){
        return { start, end }
    }

    start = Math.min( start, maximum )
    end = Math.min( end, maximum )

    const targetCount = Math.min( maximum + 1, ( safeRadius * 2 ) + 1 )

    while(( end - start + 1 ) < targetCount ){
        if( start > 0 ){
            start -= 1
            continue
        }

        if( end < maximum ){
            end += 1
            continue
        }

        break
    }

    return { start, end }
}

function normalizeModePrefixes( prefixes ){

    if( Array.isArray( prefixes ) === false ){
        return []
    }

    const normalized = prefixes
        .map(( value ) => typeof value === "string" ? value.trim() : "" )
        .filter(( value ) => value.length > 0 )

    return [ ...new Set( normalized ) ]
}

function matchesModePrefixes( mode, prefixes ){

    if( typeof mode !== "string" || mode.length === 0 ){
        return false
    }

    for( const prefix of prefixes ){
        if( mode.startsWith( prefix ) ){
            return true
        }
    }

    return false
}

function readProjectID( project ){

    const id = project?.id

    if( typeof id !== "string" || id.length === 0 ){
        throw new Error( "Project must have a valid id." )
    }

    return id
}

function estimateValueSizeBytes( value ){

    const visited = new Set()
    return estimateRecursive( value, visited )
}

function estimateRecursive( value, visited ){

    if( value === null || value === undefined ) return 4

    const type = typeof value

    if( type === "number" ) return 8
    if( type === "boolean" ) return 4
    if( type === "string" ) return value.length * 2
    if( type !== "object" ) return 16

    if( visited.has( value ) ) return 0
    visited.add( value )

    if( Array.isArray( value ) ){

        if( looksLikeNumericMatrix( value ) ){
            return estimateNumericMatrixBytes( value )
        }

        if( looksLikeNumericVector( value ) ){
            return 16 + ( value.length * 8 )
        }

        if( value.length > 32 ){
            const sampleCount = Math.min( value.length, 8 )
            const step = Math.max( 1, Math.floor( value.length / sampleCount ))
            let sampledSize = 0
            let sampledItems = 0

            for( let index = 0; index < value.length && sampledItems < sampleCount; index += step ){
                sampledSize += estimateRecursive( value[ index ], visited )
                sampledItems += 1
            }

            const averageSize = sampledItems > 0 ? sampledSize / sampledItems : 16
            return 16 + Math.round( averageSize * value.length )
        }

        var totalArray = 16
        for( const item of value ){
            totalArray += estimateRecursive( item, visited )
        }

        return totalArray
    }

    var totalObject = 32

    for( const [ key, nestedValue ] of Object.entries( value )){
        totalObject += key.length * 2
        totalObject += estimateRecursive( nestedValue, visited )
    }

    return totalObject
}

function shouldPersistLoadedValue( priority, mode ){

    if( priority === "high" ){
        return true
    }

    return mode === "xyz" || mode === "roi/frontend"
}

function looksLikeNumericVector( value ){

    if( Array.isArray( value ) === false || value.length === 0 ){
        return false
    }

    const sampleCount = Math.min( value.length, 8 )
    const step = Math.max( 1, Math.floor( value.length / sampleCount ))

    for( let index = 0, sampled = 0; index < value.length && sampled < sampleCount; index += step, sampled += 1 ){
        const entry = value[ index ]
        if( Array.isArray( entry ) ){
            return false
        }
        if( entry !== null && Number.isFinite( Number( entry )) === false ){
            return false
        }
    }

    return true
}

function looksLikeNumericMatrix( value ){

    if( Array.isArray( value ) === false || value.length === 0 ){
        return false
    }

    const sampleCount = Math.min( value.length, 8 )
    const step = Math.max( 1, Math.floor( value.length / sampleCount ))

    for( let index = 0, sampled = 0; index < value.length && sampled < sampleCount; index += step, sampled += 1 ){
        const row = value[ index ]
        if( Array.isArray( row ) === false ){
            return false
        }

        if( row.length === 0 ){
            continue
        }

        const columnSampleCount = Math.min( row.length, 8 )
        const columnStep = Math.max( 1, Math.floor( row.length / columnSampleCount ))

        for( let columnIndex = 0, sampledColumns = 0; columnIndex < row.length && sampledColumns < columnSampleCount; columnIndex += columnStep, sampledColumns += 1 ){
            const entry = row[ columnIndex ]
            if( entry !== null && Number.isFinite( Number( entry )) === false ){
                return false
            }
        }
    }

    return true
}

function estimateNumericMatrixBytes( matrix ){

    const height = matrix.length
    if( height === 0 ){
        return 16
    }

    const sampleCount = Math.min( height, 8 )
    const step = Math.max( 1, Math.floor( height / sampleCount ))
    let sampledWidthTotal = 0
    let sampledRows = 0

    for( let index = 0; index < height && sampledRows < sampleCount; index += step ){
        const row = matrix[ index ]
        if( Array.isArray( row ) === false ){
            continue
        }
        sampledWidthTotal += row.length
        sampledRows += 1
    }

    const averageWidth = sampledRows > 0
        ? ( sampledWidthTotal / sampledRows )
        : 0

    return 16 + ( height * 16 ) + Math.round( height * averageWidth * 8 )
}

function createDeferred(){

    var resolve
    var reject

    const promise = new Promise(( resolver, rejecter ) => {
        resolve = resolver
        reject = rejecter
    })

    return {
        promise,
        resolve,
        reject
    }
}


export {
    cacheKey,
    clampLayerIndexToMaximum,
    createDeferred,
    decompositionMipModeFromCount,
    decompositionScoreModeFromIndex,
    estimateValueSizeBytes,
    layerIndexFromMode,
    matchesModePrefixes,
    modeFromCacheKey,
    normalizeDecompositionFamily,
    normalizeLayerIndex,
    normalizeModePrefixes,
    normalizeOptionalNonNegativeInteger,
    normalizePcaIndex,
    normalizePositiveInteger,
    pcaIndexFromMode,
    pcaMipModeFromCount,
    pcaModeFromIndex,
    readProjectID,
    resolveLayerWindowBounds,
    rpcaMipModeFromCount,
    rpcaModeFromIndex,
    shouldPersistLoadedValue
}
