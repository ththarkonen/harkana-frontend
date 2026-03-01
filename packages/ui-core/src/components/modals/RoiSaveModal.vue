<template>
<Modal ref = "modal" :title = "'Save region of interest'" :showClose = "!saving">
	<template #main>
		<p class = "text-white mb-4">
			Save the current heatmap selection as a reusable region of interest.
		</p>

		<label for = "roi-name" class = "block text-sm font-semibold text-white mb-1">
			Name
		</label>
		<input id = "roi-name"
				type = "text"
				v-model = "name"
				placeholder = "Region of interest name"
				class = "w-full px-3 py-2 rounded text-black focus:outline-none focus:ring-2 focus:ring-brand"/>

		<label for = "roi-description" class = "block text-sm font-semibold text-white mt-4 mb-1">
			Description
		</label>
		<textarea id = "roi-description"
				  v-model = "description"
				  rows = "4"
				  placeholder = "Region of interest description"
				  class = "w-full px-3 py-2 rounded text-black focus:outline-none focus:ring-2 focus:ring-brand"></textarea>
	</template>

	<template #footer>
		<hr class = "h-0.5 mt-4 bg-gray border-0">
		<div class = "flex gap-3">
			<button @click = "emitSave"
					:disabled = "!canSave"
					class = "flex-1 mt-4 mb-4 bg-brand hover:bg-brand-dark text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
				{{ saving ? "Saving..." : "Save ROI" }}
			</button>
		</div>
	</template>
</Modal>
</template>

<script setup>

import { computed, ref } from "vue"

import Modal from "./Modal.vue"

const props = defineProps({
	saving: { type: Boolean, default: false }
})

const emit = defineEmits([ "save" ])

const modal = ref(null)
const name = ref("")
const description = ref("")

const canSave = computed(() => {
	return name.value.trim().length > 0 && props.saving === false
})

const open = async () => {

	name.value = ""
	description.value = ""
	await modal.value?.open()
}

const close = () => modal.value?.close()

const emitSave = () => {

	if( canSave.value === false ) return

	emit( "save", {
		name: name.value.trim(),
		description: description.value
	})
}

defineExpose({ open, close })

</script>
