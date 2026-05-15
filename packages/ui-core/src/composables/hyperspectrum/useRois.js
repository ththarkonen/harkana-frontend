import { createRoiRepository } from "./rois/repository.js"
import {
	extractEstimateSpectrumFromRoi,
	normalizeRoiBoundsPayload,
	normalizeRoiNumericSeries
} from "./rois/normalizers.js"
import { createRoiState } from "./rois/state.js"

function useHyperspectrumRois( options ){

	const state = createRoiState({
		settings: options.settings,
		defaultRoiSpectrumPalette: options.defaultRoiSpectrumPalette
	})
	const repository = createRoiRepository({
		state,
		project: options.project,
		cacheOptions: options.cacheOptions,
		hyperspectrumCache: options.hyperspectrumCache,
		hyperspectra: options.hyperspectra,
		activeGroupID: options.activeGroupID,
		estimateConfidenceLevels: options.estimateConfidenceLevels,
		normalizeSelectionBoundingBox: options.normalizeSelectionBoundingBox,
		canMutateRois: options.canMutateRois,
		selectedHeatmapBoundingBox: options.selectedHeatmapBoundingBox,
		hasEstimatedRamanSpectraReady: options.hasEstimatedRamanSpectraReady,
		spectrumSelectionMode: options.spectrumSelectionMode,
		dataTypeForSpectrumSource: options.dataTypeForSpectrumSource,
		dataSourceForSpectrumSource: options.dataSourceForSpectrumSource,
		confidenceLevelsForSpectrumSource: options.confidenceLevelsForSpectrumSource,
		queueSpectraPanelRender: options.queueSpectraPanelRender,
		rerenderHeatmap: options.rerenderHeatmap
	})

	return {
		...state,
		...repository
	}
}

export {
	extractEstimateSpectrumFromRoi,
	normalizeRoiBoundsPayload,
	normalizeRoiNumericSeries,
	useHyperspectrumRois
}
