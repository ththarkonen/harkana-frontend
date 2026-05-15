
function normalizeRoiPayload( payload ){

    if( Array.isArray( payload?.rois ) === false ){
        return []
    }

    var rois = []

    for( const roi of payload.rois ){
        const normalized = normalizeRoiEntry( roi )
        if( normalized === null ) continue
        rois.push( normalized )
    }

    return rois
}

function normalizeRoiEntry( roi ){

    if( roi === null || typeof roi !== "object" ) return null

    const normalizedShapeType = String( roi.shapeType ?? "" ).trim().toLowerCase()
    if(
        normalizedShapeType.length > 0 &&
        normalizedShapeType !== "pixel-list" &&
        normalizedShapeType !== "bounding-box"
    ){
        return null
    }

    const roiId = String( roi.roiId ?? "" ).trim()
    if( roiId.length === 0 ) return null

    const boundingBox = normalizeRoiBoundingBox( roi.boundingBox )
    if( boundingBox === null ) return null

    const meanSpectrum = normalizeNumericSeries( roi.meanSpectrum )
    const spectrumLength = resolveSpectrumLength( roi.spectrumLength, meanSpectrum )
    const confidenceLevels = normalizeConfidenceLevelsPayload(
        roi.confidenceLevels ??
        roi?.source?.confidence?.levels ??
        roi?.confidence?.levels
    )

    const estimate = normalizeRoiEstimatePayload( roi.estimate )
    const expectedLength = spectrumLength > 0
        ? spectrumLength
        : ( estimate?.spectrumLength ?? 0 )

    const confidenceLower = normalizeOptionalRoiBoundsPayload( roi?.confidence?.lowerBound, expectedLength )
    const confidenceUpper = normalizeOptionalRoiBoundsPayload( roi?.confidence?.upperBound, expectedLength )

    const lowerBound = normalizeOptionalRoiBoundsPayload( roi.lowerBound, expectedLength ) ?? confidenceLower
    const upperBound = normalizeOptionalRoiBoundsPayload( roi.upperBound, expectedLength ) ?? confidenceUpper
    const hasBounds = lowerBound !== null && upperBound !== null
    const source = roi.source !== null && typeof roi.source === "object"
        ? normalizeRoiSource( roi.source, expectedLength )
        : null

    return {
        roiId,
        name: String( roi.name ?? "" ).trim() || "Untitled ROI",
        description: String( roi.description ?? "" ),
        createdAt: typeof roi.createdAt === "string" ? roi.createdAt : "",
        createdBy: typeof roi.createdBy === "string" ? roi.createdBy : "",
        shapeType: "bounding-box",
        pixelCount: Number.isInteger( Number( roi.pixelCount )) ? Number( roi.pixelCount ) : ( boundingBox.width * boundingBox.height ),
        boundingBox,
        meanSpectrum,
        spectrumLength,
        lowerBound: hasBounds ? lowerBound : null,
        upperBound: hasBounds ? upperBound : null,
        xy: roi.xy !== null && typeof roi.xy === "object" ? roi.xy : null,
        normalization: roi.normalization !== null && typeof roi.normalization === "object" ? roi.normalization : null,
        source,
        confidence: hasBounds
            ? {
                lowerBound,
                upperBound
            }
            : null,
        confidenceLevels,
        estimate
    }
}

function normalizeRoiEstimatePayload( estimate ){

    if( estimate === null || typeof estimate !== "object" ){
        return null
    }

    const meanSpectrum = normalizeNumericSeries( estimate.meanSpectrum ?? estimate.spectrum ?? estimate.values )
    const spectrumLength = resolveSpectrumLength( estimate.spectrumLength, meanSpectrum )
    const confidenceLevels = normalizeConfidenceLevelsPayload(
        estimate.confidenceLevels ?? estimate?.source?.confidence?.levels ?? estimate?.confidence?.levels
    )
    const confidenceLower = normalizeOptionalRoiBoundsPayload( estimate?.confidence?.lowerBound, spectrumLength )
    const confidenceUpper = normalizeOptionalRoiBoundsPayload( estimate?.confidence?.upperBound, spectrumLength )
    const lowerBound = normalizeOptionalRoiBoundsPayload( estimate.lowerBound, spectrumLength ) ?? confidenceLower
    const upperBound = normalizeOptionalRoiBoundsPayload( estimate.upperBound, spectrumLength ) ?? confidenceUpper

    return {
        meanSpectrum,
        spectrumLength,
        xy: estimate.xy !== null && typeof estimate.xy === "object" ? estimate.xy : null,
        normalization: estimate.normalization !== null && typeof estimate.normalization === "object"
            ? estimate.normalization
            : null,
        source: estimate.source !== null && typeof estimate.source === "object"
            ? normalizeRoiSource( estimate.source, spectrumLength )
            : null,
        confidence: lowerBound !== null && upperBound !== null
            ? {
                lowerBound,
                upperBound
            }
            : null,
        confidenceLevels,
        lowerBound,
        upperBound
    }
}

function resolveSpectrumLength( explicitLength, series ){

    const normalizedLength = Number.parseInt( explicitLength, 10 )
    if( Number.isInteger( normalizedLength ) && normalizedLength > 0 ){
        return normalizedLength
    }

    if( Array.isArray( series ) ){
        return series.length
    }

    return 0
}

function normalizeConfidenceLevelsPayload( confidenceLevels ){

    if( Array.isArray( confidenceLevels ) === false ){
        return []
    }

    const normalized = confidenceLevels
        .map(( value ) => Number.parseInt( String( value ), 10 ))
        .filter(( value ) => Number.isInteger( value ) && value > 0 && value <= 100 )
        .map(( value ) => String( value ))

    return [ ...new Set( normalized ) ]
}

function normalizeRoiSource( source, expectedLength ){

    if( source === null || typeof source !== "object" ){
        return null
    }

    const normalized = { ...source }

    if( source?.confidence !== null && typeof source?.confidence === "object" ){
        const confidenceLower = normalizeOptionalRoiBoundsPayload( source.confidence.lowerBound, expectedLength )
        const confidenceUpper = normalizeOptionalRoiBoundsPayload( source.confidence.upperBound, expectedLength )

        normalized.confidence = {
            ...source.confidence,
            lowerBound: confidenceLower,
            upperBound: confidenceUpper,
            levels: normalizeConfidenceLevelsPayload( source?.confidence?.levels )
        }
    }

    return normalized
}

function normalizeRoiBoundingBox( boundingBox ){

    if( boundingBox === null || typeof boundingBox !== "object" ) return null

    const minX = Number.parseInt( boundingBox.minX, 10 )
    const maxX = Number.parseInt( boundingBox.maxX, 10 )
    const minY = Number.parseInt( boundingBox.minY, 10 )
    const maxY = Number.parseInt( boundingBox.maxY, 10 )

    if( Number.isInteger( minX ) === false ||
        Number.isInteger( maxX ) === false ||
        Number.isInteger( minY ) === false ||
        Number.isInteger( maxY ) === false ){
        return null
    }

    if( maxX < minX || maxY < minY ){
        return null
    }

    const width = Number.isInteger( Number( boundingBox.width ))
        ? Number( boundingBox.width )
        : ( maxX - minX + 1 )
    const height = Number.isInteger( Number( boundingBox.height ))
        ? Number( boundingBox.height )
        : ( maxY - minY + 1 )

    return {
        minX,
        maxX,
        minY,
        maxY,
        width,
        height
    }
}

function normalizeNumericSeries( values ){

    if( Array.isArray( values ) === false || values.length === 0 ){
        return null
    }

    var series = []

    for( const value of values ){
        const numeric = Number( value )
        series.push( Number.isFinite( numeric ) ? numeric : null )
    }

    if( series.some(( value ) => value !== null ) === false ){
        return null
    }

    return series
}

function normalizeOptionalNumericSeries( values, expectedLength ){

    if( Array.isArray( values ) === false ){
        return null
    }

    if( Number.isInteger( expectedLength ) && expectedLength > 0 && values.length !== expectedLength ){
        return null
    }

    return normalizeNumericSeries( values )
}

function normalizeOptionalRoiBoundsPayload( values, expectedLength ){

    if( Array.isArray( values ) ){
        return normalizeOptionalNumericSeries( values, expectedLength )
    }

    if( values === null || typeof values !== "object" ){
        return null
    }

    var normalized = {}
    var hasAnyLevel = false

    for( const [ key, payload ] of Object.entries( values ) ){
        const numericKey = Number.parseInt( String( key ), 10 )
        if( Number.isInteger( numericKey ) === false ) continue

        const normalizedSeries = normalizeOptionalNumericSeries( payload, expectedLength )
        if( normalizedSeries === null ) continue

        normalized[String( numericKey )] = normalizedSeries
        hasAnyLevel = true
    }

    return hasAnyLevel ? normalized : null
}

export {
    normalizeRoiPayload
}
