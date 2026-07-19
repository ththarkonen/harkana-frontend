<template>
<Modal ref = "modal"
	   title = "Delete custom index profile?"
	   :show-close = "deleting === false"
	   panel-class = "w-full max-w-xl"
	   @close = "emitClose">
	<template #main>
		<div class = "space-y-4">
			<p class = "text-sm leading-relaxed text-white/85">
				The custom index profile <span class = "font-semibold text-white">{{ profileName }}</span>
				is currently used by <span class = "font-semibold text-white">{{ projectCountText }}</span>.
			</p>

			<div class = "rounded-lg border border-amber-500/70 bg-amber-500/10 px-3 py-2 text-sm leading-relaxed text-amber-100">
				Deleting this profile removes it from Settings and may prevent associated projects from loading this custom index unless the association is changed first.
			</div>

			<p class = "text-sm leading-relaxed text-white/80">
				This action cannot be undone.
			</p>
		</div>
	</template>

	<template #footer>
		<hr class = "h-0.5 mt-4 bg-gray border-0">
		<div class = "flex flex-col gap-2 py-4 sm:flex-row sm:justify-end">
			<button type = "button"
					@click = "close"
					:disabled = "deleting"
					class = "inline-flex items-center justify-center rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50">
				Cancel
			</button>
			<button type = "button"
					@click = "emitConfirm"
					:disabled = "deleting"
					class = "relative inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">
				<span :class = "{ invisible: deleting }">Delete profile</span>
				<span v-if = "deleting"
					  class = "absolute inset-0 flex items-center justify-center">
					<Spinner class = "h-5 w-5 text-white"></Spinner>
				</span>
			</button>
		</div>
	</template>
</Modal>
</template>

<script setup>
import { computed, ref } from "vue"

import Modal from "./Modal.vue"
import Spinner from "../general/Spinner.vue"

const props = defineProps({
	deleting: { type: Boolean, default: false }
})

const emit = defineEmits([ "close", "confirm" ])

const modal = ref(null)
const profile = ref(null)

const profileName = computed(() => {
	const friendlyName = String( profile.value?.friendlyName ?? "" ).trim()
	const profileID = String( profile.value?.profileID ?? "" ).trim()
	return friendlyName || profileID || "Selected profile"
})

const assignedProjectCount = computed(() => {
	return Math.max(
		0,
		Number( profile.value?.assignedProjectCount ?? profile.value?.usageCount ?? 0 ) || 0
	)
})

const projectCountText = computed(() => {
	return assignedProjectCount.value === 1 ? "1 project" : `${assignedProjectCount.value} projects`
})

const open = async ( nextProfile = {} ) => {
	profile.value = nextProfile
	await modal.value?.open?.()
}

const close = () => {
	modal.value?.close?.()
}

const emitClose = () => {
	if( props.deleting ){
		return
	}

	profile.value = null
	emit( "close" )
}

const emitConfirm = () => {
	if( props.deleting ){
		return
	}

	emit( "confirm" )
}

defineExpose({ open, close })
</script>
