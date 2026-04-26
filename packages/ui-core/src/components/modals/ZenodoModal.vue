<template>
<Modal ref = "modal"
	   :title = "'Zenodo export'"
	   :showClose = "!running"
	   :hideScrollbar = "true">
	<template #main>
		<p class = "text-white">
			Start an export job that prepares your project as a Zenodo draft.
		</p>
		<p class = "mt-2 text-white/90">
			The draft includes the original project inputs, derived spectra and image-analysis results, and core
			project context such as metadata and saved annotations, packaged for sharing and publication.
		</p>

		<div class = "mt-3 rounded border border-amber-500/70 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
			Before starting an export, set your personal Zenodo API token in
			<a href = "/settings?section=Zenodo"
			   target = "_blank"
			   class = "underline text-brand hover:text-white transition-colors">Zenodo settings</a>.
			Additionally, default values for the draft title, description, and keywords may be configured for convenience.
		</div>

		<div v-if = "!isOwnerProject"
			 class = "mt-4 rounded border border-red-500/70 bg-red-500/10 px-3 py-2 text-sm text-red-200">
			Zenodo export is only available for owned projects.
		</div>

		<div v-if = "checkingSettings"
			 class = "mt-4 flex items-center gap-2 text-sm text-white/90">
			<Spinner class = "w-4 h-4 text-brand"></Spinner>
			<span>Checking Zenodo settings...</span>
		</div>

		<div v-if = "settingsChecked && settingsValid === false"
			 class = "mt-4 rounded border border-yellow-500/70 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-200">
			Stored Zenodo settings are missing or invalid. Please update them in the settings page before exporting.
		</div>

		<div v-if = "errorMessage.length > 0"
			 class = "mt-4 rounded border border-red-500/70 bg-red-500/10 px-3 py-2 text-sm text-red-200 whitespace-pre-wrap">
			{{ errorMessage }}
		</div>

		<div v-if = "hasSubmittedJob" class = "mt-4 mb-4 rounded border border-brand bg-black/10 px-3 py-3">
			<div class = "text-sm text-white/90 space-y-1">
				<p><strong>Status:</strong> {{ activeStatus }}</p>
				<p v-if = "formattedCreatedAt.length > 0"><strong>Created:</strong> {{ formattedCreatedAt }}</p>
				<p v-if = "formattedStartedAt.length > 0"><strong>Started:</strong> {{ formattedStartedAt }}</p>
				<p v-if = "formattedFinishedAt.length > 0"><strong>Finished:</strong> {{ formattedFinishedAt }}</p>
				<p v-if = "artifactProgressText.length > 0"><strong>Artifacts:</strong> {{ artifactProgressText }}</p>
				<p v-if = "processingProgress !== null">
					<strong>Compressing:</strong>
					{{ processingProgress.estimated }}
					<i class = "fas fa-long-arrow-alt-right mx-1 align-middle" aria-hidden = "true"></i>
					{{ processingProgress.processed }}
				</p>
				<p v-if = "uploadProgressText.length > 0"><strong>Upload:</strong> {{ uploadProgressText }}</p>
			</div>

			<div v-if = "isInProgress"
				 class = "mt-2 flex items-center gap-2 text-xs text-white/80"
				 aria-live = "polite">
				<Spinner class = "w-4 h-4 text-brand"></Spinner>
				<span>Refreshing export status...</span>
			</div>

			<div v-if = "openingStatusCheck && depositionStatusLoading && hasDraftReference"
				 class = "mt-2 flex items-center gap-2 text-xs text-white/70"
				 aria-live = "polite">
				<Spinner class = "w-4 h-4 text-brand"></Spinner>
				<span>Checking Zenodo draft status...</span>
			</div>

			<div v-if = "depositionPublished"
				 class = "mt-2 rounded border border-emerald-500/70 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
				<p class = "font-semibold">This project has been published on Zenodo.</p>
				<a v-if = "doiUrl.length > 0"
				   :href = "doiUrl"
				   target = "_blank"
				   rel = "noopener noreferrer"
				   class = "underline text-brand hover:text-white break-all transition-colors">
					Open DOI record
				</a>
				<a v-else-if = "recordUrl.length > 0"
				   :href = "recordUrl"
				   target = "_blank"
				   rel = "noopener noreferrer"
				   class = "underline text-brand hover:text-white break-all transition-colors">
					Open Zenodo record
				</a>
			</div>

			<div v-else-if = "depositionDeleted"
				 class = "mt-2 rounded border border-yellow-500/70 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
				<p class = "font-semibold">The previous Zenodo draft was deleted.</p>
				<p class = "mt-1">You can retry the upload to create a new draft.</p>
			</div>

			<div v-else-if = "hasDraftReference"
				 class = "mt-2 rounded border border-emerald-500/70 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
				<p class = "font-semibold">A Zenodo draft exists for this project.</p>
				<a v-if = "draftUrl.length > 0"
				   :href = "draftUrl"
				   target = "_blank"
				   rel = "noopener noreferrer"
				   class = "underline text-brand hover:text-white break-all transition-colors">
					Open draft in Zenodo
				</a>
				<p v-else class = "mt-1">The draft exists in Zenodo and can be managed there.</p>
			</div>

			<div v-if = "isFailed && failureDetails.length > 0"
				 class = "mt-3 rounded border border-red-500/70 bg-red-500/10 px-3 py-2 text-xs text-red-200 whitespace-pre-wrap">
				{{ failureDetails }}
			</div>

			<div v-if = "isSucceeded && hasDraftReference === false && depositionDeleted === false"
				 class = "mt-3 rounded border border-emerald-500/70 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
				Export completed successfully.
			</div>
		</div>
	</template>

	<template v-if = "showFooter" #footer>
		<hr class = "h-0.5 mt-4 bg-gray border-0">
			<div class = "flex">
				<button @click = "startExportJob"
						:disabled = "running || checkingSettings || settingsValid !== true || !isOwnerProject || !hasProjectID || zenodoReuploadLocked"
						class = "w-full mt-4 mb-4 bg-brand hover:bg-brand-dark text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
					{{ startButtonLabel }}
				</button>
			</div>
		</template>
</Modal>
</template>

<script setup>

import { computed, onBeforeUnmount, ref } from "vue"
import { projects as projectlib, zenodo } from "@harkana/tools"

import Modal from "./Modal.vue"
import Spinner from "../general/Spinner.vue"

const props = defineProps({
	project: { type: Object, required: true }
})

const modal = ref(null)
const running = ref(false)
const statusLoading = ref(false)
const checkingSettings = ref(false)
const settingsValid = ref(null)
const settingsChecked = ref(false)
const errorMessage = ref("")

const submission = ref(null)
const exportStatus = ref(null)
const depositionStatus = ref(null)
const activeJobId = ref("")
const depositionStatusLoading = ref(false)
const openingStatusCheck = ref(false)

const pollTimerID = ref(null)
const POLL_INTERVAL_MS = 4000
const PERSISTED_ZENODO_JOB_ID_FIELD = "zenodoExportJobId"
const TERMINAL_STATUSES = new Set([ "SUCCEEDED", "FAILED" ])
const NON_TERMINAL_STATUSES = new Set([
	"SUBMITTED",
	"STARTED",
	"CREATING_DRAFT",
	"ENUMERATING_ARTIFACTS",
	"BUILDING_ARCHIVE",
	"UPLOADING_ARCHIVE"
])

const hasProjectID = computed(() => {
	return String( props.project?.id ?? "" ).trim().length > 0
})

const isOwnerProject = computed(() => {
	return props.project?.shared !== true
})

const resolvedDataType = computed(() => {
	const normalized = String( import.meta.env.VITE_DATA_TYPE ?? "" ).trim().toLowerCase()
	if(
		normalized === "cars" ||
		normalized === "raman" ||
		normalized === "hypercars" ||
		normalized === "hyperraman"
	){
		return normalized
	}

	return "raman"
})

const hasSubmittedJob = computed(() => {
	return activeJobId.value.length > 0
})

const activeStatus = computed(() => {
	return String( exportStatus.value?.status ?? submission.value?.status ?? "NOT_STARTED" ).trim()
})

const isFailed = computed(() => {
	return activeStatus.value === "FAILED"
})

const isSucceeded = computed(() => {
	return activeStatus.value === "SUCCEEDED"
})

const isInProgress = computed(() => {
	return NON_TERMINAL_STATUSES.has( activeStatus.value )
})

const draftUrl = computed(() => {
	const fromDeposition = String( depositionStatus.value?.htmlUrl ?? "" ).trim()
	if( fromDeposition.length > 0 ){
		return fromDeposition
	}

	return String( exportStatus.value?.zenodo?.htmlUrl ?? "" ).trim()
})

const doiUrl = computed(() => {
	return String( depositionStatus.value?.doi_url ?? "" ).trim()
})

const recordUrl = computed(() => {
	return String( depositionStatus.value?.record_url ?? "" ).trim()
})

const depositionExists = computed(() => {
	return depositionStatus.value?.exists === true
})

const depositionPublished = computed(() => {
	return depositionStatus.value?.published === true
})

const depositionDeleted = computed(() => {
	return depositionStatus.value?.deleted === true
})

const hasDraftReference = computed(() => {
	if( draftUrl.value.length > 0 ){
		return true
	}

	const rawDepositId = Number( depositionStatus.value?.depositId ?? exportStatus.value?.zenodo?.depositId )
	return Number.isFinite( rawDepositId ) && rawDepositId > 0
})

const zenodoReuploadLocked = computed(() => {
	if( depositionDeleted.value ){
		return false
	}

	if( depositionPublished.value || depositionExists.value ){
		return true
	}

	return hasDraftReference.value && isSucceeded.value
})

const showFooter = computed(() => {
	return !isInProgress.value && !zenodoReuploadLocked.value
})

const startButtonLabel = computed(() => {
	if( depositionDeleted.value || isFailed.value ){
		return "Retry Zenodo export"
	}

	return "Start Zenodo export"
})

const artifactProgressText = computed(() => {
	const total = Number( exportStatus.value?.artifactCountTotal )
	const processed = Number( exportStatus.value?.artifactCountProcessed )

	if( Number.isFinite( total ) === false || Number.isFinite( processed ) === false ){
		return ""
	}

	return `${processed} / ${total}`
})

const processingProgress = computed(() => {
	const processedBytes = Number( exportStatus.value?.bytesProcessed )
	const estimatedBytes = Number( exportStatus.value?.estimatedInputBytes )

	if( Number.isFinite( processedBytes ) === false || Number.isFinite( estimatedBytes ) === false ){
		return null
	}

	return {
		estimated: formatBytes( estimatedBytes ),
		processed: formatBytes( processedBytes )
	}
})

const uploadProgressText = computed(() => {
	const uploadedBytes = Number( exportStatus.value?.bytesUploaded )
	const archiveBytes = Number( exportStatus.value?.archiveSizeBytes )

	if( Number.isFinite( uploadedBytes ) === false || Number.isFinite( archiveBytes ) === false ){
		return ""
	}

	return `${formatBytes( uploadedBytes )} / ${formatBytes( archiveBytes )}`
})

const formattedCreatedAt = computed(() => {
	return formatTimestamp( exportStatus.value?.createdAt )
})

const formattedStartedAt = computed(() => {
	return formatTimestamp( exportStatus.value?.startedAt )
})

const formattedFinishedAt = computed(() => {
	return formatTimestamp( exportStatus.value?.finishedAt )
})

const failureDetails = computed(() => {
	if( !isFailed.value ) return ""

	const code = String( exportStatus.value?.errorCode ?? "" ).trim()
	const message = String( exportStatus.value?.errorMessage ?? "" ).trim()

	if( code.length > 0 && message.length > 0 ){
		return `${code}: ${message}`
	}

	return code.length > 0 ? code : message
})

const formatTimestamp = ( value ) => {

	const input = String( value ?? "" ).trim()
	if( input.length === 0 ){
		return ""
	}

	const date = new Date( input )
	if( Number.isNaN( date.getTime() ) ){
		return input
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

	return `${datePart}, ${timePart}`
}

const formatBytes = ( value ) => {

	const bytes = Number( value )
	if( Number.isFinite( bytes ) === false || bytes < 0 ){
		return ""
	}

	const units = [ "B", "KB", "MB", "GB", "TB" ]
	if( bytes === 0 ){
		return "0 B"
	}

	const exponent = Math.min( units.length - 1, Math.floor( Math.log( bytes ) / Math.log( 1024 )))
	const scaled = bytes / Math.pow( 1024, exponent )
	const precision = scaled >= 100 ? 0 : ( scaled >= 10 ? 1 : 2 )

	return `${scaled.toFixed( precision )} ${units[exponent]}`
}

const clearPolling = () => {
	if( pollTimerID.value === null ) return

	clearInterval( pollTimerID.value )
	pollTimerID.value = null
}

const startPolling = () => {

	clearPolling()

	pollTimerID.value = setInterval(() => {
		void refreshStatus()
	}, POLL_INTERVAL_MS )
}

const resetState = () => {

	clearPolling()

	errorMessage.value = ""
	settingsValid.value = null
	settingsChecked.value = false
	submission.value = null
	exportStatus.value = null
	depositionStatus.value = null
	activeJobId.value = ""
	openingStatusCheck.value = false
}

const readStoredExportJobId = async () => {

	if( isOwnerProject.value === false ) return ""
	if( hasProjectID.value === false ) return ""

	const fromProject = String(
		props.project?.[PERSISTED_ZENODO_JOB_ID_FIELD] ??
		props.project?.zenodoJobId ??
		""
	).trim()
	if( fromProject.length > 0 ){
		return fromProject
	}

	try{
		const projectInfo = await projectlib.getInfo( props.project )
		if( projectInfo === null || typeof projectInfo !== "object" || projectInfo instanceof Error ){
			return ""
		}

		return String(
			projectInfo?.[PERSISTED_ZENODO_JOB_ID_FIELD] ??
			projectInfo?.zenodoJobId ??
			""
		).trim()
	} catch( error ){
		console.log( error )
		return ""
	}
}

const persistExportJobId = async ( jobId ) => {

	if( isOwnerProject.value === false ) return
	if( hasProjectID.value === false ) return

	try{
		const projectInfo = await projectlib.getInfo( props.project )
		if( projectInfo === null || typeof projectInfo !== "object" || projectInfo instanceof Error ){
			return
		}

		const normalizedJobId = String( jobId ?? "" ).trim()
		projectInfo[PERSISTED_ZENODO_JOB_ID_FIELD] = normalizedJobId

		await projectlib.setInfo( projectInfo )

		if( props.project !== null && typeof props.project === "object" ){
			props.project[PERSISTED_ZENODO_JOB_ID_FIELD] = normalizedJobId
		}
	} catch( error ){
		console.log( error )
	}
}

const refreshSettingsValidation = async () => {

	checkingSettings.value = true
	errorMessage.value = ""

	try{
		await zenodo.checkSettings()
		settingsValid.value = true
		settingsChecked.value = true
	} catch( error ){
		settingsValid.value = false
		settingsChecked.value = true
		errorMessage.value = error?.message ?? "Zenodo settings are missing or invalid."
	} finally {
		checkingSettings.value = false
	}
}

const refreshDepositionStatus = async ( options = {} ) => {

	if( activeJobId.value.length === 0 ) return
	if( depositionStatusLoading.value ) return

	const suppressErrors = options?.suppressErrors === true
	depositionStatusLoading.value = true

	try{
		const response = await zenodo.depositionStatus( activeJobId.value )
		depositionStatus.value = response
	} catch( error ){
		if( suppressErrors === false ){
			errorMessage.value = error?.message ?? "Failed to fetch Zenodo deposition status."
		}
	} finally {
		depositionStatusLoading.value = false
	}
}

const refreshStatus = async ( options = {} ) => {

	if( activeJobId.value.length === 0 ) return false
	if( statusLoading.value ) return false

	const suppressErrors = options?.suppressErrors === true
	statusLoading.value = true

	try{
		const response = await zenodo.status( activeJobId.value )
		exportStatus.value = response

		const rawDepositId = Number( response?.zenodo?.depositId )
		if( Number.isFinite( rawDepositId ) && rawDepositId > 0 ){
			await refreshDepositionStatus({ suppressErrors: true })
		} else {
			depositionStatus.value = null
		}

		if( TERMINAL_STATUSES.has( String( response?.status ?? "" ).trim() )){
			clearPolling()
		}

		return true
	} catch( error ){
		if( suppressErrors === false ){
			errorMessage.value = error?.message ?? "Failed to fetch Zenodo export status."
		}

		clearPolling()
		return false
	} finally {
		statusLoading.value = false
	}
}

const startExportJob = async () => {

	if( running.value ) return
	if( checkingSettings.value ) return
	if( settingsValid.value !== true ) return
	if( isOwnerProject.value === false ) return
	if( hasProjectID.value === false ) return
	if( zenodoReuploadLocked.value ) return

	running.value = true
	errorMessage.value = ""

	try{
		const response = await zenodo.startExport( props.project, resolvedDataType.value )
		submission.value = response
		activeJobId.value = String( response?.jobId ?? "" ).trim()
		await persistExportJobId( activeJobId.value )

		await refreshStatus()

		if( NON_TERMINAL_STATUSES.has( activeStatus.value ) ){
			startPolling()
		}
	} catch( error ){
		errorMessage.value = error?.message ?? "Failed to start Zenodo export."
	} finally {
		running.value = false
	}
}

const open = async () => {
	resetState()
	await modal.value?.open()
	await refreshSettingsValidation()

	if( isOwnerProject.value === false ) return

	openingStatusCheck.value = true

	const storedJobId = await readStoredExportJobId()
	if( storedJobId.length === 0 ){
		openingStatusCheck.value = false
		return
	}

	activeJobId.value = storedJobId
	const loaded = await refreshStatus({ suppressErrors: true })
	if( loaded === false ){
		activeJobId.value = ""
		submission.value = null
		exportStatus.value = null
		depositionStatus.value = null
		await persistExportJobId( "" )
		openingStatusCheck.value = false
		return
	}

	if( NON_TERMINAL_STATUSES.has( activeStatus.value ) ){
		startPolling()
	}

	openingStatusCheck.value = false
}

const close = () => {
	clearPolling()
	modal.value?.close()
}

onBeforeUnmount(() => {
	clearPolling()
})

defineExpose({
	open,
	close
})

</script>
