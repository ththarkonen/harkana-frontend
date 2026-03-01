<template>
<Modal ref = "modal" :title = "'Region of interest description'" :showClose = "true">
	<template #main>
		<div class = "space-y-4">
			<p class = "text-sm leading-relaxed text-white/90">
				Review the stored region of interest details below.
			</p>

			<div class = "rounded-lg border border-brand bg-white p-4">
				<p class = "text-xs font-semibold uppercase tracking-wide text-black">
					Name
				</p>
				<div id = "roi-name-display"
					 class = "mt-2 text-black text-base font-semibold break-words">
					{{ displayName }}
				</div>
			</div>

			<div class = "rounded-lg border border-brand bg-white p-4">
				<p class = "text-xs font-semibold uppercase tracking-wide text-black">
					Description
				</p>
				<div id = "roi-description-display"
					 class = "mt-2 text-black whitespace-pre-wrap min-h-[7rem] leading-relaxed">
					{{ displayDescription }}
				</div>
			</div>

			<div class = "grid grid-cols-1 sm:grid-cols-2 gap-3">
				<div class = "rounded-lg border border-brand bg-white p-3">
					<p class = "text-xs font-semibold uppercase tracking-wide text-black">
						Number of pixels
					</p>
					<div id = "roi-pixel-count-display"
						 class = "mt-2 text-black text-sm font-semibold">
						{{ displayPixelCount }}
					</div>
				</div>

				<div class = "rounded-lg border border-brand bg-white p-3">
					<p class = "text-xs font-semibold uppercase tracking-wide text-black">
						Width
					</p>
					<div id = "roi-width-display"
						 class = "mt-2 text-black text-sm font-semibold">
						{{ displayWidth }}
					</div>
				</div>

				<div class = "rounded-lg border border-brand bg-white p-3">
					<p class = "text-xs font-semibold uppercase tracking-wide text-black">
						Height
					</p>
					<div id = "roi-height-display"
						 class = "mt-2 text-black text-sm font-semibold">
						{{ displayHeight }}
					</div>
				</div>

				<div class = "rounded-lg border border-brand bg-white p-3 sm:col-span-2 mb-4">
					<p class = "text-xs font-semibold uppercase tracking-wide text-black">
						Bounding pixels
					</p>
					<div id = "roi-bounding-pixels-display"
						 class = "mt-2 text-black text-sm font-mono break-words">
						{{ displayBoundingPixels }}
					</div>
				</div>
			</div>
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
	pixelCount: { type: Number, default: 0 },
	boundingBox: { type: Object, default: null }
})

const modal = ref(null)

const displayName = computed(() => {
	const name = props.roiName.trim()
	return name.length > 0 ? name : "Selected ROI"
})

const displayDescription = computed(() => {
	const description = props.roiDescription.trim()
	return description.length > 0 ? description : "No description available."
})

const displayPixelCount = computed(() => {
	const pixelCount = Number.parseInt( props.pixelCount, 10 )
	return Number.isInteger( pixelCount ) && pixelCount >= 0
		? String( pixelCount )
		: "Unavailable"
})

const displayBoundingPixels = computed(() => {
	const minX = Number.parseInt( props.boundingBox?.minX, 10 )
	const maxX = Number.parseInt( props.boundingBox?.maxX, 10 )
	const minY = Number.parseInt( props.boundingBox?.minY, 10 )
	const maxY = Number.parseInt( props.boundingBox?.maxY, 10 )

	if([ minX, maxX, minY, maxY ].every(( value ) => Number.isInteger( value ))){
		return "x: " + minX + " to " + maxX + ", y: " + minY + " to " + maxY
	}

	return "Unavailable"
})

const displayWidth = computed(() => {
	const width = Number.parseInt( props.boundingBox?.width, 10 )
	return Number.isInteger( width ) && width >= 0 ? String( width ) : "Unavailable"
})

const displayHeight = computed(() => {
	const height = Number.parseInt( props.boundingBox?.height, 10 )
	return Number.isInteger( height ) && height >= 0 ? String( height ) : "Unavailable"
})

const open = async () => {
	await modal.value?.open()
}

const close = () => modal.value?.close()

defineExpose({ open, close })

</script>
