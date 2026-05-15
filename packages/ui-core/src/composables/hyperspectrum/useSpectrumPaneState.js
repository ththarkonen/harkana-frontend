import { computed, ref, watch } from "vue"

function waitForAnimationFrame(){
	return new Promise(( resolve ) => {
		if( typeof window !== "undefined" && typeof window.requestAnimationFrame === "function" ){
			window.requestAnimationFrame(() => resolve() )
			return
		}
		const timerScope = typeof window !== "undefined" ? window : globalThis
		timerScope.setTimeout( resolve, 0 )
	})
}

export function useSpectrumPaneState( options ){

	const nextTick = options.nextTick
	const deckTopPanelGraph = options.deckTopPanelGraph
	const deckBottomPanelGraph = options.deckBottomPanelGraph
	const hyperspectrum = options.hyperspectrum
	const resizePlotlyContainer = options.resizePlotlyContainer
	const activePlot = options.activePlot
	const showPcaLoadings = options.showPcaLoadings
	const showSelectedSpectra = options.showSelectedSpectra
	const spectrumSelectionMode = options.spectrumSelectionMode
	const resolvedPrimarySpectrumSource = options.resolvedPrimarySpectrumSource
	const resolvedSecondarySpectrumSource = options.resolvedSecondarySpectrumSource
	const normalizeSpectrumSource = options.normalizeSpectrumSource
	const latestMeasurementSelectedSpectrum = options.latestMeasurementSelectedSpectrum
	const latestMeasurementSingleSpectrum = options.latestMeasurementSingleSpectrum
	const latestMeasurementMeanSpectrum = options.latestMeasurementMeanSpectrum
	const latestRamanSelectedSpectrum = options.latestRamanSelectedSpectrum
	const latestRamanSingleSpectrum = options.latestRamanSingleSpectrum
	const latestRamanMeanSpectrum = options.latestRamanMeanSpectrum
	const withSelectedConfidenceBounds = options.withSelectedConfidenceBounds
	const withSpectrumLegendName = options.withSpectrumLegendName
	const activeDisplayedRois = options.activeDisplayedRois
	const roiSpectrumStyleForId = options.roiSpectrumStyleForId
	const estimatedRoiSpectrumForId = options.estimatedRoiSpectrumForId
	const cachedRamanRoiSpectrumForId = options.cachedRamanRoiSpectrumForId
	const roiEstimateUncertaintyLevelValue = options.roiEstimateUncertaintyLevelValue
	const roiEstimateUncertaintyNumericLevel = options.roiEstimateUncertaintyNumericLevel
	const confidenceNoneValue = options.confidenceNoneValue
	const resolveConfidenceBoundSeries = options.resolveConfidenceBoundSeries
	const queriedSpectrumLegendColor = options.queriedSpectrumLegendColor
	const resolvedRoiSpectrumPalette = options.resolvedRoiSpectrumPalette
	const activeLoadingLegendEntries = options.activeLoadingLegendEntries
	const isSelectionSpectrumQuerying = options.isSelectionSpectrumQuerying
	const legendHoverEmphasisEnabled = options.legendHoverEmphasisEnabled

	const topSpectrumPaneLegendVisible = ref(true)
	const hoveredSpectrumLegendKey = ref("")
	const hiddenSpectrumLegendKeys = ref([])
	const activeHoveredSpectrumLegendKey = computed(() => {
		return legendHoverEmphasisEnabled?.value === false
			? ""
			: String( hoveredSpectrumLegendKey.value ?? "" ).trim()
	})

	const topSpectrumPaneSelectionSource = computed(() => {
		if( showSelectedSpectra.value === false ){
			return null
		}

		const mode = spectrumSelectionMode.value
		if( mode === "both" ){
			return resolvedSecondarySpectrumSource() ?? "measurement"
		}

		return activeDisplayedRois.value.length === 0 ? null : mode
	})

	const bottomSpectrumPaneSelectionSource = computed(() => {
		if( showSelectedSpectra.value === false ){
			return null
		}

		const mode = spectrumSelectionMode.value
		return mode === "both" ? resolvedPrimarySpectrumSource() : mode
	})

	const topSpectrumPaneQuerying = computed(() => {
		const source = topSpectrumPaneSelectionSource.value
		return typeof source === "string" && source.length > 0
			? isSelectionSpectrumQuerying( source )
			: false
	})

	const bottomSpectrumPaneQuerying = computed(() => {
		const source = bottomSpectrumPaneSelectionSource.value
		return typeof source === "string" && source.length > 0
			? isSelectionSpectrumQuerying( source )
			: false
	})

	const selectedSpectrumPayloadBySource = ( source ) => {
		const normalizedSource = normalizeSpectrumSource( source )

		if( normalizedSource === "raman" ){
			const payload = latestRamanSelectedSpectrum.value ??
				latestRamanSingleSpectrum.value?.response ??
				latestRamanMeanSpectrum.value?.response ??
				null
			return withSpectrumLegendName( withSelectedConfidenceBounds( payload ), "Selection" )
		}

		const payload = latestMeasurementSelectedSpectrum.value ??
			latestMeasurementSingleSpectrum.value?.response ??
			latestMeasurementMeanSpectrum.value?.response ??
			null
		return withSpectrumLegendName( withSelectedConfidenceBounds( payload ), "Selection" )
	}

	const measurementRoiSpectrumPayloadForEntry = ( roi ) => {
		const spectrum = Array.isArray( roi?.meanSpectrum ) ? roi.meanSpectrum : null
		if( spectrum === null ) return null

		const roiId = String( roi?.roiId ?? "" ).trim()
		const style = roiSpectrumStyleForId( roiId )

		return withSelectedConfidenceBounds({
			roiId,
			name: String( roi?.name ?? "" ).trim(),
			traceGroupKey: `roi-${roiId}`,
			spectrum,
			lowerBound: roi?.lowerBound ?? null,
			upperBound: roi?.upperBound ?? null,
			lineColor: style.lineColor,
			intervalColor: style.intervalColor
		})
	}

	const ramanRoiSpectrumPayloadForEntry = ( roi ) => {
		const roiId = String( roi?.roiId ?? "" ).trim()
		if( roiId.length === 0 ) return null

		const estimatedRoi = estimatedRoiSpectrumForId( roiId )
		const payload = estimatedRoi !== null && Array.isArray( estimatedRoi.meanSpectrum )
			? {
				spectrum: estimatedRoi.meanSpectrum,
				lowerBound: estimatedRoi.lowerBound ?? null,
				upperBound: estimatedRoi.upperBound ?? null
			}
			: cachedRamanRoiSpectrumForId( roiId )
		if( payload === null || payload === undefined ){
			return null
		}

		const style = roiSpectrumStyleForId( roiId )
		const resolvedPayload = {
			...payload,
			roiId,
			name: String( roi?.name ?? "" ).trim(),
			traceGroupKey: `roi-${roiId}`,
			lowerBound: payload.lowerBound ?? null,
			upperBound: payload.upperBound ?? null,
			lineColor: style.lineColor,
			intervalColor: style.intervalColor
		}

		if( roiEstimateUncertaintyLevelValue.value === confidenceNoneValue ){
			return {
				...resolvedPayload,
				lowerBound: null,
				upperBound: null
			}
		}

		return {
			...resolvedPayload,
			lowerBound: resolveConfidenceBoundSeries( resolvedPayload.lowerBound, roiEstimateUncertaintyNumericLevel.value ),
			upperBound: resolveConfidenceBoundSeries( resolvedPayload.upperBound, roiEstimateUncertaintyNumericLevel.value )
		}
	}

	const roiSpectrumPayloadsBySource = ( source ) => {
		const normalizedSource = normalizeSpectrumSource( source )
		const activeRois = activeDisplayedRois.value

		if( activeRois.length === 0 ){
			return []
		}

		return activeRois
			.map(( roi ) => normalizedSource === "raman"
				? ramanRoiSpectrumPayloadForEntry( roi )
				: measurementRoiSpectrumPayloadForEntry( roi ))
			.filter(( payload ) => payload !== null )
	}

	const topLeftSpectrumOptions = () => {
		const mode = spectrumSelectionMode.value
		const showLoadingsFallback = activePlot.value === "pca" || activePlot.value === "pca_mip" || activePlot.value === "pca_rgb" ||
			activePlot.value === "rpca" || activePlot.value === "rpca_mip" || activePlot.value === "rpca_rgb"
			? showPcaLoadings.value
			: false

		if( activeDisplayedRois.value.length === 0 && showLoadingsFallback ){
			return {
				showFallback: true
			}
		}

		const topSource = mode === "both"
			? ( resolvedSecondarySpectrumSource() ?? "measurement" )
			: mode
		const current = showSelectedSpectra.value
			? selectedSpectrumPayloadBySource( topSource )
			: null

		const roiPayloads = roiSpectrumPayloadsBySource( topSource )

		if( roiPayloads.length === 0 ){
			if( mode === "both" && current !== null ){
				return { current }
			}

			return showLoadingsFallback ? { current, showFallback: true } : {}
		}

		return {
			rois: roiPayloads,
			current
		}
	}

	const bottomLeftSpectrumOptions = () => {
		const mode = spectrumSelectionMode.value
		const lowerSource = mode === "both"
			? resolvedPrimarySpectrumSource()
			: mode
		const current = showSelectedSpectra.value
			? selectedSpectrumPayloadBySource( lowerSource )
			: null

		const roiPayloads = roiSpectrumPayloadsBySource( lowerSource )

		if( mode === "both" && roiPayloads.length > 0 ){
			return {
				selectedSpectrum: current,
				bottomLeftSpectrum: {
					rois: roiPayloads,
					current
				}
			}
		}

		return {
			selectedSpectrum: current,
			bottomLeftSpectrum: null
		}
	}

	const buildSpectrumPaneLegendEntries = ( roiPayloads, currentPayload, fallbackEntries = [] ) => {
		const entries = []
		const normalizedRoiPayloads = Array.isArray( roiPayloads ) ? roiPayloads : []

		if( currentPayload !== null && currentPayload !== undefined ){
			entries.push({
				key: String( currentPayload?.traceGroupKey ?? "selection" ),
				label: String( currentPayload?.name ?? "Selection" ).trim() || "Selection",
				color: queriedSpectrumLegendColor.value
			})
		}

		for( const payload of normalizedRoiPayloads ){
			if( payload === null || payload === undefined ) continue

			entries.push({
				key: String( payload?.traceGroupKey ?? `roi-${String( payload?.roiId ?? payload?.name ?? entries.length )}` ),
				label: String( payload?.name ?? "Region of interest" ).trim() || "Region of interest",
				color: String( payload?.lineColor ?? "" ).trim() || ( resolvedRoiSpectrumPalette.value[0] ?? "#333333" )
			})
		}

		if( entries.length > 0 ){
			return entries
		}

		return ( Array.isArray( fallbackEntries ) ? fallbackEntries : [] )
			.filter(( entry ) => entry !== null && entry !== undefined )
			.map(( entry, index ) => ({
				key: String( entry?.key ?? `fallback-${index}` ),
				label: String( entry?.label ?? "" ).trim(),
				color: String( entry?.color ?? "" ).trim()
			}))
			.filter(( entry ) => entry.label.length > 0 && entry.color.length > 0 )
	}

	const normalizedHiddenSpectrumLegendKeys = computed(() => {
		return Array.from( new Set(
			( Array.isArray( hiddenSpectrumLegendKeys.value ) ? hiddenSpectrumLegendKeys.value : [] )
				.map(( key ) => String( key ?? "" ).trim() )
				.filter(( key ) => key.length > 0 )
		))
	})

	const isSpectrumLegendHidden = ( legendKey ) => {
		const normalizedKey = String( legendKey ?? "" ).trim()
		if( normalizedKey.length === 0 ){
			return false
		}

		return normalizedHiddenSpectrumLegendKeys.value.includes( normalizedKey )
	}

	const toggleSpectrumLegendTraceVisibility = ( legendKey ) => {
		const normalizedKey = String( legendKey ?? "" ).trim()
		if( normalizedKey.length === 0 ){
			return
		}

		if( isSpectrumLegendHidden( normalizedKey ) ){
			hiddenSpectrumLegendKeys.value = normalizedHiddenSpectrumLegendKeys.value
				.filter(( entry ) => entry !== normalizedKey )
			return
		}

		hiddenSpectrumLegendKeys.value = [
			...normalizedHiddenSpectrumLegendKeys.value,
			normalizedKey
		]
	}

	const topSpectrumPaneLegendEntries = computed(() => {
		const optionsForTopPane = topLeftSpectrumOptions()
		return buildSpectrumPaneLegendEntries(
			optionsForTopPane?.rois ?? [],
			optionsForTopPane?.current ?? null,
			optionsForTopPane?.showFallback === true ? activeLoadingLegendEntries.value : []
		)
	})

	watch( [ topSpectrumPaneLegendVisible, () => topSpectrumPaneLegendEntries.value.length ], async () => {
		hoveredSpectrumLegendKey.value = ""

		await nextTick()
		await waitForAnimationFrame()
		await resizePlotlyContainer( deckTopPanelGraph.value )
	}, { flush: "post" } )

	watch( topSpectrumPaneLegendEntries, ( legendEntries ) => {
		const currentKey = String( hoveredSpectrumLegendKey.value ?? "" ).trim()
		if( currentKey.length === 0 ){
			return
		}

		const hasCurrentEntry = Array.isArray( legendEntries ) && legendEntries.some(( entry ) => entry?.key === currentKey )
		if( hasCurrentEntry === false ){
			hoveredSpectrumLegendKey.value = ""
		}
	}, { flush: "post" } )

	watch( activeHoveredSpectrumLegendKey, async ( nextKey ) => {
		try{
			await Promise.all([
				hyperspectrum.setSpectrumHighlightGroup( deckTopPanelGraph.value, nextKey ),
				hyperspectrum.setSpectrumHighlightGroup( deckBottomPanelGraph.value, nextKey )
			])
		} catch( error ){
			console.log( error )
		}
	}, { flush: "post" } )

	watch( normalizedHiddenSpectrumLegendKeys, async ( nextKeys ) => {
		try{
			await Promise.all([
				hyperspectrum.setSpectrumHiddenGroups( deckTopPanelGraph.value, nextKeys ),
				hyperspectrum.setSpectrumHiddenGroups( deckBottomPanelGraph.value, nextKeys )
			])
		} catch( error ){
			console.log( error )
		}
	}, { flush: "post" } )

	return {
		topSpectrumPaneLegendVisible,
		hoveredSpectrumLegendKey,
		normalizedHiddenSpectrumLegendKeys,
		topSpectrumPaneQuerying,
		bottomSpectrumPaneQuerying,
		topLeftSpectrumOptions,
		bottomLeftSpectrumOptions,
		topSpectrumPaneLegendEntries,
		isSpectrumLegendHidden,
		toggleSpectrumLegendTraceVisibility
	}
}
