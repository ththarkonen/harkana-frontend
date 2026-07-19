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

					<label class = "block">
						<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Custom index colormap</div>
						<select v-model = "colormaps.customIndex"
								class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand">
							<option v-for = "scale in colorscales" :key = "'custom-index-' + scale" :value = "scale">
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

		<div v-show = "activeVisualizationTab === 'custom-index'" role = "tabpanel" class = "max-w-2xl space-y-8">
			<p class = "text-sm text-black/70">
				Configure how custom index formulas are displayed. The backend formula variables remain D and E;
				these symbols only affect labels and operand lists in the interface.
			</p>

			<div class = "grid gap-5 md:grid-cols-2">
				<LatexField description = "Measured layer symbol"
							v-model = "customIndexSymbols.data"
							placeholder = "D"></LatexField>
				<LatexField description = "Estimate layer symbol"
							v-model = "customIndexSymbols.estimate"
							placeholder = "E"></LatexField>
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
						<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Selection uncertainty level</div>
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
				<p class = "text-sm text-black/70">
					These colors are applied to plotted regions of interest in order. The first plotted region uses the first color.
				</p>
				<div class = "grid gap-5 md:grid-cols-2">
					<ColorPicker v-for = "( color, index ) in roiPalette"
								 :key = "'roi-palette-' + index"
								 v-model = "roiPalette[index]"
								 :description = "'ROI color ' + ( index + 1 )">
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
						<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Estimate uncertainty level</div>
						<select v-model = "viewerDefaults.roiEstimateUncertainty"
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

import SettingsButton from "../settings/SettingsButton.vue"
import LatexField from "../settings/LatexField.vue"
import ColorPicker from "../settings/ColorPicker.vue"
import { useHyperspectrumVisualizationSettings } from "./hyperspectrumVisualization/useSettingsModel.js"

const {
	activeVisualizationTab,
	colorscales,
	colormaps,
	customIndexSymbols,
	fontSizes,
	gridlines,
	labels,
	layout,
	pcaColorEntries,
	pcaComponentColors,
	prioritization,
	prioritizationEntries,
	resetSettings,
	roiColors,
	roiOptions,
	roiPalette,
	spectrumColors,
	spectrumOptions,
	updateSettings,
	updating,
	umapChannelColors,
	viewerDefaults,
	visualizationTabs,
	zBlendPalette
} = useHyperspectrumVisualizationSettings()

</script>
