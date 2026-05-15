function normalizeRoiNumericSeries( values ){

	if( Array.isArray( values ) === false || values.length === 0 ){
		return null
	}

	var series = []
	var hasNumericValue = false

	for( const value of values ){
		const numeric = Number( value )
		if( Number.isFinite( numeric ) ){
			series.push( numeric )
			hasNumericValue = true
			continue
		}
		series.push( null )
	}

	return hasNumericValue ? series : null
}

function normalizeRoiBoundsPayload( payload ){

	if( Array.isArray( payload ) ){
		return normalizeRoiNumericSeries( payload )
	}

	if( payload === null || typeof payload !== "object" ){
		return null
	}

	var normalized = {}
	var hasAnyLevel = false

	for( const [ key, value ] of Object.entries( payload ) ){
		const numericKey = Number.parseInt( String( key ), 10 )
		if( Number.isInteger( numericKey ) === false ) continue

		const normalizedSeries = normalizeRoiNumericSeries( value )
		if( normalizedSeries === null ) continue

		normalized[String( numericKey )] = normalizedSeries
		hasAnyLevel = true
	}

	return hasAnyLevel ? normalized : null
}

function extractEstimateSpectrumFromRoi( roi ){

	if( roi === null || typeof roi !== "object" ){
		return null
	}

	const directSpectrumKeys = [
		"estimateMeanSpectrum",
		"estimatedMeanSpectrum",
		"meanSpectrumEstimate",
		"meanSpectrumEstimated",
		"ramanMeanSpectrum"
	]

	for( const key of directSpectrumKeys ){
		const series = normalizeRoiNumericSeries( roi?.[key] )
		if( series === null ) continue

		const lowerBound = normalizeRoiBoundsPayload(
			roi?.estimateLowerBound ??
			roi?.estimatedLowerBound ??
			roi?.lowerBoundEstimate ??
			roi?.ramanLowerBound ??
			null
		)
		const upperBound = normalizeRoiBoundsPayload(
			roi?.estimateUpperBound ??
			roi?.estimatedUpperBound ??
			roi?.upperBoundEstimate ??
			roi?.ramanUpperBound ??
			null
		)

		return {
			spectrum: series,
			lowerBound,
			upperBound
		}
	}

	const nestedCandidates = [
		roi?.estimate,
		roi?.estimated,
		roi?.raman,
		roi?.inference,
		roi?.sources?.estimate
	]

	for( const nested of nestedCandidates ){
		if( nested === null || typeof nested !== "object" ) continue

		const series = normalizeRoiNumericSeries( nested.meanSpectrum ?? nested.spectrum ?? nested.values )
		if( series === null ) continue

		return {
			spectrum: series,
			lowerBound: normalizeRoiBoundsPayload( nested.lowerBound ),
			upperBound: normalizeRoiBoundsPayload( nested.upperBound )
		}
	}

	return null
}

function normalizeEstimatedRoiEntry( roi, normalizeSelectionBoundingBox, mode = "" ){

	if( roi === null || typeof roi !== "object" ){
		return null
	}

	const roiId = String( roi.roiId ?? "" ).trim()
	if( roiId.length === 0 ){
		return null
	}

	const normalizedMode = String( mode ?? "" ).trim().toLowerCase()
	const estimateFromRoi = extractEstimateSpectrumFromRoi( roi )
	const useEstimateOnly = normalizedMode === "roi/frontend"
	const fallbackMeanSpectrum = useEstimateOnly
		? null
		: normalizeRoiNumericSeries( roi.meanSpectrum )
	const spectrum = estimateFromRoi?.spectrum ?? fallbackMeanSpectrum
	const lowerBound = estimateFromRoi?.lowerBound ?? normalizeRoiBoundsPayload( roi.lowerBound )
	const upperBound = estimateFromRoi?.upperBound ?? normalizeRoiBoundsPayload( roi.upperBound )
	const boundingBox = normalizeSelectionBoundingBox( roi.boundingBox )

	return {
		roiId,
		name: String( roi.name ?? "" ).trim(),
		description: String( roi.description ?? "" ),
		meanSpectrum: spectrum,
		lowerBound,
		upperBound,
		boundingBox
	}
}

function normalizeEstimatedRoiPayload( payload, normalizeSelectionBoundingBox, mode = "" ){
	if( Array.isArray( payload?.rois ) === false ){
		return []
	}

	var normalized = []
	for( const roi of payload.rois ){
		const normalizedRoi = normalizeEstimatedRoiEntry( roi, normalizeSelectionBoundingBox, mode )
		if( normalizedRoi === null ) continue
		normalized.push( normalizedRoi )
	}

	return normalized
}

function newestMatchingRoiId( rois, name, description ){

	const normalizedName = String( name ?? "" ).trim()
	const normalizedDescription = String( description ?? "" )
	const candidates = Array.isArray( rois ) ? rois : []

	const matches = candidates.filter(( roi ) => {
		return roi.name === normalizedName && roi.description === normalizedDescription
	})

	if( matches.length === 0 ){
		return ""
	}

	matches.sort(( left, right ) => {
		const leftTimestamp = Date.parse( left.createdAt || "" )
		const rightTimestamp = Date.parse( right.createdAt || "" )
		const safeLeft = Number.isFinite( leftTimestamp ) ? leftTimestamp : 0
		const safeRight = Number.isFinite( rightTimestamp ) ? rightTimestamp : 0

		return safeRight - safeLeft
	})

	return matches[0].roiId
}

export {
	extractEstimateSpectrumFromRoi,
	newestMatchingRoiId,
	normalizeEstimatedRoiEntry,
	normalizeEstimatedRoiPayload,
	normalizeRoiBoundsPayload,
	normalizeRoiNumericSeries
}
