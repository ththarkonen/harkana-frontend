import { ref } from "vue"

const HEATMAP_INTERACTION_CHANGE_EVENT = "harkana:heatmap-interaction-change"
const HEATMAP_RESET_VIEW_EVENT = "harkana:heatmap-reset-view"

function normalizeHeatmapInteraction( value ){
	return String( value ?? "" ).trim().toLowerCase() === "zoom" ? "zoom" : "select"
}

function normalizeHeatmapRendererMode(){
	return "deckgl"
}

function normalizeHeatmapZoomAspectRatio( value ){
	return String( value ?? "" ).trim().toLowerCase() === "free" ? "free" : "square"
}

function useHyperspectrumHeatmapToolbarState( options ){

	const graph = options.graph
	const hyperspectrum = options.hyperspectrum
	const currentMatrix = options.currentMatrix
	const matrixDimensions = options.matrixDimensions
	const handleHeatmapPointSelection = options.handleHeatmapPointSelection
	const handleHeatmapRegionSelection = options.handleHeatmapRegionSelection
	const heatmapRendererPayload = options.heatmapRendererPayload
	const heatmapRendererPaneState = options.heatmapRendererPaneState
	const heatmapRenderBenchmark = options.heatmapRenderBenchmark
	const activePlot = options.activePlot

	const heatmapRendererMode = ref( "deckgl" )
	const heatmapZoomAspectRatio = ref( "square" )
	const heatmapInteractionMode = ref( "select" )

	let heatmapViewportSyncHandler = null
	let heatmapModebarGraphListeners = []

	const setHeatmapInteractionMode = ( mode ) => {
		heatmapInteractionMode.value = normalizeHeatmapInteraction( mode )
		hyperspectrum.syncHeatmapModebarState( graph.value, heatmapInteractionMode.value, heatmapZoomAspectRatio.value )
	}

	const setHeatmapZoomAspectRatio = ( mode ) => {
		heatmapZoomAspectRatio.value = normalizeHeatmapZoomAspectRatio( mode )
		hyperspectrum.syncHeatmapModebarState( graph.value, heatmapInteractionMode.value, heatmapZoomAspectRatio.value )
	}

	const applyHeatmapInteraction = async () => {

		if( graph.value === null ) return

		const dimensions = matrixDimensions( currentMatrix() )
		if( dimensions === null ) return

		await hyperspectrum.configureHeatmapInteraction( graph.value, {
			mode: heatmapInteractionMode.value,
			rendererMode: heatmapRendererMode.value,
			width: dimensions.width,
			height: dimensions.height,
			onPointSelect: ( selection ) => {
				void handleHeatmapPointSelection( selection )
			},
			onRegionSelect: ( selection ) => {
				void handleHeatmapRegionSelection( selection )
			}
		})
	}

	const handleHeatmapZoomRange = async ( payload ) => {

		if( graph.value === null ) return
		if( payload === null || typeof payload !== "object" ) return

		const xRange = Array.isArray( payload.xRange ) ? payload.xRange : null
		const yRange = Array.isArray( payload.yRange ) ? payload.yRange : null

		try{
			await hyperspectrum.relayoutHeatmapViewport( graph.value, xRange, yRange )
		} catch( error ){
			console.log( error )
		}
	}

	const handleHeatmapResetZoom = async () => {

		if( graph.value === null ) return

		const width = Number( heatmapRendererPayload.value?.width )
		const height = Number( heatmapRendererPayload.value?.height )
		const heatmapOrigin = String( heatmapRendererPaneState.value?.heatmapOrigin ?? "top-left" )

		try{
			await hyperspectrum.resetHeatmapViewport( graph.value, width, height, heatmapOrigin )
		} catch( error ){
			console.log( error )
		}
	}

	const syncExternalHeatmapRenderer = async () => {

		if( graph.value === null ){
			heatmapRendererPayload.value = null
			heatmapRendererPaneState.value = null
			return
		}

		if( heatmapRendererMode.value !== "deckgl" ){
			heatmapRendererPayload.value = null
			heatmapRendererPaneState.value = null
			return
		}

		heatmapRendererPayload.value = hyperspectrum.getHeatmapRendererPayload( graph.value )
		heatmapRendererPaneState.value = hyperspectrum.getHeatmapPaneState( graph.value )
	}

	const removeHeatmapViewportSyncListener = () => {

		if( graph.value === null ) return
		if( heatmapViewportSyncHandler === null ) return
		if( typeof graph.value.removeListener !== "function" ) return

		graph.value.removeListener( "plotly_relayout", heatmapViewportSyncHandler )
		heatmapViewportSyncHandler = null
	}

	const syncHeatmapViewportSyncListener = () => {

		removeHeatmapViewportSyncListener()

		if( graph.value === null ) return
		if( heatmapRendererMode.value !== "deckgl" ) return
		if( typeof graph.value.on !== "function" ) return

		heatmapViewportSyncHandler = () => {
			void syncExternalHeatmapRenderer()
		}

		graph.value.on( "plotly_relayout", heatmapViewportSyncHandler )
	}

	const clearHeatmapModebarGraphListeners = () => {

		for( const listenerEntry of heatmapModebarGraphListeners ){
			listenerEntry.element.removeEventListener( listenerEntry.eventName, listenerEntry.handler )
		}

		heatmapModebarGraphListeners = []
	}

	const syncHeatmapModebarGraphListeners = () => {

		clearHeatmapModebarGraphListeners()

		if( graph.value === null ) return

		const interactionHandler = ( event ) => {
			if( typeof event?.detail?.zoomAspectRatio === "string" ){
				setHeatmapZoomAspectRatio( event.detail.zoomAspectRatio )
			}
			setHeatmapInteractionMode( event?.detail?.mode )
		}
		const resetHandler = () => {
			void handleHeatmapResetZoom()
		}

		graph.value.addEventListener( HEATMAP_INTERACTION_CHANGE_EVENT, interactionHandler )
		graph.value.addEventListener( HEATMAP_RESET_VIEW_EVENT, resetHandler )

		heatmapModebarGraphListeners.push({
			element: graph.value,
			eventName: HEATMAP_INTERACTION_CHANGE_EVENT,
			handler: interactionHandler
		})
		heatmapModebarGraphListeners.push({
			element: graph.value,
			eventName: HEATMAP_RESET_VIEW_EVENT,
			handler: resetHandler
		})
	}

	const resetHeatmapToolbarState = () => {
		removeHeatmapViewportSyncListener()
		clearHeatmapModebarGraphListeners()
	}

	const finalizeHeatmapRender = async ( renderStartedAt = null ) => {
		if( heatmapRendererMode.value !== "deckgl" || heatmapInteractionMode.value === "zoom" ){
			await applyHeatmapInteraction()
		}
		syncHeatmapViewportSyncListener()
		await syncExternalHeatmapRenderer()

		if( heatmapRendererMode.value === "plotly" && Number.isFinite( renderStartedAt ) ){
			heatmapRenderBenchmark.value = {
				renderer: "plotly",
				viewMode: activePlot.value,
				initialRenderMs: performance.now() - renderStartedAt,
				lastMeasuredAt: new Date().toISOString()
			}
		}
	}

	return {
		heatmapRendererMode,
		heatmapZoomAspectRatio,
		heatmapInteractionMode,
		normalizeHeatmapInteraction,
		normalizeHeatmapRendererMode,
		normalizeHeatmapZoomAspectRatio,
		setHeatmapInteractionMode,
		setHeatmapZoomAspectRatio,
		applyHeatmapInteraction,
		handleHeatmapZoomRange,
		handleHeatmapResetZoom,
		syncExternalHeatmapRenderer,
		removeHeatmapViewportSyncListener,
		syncHeatmapViewportSyncListener,
		syncHeatmapModebarGraphListeners,
		clearHeatmapModebarGraphListeners,
		resetHeatmapToolbarState,
		finalizeHeatmapRender
	}
}

export {
	normalizeHeatmapInteraction,
	normalizeHeatmapRendererMode,
	normalizeHeatmapZoomAspectRatio,
	useHyperspectrumHeatmapToolbarState
}
