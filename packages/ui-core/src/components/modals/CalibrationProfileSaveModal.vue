<template>
<Modal ref = "modal"
	   :title = "title"
	   :show-close = "saving === false"
	   panel-class = "w-full max-w-xl">
	<template #main>
		<div class = "space-y-4">
			<p class = "text-sm leading-relaxed text-white/85">
				{{ descriptionText }}
			</p>

			<label for = "calibration-profile-name"
				   class = "block">
				<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-white/70">
					Profile name
				</div>
				<input id = "calibration-profile-name"
					   ref = "nameInput"
					   v-model = "name"
					   type = "text"
					   placeholder = "Calibration profile name"
					   class = "w-full rounded-md border border-white/10 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/60"/>
			</label>

			<label for = "calibration-profile-description"
				   class = "block">
				<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-white/70">
					Description
				</div>
				<textarea id = "calibration-profile-description"
						  v-model = "description"
						  rows = "5"
						  placeholder = "Describe sample context, instrument setup, or when this calibration should be reused."
						  class = "w-full resize-y rounded-md border border-white/10 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/60"></textarea>
			</label>

			<p v-if = "resolvedDisabledReason.length > 0"
			   class = "text-sm text-red-300">
				{{ resolvedDisabledReason }}
			</p>
		</div>
	</template>

	<template #footer>
		<hr class = "h-0.5 mt-4 bg-gray border-0">
		<ModalButton @click = "emitSave"
					 :loading = "saving"
					 :disabled = "canSave === false">
			{{ actionLabel }}
		</ModalButton>
	</template>
</Modal>
</template>

<script setup>
import { computed, nextTick, ref } from "vue"

import Modal from "./Modal.vue"
import ModalButton from "./ModalButton.vue"

const props = defineProps({
	saving: { type: Boolean, default: false },
	reservedNames: { type: Array, default: () => [] },
	baseDisabledReason: { type: String, default: "" },
	title: { type: String, default: "Save calibration profile" },
	descriptionText: {
		type: String,
		default: "Name the previewed calibration profile and add context that helps collaborators understand when to use it."
	},
	actionLabel: { type: String, default: "Save profile" }
})

const emit = defineEmits([ "save" ])

const modal = ref(null)
const nameInput = ref(null)
const name = ref("")
const description = ref("")

const normalizedName = computed(() => String( name.value ?? "" ).trim())
const normalizedDescription = computed(() => String( description.value ?? "" ).trim())

const nameConflict = computed(() => {
	const candidateName = normalizedName.value
	if( candidateName.length === 0 ){
		return false
	}

	return props.reservedNames.some(( reservedName ) => {
		const normalizedReservedName = String( reservedName ?? "" ).trim()
		return normalizedReservedName.length > 0 &&
			normalizedReservedName.localeCompare( candidateName, undefined, { sensitivity: "accent" } ) === 0
	})
})

const resolvedDisabledReason = computed(() => {
	const baseReason = String( props.baseDisabledReason ?? "" ).trim()
	if( baseReason.length > 0 ){
		return baseReason
	}
	if( normalizedName.value.length === 0 ){
		return "Enter a unique profile name."
	}
	if( nameConflict.value ){
		return "Calibration profile names must be unique."
	}
	return ""
})

const canSave = computed(() => {
	return props.saving === false && resolvedDisabledReason.value.length === 0
})

const open = async ( defaults = {} ) => {
	name.value = String( defaults?.name ?? "" ).trim()
	description.value = String( defaults?.description ?? "" ).trim()
	await modal.value?.open()
	await nextTick()
	nameInput.value?.focus?.()
}

const close = () => {
	modal.value?.close()
}

const emitSave = () => {
	if( canSave.value === false ){
		return
	}

	emit( "save", {
		friendlyName: normalizedName.value,
		description: normalizedDescription.value
	})
}

defineExpose({ open, close })
</script>
