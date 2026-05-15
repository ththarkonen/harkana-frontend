import {
	newestMatchingRoiId,
	normalizeEstimatedRoiPayload
} from "./normalizers.js"

export function createRoiRepository( options ){

	const state = options.state
	const project = options.project
	const cacheOptions = options.cacheOptions
	const hyperspectrumCache = options.hyperspectrumCache
	const hyperspectra = options.hyperspectra
	const activeGroupID = options.activeGroupID
	const estimateConfidenceLevels = Array.isArray( options.estimateConfidenceLevels )
		? options.estimateConfidenceLevels
		: [ 50, 75, 90, 95 ]
	const normalizeSelectionBoundingBox = options.normalizeSelectionBoundingBox
	const canMutateRois = options.canMutateRois
	const selectedHeatmapBoundingBox = options.selectedHeatmapBoundingBox
	const hasEstimatedRamanSpectraReady = options.hasEstimatedRamanSpectraReady
	const spectrumSelectionMode = options.spectrumSelectionMode
	const dataTypeForSpectrumSource = options.dataTypeForSpectrumSource
	const dataSourceForSpectrumSource = options.dataSourceForSpectrumSource
	const confidenceLevelsForSpectrumSource = options.confidenceLevelsForSpectrumSource
	const queueSpectraPanelRender = options.queueSpectraPanelRender
	const rerenderHeatmap = options.rerenderHeatmap

	const syncEstimatedRoiCachesFromRois = () => {
		const payload = { rois: state.rois.value }
		const normalized = normalizeEstimatedRoiPayload( payload, normalizeSelectionBoundingBox, "roi/frontend" )

		state.estimatedRoiList.value = normalized
		state.estimatedRoiListMode.value = normalized.length > 0 ? "roi/frontend" : ""
		state.estimatedRoiListAttempted.value = true
	}

	const loadEstimatedRoiList = async ( forceRefresh = false ) => {
		if( forceRefresh ){
			state.estimatedRoiListAttempted.value = false
		}

		if( state.estimatedRoiListAttempted.value ){
			return
		}

		syncEstimatedRoiCachesFromRois()
	}

	const loadRoiList = async ( forceRefresh = false ) => {
		const loadedRois = forceRefresh
			? await hyperspectrumCache.refreshRois( project.value, cacheOptions )
			: await hyperspectrumCache.getRois( project.value, cacheOptions )

		state.rois.value = Array.isArray( loadedRois ) ? loadedRois : []

		state.selectedRoiIds.value = state.selectedRoiIds.value.filter(( roiId ) => {
			return state.rois.value.some(( roi ) => {
				return String( roi?.roiId ?? "" ).trim() === String( roiId ?? "" ).trim()
			})
		})

		await loadEstimatedRoiList( forceRefresh )
	}

	const refreshRoisFromBackend = async () => {
		if( state.refreshingRois.value ) return
		const startedAt = Date.now()
		const spinCycleMs = 800
		const minimumSpinCycles = 1
		state.refreshingRois.value = true

		try{
			await loadRoiList( true )
			await refreshRamanRoiSpectrum()
			await rerenderHeatmap()
		} catch( error ){
			console.log( error )
		} finally {
			const elapsedMs = Date.now() - startedAt
			const minimumDurationMs = spinCycleMs * minimumSpinCycles
			const targetDurationMs = Math.max(
				minimumDurationMs,
				Math.ceil( elapsedMs / spinCycleMs ) * spinCycleMs
			)
			const remainingMs = targetDurationMs - elapsedMs
			if( remainingMs > 0 ){
				await new Promise(( resolve ) => {
					setTimeout( resolve, remainingMs )
				})
			}
			state.refreshingRois.value = false
		}
	}

	const ensureRamanRoiSpectrumForEntry = async ( roi ) => {
		const roiId = String( roi?.roiId ?? "" ).trim()
		if( roiId.length === 0 ) return null

		const cachedEstimatedRoi = state.estimatedRoiSpectrumForId( roiId )
		if( cachedEstimatedRoi !== null && Array.isArray( cachedEstimatedRoi.meanSpectrum ) ){
			return {
				spectrum: cachedEstimatedRoi.meanSpectrum,
				lowerBound: cachedEstimatedRoi.lowerBound ?? null,
				upperBound: cachedEstimatedRoi.upperBound ?? null
			}
		}

		const cachedPayload = state.cachedRamanRoiSpectrumForId( roiId )
		if( cachedPayload !== null ){
			return cachedPayload
		}

		const boundingBox = normalizeSelectionBoundingBox( roi?.boundingBox )
		if( boundingBox === null ){
			return null
		}

		const requestID = state.nextRamanRoiRequestID( roiId )

		try{
			const response = await hyperspectra.meanSpectrum(
				project.value,
				boundingBox,
				activeGroupID(),
				false,
				dataTypeForSpectrumSource( "raman" ),
				dataSourceForSpectrumSource( "raman" ),
				confidenceLevelsForSpectrumSource( "raman" )
			)

			if( state.isCurrentRamanRoiRequest( roiId, requestID ) === false ) return null

			state.cacheRamanRoiSpectrum( roiId, response ?? null )
			await queueSpectraPanelRender()
			return response ?? null
		} catch( error ){
			if( state.isCurrentRamanRoiRequest( roiId, requestID ) === false ) return null
			console.log( error )
			return null
		}
	}

	const refreshRamanRoiSpectrum = async () => {
		const needsRaman = spectrumSelectionMode.value === "raman" || spectrumSelectionMode.value === "both"
		if( needsRaman === false || hasEstimatedRamanSpectraReady.value === false ){
			return
		}

		const activeRois = state.activeDisplayedRois.value
		if( activeRois.length === 0 ){
			return
		}

		await loadEstimatedRoiList()
		await Promise.all( activeRois.map(( roi ) => ensureRamanRoiSpectrumForEntry( roi ) ))
	}

	const toggleAllRoiOverlays = () => {
		if( state.showAllRoiOverlays.value ){
			state.clearSelectedRois()
			return
		}

		state.selectedRoiIds.value = state.rois.value
			.map(( roi ) => String( roi?.roiId ?? "" ).trim() )
			.filter(( roiId ) => roiId.length > 0 )
	}

	const saveRoi = async ( payload ) => {
		if( state.savingRoi.value ) return false
		if( canMutateRois.value === false ) return false

		const boundingBox = normalizeSelectionBoundingBox( selectedHeatmapBoundingBox.value )
		if( boundingBox === null ) return false

		state.savingRoi.value = true

		try{
			await hyperspectra.createRoi(
				project.value,
				{
					name: payload?.name,
					description: payload?.description ?? "",
					shapeType: "bounding-box",
					strictBounds: false,
					boundingBox
				},
				activeGroupID(),
				estimateConfidenceLevels
			)

			await loadRoiList( true )
			state.resetEstimatedRoiArtifacts()
			await loadEstimatedRoiList( true )

			const matchedRoiId = newestMatchingRoiId(
				state.rois.value,
				payload?.name,
				payload?.description ?? ""
			)
			if( matchedRoiId.length > 0 ){
				state.selectedRoiIds.value = [ matchedRoiId ]
			}

			return true
		} catch( error ){
			console.log( error )
			return false
		} finally {
			state.savingRoi.value = false
		}
	}

	const deleteSelectedRois = async () => {
		if( state.deletingRoi.value ) return false
		if( canMutateRois.value === false ) return false
		if( state.selectedRois.value.length === 0 ) return false

		const roiIds = state.selectedRois.value
			.map(( roi ) => String( roi?.roiId ?? "" ).trim() )
			.filter(( roiId ) => roiId.length > 0 )
		if( roiIds.length === 0 ) return false

		state.deletingRoi.value = true

		try{
			const deletionResults = await Promise.allSettled(
				roiIds.map(( roiId ) => hyperspectra.deleteRoi( project.value, roiId ))
			)
			state.selectedRoiIds.value = state.selectedRoiIds.value.filter(( value ) => {
				return roiIds.includes( String( value ?? "" ).trim() ) === false
			})
			await loadRoiList( true )
			state.resetEstimatedRoiArtifacts()
			await loadEstimatedRoiList( true )

			const failedDeletion = deletionResults.find(( result ) => result.status === "rejected" )
			if( failedDeletion?.status === "rejected" ){
				throw failedDeletion.reason
			}

			return true
		} catch( error ){
			console.log( error )
			return false
		} finally {
			state.deletingRoi.value = false
		}
	}

	return {
		loadEstimatedRoiList,
		loadRoiList,
		refreshRoisFromBackend,
		refreshRamanRoiSpectrum,
		toggleAllRoiOverlays,
		saveRoi,
		deleteSelectedRois
	}
}
