<template>
<Modal ref = "modal" :title = "'Region of interest description'" :showClose = "true">
	<template #main>
		<div class = "space-y-4">
			<p class = "text-sm leading-relaxed text-white/90">
				{{ hasMultipleRois ? "Select a region of interest from the list below to review its stored details." : "Review the stored region of interest details below." }}
			</p>

			<div v-if = "hasMultipleRois"
				 class = "grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div class = "rounded-lg border border-brand bg-white p-3">
					<p class = "text-xs font-semibold uppercase tracking-wide text-black">
						Selected regions
					</p>
					<div class = "mt-2 text-black text-sm font-semibold">
						{{ normalizedRois.length }}
					</div>
				</div>

				<div class = "rounded-lg border border-brand bg-white p-3">
					<p class = "text-xs font-semibold uppercase tracking-wide text-black">
						Total pixels
					</p>
					<div class = "mt-2 text-black text-sm font-semibold">
						{{ totalPixelCount }}
					</div>
				</div>
			</div>

			<BaseDropdown v-if = "hasMultipleRois"
					  root-class = "relative block w-full text-left"
					  :show-chevron = "false"
					  :close-on-select = "true"
					  :teleport-to-body = "true"
					  portal-placement = "bottom-start"
					  trigger-class = "group w-full rounded-xl text-white transition focus:outline-none"
					  menu-class = "fixed z-[70] min-w-[16rem] w-max max-w-[50vw] origin-top-left rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30">
				<template v-slot:trigger>
					<div class = "flex items-center gap-2.5 rounded-xl border border-white/10 bg-gray-700/90 px-2.5 py-1.5 transition group-focus:border-white/10 group-focus:bg-gray-700 group-focus:ring-2 group-focus:ring-brand">
						<div class = "min-w-0 flex-1 text-left">
							<div class = "truncate text-sm font-semibold text-white">{{ activeRoiLabel }}</div>
						</div>

						<div class = "inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/75 transition group-focus:bg-white/10">
							<i class = "fas fa-chevron-down text-xs" aria-hidden = "true"></i>
						</div>
					</div>
				</template>

				<li v-for = "roi in normalizedRois"
					:key = "roi.key">
					<button type = "button"
							@click = "activeRoiKey = roi.key"
							class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
						<span class = "truncate">{{ roi.name }}</span>
						<i :class = "activeRoiKey === roi.key ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
						   aria-hidden = "true"></i>
					</button>
				</li>
			</BaseDropdown>

			<div class = "rounded-lg border border-brand bg-white p-4">
				<p class = "text-xs font-semibold uppercase tracking-wide text-black">
					Name
				</p>
				<div class = "mt-2 break-words text-base font-semibold text-black">
					{{ activeRoi.name }}
				</div>
			</div>

			<div class = "rounded-lg border border-brand bg-white p-4">
				<p class = "text-xs font-semibold uppercase tracking-wide text-black">
					Description
				</p>
				<div class = "mt-2 min-h-[7rem] whitespace-pre-wrap leading-relaxed text-black">
					{{ activeRoi.description }}
				</div>
			</div>

			<div class = "grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div class = "rounded-lg border border-brand bg-white p-3">
					<p class = "text-xs font-semibold uppercase tracking-wide text-black">
						Number of pixels
					</p>
					<div class = "mt-2 text-sm font-semibold text-black">
						{{ activeRoi.pixelCount }}
					</div>
				</div>

				<div class = "rounded-lg border border-brand bg-white p-3">
					<p class = "text-xs font-semibold uppercase tracking-wide text-black">
						Width
					</p>
					<div class = "mt-2 text-sm font-semibold text-black">
						{{ activeRoi.width }}
					</div>
				</div>

				<div class = "rounded-lg border border-brand bg-white p-3">
					<p class = "text-xs font-semibold uppercase tracking-wide text-black">
						Height
					</p>
					<div class = "mt-2 text-sm font-semibold text-black">
						{{ activeRoi.height }}
					</div>
				</div>

				<div class = "rounded-lg border border-brand bg-white p-3 sm:col-span-2 mb-4">
					<p class = "text-xs font-semibold uppercase tracking-wide text-black">
						Bounding pixels
					</p>
					<div class = "mt-2 break-words font-mono text-sm text-black">
						{{ activeRoi.boundingPixels }}
					</div>
				</div>
			</div>
		</div>
	</template>
</Modal>
</template>

<script setup>

import { computed, ref, watch } from "vue"

import Modal from "./Modal.vue"
import BaseDropdown from "../navbar/BaseDropdown.vue"

const props = defineProps({
	rois: { type: Array, default: () => [] },
	roiName: { type: String, default: "" },
	roiDescription: { type: String, default: "" },
	pixelCount: { type: Number, default: 0 },
	boundingBox: { type: Object, default: null }
})

const modal = ref(null)
const activeRoiKey = ref("")

const normalizeText = ( value, fallback ) => {
	const normalized = String( value ?? "" ).trim()
	return normalized.length > 0 ? normalized : fallback
}

const normalizeCount = ( value ) => {
	const numeric = Number.parseInt( value, 10 )
	return Number.isInteger( numeric ) && numeric >= 0 ? numeric : null
}

const formatBoundingPixels = ( boundingBox ) => {
	const minX = Number.parseInt( boundingBox?.minX, 10 )
	const maxX = Number.parseInt( boundingBox?.maxX, 10 )
	const minY = Number.parseInt( boundingBox?.minY, 10 )
	const maxY = Number.parseInt( boundingBox?.maxY, 10 )

	if([ minX, maxX, minY, maxY ].every(( value ) => Number.isInteger( value ))){
		return "x: " + minX + " to " + maxX + ", y: " + minY + " to " + maxY
	}

	return "Unavailable"
}

const formatDimension = ( value ) => {
	const numeric = Number.parseInt( value, 10 )
	return Number.isInteger( numeric ) && numeric >= 0 ? String( numeric ) : "Unavailable"
}

const normalizedRois = computed(() => {
	const roiList = Array.isArray( props.rois ) && props.rois.length > 0
		? props.rois
		: [{
			roiId: "",
			name: props.roiName,
			description: props.roiDescription,
			pixelCount: props.pixelCount,
			boundingBox: props.boundingBox
		}]

	return roiList.map(( roi, index ) => {
		const pixelCount = normalizeCount( roi?.pixelCount )
		return {
			key: String( roi?.roiId ?? "" ).trim() || "roi-" + index,
			name: normalizeText( roi?.name, "Selected ROI" ),
			description: normalizeText( roi?.description, "No description available." ),
			pixelCount: pixelCount === null ? "Unavailable" : String( pixelCount ),
			pixelCountNumeric: pixelCount,
			width: formatDimension( roi?.boundingBox?.width ),
			height: formatDimension( roi?.boundingBox?.height ),
			boundingPixels: formatBoundingPixels( roi?.boundingBox )
		}
	})
})

const hasMultipleRois = computed(() => normalizedRois.value.length > 1)

const activeRoi = computed(() => {
	const matchingRoi = normalizedRois.value.find(( roi ) => roi.key === activeRoiKey.value )
	return matchingRoi ?? normalizedRois.value[0] ?? {
		key: "",
		name: "Selected ROI",
		description: "No description available.",
		pixelCount: "Unavailable",
		pixelCountNumeric: null,
		width: "Unavailable",
		height: "Unavailable",
		boundingPixels: "Unavailable"
	}
})

const activeRoiLabel = computed(() => activeRoi.value.name)

const totalPixelCount = computed(() => {
	const total = normalizedRois.value.reduce(( sum, roi ) => {
		return sum + ( Number.isInteger( roi.pixelCountNumeric ) ? roi.pixelCountNumeric : 0 )
	}, 0 )

	return String( total )
})

watch( normalizedRois, ( nextRois ) => {
	if( nextRois.length === 0 ){
		activeRoiKey.value = ""
		return
	}

	if( nextRois.some(( roi ) => roi.key === activeRoiKey.value )){
		return
	}

	activeRoiKey.value = nextRois[0].key
}, { immediate: true })

const open = async () => {
	if( normalizedRois.value.length > 0 ){
		activeRoiKey.value = normalizedRois.value[0].key
	}

	await modal.value?.open()
}

const close = () => modal.value?.close()

defineExpose({ open, close })

</script>
