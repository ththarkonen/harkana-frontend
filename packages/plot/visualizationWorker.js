const DEFAULT_PCA_COMPONENT_COLORS = [
    [ 0, 114, 178 ],
    [ 230, 159, 0 ],
    [ 0, 158, 115 ],
    [ 213, 94, 0 ],
    [ 204, 121, 167 ],
    [ 86, 180, 233 ],
    [ 240, 228, 66 ],
    [ 140, 86, 75 ],
    [ 247, 129, 191 ],
    [ 127, 127, 127 ]
]
const DEFAULT_UMAP_CHANNEL_COLORS = {
    r: [ 255, 0, 0 ],
    g: [ 0, 255, 0 ],
    b: [ 0, 0, 255 ]
}

self.onmessage = ( event ) => {

    const { jobId, kind, payload } = event.data ?? {}
    if( typeof jobId !== "string" || jobId.length === 0 ){
        return
    }

    try{
        const result = buildPayload( kind, payload )
        const transferables = []

        if( result?.rgba instanceof Uint8ClampedArray ){
            transferables.push( result.rgba.buffer )
        }

        self.postMessage({
            jobId,
            kind,
            payload: result
        }, transferables )
    } catch( error ){
        self.postMessage({
            jobId,
            error: error instanceof Error ? error.message : String( error )
        })
    }
}

function buildPayload( kind, payload ){

    switch( kind ){
    case "rgb-mip":
        return buildRgbMipRgba( payload?.rgbMatrix )
    case "umap":
        return buildUmapRgba( payload?.umapChannels, payload?.channelColors )
    case "pca-mip":
        return buildPcaMipRgba( payload?.pcaMip, payload?.componentColors, payload?.useEncodedBrightness !== false )
    case "pca-classification":
        return buildPcaClassificationRgba( payload?.scoresByComponent, payload?.componentColors )
    case "pca-rgb":
        return buildPcaRgbRgba( payload?.scoresByComponent, payload?.channels, payload?.componentColors )
    default:
        throw new Error( "Unsupported visualization worker job: " + String( kind ) )
    }
}

function buildRgbMipRgba( rgbMatrix ){

    const matrix = normalizeRgbMip( rgbMatrix )
    const height = matrix.length
    const width = matrix[0].length
    const rgba = new Uint8ClampedArray( width * height * 4 )
    let offset = 0

    for( let row = 0; row < height; row++ ){
        for( let col = 0; col < width; col++ ){
            const pixel = matrix[row][col]
            rgba[offset++] = clampByte( pixel[0] )
            rgba[offset++] = clampByte( pixel[1] )
            rgba[offset++] = clampByte( pixel[2] )
            rgba[offset++] = 255
        }
    }

    return { width, height, rgba }
}

function buildUmapRgba( umapChannels, channelColors ){

    const channels = normalizeUmapChannels( umapChannels )
    const colors = resolveUmapChannelColors( channelColors )
    const height = channels.r.length
    const width = channels.r[0].length
    const rgba = new Uint8ClampedArray( width * height * 4 )
    let offset = 0

    for( let row = 0; row < height; row++ ){
        for( let col = 0; col < width; col++ ){
            const redWeight = clampUnit( channels.r[row][col] )
            const greenWeight = clampUnit( channels.g[row][col] )
            const blueWeight = clampUnit( channels.b[row][col] )

            rgba[offset++] = clampByte(
                ( redWeight * colors.r[0] ) +
                ( greenWeight * colors.g[0] ) +
                ( blueWeight * colors.b[0] )
            )
            rgba[offset++] = clampByte(
                ( redWeight * colors.r[1] ) +
                ( greenWeight * colors.g[1] ) +
                ( blueWeight * colors.b[1] )
            )
            rgba[offset++] = clampByte(
                ( redWeight * colors.r[2] ) +
                ( greenWeight * colors.g[2] ) +
                ( blueWeight * colors.b[2] )
            )
            rgba[offset++] = 255
        }
    }

    return { width, height, rgba }
}

function buildPcaMipRgba( pcaMip, componentColors, useEncodedBrightness ){

    const matrix = normalizePcaMip( pcaMip )
    const colors = resolveComponentColors( componentColors )
    const height = matrix.length
    const width = matrix[0].length
    const rgba = new Uint8ClampedArray( width * height * 4 )
    let offset = 0

    for( let row = 0; row < height; row++ ){
        for( let col = 0; col < width; col++ ){
            const encodedPixel = matrix[row][col]
            const baseColor = encodedPixel === null ? [ 0, 0, 0 ] : componentColor( encodedPixel.componentIndex, colors )
            const brightness = encodedPixel === null
                ? 0
                : ( useEncodedBrightness ? clampUnit( encodedPixel.brightness ) : 1 )

            rgba[offset++] = clampByte( baseColor[0] * brightness )
            rgba[offset++] = clampByte( baseColor[1] * brightness )
            rgba[offset++] = clampByte( baseColor[2] * brightness )
            rgba[offset++] = 255
        }
    }

    return { width, height, rgba }
}

function buildPcaClassificationRgba( scoresByComponent, componentColors ){

    const componentScores = normalizePcaScores( scoresByComponent )
    const colors = resolveComponentColors( componentColors )
    const width = componentScores[0].matrix[0].length
    const height = componentScores[0].matrix.length
    const rgba = new Uint8ClampedArray( width * height * 4 )
    let maxAbs = 0

    for( const entry of componentScores ){
        for( let row = 0; row < height; row++ ){
            for( let col = 0; col < width; col++ ){
                const value = entry.matrix[row][col]
                if( value === null ) continue
                const absolute = Math.abs( value )
                if( absolute > maxAbs ) maxAbs = absolute
            }
        }
    }

    if( maxAbs <= 0 ) maxAbs = 1

    let offset = 0
    for( let row = 0; row < height; row++ ){
        for( let col = 0; col < width; col++ ){
            let dominantAbs = -1
            let dominantComponent = componentScores[0].componentIndex

            for( const entry of componentScores ){
                const value = entry.matrix[row][col]
                const absolute = value === null ? 0 : Math.abs( value )

                if( absolute > dominantAbs ){
                    dominantAbs = absolute
                    dominantComponent = entry.componentIndex
                }
            }

            if( dominantAbs < 0 ) dominantAbs = 0

            const brightness = Math.sqrt( clampUnit( dominantAbs / maxAbs ))
            const baseColor = componentColor( dominantComponent, colors )

            rgba[offset++] = clampByte( baseColor[0] * brightness )
            rgba[offset++] = clampByte( baseColor[1] * brightness )
            rgba[offset++] = clampByte( baseColor[2] * brightness )
            rgba[offset++] = 255
        }
    }

    return { width, height, rgba }
}

function buildPcaRgbRgba( scoresByComponent, requestedChannels, componentColors ){

    const componentScores = normalizePcaScores( scoresByComponent )
    const channelContext = normalizedPcaRgbChannels( componentScores )
    const selectedChannels = resolveRgbChannels( componentScores, requestedChannels )
    const width = channelContext.width
    const height = channelContext.height
    const totalPixels = width * height
    const zeroChannel = new Uint8Array( totalPixels )
    const redChannel = normalizedPcaRgbChannel( channelContext, selectedChannels.r ) ?? zeroChannel
    const greenChannel = normalizedPcaRgbChannel( channelContext, selectedChannels.g ) ?? zeroChannel
    const blueChannel = normalizedPcaRgbChannel( channelContext, selectedChannels.b ) ?? zeroChannel
    const rgba = new Uint8ClampedArray( totalPixels * 4 )
    let offset = 0

    resolveComponentColors( componentColors )

    for( let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex++ ){
        rgba[offset++] = redChannel[pixelIndex]
        rgba[offset++] = greenChannel[pixelIndex]
        rgba[offset++] = blueChannel[pixelIndex]
        rgba[offset++] = 255
    }

    return { width, height, rgba }
}

function normalizeMip( matrix ){

    if( Array.isArray( matrix ) === false || matrix.length === 0 ){
        throw new Error( "Matrix must be a non-empty 2D array." )
    }

    const width = Array.isArray( matrix[0] ) ? matrix[0].length : 0
    if( width === 0 ){
        throw new Error( "Matrix must be a non-empty 2D array." )
    }

    const normalized = []
    for( const row of matrix ){
        if( Array.isArray( row ) === false || row.length !== width ){
            throw new Error( "Matrix must be rectangular." )
        }

        normalized.push( row.map(( value ) => {
            const numeric = Number( value )
            return Number.isFinite( numeric ) ? numeric : null
        }) )
    }

    return normalized
}

function normalizeRgbMip( rgbMatrix ){

    if( Array.isArray( rgbMatrix ) === false || rgbMatrix.length === 0 ){
        throw new Error( "RGB MIP must be a non-empty 2D array." )
    }

    const width = Array.isArray( rgbMatrix[0] ) ? rgbMatrix[0].length : 0
    if( width === 0 ){
        throw new Error( "RGB MIP must be a non-empty 2D array." )
    }

    return rgbMatrix.map(( row ) => {
        if( Array.isArray( row ) === false || row.length !== width ){
            throw new Error( "RGB MIP must be rectangular." )
        }

        return row.map(( pixel ) => {
            const source = Array.isArray( pixel ) ? pixel : [ 0, 0, 0 ]
            return [
                clampByte( source[0] ),
                clampByte( source[1] ),
                clampByte( source[2] )
            ]
        })
    })
}

function normalizeUmapChannels( umapChannels ){

    if( umapChannels === null || typeof umapChannels !== "object" ){
        throw new Error( "UMAP channels must be an object with r/g/b matrices." )
    }

    const redMatrix = normalizeMip( umapChannels.r )
    const greenMatrix = normalizeMip( umapChannels.g )
    const blueMatrix = normalizeMip( umapChannels.b )
    const width = redMatrix[0].length
    const height = redMatrix.length

    for( const matrix of [ greenMatrix, blueMatrix ] ){
        if( matrix.length !== height || matrix[0].length !== width ){
            throw new Error( "UMAP channels must share dimensions." )
        }
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

    return pcaMip.map(( row ) => {
        if( Array.isArray( row ) === false || row.length !== width ){
            throw new Error( "PCA MIP must be rectangular." )
        }

        return row.map(( value ) => {
            const numeric = Number( value )
            if( Number.isFinite( numeric ) === false ) return null

            const componentIndex = Math.floor( numeric )
            if( Number.isInteger( componentIndex ) === false ) return null
            if( componentIndex < 0 || componentIndex > 9 ) return null

            return {
                componentIndex: componentIndex + 1,
                brightness: clampUnit( numeric - componentIndex )
            }
        })
    })
}

function normalizePcaScores( scoresByComponent ){

    let entries = []

    if( Array.isArray( scoresByComponent ) ){
        entries = scoresByComponent.map(( matrix, index ) => ({
            componentIndex: index + 1,
            matrix: normalizeMip( matrix )
        }) )
    } else if( scoresByComponent !== null && typeof scoresByComponent === "object" ){
        entries = Object.entries( scoresByComponent ).map(([ key, matrix ]) => ({
            componentIndex: parsePcaComponentKey( key ),
            matrix: normalizeMip( matrix )
        }) )
    } else {
        throw new Error( "PCA scores must be an object or array of matrices." )
    }

    entries = entries.filter(( entry ) => Number.isInteger( entry.componentIndex ) )
    if( entries.length === 0 ){
        throw new Error( "At least one PCA score matrix is required." )
    }

    entries.sort(( left, right ) => left.componentIndex - right.componentIndex )

    const height = entries[0].matrix.length
    const width = entries[0].matrix[0].length

    for( const entry of entries ){
        if( entry.matrix.length !== height || entry.matrix[0].length !== width ){
            throw new Error( "All PCA score matrices must share dimensions." )
        }
    }

    return entries
}

function parsePcaComponentKey( key ){

    if( typeof key === "number" && Number.isInteger( key ) ){
        return key
    }

    if( typeof key !== "string" ){
        return null
    }

    const numeric = Number.parseInt( key, 10 )
    if( Number.isInteger( numeric ) ){
        return numeric
    }

    const match = key.match(/^pc(\d+)$/i)
    if( match === null ){
        return null
    }

    const parsed = Number.parseInt( match[1], 10 )
    return Number.isInteger( parsed ) ? parsed : null
}

function resolveComponentColors( componentColors ){

    const source = Array.isArray( componentColors ) && componentColors.length > 0
        ? componentColors
        : DEFAULT_PCA_COMPONENT_COLORS

    const resolved = source
        .map(( color ) => parseColorValue( color ))
        .filter(( color ) => color !== null )

    return resolved.length > 0 ? resolved : DEFAULT_PCA_COMPONENT_COLORS
}

function componentColor( componentIndex, componentColors ){

    const normalizedComponent = Math.max( 1, Number.parseInt( componentIndex, 10 ) || 1 )
    const colors = Array.isArray( componentColors ) && componentColors.length > 0
        ? componentColors
        : DEFAULT_PCA_COMPONENT_COLORS
    const colorIndex = ( normalizedComponent - 1 ) % colors.length

    return colors[colorIndex]
}

function resolveUmapChannelColors( channelColors ){
    return {
        r: parseColorValue( channelColors?.r ) ?? DEFAULT_UMAP_CHANNEL_COLORS.r,
        g: parseColorValue( channelColors?.g ) ?? DEFAULT_UMAP_CHANNEL_COLORS.g,
        b: parseColorValue( channelColors?.b ) ?? DEFAULT_UMAP_CHANNEL_COLORS.b
    }
}

function parseColorValue( color ){

    if( Array.isArray( color ) && color.length >= 3 ){
        return [
            clampByte( color[0] ),
            clampByte( color[1] ),
            clampByte( color[2] )
        ]
    }

    if( typeof color !== "string" ){
        return null
    }

    const rgbMatch = color.match(/^rgb\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)$/i)
    if( rgbMatch !== null ){
        return [
            clampByte( rgbMatch[1] ),
            clampByte( rgbMatch[2] ),
            clampByte( rgbMatch[3] )
        ]
    }

    const shortHexMatch = color.trim().match(/^#([0-9a-f]{3})$/i)
    if( shortHexMatch !== null ){
        return [
            Number.parseInt( shortHexMatch[1][0] + shortHexMatch[1][0], 16 ),
            Number.parseInt( shortHexMatch[1][1] + shortHexMatch[1][1], 16 ),
            Number.parseInt( shortHexMatch[1][2] + shortHexMatch[1][2], 16 )
        ]
    }

    const longHexMatch = color.trim().match(/^#([0-9a-f]{6})$/i)
    if( longHexMatch !== null ){
        return [
            Number.parseInt( longHexMatch[1].slice( 0, 2 ), 16 ),
            Number.parseInt( longHexMatch[1].slice( 2, 4 ), 16 ),
            Number.parseInt( longHexMatch[1].slice( 4, 6 ), 16 )
        ]
    }

    return null
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

function resolveSingleRgbChannel( requested, preferredDefault, available, availableSet, fallbackOffset ){

    const requestedIndex = Number.parseInt( requested, 10 )
    if( Number.isInteger( requestedIndex ) && availableSet.has( requestedIndex ) ){
        return requestedIndex
    }

    if( availableSet.has( preferredDefault ) ){
        return preferredDefault
    }

    return available[Math.max( 0, Math.min( fallbackOffset, available.length - 1 ) )]
}

function normalizedPcaRgbChannels( componentScores ){

    const width = componentScores[0].matrix[0].length
    const height = componentScores[0].matrix.length
    const matrixByComponent = new Map()
    for( const entry of componentScores ){
        matrixByComponent.set( entry.componentIndex, entry.matrix )
    }

    return {
        width,
        height,
        matrixByComponent,
        channels: new Map()
    }
}

function normalizedPcaRgbChannel( channelContext, componentIndex ){

    if( channelContext.channels.has( componentIndex ) ){
        return channelContext.channels.get( componentIndex )
    }

    const matrix = channelContext.matrixByComponent.get( componentIndex )
    if( Array.isArray( matrix ) === false ){
        return null
    }

    const scale = buildRobustScale( matrix )
    const width = channelContext.width
    const height = channelContext.height
    const normalized = new Uint8Array( width * height )
    let pixelIndex = 0

    for( let row = 0; row < height; row++ ){
        for( let col = 0; col < width; col++ ){
            normalized[pixelIndex++] = clampByte( 255 * normalizeByScale( matrix[row][col], scale ) )
        }
    }

    channelContext.channels.set( componentIndex, normalized )
    return normalized
}

function buildRobustScale( matrix, lowerQuantile = 0.02, upperQuantile = 0.98 ){

    const values = sampleFiniteValues( matrix )
    if( values.length === 0 ){
        return { low: 0, high: 1 }
    }

    values.sort(( left, right ) => left - right )

    const quantileLow = quantileFromSorted( values, lowerQuantile )
    const quantileHigh = quantileFromSorted( values, upperQuantile )

    if( Number.isFinite( quantileLow ) && Number.isFinite( quantileHigh ) && quantileHigh > quantileLow ){
        return { low: quantileLow, high: quantileHigh }
    }

    const minimum = values[0]
    const maximum = values[values.length - 1]
    if( maximum > minimum ){
        return { low: minimum, high: maximum }
    }

    return { low: minimum, high: minimum + 1 }
}

function sampleFiniteValues( matrix, maxSamples = 200000 ){

    const height = matrix.length
    const width = matrix[0].length
    const total = height * width
    const step = Math.max( 1, Math.ceil( total / maxSamples ))
    const values = []
    let index = 0

    for( let row = 0; row < height; row++ ){
        for( let col = 0; col < width; col++ ){
            if(( index % step ) !== 0 ){
                index += 1
                continue
            }

            index += 1
            const value = matrix[row][col]
            if( Number.isFinite( value ) ){
                values.push( value )
            }
        }
    }

    return values
}

function quantileFromSorted( values, quantile ){

    if( values.length === 0 ) return null
    if( values.length === 1 ) return values[0]

    const clampedQuantile = clampUnit( quantile )
    const position = clampedQuantile * ( values.length - 1 )
    const lower = Math.floor( position )
    const upper = Math.ceil( position )

    if( lower === upper ){
        return values[lower]
    }

    const fraction = position - lower
    return values[lower] * ( 1 - fraction ) + values[upper] * fraction
}

function normalizeByScale( value, scale ){

    if( Number.isFinite( value ) === false ){
        return 0
    }

    const denominator = scale.high - scale.low
    if( denominator <= 0 ){
        return 0
    }

    return clampUnit(( value - scale.low ) / denominator )
}

function clampByte( value ){
    return Math.max( 0, Math.min( 255, Math.round( Number( value ) || 0 )))
}

function clampUnit( value ){

    const numeric = Number( value )
    if( Number.isFinite( numeric ) === false ) return 0
    if( numeric <= 0 ) return 0
    if( numeric >= 1 ) return 1
    return numeric
}
