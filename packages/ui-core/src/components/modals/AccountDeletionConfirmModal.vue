<template>
<Modal ref = "modal"
	   title = "Delete account"
	   panel-class = "w-full max-w-xl"
	   :show-close = "!loading">
	<template #main>
		<div class = "space-y-5 pb-4 text-white">
			<div class = "rounded-lg border border-red-400/50 bg-red-950/30 px-4 py-3 text-sm leading-6 text-red-50">
				Account deletion is permanent and irreversible. All projects across all HARKANA data types will be deleted,
				not only projects shown in this app. Uploaded files, saved settings, and all owned compute tokens will also
				be deleted, including tokens associated with compute token groups. Tokens cannot be refunded once account
				deletion is initiated. Existing Zenodo drafts are not deleted and can be published or deleted via
				<a href = "https://zenodo.org/"
				   target = "_blank"
				   rel = "noopener noreferrer"
				   class = "font-semibold text-white underline decoration-white/50 underline-offset-2 transition hover:text-brand hover:decoration-brand">
					Zenodo
				</a>.
				Possible billing and purchase records are retained.
			</div>

			<label class = "block">
				<div class = "mb-2 text-xs font-semibold tracking-wide text-white/70">
					Type DELETE to confirm permanent account deletion
				</div>
				<input v-model = "confirmationText"
					   :disabled = "loading"
					   type = "text"
					   autocomplete = "off"
					   spellcheck = "false"
					   class = "w-full border-0 border-b border-white/35 bg-transparent px-0 py-2 text-sm font-semibold text-white caret-brand transition-[border-color,color] duration-150 ease-out placeholder:text-white/35 focus:border-brand focus:outline-none focus-visible:border-brand focus-visible:outline-none"
					   placeholder = "DELETE" />
			</label>

			<p v-if = "errorMessage.length > 0"
			   class = "m-0 rounded-lg border border-red-400/50 bg-red-950/30 px-3 py-2 text-sm text-red-50">
				{{ errorMessage }}
			</p>
		</div>
	</template>

	<template #footer>
		<div class = "flex justify-end gap-3 pb-4 pt-2">
			<button @click = "close"
					:disabled = "loading"
					class = "inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-brand hover:bg-white hover:text-brand disabled:cursor-not-allowed disabled:opacity-50">
				Cancel
			</button>
			<button @click = "confirmDeletion"
					:disabled = "!canConfirm || loading"
					class = "relative inline-flex items-center justify-center rounded-full border border-red-400/70 bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
				<span :class = "{ invisible: loading }">Delete account</span>
				<span v-if = "loading" class = "absolute inset-0 flex items-center justify-center">
					<Spinner class = "h-5 w-5 text-white" />
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
	loading: { type: Boolean, default: false },
	errorMessage: { type: String, default: "" }
})

const emit = defineEmits([ "confirm" ])

const modal = ref( null )
const confirmationText = ref( "" )
const canConfirm = computed(() => confirmationText.value === "DELETE" )

const open = async () => {
	confirmationText.value = ""
	await modal.value?.open?.()
}

const close = () => {
	modal.value?.close?.()
}

const confirmDeletion = () => {
	if( canConfirm.value === false || props.loading ){
		return
	}
	emit( "confirm" )
}

defineExpose({ open, close })
</script>
