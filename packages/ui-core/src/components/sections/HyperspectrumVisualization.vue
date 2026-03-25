<template>
<div class="prose prose-gray max-w-none">

	<div class="border-2 border-brand rounded-lg p-4 mb-8 shadow-black shadow-lg">
		<p>
			<strong>Hyperspectrum Visualization Settings</strong> control how hyperspectral image views and spectra
			are displayed. These options cover axis labels, unit display, scalar heatmap colormaps, UMAP channel colors, PCA component
			colors, queried-spectrum styling, uncertainty display, and orientation for the image views and spectral side plots.
		</p>
	</div>

	<div class="border-2 border-brand rounded-lg p-4 mb-8 shadow-black shadow-lg">

		<LatexField description = "Horizontal axis label" v-model = "labels.horizontal"></LatexField>
		<LatexField description = "Vertical axis label" v-model = "labels.vertical" class = "mt-4"></LatexField>
		<LatexField description = "Spectral axis label" v-model = "labels.spectral" class = "mt-4"></LatexField>

		<div class="flex items-center gap-3 rounded-lg border-2 border-brand bg-black/5 p-4 shadow-sm mt-4">
			<input id = "show-units"
				   v-model = "labels.showUnits"
				   type = "checkbox"
				   class = "h-4 w-4 rounded border-gray-300 accent-brand focus:ring-brand"/>
			<label for = "show-units" class = "font-semibold text-black cursor-pointer">
				Show physical units after axis labels
			</label>
		</div>

		<hr class="h-0.5 bg-gray border-0 my-4">

		<div class="flex flex-col gap-2 rounded-lg border-2 border-brand bg-black/5 p-4 shadow-sm">
			<h4 class="font-semibold text-black">Reverse spectral axis</h4>
			<select v-model = "layout.leftPlotsReversed"
					class="w-full border border-gray-600 rounded px-3 py-2 mt-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-brand">
				<option value = "false">False</option>
				<option value = "true">True</option>
			</select>
		</div>

		<div class="flex flex-col gap-2 rounded-lg border-2 border-brand bg-black/5 p-4 shadow-sm mt-4">
			<h4 class="font-semibold text-black">Heatmap and image origin</h4>
			<select v-model = "layout.heatmapOrigin"
					class="w-full border border-gray-600 rounded px-3 py-2 mt-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-brand">
				<option value = "top-left">Top left</option>
				<option value = "bottom-left">Bottom left</option>
			</select>
		</div>

		<hr class="h-0.5 bg-gray border-0 my-4">

		<div class="flex flex-col gap-2 rounded-lg border-2 border-brand bg-black/5 p-4 shadow-sm">
			<h4 class="font-semibold text-black">MIP colormap</h4>
			<select v-model = "colormaps.mip"
					class="w-full border border-gray-600 rounded px-3 py-2 mt-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-brand">
				<option v-for = "scale in colorscales" :key = "'mip-' + scale" :value = "scale">
					{{ scale }}
				</option>
			</select>
		</div>

		<div class="flex flex-col gap-2 rounded-lg border-2 border-brand bg-black/5 p-4 shadow-sm mt-4">
			<h4 class="font-semibold text-black">Layer colormap</h4>
			<select v-model = "colormaps.layer"
					class="w-full border border-gray-600 rounded px-3 py-2 mt-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-brand">
				<option v-for = "scale in colorscales" :key = "'layer-' + scale" :value = "scale">
					{{ scale }}
				</option>
			</select>
		</div>

		<hr class="h-0.5 bg-gray border-0 my-4">

		<div class="flex flex-col gap-2 rounded-lg border-2 border-brand bg-black/5 p-4 shadow-sm">
			<h4 class="font-semibold text-black">UMAP channel colors</h4>
			<div class="grid grid-cols-1 gap-4 mt-2">
				<ColorPicker v-model = "umapChannelColors.r"
							 description = "UMAP red channel color">
				</ColorPicker>
				<ColorPicker v-model = "umapChannelColors.g"
							 description = "UMAP green channel color">
				</ColorPicker>
				<ColorPicker v-model = "umapChannelColors.b"
							 description = "UMAP blue channel color">
				</ColorPicker>
			</div>
		</div>

		<hr class="h-0.5 bg-gray border-0 my-4">

		<div class="flex flex-col gap-2 rounded-lg border-2 border-brand bg-black/5 p-4 shadow-sm">
			<h4 class="font-semibold text-black">Z-blend channel palette</h4>
			<p class="text-sm text-black/70 mt-1">
				These colors are assigned automatically to z-blend channels in order.
			</p>
			<div class="grid grid-cols-1 gap-4 mt-2">
				<ColorPicker v-for = "( color, index ) in zBlendPalette"
							 :key = "'z-blend-palette-' + index"
							 v-model = "zBlendPalette[index]"
							 :description = "'Z-blend color ' + ( index + 1 )">
				</ColorPicker>
			</div>
		</div>

		<hr class="h-0.5 bg-gray border-0 my-4">

		<ColorPicker v-model = "spectrumColors.queriedSpectrum"
					 description = "Queried spectrum color">
		</ColorPicker>

		<div class="rounded-lg border-2 border-brand bg-black/5 p-4 shadow-sm mt-4">
			<h4 class="font-semibold text-black">Uncertainty interval</h4>

			<div class="flex flex-col gap-2 mt-3">
				<label class="font-semibold text-black">Interval color</label>
				<div class="flex items-center gap-3">
					<input
						type = "color"
						v-model = "spectrumColors.queriedInterval"
						class = "h-10 w-10 cursor-pointer rounded-md border border-gray-300 bg-transparent p-0"
					/>
					<input
						type = "text"
						v-model = "spectrumColors.queriedInterval"
						class = "flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
					/>
					<div
						class = "h-10 w-10 rounded-md border border-gray-300"
						:style = "{ backgroundColor: spectrumColors.queriedInterval }"
					/>
				</div>
			</div>

			<div class="flex items-center gap-3 mt-4">
				<input id = "show-interval"
					   v-model = "spectrumOptions.showInterval"
					   type = "checkbox"
					   class = "h-4 w-4 rounded border-gray-300 accent-brand focus:ring-brand"/>
				<label for = "show-interval" class = "font-semibold text-black cursor-pointer">
					Show uncertainty interval
				</label>
			</div>

			<div class="flex flex-col gap-2 mt-4">
				<label class="font-semibold text-black">Interval opacity</label>
				<input v-model.number = "spectrumOptions.intervalOpacity"
					   class="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
					   type = "number"
					   min = "0"
					   max = "1"
					   step = "0.01"/>
			</div>
		</div>

		<hr class="h-0.5 bg-gray border-0 my-4">

		<div class="rounded-lg border-2 border-brand bg-black/5 p-4 shadow-sm">
			<h4 class="font-semibold text-black">ROI comparison plot</h4>

			<ColorPicker v-model = "roiColors.roiSpectrum"
						 description = "ROI spectrum color"
						 class = "mt-3">
			</ColorPicker>

			<div class="flex flex-col gap-2 mt-4">
				<label class="font-semibold text-black">ROI interval color</label>
				<div class="flex items-center gap-3">
					<input
						type = "color"
						v-model = "roiColors.roiInterval"
						class = "h-10 w-10 cursor-pointer rounded-md border border-gray-300 bg-transparent p-0"
					/>
					<input
						type = "text"
						v-model = "roiColors.roiInterval"
						class = "flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
					/>
					<div
						class = "h-10 w-10 rounded-md border border-gray-300"
						:style = "{ backgroundColor: roiColors.roiInterval }"
					/>
				</div>
			</div>

			<div class="flex items-center gap-3 mt-4">
				<input id = "show-roi-interval"
					   v-model = "roiOptions.showInterval"
					   type = "checkbox"
					   class = "h-4 w-4 rounded border-gray-300 accent-brand focus:ring-brand"/>
				<label for = "show-roi-interval" class = "font-semibold text-black cursor-pointer">
					Show ROI uncertainty interval
				</label>
			</div>

			<div class="flex flex-col gap-2 mt-4">
				<label class="font-semibold text-black">ROI interval opacity</label>
				<input v-model.number = "roiOptions.intervalOpacity"
					   class="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
					   type = "number"
					   min = "0"
					   max = "1"
					   step = "0.01"/>
			</div>
		</div>

		<div class="rounded-lg border-2 border-brand bg-black/5 p-4 shadow-sm mt-4">
			<h4 class="font-semibold text-black">ROI overlay</h4>

			<ColorPicker v-model = "roiColors.roiBox"
						 description = "ROI box color"
						 class = "mt-3">
			</ColorPicker>

			<ColorPicker v-model = "roiColors.roiTitle"
						 description = "ROI title color"
						 class = "mt-3">
			</ColorPicker>

			<ColorPicker v-model = "roiColors.selectionBox"
						 description = "Current selection box color"
						 class = "mt-3">
			</ColorPicker>

			<div class="flex flex-col gap-2 mt-4">
				<label class="font-semibold text-black">ROI overlay opacity</label>
				<input v-model.number = "roiOptions.overlayOpacity"
					   class="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
					   type = "number"
					   min = "0"
					   max = "1"
					   step = "0.01"/>
			</div>
		</div>

		<div class="rounded-lg border-2 border-brand bg-black/5 p-4 shadow-sm mt-4">
			<h4 class="font-semibold text-black">Hyperspectrum viewer defaults</h4>
			<p class="text-sm text-black/70 mt-1">
				These defaults are applied when you open a hyperspectrum project.
			</p>

			<div class="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
				<div class="flex flex-col gap-2">
					<label class="font-semibold text-black">Display mode</label>
					<select v-model = "viewerDefaults.displayMode"
							class="w-full border border-gray-600 rounded px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-brand">
						<option value = "mip">MIP</option>
						<option value = "mip_hsv">HSV-mapped MIP</option>
						<option value = "umap">UMAP</option>
						<option value = "layer">Layer</option>
						<option value = "z_blend">Z-blend</option>
						<option value = "pca">PCA classification</option>
						<option value = "pca_mip">PCA MIP</option>
						<option value = "pca_rgb">PCA RGB</option>
						<option value = "rpca">RPCA classification</option>
						<option value = "rpca_mip">RPCA MIP</option>
						<option value = "rpca_rgb">RPCA RGB</option>
					</select>
				</div>

				<div class="flex flex-col gap-2">
					<label class="font-semibold text-black">Heatmap interaction</label>
					<select v-model = "viewerDefaults.heatmapInteraction"
							class="w-full border border-gray-600 rounded px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-brand">
						<option value = "select">Select spectra</option>
						<option value = "zoom">Zoom</option>
					</select>
				</div>

				<div class="flex flex-col gap-2">
					<label class="font-semibold text-black">Zoom aspect ratio</label>
					<select v-model = "viewerDefaults.heatmapZoomAspectRatio"
							class="w-full border border-gray-600 rounded px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-brand">
						<option value = "square">Lock square</option>
						<option value = "free">Free</option>
					</select>
				</div>

				<div class="flex flex-col gap-2">
					<label class="font-semibold text-black">Selection confidence level</label>
					<select v-model = "viewerDefaults.selectionConfidenceLevel"
							class="w-full border border-gray-600 rounded px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-brand">
						<option value = "none">No uncertainty</option>
						<option value = "50">50%</option>
						<option value = "75">75%</option>
						<option value = "90">90%</option>
						<option value = "95">95%</option>
					</select>
				</div>

				<div class="flex flex-col gap-2">
					<label class="font-semibold text-black">Loadings</label>
					<select v-model = "viewerDefaults.loadings"
							class="w-full border border-gray-600 rounded px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-brand">
						<option value = "hide">Hide</option>
						<option value = "show">Show</option>
					</select>
				</div>

				<div class="flex flex-col gap-2">
					<label class="font-semibold text-black">False-coloring basis</label>
					<select v-model = "viewerDefaults.falseColoringBasis"
							class="w-full border border-gray-600 rounded px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-brand">
						<option value = "measurement">Measurements</option>
						<option value = "raman">Estimated Raman spectra</option>
					</select>
					<p class="text-xs text-black/60">
						If Raman coloring is not available yet, measurements are used automatically.
					</p>
				</div>

				<div class="flex flex-col gap-2">
					<label class="font-semibold text-black">Estimate ROI uncertainty</label>
					<select v-model = "viewerDefaults.roiEstimateUncertainty"
							class="w-full border border-gray-600 rounded px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-brand">
						<option value = "show">Show</option>
						<option value = "hide">Hide</option>
					</select>
				</div>
			</div>

			<div class="mt-6 rounded-lg border border-brand/60 bg-white/40 p-4">
				<h5 class="font-semibold text-black">Prioritization</h5>
				<p class="text-sm text-black/70 mt-1">
					Choose which visualizations should be prepared earlier after the starting view.
				</p>

				<div class="grid grid-cols-1 gap-3 mt-4 md:grid-cols-2">
					<label v-for = "entry in prioritizationEntries"
						   :key = "'prioritization-' + entry.key"
						   class = "flex items-center gap-3 rounded-lg border border-brand/40 bg-black/5 px-3 py-2 text-sm text-black shadow-sm">
						<input v-model = "prioritization[entry.key]"
							   type = "checkbox"
							   class = "h-4 w-4 rounded border-gray-300 accent-brand focus:ring-brand"/>
						<span>{{ entry.label }}</span>
					</label>
				</div>
			</div>
		</div>

		<hr class="h-0.5 bg-gray border-0 my-4">

		<div class="flex flex-col gap-2 rounded-lg border-2 border-brand bg-black/5 p-4 shadow-sm">
			<h4 class="font-semibold text-black">PCA component colors</h4>
			<div class="grid grid-cols-1 gap-4 mt-2">
				<ColorPicker v-for = "entry in pcaColorEntries"
							 :key = "entry.componentIndex"
							 v-model = "pcaComponentColors[entry.componentIndex]"
							 :description = "entry.label + ' color'">
				</ColorPicker>
			</div>
		</div>

		<hr class="h-0.5 bg-gray border-0 my-4">

		<div class="flex flex-col gap-2 rounded-lg border-2 border-brand bg-black/5 p-4 shadow-sm mt-4">
			<h4 class="font-semibold text-black">Axis tick font size</h4>
			<input v-model.number = "fontSizes.axis"
				   class="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
				   type = "number"
				   min = "8"
				   max = "72"
				   step = "1"/>
		</div>

		<div class="flex flex-col gap-2 rounded-lg border-2 border-brand bg-black/5 p-4 shadow-sm mt-4">
			<h4 class="font-semibold text-black">Axis label font size</h4>
			<input v-model.number = "fontSizes.label"
				   class="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
				   type = "number"
				   min = "8"
				   max = "72"
				   step = "1"/>
		</div>

		<SettingsButton @click = "updateSettings" :loading = "updating" class = "mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
			Update visualization settings
		</SettingsButton>

		<SettingsButton @click = "resetSettings"
						:loading = "updating"
						class = "mt-2 ml-4 disabled:opacity-50 disabled:cursor-not-allowed">
			Reset to default settings
		</SettingsButton>

	</div>

</div>
</template>

<script setup>

import { reactive, ref, onMounted } from "vue"
import { settings as settingslib, utils } from "@harkana/tools"

import SettingsButton from "../settings/SettingsButton.vue"
import LatexField from "../settings/LatexField.vue"
import ColorPicker from "../settings/ColorPicker.vue"

const colorscales = [
	"Blackbody",
	"Bluered",
	"Blues",
	"Cividis",
	"Earth",
	"Electric",
	"Greens",
	"Greys",
	"Hot",
	"Jet",
	"Picnic",
	"Portland",
	"Rainbow",
	"RdBu",
	"Reds",
	"Viridis",
	"YlGnBu",
	"YlOrRd"
]

const PCA_DEFAULT_COLORS = {
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

const HYPERSPECTRUM_DISPLAY_MODES = new Set([
	"mip",
	"mip_hsv",
	"umap",
	"layer",
	"z_blend",
	"pca",
	"pca_mip",
	"pca_rgb",
	"rpca",
	"rpca_mip",
	"rpca_rgb"
])

const pcaColorEntries = Array.from({ length: 10 }, (_, index ) => {
	const componentIndex = index + 1
	return {
		componentIndex,
		label: "PC" + String( componentIndex ).padStart( 2, "0" )
	}
})

const updating = ref( false )

const layout = reactive({
	leftPlotsReversed: "false",
	heatmapOrigin: "bottom-left"
})

const labels = reactive({
	horizontal: "x",
	vertical: "y",
	spectral: "\\nu",
	showUnits: true
})

const colormaps = reactive({
	mip: "Viridis",
	layer: "Viridis"
})

const spectrumColors = reactive({
	queriedSpectrum: "#1f77b4",
	queriedInterval: "#1f77b4"
})

const umapChannelColors = reactive({
	r: "#ff0000",
	g: "#00ff00",
	b: "#0000ff"
})

const DEFAULT_Z_BLEND_PALETTE = [
	"#0000ff",
	"#00ff00",
	"#ff00ff",
	"#ffff00",
	"#00ffff",
	"#ff0000",
	"#0000ff",
	"#00ff00",
	"#ff00ff",
	"#ffff00"
]
const DEFAULT_HYPERSPECTRUM_PRIORITIZATION = {
	mip: true,
	mip_hsv: true,
	umap: true,
	z_blend: false,
	layer_window: true,
	pca: false,
	pca_mip: false,
	pca_rgb: false,
	rpca: false,
	rpca_mip: false,
	rpca_rgb: false
}
const prioritizationEntries = [
	{ key: "mip", label: "MIP" },
	{ key: "mip_hsv", label: "HSV-mapped MIP" },
	{ key: "umap", label: "UMAP" },
	{ key: "z_blend", label: "Z-blend" },
	{ key: "layer_window", label: "Layer neighborhood" },
	{ key: "pca", label: "PCA classification" },
	{ key: "pca_mip", label: "PCA MIP" },
	{ key: "pca_rgb", label: "PCA RGB" },
	{ key: "rpca", label: "RPCA classification" },
	{ key: "rpca_mip", label: "RPCA MIP" },
	{ key: "rpca_rgb", label: "RPCA RGB" }
]

const zBlendPalette = reactive([ ...DEFAULT_Z_BLEND_PALETTE ])

const roiColors = reactive({
	roiSpectrum: "#333333",
	roiInterval: "#333333",
	roiBox: "#ffffff",
	roiTitle: "#ffffff",
	selectionBox: "#9ca3af"
})

const spectrumOptions = reactive({
	intervalOpacity: 0.25,
	showInterval: true
})

const roiOptions = reactive({
	showInterval: true,
	intervalOpacity: 0.25,
	overlayOpacity: 0.25
})

const viewerDefaults = reactive({
	displayMode: "umap",
	heatmapInteraction: "select",
	heatmapRenderer: "deckgl",
	heatmapZoomAspectRatio: "square",
	selectionConfidenceLevel: "95",
	loadings: "hide",
	falseColoringBasis: "measurement",
	roiEstimateUncertainty: "show"
})
const prioritization = reactive({ ...DEFAULT_HYPERSPECTRUM_PRIORITIZATION })

const fontSizes = reactive({
	axis: 16,
	label: 16
})

const pcaComponentColors = reactive({ ...PCA_DEFAULT_COLORS })

const normalizeCheckbox = ( value, fallback = true ) => {

	if( typeof value === "boolean" ){
		return value
	}

	if( typeof value === "string" ){
		if( value === "false" ) return false
		if( value === "true" ) return true
	}

	return fallback
}

const normalizeOpacity = ( value, fallback = 0.25 ) => {

	const numeric = Number( value )
	if( Number.isFinite( numeric ) === false ){
		return fallback
	}

	return Math.min( 1, Math.max( 0, numeric ))
}

const normalizeDisplayMode = ( value ) => {
	const normalized = String( value ?? "" ).trim()
	return HYPERSPECTRUM_DISPLAY_MODES.has( normalized ) ? normalized : "umap"
}

const normalizeHeatmapInteraction = ( value ) => {
	return String( value ?? "" ).trim().toLowerCase() === "zoom" ? "zoom" : "select"
}

const normalizeHeatmapRenderer = () => "deckgl"

const normalizeHeatmapZoomAspectRatio = ( value ) => {
	return String( value ?? "" ).trim().toLowerCase() === "free" ? "free" : "square"
}

const normalizeSelectionConfidenceLevel = ( value ) => {

	if( String( value ?? "" ).trim().toLowerCase() === "none" ){
		return "none"
	}

	const numeric = Number.parseInt( value, 10 )
	if([ 50, 75, 90, 95 ].includes( numeric )){
		return String( numeric )
	}

	return "95"
}

const normalizeShowHide = ( value, fallback = "hide" ) => {
	const normalized = String( value ?? "" ).trim().toLowerCase()
	if( normalized === "show" || normalized === "hide" ){
		return normalized
	}
	return fallback === "show" ? "show" : "hide"
}

const normalizeFalseColoringBasis = ( value ) => {
	return String( value ?? "" ).trim().toLowerCase() === "raman" ? "raman" : "measurement"
}

const normalizeZBlendPalette = ( value ) => {
	const source = Array.isArray( value ) ? value : []
	const resolvedPalette = source
		.map(( entry ) => String( entry ?? "" ).trim() )
		.filter(( entry ) => entry.length > 0 )
		.slice( 0, DEFAULT_Z_BLEND_PALETTE.length )

	while( resolvedPalette.length < DEFAULT_Z_BLEND_PALETTE.length ){
		resolvedPalette.push( DEFAULT_Z_BLEND_PALETTE[resolvedPalette.length] )
	}

	return resolvedPalette
}

const normalizePrioritization = ( value ) => {

	const source = value !== null && typeof value === "object" ? value : {}
	const normalized = { ...DEFAULT_HYPERSPECTRUM_PRIORITIZATION }

	for( const key of Object.keys( DEFAULT_HYPERSPECTRUM_PRIORITIZATION ) ){
		normalized[key] = normalizeCheckbox(
			source[key],
			DEFAULT_HYPERSPECTRUM_PRIORITIZATION[key]
		)
	}

	return normalized
}

const syncFromSettings = ( savedSettings ) => {

	layout.leftPlotsReversed = savedSettings?.layout?.leftPlotsReversed === "true" ? "true" : "false"
	layout.heatmapOrigin = savedSettings?.layout?.heatmapOrigin === "top-left" ? "top-left" : "bottom-left"

	labels.horizontal = typeof savedSettings?.labels?.horizontal === "string" ? savedSettings.labels.horizontal : "x"
	labels.vertical = typeof savedSettings?.labels?.vertical === "string" ? savedSettings.labels.vertical : "y"
	labels.spectral = typeof savedSettings?.labels?.spectral === "string" ? savedSettings.labels.spectral : "\\nu"
	labels.showUnits = normalizeCheckbox( savedSettings?.labels?.showUnits, true )

	colormaps.mip = typeof savedSettings?.colormaps?.mip === "string" && savedSettings.colormaps.mip.length > 0
		? savedSettings.colormaps.mip
		: "Viridis"
	colormaps.layer = typeof savedSettings?.colormaps?.layer === "string" && savedSettings.colormaps.layer.length > 0
		? savedSettings.colormaps.layer
		: "Viridis"

	spectrumColors.queriedSpectrum =
		typeof savedSettings?.hyperspectrumColors?.queriedSpectrum === "string" && savedSettings.hyperspectrumColors.queriedSpectrum.length > 0
			? savedSettings.hyperspectrumColors.queriedSpectrum
			: "#1f77b4"
	spectrumColors.queriedInterval =
		typeof savedSettings?.hyperspectrumColors?.queriedInterval === "string" && savedSettings.hyperspectrumColors.queriedInterval.length > 0
			? savedSettings.hyperspectrumColors.queriedInterval
			: "#1f77b4"
	roiColors.roiSpectrum =
		typeof savedSettings?.hyperspectrumColors?.roiSpectrum === "string" && savedSettings.hyperspectrumColors.roiSpectrum.length > 0
			? savedSettings.hyperspectrumColors.roiSpectrum
			: "#333333"
	roiColors.roiInterval =
		typeof savedSettings?.hyperspectrumColors?.roiInterval === "string" && savedSettings.hyperspectrumColors.roiInterval.length > 0
			? savedSettings.hyperspectrumColors.roiInterval
			: "#333333"
	roiColors.roiBox =
		typeof savedSettings?.hyperspectrumColors?.roiBox === "string" && savedSettings.hyperspectrumColors.roiBox.length > 0
			? savedSettings.hyperspectrumColors.roiBox
			: (
				typeof savedSettings?.hyperspectrumColors?.roiOverlay === "string" && savedSettings.hyperspectrumColors.roiOverlay.length > 0
					? savedSettings.hyperspectrumColors.roiOverlay
					: "#ffffff"
			)
	roiColors.roiTitle =
		typeof savedSettings?.hyperspectrumColors?.roiTitle === "string" && savedSettings.hyperspectrumColors.roiTitle.length > 0
			? savedSettings.hyperspectrumColors.roiTitle
			: (
				typeof savedSettings?.hyperspectrumColors?.roiOverlay === "string" && savedSettings.hyperspectrumColors.roiOverlay.length > 0
					? savedSettings.hyperspectrumColors.roiOverlay
					: "#ffffff"
			)
	roiColors.selectionBox =
		typeof savedSettings?.hyperspectrumColors?.selectionBox === "string" && savedSettings.hyperspectrumColors.selectionBox.length > 0
			? savedSettings.hyperspectrumColors.selectionBox
			: "#9ca3af"

	umapChannelColors.r =
		typeof savedSettings?.hyperspectrumColors?.umapChannels?.r === "string" && savedSettings.hyperspectrumColors.umapChannels.r.length > 0
			? savedSettings.hyperspectrumColors.umapChannels.r
			: "#ff0000"
	umapChannelColors.g =
		typeof savedSettings?.hyperspectrumColors?.umapChannels?.g === "string" && savedSettings.hyperspectrumColors.umapChannels.g.length > 0
			? savedSettings.hyperspectrumColors.umapChannels.g
			: "#00ff00"
	umapChannelColors.b =
		typeof savedSettings?.hyperspectrumColors?.umapChannels?.b === "string" && savedSettings.hyperspectrumColors.umapChannels.b.length > 0
			? savedSettings.hyperspectrumColors.umapChannels.b
			: "#0000ff"
	const normalizedZBlendPalette = normalizeZBlendPalette(
		savedSettings?.hyperspectrumColors?.zBlendPalette
	)
	for( let index = 0; index < DEFAULT_Z_BLEND_PALETTE.length; index++ ){
		zBlendPalette[index] = normalizedZBlendPalette[index]
	}

	spectrumOptions.intervalOpacity = normalizeOpacity(
		savedSettings?.hyperspectrumSpectrum?.intervalOpacity,
		0.25
	)
	spectrumOptions.showInterval = normalizeCheckbox(
		savedSettings?.hyperspectrumSpectrum?.showInterval,
		true
	)

	roiOptions.showInterval = normalizeCheckbox(
		savedSettings?.hyperspectrumRoi?.showInterval,
		true
	)
	roiOptions.intervalOpacity = normalizeOpacity(
		savedSettings?.hyperspectrumRoi?.intervalOpacity,
		0.25
	)
	roiOptions.overlayOpacity = normalizeOpacity(
		savedSettings?.hyperspectrumRoi?.overlayOpacity,
		0.25
	)

	viewerDefaults.displayMode = normalizeDisplayMode(
		savedSettings?.hyperspectrumDefaults?.displayMode
	)
	viewerDefaults.heatmapInteraction = normalizeHeatmapInteraction(
		savedSettings?.hyperspectrumDefaults?.heatmapInteraction
	)
	viewerDefaults.heatmapRenderer = normalizeHeatmapRenderer(
		savedSettings?.hyperspectrumDefaults?.heatmapRenderer
	)
	viewerDefaults.heatmapZoomAspectRatio = normalizeHeatmapZoomAspectRatio(
		savedSettings?.hyperspectrumDefaults?.heatmapZoomAspectRatio
	)
	viewerDefaults.selectionConfidenceLevel = normalizeSelectionConfidenceLevel(
		savedSettings?.hyperspectrumDefaults?.selectionConfidenceLevel
	)
	viewerDefaults.loadings = normalizeShowHide(
		savedSettings?.hyperspectrumDefaults?.loadings,
		"hide"
	)
	viewerDefaults.falseColoringBasis = normalizeFalseColoringBasis(
		savedSettings?.hyperspectrumDefaults?.falseColoringBasis
	)
	viewerDefaults.roiEstimateUncertainty = normalizeShowHide(
		savedSettings?.hyperspectrumDefaults?.roiEstimateUncertainty,
		"show"
	)
	const normalizedPrioritization = normalizePrioritization(
		savedSettings?.hyperspectrumPrioritization
	)
	for( const key of Object.keys( DEFAULT_HYPERSPECTRUM_PRIORITIZATION ) ){
		prioritization[key] = normalizedPrioritization[key]
	}

	fontSizes.axis = Number.isFinite( Number( savedSettings?.font?.sizes?.axis ))
		? Number( savedSettings.font.sizes.axis )
		: 16
	fontSizes.label = Number.isFinite( Number( savedSettings?.font?.sizes?.label ))
		? Number( savedSettings.font.sizes.label )
		: 16

	for( const entry of pcaColorEntries ){
		const componentIndex = entry.componentIndex
		const savedColor = savedSettings?.hyperspectrumColors?.pcaComponents?.[componentIndex]

		pcaComponentColors[componentIndex] = typeof savedColor === "string" && savedColor.length > 0
			? savedColor
			: PCA_DEFAULT_COLORS[componentIndex]
	}
}

const updateSettings = async () => {

	updating.value = true

	const savedSettings = await settingslib.get()

	savedSettings.layout = {
		...( savedSettings.layout ?? {} ),
		leftPlotsReversed: layout.leftPlotsReversed,
		heatmapOrigin: layout.heatmapOrigin
	}

	savedSettings.labels = {
		...( savedSettings.labels ?? {} ),
		horizontal: labels.horizontal,
		vertical: labels.vertical,
		spectral: labels.spectral,
		showUnits: labels.showUnits
	}

	savedSettings.font = {
		...( savedSettings.font ?? {} ),
		sizes: {
			...( savedSettings.font?.sizes ?? {} ),
			axis: Number( fontSizes.axis ) || 16,
			label: Number( fontSizes.label ) || 16
		}
	}

	savedSettings.colormaps = {
		...( savedSettings.colormaps ?? {} ),
		mip: colormaps.mip,
		layer: colormaps.layer
	}

	savedSettings.hyperspectrumColors = {
		...( savedSettings.hyperspectrumColors ?? {} ),
		queriedSpectrum: spectrumColors.queriedSpectrum,
		queriedInterval: spectrumColors.queriedInterval,
		roiSpectrum: roiColors.roiSpectrum,
		roiInterval: roiColors.roiInterval,
		roiBox: roiColors.roiBox,
		roiTitle: roiColors.roiTitle,
		selectionBox: roiColors.selectionBox,
		roiOverlay: roiColors.roiBox,
		umapChannels: {
			...( savedSettings.hyperspectrumColors?.umapChannels ?? {} ),
			r: umapChannelColors.r,
			g: umapChannelColors.g,
			b: umapChannelColors.b
		},
		zBlendPalette: normalizeZBlendPalette( zBlendPalette ),
		pcaComponents: {
			...( savedSettings.hyperspectrumColors?.pcaComponents ?? {} )
		}
	}

	savedSettings.hyperspectrumSpectrum = {
		...( savedSettings.hyperspectrumSpectrum ?? {} ),
		showInterval: spectrumOptions.showInterval,
		intervalOpacity: normalizeOpacity( spectrumOptions.intervalOpacity, 0.25 )
	}

	spectrumOptions.intervalOpacity = normalizeOpacity( spectrumOptions.intervalOpacity, 0.25 )

	savedSettings.hyperspectrumRoi = {
		...( savedSettings.hyperspectrumRoi ?? {} ),
		showInterval: roiOptions.showInterval,
		intervalOpacity: normalizeOpacity( roiOptions.intervalOpacity, 0.25 ),
		overlayOpacity: normalizeOpacity( roiOptions.overlayOpacity, 0.25 )
	}

	savedSettings.hyperspectrumDefaults = {
		...( savedSettings.hyperspectrumDefaults ?? {} ),
		displayMode: normalizeDisplayMode( viewerDefaults.displayMode ),
		heatmapInteraction: normalizeHeatmapInteraction( viewerDefaults.heatmapInteraction ),
		heatmapRenderer: normalizeHeatmapRenderer( viewerDefaults.heatmapRenderer ),
		heatmapZoomAspectRatio: normalizeHeatmapZoomAspectRatio( viewerDefaults.heatmapZoomAspectRatio ),
		selectionConfidenceLevel: viewerDefaults.selectionConfidenceLevel === "none"
			? "none"
			: Number.parseInt( normalizeSelectionConfidenceLevel( viewerDefaults.selectionConfidenceLevel ), 10 ),
		loadings: normalizeShowHide( viewerDefaults.loadings, "hide" ),
		falseColoringBasis: normalizeFalseColoringBasis( viewerDefaults.falseColoringBasis ),
		roiEstimateUncertainty: normalizeShowHide( viewerDefaults.roiEstimateUncertainty, "show" )
	}
	savedSettings.hyperspectrumPrioritization = {
		...( savedSettings.hyperspectrumPrioritization ?? {} ),
		...normalizePrioritization( prioritization )
	}

	roiOptions.intervalOpacity = normalizeOpacity( roiOptions.intervalOpacity, 0.25 )
	roiOptions.overlayOpacity = normalizeOpacity( roiOptions.overlayOpacity, 0.25 )

	for( const entry of pcaColorEntries ){
		const componentIndex = entry.componentIndex
		savedSettings.hyperspectrumColors.pcaComponents[componentIndex] =
			typeof pcaComponentColors[componentIndex] === "string" && pcaComponentColors[componentIndex].length > 0
				? pcaComponentColors[componentIndex]
				: PCA_DEFAULT_COLORS[componentIndex]
	}

	await settingslib.set( savedSettings )

	await utils.wait( 1000 )
	updating.value = false
}

const resetSettings = async () => {

	updating.value = true

	const defaultSettings = await settingslib.getDefaultSettings()
	await settingslib.set( defaultSettings )
	syncFromSettings( defaultSettings )

	await utils.wait( 1000 )
	updating.value = false
}

onMounted( async () => {

	const savedSettings = await settingslib.get()
	syncFromSettings( savedSettings )
})

</script>
