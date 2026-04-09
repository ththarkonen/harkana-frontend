<template>
<div class="prose prose-gray max-w-none">
	<div class="not-prose space-y-8">
		<div class="flex w-full max-w-2xl flex-wrap gap-2 rounded-lg border border-black/10 bg-black/[0.03] p-2"
			 role = "tablist"
			 aria-label = "Hyperspectrum visualization settings sections">
			<button v-for = "tab in visualizationTabs"
					:key = "tab.id"
					type = "button"
					role = "tab"
					:aria-selected = "activeVisualizationTab === tab.id ? 'true' : 'false'"
					:tabindex = "activeVisualizationTab === tab.id ? 0 : -1"
					@click = "activeVisualizationTab = tab.id"
					class = "inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
					:class = "activeVisualizationTab === tab.id
						? 'bg-brand text-white'
						: 'bg-transparent text-black/70 hover:bg-black/5 hover:text-black'">
				{{ tab.label }}
			</button>
		</div>

		<div v-show = "activeVisualizationTab === 'axis'" role = "tabpanel" class = "max-w-2xl space-y-8">
			<p class = "text-sm text-black/70">
				Control the displayed axis labels, orientation, and font sizes for hyperspectral plots.
			</p>

			<div class = "space-y-4">
				<div class = "text-xs font-semibold uppercase tracking-wide text-black/70">Axis labels</div>
				<div class = "grid gap-5 md:grid-cols-2">
					<LatexField description = "Horizontal axis label" v-model = "labels.horizontal"></LatexField>
					<LatexField description = "Vertical axis label" v-model = "labels.vertical"></LatexField>
					<LatexField description = "Spectral axis label" v-model = "labels.spectral"></LatexField>
					<LatexField description = "Spectral axis intensity label" v-model = "labels.intensity"></LatexField>
				</div>

				<label class = "flex items-center gap-3 text-sm text-black">
					<input id = "show-units"
						   v-model = "labels.showUnits"
						   type = "checkbox"
						   class = "h-4 w-4 rounded border-gray-300 accent-brand focus:ring-brand"/>
					<span>Show physical units after axis labels</span>
				</label>
			</div>

			<div class = "space-y-4">
				<div class = "text-xs font-semibold uppercase tracking-wide text-black/70">Axis layout</div>
				<div class = "grid gap-5 md:grid-cols-2">
					<label class = "block">
						<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Reverse spectral axis</div>
						<select v-model = "layout.leftPlotsReversed"
								class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand">
							<option value = "false">False</option>
							<option value = "true">True</option>
						</select>
					</label>

					<label class = "block">
						<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Heatmap and image origin</div>
						<select v-model = "layout.heatmapOrigin"
								class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand">
							<option value = "top-left">Top left</option>
							<option value = "bottom-left">Bottom left</option>
						</select>
					</label>
				</div>
			</div>

			<div class = "space-y-4">
				<div class = "text-xs font-semibold uppercase tracking-wide text-black/70">Font sizes</div>
				<div class = "grid gap-5 md:grid-cols-2">
					<label class = "block">
						<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Axis tick font size</div>
						<input v-model.number = "fontSizes.axis"
							   class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand"
							   type = "number"
							   name = "axis-tick-font-size"
							   autocomplete = "off"
							   inputmode = "numeric"
							   spellcheck = "false"
							   min = "8"
							   max = "72"
							   step = "1"/>
					</label>

					<label class = "block">
						<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Axis label font size</div>
						<input v-model.number = "fontSizes.label"
							   class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand"
							   type = "number"
							   name = "axis-title-font-size"
							   autocomplete = "off"
							   inputmode = "numeric"
							   spellcheck = "false"
							   min = "8"
							   max = "72"
							   step = "1"/>
					</label>
				</div>
			</div>
		</div>

		<div v-show = "activeVisualizationTab === 'colormaps'" role = "tabpanel" class = "max-w-2xl space-y-8">
			<p class = "text-sm text-black/70">
				Choose the scalar colormaps used for intensity-based heatmaps such as MIP and layer views.
			</p>

			<div class = "space-y-4">
				<div class = "text-xs font-semibold uppercase tracking-wide text-black/70">Scalar heatmap colormaps</div>
				<div class = "grid gap-5 md:grid-cols-2">
					<label class = "block">
						<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">MIP colormap</div>
						<select v-model = "colormaps.mip"
								class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand">
							<option v-for = "scale in colorscales" :key = "'mip-' + scale" :value = "scale">
								{{ scale }}
							</option>
						</select>
					</label>

					<label class = "block">
						<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Layer colormap</div>
						<select v-model = "colormaps.layer"
								class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand">
							<option v-for = "scale in colorscales" :key = "'layer-' + scale" :value = "scale">
								{{ scale }}
							</option>
						</select>
					</label>
				</div>
			</div>
		</div>

		<div v-show = "activeVisualizationTab === 'initialization'" role = "tabpanel" class = "max-w-2xl space-y-8">
			<p class = "text-sm text-black/70">
				Define the default viewer state and which visualizations are prepared earlier during initialization.
			</p>

			<div class = "space-y-4">
				<div class = "text-xs font-semibold uppercase tracking-wide text-black/70">Viewer defaults</div>
				<div class = "grid gap-5 md:grid-cols-2">
					<label class = "block">
						<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Display mode</div>
						<select v-model = "viewerDefaults.displayMode"
								class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand">
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
					</label>

					<label class = "block">
						<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Heatmap interaction</div>
						<select v-model = "viewerDefaults.heatmapInteraction"
								class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand">
							<option value = "select">Select spectra</option>
							<option value = "zoom">Zoom</option>
						</select>
					</label>

					<label class = "block">
						<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Zoom aspect ratio</div>
						<select v-model = "viewerDefaults.heatmapZoomAspectRatio"
								class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand">
							<option value = "square">Lock square</option>
							<option value = "free">Free</option>
						</select>
					</label>

					<label class = "block">
						<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Loadings</div>
						<select v-model = "viewerDefaults.loadings"
								class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand">
							<option value = "hide">Hide</option>
							<option value = "show">Show</option>
						</select>
					</label>

					<label class = "block">
						<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">False-coloring basis</div>
						<select v-model = "viewerDefaults.falseColoringBasis"
								class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand">
							<option value = "measurement">Measurements</option>
							<option value = "raman">Estimated Raman spectra</option>
						</select>
						<p class = "mt-2 text-xs text-black/60">
							If Raman coloring is not available yet, measurements are used automatically.
						</p>
					</label>
				</div>

				<label class = "flex items-center gap-3 text-sm text-black">
					<input v-model = "gridlines.hyperspectra"
						   type = "checkbox"
						   class = "h-4 w-4 rounded border-gray-300 accent-brand focus:ring-brand"/>
					<span>Show spectrum gridlines by default</span>
				</label>
			</div>

			<div class = "space-y-4">
				<div class = "text-xs font-semibold uppercase tracking-wide text-black/70">Prioritization</div>
				<p class = "text-sm text-black/70">
					Choose which visualizations should be prepared earlier after the starting view.
				</p>
				<div class = "grid gap-3 md:grid-cols-2">
					<label v-for = "entry in prioritizationEntries"
						   :key = "'prioritization-' + entry.key"
						   class = "flex items-center gap-3 text-sm text-black">
						<input v-model = "prioritization[entry.key]"
							   type = "checkbox"
							   class = "h-4 w-4 rounded border-gray-300 accent-brand focus:ring-brand"/>
						<span>{{ entry.label }}</span>
					</label>
				</div>
			</div>
		</div>

		<div v-show = "activeVisualizationTab === 'umap'" role = "tabpanel" class = "max-w-2xl space-y-4">
			<p class = "text-sm text-black/70">
				Set the colors used for the red, green, and blue UMAP channels.
			</p>

			<div class = "text-xs font-semibold uppercase tracking-wide text-black/70">UMAP channel colors</div>
			<div class = "grid gap-5 md:grid-cols-2">
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

		<div v-show = "activeVisualizationTab === 'z-blend'" role = "tabpanel" class = "max-w-2xl space-y-4">
			<p class = "text-sm text-black/70">
				Adjust the ordered palette applied to channels when using the z-blend visualization.
			</p>

			<div class = "text-xs font-semibold uppercase tracking-wide text-black/70">Z-blend palette</div>
			<p class = "text-sm text-black/70">
				These colors are assigned automatically to z-blend channels in order.
			</p>
			<div class = "grid gap-5 md:grid-cols-2">
				<ColorPicker v-for = "( color, index ) in zBlendPalette"
							 :key = "'z-blend-palette-' + index"
							 v-model = "zBlendPalette[index]"
							 :description = "'Z-blend color ' + ( index + 1 )">
				</ColorPicker>
			</div>
		</div>

		<div v-show = "activeVisualizationTab === 'spectrum'" role = "tabpanel" class = "max-w-2xl space-y-8">
			<p class = "text-sm text-black/70">
				Configure the styling of the selected spectrum, including the interval display and confidence level.
			</p>

			<div class = "space-y-4">
				<div class = "text-xs font-semibold uppercase tracking-wide text-black/70">Spectrum styling</div>
				<div class = "grid gap-5 md:grid-cols-2">
					<ColorPicker v-model = "spectrumColors.queriedSpectrum"
								 description = "Queried spectrum color">
					</ColorPicker>
					<ColorPicker v-model = "spectrumColors.queriedInterval"
								 description = "Interval color">
					</ColorPicker>
				</div>

				<label class = "flex items-center gap-3 text-sm text-black">
					<input id = "show-interval"
						   v-model = "spectrumOptions.showInterval"
						   type = "checkbox"
						   class = "h-4 w-4 rounded border-gray-300 accent-brand focus:ring-brand"/>
					<span>Show uncertainty interval</span>
				</label>

				<div class = "grid gap-5 md:grid-cols-2">
					<label class = "block">
						<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Interval opacity</div>
						<input v-model.number = "spectrumOptions.intervalOpacity"
							   class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand"
							   type = "number"
							   min = "0"
							   max = "1"
							   step = "0.01"/>
					</label>

					<label class = "block">
						<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Selection confidence level</div>
						<select v-model = "viewerDefaults.selectionConfidenceLevel"
								class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand">
							<option value = "none">No uncertainty</option>
							<option value = "50">50%</option>
							<option value = "75">75%</option>
							<option value = "90">90%</option>
							<option value = "95">95%</option>
						</select>
					</label>
				</div>
			</div>
		</div>

		<div v-show = "activeVisualizationTab === 'roi'" role = "tabpanel" class = "max-w-2xl space-y-8">
			<p class = "text-sm text-black/70">
				Control how regions of interest are shown in spectra, overlays, and uncertainty displays.
			</p>

			<div class = "space-y-4">
				<div class = "text-xs font-semibold uppercase tracking-wide text-black/70">ROI comparison plot</div>
				<div class = "grid gap-5 md:grid-cols-2">
					<ColorPicker v-model = "roiColors.roiSpectrum"
								 description = "ROI spectrum color">
					</ColorPicker>
					<ColorPicker v-model = "roiColors.roiInterval"
								 description = "ROI interval color">
					</ColorPicker>
				</div>

				<label class = "flex items-center gap-3 text-sm text-black">
					<input id = "show-roi-interval"
						   v-model = "roiOptions.showInterval"
						   type = "checkbox"
						   class = "h-4 w-4 rounded border-gray-300 accent-brand focus:ring-brand"/>
					<span>Show ROI uncertainty interval</span>
				</label>

				<div class = "grid gap-5 md:grid-cols-2">
					<label class = "block">
						<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">ROI interval opacity</div>
						<input v-model.number = "roiOptions.intervalOpacity"
							   class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand"
							   type = "number"
							   min = "0"
							   max = "1"
							   step = "0.01"/>
					</label>

					<label class = "block">
						<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Estimate ROI uncertainty</div>
						<select v-model = "viewerDefaults.roiEstimateUncertainty"
								class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand">
							<option value = "show">Show</option>
							<option value = "hide">Hide</option>
						</select>
					</label>
				</div>
			</div>

			<div class = "space-y-4">
				<div class = "text-xs font-semibold uppercase tracking-wide text-black/70">ROI overlay</div>
				<div class = "grid gap-5 md:grid-cols-2">
					<ColorPicker v-model = "roiColors.roiBox"
								 description = "ROI box color">
					</ColorPicker>
					<ColorPicker v-model = "roiColors.roiTitle"
								 description = "ROI title color">
					</ColorPicker>
					<ColorPicker v-model = "roiColors.selectionBox"
								 description = "Current selection box color">
					</ColorPicker>
				</div>

				<label class = "block max-w-sm">
					<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">ROI overlay opacity</div>
					<input v-model.number = "roiOptions.overlayOpacity"
						   class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand"
						   type = "number"
						   min = "0"
						   max = "1"
						   step = "0.01"/>
				</label>
			</div>
		</div>

		<div v-show = "activeVisualizationTab === 'pca'" role = "tabpanel" class = "max-w-2xl space-y-4">
			<p class = "text-sm text-black/70">
				Assign the colors used for PCA component-based visualizations and related overlays.
			</p>

			<div class = "text-xs font-semibold uppercase tracking-wide text-black/70">PCA component colors</div>
			<div class = "grid gap-5 md:grid-cols-2">
				<ColorPicker v-for = "entry in pcaColorEntries"
							 :key = "entry.componentIndex"
							 v-model = "pcaComponentColors[entry.componentIndex]"
							 :description = "entry.label + ' color'">
				</ColorPicker>
			</div>
		</div>

		<div class = "flex flex-wrap gap-3 max-w-2xl">
			<SettingsButton @click = "updateSettings" :loading = "updating" class = "disabled:cursor-not-allowed disabled:opacity-50">
				Update visualization settings
			</SettingsButton>

			<SettingsButton @click = "resetSettings"
							:loading = "updating"
							class = "disabled:cursor-not-allowed disabled:opacity-50">
				Reset to default settings
			</SettingsButton>
		</div>
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
const visualizationTabs = [
	{ id: "axis", label: "Axis settings" },
	{ id: "colormaps", label: "Colormaps" },
	{ id: "initialization", label: "Initialization" },
	{ id: "umap", label: "UMAP channel colors" },
	{ id: "z-blend", label: "Z-blend palette" },
	{ id: "spectrum", label: "Spectrum selection color" },
	{ id: "roi", label: "Regions of interest" },
	{ id: "pca", label: "PCA colors" }
]

const updating = ref( false )
const activeVisualizationTab = ref( "axis" )

const layout = reactive({
	leftPlotsReversed: "false",
	heatmapOrigin: "bottom-left"
})

const labels = reactive({
	horizontal: "x",
	vertical: "y",
	spectral: "\\nu",
	intensity: "I",
	showUnits: true
})
const gridlines = reactive({
	hyperspectra: false
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
	labels.intensity = typeof savedSettings?.labels?.intensity === "string" ? savedSettings.labels.intensity : "I"
	labels.showUnits = normalizeCheckbox( savedSettings?.labels?.showUnits, true )
	gridlines.hyperspectra = normalizeCheckbox( savedSettings?.gridlines?.hyperspectra, false )

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
		intensity: labels.intensity,
		showUnits: labels.showUnits
	}
	savedSettings.gridlines = {
		...( savedSettings.gridlines ?? {} ),
		hyperspectra: gridlines.hyperspectra === true
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
