import {
	normalizedLoadPriority,
	runWhenBrowserIdle,
	yieldToBrowser
} from "../browserIdle.js"
import {
	DISPLAY_PAYLOAD_PREWARM_DELAY_MS,
	PREPARATION_SPINNER_MIN_VISIBLE_MS
} from "./constants.js"

function nowMs(){
	return typeof performance !== "undefined" ? performance.now() : Date.now()
}

function waitForDelay( delayMs ){
	return new Promise(( resolve ) => {
		const timerScope = typeof window !== "undefined" ? window : globalThis
		timerScope.setTimeout( resolve, delayMs )
	})
}

export function createVisualizationTargetPreloader( options ){

	const nextTick = options.nextTick
	const graph = options.graph
	const project = options.project
	const activeProjectLoadRequestID = options.activeProjectLoadRequestID
	const heatmapRendererMode = options.heatmapRendererMode
	const heatmapUsesEstimatedRaman = options.heatmapUsesEstimatedRaman
	const mip = options.mip
	const cacheOptions = options.cacheOptions
	const layerInput = options.layerInput
	const pcaClassificationComponentCount = options.pcaClassificationComponentCount
	const pcaMipComponentCount = options.pcaMipComponentCount
	const pcaComponentIndices = Array.isArray( options.pcaComponentIndices ) ? options.pcaComponentIndices : []
	const activePcaClassificationCount = options.activePcaClassificationCount
	const resetActivePcaComponents = options.resetActivePcaComponents
	const normalizeLayerInput = options.normalizeLayerInput
	const normalizePcaComponentInput = options.normalizePcaComponentInput
	const decompositionMipMode = options.decompositionMipMode
	const decompositionScoreMode = options.decompositionScoreMode
	const loadEstimatedArtifact = options.loadEstimatedArtifact
	const loadEstimatedMip = options.loadEstimatedMip
	const loadEstimatedMipHsv = options.loadEstimatedMipHsv
	const loadEstimatedUmap = options.loadEstimatedUmap
	const loadEstimatedLayer = options.loadEstimatedLayer
	const loadEstimatedPcaClassificationMip = options.loadEstimatedPcaClassificationMip
	const loadEstimatedPcaMip = options.loadEstimatedPcaMip
	const loadEstimatedPcaClassification = options.loadEstimatedPcaClassification
	const loadEstimatedRpcaClassificationMip = options.loadEstimatedRpcaClassificationMip
	const loadEstimatedRpcaMip = options.loadEstimatedRpcaMip
	const loadEstimatedRpcaClassification = options.loadEstimatedRpcaClassification
	const loadMipHsv = options.loadMipHsv
	const loadUmap = options.loadUmap
	const loadLayer = options.loadLayer
	const loadZBlendSource = options.loadZBlendSource
	const loadCustomIndexMatrix = options.loadCustomIndexMatrix
	const loadPcaClassificationMip = options.loadPcaClassificationMip
	const loadPcaMip = options.loadPcaMip
	const loadPcaClassification = options.loadPcaClassification
	const loadRpcaClassificationMip = options.loadRpcaClassificationMip
	const loadRpcaMip = options.loadRpcaMip
	const loadRpcaClassification = options.loadRpcaClassification
	const resolvePrioritizedPreparationTargets = options.resolvePrioritizedPreparationTargets
	const resolveDeferredPreparationTargets = options.resolveDeferredPreparationTargets
	const resolveTrailingPreparationTargets = options.resolveTrailingPreparationTargets
	const prewarmVisualizationTargetPayload = options.prewarmVisualizationTargetPayload
	const hyperspectrumCache = options.hyperspectrumCache
	const preparationState = options.preparationState
	const backgroundWork = options.backgroundWork
	const layerWindow = options.layerWindow

	let cancelScheduledDisplayPayloadPrewarm = null
	const scheduledDisplayPayloadPrewarmTargets = new Set()
	let displayPayloadPrewarmRequestID = 0

	const loadVisualizationTargetData = async ( target, initialLayerIndex, priority = "high" ) => {

		if( target === "mip" ){
			if( heatmapUsesEstimatedRaman.value ){
				try{
					const estimatedMipMatrix = await loadEstimatedMip( priority )
					if( estimatedMipMatrix !== null ){
						return
					}
				} catch( error ){
					console.log( error )
				}
			}

			if( mip.value === null ){
				mip.value = await hyperspectrumCache.getMip( project.value, {
					...cacheOptions,
					priority: normalizedLoadPriority( priority )
				} )
			}
			return
		}

		if( target === "mip_hsv" ){
			if( heatmapUsesEstimatedRaman.value ){
				try{
					const estimatedMipHsvMatrix = await loadEstimatedMipHsv( priority )
					if( estimatedMipHsvMatrix !== null ){
						return
					}
				} catch( error ){
					console.log( error )
				}
			}

			await loadMipHsv( priority )
			return
		}

		if( target === "umap" ){
			if( heatmapUsesEstimatedRaman.value ){
				try{
					const estimatedUmapMatrix = await loadEstimatedUmap( priority )
					if( estimatedUmapMatrix !== null ){
						return
					}
				} catch( error ){
					console.log( error )
				}
			}

			await loadUmap( priority )
			return
		}

		if( target === "z_blend" ){
			if( heatmapUsesEstimatedRaman.value ){
				try{
					const estimatedSource = await loadZBlendSource( true, priority )
					if( estimatedSource !== null ){
						return
					}
				} catch( error ){
					console.log( error )
				}
			}

			await loadZBlendSource( false, priority )
			return
		}

		if( target === "custom_index" ){
			if( typeof loadCustomIndexMatrix === "function" ){
				await loadCustomIndexMatrix( priority )
			}
			return
		}

		if( target === "layer_window" ){
			const layerIndex = Number.isInteger( initialLayerIndex ) ? initialLayerIndex : normalizeLayerInput( layerInput.value )
			if( heatmapUsesEstimatedRaman.value ){
				try{
					await loadEstimatedLayer( layerIndex, priority )
					await layerWindow.ensureEstimatedLayerWindowReady( layerIndex, priority )
					return
				} catch( error ){
					console.log( error )
				}
			}

			await loadLayer( layerIndex, priority )
			await layerWindow.ensureMeasurementLayerWindowReady( layerIndex, priority )
			return
		}

		if( target === "pca" ){
			resetActivePcaComponents( pcaClassificationComponentCount.value )
			if( heatmapUsesEstimatedRaman.value ){
				try{
					const estimatedClassificationMip = await loadEstimatedPcaClassificationMip( activePcaClassificationCount(), priority )
					if( estimatedClassificationMip !== null ) return
				} catch( error ){
					console.log( error )
				}
			}

			await loadPcaClassificationMip( pcaClassificationComponentCount.value, priority )
			return
		}

		if( target === "pca_mip" ){
			resetActivePcaComponents( pcaMipComponentCount.value )
			if( heatmapUsesEstimatedRaman.value ){
				try{
					const estimatedPcaMipMatrix = await loadEstimatedPcaMip( pcaMipComponentCount.value, priority )
					if( estimatedPcaMipMatrix !== null ) return
				} catch( error ){
					console.log( error )
				}
			}

			await loadPcaMip( pcaMipComponentCount.value, priority )
			return
		}

		if( target === "pca_rgb" ){
			if( heatmapUsesEstimatedRaman.value ){
				try{
					const estimatedClassification = await loadEstimatedPcaClassification( priority )
					if( estimatedClassification !== null ) return
				} catch( error ){
					console.log( error )
				}
			}

			await loadPcaClassification( priority )
			return
		}

		if( target === "rpca" ){
			resetActivePcaComponents( pcaClassificationComponentCount.value )
			if( heatmapUsesEstimatedRaman.value ){
				try{
					const estimatedClassificationMip = await loadEstimatedRpcaClassificationMip( activePcaClassificationCount(), priority )
					if( estimatedClassificationMip !== null ) return
				} catch( error ){
					console.log( error )
				}
			}

			await loadRpcaClassificationMip( pcaClassificationComponentCount.value, priority )
			return
		}

		if( target === "rpca_mip" ){
			resetActivePcaComponents( pcaMipComponentCount.value )
			if( heatmapUsesEstimatedRaman.value ){
				try{
					const estimatedMipMatrix = await loadEstimatedRpcaMip( pcaMipComponentCount.value, priority )
					if( estimatedMipMatrix !== null ) return
				} catch( error ){
					console.log( error )
				}
			}

			await loadRpcaMip( pcaMipComponentCount.value, priority )
			return
		}

		if( target === "rpca_rgb" ){
			if( heatmapUsesEstimatedRaman.value ){
				try{
					const estimatedClassification = await loadEstimatedRpcaClassification( priority )
					if( estimatedClassification !== null ) return
				} catch( error ){
					console.log( error )
				}
			}

			await loadRpcaClassification( priority )
		}
	}

	const loadBackgroundVisualizationTargetData = async ( target, initialLayerIndex, priority = "low" ) => {
		if( target === "mip" ){
			if( heatmapUsesEstimatedRaman.value ){
				try{
					const estimatedMipMatrix = await loadEstimatedArtifact( "mip", priority )
					if( estimatedMipMatrix !== null ) return estimatedMipMatrix
				} catch( error ){
					console.log( error )
				}
			}
			return await hyperspectrumCache.getMip( project.value, {
				...cacheOptions,
				priority: normalizedLoadPriority( priority )
			} )
		}

		if( target === "mip_hsv" ){
			if( heatmapUsesEstimatedRaman.value ){
				try{
					const estimatedMipHsvMatrix = await loadEstimatedArtifact( "mip_hsv", priority )
					if( estimatedMipHsvMatrix !== null ) return estimatedMipHsvMatrix
				} catch( error ){
					console.log( error )
				}
			}
			return await hyperspectrumCache.getMipHsv( project.value, {
				...cacheOptions,
				priority: normalizedLoadPriority( priority )
			} )
		}

		if( target === "umap" ){
			if( heatmapUsesEstimatedRaman.value ){
				try{
					return {
						r: await loadEstimatedArtifact( "umap/r", priority ),
						g: await loadEstimatedArtifact( "umap/g", priority ),
						b: await loadEstimatedArtifact( "umap/b", priority )
					}
				} catch( error ){
					console.log( error )
				}
			}
			return {
				r: await hyperspectrumCache.getArtifact( project.value, "umap/r", {
					...cacheOptions,
					priority: normalizedLoadPriority( priority )
				} ),
				g: await hyperspectrumCache.getArtifact( project.value, "umap/g", {
					...cacheOptions,
					priority: normalizedLoadPriority( priority )
				} ),
				b: await hyperspectrumCache.getArtifact( project.value, "umap/b", {
					...cacheOptions,
					priority: normalizedLoadPriority( priority )
				} )
			}
		}

		if( target === "z_blend" ){
			if( heatmapUsesEstimatedRaman.value ){
				try{
					const estimatedSource = await loadZBlendSource( true, priority )
					if( estimatedSource !== null ) return estimatedSource
				} catch( error ){
					console.log( error )
				}
			}
			return await loadZBlendSource( false, priority )
		}

		if( target === "custom_index" ){
			return typeof loadCustomIndexMatrix === "function"
				? await loadCustomIndexMatrix( priority )
				: null
		}

		if( target === "layer_window" ){
			const layerIndex = Number.isInteger( initialLayerIndex ) ? initialLayerIndex : normalizeLayerInput( layerInput.value )
			const indices = layerWindow.resolveLayerWindowIndices( layerIndex, true )
			if( heatmapUsesEstimatedRaman.value ){
				try{
					for( const candidateIndex of indices ){
						await loadEstimatedArtifact( "layers/" + candidateIndex, priority )
						await yieldToBrowser()
					}
					return { estimated: true, layerIndex }
				} catch( error ){
					console.log( error )
				}
			}

			for( const candidateIndex of indices ){
				await hyperspectrumCache.getLayer( project.value, candidateIndex, {
					...options.layerCacheOptions(),
					priority: normalizedLoadPriority( priority )
				} )
				await yieldToBrowser()
			}
			return { estimated: false, layerIndex }
		}

		if( target === "pca" ){
			if( heatmapUsesEstimatedRaman.value ){
				try{
					const estimatedClassificationMip = await loadEstimatedArtifact(
						decompositionMipMode( "pca", activePcaClassificationCount() ),
						priority
					)
					if( estimatedClassificationMip !== null ) return estimatedClassificationMip
				} catch( error ){
					console.log( error )
				}
			}
			return await hyperspectrumCache.getPcaMip( project.value, {
				...cacheOptions,
				componentCount: normalizePcaComponentInput( pcaClassificationComponentCount.value ),
				priority: normalizedLoadPriority( priority )
			} )
		}

		if( target === "pca_mip" ){
			if( heatmapUsesEstimatedRaman.value ){
				try{
					const estimatedPcaMipMatrix = await loadEstimatedArtifact(
						decompositionMipMode( "pca", pcaMipComponentCount.value ),
						priority
					)
					if( estimatedPcaMipMatrix !== null ) return estimatedPcaMipMatrix
				} catch( error ){
					console.log( error )
				}
			}
			return await hyperspectrumCache.getPcaMip( project.value, {
				...cacheOptions,
				componentCount: normalizePcaComponentInput( pcaMipComponentCount.value ),
				priority: normalizedLoadPriority( priority )
			} )
		}

		if( target === "pca_rgb" ){
			const combinedScores = {}
			if( heatmapUsesEstimatedRaman.value ){
				try{
					for( const componentIndex of pcaComponentIndices ){
						combinedScores[componentIndex] = await loadEstimatedArtifact(
							decompositionScoreMode( "pca", componentIndex ),
							priority
						)
						await yieldToBrowser()
					}
					return combinedScores
				} catch( error ){
					console.log( error )
				}
			}

			for( const componentIndex of pcaComponentIndices ){
				combinedScores[componentIndex] = await hyperspectrumCache.getPcaScore( project.value, componentIndex, {
					...cacheOptions,
					priority: normalizedLoadPriority( priority )
				} )
				await yieldToBrowser()
			}
			return combinedScores
		}

		if( target === "rpca" ){
			if( heatmapUsesEstimatedRaman.value ){
				try{
					const estimatedClassificationMip = await loadEstimatedArtifact(
						decompositionMipMode( "rpca", activePcaClassificationCount() ),
						priority
					)
					if( estimatedClassificationMip !== null ) return estimatedClassificationMip
				} catch( error ){
					console.log( error )
				}
			}
			return await hyperspectrumCache.getRpcaMip( project.value, {
				...cacheOptions,
				componentCount: normalizePcaComponentInput( pcaClassificationComponentCount.value ),
				priority: normalizedLoadPriority( priority )
			} )
		}

		if( target === "rpca_mip" ){
			if( heatmapUsesEstimatedRaman.value ){
				try{
					const estimatedRpcaMipMatrix = await loadEstimatedArtifact(
						decompositionMipMode( "rpca", pcaMipComponentCount.value ),
						priority
					)
					if( estimatedRpcaMipMatrix !== null ) return estimatedRpcaMipMatrix
				} catch( error ){
					console.log( error )
				}
			}
			return await hyperspectrumCache.getRpcaMip( project.value, {
				...cacheOptions,
				componentCount: normalizePcaComponentInput( pcaMipComponentCount.value ),
				priority: normalizedLoadPriority( priority )
			} )
		}

		if( target === "rpca_rgb" ){
			const combinedScores = {}
			if( heatmapUsesEstimatedRaman.value ){
				try{
					for( const componentIndex of pcaComponentIndices ){
						combinedScores[componentIndex] = await loadEstimatedArtifact(
							decompositionScoreMode( "rpca", componentIndex ),
							priority
						)
						await yieldToBrowser()
					}
					return combinedScores
				} catch( error ){
					console.log( error )
				}
			}

			for( const componentIndex of pcaComponentIndices ){
				combinedScores[componentIndex] = await hyperspectrumCache.getRpcaScore( project.value, componentIndex, {
					...cacheOptions,
					priority: normalizedLoadPriority( priority )
				} )
				await yieldToBrowser()
			}
			return combinedScores
		}

		return null
	}

	const prepareBackgroundVisualizationTarget = async ( target, initialLayerIndex ) => {
		const loadedData = await loadBackgroundVisualizationTargetData( target, initialLayerIndex, "low" )

		if( target === "layer_window" ){
			if( heatmapUsesEstimatedRaman.value ){
				layerWindow.prefetchEstimatedLayerWindow( initialLayerIndex )
				layerWindow.scheduleLayerPayloadPrewarm( initialLayerIndex, true )
			} else {
				layerWindow.prefetchMeasurementLayerWindow( initialLayerIndex )
				layerWindow.scheduleLayerPayloadPrewarm( initialLayerIndex, false )
			}
			return
		}

		const idleWindowAvailable = await backgroundWork.waitForProjectBackgroundIdleWindow( activeProjectLoadRequestID.value )
		if( idleWindowAvailable === false ) return
		await prewarmVisualizationTargetPayload( target, loadedData )
	}

	const queueProjectBackgroundHydration = ( requestID, initialLayerIndex, startingDisplayMode ) => {
		backgroundWork.beginProjectBackgroundHydrationGraceWindow()

		const prioritizedTargets = resolvePrioritizedPreparationTargets( startingDisplayMode )
		const deferredTargets = resolveDeferredPreparationTargets( startingDisplayMode )
		const trailingTargets = resolveTrailingPreparationTargets( startingDisplayMode )
		preparationState.setQueuedPreparationTargets([ ...prioritizedTargets, ...deferredTargets, ...trailingTargets ])

		const enqueueHydrationTask = ( callback ) => {
			backgroundWork.enqueueProjectBackgroundTask( async () => {
				if( requestID !== activeProjectLoadRequestID.value ) return
				await callback()
				if( requestID !== activeProjectLoadRequestID.value ) return
			} )
		}

		for( const target of [ ...prioritizedTargets, ...deferredTargets, ...trailingTargets ] ){
			enqueueHydrationTask( async () => {
				preparationState.markPreparationStarted( target )
				const spinnerStartedAt = nowMs()
				await nextTick()
				await yieldToBrowser()

				try{
					await prepareBackgroundVisualizationTarget( target, initialLayerIndex )
					const remainingVisibleMs = PREPARATION_SPINNER_MIN_VISIBLE_MS - ( nowMs() - spinnerStartedAt )
					if( remainingVisibleMs > 0 ){
						await waitForDelay( remainingVisibleMs )
					}
					preparationState.markPreparationCompleted( target )
				} catch( error ){
					console.log( error )
					preparationState.markPreparationFailed( target )
				}
			} )
		}
	}

	const prewarmLoadedDisplayPayload = async ( target ) => {
		await prewarmVisualizationTargetPayload( target, null )
	}

	const scheduleDisplayPayloadPrewarm = ( targets = [] ) => {
		if( heatmapRendererMode.value !== "deckgl" ) return
		if( graph.value === null ) return

		for( const target of Array.isArray( targets ) ? targets : [ targets ] ){
			if( typeof target !== "string" || target.length === 0 ) continue
			scheduledDisplayPayloadPrewarmTargets.add( target )
		}
		if( scheduledDisplayPayloadPrewarmTargets.size === 0 ) return

		if( typeof cancelScheduledDisplayPayloadPrewarm === "function" ){
			cancelScheduledDisplayPayloadPrewarm()
			cancelScheduledDisplayPayloadPrewarm = null
		}

		const requestID = displayPayloadPrewarmRequestID + 1
		displayPayloadPrewarmRequestID = requestID

		cancelScheduledDisplayPayloadPrewarm = runWhenBrowserIdle( async () => {
			const iterator = scheduledDisplayPayloadPrewarmTargets.values().next()
			if( iterator.done ){
				cancelScheduledDisplayPayloadPrewarm = null
				return
			}

			const target = iterator.value
			scheduledDisplayPayloadPrewarmTargets.delete( target )
			if( requestID !== displayPayloadPrewarmRequestID ) return

			try{
				await prewarmLoadedDisplayPayload( target )
			} catch( error ){
				console.log( error )
			}

			if( requestID === displayPayloadPrewarmRequestID ){
				cancelScheduledDisplayPayloadPrewarm = null
			}

			if( scheduledDisplayPayloadPrewarmTargets.size > 0 ){
				scheduleDisplayPayloadPrewarm()
			}
		}, { delayMs: DISPLAY_PAYLOAD_PREWARM_DELAY_MS } )
	}

	const invalidateDisplayPayloadPrewarm = () => {
		displayPayloadPrewarmRequestID += 1
		if( typeof cancelScheduledDisplayPayloadPrewarm === "function" ){
			cancelScheduledDisplayPayloadPrewarm()
			cancelScheduledDisplayPayloadPrewarm = null
		}
		scheduledDisplayPayloadPrewarmTargets.clear()
	}

	return {
		loadVisualizationTargetData,
		queueProjectBackgroundHydration,
		scheduleDisplayPayloadPrewarm,
		invalidateDisplayPayloadPrewarm
	}
}
