<template>
<!-- Outer frame -->
<div class="bg-brand min-h-screen p-[2px] overflow-hidden">

	<!-- Mobile overlay -->
	<div v-if = "sidebarOpen" @click = "sidebarOpen = false" class = "fixed inset-0 bg-black/40 z-30 md:hidden"></div>
	<!-- App Grid -->
	<div class="grid h-[calc(100vh-4px)] gap-[2px] grid-cols-1 grid-rows-[auto_1fr] md:grid-cols-[16rem_1fr] md:grid-rows-[auto_1fr]">

		<Sidebar :style = "sidebarStyle">
			<Logo></Logo>

			<SidebarButton @click = "navigation.route('Main menu', {})" class = "my-2">
				Project menu
			</SidebarButton>
			<SidebarButton @click = "navigation.redirect('Settings', 'Visualization')" class = "mb-4">
				Visualization settings
			</SidebarButton>

			<hr class = "h-0.5 bg-gray border-0 ">

			<div class = "mt-4 p-2 shadow-md shadow-black border-2 border-gray bg-gray-800 rounded-lg">
				<h3 class = "text-white font-semibold mb-2">Display</h3>

				<select id = "plot-mode"
						v-model = "activePlot"
						class = "w-full rounded border border-gray-600 px-2 py-1 text-black bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
					<option value = "mip">MIP</option>
					<option value = "mip_hsv">HSV-mapped MIP</option>
					<option value = "layer">Layer</option>
					<option value = "pca">PCA classification</option>
					<option value = "pca_rgb">PCA RGB</option>
				</select>

				<div class = "mt-3">
					<label for = "heatmap-interaction-mode" class = "block text-sm font-semibold text-white mb-1">
						Heatmap interaction
					</label>
					<select id = "heatmap-interaction-mode"
							v-model = "heatmapInteractionMode"
							class = "w-full rounded border border-gray-600 px-2 py-1 text-black bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
						<option value = "select">Select spectra</option>
						<option value = "zoom">Zoom</option>
					</select>
					<p v-if = "heatmapInteractionMode === 'select'" class = "text-xs text-white mt-1">
						Drag a rectangle on the heatmap to fetch the mean spectrum.
						Click a pixel to fetch the single-point spectrum.
					</p>
				</div>

				<div v-if = "activePlot === 'layer'" class = "mt-3">
					<label for = "layer-input" class = "block text-sm font-semibold text-white mb-1">
						Layer index
					</label>
					<input id = "layer-input"
							type = "number"
							min = "0"
							:max = "maxLayerIndex"
							step = "1"
							v-model = "layerInput"
							@input = "debouncedApplyLayerInput"
							@keydown.enter.prevent = "applyLayerInput"
							@blur = "applyLayerInput"
							class = "w-full rounded border border-gray-600 px-2 py-1 text-black text-center bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
				</div>

				<div v-if = "activePlot === 'pca'" class = "mt-3">
					<p class = "text-sm text-white leading-snug">
						Classification view combines PCA scores from
						<code class = "bg-gray-700 px-1 rounded">PC01</code>
						to
						<code class = "bg-gray-700 px-1 rounded">PC10</code>.
						Hue denotes dominant component and brightness denotes its magnitude.
					</p>
					<div class = "grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
						<button v-for = "entry in pcaLegend"
							:key = "entry.label"
							type = "button"
							@click = "togglePcaComponent(entry.componentIndex)"
							:aria-pressed = "isPcaComponentActive(entry.componentIndex)"
							:title = "isPcaComponentActive(entry.componentIndex) ? `Hide ${entry.label}` : `Show ${entry.label}`"
							:class = "isPcaComponentActive(entry.componentIndex) ? 'opacity-100 ring-1 ring-white/70' : 'opacity-45'"
							class = "flex items-center text-xs text-white rounded px-1 py-0.5 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
							<span class = "inline-block w-3 h-3 rounded-sm mr-2"
									:style = "{ backgroundColor: entry.color }">
							</span>
							<span>{{ entry.label }}</span>
						</button>
					</div>
				</div>

				<div v-if = "activePlot === 'pca_rgb'" class = "mt-3">
					<p class = "text-sm text-white leading-snug">
						RGB composite from selected PCA components. Each channel is robustly normalized for display.
					</p>

					<div class = "grid grid-cols-3 gap-2 mt-2">
						<div>
							<label for = "pca-r-input" class = "block text-xs font-semibold mb-1" style = "color: rgb(239, 68, 68);">R</label>
							<input id = "pca-r-input"
									type = "number"
									min = "1"
									max = "10"
									step = "1"
									v-model = "pcaRgbRedInput"
									@input = "debouncedApplyPcaRgbInput"
									@keydown.enter.prevent = "applyPcaRgbInput"
									@blur = "applyPcaRgbInput"
									class = "w-full rounded border border-gray-600 px-2 py-1 text-black text-center bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
						</div>

						<div>
							<label for = "pca-g-input" class = "block text-xs font-semibold mb-1" style = "color: rgb(34, 197, 94);">G</label>
							<input id = "pca-g-input"
									type = "number"
									min = "1"
									max = "10"
									step = "1"
									v-model = "pcaRgbGreenInput"
									@input = "debouncedApplyPcaRgbInput"
									@keydown.enter.prevent = "applyPcaRgbInput"
									@blur = "applyPcaRgbInput"
									class = "w-full rounded border border-gray-600 px-2 py-1 text-black text-center bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
						</div>

						<div>
							<label for = "pca-b-input" class = "block text-xs font-semibold mb-1" style = "color: rgb(59, 130, 246);">B</label>
							<input id = "pca-b-input"
									type = "number"
									min = "1"
									max = "10"
									step = "1"
									v-model = "pcaRgbBlueInput"
									@input = "debouncedApplyPcaRgbInput"
									@keydown.enter.prevent = "applyPcaRgbInput"
									@blur = "applyPcaRgbInput"
									class = "w-full rounded border border-gray-600 px-2 py-1 text-black text-center bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
						</div>
					</div>
				</div>
			</div>

			<div class = "mt-4 p-2 shadow-md shadow-black border-2 border-gray bg-gray-800 rounded-lg">
				<h3 class = "text-white font-semibold mb-2">ROI</h3>

				<select id = "roi-select"
						v-model = "selectedRoiId"
						class = "w-full rounded border border-gray-600 px-2 py-1 text-black bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
					<option value = "">No ROI selected</option>
					<option v-for = "roi in rois" :key = "roi.roiId" :value = "roi.roiId">
						{{ roi.name }}
					</option>
				</select>

				<SidebarButton v-if = "canMutateRois"
							   @click = "openRoiDeleteModal"
							   :disabled = "!selectedRoi"
							   class = "mt-4">
					Delete selected ROI
				</SidebarButton>

				<SidebarButton v-if = "canMutateRois"
							   @click = "openRoiSaveModal"
							   :disabled = "!hasSelectedRegion"
							   class = "mt-3">
					Save selection as ROI
				</SidebarButton>

				<SidebarButton @click = "openRoiDescriptionModal"
							   :disabled = "!selectedRoi"
							   :class = "project.shared ? 'mt-4' : 'mt-2'">
					Show ROI description
				</SidebarButton>

				<SidebarButton @click = "toggleAllRoiOverlays"
							   :disabled = "rois.length === 0"
							   class = "mt-2">
					{{ showAllRoiOverlays ? "Hide all ROI boxes" : "Show all ROI boxes" }}
				</SidebarButton>

				<p v-if = "canMutateRois && !hasSelectedRegion" class = "text-xs text-white mt-2">
					Select a heatmap region first to save a new ROI.
				</p>

			</div>

			<SidebarButton @click = "metadataModal.open()" class = "mt-4">
				Metadata
			</SidebarButton>

			<hr class = "h-0.5 bg-gray border-0 mt-4">

			<div v-if = "!project.shared">
				<SidebarButton @click = "download" :loading = "downloading" class = "mt-4">
					Download
				</SidebarButton>
				<SidebarButton @click = "shareModal.open()" class = "mt-2 mb-2">
					Share
				</SidebarButton>
				<!----<SidebarButton @click = "zenodoModal.open()" class = "mb-4">
					Zenodo
				</SidebarButton>!-->
			</div>

			<div v-else>
				<SidebarButton @click = "download" :loading = "downloading" class = "my-4">
					Download
				</SidebarButton>
			</div>

			<hr class = "h-0.5 bg-gray border-0 ">

		</Sidebar>

		<NavigationBar>
			<template v-slot:left-items>
				<button @click = "sidebarOpen = true" class = "md:hidden mr-4 px-3 py-2 rounded bg-slate-100">☰</button>
				<ProjectNameInput :project = "project"></ProjectNameInput>
			</template>
			<template v-slot:right-items>
				<AccountDropdown></AccountDropdown>
			</template>
		</NavigationBar>


		<!-- Main Content -->
		<main class="bg-dark-gray rounded-lg shadow-sm p-0">
			<div ref = "graph" class = "w-full h-full bg-white"></div>
		</main>

	</div>

	<MetadataModal ref = "metadataModal" :project = "project"></MetadataModal>
	<ShareModal ref = "shareModal" :project = "project"></ShareModal>
	<ZenodoModal ref = "zenodoModal" :project = "project"></ZenodoModal>
	<RoiDescriptionModal ref = "roiDescriptionModal"
						 :roi-name = "selectedRoi ? selectedRoi.name : ''"
						 :roi-description = "selectedRoi ? selectedRoi.description : ''"
						 :pixel-count = "selectedRoi ? selectedRoi.pixelCount : 0"
						 :bounding-box = "selectedRoi ? selectedRoi.boundingBox : null"></RoiDescriptionModal>
	<RoiSaveModal ref = "roiSaveModal" :saving = "savingRoi" @save = "saveRoi"></RoiSaveModal>
	<RoiDeleteModal ref = "roiDeleteModal"
					:roi-name = "selectedRoi ? selectedRoi.name : ''"
					:roi-description = "selectedRoi ? selectedRoi.description : ''"
					:deleting = "deletingRoi"
					@confirm = "deleteSelectedRoi"></RoiDeleteModal>
</div>
</template>

<script setup>

import { ref, watch, computed, nextTick, onMounted, onBeforeUnmount} from 'vue'
import { useRoute } from 'vue-router'
import { debounce } from 'lodash'
const route = useRoute()

const emit = defineEmits(["loaded"])

import { projects as projectlib, settings as settingslib} from "@harkana/tools"
import { navigation, hyperspectrumCache, hyperspectra, utils} from "@harkana/tools"
import { hyperspectrum } from "@harkana/plot"

import Sidebar from './sidebar/Sidebar.vue'
import Logo from "./sidebar/Logo.vue"
import SidebarButton from './sidebar/SidebarButton.vue'

import NavigationBar from './navbar/NavigationBar.vue'
import AccountDropdown from './navbar/AccountDropdown.vue'
import ProjectNameInput from './navbar/ProjectNameInput.vue'

import MetadataModal from './modals/MetadataModal.vue'
import ShareModal from './modals/ShareModal.vue'
import ZenodoModal  from './modals/ZenodoModal.vue'
import RoiDescriptionModal from './modals/RoiDescriptionModal.vue'
import RoiSaveModal from './modals/RoiSaveModal.vue'
import RoiDeleteModal from './modals/RoiDeleteModal.vue'

const metadataModal = ref(null)
const shareModal = ref(null)
const zenodoModal = ref(null)
const roiDescriptionModal = ref(null)
const roiSaveModal = ref(null)
const roiDeleteModal = ref(null)

const projectID = route.params.id

const project = ref({id: ""})
const projects = ref({})
const settings = ref({})

const mip = ref(null)
const mipHsv = ref(null)
const xyzAxes = ref(null)
const layer = ref(null)
const pcaClassification = ref(null)
const pcaLoadings = ref(null)
const graph = ref(null)
const activePlot = ref("mip_hsv")
const activeLayerIndex = ref(0)
const activeLayerRequestID = ref(0)
const activeMipHsvRequestID = ref(0)
const activeXyzRequestID = ref(0)
const activePcaClassificationRequestID = ref(0)
const activePcaLoadingsRequestID = ref(0)
const layerInput = ref(0)
const pcaRgbRedInput = ref(1)
const pcaRgbGreenInput = ref(2)
const pcaRgbBlueInput = ref(3)
const heatmapInteractionMode = ref("select")
const billingSettings = ref({ groupID: "" })
const selectedHeatmapIndices = ref({ xIndices: [], yIndices: [] })
const latestSelectedRegionPoints = ref([])
const latestSingleSpectrum = ref(null)
const latestMeanSpectrum = ref(null)
const latestSelectedSpectrum = ref(null)
const activeSingleSpectrumRequestID = ref(0)
const activeMeanSpectrumRequestID = ref(0)
const rois = ref([])
const selectedRoiId = ref("")
const showAllRoiOverlays = ref(false)
const savingRoi = ref(false)
const deletingRoi = ref(false)

const pcaComponentIndices = Array.from({ length: 10 }, (_, index ) => index + 1)
const activePcaComponents = ref([ 1, 2 ])
const pcaRgbChannels = ref({
	r: 1,
	g: 2,
	b: 3
})

const DEFAULT_PCA_COMPONENT_COLORS = {
	1: "#0072b2",
	2: "#e69f00",
	3: "#009e73",
	4: "#d55e00",
	5: "#cc79a7",
	6: "#56b4e9",
	7: "#f0e442",
	8: "#8c564b",
	9: "#f781bf",
	10: "#7f7f7f"
}

const pcaLegend = computed(() => {
	return pcaComponentIndices.map(( componentIndex ) => {
		const savedColor = settings.value?.hyperspectrumColors?.pcaComponents?.[componentIndex]

		return {
			componentIndex,
			label: "PC" + String( componentIndex ).padStart( 2, "0" ),
			color: typeof savedColor === "string" && savedColor.length > 0
				? savedColor
				: DEFAULT_PCA_COMPONENT_COLORS[componentIndex]
		}
	})
})

var resizeObserver = null

const cacheOptions = {
	memoryBudgetBytes: 120 * 1024 * 1024,
	ttlMs: 7 * 24 * 60 * 60 * 1000,
	prefetchRadius: 2,
	lowConcurrency: 1
}

const downloading = ref(false)

const sidebarOpen = ref(false)
const sidebarStyle = computed(() => {
  return sidebarOpen.value
    ? { left: '2px' }
    : { left: 'calc(-16rem - 2px)' }
})

const canMutateRois = computed(() => {
	return typeof project.value?.id === "string" &&
		project.value.id.length > 0 &&
		project.value.shared !== true
})

const selectedRoi = computed(() => {
	if( selectedRoiId.value === "" ) return null

	return rois.value.find(( roi ) => roi.roiId === selectedRoiId.value ) ?? null
})

const hasSelectedRegion = computed(() => {
	return Array.isArray( latestSelectedRegionPoints.value ) && latestSelectedRegionPoints.value.length > 0
})

const maxLayerIndex = computed(() => {

	const zValues = Array.isArray( xyzAxes.value?.z ) ? xyzAxes.value.z : []
	if( zValues.length <= 0 ){
		return Number.MAX_SAFE_INTEGER
	}

	return Math.max( 0, zValues.length - 1 )
})

const download = async() => {

	downloading.value = true
	await projectlib.download([ project.value ])

	await utils.wait(1000)
	downloading.value = false
}

const filteredPcaClassification = () => {

	if( pcaClassification.value === null ) return null

	const activeComponents = new Set( activePcaComponents.value )
	var filteredScores = {}

	for( const componentIndex of pcaComponentIndices ){
		if( activeComponents.has( componentIndex ) === false ) continue

		if( Object.prototype.hasOwnProperty.call( pcaClassification.value, componentIndex ) ){
			filteredScores[componentIndex] = pcaClassification.value[componentIndex]
		}
	}

	if( Object.keys( filteredScores ).length === 0 ){
		return pcaClassification.value
	}

	return filteredScores
}

const currentMatrix = () => {
	if( activePlot.value === "mip_hsv" ){
		return mipHsv.value
	}
	if( activePlot.value === "layer" ){
		return layer.value
	}
	if( activePlot.value === "pca" ){
		return filteredPcaClassification()
	}
	if( activePlot.value === "pca_rgb" ){
		return pcaClassification.value
	}
	return mip.value
}

const matrixDimensions = ( matrix ) => {

	if( Array.isArray( matrix ) && matrix.length > 0 && Array.isArray( matrix[0] ) ){
		return {
			width: matrix[0].length,
			height: matrix.length
		}
	}

	if( matrix !== null && typeof matrix === "object" ){
		const firstMatrix = Object.values( matrix ).find(( value ) => {
			return Array.isArray( value ) && value.length > 0 && Array.isArray( value[0] )
		})

		if( firstMatrix ){
			return {
				width: firstMatrix[0].length,
				height: firstMatrix.length
			}
		}
	}

	return null
}

const activeGroupID = () => {
	if( typeof billingSettings.value?.groupID === "string" ){
		return billingSettings.value.groupID
	}

	return ""
}

const plotAxes = () => {
	return xyzAxes.value
}

const normalizeBoundPercentage = ( value, fallback ) => {

	const numeric = Number( value )
	if( Number.isFinite( numeric ) === false ){
		return fallback
	}

	return Math.min( 100, Math.max( 0, numeric ))
}

const uncertaintyPercentages = () => {

	const lower = normalizeBoundPercentage(
		settings.value?.hyperspectrumSpectrum?.lowerBoundPercentage,
		7.5
	)
	const upper = normalizeBoundPercentage(
		settings.value?.hyperspectrumSpectrum?.upperBoundPercentage,
		97.5
	)

	if( lower <= upper ){
		return { lower, upper }
	}

	return {
		lower: upper,
		upper: lower
	}
}

const normalizeSelectionPoints = ( points ) => {

	if( Array.isArray( points ) === false ){
		return []
	}

	var normalized = []
	var seen = new Set()

	for( const point of points ){

		const x = Array.isArray( point ) ? Number.parseInt( point[0], 10 ) : Number.parseInt( point?.x, 10 )
		const y = Array.isArray( point ) ? Number.parseInt( point[1], 10 ) : Number.parseInt( point?.y, 10 )

		if( Number.isInteger( x ) === false || Number.isInteger( y ) === false ) continue

		const key = x + ":" + y
		if( seen.has( key ) ) continue

		seen.add( key )
		normalized.push({ x, y })
	}

	return normalized
}

const normalizeOpacity = ( value, fallback = 0.25 ) => {

	const numeric = Number( value )
	if( Number.isFinite( numeric ) === false ){
		return fallback
	}

	return Math.max( 0, Math.min( 1, numeric ))
}

const selectedSpectrumPayload = () => {
	return latestSelectedSpectrum.value ??
		latestSingleSpectrum.value?.response ??
		latestMeanSpectrum.value?.response ??
		null
}

const topLeftSpectrumOptions = () => {

	if( selectedRoi.value === null ){
		return null
	}

	const current = selectedSpectrumPayload()

	return {
		roi: {
			spectrum: selectedRoi.value.meanSpectrum,
			lowerBound: selectedRoi.value.lowerBound ?? null,
			upperBound: selectedRoi.value.upperBound ?? null
		},
		current: current
	}
}

const roiOverlayFromEntry = ( roi ) => {

	if( roi === null || typeof roi !== "object" ){
		return null
	}

	return {
		name: roi.name,
		x0: roi.boundingBox.minX - 0.5,
		x1: roi.boundingBox.maxX + 0.5,
		y0: roi.boundingBox.minY - 0.5,
		y1: roi.boundingBox.maxY + 0.5,
		boxColor: settings.value?.hyperspectrumColors?.roiBox ??
			settings.value?.hyperspectrumColors?.roiOverlay ??
			"#ffffff",
		titleColor: settings.value?.hyperspectrumColors?.roiTitle ??
			settings.value?.hyperspectrumColors?.roiOverlay ??
			"#ffffff",
		opacity: normalizeOpacity( settings.value?.hyperspectrumRoi?.overlayOpacity, 0.25 )
	}
}

const activeRoiOverlays = () => {

	if( showAllRoiOverlays.value ){
		return rois.value
			.map(( roi ) => roiOverlayFromEntry( roi ))
			.filter(( overlay ) => overlay !== null )
	}

	if( selectedRoi.value === null ){
		return []
	}

	const selectedOverlay = roiOverlayFromEntry( selectedRoi.value )
	return selectedOverlay === null ? [] : [ selectedOverlay ]
}

const loadRoiList = async ( forceRefresh = false ) => {

	const loadedRois = forceRefresh
		? await hyperspectrumCache.refreshRois( project.value, cacheOptions )
		: await hyperspectrumCache.getRois( project.value, cacheOptions )

	rois.value = Array.isArray( loadedRois ) ? loadedRois : []

	if( selectedRoiId.value.length > 0 ){
		const stillExists = rois.value.some(( roi ) => roi.roiId === selectedRoiId.value )
		if( stillExists === false ){
			selectedRoiId.value = ""
		}
	}
}

const newestMatchingRoiId = ( name, description ) => {

	const normalizedName = String( name ?? "" ).trim()
	const normalizedDescription = String( description ?? "" )

	const matches = rois.value.filter(( roi ) => {
		return roi.name === normalizedName && roi.description === normalizedDescription
	})

	if( matches.length === 0 ){
		return ""
	}

	matches.sort(( left, right ) => {
		const leftTimestamp = Date.parse( left.createdAt || "" )
		const rightTimestamp = Date.parse( right.createdAt || "" )
		const safeLeft = Number.isFinite( leftTimestamp ) ? leftTimestamp : 0
		const safeRight = Number.isFinite( rightTimestamp ) ? rightTimestamp : 0

		return safeRight - safeLeft
	})

	return matches[0].roiId
}

const openRoiSaveModal = () => {

	if( canMutateRois.value === false ) return
	if( hasSelectedRegion.value === false ) return

	roiSaveModal.value?.open()
}

const openRoiDeleteModal = () => {

	if( canMutateRois.value === false ) return
	if( selectedRoi.value === null ) return

	roiDeleteModal.value?.open()
}

const openRoiDescriptionModal = () => {

	if( selectedRoi.value === null ) return
	roiDescriptionModal.value?.open()
}

const toggleAllRoiOverlays = async () => {

	showAllRoiOverlays.value = !showAllRoiOverlays.value

	if( graph.value === null ) return
	if( currentMatrix() === null ) return

	try{
		await renderCurrentMatrix()
	} catch( error ){
		console.log( error )
	}
}

const saveRoi = async ( payload ) => {

	if( savingRoi.value ) return
	if( canMutateRois.value === false ) return

	const points = normalizeSelectionPoints( latestSelectedRegionPoints.value )
	if( points.length === 0 ) return

	savingRoi.value = true

	try{
		const percentages = points.length > 1 ? uncertaintyPercentages() : null

		await hyperspectra.createRoi( project.value, {
			name: payload?.name,
			description: payload?.description ?? "",
			shapeType: "pixel-list",
			deduplicate: true,
			strictBounds: false,
			points
		},
		activeGroupID(),
		percentages?.lower,
		percentages?.upper )

		await loadRoiList( true )

		const matchedRoiId = newestMatchingRoiId( payload?.name, payload?.description ?? "" )
		if( matchedRoiId.length > 0 ){
			selectedRoiId.value = matchedRoiId
		}

		roiSaveModal.value?.close()
	} catch( error ){
		console.log( error )
	} finally {
		savingRoi.value = false
	}
}

const deleteSelectedRoi = async () => {

	if( deletingRoi.value ) return
	if( canMutateRois.value === false ) return
	if( selectedRoi.value === null ) return

	const roiId = selectedRoi.value.roiId
	deletingRoi.value = true

	try{
		await hyperspectra.deleteRoi( project.value, roiId, activeGroupID() )
		selectedRoiId.value = ""
		await loadRoiList( true )
		roiDeleteModal.value?.close()
	} catch( error ){
		console.log( error )
	} finally {
		deletingRoi.value = false
	}
}

const handleHeatmapPointSelection = async ( selection ) => {

	if( project.value.id === "" ) return
	if( selection === null || typeof selection !== "object" ) return

	const x = Number.parseInt( selection.x, 10 )
	const y = Number.parseInt( selection.y, 10 )

	if( Number.isInteger( x ) === false || Number.isInteger( y ) === false ) return

	const requestID = activeSingleSpectrumRequestID.value + 1
	activeSingleSpectrumRequestID.value = requestID

	try{
		const response = await hyperspectra.spectrum( project.value, x, y, activeGroupID() )
		if( requestID !== activeSingleSpectrumRequestID.value ) return

		latestSingleSpectrum.value = {
			x,
			y,
			response
		}
		latestSelectedSpectrum.value = response ?? null
		console.log( latestSingleSpectrum.value )

		if( selectedRoi.value !== null ){
			await renderCurrentMatrix()
			return
		}

		await hyperspectrum.updateLowerSpectrum( graph.value, latestSelectedSpectrum.value, {
			axes: plotAxes(),
			settings: settings.value
		} )
	} catch( error ){
		console.log( error )
	}
}

const handleHeatmapRegionSelection = async ( selection ) => {

	if( project.value.id === "" ) return
	if( selection === null || typeof selection !== "object" ) return

	const xIndices = Array.isArray( selection.xIndices ) ? selection.xIndices : []
	const yIndices = Array.isArray( selection.yIndices ) ? selection.yIndices : []
	const points = normalizeSelectionPoints( selection.points )

	if( xIndices.length === 0 || yIndices.length === 0 || points.length === 0 ) return

	selectedHeatmapIndices.value = {
		xIndices: [ ...xIndices ],
		yIndices: [ ...yIndices ]
	}
	latestSelectedRegionPoints.value = points.map(( point ) => ({ ...point }))

	const requestID = activeMeanSpectrumRequestID.value + 1
	activeMeanSpectrumRequestID.value = requestID

	try{
		const percentages = uncertaintyPercentages()
		const response = await hyperspectra.meanSpectrum(
			project.value,
			points,
			activeGroupID(),
			true,
			false,
			percentages.lower,
			percentages.upper
		)

		if( requestID !== activeMeanSpectrumRequestID.value ) return

		latestMeanSpectrum.value = {
			xIndices: [ ...xIndices ],
			yIndices: [ ...yIndices ],
			pointsCount: points.length,
			response
		}
		latestSelectedSpectrum.value = response ?? null
		console.log( latestMeanSpectrum.value )

		if( selectedRoi.value !== null ){
			await renderCurrentMatrix()
			return
		}

		await hyperspectrum.updateLowerSpectrum( graph.value, latestSelectedSpectrum.value, {
			axes: plotAxes(),
			settings: settings.value
		} )
	} catch( error ){
		console.log( error )
	}
}

const applyHeatmapInteraction = async () => {

	if( graph.value === null ) return

	const dimensions = matrixDimensions( currentMatrix() )
	if( dimensions === null ) return

	await hyperspectrum.configureHeatmapInteraction( graph.value, {
		mode: heatmapInteractionMode.value,
		width: dimensions.width,
		height: dimensions.height,
		onPointSelect: ( selection ) => {
			void handleHeatmapPointSelection( selection )
		},
		onRegionSelect: ( selection ) => {
			void handleHeatmapRegionSelection( selection )
		}
	})
}

const isPcaComponentActive = ( componentIndex ) => {
	return activePcaComponents.value.includes( componentIndex )
}

const togglePcaComponent = async ( componentIndex ) => {

	const normalizedComponent = Number.parseInt( componentIndex, 10 )
	if( Number.isInteger( normalizedComponent ) === false ) return

	if( isPcaComponentActive( normalizedComponent ) ){
		if( activePcaComponents.value.length === 1 ) return
		activePcaComponents.value = activePcaComponents.value.filter(( index ) => index !== normalizedComponent )
	} else {
		activePcaComponents.value = [ ...activePcaComponents.value, normalizedComponent ].sort(( left, right ) => left - right )
	}

	if( activePlot.value === "pca" && pcaClassification.value !== null ){
		await renderCurrentMatrix()
	}
}

const renderCurrentMatrix = async ( initialize = false ) => {

	const matrix = currentMatrix()
	if( matrix === null || graph.value === null ) return
	const selectedSpectrum = selectedSpectrumPayload()
	const sharedOptions = {
		selectedSpectrum,
		topLeftSpectrum: topLeftSpectrumOptions(),
		roiOverlays: activeRoiOverlays(),
		axes: plotAxes()
	}

	if( activePlot.value === "pca" ){
		const options = {
			...sharedOptions,
			loadings: pcaLoadings.value,
			loadingComponents: [ ...activePcaComponents.value ]
		}

		if( initialize ){
			await hyperspectrum.initializePcaClassification( matrix, graph.value, settings.value, options )
			await applyHeatmapInteraction()
			return
		}

		await hyperspectrum.updatePcaClassification( matrix, graph.value, settings.value, options )
		await applyHeatmapInteraction()
		return
	}

	if( activePlot.value === "pca_rgb" ){
		const redComponentLabel = String( pcaRgbChannels.value.r ).padStart( 2, "0" )
		const greenComponentLabel = String( pcaRgbChannels.value.g ).padStart( 2, "0" )
		const blueComponentLabel = String( pcaRgbChannels.value.b ).padStart( 2, "0" )

		const options = {
			...sharedOptions,
			channels: { ...pcaRgbChannels.value },
			loadings: pcaLoadings.value,
			loadingSeries: [
				{
					componentIndex: pcaRgbChannels.value.r,
					label: "R - PC" + redComponentLabel,
					color: "rgb(239, 68, 68)"
				},
				{
					componentIndex: pcaRgbChannels.value.g,
					label: "G - PC" + greenComponentLabel,
					color: "rgb(34, 197, 94)"
				},
				{
					componentIndex: pcaRgbChannels.value.b,
					label: "B - PC" + blueComponentLabel,
					color: "rgb(59, 130, 246)"
				}
			]
		}

		if( initialize ){
			await hyperspectrum.initializePcaRgb( matrix, graph.value, settings.value, options )
			await applyHeatmapInteraction()
			return
		}

		await hyperspectrum.updatePcaRgb( matrix, graph.value, settings.value, options )
		await applyHeatmapInteraction()
		return
	}

	if( activePlot.value === "mip_hsv" ){
		if( initialize ){
			await hyperspectrum.initializeRgb( matrix, graph.value, settings.value, sharedOptions )
			await applyHeatmapInteraction()
			return
		}

		await hyperspectrum.updateRgb( matrix, graph.value, settings.value, sharedOptions )
		await applyHeatmapInteraction()
		return
	}

	const scalarColorscale = activePlot.value === "layer"
		? settings.value?.colormaps?.layer
		: settings.value?.colormaps?.mip
	const colorscale = typeof scalarColorscale === "string" && scalarColorscale.length > 0
		? scalarColorscale
		: "Viridis"
	const scalarOptions = {
		...sharedOptions,
		colorscale
	}

	if( initialize ){
		await hyperspectrum.initialize( matrix, graph.value, settings.value, scalarOptions )
		await applyHeatmapInteraction()
		return
	}

	await hyperspectrum.update( matrix, graph.value, settings.value, scalarOptions )
	await applyHeatmapInteraction()
}

const loadLayer = async ( layerIndex ) => {

	if( layer.value !== null && layerIndex === activeLayerIndex.value ){
		if( activePlot.value === "layer" ){
			await renderCurrentMatrix()
		}
		void hyperspectrumCache.prefetchWindow( project.value, layerIndex, 2, cacheOptions )
		return
	}

	const requestID = activeLayerRequestID.value + 1
	activeLayerRequestID.value = requestID

	hyperspectrumCache.setActiveLayer( project.value, layerIndex, cacheOptions )

	const loadedLayer = await hyperspectrumCache.getLayer( project.value,
														layerIndex,
														{ ...cacheOptions, priority: "high" })

	if( requestID !== activeLayerRequestID.value ) return

	layer.value = loadedLayer
	activeLayerIndex.value = layerIndex

	if( activePlot.value === "layer" ){
		await renderCurrentMatrix()
	}

	void hyperspectrumCache.prefetchWindow( project.value, layerIndex, 2, cacheOptions )
}

const loadMipHsv = async ( priority = "high" ) => {

	if( mipHsv.value !== null ){
		return mipHsv.value
	}

	const requestID = activeMipHsvRequestID.value + 1
	activeMipHsvRequestID.value = requestID

	const loadedMipHsv = await hyperspectrumCache.getMipHsv( project.value,
														{ ...cacheOptions, priority: priority === "low" ? "low" : "high" })

	if( requestID !== activeMipHsvRequestID.value ) return mipHsv.value

	mipHsv.value = loadedMipHsv
	return mipHsv.value
}

const loadXyz = async ( priority = "high" ) => {

	if( xyzAxes.value !== null ){
		return xyzAxes.value
	}

	const requestID = activeXyzRequestID.value + 1
	activeXyzRequestID.value = requestID

	const loadedXyz = await hyperspectrumCache.getXyz( project.value,
													{ ...cacheOptions, priority: priority === "low" ? "low" : "high" } )

	if( requestID !== activeXyzRequestID.value ) return xyzAxes.value

	xyzAxes.value = loadedXyz
	return xyzAxes.value
}

const loadPcaClassification = async () => {

	const requestID = activePcaClassificationRequestID.value + 1
	activePcaClassificationRequestID.value = requestID

	hyperspectrumCache.setActivePca( project.value, 5, cacheOptions )

	const scores = await Promise.all( pcaComponentIndices.map(( componentIndex ) => {
		return hyperspectrumCache.getPcaScore( project.value,
											componentIndex,
											{ ...cacheOptions, priority: "high" })
	}))

	if( requestID !== activePcaClassificationRequestID.value ) return

	var combinedScores = {}
	for( var ii = 0; ii < pcaComponentIndices.length; ii++ ){
		combinedScores[ pcaComponentIndices[ii] ] = scores[ii]
	}

	pcaClassification.value = combinedScores

	if( activePlot.value === "pca" || activePlot.value === "pca_rgb" ){
		await renderCurrentMatrix()
	}
}

const loadPcaLoadings = async () => {

	if( pcaLoadings.value !== null ){
		return pcaLoadings.value
	}

	const requestID = activePcaLoadingsRequestID.value + 1
	activePcaLoadingsRequestID.value = requestID

	const loadedLoadings = await hyperspectrumCache.getLoadings( project.value, { ...cacheOptions, priority: "high" })

	if( requestID !== activePcaLoadingsRequestID.value ) return pcaLoadings.value

	pcaLoadings.value = loadedLoadings

	if(( activePlot.value === "pca" || activePlot.value === "pca_rgb" ) && pcaClassification.value !== null ){
		await renderCurrentMatrix()
	}

	return pcaLoadings.value
}

const normalizeLayerInput = ( value ) => {

	const parsed = Number.parseInt( value, 10 )
	if( Number.isInteger( parsed ) === false || parsed < 0 ){
		return 0
	}

	return Math.max( 0, Math.min( maxLayerIndex.value, parsed ))
}

const applyLayerInput = async () => {

	const layerIndex = normalizeLayerInput( layerInput.value )
	layerInput.value = layerIndex
	await loadLayer( layerIndex )
}

const normalizePcaComponentInput = ( value ) => {

	const parsed = Number.parseInt( value, 10 )
	if( Number.isInteger( parsed ) === false ){
		return 1
	}

	return Math.max( 1, Math.min( 10, parsed ))
}

const applyPcaRgbInput = async () => {

	const red = normalizePcaComponentInput( pcaRgbRedInput.value )
	const green = normalizePcaComponentInput( pcaRgbGreenInput.value )
	const blue = normalizePcaComponentInput( pcaRgbBlueInput.value )

	pcaRgbRedInput.value = red
	pcaRgbGreenInput.value = green
	pcaRgbBlueInput.value = blue

	pcaRgbChannels.value = {
		r: red,
		g: green,
		b: blue
	}

	if( activePlot.value === "pca_rgb" && pcaClassification.value !== null ){
		await renderCurrentMatrix()
	}
}

const refreshOnResize = debounce( async () => {
	if( graph.value === null ) return
	await renderCurrentMatrix()
}, 100 )

const debouncedApplyLayerInput = debounce( async () => {

	if( activePlot.value !== "layer" ) return
	await applyLayerInput()
}, 120 )

const debouncedApplyPcaRgbInput = debounce( async () => {

	if( activePlot.value !== "pca_rgb" ) return
	await applyPcaRgbInput()
}, 120 )

onMounted( async () => {

    try{

        var savedSettings = await settingslib.get()
		var savedBilling = await settingslib.getBilling()

        settings.value = savedSettings
		if( savedBilling && typeof savedBilling === "object" ){
			billingSettings.value = {
				groupID: typeof savedBilling.groupID === "string" ? savedBilling.groupID : ""
			}
		}
        projects.value = await projectlib.list()
        project.value = projects.value[ projectID ]

		await hyperspectrumCache.initProjectCache( project.value, cacheOptions )
		hyperspectrumCache.setActiveLayer( project.value, 0, cacheOptions )
		hyperspectrumCache.setActivePca( project.value, 5, cacheOptions )
		await loadRoiList()

		try{
			await loadXyz( "high" )
		} catch( xyzError ){
			console.log( xyzError )
		}

		mip.value = await hyperspectrumCache.getMip( project.value, cacheOptions )
		if( activePlot.value === "mip_hsv" ){
			await loadMipHsv( "high" )
		} else {
			void loadMipHsv( "low" ).catch(( mipHsvError ) => {
				console.log( mipHsvError )
			})
		}

        await nextTick()
        await renderCurrentMatrix( true )

		try{

			const initialIndex = Math.floor( maxLayerIndex.value / 2 )
			layerInput.value = initialIndex
			await loadLayer( initialIndex )
		} catch( layerError ){
			console.log( layerError )
		}

		void hyperspectrumCache.prefetchWindow( project.value, 0, 2, cacheOptions )

		void hyperspectrumCache.prefetchPcaScores( project.value, cacheOptions )
		void loadPcaClassification().catch(( classificationError ) => {
			console.log( classificationError )
		})
		void loadPcaLoadings().catch(( loadingsError ) => {
			console.log( loadingsError )
		})

		if( typeof ResizeObserver !== "undefined" && graph.value ){
			resizeObserver = new ResizeObserver(() => {
				void refreshOnResize()
			})
			resizeObserver.observe( graph.value )
		}

    } catch( error ){
		console.log( error )
        navigation.route("Main menu", {})
    }

    emit("loaded")
})

watch( pcaLegend, async ( legendEntries ) => {

	hyperspectrum.setPcaComponentColors( legendEntries )

	if( graph.value === null ) return
	if( activePlot.value !== "pca" && activePlot.value !== "pca_rgb" ) return
	if( currentMatrix() === null ) return

	try{
		await renderCurrentMatrix()
	} catch( error ){
		console.log( error )
	}
}, { immediate: true })

watch( activePlot, async ( plotMode ) => {

	if( project.value.id === "" ) return

	try{
		if( plotMode === "mip" ){
			await renderCurrentMatrix()
			return
		}

		if( plotMode === "mip_hsv" ){
			await loadMipHsv( "high" )
			await renderCurrentMatrix()
			return
		}

		if( plotMode === "layer" ){
			await applyLayerInput()
			return
		}

		await loadPcaClassification()
		void loadPcaLoadings().catch(( loadingsError ) => {
			console.log( loadingsError )
		})
	} catch( error ){
		console.log( error )
	}
})

watch( heatmapInteractionMode, async () => {
	try{
		await applyHeatmapInteraction()
	} catch( error ){
		console.log( error )
	}
})

watch( selectedRoiId, async () => {

	if( graph.value === null ) return
	if( currentMatrix() === null ) return

	try{
		await renderCurrentMatrix()
	} catch( error ){
		console.log( error )
	}
})

onBeforeUnmount( () => {

	if( resizeObserver !== null ){
		resizeObserver.disconnect()
		resizeObserver = null
	}

	refreshOnResize.cancel()
	debouncedApplyLayerInput.cancel()
	debouncedApplyPcaRgbInput.cancel()
})

</script>
