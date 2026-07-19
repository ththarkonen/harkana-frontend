<template>
<div class = "min-h-screen bg-brand p-[2px]">
	<main class = "flex min-h-[calc(100vh-4px)] items-center justify-center rounded-lg bg-white px-4 py-10">
		<section class = "w-full max-w-3xl rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
			<div class = "mb-6">
				<div class = "text-5xl font-harkana text-brand">HARKANA</div>
				<h1 class = "mt-4 text-2xl font-bold text-black">Account deletion</h1>
			</div>

			<div v-if = "deletedOnly"
				 class = "rounded-lg border border-black/10 bg-black/[0.03] px-4 py-3">
				<h2 class = "m-0 text-lg font-semibold text-black">Account deleted</h2>
				<p class = "mb-0 mt-2 text-sm text-black/65">
					The account is no longer available. Local authentication state has been cleared in this browser session.
				</p>
			</div>

			<div v-else-if = "missingSession"
				 class = "rounded-lg border border-amber-400/60 bg-amber-50 px-4 py-3 text-amber-900">
				<h2 class = "m-0 text-lg font-semibold">Deletion status token unavailable</h2>
				<p class = "mb-0 mt-2 text-sm leading-6">
					The deletion status token is shown only when deletion starts. Without it, this browser session cannot poll
					or retry the deletion job through the status endpoints.
				</p>
			</div>

			<div v-else class = "space-y-5">
				<div class = "rounded-lg border border-black/10 bg-black/[0.025] px-4 py-4">
					<div class = "mb-3 flex flex-wrap items-center gap-3">
					<span class = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
						  :class = "statusPillClass">
						{{ statusLabel }}
					</span>
					<span v-if = "polling"
						  class = "ml-auto inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-black/55">
						<Spinner class = "h-4 w-4" />
						Polling
					</span>
				</div>
					<h2 class = "m-0 text-lg font-semibold text-black">{{ statusHeading }}</h2>
					<p class = "mb-0 mt-2 text-sm leading-6 text-black/65">
						Account deletion has been initiated. Deletion is typically finalized in a few minutes, depending on
						the number of projects and their size in the database. You can leave this page; deletion will
						continue on HARKANA servers.
					</p>
				</div>

				<div v-if = "statusLoading && statusResponse === null"
					 class = "flex items-center gap-3 rounded-lg border border-black/10 px-4 py-4 text-sm text-black/65">
					<Spinner class = "h-5 w-5" />
					Loading deletion status...
				</div>

				<div v-if = "statusError.length > 0"
					 class = "rounded-lg border border-red-500/50 bg-red-50 px-4 py-3 text-sm text-red-800">
					{{ statusError }}
				</div>

				<div v-if = "failed"
					 class = "rounded-lg border border-red-500/50 bg-red-50 px-4 py-3">
					<h2 class = "m-0 text-sm font-semibold uppercase tracking-wide text-red-800">Deletion failed</h2>
					<p class = "mb-0 mt-2 text-sm text-red-800">{{ failureMessage }}</p>
					<button @click = "retryDeletion"
							:disabled = "retrying"
							class = "relative mt-4 inline-flex items-center justify-center rounded-full border border-red-500/60 bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
						<span :class = "{ invisible: retrying }">Retry deletion</span>
						<span v-if = "retrying" class = "absolute">
							<Spinner class = "h-5 w-5 text-white" />
						</span>
					</button>
				</div>

				<div v-if = "completed"
					 class = "rounded-lg border border-emerald-500/40 bg-emerald-50 px-4 py-3 text-emerald-900">
					<h2 class = "m-0 text-lg font-semibold">Account deletion completed</h2>
					<p class = "mb-0 mt-2 text-sm">
						Local authentication state has been cleared. You can close this tab or return to sign in.
					</p>
				</div>
			</div>

			<div class = "mt-6 flex justify-end">
				<button @click = "returnToSignIn"
						class = "inline-flex items-center justify-center rounded-full border border-black/10 bg-black/[0.03] px-4 py-2 text-xs font-semibold text-black/75 transition hover:border-brand hover:bg-brand hover:text-white">
					Return to sign in
				</button>
			</div>
		</section>
	</main>
</div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { Amplify } from "aws-amplify"
import { account } from "@harkana/tools"
import Spinner from "./general/Spinner.vue"

const emit = defineEmits([ "loaded" ])

const route = useRoute()
const router = useRouter()

const statusResponse = ref( null )
const statusLoading = ref( false )
const statusError = ref( "" )
const polling = ref( false )
const retrying = ref( false )
const localAuthCleared = ref( false )
const session = ref( account.getAccountDeletionSession() )

let pollTimer = null

const deletedOnly = computed(() => route.query.state === "deleted" )
const missingSession = computed(() => deletedOnly.value === false && session.value === null )
const completed = computed(() => statusResponse.value?.status === "completed" )
const failed = computed(() => statusResponse.value?.status === "failed" )
const statusLabel = computed(() => String( statusResponse.value?.status ?? "pending" ))
const failureMessage = computed(() => {
	const message = String( statusResponse.value?.errorMessage ?? "" ).trim()
	return message.length > 0 ? message : "Deletion failed. Retry the deletion job or contact support if it fails again."
})
const statusHeading = computed(() => {
	if( completed.value ) return "Account deletion completed"
	if( failed.value ) return "Account deletion could not be completed"
	return "Account deletion initiated"
})

const statusPillClass = computed(() => {
	if( completed.value ) return "bg-emerald-100 text-emerald-900"
	if( failed.value ) return "bg-red-100 text-red-800"
	if( statusResponse.value?.status === "running" ) return "bg-blue-100 text-blue-900"
	return "bg-amber-100 text-amber-900"
})

const stopPolling = () => {
	if( pollTimer !== null ){
		window.clearTimeout( pollTimer )
		pollTimer = null
	}
	polling.value = false
}

const clearLocalAuthState = async () => {
	if( localAuthCleared.value ){
		return
	}

	localAuthCleared.value = true
	try{
		await Amplify.Auth.signOut({ global: true })
	} catch{
		try{
			await Amplify.Auth.signOut()
		} catch{
			// The account may already be disabled or deleted; local cleanup is best-effort.
		}
	}
}

const schedulePoll = () => {
	stopPolling()
	if( completed.value || failed.value || missingSession.value ){
		return
	}

	polling.value = true
	pollTimer = window.setTimeout(() => {
		void loadStatus()
	}, 3500 )
}

const loadStatus = async () => {
	if( missingSession.value || deletedOnly.value ){
		return
	}

	statusLoading.value = true
	statusError.value = ""
	try{
		const response = await account.deletionStatus(
			session.value.deletionID,
			session.value.statusToken
		)
		statusResponse.value = response
		if( response.status === "completed" ){
			stopPolling()
			account.clearAccountDeletionSession()
			await clearLocalAuthState()
			return
		}
		schedulePoll()
	} catch( error ){
		statusError.value = String( error?.detail ?? error?.message ?? "Failed to load account deletion status." ).trim()
		schedulePoll()
	} finally {
		statusLoading.value = false
	}
}

const retryDeletion = async () => {
	if( session.value === null || retrying.value ){
		return
	}

	retrying.value = true
	statusError.value = ""
	try{
		statusResponse.value = await account.retryDeletion(
			session.value.deletionID,
			session.value.statusToken
		)
		schedulePoll()
	} catch( error ){
		statusError.value = String( error?.detail ?? error?.message ?? "Failed to retry account deletion." ).trim()
	} finally {
		retrying.value = false
	}
}

const returnToSignIn = async () => {
	await clearLocalAuthState()
	await router.replace({ name: "Main menu" }).catch(() => {})
}

onMounted(() => {
	emit( "loaded" )
	if( deletedOnly.value ){
		void clearLocalAuthState()
		return
	}
	void loadStatus()
})

onUnmounted(() => {
	stopPolling()
})
</script>
