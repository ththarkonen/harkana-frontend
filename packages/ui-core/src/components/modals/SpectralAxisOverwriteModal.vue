<template>
<Modal ref = "modal"
	   title = "Overwrite raw spectral axis?"
	   :show-close = "saving === false"
	   panel-class = "w-full max-w-xl">
	<template #main>
		<div class = "space-y-4">
			<p class = "text-sm leading-relaxed text-white/85">
				The calibration profile <span class = "font-semibold text-white">{{ profileName }}</span>
				was created with a different raw Z spectral axis. To assign this profile, the current project raw Z axis will be overwritten with the axis stored in the profile.
			</p>

			<div class = "rounded-lg border border-amber-500/70 bg-amber-500/10 px-3 py-2 text-sm leading-relaxed text-amber-100">
				This changes the raw spectral axis values used by the project. The calibration profile will then be applied on top of those raw values.
			</div>

			<div class = "grid gap-3 sm:grid-cols-2">
				<div class = "rounded-lg border border-white/10 bg-white/5 p-3">
					<div class = "mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
						Current project
					</div>
					<dl class = "space-y-1 text-sm text-white/80">
						<div class = "flex justify-between gap-3">
							<dt>Values</dt>
							<dd class = "font-medium text-white">{{ currentAxis.valueCount }}</dd>
						</div>
						<div class = "flex justify-between gap-3">
							<dt>First</dt>
							<dd class = "font-medium text-white">{{ formatAxisValue( currentAxis.firstValue ) }}</dd>
						</div>
						<div class = "flex justify-between gap-3">
							<dt>Last</dt>
							<dd class = "font-medium text-white">{{ formatAxisValue( currentAxis.lastValue ) }}</dd>
						</div>
						<div class = "flex justify-between gap-3">
							<dt>Unit</dt>
							<dd class = "font-medium text-white">{{ currentAxis.unit }}</dd>
						</div>
					</dl>
				</div>

				<div class = "rounded-lg border border-brand/70 bg-brand/10 p-3">
					<div class = "mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
						Profile axis
					</div>
					<dl class = "space-y-1 text-sm text-white/80">
						<div class = "flex justify-between gap-3">
							<dt>Values</dt>
							<dd class = "font-medium text-white">{{ profileAxis.valueCount }}</dd>
						</div>
						<div class = "flex justify-between gap-3">
							<dt>First</dt>
							<dd class = "font-medium text-white">{{ formatAxisValue( profileAxis.firstValue ) }}</dd>
						</div>
						<div class = "flex justify-between gap-3">
							<dt>Last</dt>
							<dd class = "font-medium text-white">{{ formatAxisValue( profileAxis.lastValue ) }}</dd>
						</div>
						<div class = "flex justify-between gap-3">
							<dt>Unit</dt>
							<dd class = "font-medium text-white">{{ profileAxis.unit }}</dd>
						</div>
					</dl>
				</div>
			</div>
		</div>
	</template>

	<template #footer>
		<hr class = "h-0.5 mt-4 bg-gray border-0">
		<div class = "flex flex-col gap-2 py-4 sm:flex-row sm:justify-end">
			<button type = "button"
					@click = "close"
					:disabled = "saving"
					class = "inline-flex items-center justify-center rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50">
				Cancel
			</button>
			<button type = "button"
					@click = "emitConfirm"
					:disabled = "saving"
					class = "relative inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">
				<span :class = "{ invisible: saving }">Overwrite raw Z axis and assign</span>
				<span v-if = "saving"
					  class = "absolute inset-0 flex items-center justify-center">
					<Spinner class = "h-5 w-5 text-white"></Spinner>
				</span>
			</button>
		</div>
	</template>
</Modal>
</template>

<script setup>

import { ref } from "vue"

import Spinner from "../general/Spinner.vue"
import Modal from "./Modal.vue"

const props = defineProps({
	saving: { type: Boolean, default: false }
})

const emit = defineEmits([ "confirm" ])

const modal = ref(null)
const profileName = ref("Selected calibration profile")
const currentAxis = ref({ valueCount: 0, firstValue: null, lastValue: null, unit: "index" })
const profileAxis = ref({ valueCount: 0, firstValue: null, lastValue: null, unit: "index" })

const normalizeAxisSummary = ( axis = {} ) => {
	return {
		valueCount: Math.max( 0, Number( axis?.valueCount ?? 0 ) || 0 ),
		firstValue: Number.isFinite( Number( axis?.firstValue ) ) ? Number( axis.firstValue ) : null,
		lastValue: Number.isFinite( Number( axis?.lastValue ) ) ? Number( axis.lastValue ) : null,
		unit: String( axis?.unit ?? "index" ).trim() || "index"
	}
}

const formatAxisValue = ( value ) => {
	const numericValue = Number( value )
	if( Number.isFinite( numericValue ) === false ){
		return "N/A"
	}

	return Number.isInteger( numericValue )
		? String( numericValue )
		: numericValue.toPrecision( 6 )
}

const open = async ( payload = {} ) => {
	profileName.value = String( payload?.profileName ?? "Selected calibration profile" ).trim() || "Selected calibration profile"
	currentAxis.value = normalizeAxisSummary( payload?.currentAxis )
	profileAxis.value = normalizeAxisSummary( payload?.profileAxis )
	await modal.value?.open?.()
}

const close = () => {
	modal.value?.close?.()
}

const emitConfirm = () => {
	if( props.saving ){
		return
	}

	emit( "confirm" )
}

defineExpose({ open, close })

</script>
