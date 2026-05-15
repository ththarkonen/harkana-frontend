import { ref } from "vue"
import {
	normalizedLoadPriority,
	runWhenBrowserIdle,
	shouldChunkBackgroundLoad,
	yieldToBrowser
} from "../browserIdle.js"
import {
	LAYER_CACHE_WINDOW_RADIUS,
	LAYER_PAYLOAD_PREWARM_DELAY_MS
} from "./constants.js"

export function createLayerWindowPreloader( options ){

	const activePlot = options.activePlot
	const graph = options.graph
	const heatmapRendererMode = options.heatmapRendererMode
	const project = options.project
	const maxLayerIndex = options.maxLayerIndex
	const layerInput = options.layerInput
	const cacheOptions = options.cacheOptions
	const layerCacheOptions = options.layerCacheOptions
	const normalizeLayerInput = options.normalizeLayerInput
	const loadEstimatedArtifact = options.loadEstimatedArtifact
	const hyperspectrumCache = options.hyperspectrumCache
	const hyperspectrum = options.hyperspectrum
	const layerHeatmapColorscale = options.layerHeatmapColorscale

	const activeLayerPayloadPrewarmRequestID = ref( 0 )
	let cancelScheduledLayerPayloadPrewarm = null

	const resolveLayerWindowIndices = ( centerIndex, includeCenter = true ) => {
		if( Number.isInteger( centerIndex ) === false ){
			return []
		}

		const maximumIndex = Number.isInteger( maxLayerIndex.value ) &&
			maxLayerIndex.value >= 0 &&
			maxLayerIndex.value < Number.MAX_SAFE_INTEGER
			? maxLayerIndex.value
			: null
		const center = maximumIndex === null
			? Math.max( 0, centerIndex )
			: Math.max( 0, Math.min( maximumIndex, centerIndex ))

		let start = Math.max( 0, center - LAYER_CACHE_WINDOW_RADIUS )
		let end = maximumIndex === null
			? center + LAYER_CACHE_WINDOW_RADIUS
			: Math.min( maximumIndex, center + LAYER_CACHE_WINDOW_RADIUS )

		if( maximumIndex !== null ){
			const targetCount = Math.min( maximumIndex + 1, ( LAYER_CACHE_WINDOW_RADIUS * 2 ) + 1 )
			while(( end - start + 1 ) < targetCount ){
				if( start > 0 ){
					start -= 1
					continue
				}
				if( end < maximumIndex ){
					end += 1
					continue
				}
				break
			}
		}

		const indices = includeCenter ? [ center ] : []
		for( let distance = 1; distance <= ( end - start ); distance++ ){
			const left = center - distance
			const right = center + distance
			if( left >= start ) indices.push( left )
			if( right <= end ) indices.push( right )
		}

		return indices
	}

	const prefetchMeasurementLayerWindow = ( centerIndex ) => {
		if( Number.isInteger( centerIndex ) === false ) return
		void hyperspectrumCache.prefetchWindow( project.value, centerIndex, LAYER_CACHE_WINDOW_RADIUS, layerCacheOptions() )
	}

	const prefetchEstimatedLayerWindow = ( centerIndex ) => {
		if( Number.isInteger( centerIndex ) === false ) return
		hyperspectrumCache.setActiveLayer( project.value, centerIndex, layerCacheOptions() )
		for( const layerIndex of resolveLayerWindowIndices( centerIndex, false ) ){
			void loadEstimatedArtifact( "layers/" + layerIndex, "low" ).catch(() => null )
		}
	}

	const ensureMeasurementLayerWindowReady = async ( centerIndex, priority = "high" ) => {
		if( Number.isInteger( centerIndex ) === false ) return
		const requestPriority = normalizedLoadPriority( priority )
		const indices = resolveLayerWindowIndices( centerIndex, true )

		if( shouldChunkBackgroundLoad( priority ) ){
			for( const layerIndex of indices ){
				await hyperspectrumCache.getLayer( project.value, layerIndex, {
					...layerCacheOptions(),
					priority: requestPriority
				} )
				await yieldToBrowser()
			}
			return
		}

		await Promise.all( indices.map(( layerIndex ) => {
			return hyperspectrumCache.getLayer( project.value, layerIndex, {
				...layerCacheOptions(),
				priority: requestPriority
			} )
		}) )
	}

	const ensureEstimatedLayerWindowReady = async ( centerIndex, priority = "high" ) => {
		if( Number.isInteger( centerIndex ) === false ) return
		const indices = resolveLayerWindowIndices( centerIndex, true )
		if( shouldChunkBackgroundLoad( priority ) ){
			for( const layerIndex of indices ){
				await loadEstimatedArtifact( "layers/" + layerIndex, priority )
				await yieldToBrowser()
			}
			return
		}

		await Promise.all( indices.map(( layerIndex ) => {
			return loadEstimatedArtifact( "layers/" + layerIndex, priority )
		}) )
	}

	const scheduleLayerPayloadPrewarm = ( centerIndex, estimated = false ) => {
		if( heatmapRendererMode.value !== "deckgl" ) return
		if( activePlot.value !== "layer" ) return
		if( graph.value === null ) return
		if( Number.isInteger( centerIndex ) === false ) return

		const candidateIndices = resolveLayerWindowIndices( centerIndex, false )
		if( candidateIndices.length === 0 ) return

		if( typeof cancelScheduledLayerPayloadPrewarm === "function" ){
			cancelScheduledLayerPayloadPrewarm()
			cancelScheduledLayerPayloadPrewarm = null
		}

		const requestID = activeLayerPayloadPrewarmRequestID.value + 1
		activeLayerPayloadPrewarmRequestID.value = requestID
		const colorscale = layerHeatmapColorscale()
		const remainingCandidateIndices = [ ...candidateIndices ]

		const runNextCandidate = () => {
			cancelScheduledLayerPayloadPrewarm = runWhenBrowserIdle( async () => {
				cancelScheduledLayerPayloadPrewarm = null
				if( requestID !== activeLayerPayloadPrewarmRequestID.value ) return

				const candidateIndex = remainingCandidateIndices.shift()
				if( Number.isInteger( candidateIndex ) === false ) return

				try{
					const candidateLayer = estimated
						? await loadEstimatedArtifact( "layers/" + candidateIndex, "low" )
						: await hyperspectrumCache.getLayer( project.value, candidateIndex, {
							...cacheOptions,
							priority: "low"
						} )

					if( requestID !== activeLayerPayloadPrewarmRequestID.value ) return
					if( Array.isArray( candidateLayer ) && candidateLayer.length > 0 ){
						hyperspectrum.prewarmScalarHeatmapRendererPayload( graph.value, candidateLayer, { colorscale } )
					}
				} catch( error ){
					console.log( error )
				}

				if( requestID !== activeLayerPayloadPrewarmRequestID.value ) return
				if( remainingCandidateIndices.length > 0 ){
					runNextCandidate()
				}
			}, { delayMs: LAYER_PAYLOAD_PREWARM_DELAY_MS } )
		}

		runNextCandidate()
	}

	const invalidateLayerPayloadPrewarm = () => {
		if( typeof cancelScheduledLayerPayloadPrewarm === "function" ){
			cancelScheduledLayerPayloadPrewarm()
			cancelScheduledLayerPayloadPrewarm = null
		}
		activeLayerPayloadPrewarmRequestID.value += 1
	}

	return {
		activeLayerPayloadPrewarmRequestID,
		resolveLayerWindowIndices,
		prefetchMeasurementLayerWindow,
		prefetchEstimatedLayerWindow,
		ensureMeasurementLayerWindowReady,
		ensureEstimatedLayerWindowReady,
		scheduleLayerPayloadPrewarm,
		invalidateLayerPayloadPrewarm
	}
}
