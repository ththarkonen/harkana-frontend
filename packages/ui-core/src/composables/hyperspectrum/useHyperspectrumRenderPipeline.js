import { ref } from "vue"

export function useHyperspectrumRenderPipeline( options ){

	const nextTick = options.nextTick
	const graph = options.graph
	const deckTopPanelGraph = options.deckTopPanelGraph
	const deckBottomPanelGraph = options.deckBottomPanelGraph
	const settings = options.settings
	const hyperspectrum = options.hyperspectrum
	const resolveCurrentPlotRenderSpec = options.resolveCurrentPlotRenderSpec
	const currentMatrix = options.currentMatrix
	const bottomLeftSpectrumOptions = options.bottomLeftSpectrumOptions
	const topLeftSpectrumOptions = options.topLeftSpectrumOptions
	const topSpectrumGridlineSourceKey = options.topSpectrumGridlineSourceKey
	const bottomSpectrumGridlineSourceKey = options.bottomSpectrumGridlineSourceKey
	const normalizeProjectSpectrumGridlineState = options.normalizeProjectSpectrumGridlineState
	const projectSpectrumGridlinesVisible = options.projectSpectrumGridlinesVisible
	const activeRoiOverlays = options.activeRoiOverlays
	const plotAxes = options.plotAxes
	const heatmapRendererMode = options.heatmapRendererMode
	const topSpectrumPaneLegendVisible = options.topSpectrumPaneLegendVisible
	const hoveredSpectrumLegendKey = options.hoveredSpectrumLegendKey
	const normalizedHiddenSpectrumLegendKeys = options.normalizedHiddenSpectrumLegendKeys
	const activePlot = options.activePlot
	const ensureZBlendVisualizationMatrix = options.ensureZBlendVisualizationMatrix
	const ensureEstimatedVisualizationMatrix = options.ensureEstimatedVisualizationMatrix
	const ensureActivePlotLoadings = options.ensureActivePlotLoadings
	const syncSpectrumPlotGraphListeners = options.syncSpectrumPlotGraphListeners
	const syncHeatmapModebarGraphListeners = options.syncHeatmapModebarGraphListeners
	const syncHeatmapModebarState = options.syncHeatmapModebarState
	const heatmapInteractionMode = options.heatmapInteractionMode
	const heatmapZoomAspectRatio = options.heatmapZoomAspectRatio
	const applyProjectSpectrumGridlineState = options.applyProjectSpectrumGridlineState
	const deckHeatmapPaneWidth = options.deckHeatmapPaneWidth
	const deckHeatmapPaneWidthTouched = options.deckHeatmapPaneWidthTouched
	const deckTopSpectrumPaneHeight = options.deckTopSpectrumPaneHeight
	const deckTopSpectrumPaneHeightTouched = options.deckTopSpectrumPaneHeightTouched
	const defaultDeckHeatmapPaneWidth = options.defaultDeckHeatmapPaneWidth
	const defaultDeckTopSpectrumPaneHeight = options.defaultDeckTopSpectrumPaneHeight
	const matrixDimensions = options.matrixDimensions
	const queueDeckPaneResponsiveResize = options.queueDeckPaneResponsiveResize
	const reconcileDeckHeatmapPaneWidthWithPlotlyLayout = options.reconcileDeckHeatmapPaneWidthWithPlotlyLayout
	const finalizeHeatmapRender = options.finalizeHeatmapRender
	const heatmapRenderBenchmarkToken = options.heatmapRenderBenchmarkToken
	const pendingDeckRenderBenchmark = options.pendingDeckRenderBenchmark

	const lastDeckUpperPanelKey = ref( "" )
	const lastDeckLowerPanelKey = ref( "" )
	const lastDeckHeatmapPaneKey = ref( "" )

	const deckPanelObjectIDs = new WeakMap()
	let nextDeckPanelObjectID = 1
	let queuedSpectraPanelRender = Promise.resolve()

	const deckPanelObjectKey = ( value ) => {

		if( value !== null && typeof value === "object" ){
			if( deckPanelObjectIDs.has( value ) === false ){
				deckPanelObjectIDs.set( value, nextDeckPanelObjectID )
				nextDeckPanelObjectID += 1
			}

			return "object:" + deckPanelObjectIDs.get( value )
		}

		return "primitive:" + String( value )
	}

	const serializeDeckPanelKeyPart = ( value ) => {

		if( Array.isArray( value ) ){
			return "[" + value.map(( entry ) => serializeDeckPanelKeyPart( entry )).join( "," ) + "]"
		}

		if( value !== null && typeof value === "object" ){
			const keys = Object.keys( value ).sort()
			return "{" + keys.map(( key ) => key + ":" + serializeDeckPanelKeyPart( value[key] )).join( "," ) + "}"
		}

		return String( value )
	}

	const deckPanelSettingsKey = () => {
		return JSON.stringify({
			font: settings.value?.font ?? null,
			labels: settings.value?.labels ?? null,
			layout: {
				heatmapOrigin: settings.value?.layout?.heatmapOrigin ?? null
			}
		})
	}

	const spectrumPayloadRenderKey = ( payload ) => {

		if( payload === null || payload === undefined ){
			return "null"
		}

		if( Array.isArray( payload ) ){
			return "array:" + deckPanelObjectKey( payload )
		}

		if( typeof payload !== "object" ){
			return "primitive:" + String( payload )
		}

		return [
			"spectrum=" + deckPanelObjectKey( payload?.spectrum ?? payload?.meanSpectrum ?? null ),
			"lower=" + deckPanelObjectKey( payload?.lowerBound ?? null ),
			"upper=" + deckPanelObjectKey( payload?.upperBound ?? null ),
			"xy=" + deckPanelObjectKey( payload?.xy ?? null ),
			"length=" + String( payload?.spectrumLength ?? "" )
		].join( "," )
	}

	const spectrumPayloadListRenderKey = ( payloads ) => {
		if( Array.isArray( payloads ) === false ){
			return spectrumPayloadRenderKey( payloads ?? null )
		}

		return payloads.map(( payload ) => spectrumPayloadRenderKey( payload )).join( ";" )
	}

	const upperPanelRenderKey = ( renderOptions ) => {
		return [
			"settings=" + deckPanelSettingsKey(),
			"source=" + String( renderOptions?.topSpectrumGridlineSource ?? "" ),
			"axes=" + deckPanelObjectKey( renderOptions?.axes ?? null ),
			"roi=" + spectrumPayloadListRenderKey( renderOptions?.topLeftSpectrum?.rois ?? renderOptions?.topLeftSpectrum?.roi ?? null ),
			"current=" + spectrumPayloadRenderKey( renderOptions?.topLeftSpectrum?.current ?? null ),
			"showFallback=" + String( renderOptions?.topLeftSpectrum?.showFallback === true ),
			"loadings=" + deckPanelObjectKey( renderOptions?.loadings ?? null ),
			"loadingSeries=" + serializeDeckPanelKeyPart( renderOptions?.loadingSeries ?? [] ),
			"loadingComponents=" + serializeDeckPanelKeyPart( renderOptions?.loadingComponents ?? [] )
		].join( "|" )
	}

	const lowerPanelRenderKey = ( renderOptions ) => {
		return [
			"settings=" + deckPanelSettingsKey(),
			"source=" + String( renderOptions?.bottomSpectrumGridlineSource ?? "" ),
			"axes=" + deckPanelObjectKey( renderOptions?.axes ?? null ),
			"selected=" + spectrumPayloadRenderKey( renderOptions?.selectedSpectrum ?? null ),
			"roi=" + spectrumPayloadListRenderKey( renderOptions?.bottomLeftSpectrum?.rois ?? renderOptions?.bottomLeftSpectrum?.roi ?? null ),
			"current=" + spectrumPayloadRenderKey( renderOptions?.bottomLeftSpectrum?.current ?? null )
		].join( "|" )
	}

	const heatmapPaneLayoutKey = ( matrix, axes ) => {

		const dimensions = matrixDimensions( matrix )
		if( dimensions === null ){
			return ""
		}

		return [
			"settings=" + deckPanelSettingsKey(),
			"axes=" + deckPanelObjectKey( axes ?? null ),
			"width=" + String( dimensions.width ),
			"height=" + String( dimensions.height )
		].join( "|" )
	}

	const resetDeckPanelRenderKeys = () => {
		lastDeckUpperPanelKey.value = ""
		lastDeckLowerPanelKey.value = ""
		lastDeckHeatmapPaneKey.value = ""
	}

	const plotlyGraphHasData = ( graphContainer ) => {
		return Array.isArray( graphContainer?.data ) && graphContainer.data.length > 0
	}

	const renderDeckSidePanels = async ( plotOptions, initialize = false ) => {

		if( deckTopPanelGraph.value === null || deckBottomPanelGraph.value === null ){
			return
		}

		deckTopPanelGraph.value.__harkanaSpectrumLegendVisible = topSpectrumPaneLegendVisible.value
		deckTopPanelGraph.value.__harkanaSpectrumHighlightGroup = hoveredSpectrumLegendKey.value
		deckBottomPanelGraph.value.__harkanaSpectrumHighlightGroup = hoveredSpectrumLegendKey.value
		deckTopPanelGraph.value.__harkanaHiddenSpectrumTraceGroups = normalizedHiddenSpectrumLegendKeys.value
		deckBottomPanelGraph.value.__harkanaHiddenSpectrumTraceGroups = normalizedHiddenSpectrumLegendKeys.value

		const nextUpperKey = upperPanelRenderKey( plotOptions )
		const nextLowerKey = lowerPanelRenderKey( plotOptions )
		const shouldRenderUpper = initialize ||
			nextUpperKey !== lastDeckUpperPanelKey.value ||
			plotlyGraphHasData( deckTopPanelGraph.value ) === false
		const shouldRenderLower = initialize ||
			nextLowerKey !== lastDeckLowerPanelKey.value ||
			plotlyGraphHasData( deckBottomPanelGraph.value ) === false

		if( shouldRenderUpper ){
			const upperRenderer = plotlyGraphHasData( deckTopPanelGraph.value ) ? hyperspectrum.updateUpperPanel : hyperspectrum.initializeUpperPanel
			await upperRenderer( deckTopPanelGraph.value, settings.value, plotOptions )
			lastDeckUpperPanelKey.value = nextUpperKey
		}

		if( shouldRenderLower ){
			const lowerRenderer = plotlyGraphHasData( deckBottomPanelGraph.value ) ? hyperspectrum.updateLowerPanel : hyperspectrum.initializeLowerPanel
			await lowerRenderer( deckBottomPanelGraph.value, settings.value, plotOptions )
			lastDeckLowerPanelKey.value = nextLowerKey
		}
	}

	const renderDeckHeatmapPane = async ( matrix, plotSpec, initialize = false ) => {

		if( graph.value === null ) return

		const nextPaneKey = heatmapPaneLayoutKey( matrix, plotSpec.options?.axes )
		const shouldRenderPaneFigure = initialize ||
			nextPaneKey !== lastDeckHeatmapPaneKey.value ||
			plotlyGraphHasData( graph.value ) === false
		const renderOptions = {
			...plotSpec.options,
			panelMode: "heatmap-only",
			skipFigureRender: shouldRenderPaneFigure === false
		}
		const renderFunction = shouldRenderPaneFigure || plotlyGraphHasData( graph.value ) === false
			? plotSpec.initialize
			: plotSpec.update

		await renderFunction( matrix, graph.value, settings.value, renderOptions )
		lastDeckHeatmapPaneKey.value = nextPaneKey
	}

	const currentPlotSharedOptions = () => {

		const bottomLeftOptions = bottomLeftSpectrumOptions()

		return {
			selectedSpectrum: bottomLeftOptions.selectedSpectrum,
			bottomLeftSpectrum: bottomLeftOptions.bottomLeftSpectrum,
			topLeftSpectrum: topLeftSpectrumOptions(),
			topSpectrumGridlineSource: topSpectrumGridlineSourceKey(),
			bottomSpectrumGridlineSource: bottomSpectrumGridlineSourceKey(),
			projectSpectrumGridlines: normalizeProjectSpectrumGridlineState( projectSpectrumGridlinesVisible.value ),
			roiOverlays: activeRoiOverlays(),
			axes: plotAxes(),
			heatmapRenderer: heatmapRendererMode.value
		}
	}

	const renderCurrentSpectraPanels = async () => {

		if( graph.value === null ) return

		const matrix = currentMatrix()
		if( matrix === null ) return

		const plotSpec = resolveCurrentPlotRenderSpec( currentPlotSharedOptions() )

		if( heatmapRendererMode.value === "deckgl" ){
			await renderDeckSidePanels( plotSpec.options, false )
			return
		}

		const renderFunction = plotlyGraphHasData( graph.value ) ? plotSpec.update : plotSpec.initialize
		await renderFunction( matrix, graph.value, settings.value, plotSpec.options )
	}

	const queueSpectraPanelRender = () => {
		queuedSpectraPanelRender = queuedSpectraPanelRender
			.catch(() => {})
			.then(() => renderCurrentSpectraPanels() )

		return queuedSpectraPanelRender
	}

	const renderCurrentMatrix = async ( initialize = false ) => {

		if( activePlot.value === "z_blend" ){
			await ensureZBlendVisualizationMatrix( "high" )
		} else if( options.heatmapUsesEstimatedRaman.value ){
			await ensureEstimatedVisualizationMatrix( "high" )
		}

		await ensureActivePlotLoadings( "high" )

		if( heatmapRendererMode.value === "deckgl" &&
			( graph.value === null || deckTopPanelGraph.value === null || deckBottomPanelGraph.value === null )){
			await nextTick()
		}

		syncSpectrumPlotGraphListeners()
		syncHeatmapModebarGraphListeners()
		syncHeatmapModebarState( graph.value, heatmapInteractionMode.value, heatmapZoomAspectRatio.value )
		await applyProjectSpectrumGridlineState( projectSpectrumGridlinesVisible.value )

		const matrix = currentMatrix()
		if( matrix === null || graph.value === null ) return
		if( heatmapRendererMode.value === "deckgl" && deckHeatmapPaneWidthTouched.value === false ){
			deckHeatmapPaneWidth.value = defaultDeckHeatmapPaneWidth()
		}
		if( heatmapRendererMode.value === "deckgl" && deckTopSpectrumPaneHeightTouched.value === false ){
			deckTopSpectrumPaneHeight.value = defaultDeckTopSpectrumPaneHeight()
		}
		const renderStartedAt = performance.now()
		if( heatmapRendererMode.value === "deckgl" ){
			const benchmarkToken = heatmapRenderBenchmarkToken.value + 1
			heatmapRenderBenchmarkToken.value = benchmarkToken
			pendingDeckRenderBenchmark.value = {
				token: benchmarkToken,
				startedAt: renderStartedAt,
				viewMode: activePlot.value
			}
		} else {
			pendingDeckRenderBenchmark.value = null
		}
		const plotSpec = resolveCurrentPlotRenderSpec( currentPlotSharedOptions() )

		if( heatmapRendererMode.value === "deckgl" ){
			await renderDeckSidePanels( plotSpec.options, initialize )
			await renderDeckHeatmapPane( matrix, plotSpec, initialize )
			await finalizeHeatmapRender( renderStartedAt )
			if( reconcileDeckHeatmapPaneWidthWithPlotlyLayout( matrix ) ){
				queueDeckPaneResponsiveResize()
			}
			return
		}

		const renderFunction = initialize ? plotSpec.initialize : plotSpec.update
		await renderFunction( matrix, graph.value, settings.value, plotSpec.options )
		await finalizeHeatmapRender( renderStartedAt )
	}

	return {
		resetDeckPanelRenderKeys,
		renderCurrentSpectraPanels,
		queueSpectraPanelRender,
		renderCurrentMatrix
	}
}
