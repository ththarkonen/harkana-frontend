import lodash from "lodash"
import { ref } from "vue"

const { debounce } = lodash

const SPECTRUM_GRIDLINE_CHANGE_EVENT = "harkana:spectrum-gridlines-change"
const SPECTRUM_LEGEND_CHANGE_EVENT = "harkana:spectrum-chip-legend-change"

function normalizeGridlineVisibility( value, fallback = false ){

	if( typeof value === "boolean" ){
		return value
	}

	if( typeof value === "string" ){
		if( value === "true" ) return true
		if( value === "false" ) return false
	}

	return fallback
}

export function useSpectrumPlotSync( options ){

	const settings = options.settings
	const project = options.project
	const measurementDataType = options.measurementDataType
	const hyperspectra = options.hyperspectra
	const graph = options.graph
	const deckTopPanelGraph = options.deckTopPanelGraph
	const deckBottomPanelGraph = options.deckBottomPanelGraph
	const topSpectrumPaneLegendVisible = options.topSpectrumPaneLegendVisible
	const topSpectrumGridlineSourceKey = options.topSpectrumGridlineSourceKey
	const bottomSpectrumGridlineSourceKey = options.bottomSpectrumGridlineSourceKey

	const projectSpectrumGridlinesVisible = ref( null )

	let spectrumGridlineGraphListeners = []
	let spectrumLegendGraphListeners = []

	const defaultProjectSpectrumGridlinesVisible = () => {
		const defaultVisible = normalizeGridlineVisibility( settings.value?.gridlines?.hyperspectra, false )

		return {
			measurement: defaultVisible,
			estimate: defaultVisible
		}
	}

	const normalizeProjectSpectrumGridlineState = ( value, fallback = null ) => {

		const normalizedFallback = fallback !== null && typeof fallback === "object"
			? {
				measurement: normalizeGridlineVisibility( fallback?.measurement ?? fallback?.showGridlines, false ),
				estimate: normalizeGridlineVisibility( fallback?.estimate ?? fallback?.showGridlines, false )
			}
			: defaultProjectSpectrumGridlinesVisible()

		if( value !== null && typeof value === "object" ){
			const hasSharedVisible = Object.prototype.hasOwnProperty.call( value, "showGridlines" )
			const sharedVisible = hasSharedVisible
				? normalizeGridlineVisibility( value.showGridlines, normalizedFallback.measurement )
				: null

			const normalizedState = {
				measurement: Object.prototype.hasOwnProperty.call( value, "measurement" )
					? normalizeGridlineVisibility( value.measurement, normalizedFallback.measurement )
					: ( sharedVisible ?? normalizedFallback.measurement ),
				estimate: Object.prototype.hasOwnProperty.call( value, "estimate" )
					? normalizeGridlineVisibility( value.estimate, normalizedFallback.estimate )
					: ( sharedVisible ?? normalizedFallback.estimate )
			}

			const hasUpperPane = Object.prototype.hasOwnProperty.call( value, "upperPane" )
			const hasLowerPane = Object.prototype.hasOwnProperty.call( value, "lowerPane" )
			if( hasUpperPane ){
				normalizedState[topSpectrumGridlineSourceKey()] = normalizeGridlineVisibility(
					value.upperPane,
					normalizedState[topSpectrumGridlineSourceKey()]
				)
			}
			if( hasLowerPane ){
				normalizedState[bottomSpectrumGridlineSourceKey()] = normalizeGridlineVisibility(
					value.lowerPane,
					normalizedState[bottomSpectrumGridlineSourceKey()]
				)
			}

			return normalizedState
		}

		const normalizedVisible = normalizeGridlineVisibility( value, normalizedFallback.measurement )
		return {
			measurement: normalizedVisible,
			estimate: normalizedVisible
		}
	}

	const spectrumGridlinePresetPayload = () => {
		const normalizedState = normalizeProjectSpectrumGridlineState( projectSpectrumGridlinesVisible.value )

		return {
			version: "spectrum-gridlines-v1",
			projectID: String( project.value?.rawid ?? project.value?.id ?? "" ).trim(),
			dataType: measurementDataType.toLowerCase() === "hyperraman" || measurementDataType.toLowerCase() === "raman"
				? "hyperraman"
				: "hypercars",
			measurement: normalizedState.measurement,
			estimate: normalizedState.estimate
		}
	}

	const spectrumGridlineSourceKeysForGraph = ( graphContainer ) => {

		if( graphContainer === deckTopPanelGraph.value ){
			return [ topSpectrumGridlineSourceKey() ]
		}

		if( graphContainer === deckBottomPanelGraph.value ){
			return [ bottomSpectrumGridlineSourceKey() ]
		}

		if( graphContainer === graph.value ){
			return Array.from( new Set([
				topSpectrumGridlineSourceKey(),
				bottomSpectrumGridlineSourceKey()
			]))
		}

		return []
	}

	const spectrumGridlineVisibilityForGraph = ( state, graphContainer ) => {

		const normalizedState = normalizeProjectSpectrumGridlineState( state )
		const topVisible = normalizedState[topSpectrumGridlineSourceKey()] === true
		const bottomVisible = normalizedState[bottomSpectrumGridlineSourceKey()] === true

		if( graphContainer === deckTopPanelGraph.value ){
			return topVisible
		}

		if( graphContainer === deckBottomPanelGraph.value ){
			return bottomVisible
		}

		if( graphContainer === graph.value ){
			return {
				xaxis: topVisible,
				yaxis: topVisible,
				xaxis2: bottomVisible,
				yaxis2: bottomVisible
			}
		}

		return topVisible
	}

	const applyProjectSpectrumGridlineState = async ( state ) => {

		const normalizedState = normalizeProjectSpectrumGridlineState(
			state,
			defaultProjectSpectrumGridlinesVisible()
		)

		projectSpectrumGridlinesVisible.value = normalizedState
		const graphContainers = Array.from( new Set(
			[ graph.value, deckTopPanelGraph.value, deckBottomPanelGraph.value ]
				.filter(( graphContainer ) => graphContainer !== null )
		) )

		for( const graphContainer of graphContainers ){
			graphContainer.__harkanaSpectrumGridlinesVisible = spectrumGridlineVisibilityForGraph(
				normalizedState,
				graphContainer
			)
		}
	}

	const loadProjectSpectrumGridlinePreset = async ( requestID = null ) => {

		const fallbackState = defaultProjectSpectrumGridlinesVisible()
		await applyProjectSpectrumGridlineState( fallbackState )

		if( project.value?.id === "" ) return

		try{
			const response = await hyperspectra.loadSpectrumGridlineSettings( project.value, measurementDataType )
			if( requestID !== null && requestID !== options.activeProjectLoadRequestID.value ) return
			await applyProjectSpectrumGridlineState( response )
		} catch( error ){
			if( requestID !== null && requestID !== options.activeProjectLoadRequestID.value ) return
			await applyProjectSpectrumGridlineState( fallbackState )
			if( Number( error?.status ) === 404 ){
				return
			}
			console.log( error )
		}
	}

	const saveProjectSpectrumGridlinePreset = async () => {

		if( project.value?.id === "" ){
			return
		}

		try{
			await hyperspectra.saveSpectrumGridlineSettings(
				project.value,
				spectrumGridlinePresetPayload(),
				measurementDataType
			)
		} catch( error ){
			console.log( error )
		}
	}

	const debouncedSaveProjectSpectrumGridlinePreset = debounce( () => {
		void saveProjectSpectrumGridlinePreset()
	}, 250 )

	const handleSpectrumGridlineChange = ( event ) => {

		const sourceKeys = spectrumGridlineSourceKeysForGraph( event?.currentTarget ?? null )
		if( sourceKeys.length === 0 ){
			return
		}

		const nextVisible = normalizeGridlineVisibility( event?.detail?.visible, false )
		const currentState = normalizeProjectSpectrumGridlineState( projectSpectrumGridlinesVisible.value )
		const nextState = { ...currentState }

		for( const sourceKey of sourceKeys ){
			nextState[sourceKey] = nextVisible
		}

		void applyProjectSpectrumGridlineState( nextState )
		debouncedSaveProjectSpectrumGridlinePreset()
	}

	const clearSpectrumGridlineGraphListeners = () => {

		for( const listenerEntry of spectrumGridlineGraphListeners ){
			listenerEntry.element.removeEventListener( SPECTRUM_GRIDLINE_CHANGE_EVENT, listenerEntry.handler )
		}

		spectrumGridlineGraphListeners = []
	}

	const syncSpectrumGridlineGraphListeners = () => {

		clearSpectrumGridlineGraphListeners()

		const graphContainers = Array.from( new Set(
			[ graph.value, deckTopPanelGraph.value, deckBottomPanelGraph.value ]
				.filter(( graphContainer ) => graphContainer !== null )
		) )

		for( const graphContainer of graphContainers ){
			const handler = ( event ) => {
				handleSpectrumGridlineChange( event )
			}

			graphContainer.addEventListener( SPECTRUM_GRIDLINE_CHANGE_EVENT, handler )
			spectrumGridlineGraphListeners.push({
				element: graphContainer,
				handler
			})
		}
	}

	const clearSpectrumLegendGraphListeners = () => {

		for( const listenerEntry of spectrumLegendGraphListeners ){
			listenerEntry.element.removeEventListener( SPECTRUM_LEGEND_CHANGE_EVENT, listenerEntry.handler )
		}

		spectrumLegendGraphListeners = []
	}

	const syncSpectrumLegendGraphListeners = () => {

		clearSpectrumLegendGraphListeners()

		if( deckTopPanelGraph.value === null ){
			return
		}

		const handler = ( event ) => {
			topSpectrumPaneLegendVisible.value = event?.detail?.visible !== false
		}

		deckTopPanelGraph.value.addEventListener( SPECTRUM_LEGEND_CHANGE_EVENT, handler )
		spectrumLegendGraphListeners.push({
			element: deckTopPanelGraph.value,
			handler
		})
	}

	const syncSpectrumPlotGraphListeners = () => {
		syncSpectrumGridlineGraphListeners()
		syncSpectrumLegendGraphListeners()
	}

	const clearSpectrumPlotGraphListeners = () => {
		clearSpectrumGridlineGraphListeners()
		clearSpectrumLegendGraphListeners()
	}

	const cancelSpectrumGridlinePresetSave = () => {
		debouncedSaveProjectSpectrumGridlinePreset.cancel()
	}

	const resetSpectrumPlotSyncState = () => {
		cancelSpectrumGridlinePresetSave()
		clearSpectrumPlotGraphListeners()
		projectSpectrumGridlinesVisible.value = defaultProjectSpectrumGridlinesVisible()
	}

	return {
		projectSpectrumGridlinesVisible,
		defaultProjectSpectrumGridlinesVisible,
		normalizeProjectSpectrumGridlineState,
		applyProjectSpectrumGridlineState,
		loadProjectSpectrumGridlinePreset,
		syncSpectrumPlotGraphListeners,
		clearSpectrumPlotGraphListeners,
		cancelSpectrumGridlinePresetSave,
		resetSpectrumPlotSyncState
	}
}
