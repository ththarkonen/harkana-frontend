<template>
<div class="prose prose-gray max-w-none">

	<div class="border-2 border-brand rounded-lg p-4 mb-8 shadow-black shadow-lg">
		<p>
			<strong>Hyperspectrum Visualization Settings</strong> control how hyperspectral image views and spectra
			are displayed. These options cover axis labels, unit display, scalar heatmap colormaps, PCA component
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

			<div class="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
				<div class="flex flex-col gap-2">
					<label class="font-semibold text-black">Lower bound percentile (%)</label>
					<input v-model.number = "spectrumOptions.lowerBoundPercentage"
						   class="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
						   type = "number"
						   min = "0"
						   max = "100"
						   step = "0.1"/>
				</div>

				<div class="flex flex-col gap-2">
					<label class="font-semibold text-black">Upper bound percentile (%)</label>
					<input v-model.number = "spectrumOptions.upperBoundPercentage"
						   class="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
						   type = "number"
						   min = "0"
						   max = "100"
						   step = "0.1"/>
				</div>
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

const roiColors = reactive({
	roiSpectrum: "#333333",
	roiInterval: "#333333",
	roiBox: "#ffffff",
	roiTitle: "#ffffff"
})

const spectrumOptions = reactive({
	lowerBoundPercentage: 7.5,
	upperBoundPercentage: 97.5,
	intervalOpacity: 0.25,
	showInterval: true
})

const roiOptions = reactive({
	showInterval: true,
	intervalOpacity: 0.25,
	overlayOpacity: 0.25
})

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

const normalizeBoundPercentage = ( value, fallback = 0 ) => {

	const numeric = Number( value )
	if( Number.isFinite( numeric ) === false ){
		return fallback
	}

	return Math.min( 100, Math.max( 0, numeric ))
}

const normalizeBoundRange = ( lowerValue, upperValue ) => {

	const lower = normalizeBoundPercentage( lowerValue, 7.5 )
	const upper = normalizeBoundPercentage( upperValue, 97.5 )

	if( lower <= upper ){
		return { lower, upper }
	}

	return { lower: upper, upper: lower }
}

const normalizeOpacity = ( value, fallback = 0.25 ) => {

	const numeric = Number( value )
	if( Number.isFinite( numeric ) === false ){
		return fallback
	}

	return Math.min( 1, Math.max( 0, numeric ))
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

	const boundRange = normalizeBoundRange(
		savedSettings?.hyperspectrumSpectrum?.lowerBoundPercentage,
		savedSettings?.hyperspectrumSpectrum?.upperBoundPercentage
	)
	spectrumOptions.lowerBoundPercentage = boundRange.lower
	spectrumOptions.upperBoundPercentage = boundRange.upper
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
		roiOverlay: roiColors.roiBox,
		pcaComponents: {
			...( savedSettings.hyperspectrumColors?.pcaComponents ?? {} )
		}
	}

	const updatedBoundRange = normalizeBoundRange(
		spectrumOptions.lowerBoundPercentage,
		spectrumOptions.upperBoundPercentage
	)

	savedSettings.hyperspectrumSpectrum = {
		...( savedSettings.hyperspectrumSpectrum ?? {} ),
		lowerBoundPercentage: updatedBoundRange.lower,
		upperBoundPercentage: updatedBoundRange.upper,
		showInterval: spectrumOptions.showInterval,
		intervalOpacity: normalizeOpacity( spectrumOptions.intervalOpacity, 0.25 )
	}

	spectrumOptions.lowerBoundPercentage = updatedBoundRange.lower
	spectrumOptions.upperBoundPercentage = updatedBoundRange.upper
	spectrumOptions.intervalOpacity = normalizeOpacity( spectrumOptions.intervalOpacity, 0.25 )

	savedSettings.hyperspectrumRoi = {
		...( savedSettings.hyperspectrumRoi ?? {} ),
		showInterval: roiOptions.showInterval,
		intervalOpacity: normalizeOpacity( roiOptions.intervalOpacity, 0.25 ),
		overlayOpacity: normalizeOpacity( roiOptions.overlayOpacity, 0.25 )
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

onMounted( async () => {

	const savedSettings = await settingslib.get()
	syncFromSettings( savedSettings )
})

</script>
