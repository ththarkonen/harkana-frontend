<template>
<Modal ref = "modal"
	   :title = "title"
	   overlay-class = "fixed inset-0 z-[10020] flex items-center justify-center bg-black/50"
	   panel-class = "w-[22rem] max-w-[calc(100vw-1rem)]"
	   :showClose = "false">
	<template v-slot:main>
		<div class = "pb-4 text-sm leading-relaxed text-white/85">
			{{ body }}
		</div>
	</template>

	<template v-slot:footer>
		<div class = "flex flex-wrap items-center justify-end gap-2 py-4">
			<button type = "button"
					class = "inline-flex items-center justify-center rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
					@click = "skip">
				Skip for now
			</button>
			<button type = "button"
					class = "inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90"
					@click = "start">
				Start tutorial
			</button>
		</div>
	</template>
</Modal>
</template>

<script setup lang = "ts">

import { nextTick, ref, watch } from "vue"

import Modal from "../modals/Modal.vue"

const props = defineProps({
	visible: { type: Boolean, default: false },
	title: { type: String, default: "Welcome to the viewer" },
	body: {
		type: String,
		default: "This tutorial walks through the main viewer workflow, including false-color visualizations, heatmap interaction, spectra panels, and Raman inference."
	}
})

const emit = defineEmits([ "start", "skip" ])

const modal = ref<InstanceType<typeof Modal> | null>( null )

const start = () => {
	emit( "start" )
}

const skip = () => {
	emit( "skip" )
}

watch(() => props.visible, async ( nextVisible ) => {
	if( nextVisible ){
		await nextTick()
		await modal.value?.open?.()
		return
	}

	modal.value?.close?.()
}, { immediate: true } )

</script>
