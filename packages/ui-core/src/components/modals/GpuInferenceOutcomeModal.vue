<template>
<Modal ref = "modal" :title = "modalTitle">
	<template #main>
		<div class = "mb-4 space-y-3 text-white">
			<p v-for = "( paragraph, index ) in modalParagraphs"
			   :key = "'gpu-inference-outcome-' + index">
				{{ paragraph }}
			</p>
		</div>
	</template>
</Modal>
</template>

<script setup>

import { ref } from "vue"

import Modal from "./Modal.vue"

const modal = ref(null)
const modalTitle = ref("Raman inference update")
const modalParagraphs = ref([])

const open = async ( outcome = "", details = null ) => {

	const normalizedOutcome = String( outcome ?? "" ).trim().toUpperCase()
	if( normalizedOutcome === "ESTIMATE_READY" ){
		modalTitle.value = "Estimated Raman spectra available"
		modalParagraphs.value = [
			"Your estimated Raman spectra are ready. You can now click a pixel or select a region and view the estimated spectrum in the plots.",
			"In the sidebar, Raman inference options are now available so you can control what appears in the bottom-left plot and choose the uncertainty level shown for selected pixels and regions.",
			"Once the analysis stage finishes, Raman-based coloring will be available and can be changed from the Raman inference menu in the sidebar."
		]
	} else if( normalizedOutcome === "SUCCEEDED" ){
		modalTitle.value = "Raman inference complete"
		modalParagraphs.value = [
			"Raman inference and follow-up analysis are complete.",
			"You can now use Raman-based coloring and change it from the Raman inference menu in the sidebar, along with Raman spectrum controls for pixel and region selections.",
			"Explore both the image coloring and spectrum views to compare measurement data with estimated Raman information."
		]
	} else if( normalizedOutcome === "FAILED" ){
		const apiErrorMessage = String( details?.errorMessage ?? "" ).trim()
		const apiErrorCode = String( details?.errorCode ?? "" ).trim()
		const fallbackMessage = "The Raman inference failed and the compute tokens have been refunded."
		modalTitle.value = "Raman inference failed"
		const resolvedErrorMessage = apiErrorMessage.length > 0
			? ( apiErrorCode.length > 0
				? apiErrorCode + ": " + apiErrorMessage
				: apiErrorMessage )
			: fallbackMessage
		modalParagraphs.value = [
			"The Raman inference did not complete successfully.",
			resolvedErrorMessage
		]
	} else {
		return
	}

	await modal.value?.open()
}

const close = () => {
	modal.value?.close()
}

defineExpose({ open, close })

</script>
