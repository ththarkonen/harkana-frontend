<template>
<Modal ref = "modal" :title = "'Region of interest deletion'" :showClose = "!deleting">
	<template #main>
		<p class = "text-white mb-4">
			<span v-if = "roiNames.length === 1">
				Delete ROI <strong>"{{ roiNames[0] }}"</strong>?
			</span>
			<span v-else>
				Delete <strong>{{ roiNames.length }}</strong> selected regions of interest?
			</span>
		</p>

		<div class = "mb-4 rounded-lg border border-brand bg-white p-4">
			<p class = "text-xs font-semibold uppercase tracking-wide text-black">
				Regions to delete
			</p>
			<ul class = "mt-3 max-h-48 space-y-2 overflow-y-auto pr-1 text-sm text-black/90">
				<li v-for = "( roiName, index ) in roiNames"
					:key = "roiName + '-' + index"
					class = "break-words">
					{{ roiName }}
				</li>
			</ul>
		</div>

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
				{{ deleting ? "Deleting..." : deleteButtonLabel }}
			</button>
		</div>
	</template>
</Modal>
</template>

<script setup>

import { computed, ref } from "vue"

import Modal from "./Modal.vue"

const props = defineProps({
	rois: { type: Array, default: () => [] },
	roiName: { type: String, default: "" },
	roiDescription: { type: String, default: "" },
	deleting: { type: Boolean, default: false }
})

const emit = defineEmits([ "confirm" ])

const modal = ref(null)

const roiNames = computed(() => {
	if( Array.isArray( props.rois ) && props.rois.length > 0 ){
		return props.rois.map(( roi, index ) => {
			const name = String( roi?.name ?? "" ).trim()
			return name.length > 0 ? name : "Untitled ROI " + ( index + 1 )
		})
	}

	const singleName = String( props.roiName ?? "" ).trim()
	return [ singleName.length > 0 ? singleName : "Untitled ROI" ]
})

const deleteButtonLabel = computed(() => {
	return roiNames.value.length === 1 ? "Delete ROI" : "Delete ROIs"
})

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
