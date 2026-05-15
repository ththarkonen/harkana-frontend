import { computed, ref, shallowRef } from "vue"
import {
	normalizeSelectionBoundingBox,
	selectionBoundingBoxPixelCount
} from "./selectionBounds.js"

function normalizeSpectrumSource( source ){
	const normalized = String( source ?? "" ).trim().toLowerCase()
	return normalized === "raman" ? "raman" : "measurement"
}

function normalizeSelectionConfidenceLevel( value, options = {}, fallback = 95 ){

	const noneValue = typeof options.noneValue === "string" ? options.noneValue : "none"
	const confidenceLevelOptions = Array.isArray( options.confidenceLevelOptions )
		? options.confidenceLevelOptions
		: [ 50, 75, 90, 95 ]

	if( String( value ?? "" ).trim().toLowerCase() === noneValue ){
		return noneValue
	}

	const numeric = Number.parseInt( value, 10 )
	if( confidenceLevelOptions.includes( numeric ) ){
		return numeric
	}

	return fallback
}

function useHyperspectrumSelections( options ){

	const project = options.project
	const hyperspectra = options.hyperspectra
	const activeGroupID = options.activeGroupID
	const hasEstimatedRamanSpectraReady = options.hasEstimatedRamanSpectraReady
	const hasSuccessfulRamanInference = options.hasSuccessfulRamanInference
	const queueSpectraPanelRender = options.queueSpectraPanelRender
	const measurementDataType = options.measurementDataType ?? "hypercars"
	const confidenceLevelOptions = Array.isArray( options.confidenceLevelOptions )
		? options.confidenceLevelOptions
		: [ 50, 75, 90, 95 ]
	const estimateConfidenceLevels = Array.isArray( options.estimateConfidenceLevels )
		? options.estimateConfidenceLevels
		: [ 50, 75, 90, 95 ]

	const visualizationDataSource = ref( "measurement" )
	const spectrumDataSource = ref( "measurement" )
	const primarySpectrumSource = ref( "measurement" )
	const selectedConfidenceLevel = ref( 95 )
	const selectedHeatmapIndices = ref({ xIndices: [], yIndices: [] })
	const selectedHeatmapBoundingBox = ref( null )
	const latestMeasurementSingleSpectrum = shallowRef( null )
	const latestMeasurementMeanSpectrum = shallowRef( null )
	const latestMeasurementSelectedSpectrum = shallowRef( null )
	const latestRamanSingleSpectrum = shallowRef( null )
	const latestRamanMeanSpectrum = shallowRef( null )
	const latestRamanSelectedSpectrum = shallowRef( null )
	const measurementSelectionSpectrumQuerying = ref( false )
	const ramanSelectionSpectrumQuerying = ref( false )
	const activeMeasurementSelectionSpectrumRequestID = ref( 0 )
	const activeRamanSelectionSpectrumRequestID = ref( 0 )

	const spectrumSelectionMode = computed(() => {
		if( hasEstimatedRamanSpectraReady.value === false ){
			return "measurement"
		}

		return [ "measurement", "raman", "both" ].includes( spectrumDataSource.value )
			? spectrumDataSource.value
			: "measurement"
	})

	const resolvedPrimarySpectrumSource = () => {
		if( spectrumSelectionMode.value !== "both" ){
			return spectrumSelectionMode.value
		}

		return String( primarySpectrumSource.value ?? "" ).trim().toLowerCase() === "raman"
			? "raman"
			: "measurement"
	}

	const resolvedSecondarySpectrumSource = () => {
		if( spectrumSelectionMode.value !== "both" ){
			return null
		}

		return resolvedPrimarySpectrumSource() === "raman"
			? "measurement"
			: "raman"
	}

	const setVisualizationDataSource = ( source ) => {
		if( hasSuccessfulRamanInference.value === false ){
			visualizationDataSource.value = "measurement"
			return
		}

		visualizationDataSource.value = normalizeSpectrumSource( source )
	}

	const setPrimarySpectrumSource = ( source ) => {
		primarySpectrumSource.value = normalizeSpectrumSource( source )
	}

	const setSelectedConfidenceLevel = ( level ) => {
		selectedConfidenceLevel.value = normalizeSelectionConfidenceLevel( level, {
			confidenceLevelOptions,
			noneValue: "none"
		})
	}

	const selectionSpectrumQueryingRefForSource = ( source ) => {
		return normalizeSpectrumSource( source ) === "raman"
			? ramanSelectionSpectrumQuerying
			: measurementSelectionSpectrumQuerying
	}

	const selectionSpectrumRequestIDRefForSource = ( source ) => {
		return normalizeSpectrumSource( source ) === "raman"
			? activeRamanSelectionSpectrumRequestID
			: activeMeasurementSelectionSpectrumRequestID
	}

	const setSelectionSpectrumQuerying = ( source, querying ) => {
		selectionSpectrumQueryingRefForSource( source ).value = querying === true
	}

	const isSelectionSpectrumQuerying = ( source ) => {
		return selectionSpectrumQueryingRefForSource( source ).value === true
	}

	const startSelectionSpectrumQuery = ( source ) => {
		const requestIDRef = selectionSpectrumRequestIDRefForSource( source )
		const nextRequestID = requestIDRef.value + 1
		requestIDRef.value = nextRequestID
		setSelectionSpectrumQuerying( source, true )
		return nextRequestID
	}

	const isSelectionSpectrumQueryCurrent = ( source, requestID ) => {
		return selectionSpectrumRequestIDRefForSource( source ).value === requestID
	}

	const finishSelectionSpectrumQuery = ( source, requestID ) => {
		if( isSelectionSpectrumQueryCurrent( source, requestID ) ){
			setSelectionSpectrumQuerying( source, false )
		}
	}

	const cancelSelectionSpectrumQuery = ( source ) => {
		const requestIDRef = selectionSpectrumRequestIDRefForSource( source )
		requestIDRef.value += 1
		setSelectionSpectrumQuerying( source, false )
	}

	const cancelSelectionSpectrumQueriesForInactiveSources = ( sources ) => {

		const activeSources = new Set(
			( Array.isArray( sources ) ? sources : [] )
				.map(( source ) => normalizeSpectrumSource( source ))
		)

		for( const source of [ "measurement", "raman" ] ){
			if( activeSources.has( source ) === false ){
				cancelSelectionSpectrumQuery( source )
			}
		}
	}

	const spectrumSourcesToQuery = () => {
		if( hasEstimatedRamanSpectraReady.value === false ){
			return [ "measurement" ]
		}

		const mode = spectrumSelectionMode.value
		if( mode === "raman" ){
			return [ "raman" ]
		}
		if( mode === "both" ){
			return [ "measurement", "raman" ]
		}

		return [ "measurement" ]
	}

	const dataTypeForSpectrumSource = ( source ) => {
		normalizeSpectrumSource( source )
		return measurementDataType
	}

	const dataSourceForSpectrumSource = ( source ) => {
		return normalizeSpectrumSource( source ) === "raman" ? "estimate" : ""
	}

	const confidenceLevelsForSpectrumSource = ( source ) => {
		return normalizeSpectrumSource( source ) === "raman"
			? estimateConfidenceLevels
			: confidenceLevelOptions
	}

	const updateLatestSingleSpectrum = ( source, x, y, response ) => {
		if( normalizeSpectrumSource( source ) === "raman" ){
			latestRamanSingleSpectrum.value = { x, y, response }
			latestRamanSelectedSpectrum.value = response ?? null
			return
		}

		latestMeasurementSingleSpectrum.value = { x, y, response }
		latestMeasurementSelectedSpectrum.value = response ?? null
	}

	const updateLatestMeanSpectrum = ( source, xIndices, yIndices, boundingBox, response ) => {

		const payload = {
			xIndices: [ ...xIndices ],
			yIndices: [ ...yIndices ],
			pixelCount: selectionBoundingBoxPixelCount( boundingBox ),
			boundingBox: normalizeSelectionBoundingBox( boundingBox ),
			response
		}

		if( normalizeSpectrumSource( source ) === "raman" ){
			latestRamanMeanSpectrum.value = payload
			latestRamanSelectedSpectrum.value = response ?? null
			return
		}

		latestMeasurementMeanSpectrum.value = payload
		latestMeasurementSelectedSpectrum.value = response ?? null
	}

	const queryPointSpectrumForSource = async ( source, x, y, requestID ) => {

		const normalizedSource = normalizeSpectrumSource( source )

		try{
			const response = await hyperspectra.spectrum(
				project.value,
				x,
				y,
				activeGroupID(),
				dataTypeForSpectrumSource( normalizedSource ),
				dataSourceForSpectrumSource( normalizedSource ),
				confidenceLevelsForSpectrumSource( normalizedSource )
			)

			if( isSelectionSpectrumQueryCurrent( normalizedSource, requestID ) === false ) return

			updateLatestSingleSpectrum( normalizedSource, x, y, response )
			await queueSpectraPanelRender()
		} catch( error ){
			console.log( error )
		} finally {
			finishSelectionSpectrumQuery( normalizedSource, requestID )
		}
	}

	const queryMeanSpectrumForSource = async ( source, xIndices, yIndices, boundingBox, requestID ) => {

		const normalizedSource = normalizeSpectrumSource( source )

		try{
			const response = await hyperspectra.meanSpectrum(
				project.value,
				boundingBox,
				activeGroupID(),
				false,
				dataTypeForSpectrumSource( normalizedSource ),
				dataSourceForSpectrumSource( normalizedSource ),
				confidenceLevelsForSpectrumSource( normalizedSource )
			)

			if( isSelectionSpectrumQueryCurrent( normalizedSource, requestID ) === false ) return

			updateLatestMeanSpectrum( normalizedSource, xIndices, yIndices, boundingBox, response )
			await queueSpectraPanelRender()
		} catch( error ){
			console.log( error )
		} finally {
			finishSelectionSpectrumQuery( normalizedSource, requestID )
		}
	}

	const handleHeatmapPointSelection = async ( selection ) => {

		if( project.value.id === "" ) return
		if( selection === null || typeof selection !== "object" ) return

		const x = Number.parseInt( selection.x, 10 )
		const y = Number.parseInt( selection.y, 10 )

		if( Number.isInteger( x ) === false || Number.isInteger( y ) === false ) return

		selectedHeatmapIndices.value = {
			xIndices: [ x ],
			yIndices: [ y ]
		}
		selectedHeatmapBoundingBox.value = normalizeSelectionBoundingBox({
			minX: x,
			maxX: x,
			minY: y,
			maxY: y
		})

		const sources = spectrumSourcesToQuery()
		cancelSelectionSpectrumQueriesForInactiveSources( sources )

		for( const source of sources ){
			const requestID = startSelectionSpectrumQuery( source )
			void queryPointSpectrumForSource( source, x, y, requestID )
		}
	}

	const handleHeatmapRegionSelection = async ( selection ) => {

		if( project.value.id === "" ) return
		if( selection === null || typeof selection !== "object" ) return

		const xIndices = Array.isArray( selection.xIndices ) ? selection.xIndices : []
		const yIndices = Array.isArray( selection.yIndices ) ? selection.yIndices : []
		const boundingBox = normalizeSelectionBoundingBox( selection.boundingBox )

		if( xIndices.length === 0 || yIndices.length === 0 || boundingBox === null ) return

		selectedHeatmapIndices.value = {
			xIndices: [ ...xIndices ],
			yIndices: [ ...yIndices ]
		}
		selectedHeatmapBoundingBox.value = boundingBox

		const sources = spectrumSourcesToQuery()
		cancelSelectionSpectrumQueriesForInactiveSources( sources )

		for( const source of sources ){
			const requestID = startSelectionSpectrumQuery( source )
			void queryMeanSpectrumForSource( source, xIndices, yIndices, boundingBox, requestID )
		}
	}

	const clearSpectrumSourceState = ( source ) => {
		if( normalizeSpectrumSource( source ) === "raman" ){
			latestRamanSingleSpectrum.value = null
			latestRamanMeanSpectrum.value = null
			latestRamanSelectedSpectrum.value = null
			return
		}

		latestMeasurementSingleSpectrum.value = null
		latestMeasurementMeanSpectrum.value = null
		latestMeasurementSelectedSpectrum.value = null
	}

	const cancelSelectionSpectrumQueryState = () => {
		cancelSelectionSpectrumQuery( "measurement" )
		cancelSelectionSpectrumQuery( "raman" )
	}

	const resetSelectionState = () => {
		visualizationDataSource.value = "measurement"
		spectrumDataSource.value = "measurement"
		primarySpectrumSource.value = "measurement"
		selectedConfidenceLevel.value = 95
		selectedHeatmapIndices.value = { xIndices: [], yIndices: [] }
		selectedHeatmapBoundingBox.value = null
		clearSpectrumSourceState( "measurement" )
		clearSpectrumSourceState( "raman" )
		measurementSelectionSpectrumQuerying.value = false
		ramanSelectionSpectrumQuerying.value = false
		activeMeasurementSelectionSpectrumRequestID.value = 0
		activeRamanSelectionSpectrumRequestID.value = 0
	}

	return {
		visualizationDataSource,
		spectrumDataSource,
		primarySpectrumSource,
		selectedConfidenceLevel,
		selectedHeatmapIndices,
		selectedHeatmapBoundingBox,
		latestMeasurementSingleSpectrum,
		latestMeasurementMeanSpectrum,
		latestMeasurementSelectedSpectrum,
		latestRamanSingleSpectrum,
		latestRamanMeanSpectrum,
		latestRamanSelectedSpectrum,
		measurementSelectionSpectrumQuerying,
		ramanSelectionSpectrumQuerying,
		spectrumSelectionMode,
		resolvedPrimarySpectrumSource,
		resolvedSecondarySpectrumSource,
		normalizeSpectrumSource,
		setVisualizationDataSource,
		setPrimarySpectrumSource,
		setSelectedConfidenceLevel,
		isSelectionSpectrumQuerying,
		cancelSelectionSpectrumQuery,
		cancelSelectionSpectrumQueryState,
		cancelSelectionSpectrumQueriesForInactiveSources,
		spectrumSourcesToQuery,
		dataTypeForSpectrumSource,
		dataSourceForSpectrumSource,
		confidenceLevelsForSpectrumSource,
		handleHeatmapPointSelection,
		handleHeatmapRegionSelection,
		clearSpectrumSourceState,
		resetSelectionState
	}
}

export {
	normalizeSelectionConfidenceLevel,
	normalizeSpectrumSource,
	useHyperspectrumSelections
}
