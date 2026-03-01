<template>
<Modal ref = "modal" :title = "'Region of interest deletion'" :showClose = "!deleting">
	<template #main>
		<p class = "text-white mb-4">
			Delete ROI <strong>"{{ displayName }}"</strong>?
		</p>
		<hr class = "h-0.5 my-4 bg-gray border-0">
		<p class = "text-white mb-4">
			This action cannot be undone.
		</p>
	</template>

	<template #footer>
		<div class = "flex gap-3">
			<button @click = "emitConfirm"
					:disabled = "deleting"
					class = "flex-1 mt-4 mb-4 bg-brand hover:bg-brand-dark text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
				{{ deleting ? "Deleting..." : "Delete ROI" }}
			</button>
		</div>
	</template>
</Modal>
</template>

<script setup>

import { computed, ref } from "vue"

import Modal from "./Modal.vue"

const props = defineProps({
	roiName: { type: String, default: "" },
	roiDescription: { type: String, default: "" },
	deleting: { type: Boolean, default: false }
})

const emit = defineEmits([ "confirm" ])

const modal = ref(null)

const displayName = computed(() => {
	const name = props.roiName.trim()
	return name.length > 0 ? name : "Untitled ROI"
})

const hasDescription = computed(() => props.roiDescription.trim().length > 0 )

const open = async () => {
	await modal.value?.open()
}

const close = () => modal.value?.close()

const emitConfirm = () => {

	if( props.deleting ) return
	emit( "confirm" )
}

defineExpose({ open, close })

</script>
