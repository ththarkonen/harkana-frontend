<template>
<!-- Outer frame -->
<div class="bg-brand min-h-screen p-[2px] overflow-hidden">

	<!-- Mobile overlay -->
	<div v-if = "sidebarOpen" @click = "sidebarOpen = false" class = "fixed inset-0 bg-black/40 z-30 md:hidden"></div>
	<!-- App Grid -->
	<div class="grid h-[calc(100vh-4px)] gap-[2px] grid-cols-1 grid-rows-[auto_1fr] md:grid-cols-[16rem_1fr] md:grid-rows-[auto_1fr]">

		<Sidebar :style = "sidebarStyle">
			<Logo></Logo>

			<div v-if = "sidebarEstimateStatusText.length > 0"
				 class = "mt-2 flex items-center gap-2 rounded-lg border border-brand/60 bg-gray-800 px-3 py-2 text-sm text-white"
				 aria-live = "polite">
				<Spinner class = "h-4 w-4 shrink-0 text-brand"></Spinner>
				<span>{{ sidebarEstimateStatusText }}</span>
			</div>

			<div v-if = "sidebarEstimateErrorText.length > 0"
				 class = "mt-2 rounded-lg border border-red-500/70 bg-red-500/10 px-3 py-2 text-sm text-red-100"
				 aria-live = "polite">
				{{ sidebarEstimateErrorText }}
			</div>

			<div v-if = "!project.shared && calibrating" class = "mt-2">
				<CalibrationControls :project = "project"
									 :marker = "marker"
									 :calibration = "calibration"
									 :step = "calibrationStep"
									 class = "my-2">
				</CalibrationControls>
			</div>

				<div class = "mt-2 rounded-lg border-2 border-gray bg-gray-800 p-2 shadow-md shadow-black">
				<div class = "flex items-center justify-between gap-1">
					<div class = "flex min-w-0 items-center gap-1">
						<span class = "inline-flex h-5 w-5 items-center justify-center text-white" aria-hidden = "true">
							<i class = "fas fa-layer-group text-sm"></i>
						</span>
						<h3 class = "whitespace-nowrap font-semibold text-white">Display</h3>
					</div>

					<BaseDropdown :show-chevron = "false"
								  :close-on-select = "true"
								  :teleport-to-body = "true"
								  trigger-class = "inline-flex h-8 w-8 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand"
								  menu-class = "fixed z-[45] min-w-[14rem] w-max max-w-[50vw] origin-top-left rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30">
						<template v-slot:trigger>
							<span class = "sr-only">Display options</span>
							<i class = "fas fa-ellipsis-v" aria-hidden = "true" title = "Display options"></i>
						</template>

						<li class = "px-4 pt-2 pb-1 text-xs uppercase tracking-wide text-white/70">
							Layout
						</li>
						<li v-for = "option in SPECTRUM_LAYOUT_SELECT_OPTIONS"
							:key = "'spectrum-layout-' + option.value">
							<button type = "button"
									@click = "updateSpectrumLayoutMode( option.value )"
									class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
								<span>{{ option.label }}</span>
								<i :class = "spectrumLayoutMode === option.value ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
								   aria-hidden = "true"></i>
							</button>
						</li>

						<li><hr class = "h-0.5 bg-gray border-0"></li>
						<li class = "px-4 pt-2 pb-1 text-xs uppercase tracking-wide text-white/70">
							Legend hover emphasis
						</li>
						<li>
							<button type = "button"
									@click = "setLegendHoverEmphasisEnabled( true )"
									class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
								<span>Enabled</span>
								<i :class = "legendHoverEmphasisEnabled ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
								   aria-hidden = "true"></i>
							</button>
						</li>
						<li>
							<button type = "button"
									@click = "setLegendHoverEmphasisEnabled( false )"
									class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
								<span>Disabled</span>
								<i :class = "legendHoverEmphasisEnabled === false ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
								   aria-hidden = "true"></i>
							</button>
						</li>
					</BaseDropdown>
				</div>
			</div>

		</Sidebar>

		<NavigationBar>
			<template v-slot:left-items>
				<button @click = "sidebarOpen = true" class = "md:hidden mr-4 px-3 py-2 rounded bg-slate-100">☰</button>
				<BaseDropdown :teleport-to-body = "true"
							  portal-placement = "bottom-start"
							  :portal-offset-x = "0"
							  :portal-offset-y = "8"
							  menu-class = "fixed z-[45] min-w-[14rem] w-max max-w-[50vw] origin-top-left rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30">
					<template v-slot:trigger>
						<span class = "font-medium">Project</span>
					</template>

					<BaseDropdownItem @select = "focusProjectNameEdit"
									  :disabled = "project.shared"
									  :tooltip = "ownedProjectActionTooltip('Renaming')">
						Rename
					</BaseDropdownItem>

					<BaseDropdownItem @select = "toggleCalibration"
									  :disabled = "project.shared"
									  :tooltip = "ownedProjectActionTooltip('Calibration')">
						Calibrate
					</BaseDropdownItem>

					<hr class = "h-0.5 bg-gray border-0 my-1">

					<BaseDropdownItem @select = "openProjectChat">
						Notes
					</BaseDropdownItem>

					<BaseDropdownItem @select = "openMetadataModal">
						Metadata
					</BaseDropdownItem>

					<BaseDropdownItem @select = "openComparisonModal"
									  :disabled = "canCompare === false"
									  :tooltip = "comparisonTooltip">
						Compare
					</BaseDropdownItem>

					<BaseDropdownItem @select = "download">
						Download
					</BaseDropdownItem>

					<BaseDropdownItem @select = "openShareModal"
									  :disabled = "project.shared"
									  :tooltip = "ownedProjectActionTooltip('Sharing')">
						Share
					</BaseDropdownItem>

					<BaseDropdownItem @select = "openZenodoModal"
									  :disabled = "project.shared"
									  :tooltip = "ownedProjectActionTooltip('Zenodo exporting')">
						Zenodo export
					</BaseDropdownItem>

					<hr class = "h-0.5 bg-gray border-0 my-1">

					<BaseDropdownItem @select = "openVisualizationSettings">
						Visualization settings
					</BaseDropdownItem>

					<BaseDropdownItem @select = "openProjectMenu">
						Main menu
					</BaseDropdownItem>
				</BaseDropdown>
				<ProjectNameInput ref = "projectNameInput" :project = "project"></ProjectNameInput>
			</template>
			<template v-slot:right-items>
				<AccountDropdown></AccountDropdown>
			</template>
		</NavigationBar>


		<!-- Main Content -->
			<main class="relative z-0 bg-dark-gray rounded-lg overflow-hidden shadow-sm p-0">
				<div class = "flex h-full min-h-0 flex-col gap-2 p-2">
					<div v-if = "splitSpectrumLegendEntries.length > 0"
						 class = "shrink-0 overflow-hidden rounded-lg bg-white">
						<div class = "flex flex-wrap items-center gap-1.5 border-b border-gray/20 px-2 py-1.5">
							<span class = "text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45">
								Legend
							</span>
							<button v-for = "entry in splitSpectrumLegendEntries"
									:key = "entry.key"
									type = "button"
									:title = "isSplitSpectrumLegendHidden( entry.key ) ? 'Show' : 'Hide'"
									@click = "toggleSplitSpectrumLegendVisibility( entry.key )"
									@mouseenter = "hoveredSplitSpectrumLegendKey = entry.key"
									@mouseleave = "hoveredSplitSpectrumLegendKey = ''"
									@focus = "hoveredSplitSpectrumLegendKey = entry.key"
									@blur = "hoveredSplitSpectrumLegendKey = ''"
									:class = "[
										isSplitSpectrumLegendHidden( entry.key ) ? 'border-gray/25 bg-white text-black/35 opacity-55' : '',
										hoveredSplitSpectrumLegendKey === entry.key ? 'border-black/25 bg-black/5 text-black shadow-sm' : 'border-gray/30 bg-white text-black/70'
									]"
									class = "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] transition-colors focus:outline-none">
								<span class = "h-2.5 w-2.5 rounded-sm"
									  :style = "{ backgroundColor: entry.color }"></span>
								<span v-html = "entry.html"></span>
							</button>
						</div>
					</div>

					<template v-if = "usesSplitSpectrumLayout">
						<div ref = "spectraPaneContainer"
							 class = "grid min-h-0 w-full flex-1"
							 :style = "spectraPaneGridStyle">
							<div class = "relative min-h-0 min-w-0 overflow-hidden rounded-lg bg-white">
								<div class = "flex h-full min-h-0 flex-col">
									<div class = "shrink-0 border-b border-gray/20 px-3 py-2">
										<span class = "text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
											Measurement
										</span>
									</div>
									<div class = "relative min-h-0 flex-1">
										<div ref = "topGraph" class = "h-full w-full bg-white"></div>
									</div>
								</div>
							</div>

							<div v-if = "splitPaneIsVertical"
								 class = "relative h-5 shrink-0 cursor-row-resize select-none touch-none"
								 title = "Resize spectra panes"
								 @pointerdown = "startSpectraPaneResize">
								<div class = "absolute inset-x-2 top-1/2 h-px -translate-y-1/2 rounded-full bg-gray/90"></div>
								<div class = "absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-row items-center"
									 aria-hidden = "true">
									<span class = "flex flex-row items-center gap-[2px] rounded-md border border-gray/70 bg-dark-gray/90 px-1 py-1 shadow-sm">
										<span class = "h-1 w-1 rotate-45 bg-white/60"></span>
										<span class = "h-1 w-1 rotate-45 bg-white/60"></span>
										<span class = "h-1 w-1 rotate-45 bg-white/60"></span>
									</span>
								</div>
							</div>
							<div v-else
								 class = "relative w-5 shrink-0 cursor-col-resize touch-none"
								 title = "Resize spectra panes"
								 @pointerdown = "startSpectraPaneResize">
								<div class = "absolute inset-y-2 left-1/2 w-px -translate-x-1/2 rounded-full bg-gray/90"></div>
								<div class = "absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
									 aria-hidden = "true">
									<span class = "flex flex-col items-center gap-[2px] rounded-md border border-gray/70 bg-dark-gray/90 px-1 py-1 shadow-sm">
										<span class = "h-1 w-1 rotate-45 bg-white/60"></span>
										<span class = "h-1 w-1 rotate-45 bg-white/60"></span>
										<span class = "h-1 w-1 rotate-45 bg-white/60"></span>
									</span>
								</div>
							</div>

							<div class = "relative min-h-0 min-w-0 overflow-hidden rounded-lg bg-white">
								<div class = "flex h-full min-h-0 flex-col">
									<div class = "shrink-0 border-b border-gray/20 px-3 py-2">
										<span class = "text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
											{{ estimatePaneTitle }}
										</span>
									</div>
									<div v-if = "hasEstimate" class = "relative min-h-0 flex-1">
										<div ref = "bottomGraph" class = "h-full w-full bg-white"></div>
									</div>
									<div v-else class = "flex min-h-0 flex-1 items-center justify-center px-8 text-center">
										<div class = "max-w-lg space-y-3">
											<p class = "text-base font-semibold text-black/80">
												Estimate pending
											</p>
											<p class = "text-sm leading-relaxed text-black/55">
												{{ estimatePanePlaceholderText }}
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</template>
					<template v-else>
						<div class = "min-h-0 flex-1">
							<div class = "relative h-full min-h-0 overflow-hidden rounded-lg bg-white">
							<div ref = "singleGraph" class = "h-full w-full bg-white"></div>
							<div v-if = "hasEstimate === false"
								 class = "pointer-events-none absolute bottom-4 right-4 max-w-sm rounded-lg border border-brand/30 bg-white/92 px-4 py-3 text-sm shadow-sm">
								<p class = "font-semibold text-black/80">
									Estimate pending
								</p>
								<p class = "mt-1 leading-relaxed text-black/55">
									{{ estimatePanePlaceholderText }}
								</p>
							</div>
						</div>
						</div>
					</template>
				</div>
			</main>

	</div>

	<MetadataModal ref = "metadataModal" :project = "project"></MetadataModal>
	<ComparisonSelectModal 	ref = "comparisonSelectModal"
							v-model = "comparisonProjectID"
							:currentID = "project.id"
							:projects = "projects" >
	</ComparisonSelectModal>
	<ShareModal ref = "shareModal" :project = "project"></ShareModal>
	<ZenodoModal ref = "zenodoModal" :project = "project"></ZenodoModal>
	<ProjectChatWindow v-model = "projectChatOpen"
					   :project = "project"></ProjectChatWindow>
</div>
</template>

<script setup>

import { ref, toRaw, watch, computed, nextTick, onMounted, onBeforeUnmount} from 'vue'
import { useRoute } from 'vue-router'
import { debounce } from 'lodash'
import katex from "katex"
const route = useRoute()
const dataType = String( import.meta.env.VITE_DATA_TYPE ?? "" ).trim().toLowerCase()

const emit = defineEmits(["loaded"])

import { projects as projectlib, settings as settingslib} from "@harkana/tools"
import { navigation, results, utils} from "@harkana/tools"
import { plot, splitSpectrumLegendGroups } from "@harkana/plot"

import Sidebar from './sidebar/Sidebar.vue'
import Logo from "./sidebar/Logo.vue"
import CalibrationControls from './sidebar/CalibrationControls.vue'
import Spinner from './general/Spinner.vue'

import NavigationBar from './navbar/NavigationBar.vue'
import AccountDropdown from './navbar/AccountDropdown.vue'
import BaseDropdown from './navbar/BaseDropdown.vue'
import BaseDropdownItem from './navbar/BaseDropdownItem.vue'
import ProjectNameInput from './navbar/ProjectNameInput.vue'

import MetadataModal from './modals/MetadataModal.vue'
import ComparisonSelectModal from './modals/ComparisonSelectModal.vue'
import ShareModal from './modals/ShareModal.vue'
import ZenodoModal  from './modals/ZenodoModal.vue'
import ProjectChatWindow from './chat/ProjectChatWindow.vue'

const metadataModal = ref(null)
const comparisonSelectModal = ref(null)
const shareModal = ref(null)
const zenodoModal = ref(null)
const projectNameInput = ref(null)

const projectID = route.params.id
const comparisonProjectID = ref("")

const project = ref({id: ""})
const projects = ref({})
const settings = ref({})

const data = ref(null)
const estimate = ref(null)
const estimateJobStatus = ref(null)
const estimateJobError = ref("")
const comparison = ref({
    data: null,
    estimate: null
})

const downloading = ref(false)
const calibrating = ref(false)
const calibrationStep = ref(1)
const calibration = ref({
    x: 0
})

const marker = ref({
    x: 0
})

const topGraph = ref(null)
const bottomGraph = ref(null)
const singleGraph = ref(null)
const spectraPaneContainer = ref(null)
const projectChatOpen = ref(false)
const hoveredSplitSpectrumLegendKey = ref("")
let estimatePollTimeout = null
let spectraPaneResizeSession = null
let spectraPaneResizeFrame = null
let spectraPaneContainerResizeObserver = null

const MIN_SPECTRUM_PANEL_SIZE = 120
const SPECTRA_PANE_DIVIDER_SIZE_PX = 20
const SPECTRUM_LAYOUT_SELECT_OPTIONS = Object.freeze([
	{ value: "vertical", label: "Vertical panes" },
	{ value: "horizontal", label: "Horizontal panes" },
	{ value: "single", label: "Single pane" }
])
const splitPanePrimarySize = ref(null)
const splitPanePrimarySizeTouched = ref(false)
const splitPlotHiddenLegendKeys = ref([])
const splitComparisonHiddenLegendKeys = ref([])
const legendHoverEmphasisEnabled = ref(true)
const ESTIMATE_STATUS_FINAL_WRITE_STOPPED_MESSAGE = "Task stopped before writing final single-spectrum estimate status."

const estimateTerminalStatuses = new Set([ "SUCCEEDED", "PARTIAL_SUCCEEDED", "FAILED" ])
const estimateRunningStatuses = new Set([ "SUBMITTED", "STARTED", "PENDING" ])

const sidebarOpen = ref(false)
const sidebarStyle = computed(() => {
  return sidebarOpen.value
    ? { left: '2px' }
    : { left: 'calc(-16rem - 2px)' }
})

const hasEstimate = computed(() => {
	return estimate.value !== null && !( estimate.value instanceof Error )
})

const activeEstimateItem = computed(() => {
	const items = Array.isArray( estimateJobStatus.value?.items ) ? estimateJobStatus.value.items : []
	return items.find(( item ) => String( item?.projectID ?? "" ) === String( project.value?.id ?? "" )) ?? null
})

const projectEstimateJobId = computed(() => {
	return String(
		estimateJobStatus.value?.jobId ??
		project.value?.estimateJobId ??
		project.value?.jobId ??
		""
	).trim()
})

const estimateInProgress = computed(() => {
	if( hasEstimate.value ){
		return false
	}

	const itemStatus = String( activeEstimateItem.value?.status ?? project.value?.estimateItemStatus ?? "" ).trim()
	if( estimateRunningStatuses.has( itemStatus )){
		return true
	}

	const jobStatus = String( estimateJobStatus.value?.status ?? project.value?.estimateJobStatus ?? "" ).trim()
	return estimateRunningStatuses.has( jobStatus )
})

const sidebarEstimateStatusText = computed(() => {
	if( sidebarEstimateErrorText.value.includes( ESTIMATE_STATUS_FINAL_WRITE_STOPPED_MESSAGE ) ){
		return ""
	}

	return estimateInProgress.value ? "Raman inference running" : ""
})

const sidebarEstimateErrorText = computed(() => {
	return String( estimateJobError.value || project.value?.estimateErrorMessage || "" ).trim()
})

const canCompare = computed(() => {
	return hasEstimate.value === true
})

const comparisonTooltip = computed(() => {
	return canCompare.value ? "" : "Comparison is available once the estimate is ready."
})

const comparisonActive = computed(() => {
	return comparisonProjectID.value.length > 0 &&
		comparisonProjectID.value !== project.value?.id &&
		comparison.value.data !== null &&
		comparison.value.estimate !== null
})

const spectrumLayoutMode = computed(() => {
	const value = String( settings.value?.layout?.layout ?? "vertical" ).trim().toLowerCase()
	if( value === "horizontal" || value === "single" ){
		return value
	}

	return "vertical"
})

const usesSplitSpectrumLayout = computed(() => {
	return spectrumLayoutMode.value !== "single"
})

const splitPaneIsVertical = computed(() => {
	return spectrumLayoutMode.value !== "horizontal"
})

const estimatePaneTitle = computed(() => {
	return dataType === "raman" ? "Raman estimate" : "Estimate"
})

const estimatePanePlaceholderText = computed(() => {
	if( sidebarEstimateErrorText.value.length > 0 ){
		return dataType === "raman"
			? "The Raman spectrum estimate is not available because the analysis did not complete successfully."
			: "The spectrum estimate is not available because the analysis did not complete successfully."
	}

	return dataType === "raman"
		? "The Raman spectrum estimate will be shown in this pane once the analysis is complete."
		: "The spectrum estimate will be shown in this pane once the analysis is complete."
})

const normalizeLegendKey = ( key ) => {
	return typeof key === "string" ? key.trim() : ""
}

const normalizeLegendLabel = ( value, fallback ) => {
	const normalizedValue = String( value ?? "" ).trim()
	return normalizedValue.length > 0 ? normalizedValue : fallback
}

const normalizeLegendColor = ( value, fallback ) => {
	const normalizedValue = String( value ?? "" ).trim()
	return normalizedValue.length > 0 ? normalizedValue : fallback
}

const stripLegendMathDelimiters = ( value ) => {
	const normalizedValue = String( value ?? "" ).trim()
	if( normalizedValue.startsWith( "$$" ) && normalizedValue.endsWith( "$$" ) && normalizedValue.length >= 4 ){
		return normalizedValue.slice( 2, -2 ).trim()
	}
	if( normalizedValue.startsWith( "$" ) && normalizedValue.endsWith( "$" ) && normalizedValue.length >= 2 ){
		return normalizedValue.slice( 1, -1 ).trim()
	}
	return normalizedValue
}

const escapeHtml = ( value ) => {
	return String( value ?? "" )
		.replaceAll( "&", "&amp;" )
		.replaceAll( "<", "&lt;" )
		.replaceAll( ">", "&gt;" )
		.replaceAll( '"', "&quot;" )
		.replaceAll( "'", "&#39;" )
}

const escapeLatexText = ( value ) => {
	return String( value ?? "" )
		.replaceAll( "\\", "\\textbackslash{}" )
		.replaceAll( "{", "\\{" )
		.replaceAll( "}", "\\}" )
}

const renderLegendLabelHtml = ( value, fallback ) => {
	const normalizedValue = stripLegendMathDelimiters( normalizeLegendLabel( value, fallback ) )
	if( normalizedValue.length === 0 ){
		return ""
	}

	const isPlainTextLabel = /[\\^_{}]/.test( normalizedValue ) === false
	const expression = isPlainTextLabel
		? `\\text{${escapeLatexText( normalizedValue )}}`
		: normalizedValue

	try{
		return katex.renderToString( expression, {
			throwOnError: false,
			displayMode: false
		} )
	} catch{
		return escapeHtml( normalizedValue )
	}
}

const hiddenLegendKeysFromVisibility = ( visibility = {} ) => {
	const hiddenKeys = []

	if( visibility?.data === false ){
		hiddenKeys.push( splitSpectrumLegendGroups.measurement )
	}
	if( visibility?.median === false ){
		hiddenKeys.push( splitSpectrumLegendGroups.estimateMedian )
	}
	if( visibility?.interval50 === false ){
		hiddenKeys.push( splitSpectrumLegendGroups.estimateQ50 )
	}
	if( visibility?.interval75 === false ){
		hiddenKeys.push( splitSpectrumLegendGroups.estimateQ75 )
	}
	if( visibility?.interval90 === false ){
		hiddenKeys.push( splitSpectrumLegendGroups.estimateQ90 )
	}
	if( visibility?.interval95 === false ){
		hiddenKeys.push( splitSpectrumLegendGroups.estimateQ95 )
	}

	return Array.from( new Set( hiddenKeys ) )
}

const seedSplitSpectrumLegendVisibility = () => {
	splitPlotHiddenLegendKeys.value = hiddenLegendKeysFromVisibility( settings.value?.visibility?.plot ?? {} )
	splitComparisonHiddenLegendKeys.value = hiddenLegendKeysFromVisibility( settings.value?.visibility?.comparison ?? {} )
}

const activeSplitSpectrumHiddenLegendKeys = computed(() => {
	const source = comparisonActive.value ? splitComparisonHiddenLegendKeys.value : splitPlotHiddenLegendKeys.value
	return Array.from( new Set(
		( Array.isArray( source ) ? source : [] )
			.map(( key ) => normalizeLegendKey( key ))
			.filter(( key ) => key.length > 0 )
	))
})

const hiddenSplitSpectrumLegendKeySet = computed(() => {
	return new Set( activeSplitSpectrumHiddenLegendKeys.value )
})

const splitSpectrumLegendEntries = computed(() => {
	if( data.value === null ){
		return []
	}

	const nextEntries = [
		{
			key: splitSpectrumLegendGroups.measurement,
			label: normalizeLegendLabel( settings.value?.legends?.data, "Measurement" ),
			html: renderLegendLabelHtml( settings.value?.legends?.data, "Measurement" ),
			color: normalizeLegendColor( settings.value?.colors?.data, "#111827" )
		}
	]

	if( hasEstimate.value ){
		nextEntries.push(
			{
				key: splitSpectrumLegendGroups.estimateMedian,
				label: normalizeLegendLabel( settings.value?.legends?.median, "Estimate" ),
				html: renderLegendLabelHtml( settings.value?.legends?.median, "Estimate" ),
				color: normalizeLegendColor( settings.value?.colors?.median, "#111827" )
			},
			{
				key: splitSpectrumLegendGroups.estimateQ50,
				label: normalizeLegendLabel( settings.value?.legends?.interval50, "50%" ),
				html: renderLegendLabelHtml( settings.value?.legends?.interval50, "50%" ),
				color: normalizeLegendColor( settings.value?.colors?.area, "#9ca3af" )
			},
			{
				key: splitSpectrumLegendGroups.estimateQ75,
				label: normalizeLegendLabel( settings.value?.legends?.interval75, "75%" ),
				html: renderLegendLabelHtml( settings.value?.legends?.interval75, "75%" ),
				color: normalizeLegendColor( settings.value?.colors?.area, "#9ca3af" )
			},
			{
				key: splitSpectrumLegendGroups.estimateQ90,
				label: normalizeLegendLabel( settings.value?.legends?.interval90, "90%" ),
				html: renderLegendLabelHtml( settings.value?.legends?.interval90, "90%" ),
				color: normalizeLegendColor( settings.value?.colors?.area, "#9ca3af" )
			},
			{
				key: splitSpectrumLegendGroups.estimateQ95,
				label: normalizeLegendLabel( settings.value?.legends?.interval95, "95%" ),
				html: renderLegendLabelHtml( settings.value?.legends?.interval95, "95%" ),
				color: normalizeLegendColor( settings.value?.colors?.area, "#9ca3af" )
			}
		)
	}

	return nextEntries
})

const isSplitSpectrumLegendHidden = ( key ) => {
	return hiddenSplitSpectrumLegendKeySet.value.has( normalizeLegendKey( key ) )
}

const setActiveSplitSpectrumHiddenLegendKeys = ( nextKeys ) => {
	const normalizedKeys = Array.from( new Set(
		( Array.isArray( nextKeys ) ? nextKeys : [] )
			.map(( key ) => normalizeLegendKey( key ))
			.filter(( key ) => key.length > 0 )
	))

	if( comparisonActive.value ){
		splitComparisonHiddenLegendKeys.value = normalizedKeys
		return
	}

	splitPlotHiddenLegendKeys.value = normalizedKeys
}

const toggleSplitSpectrumLegendVisibility = ( key ) => {
	const normalizedKey = normalizeLegendKey( key )
	if( normalizedKey.length === 0 ){
		return
	}

	if( hiddenSplitSpectrumLegendKeySet.value.has( normalizedKey ) ){
		setActiveSplitSpectrumHiddenLegendKeys(
			activeSplitSpectrumHiddenLegendKeys.value.filter(( currentKey ) => currentKey !== normalizedKey )
		)
		return
	}

	setActiveSplitSpectrumHiddenLegendKeys([
		...activeSplitSpectrumHiddenLegendKeys.value,
		normalizedKey
	])
}

const setLegendHoverEmphasisEnabled = ( enabled ) => {
	legendHoverEmphasisEnabled.value = enabled === true
}

const clampSplitPanePrimarySize = ( size ) => {

	const normalizedSize = Number( size )
	const containerSize = splitPaneIsVertical.value
		? Number( spectraPaneContainer.value?.clientHeight )
		: Number( spectraPaneContainer.value?.clientWidth )

	if( Number.isFinite( normalizedSize ) === false ){
		return MIN_SPECTRUM_PANEL_SIZE
	}

	if( Number.isFinite( containerSize ) === false || containerSize <= 0 ){
		return Math.max( MIN_SPECTRUM_PANEL_SIZE, Math.round( normalizedSize ))
	}

	const maximumHeight = Math.max(
		MIN_SPECTRUM_PANEL_SIZE,
		Math.round( containerSize - MIN_SPECTRUM_PANEL_SIZE - SPECTRA_PANE_DIVIDER_SIZE_PX )
	)

	return Math.max( MIN_SPECTRUM_PANEL_SIZE, Math.min( maximumHeight, Math.round( normalizedSize )))
}

const defaultSplitPanePrimarySize = () => {

	const containerSize = splitPaneIsVertical.value
		? Number( spectraPaneContainer.value?.clientHeight )
		: Number( spectraPaneContainer.value?.clientWidth )
	if( Number.isFinite( containerSize ) === false || containerSize <= 0 ){
		return MIN_SPECTRUM_PANEL_SIZE
	}

	const availableHeight = containerSize - SPECTRA_PANE_DIVIDER_SIZE_PX
	if( Number.isFinite( availableHeight ) === false || availableHeight <= 0 ){
		return MIN_SPECTRUM_PANEL_SIZE
	}

	return clampSplitPanePrimarySize( availableHeight / 2 )
}

const ensureSplitPanePrimarySize = ( options = {} ) => {

	const shouldReset = options?.forceDefault === true
	const nextHeight = shouldReset || Number.isFinite( Number( splitPanePrimarySize.value )) === false
		? defaultSplitPanePrimarySize()
		: clampSplitPanePrimarySize( splitPanePrimarySize.value )

	splitPanePrimarySize.value = nextHeight
	return nextHeight
}

const resolvedSplitPanePrimarySize = computed(() => {

	const configuredHeight = Number( splitPanePrimarySize.value )
	if( Number.isFinite( configuredHeight ) ){
		return clampSplitPanePrimarySize( configuredHeight )
	}

	return defaultSplitPanePrimarySize()
})

const spectraPaneGridStyle = computed(() => {
	if( splitPaneIsVertical.value ){
		return {
			gridTemplateRows: `${resolvedSplitPanePrimarySize.value}px ${SPECTRA_PANE_DIVIDER_SIZE_PX}px minmax(${MIN_SPECTRUM_PANEL_SIZE}px, 1fr)`
		}
	}

	return {
		gridTemplateColumns: `${resolvedSplitPanePrimarySize.value}px ${SPECTRA_PANE_DIVIDER_SIZE_PX}px minmax(${MIN_SPECTRUM_PANEL_SIZE}px, 1fr)`
	}
})

const download = async() => {

	downloading.value = true
	await projectlib.download([ project.value ])

	await utils.wait(1000)
	downloading.value = false
}

const openProjectChat = () => {
	projectChatOpen.value = true
}

const openMetadataModal = () => {
	metadataModal.value?.open()
}

const openShareModal = () => {
	shareModal.value?.open()
}

const openZenodoModal = () => {
	zenodoModal.value?.open()
}

const openProjectMenu = () => {
	navigation.route( "Main menu", {} )
}

const openVisualizationSettings = () => {
	navigation.redirect( "Settings", "Visualization" )
}

const focusProjectNameEdit = () => {
	projectNameInput.value?.focusNameEdit?.()
}

const toggleCalibration = () => {
	if( project.value?.shared ){
		return
	}

	calibrating.value = !calibrating.value
}

const openComparisonModal = () => {
	if( canCompare.value === false ){
		return
	}

	comparisonSelectModal.value?.open()
}

const updateSpectrumLayoutMode = async ( nextLayoutMode ) => {
	const normalizedLayoutMode = String( nextLayoutMode ?? "" ).trim().toLowerCase()
	const resolvedLayoutMode = normalizedLayoutMode === "horizontal" || normalizedLayoutMode === "single"
		? normalizedLayoutMode
		: "vertical"

	if( spectrumLayoutMode.value === resolvedLayoutMode ){
		return
	}

	const nextSettings = structuredClone( toRaw( settings.value ?? {} ) )
	nextSettings.layout = {
		...( nextSettings.layout ?? {} ),
		layout: resolvedLayoutMode
	}

	settings.value = nextSettings

	const error = await settingslib.set( nextSettings )
	if( error ){
		console.log( error )
	}
}

const ownedProjectActionTooltip = ( action ) => {
	return project.value?.shared ? `${action} is available for owned projects only.` : ""
}

const queueSpectraPaneResponsiveResize = () => {
	if( spectraPaneResizeFrame !== null ){
		cancelAnimationFrame( spectraPaneResizeFrame )
	}

	spectraPaneResizeFrame = requestAnimationFrame(() => {
		spectraPaneResizeFrame = null
		if( singleGraph.value !== null ){
			void plot.resize( singleGraph.value )
		}
		if( topGraph.value !== null ){
			void plot.resize( topGraph.value )
		}
		if( bottomGraph.value !== null ){
			void plot.resize( bottomGraph.value )
		}
	})
}

const applySplitSpectrumLegendVisibility = async () => {
	const operations = []
	const hiddenKeys = activeSplitSpectrumHiddenLegendKeys.value

	if( singleGraph.value !== null ){
		operations.push( plot.setHiddenTraceGroups( singleGraph.value, hiddenKeys ) )
	}

	if( topGraph.value !== null ){
		operations.push( plot.setHiddenTraceGroups( topGraph.value, hiddenKeys ) )
	}

	if( bottomGraph.value !== null ){
		operations.push( plot.setHiddenTraceGroups( bottomGraph.value, hiddenKeys ) )
	}

	await Promise.all( operations )
}

const applySplitSpectrumLegendHighlight = async () => {
	const operations = []
	const highlightedKey = legendHoverEmphasisEnabled.value
		? normalizeLegendKey( hoveredSplitSpectrumLegendKey.value )
		: ""

	if( singleGraph.value !== null ){
		operations.push( plot.setHighlightedTraceGroup( singleGraph.value, highlightedKey ) )
	}

	if( topGraph.value !== null ){
		operations.push( plot.setHighlightedTraceGroup( topGraph.value, highlightedKey ) )
	}

	if( bottomGraph.value !== null ){
		operations.push( plot.setHighlightedTraceGroup( bottomGraph.value, highlightedKey ) )
	}

	await Promise.all( operations )
}

const waitForAnimationFrame = () => {
	return new Promise(( resolve ) => {
		requestAnimationFrame(() => resolve() )
	})
}

const syncUntouchedSplitPanePrimarySize = () => {
	if( usesSplitSpectrumLayout.value === false || splitPanePrimarySizeTouched.value ){
		return
	}

	const nextSize = defaultSplitPanePrimarySize()
	if( Number.isFinite( nextSize ) === false || nextSize <= 0 ){
		return
	}

	splitPanePrimarySize.value = nextSize
}

const prepareSplitPaneLayoutForRender = async ( options = {} ) => {
	if( usesSplitSpectrumLayout.value === false ){
		return
	}

	if( options?.forceDefault === true ){
		ensureSplitPanePrimarySize({ forceDefault: true })
	}

	await nextTick()
	await waitForAnimationFrame()
	syncUntouchedSplitPanePrimarySize()
	await nextTick()
}

const disconnectSpectraPaneResizeObserver = () => {
	if( spectraPaneContainerResizeObserver === null ){
		return
	}

	spectraPaneContainerResizeObserver.disconnect()
	spectraPaneContainerResizeObserver = null
}

const connectSpectraPaneResizeObserver = () => {
	disconnectSpectraPaneResizeObserver()

	if( usesSplitSpectrumLayout.value === false || spectraPaneContainer.value === null ){
		return
	}

	if( typeof ResizeObserver !== "function" ){
		return
	}

	spectraPaneContainerResizeObserver = new ResizeObserver(() => {
		syncUntouchedSplitPanePrimarySize()
		queueSpectraPaneResponsiveResize()
	})

	spectraPaneContainerResizeObserver.observe( spectraPaneContainer.value )
	syncUntouchedSplitPanePrimarySize()
}

const stopSpectraPaneResize = () => {

	if( spectraPaneResizeSession === null ){
		return
	}

	window.removeEventListener( "pointermove", spectraPaneResizeSession.onPointerMove )
	window.removeEventListener( "pointerup", spectraPaneResizeSession.onPointerUp )
	window.removeEventListener( "pointercancel", spectraPaneResizeSession.onPointerUp )

	spectraPaneResizeSession = null
}

const startSpectraPaneResize = ( event ) => {

	if( usesSplitSpectrumLayout.value === false ){
		return
	}

	stopSpectraPaneResize()

	const startHeight = ensureSplitPanePrimarySize()
	const startY = splitPaneIsVertical.value
		? Number( event.clientY )
		: Number( event.clientX )

	if( Number.isFinite( startY ) === false ){
		return
	}

	const onPointerMove = ( moveEvent ) => {

		const currentY = splitPaneIsVertical.value
			? Number( moveEvent.clientY )
			: Number( moveEvent.clientX )
		if( Number.isFinite( currentY ) === false ){
			return
		}

		splitPanePrimarySize.value = clampSplitPanePrimarySize( startHeight + ( currentY - startY ))
		queueSpectraPaneResponsiveResize()
	}

	const onPointerUp = () => {
		stopSpectraPaneResize()
		queueSpectraPaneResponsiveResize()
	}

	spectraPaneResizeSession = {
		onPointerMove,
		onPointerUp
	}

	splitPanePrimarySizeTouched.value = true

	window.addEventListener( "pointermove", onPointerMove )
	window.addEventListener( "pointerup", onPointerUp )
	window.addEventListener( "pointercancel", onPointerUp )

	event.preventDefault()
}

const renderSplitSpectrumLayout = async () => {

	if( topGraph.value === null || data.value === null || settings.value === null ){
		return
	}

	if( comparisonActive.value ){
		await plot.renderMeasurementComparisonPane(
			toRaw( data.value ),
			toRaw( comparison.value.data ),
			topGraph.value,
			settings.value
		)
	} else {
		await plot.renderMeasurementPane( toRaw( data.value ), topGraph.value, settings.value )
	}

	if( hasEstimate.value && bottomGraph.value !== null ){
		if( comparisonActive.value ){
			await plot.renderEstimateComparisonPane(
				toRaw( data.value ),
				toRaw( estimate.value ),
				toRaw( comparison.value.data ),
				toRaw( comparison.value.estimate ),
				bottomGraph.value,
				settings.value
			)
		} else {
			await plot.renderEstimatePane(
				toRaw( data.value ),
				toRaw( estimate.value ),
				bottomGraph.value,
				settings.value
			)
		}
	}

	await applySplitSpectrumLegendVisibility()
	await applySplitSpectrumLegendHighlight()
}

const renderSingleSpectrumLayout = async () => {

	if( singleGraph.value === null || data.value === null || settings.value === null ){
		return
	}

	if( comparisonActive.value && hasEstimate.value ){
		await plot.comparison(
			toRaw( data.value ),
			toRaw( estimate.value ),
			toRaw( comparison.value.data ),
			toRaw( comparison.value.estimate ),
			singleGraph.value,
			settings.value
		)
		return
	}

	await plot.initialize(
		toRaw( data.value ),
		hasEstimate.value ? toRaw( estimate.value ) : null,
		singleGraph.value,
		settings.value
	)

	await applySplitSpectrumLegendVisibility()
	await applySplitSpectrumLegendHighlight()
}

const renderSpectrumLayout = async () => {

	if( usesSplitSpectrumLayout.value ){
		await renderSplitSpectrumLayout()
	} else {
		await renderSingleSpectrumLayout()
	}

	queueSpectraPaneResponsiveResize()

	if( calibrating.value ){
		await syncCalibrationMarkers()
	}
}

const syncCalibrationMarkers = async () => {
	const operations = []

	if( usesSplitSpectrumLayout.value === false ){
		if( singleGraph.value !== null ){
			operations.push(
				calibrating.value
					? plot.showMarker( marker.value, singleGraph.value, settings.value )
					: plot.deleteMarker( singleGraph.value )
			)
		}

		await Promise.all( operations )
		return
	}

	if( topGraph.value !== null ){
		operations.push(
			calibrating.value
				? plot.showMarker( marker.value, topGraph.value, settings.value )
				: plot.deleteMarker( topGraph.value )
		)
	}

	if( bottomGraph.value !== null ){
		operations.push(
			calibrating.value
				? plot.showMarker( marker.value, bottomGraph.value, settings.value )
				: plot.deleteMarker( bottomGraph.value )
		)
	}

	await Promise.all( operations )
}

const handleWindowResize = () => {
	if( usesSplitSpectrumLayout.value ){
		if( splitPanePrimarySizeTouched.value ){
			splitPanePrimarySize.value = clampSplitPanePrimarySize( splitPanePrimarySize.value )
		}
	}

	queueSpectraPaneResponsiveResize()
}

const clearEstimatePollTimeout = () => {
	if( estimatePollTimeout !== null ){
		clearTimeout( estimatePollTimeout )
		estimatePollTimeout = null
	}
}

const projectEstimateItemSucceeded = ( status ) => {
	const items = Array.isArray( status?.items ) ? status.items : []
	const item = items.find(( candidate ) => String( candidate?.projectID ?? "" ) === String( project.value?.id ?? "" ))
	return item?.status === "SUCCEEDED"
}

const projectEstimateItemFailed = ( status ) => {
	const items = Array.isArray( status?.items ) ? status.items : []
	const item = items.find(( candidate ) => String( candidate?.projectID ?? "" ) === String( project.value?.id ?? "" ))
	return item?.status === "FAILED"
}

const loadEstimateIfAvailable = async () => {
	const loadedEstimate = await results.load( project.value, "estimate" )
	if( loadedEstimate instanceof Error ){
		return false
	}

	estimate.value = loadedEstimate
	await nextTick()
	await renderSpectrumLayout()
	return true
}

const pollEstimateJobStatus = async () => {
	clearEstimatePollTimeout()

	const jobId = projectEstimateJobId.value
	if( jobId.length === 0 || hasEstimate.value ){
		return
	}

	try{
		const status = await projectlib.singleSpectrumEstimateJobStatus( jobId )
		estimateJobStatus.value = status
		project.value = await projectlib.updateSingleSpectrumEstimateState( project.value, status )

		if( projectEstimateItemSucceeded( status )){
			const loaded = await loadEstimateIfAvailable()
			if( loaded ){
				return
			}

			estimatePollTimeout = setTimeout(() => {
				void pollEstimateJobStatus()
			}, 5000 )
			return
		}

		if( projectEstimateItemFailed( status )){
			estimateJobError.value = String( activeEstimateItem.value?.errorMessage ?? status?.errorMessage ?? "Estimate job failed." )
			return
		}

		if( estimateTerminalStatuses.has( String( status?.status ?? "" )) === false ){
			estimatePollTimeout = setTimeout(() => {
				void pollEstimateJobStatus()
			}, 5000 )
		}
	} catch( error ){
		console.log( error )
		estimatePollTimeout = setTimeout(() => {
			void pollEstimateJobStatus()
		}, 10000 )
	}
}

watch( comparisonProjectID, async () => {

	if( hasEstimate.value === false ){
		return
	}

	if( comparisonProjectID.value === "" || comparisonProjectID.value === project.value.id ){
		comparison.value.data = null
		comparison.value.estimate = null
		await nextTick()
		await renderSpectrumLayout()
		return
	}

	const comparisonProject = projects.value[ comparisonProjectID.value ];

	if( comparisonProject === undefined ){
		comparisonProjectID.value = project.value.id
		return
	}
        
	comparison.value.data = await results.load( comparisonProject, "data")
	comparison.value.estimate = await results.load( comparisonProject, "estimate")
	comparison.value.data.calibration = await results.load( comparisonProject, "calibration")

	if( comparison.value.estimate instanceof Error ){
		comparison.value.data = null
		comparison.value.estimate = null
		comparisonProjectID.value = project.value.id
		return
	}
	
	await nextTick()
	await renderSpectrumLayout()

})

const debouncedRenderSpectrumLayout = debounce(() => {
	void renderSpectrumLayout()
}, 25)

watch( calibration, async () => {
        if( calibrating.value === false ) return;
        debouncedRenderSpectrumLayout()
    }, 
{ deep: true })

watch( activeSplitSpectrumHiddenLegendKeys, async () => {
	await applySplitSpectrumLegendVisibility()
}, { flush: "post" })

watch( hoveredSplitSpectrumLegendKey, async () => {
	await applySplitSpectrumLegendHighlight()
}, { flush: "post" })

watch( legendHoverEmphasisEnabled, async () => {
	await applySplitSpectrumLegendHighlight()
}, { flush: "post" })

watch( splitSpectrumLegendEntries, ( entries ) => {
	const currentKey = normalizeLegendKey( hoveredSplitSpectrumLegendKey.value )
	if( currentKey.length === 0 ){
		return
	}

	const hasCurrentEntry = Array.isArray( entries ) && entries.some(( entry ) => entry?.key === currentKey )
	if( hasCurrentEntry === false ){
		hoveredSplitSpectrumLegendKey.value = ""
	}
}, { flush: "post" })

watch( spectrumLayoutMode, async ( nextMode, previousMode ) => {
	if( previousMode === undefined || nextMode === previousMode ){
		return
	}

	stopSpectraPaneResize()
	hoveredSplitSpectrumLegendKey.value = ""

	await nextTick()
	connectSpectraPaneResizeObserver()
	await prepareSplitPaneLayoutForRender({ forceDefault: true })
	await renderSpectrumLayout()
})

watch( [marker, calibrating], async () => {
	await syncCalibrationMarkers()
},{ deep: true })

onMounted( async () => {

    try{

        var savedSettings = await settingslib.get()

        settings.value = savedSettings;
		seedSplitSpectrumLegendVisibility()
        projects.value = await projectlib.list();
        project.value = projects.value[ projectID ];

		data.value = await results.load( project.value, "data");
		estimate.value = await results.load( project.value, "estimate");
		data.value.calibration = await results.load( project.value, "calibration");

		calibration.value = data.value.calibration;

        const minX = Math.min( ...data.value.x ) + data.value.calibration.x;
        const maxX = Math.max( ...data.value.x ) + data.value.calibration.x;

        marker.value.x = ( minX + maxX ) / 2;
        calibrationStep.value = ( maxX - minX ) / 1000;

        await nextTick()
		window.addEventListener( "resize", handleWindowResize )
		connectSpectraPaneResizeObserver()
		await prepareSplitPaneLayoutForRender()
        await renderSpectrumLayout()

		if( hasEstimate.value === false && projectEstimateJobId.value.length > 0 ){
			void pollEstimateJobStatus()
		}

    } catch( error ){
		console.log( error )
        navigation.route("Main menu", {})
    }

    emit("loaded")
})

onBeforeUnmount(() => {
	clearEstimatePollTimeout()
	stopSpectraPaneResize()
	disconnectSpectraPaneResizeObserver()
	window.removeEventListener( "resize", handleWindowResize )
	if( spectraPaneResizeFrame !== null ){
		cancelAnimationFrame( spectraPaneResizeFrame )
		spectraPaneResizeFrame = null
	}
})

</script>
