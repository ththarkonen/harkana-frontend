<template>
<Modal ref = "modal"
	   title = "Calibrate point"
	   :panel-class = "'w-full max-w-lg'">
	<template #main>
		<div class = "space-y-4 pb-4">
			<p class = "text-sm leading-relaxed text-white/80">
				Use the clicked point as a reference and enter where it should appear on the horizontal axis.
			</p>

			<div class = "rounded-lg border border-white/10 bg-gray-800/80 px-3 py-2 text-sm text-white/80">
				Clicked x-axis location: <span class = "font-semibold text-white">{{ formattedClickedX }}</span>
			</div>

			<label class = "block">
				<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-white/70">Desired x-axis location</div>
				<input v-model.number = "desiredX"
					   type = "number"
					   :step = "resolvedStep"
					   inputmode = "decimal"
					   spellcheck = "false"
					   class = "w-full rounded-md border border-white/10 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/60"/>
			</label>

			<p class = "text-xs leading-snug text-white/55">
				Applying updates the current calibration preview. Save calibration from the sidebar to persist it.
			</p>
		</div>
	</template>

	<template #footer>
		<div class = "flex items-center justify-end gap-3 py-4">
			<button type = "button"
					@click = "close"
					class = "inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand">
				Cancel
			</button>
			<button type = "button"
					@click = "apply"
					class = "inline-flex items-center justify-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand">
				Apply correction
			</button>
		</div>
	</template>
</Modal>
</template>

<script setup>
import { computed, ref } from 'vue'

import Modal from './Modal.vue'

const emit = defineEmits([ 'apply' ])

const modal = ref(null)
const clickedX = ref(0)
const desiredX = ref(0)
const step = ref(0.01)

const formattedClickedX = computed(() => {
	return Number.isFinite( Number( clickedX.value ) )
		? Number( clickedX.value ).toLocaleString( undefined, { maximumFractionDigits: 6 } )
		: ''
})

const resolvedStep = computed(() => {
	const numericStep = Number( step.value )
	if( Number.isFinite( numericStep ) === false || numericStep <= 0 ){
		return 0.01
	}

	return numericStep
})

const open = async ( options = {} ) => {
	const nextClickedX = Number( options?.clickedX )
	const nextDesiredX = Number( options?.desiredX )
	const nextStep = Number( options?.step )

	clickedX.value = Number.isFinite( nextClickedX ) ? nextClickedX : 0
	desiredX.value = Number.isFinite( nextDesiredX ) ? nextDesiredX : clickedX.value
	step.value = Number.isFinite( nextStep ) && nextStep > 0 ? nextStep : 0.01

	await modal.value?.open?.()
}

const close = () => {
	modal.value?.close?.()
}

const apply = () => {
	emit( 'apply', {
		clickedX: Number( clickedX.value ),
		desiredX: Number( desiredX.value )
	} )
	close()
}

defineExpose({
	open,
	close
})
</script>
