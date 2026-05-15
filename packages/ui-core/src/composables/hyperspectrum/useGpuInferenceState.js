import { computed, onBeforeUnmount, ref, watch } from "vue"

const GPU_STATUS_POLL_INTERVAL_MS = 60 * 1000
const GPU_NON_TERMINAL_STATUSES = new Set([ "SUBMITTED", "STARTED" ])
const GPU_TERMINAL_STATUSES = new Set([ "SUCCEEDED", "FAILED" ])
const GPU_JOB_NOT_FOUND_STATUS_CODES = new Set([ 400, 404 ])

export function useGpuInferenceState( options ){

	const project = options.project
	const billingSettings = options.billingSettings
	const activeProjectLoadRequestID = options.activeProjectLoadRequestID
	const settingslib = options.settingslib
	const projectlib = options.projectlib
	const hyperspectra = options.hyperspectra
	const gpuInferenceModal = options.gpuInferenceModal
	const gpuInferenceOutcomeModal = options.gpuInferenceOutcomeModal
	const resetEstimatedVisualizationState = options.resetEstimatedVisualizationState
	const clearEstimatedCacheForProject = options.clearEstimatedCacheForProject

	const gpuInferenceJobId = ref( "" )
	const gpuInferenceStatus = ref( "" )
	const gpuInferenceEstimateSpectraReady = ref( false )

	let gpuStatusPollTimer = null
	let gpuStatusPollInFlight = false

	const normalizedGpuInferenceStatus = ( value ) => {
		return String( value ?? "" ).trim().toUpperCase()
	}

	const hasSuccessfulRamanInference = computed(() => {
		return normalizedGpuInferenceStatus( gpuInferenceStatus.value ) === "SUCCEEDED"
	})

	const hasEstimatedRamanSpectraReady = computed(() => {
		return gpuInferenceEstimateSpectraReady.value === true || hasSuccessfulRamanInference.value
	})

	const sidebarInferenceStatusText = computed(() => {
		if( GPU_NON_TERMINAL_STATUSES.has( normalizedGpuInferenceStatus( gpuInferenceStatus.value )) === false ){
			return ""
		}

		return hasEstimatedRamanSpectraReady.value
			? "Image analysis running"
			: "Raman inference running"
	})

	const openGpuInferenceModal = async () => {
		if( project.value?.shared ) return

		try{
			var savedBilling = await settingslib.getBilling()
			if( savedBilling && typeof savedBilling === "object" ){
				billingSettings.value = {
					groupID: typeof savedBilling.groupID === "string" ? savedBilling.groupID : ""
				}
			}
		} catch( error ){
			console.log( error )
		}

		gpuInferenceModal.value?.open()
	}

	const persistGpuInferenceState = async () => {
		if( project.value?.shared ) return
		if( typeof project.value?.id !== "string" || project.value.id.length === 0 ) return

		try{
			const projectInfo = await projectlib.getInfo( project.value )
			if( projectInfo === null || typeof projectInfo !== "object" || projectInfo instanceof Error ){
				return
			}

			projectInfo.gpuInferenceJobId = String( gpuInferenceJobId.value ?? "" ).trim()
			projectInfo.gpuInferenceStatus = String( gpuInferenceStatus.value ?? "" ).trim()
			projectInfo.gpuInferenceEstimateSpectraReady = gpuInferenceEstimateSpectraReady.value === true

			await projectlib.setInfo( projectInfo )
		} catch( error ){
			console.log( error )
		}
	}

	const isMissingGpuInferenceJobError = ( error ) => {
		const status = Number( error?.status )
		if( GPU_JOB_NOT_FOUND_STATUS_CODES.has( status ) === false ){
			return false
		}

		const detail = String( error?.detail ?? error?.message ?? "" ).toLowerCase()
		return detail.includes( "job not found" )
	}

	const clearStaleGpuInferenceState = async () => {
		stopGpuInferenceStatusPolling()
		gpuStatusPollInFlight = false
		gpuInferenceJobId.value = ""
		gpuInferenceStatus.value = ""
		gpuInferenceEstimateSpectraReady.value = false
		await persistGpuInferenceState()
	}

	const resolveGpuInferenceEstimateSpectraReady = ( payload, normalizedNextStatus ) => {
		if(
			payload !== null &&
			typeof payload === "object" &&
			Object.prototype.hasOwnProperty.call( payload, "estimateSpectraReady" )
		){
			return payload.estimateSpectraReady === true
		}

		if( normalizedNextStatus === "SUCCEEDED" ){
			return true
		}

		return gpuInferenceEstimateSpectraReady.value === true
	}

	const maybeShowGpuInferenceOutcome = async (
		previousStatus,
		nextStatus,
		previousEstimateSpectraReady,
		nextEstimateSpectraReady,
		payload = null
	) => {
		const becameEstimateReady = previousEstimateSpectraReady === false &&
			nextEstimateSpectraReady === true &&
			nextStatus !== "SUCCEEDED"
		if( becameEstimateReady ){
			await gpuInferenceOutcomeModal.value?.open?.( "ESTIMATE_READY" )
			return
		}

		if( GPU_NON_TERMINAL_STATUSES.has( previousStatus ) === false ) return
		if( GPU_TERMINAL_STATUSES.has( nextStatus ) === false ) return

		await gpuInferenceOutcomeModal.value?.open?.( nextStatus, {
			errorCode: payload?.errorCode,
			errorMessage: payload?.errorMessage
		})
	}

	const updateGpuInferenceState = async ( payload, options = {} ) => {
		const normalizedNextStatus = normalizedGpuInferenceStatus(
			payload !== null && typeof payload === "object"
				? payload?.status
				: payload
		)
		if( normalizedNextStatus.length === 0 ) return false

		const normalizedPreviousStatus = normalizedGpuInferenceStatus( gpuInferenceStatus.value )
		const previousEstimateSpectraReady = gpuInferenceEstimateSpectraReady.value === true
		const nextEstimateSpectraReady = resolveGpuInferenceEstimateSpectraReady( payload, normalizedNextStatus )

		if( normalizedNextStatus === normalizedPreviousStatus &&
			nextEstimateSpectraReady === previousEstimateSpectraReady ){
			return false
		}

		gpuInferenceStatus.value = normalizedNextStatus
		gpuInferenceEstimateSpectraReady.value = nextEstimateSpectraReady
		await persistGpuInferenceState()

		if( options.announce === true ){
			await maybeShowGpuInferenceOutcome(
				normalizedPreviousStatus,
				normalizedNextStatus,
				previousEstimateSpectraReady,
				nextEstimateSpectraReady,
				payload
			)
		}

		return true
	}

	const handleGpuInferenceSubmitted = async ( payload ) => {
		const submittedJobId = String( payload?.jobId ?? "" ).trim()
		if( submittedJobId.length === 0 ) return

		gpuInferenceJobId.value = submittedJobId
		gpuInferenceStatus.value = normalizedGpuInferenceStatus( payload?.status ?? "STARTED" )
		gpuInferenceEstimateSpectraReady.value = false
		await resetEstimatedVisualizationState()
		await clearEstimatedCacheForProject()
		await persistGpuInferenceState()
	}

	const handleGpuInferenceStatus = async ( payload ) => {
		await updateGpuInferenceState( payload, { announce: true })
	}

	const shouldPollGpuInferenceStatus = () => {
		if( project.value?.shared ) return false

		const jobId = String( gpuInferenceJobId.value ?? "" ).trim()
		if( jobId.length === 0 ) return false

		return GPU_NON_TERMINAL_STATUSES.has( normalizedGpuInferenceStatus( gpuInferenceStatus.value ))
	}

	const stopGpuInferenceStatusPolling = () => {
		if( gpuStatusPollTimer === null ) return

		clearInterval( gpuStatusPollTimer )
		gpuStatusPollTimer = null
	}

	const refreshGpuInferenceStatusPolling = async () => {
		if( gpuStatusPollInFlight ) return
		if( shouldPollGpuInferenceStatus() === false ) return

		const activeJobId = String( gpuInferenceJobId.value ?? "" ).trim()
		if( activeJobId.length === 0 ) return

		gpuStatusPollInFlight = true

		try{
			const response = await hyperspectra.status( activeJobId )
			if( String( gpuInferenceJobId.value ?? "" ).trim() !== activeJobId ) return

			await updateGpuInferenceState( response, { announce: true })
		} catch( error ){
			if( isMissingGpuInferenceJobError( error ) ){
				await clearStaleGpuInferenceState()
				return
			}
			console.log( error )
		} finally {
			gpuStatusPollInFlight = false
		}
	}

	const syncGpuInferenceStatusPolling = () => {
		if( shouldPollGpuInferenceStatus() === false ){
			stopGpuInferenceStatusPolling()
			return
		}

		if( gpuStatusPollTimer !== null ) return

		void refreshGpuInferenceStatusPolling()
		gpuStatusPollTimer = setInterval(() => {
			void refreshGpuInferenceStatusPolling()
		}, GPU_STATUS_POLL_INTERVAL_MS )
	}

	const restoreGpuInferenceState = async ( requestID ) => {
		if( project.value?.shared ){
			const sharedStatusCandidates = [
				project.value?.gpuInferenceStatus,
				project.value?.inferenceStatus,
				project.value?.status
			]

			var sharedStatus = ""
			for( const candidate of sharedStatusCandidates ){
				const normalizedCandidate = normalizedGpuInferenceStatus( candidate )
				if( normalizedCandidate.length === 0 ) continue
				sharedStatus = normalizedCandidate
				break
			}

			const sharedEstimateSpectraReady =
				project.value?.gpuInferenceEstimateSpectraReady === true ||
				project.value?.estimateSpectraReady === true ||
				sharedStatus === "SUCCEEDED"

			if( sharedStatus.length > 0 ){
				gpuInferenceStatus.value = sharedStatus
			}
			gpuInferenceEstimateSpectraReady.value = sharedEstimateSpectraReady
			return
		}

		if( typeof project.value?.id !== "string" || project.value.id.length === 0 ) return

		try{
			const projectInfo = await projectlib.getInfo( project.value )
			if( requestID !== activeProjectLoadRequestID.value ) return
			if( projectInfo === null || typeof projectInfo !== "object" || projectInfo instanceof Error ){
				return
			}

			const storedJobId = String( projectInfo.gpuInferenceJobId ?? "" ).trim()
			const storedStatus = String( projectInfo.gpuInferenceStatus ?? "" ).trim()
			const storedEstimateSpectraReady = projectInfo.gpuInferenceEstimateSpectraReady === true ||
				normalizedGpuInferenceStatus( storedStatus ) === "SUCCEEDED"

			if( storedJobId.length === 0 ) return

			gpuInferenceJobId.value = storedJobId
			gpuInferenceStatus.value = normalizedGpuInferenceStatus( storedStatus )
			gpuInferenceEstimateSpectraReady.value = storedEstimateSpectraReady

			const response = await hyperspectra.status( storedJobId )
			if( requestID !== activeProjectLoadRequestID.value ) return

			await updateGpuInferenceState( response, { announce: true })
		} catch( error ){
			if( requestID !== activeProjectLoadRequestID.value ) return
			if( isMissingGpuInferenceJobError( error ) ){
				await clearStaleGpuInferenceState()
				return
			}
			console.log( error )
		}
	}

	const resetGpuInferenceState = () => {
		stopGpuInferenceStatusPolling()
		gpuStatusPollInFlight = false
		gpuInferenceJobId.value = ""
		gpuInferenceStatus.value = ""
		gpuInferenceEstimateSpectraReady.value = false
	}

	watch( [ gpuInferenceJobId, gpuInferenceStatus, () => project.value?.id, () => project.value?.shared ], () => {
		syncGpuInferenceStatusPolling()
	}, { immediate: true } )

	onBeforeUnmount(() => {
		stopGpuInferenceStatusPolling()
		gpuStatusPollInFlight = false
	})

	return {
		gpuInferenceJobId,
		gpuInferenceStatus,
		gpuInferenceEstimateSpectraReady,
		hasSuccessfulRamanInference,
		hasEstimatedRamanSpectraReady,
		sidebarInferenceStatusText,
		openGpuInferenceModal,
		handleGpuInferenceSubmitted,
		handleGpuInferenceStatus,
		restoreGpuInferenceState,
		stopGpuInferenceStatusPolling,
		resetGpuInferenceState
	}
}
