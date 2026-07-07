<template>
<Modal ref = "modal" :title = "'Raman spectrum inference'" :showClose = "!running">
	<template #main>
		<p class = "text-white">
			Estimate pixel-wise Raman spectra using cloud-based GPU resources. The inference process typically takes a few
			minutes. Once complete, results derived from the estimated Raman spectra can be explored through the
			visualization options in the sidebar.
		</p>

		<div class = "mt-3 rounded border border-amber-500/70 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
			Correct orientation of the spectral axis is essential for the Raman spectrum inference. Please verify the direction of spectral axis.
			A flipped spectral axis will result in incorrect estimates for the Raman spectrum. The spectral axis is assumed to be linear in terms of
			energy, e.g., the axis should be in wavenumbers, frequency, or electron volts.
		</div>
		<div v-if = "spectralCalibrationProfileName.trim().length > 0"
			 class = "mt-3 rounded border border-brand/70 bg-brand/10 px-3 py-2 text-sm text-white">
			<strong>Active spectral calibration:</strong> {{ spectralCalibrationProfileName }}
		</div>

		<div v-if = "!isReady && !inferenceInProgress" class = "mt-3 mb-4 rounded border border-gray-600 bg-gray-800/70 px-3 py-2 text-sm text-white">
			<p><strong>Active token source:</strong> {{ tokenGroupName }}</p>
			<p><strong>Current token balance:</strong> {{ tokenBalanceText }}</p>
			<p class = "text-white/80 mt-2">A successful inference run costs {{ ramanEstimationTokenCostText }}.</p>
		</div>

		<div v-if = "errorMessage.length > 0" class = "mt-4 rounded border border-red-500/70 bg-red-500/10 px-3 py-2 text-sm text-red-200">
			{{ errorMessage }}
		</div>

		<div v-if = "hasSubmittedJob" class = "mt-4 mb-4 rounded border border-brand bg-black/10 px-3 py-3">
			<div class = "text-sm text-white/90">
				<p><strong>Status:</strong> {{ activeStatus }}</p>
				<p v-if = "formattedUpdatedAt.length > 0"><strong>Updated:</strong> {{ formattedUpdatedAt }}</p>
			</div>

			<div v-if = "statusLoading" class = "mt-3 flex items-center gap-2 text-sm text-white/90">
				<Spinner class = "w-4 h-4 text-brand"></Spinner>
				<span>Checking status...</span>
			</div>

			<div v-if = "isFailed && failureDetails.length > 0"
				 class = "mt-3 rounded border border-red-500/70 bg-red-500/10 px-3 py-2 text-xs text-red-200 whitespace-pre-wrap">
				{{ failureDetails }}
			</div>

			<div v-if = "isReady"
				 class = "mt-3 rounded border border-emerald-500/70 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
				Inference is ready.
			</div>
		</div>

		<div v-if = "hasSubmittedJob && isReady && showRerunControls === false" class = "mt-3 mb-4">
			<button @click = "openRerunControls"
					:disabled = "running || statusLoading"
					class = "w-full bg-brand hover:bg-brand-dark text-white text-sm font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
				Show GPU inference controls again
			</button>
		</div>

		<div v-if = "hasSubmittedJob && isReady && showRerunControls && !inferenceInProgress"
			 class = "mt-3 mb-4 rounded border border-gray-600 bg-gray-800/70 px-3 py-3 text-sm text-white">
			<p><strong>Active token source:</strong> {{ tokenGroupName }}</p>
			<p><strong>Current token balance:</strong> {{ tokenBalanceText }}</p>
			<p class = "text-white/80 mt-2">A successful inference run costs {{ ramanEstimationTokenCostText }}. Previous inference results are deleted on a rerun.</p>

			<button @click = "runInference"
					:disabled = "running || statusLoading || hasProjectID === false"
					class = "w-full mt-3 bg-brand hover:bg-brand-dark text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
				Rerun GPU inference
			</button>
		</div>
	</template>

	<template v-if = "showFooter" #footer>
		<hr class = "h-0.5 mt-4 bg-gray border-0">
		<div class = "flex">
			<button @click = "runInference"
					:disabled = "running || statusLoading || hasProjectID === false"
					class = "w-full mt-4 mb-4 bg-brand hover:bg-brand-dark text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
				Run GPU inference
			</button>
		</div>
	</template>
</Modal>
</template>

<script setup>

import { computed, ref } from "vue"
import { hyperspectra, settings, tokens } from "@harkana/tools"
import {
	HYPERSPECTRUM_RAMAN_ESTIMATION_TOKEN_COST,
	formatTokenCost
} from "../../constants/tokenCosts.js"

import Modal from "./Modal.vue"
import Spinner from "../general/Spinner.vue"

const props = defineProps({
	project: { type: Object, required: true },
	defaultGroupId: { type: String, default: "" },
	initialJobId: { type: String, default: "" },
	initialStatus: { type: String, default: "" },
	spectralCalibrationProfileName: { type: String, default: "" }
})

const emit = defineEmits([ "submitted", "status" ])

const modal = ref(null)
const running = ref(false)
const statusLoading = ref(false)
const errorMessage = ref("")

const activeJobId = ref("")
const tokenGroupID = ref("")
const tokenGroupName = ref("Personal token balance")
const tokenBalance = ref(null)
const tokenBalanceLoading = ref(false)
const showRerunControls = ref(false)

const submission = ref(null)
const jobStatus = ref(null)

const NON_TERMINAL_STATUSES = new Set([ "SUBMITTED", "STARTED" ])
const ramanEstimationTokenCostText = formatTokenCost( HYPERSPECTRUM_RAMAN_ESTIMATION_TOKEN_COST )

const hasProjectID = computed(() => {
	const projectID = String( props.project?.id ?? "" ).trim()
	return projectID.length > 0
})

const hasSubmittedJob = computed(() => {
	return activeJobId.value.length > 0
})

const activeStatus = computed(() => {
	return String( jobStatus.value?.status ?? submission.value?.status ?? "NOT_STARTED" )
})

const isFailed = computed(() => {
	return activeStatus.value === "FAILED"
})

const isReady = computed(() => {
	return activeStatus.value === "SUCCEEDED"
})

const inferenceInProgress = computed(() => {
	return running.value || NON_TERMINAL_STATUSES.has( activeStatus.value )
})

const showFooter = computed(() => {
	return !inferenceInProgress.value && !isReady.value
})

const formattedUpdatedAt = computed(() => {

	const updatedAt = String( jobStatus.value?.updatedAt ?? "" ).trim()
	if( updatedAt.length === 0 ) return ""

	const date = new Date( updatedAt )
	if( Number.isNaN( date.getTime() ) ){
		return updatedAt
	}

	const datePart = date.toLocaleDateString( undefined, {
		month: "long",
		day: "numeric",
		year: "numeric"
	})
	const timePart = date.toLocaleTimeString( undefined, {
		hour: "numeric",
		minute: "2-digit",
		second: "2-digit"
	})
	return datePart + ", " + timePart
})

const tokenBalanceText = computed(() => {
	if( tokenBalanceLoading.value ) return "Loading..."

	const numericBalance = Number( tokenBalance.value )
	if( Number.isFinite( numericBalance ) ){
		return numericBalance.toLocaleString()
	}

	return "Unavailable"
})

const failureDetails = computed(() => {
	if( !isFailed.value ) return ""

	const errorCode = String( jobStatus.value?.errorCode ?? "" ).trim()
	const errorText = String( jobStatus.value?.errorMessage ?? "" ).trim()

	if( errorCode.length === 0 && errorText.length === 0 ){
		return ""
	}

	if( errorCode.length > 0 && errorText.length > 0 ){
		return errorCode + ": " + errorText
	}

	return errorCode.length > 0 ? errorCode : errorText
})

const resetForm = () => {

	errorMessage.value = ""
	tokenGroupID.value = String( props.defaultGroupId ?? "" )
	tokenGroupName.value = "Personal token balance"
	tokenBalance.value = null
	tokenBalanceLoading.value = false
	const initialStatus = String( props.initialStatus ?? "" ).trim()
	submission.value = initialStatus.length > 0
		? { status: initialStatus }
		: null
	jobStatus.value = null
	activeJobId.value = String( props.initialJobId ?? "" ).trim()
	showRerunControls.value = false
}

const refreshBillingContext = async () => {

	tokenBalanceLoading.value = true

	try{
		const billingSettings = await settings.getBilling()
		if( billingSettings && typeof billingSettings === "object" ){
			tokenGroupID.value = typeof billingSettings.groupID === "string"
				? billingSettings.groupID
				: String( props.defaultGroupId ?? "" )

			const groupName = String( billingSettings.groupName ?? "" ).trim()
			tokenGroupName.value = groupName.length > 0
				? groupName
				: "Personal token balance"
		}

		tokenBalance.value = await tokens.balance( tokenGroupID.value )
	} catch( error ){
		console.log( error )
		tokenBalance.value = null
	} finally {
		tokenBalanceLoading.value = false
	}
}

const refreshStatus = async () => {

	if( activeJobId.value.length === 0 ) return
	if( statusLoading.value ) return

	statusLoading.value = true

	try{
		const response = await hyperspectra.status( activeJobId.value )
		jobStatus.value = response
		emit( "status", response )
	} catch( error ){
		errorMessage.value = error?.message ?? "Failed to fetch job status."
	} finally {
		statusLoading.value = false
	}
}

const runInference = async () => {

	if( running.value ) return
	if( hasProjectID.value === false ) return

	errorMessage.value = ""
	running.value = true

	try{
		await refreshBillingContext()

		const response = await hyperspectra.estimate(
			props.project,
			String( tokenGroupID.value ?? "" )
		)

		submission.value = response
		activeJobId.value = String( response?.jobId ?? "" ).trim()
		emit( "submitted", response )

		if( activeJobId.value.length > 0 ){
			await refreshStatus()
		}
	} catch( error ){
		errorMessage.value = error?.message ?? "Failed to submit GPU inference job."
	} finally {
		running.value = false
	}
}

const openRerunControls = async () => {

	if( showRerunControls.value ) return
	showRerunControls.value = true
	await refreshBillingContext()
}

const open = async () => {
	resetForm()
	await modal.value?.open()
	void refreshBillingContext()

	if( activeJobId.value.length > 0 ){
		await refreshStatus()
	}
}

const close = () => {
	modal.value?.close()
}

defineExpose({ open, close })

</script>
