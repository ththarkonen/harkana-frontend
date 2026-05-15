import { createProjectBackgroundWork } from "./preload/backgroundWork.js"
import { createLayerWindowPreloader } from "./preload/layerWindow.js"
import { createPreparationState } from "./preload/preparationState.js"
import { createVisualizationTargetPreloader } from "./preload/visualizationTargets.js"

function useHyperspectrumPreloadQueue( options ){

	const preparationState = createPreparationState( options.emitLoaded )
	const backgroundWork = createProjectBackgroundWork({
		activeProjectLoadRequestID: options.activeProjectLoadRequestID
	})
	const layerWindow = createLayerWindowPreloader({
		activePlot: options.activePlot,
		graph: options.graph,
		heatmapRendererMode: options.heatmapRendererMode,
		project: options.project,
		maxLayerIndex: options.maxLayerIndex,
		layerInput: options.layerInput,
		cacheOptions: options.cacheOptions,
		layerCacheOptions: options.layerCacheOptions,
		normalizeLayerInput: options.normalizeLayerInput,
		loadEstimatedArtifact: options.loadEstimatedArtifact,
		hyperspectrumCache: options.hyperspectrumCache,
		hyperspectrum: options.hyperspectrum,
		layerHeatmapColorscale: options.layerHeatmapColorscale
	})
	const visualizationTargets = createVisualizationTargetPreloader({
		nextTick: options.nextTick,
		graph: options.graph,
		project: options.project,
		activeProjectLoadRequestID: options.activeProjectLoadRequestID,
		heatmapRendererMode: options.heatmapRendererMode,
		heatmapUsesEstimatedRaman: options.heatmapUsesEstimatedRaman,
		mip: options.mip,
		cacheOptions: options.cacheOptions,
		layerCacheOptions: options.layerCacheOptions,
		layerInput: options.layerInput,
		pcaClassificationComponentCount: options.pcaClassificationComponentCount,
		pcaMipComponentCount: options.pcaMipComponentCount,
		pcaComponentIndices: options.pcaComponentIndices,
		activePcaClassificationCount: options.activePcaClassificationCount,
		resetActivePcaComponents: options.resetActivePcaComponents,
		normalizeLayerInput: options.normalizeLayerInput,
		normalizePcaComponentInput: options.normalizePcaComponentInput,
		decompositionMipMode: options.decompositionMipMode,
		decompositionScoreMode: options.decompositionScoreMode,
		loadEstimatedArtifact: options.loadEstimatedArtifact,
		loadEstimatedMip: options.loadEstimatedMip,
		loadEstimatedMipHsv: options.loadEstimatedMipHsv,
		loadEstimatedUmap: options.loadEstimatedUmap,
		loadEstimatedLayer: options.loadEstimatedLayer,
		loadEstimatedPcaClassificationMip: options.loadEstimatedPcaClassificationMip,
		loadEstimatedPcaMip: options.loadEstimatedPcaMip,
		loadEstimatedPcaClassification: options.loadEstimatedPcaClassification,
		loadEstimatedRpcaClassificationMip: options.loadEstimatedRpcaClassificationMip,
		loadEstimatedRpcaMip: options.loadEstimatedRpcaMip,
		loadEstimatedRpcaClassification: options.loadEstimatedRpcaClassification,
		loadMipHsv: options.loadMipHsv,
		loadUmap: options.loadUmap,
		loadLayer: options.loadLayer,
		loadZBlendSource: options.loadZBlendSource,
		loadPcaClassificationMip: options.loadPcaClassificationMip,
		loadPcaMip: options.loadPcaMip,
		loadPcaClassification: options.loadPcaClassification,
		loadRpcaClassificationMip: options.loadRpcaClassificationMip,
		loadRpcaMip: options.loadRpcaMip,
		loadRpcaClassification: options.loadRpcaClassification,
		resolvePrioritizedPreparationTargets: options.resolvePrioritizedPreparationTargets,
		resolveDeferredPreparationTargets: options.resolveDeferredPreparationTargets,
		resolveTrailingPreparationTargets: options.resolveTrailingPreparationTargets,
		prewarmVisualizationTargetPayload: options.prewarmVisualizationTargetPayload,
		hyperspectrumCache: options.hyperspectrumCache,
		preparationState,
		backgroundWork,
		layerWindow
	})

	return {
		currentPreparationTarget: preparationState.currentPreparationTarget,
		queuedPreparationTargets: preparationState.queuedPreparationTargets,
		completedPreparationTargets: preparationState.completedPreparationTargets,
		failedPreparationTargets: preparationState.failedPreparationTargets,
		viewerLoadedEmitted: preparationState.viewerLoadedEmitted,
		pendingPreparationTargets: preparationState.pendingPreparationTargets,
		showDisplayInfoIcon: preparationState.showDisplayInfoIcon,
		activeLayerPayloadPrewarmRequestID: layerWindow.activeLayerPayloadPrewarmRequestID,
		resetPreparationState: preparationState.resetPreparationState,
		markPreparationStarted: preparationState.markPreparationStarted,
		markPreparationCompleted: preparationState.markPreparationCompleted,
		markPreparationFailed: preparationState.markPreparationFailed,
		emitLoadedOnce: preparationState.emitLoadedOnce,
		installProjectBackgroundInteractionListeners: backgroundWork.installProjectBackgroundInteractionListeners,
		removeBackgroundInteractionListeners: backgroundWork.removeBackgroundInteractionListeners,
		clearProjectBackgroundWork: backgroundWork.clearProjectBackgroundWork,
		loadVisualizationTargetData: visualizationTargets.loadVisualizationTargetData,
		queueProjectBackgroundHydration: visualizationTargets.queueProjectBackgroundHydration,
		scheduleDisplayPayloadPrewarm: visualizationTargets.scheduleDisplayPayloadPrewarm,
		resolveLayerWindowIndices: layerWindow.resolveLayerWindowIndices,
		prefetchMeasurementLayerWindow: layerWindow.prefetchMeasurementLayerWindow,
		prefetchEstimatedLayerWindow: layerWindow.prefetchEstimatedLayerWindow,
		ensureMeasurementLayerWindowReady: layerWindow.ensureMeasurementLayerWindowReady,
		ensureEstimatedLayerWindowReady: layerWindow.ensureEstimatedLayerWindowReady,
		scheduleLayerPayloadPrewarm: layerWindow.scheduleLayerPayloadPrewarm,
		invalidateDisplayPayloadPrewarm: visualizationTargets.invalidateDisplayPayloadPrewarm,
		invalidateLayerPayloadPrewarm: layerWindow.invalidateLayerPayloadPrewarm
	}
}

export { useHyperspectrumPreloadQueue }
