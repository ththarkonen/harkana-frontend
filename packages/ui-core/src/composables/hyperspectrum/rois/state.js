import { computed, ref, shallowRef } from "vue"

export function createRoiState( options ){

	const settings = options.settings
	const defaultRoiSpectrumPalette = Array.isArray( options.defaultRoiSpectrumPalette )
		? options.defaultRoiSpectrumPalette
		: [
			"#ff7f0e",
			"#2ca02c",
			"#d62728",
			"#9467bd",
			"#8c564b",
			"#e377c2",
			"#7f7f7f",
			"#bcbd22",
			"#17becf",
			"#333333"
		]

	const rois = ref( [] )
	const selectedRoiIds = ref( [] )
	const refreshingRois = ref( false )
	const savingRoi = ref( false )
	const deletingRoi = ref( false )
	const ramanRoiSpectraById = shallowRef({})
	const estimatedRoiList = ref( [] )
	const estimatedRoiListMode = ref( "" )
	const estimatedRoiListAttempted = ref( false )
	const activeRamanRoiRequestIDs = ref({})

	const isRoiRefreshDisabled = computed(() => refreshingRois.value )

	const selectedRoi = computed(() => {
		if( selectedRoiIds.value.length !== 1 ) return null

		const selectedId = String( selectedRoiIds.value[0] ?? "" ).trim()
		return rois.value.find(( roi ) => String( roi?.roiId ?? "" ).trim() === selectedId ) ?? null
	})

	const selectedRoiIdSet = computed(() => {
		return new Set(
			( Array.isArray( selectedRoiIds.value ) ? selectedRoiIds.value : [] )
				.map(( roiId ) => String( roiId ?? "" ).trim() )
				.filter(( roiId ) => roiId.length > 0 )
		)
	})

	const selectedRois = computed(() => {
		const selectedIds = selectedRoiIdSet.value
		if( selectedIds.size === 0 ){
			return []
		}

		return rois.value.filter(( roi ) => selectedIds.has( String( roi?.roiId ?? "" ).trim() ))
	})

	const showAllRoiOverlays = computed(() => {
		return rois.value.length > 0 && selectedRois.value.length === rois.value.length
	})

	const roiSelectOptions = computed(() => {
		return rois.value.map(( roi ) => ({
			value: String( roi?.roiId ?? "" ),
			label: String( roi?.name ?? "Unnamed ROI" )
		}))
	})

	const roiDropdownSummaryLabel = computed(() => {
		if( selectedRoiIdSet.value.size === 0 ){
			return "No regions selected"
		}

		if( selectedRoiIdSet.value.size === 1 ){
			return selectedRois.value[0]?.name ?? "1 region selected"
		}

		return `${selectedRoiIdSet.value.size} regions selected`
	})

	const activeDisplayedRois = computed(() => selectedRois.value )

	const resolvedRoiSpectrumPalette = computed(() => {
		const storedPalette = Array.isArray( settings.value?.hyperspectrumColors?.roiPalette )
			? settings.value.hyperspectrumColors.roiPalette
			: []
		const normalizedPalette = storedPalette
			.map(( entry ) => String( entry ?? "" ).trim() )
			.filter(( entry ) => entry.length > 0 )

		if( normalizedPalette.length > 0 ){
			return normalizedPalette
		}

		const storedPrimaryColor = String( settings.value?.hyperspectrumColors?.roiSpectrum ?? "" ).trim()
		if( storedPrimaryColor.length > 0 ){
			return [ storedPrimaryColor, ...defaultRoiSpectrumPalette.slice( 1 ) ]
		}

		return defaultRoiSpectrumPalette
	})

	const roiDisplayStylesById = computed(() => {
		const activeRois = activeDisplayedRois.value
		var styles = {}
		const roiBoxColor = settings.value?.hyperspectrumColors?.roiBox ??
			settings.value?.hyperspectrumColors?.roiOverlay ??
			"#ffffff"
		const roiTitleColor = settings.value?.hyperspectrumColors?.roiTitle ??
			settings.value?.hyperspectrumColors?.roiOverlay ??
			roiBoxColor
		const spectrumPalette = resolvedRoiSpectrumPalette.value

		for( let index = 0; index < activeRois.length; index++ ){
			const roi = activeRois[index] ?? null
			const roiId = String( roi?.roiId ?? "" ).trim()
			if( roiId.length === 0 ) continue

			const color = spectrumPalette[index % spectrumPalette.length]
			styles[roiId] = {
				lineColor: color,
				intervalColor: color,
				boxColor: roiBoxColor,
				titleColor: roiTitleColor
			}
		}

		return styles
	})

	const isSelectedRoiId = ( roiId ) => {
		const normalizedId = String( roiId ?? "" ).trim()
		if( normalizedId.length === 0 ) return false

		return selectedRoiIdSet.value.has( normalizedId )
	}

	const clearSelectedRois = () => {
		selectedRoiIds.value = []
	}

	const toggleSelectedRoiId = ( nextValue ) => {
		const normalizedId = String( nextValue ?? "" ).trim()
		if( normalizedId.length === 0 ){
			clearSelectedRois()
			return
		}

		if( selectedRoiIdSet.value.has( normalizedId ) ){
			selectedRoiIds.value = selectedRoiIds.value
				.map(( roiId ) => String( roiId ?? "" ).trim() )
				.filter(( roiId ) => roiId.length > 0 && roiId !== normalizedId )
			return
		}

		selectedRoiIds.value = [
			...selectedRoiIds.value
				.map(( roiId ) => String( roiId ?? "" ).trim() )
				.filter(( roiId ) => roiId.length > 0 ),
			normalizedId
		]
	}

	const cachedRamanRoiSpectrumForId = ( roiId ) => {
		const normalizedId = String( roiId ?? "" ).trim()
		if( normalizedId.length === 0 ) return null

		return ramanRoiSpectraById.value?.[ normalizedId ] ?? null
	}

	const estimatedRoiSpectrumForId = ( roiId ) => {
		const normalizedId = String( roiId ?? "" ).trim()
		if( normalizedId.length === 0 ) return null

		return estimatedRoiList.value.find(( roi ) => roi.roiId === normalizedId ) ?? null
	}

	const roiSpectrumStyleForId = ( roiId ) => {
		const normalizedId = String( roiId ?? "" ).trim()
		const fallbackColor = resolvedRoiSpectrumPalette.value[0] ?? "#333333"
		const fallbackBoxColor = settings.value?.hyperspectrumColors?.roiBox ??
			settings.value?.hyperspectrumColors?.roiOverlay ??
			"#ffffff"
		const fallbackTitleColor = settings.value?.hyperspectrumColors?.roiTitle ??
			settings.value?.hyperspectrumColors?.roiOverlay ??
			fallbackBoxColor

		return roiDisplayStylesById.value?.[ normalizedId ] ?? {
			lineColor: fallbackColor,
			intervalColor: fallbackColor,
			boxColor: fallbackBoxColor,
			titleColor: fallbackTitleColor
		}
	}

	const resetEstimatedRoiArtifacts = () => {
		estimatedRoiList.value = []
		estimatedRoiListMode.value = ""
		estimatedRoiListAttempted.value = false
		ramanRoiSpectraById.value = {}
		activeRamanRoiRequestIDs.value = {}
	}

	const cacheRamanRoiSpectrum = ( roiId, payload ) => {
		const normalizedId = String( roiId ?? "" ).trim()
		if( normalizedId.length === 0 ) return

		ramanRoiSpectraById.value = {
			...ramanRoiSpectraById.value,
			[ normalizedId ]: payload ?? null
		}
	}

	const nextRamanRoiRequestID = ( roiId ) => {
		const normalizedId = String( roiId ?? "" ).trim()
		const nextRequestID = Number( activeRamanRoiRequestIDs.value?.[ normalizedId ] ?? 0 ) + 1

		activeRamanRoiRequestIDs.value = {
			...activeRamanRoiRequestIDs.value,
			[ normalizedId ]: nextRequestID
		}

		return nextRequestID
	}

	const isCurrentRamanRoiRequest = ( roiId, requestID ) => {
		const normalizedId = String( roiId ?? "" ).trim()
		return Number( activeRamanRoiRequestIDs.value?.[ normalizedId ] ?? 0 ) === requestID
	}

	const resetRoiState = () => {
		rois.value = []
		selectedRoiIds.value = []
		refreshingRois.value = false
		savingRoi.value = false
		deletingRoi.value = false
		resetEstimatedRoiArtifacts()
	}

	return {
		rois,
		selectedRoiIds,
		refreshingRois,
		savingRoi,
		deletingRoi,
		ramanRoiSpectraById,
		estimatedRoiList,
		estimatedRoiListMode,
		estimatedRoiListAttempted,
		activeRamanRoiRequestIDs,
		isRoiRefreshDisabled,
		selectedRoi,
		selectedRoiIdSet,
		selectedRois,
		showAllRoiOverlays,
		roiSelectOptions,
		roiDropdownSummaryLabel,
		activeDisplayedRois,
		resolvedRoiSpectrumPalette,
		roiDisplayStylesById,
		isSelectedRoiId,
		clearSelectedRois,
		toggleSelectedRoiId,
		cachedRamanRoiSpectrumForId,
		estimatedRoiSpectrumForId,
		roiSpectrumStyleForId,
		resetEstimatedRoiArtifacts,
		cacheRamanRoiSpectrum,
		nextRamanRoiRequestID,
		isCurrentRamanRoiRequest,
		resetRoiState
	}
}
