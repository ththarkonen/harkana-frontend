<template>
<Modal ref = "modal" :title = "'Preparing download'" :showClose = "false">
	<template #main>
		<p class = "text-white mb-4">
			Your download is being prepared. The file download starts automatically when it is ready.
		</p>
		<div class = "w-full flex justify-center pb-4">
			<Spinner class = "w-8 h-8 text-brand"></Spinner>
		</div>
	</template>
</Modal>
</template>

<script setup>

import { ref } from "vue"

import Modal from "./Modal.vue"
import Spinner from "../general/Spinner.vue"

const modal = ref(null)

const open = async () => {
	await modal.value?.open()
}

const close = () => {
	modal.value?.close()
}

defineExpose({ open, close })

</script>
