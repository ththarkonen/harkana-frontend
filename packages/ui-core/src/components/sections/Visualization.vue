<template>
<div class="prose prose-gray max-w-none">
	<div class="not-prose space-y-8">
		<div class="flex w-full max-w-2xl flex-wrap gap-2 rounded-lg border border-black/10 bg-black/[0.03] p-2"
			 role = "tablist"
			 aria-label = "Spectrum visualization settings sections">
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
				Control the pane layout, horizontal axis orientation, default gridlines, and font sizes for spectrum plots.
			</p>

			<div class = "space-y-4">
				<div class = "text-xs font-semibold uppercase tracking-wide text-black/70">Layout</div>
				<div class = "grid gap-5 md:grid-cols-2">
					<label class = "block">
						<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Graph layout</div>
						<select v-model = "layout.layout"
								class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand">
							<option value = "vertical">Vertical panes</option>
							<option value = "horizontal">Horizontal panes</option>
							<option value = "single">Single pane</option>
						</select>
					</label>

					<label class = "block">
						<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Reverse horizontal axis</div>
						<select v-model = "layout.reversed"
								class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand">
							<option value = "true">True</option>
							<option value = "false">False</option>
						</select>
					</label>
				</div>

				<label class = "flex items-center gap-3 text-sm text-black">
					<input v-model = "gridlines.spectra"
						   type = "checkbox"
						   class = "h-4 w-4 rounded border-gray-300 accent-brand focus:ring-brand"/>
					<span>Show spectrum gridlines by default</span>
				</label>
			</div>

			<div class = "space-y-4">
				<div class = "text-xs font-semibold uppercase tracking-wide text-black/70">Axis label</div>
				<div class = "grid gap-5 md:grid-cols-2">
					<LatexField description = "Horizontal axis label" v-model = "labels.horizontal"></LatexField>
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
							   min = "8"
							   max = "72"
							   step = "1"
							   inputmode = "numeric"
							   spellcheck = "false"/>
					</label>

					<label class = "block">
						<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Axis label font size</div>
						<input v-model.number = "fontSizes.label"
							   class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand"
							   type = "number"
							   min = "8"
							   max = "72"
							   step = "1"
							   inputmode = "numeric"
							   spellcheck = "false"/>
					</label>

					<label class = "block">
						<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Legend font size</div>
						<input v-model.number = "fontSizes.legend"
							   class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand"
							   type = "number"
							   min = "8"
							   max = "72"
							   step = "1"
							   inputmode = "numeric"
							   spellcheck = "false"/>
					</label>
				</div>
			</div>
		</div>

		<div v-show = "activeVisualizationTab === 'legends'" role = "tabpanel" class = "max-w-2xl space-y-8">
			<p class = "text-sm text-black/70">
				Adjust the legend labels for measurement, median estimate, and uncertainty intervals. LaTeX formatting is supported.
			</p>

			<div class = "space-y-4">
				<div class = "text-xs font-semibold uppercase tracking-wide text-black/70">Legend labels</div>
				<div class = "grid gap-5 md:grid-cols-2">
					<LatexField description = "Measurement data legend" v-model = "legends.data"></LatexField>
					<LatexField description = "Median estimate legend" v-model = "legends.median"></LatexField>
					<LatexField description = "Marginal 50% uncertainty legend" v-model = "legends.interval50"></LatexField>
					<LatexField description = "Marginal 75% uncertainty legend" v-model = "legends.interval75"></LatexField>
					<LatexField description = "Marginal 90% uncertainty legend" v-model = "legends.interval90"></LatexField>
					<LatexField description = "Marginal 95% uncertainty legend" v-model = "legends.interval95"></LatexField>
				</div>
			</div>
		</div>

		<div v-show = "activeVisualizationTab === 'colors'" role = "tabpanel" class = "max-w-2xl space-y-8">
			<p class = "text-sm text-black/70">
				Set the default colors for measurement, estimate, and uncertainty styling in both standard and comparison views.
			</p>

			<div class = "space-y-4">
				<div class = "text-xs font-semibold uppercase tracking-wide text-black/70">Primary plot colors</div>
				<div class = "grid gap-5 md:grid-cols-2">
					<ColorPicker v-model = "colors.data" description = "Measurement data color"></ColorPicker>
					<ColorPicker v-model = "colors.median" description = "Median estimate color"></ColorPicker>
					<ColorPicker v-model = "colors.area" description = "Uncertainty estimate color"></ColorPicker>
					<label class = "block">
						<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Uncertainty estimate opacity</div>
						<input v-model.number = "colors.opacity"
							   class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand"
							   type = "number"
							   min = "0"
							   max = "1"
							   step = "0.01"
							   inputmode = "decimal"
							   spellcheck = "false"/>
					</label>
				</div>
			</div>

			<div class = "space-y-4">
				<div class = "text-xs font-semibold uppercase tracking-wide text-black/70">Comparison plot colors</div>
				<div class = "grid gap-5 md:grid-cols-2">
					<ColorPicker v-model = "comparisonColors.data" description = "Comparison data color"></ColorPicker>
					<ColorPicker v-model = "comparisonColors.median" description = "Comparison median estimate color"></ColorPicker>
					<ColorPicker v-model = "comparisonColors.area" description = "Comparison uncertainty estimate color"></ColorPicker>
					<label class = "block">
						<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Comparison uncertainty opacity</div>
						<input v-model.number = "comparisonColors.opacity"
							   class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand"
							   type = "number"
							   min = "0"
							   max = "1"
							   step = "0.01"
							   inputmode = "decimal"
							   spellcheck = "false"/>
					</label>
				</div>
			</div>
		</div>

		<div v-show = "activeVisualizationTab === 'visibility'" role = "tabpanel" class = "max-w-2xl space-y-8">
			<p class = "text-sm text-black/70">
				Choose which traces should be visible by default in project plots and comparison views.
			</p>

			<div class = "space-y-4">
				<div class = "text-xs font-semibold uppercase tracking-wide text-black/70">Initial graph visibility</div>
				<div class = "grid gap-3 md:grid-cols-2">
					<label v-for = "entry in visibilityEntries"
						   :key = "'visibility-' + entry.key"
						   class = "flex items-center gap-3 text-sm text-black">
						<input v-model = "visibility[ entry.key ]"
							   type = "checkbox"
							   class = "h-4 w-4 rounded border-gray-300 accent-brand focus:ring-brand"/>
						<span>{{ entry.label }}</span>
					</label>
				</div>
			</div>

			<div class = "space-y-4">
				<div class = "text-xs font-semibold uppercase tracking-wide text-black/70">Comparison initial graph visibility</div>
				<div class = "grid gap-3 md:grid-cols-2">
					<label v-for = "entry in visibilityEntries"
						   :key = "'comparison-visibility-' + entry.key"
						   class = "flex items-center gap-3 text-sm text-black">
						<input v-model = "comparisonVisibility[ entry.key ]"
							   type = "checkbox"
							   class = "h-4 w-4 rounded border-gray-300 accent-brand focus:ring-brand"/>
						<span>{{ entry.label }}</span>
					</label>
				</div>
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

const visualizationTabs = [
	{ id: "axis", label: "Axis settings" },
	{ id: "legends", label: "Legends" },
	{ id: "colors", label: "Colors" },
	{ id: "visibility", label: "Visibility" }
]

const visibilityEntries = [
	{ key: "data", label: "Measurement data" },
	{ key: "median", label: "Median estimate" },
	{ key: "interval50", label: "Marginal 50% uncertainty estimate" },
	{ key: "interval75", label: "Marginal 75% uncertainty estimate" },
	{ key: "interval90", label: "Marginal 90% uncertainty estimate" },
	{ key: "interval95", label: "Marginal 95% uncertainty estimate" }
]

const updating = ref( false )
const activeVisualizationTab = ref( "axis" )

const layout = reactive({
	reversed: "true",
	layout: "vertical"
})

const labels = reactive({
	horizontal: "\\nu"
})

const legends = reactive({
	data: "y",
	median: "\\text{Im}\\,\\mathcal{X}^{(3)}_{\\text{median}}( \\nu )",
	interval50: "\\text{Im}\\,\\mathcal{X}^{(3)}_{50\\%}( \\nu )",
	interval75: "\\text{Im}\\,\\mathcal{X}^{(3)}_{75\\%}( \\nu )",
	interval90: "\\text{Im}\\,\\mathcal{X}^{(3)}_{90\\%}( \\nu )",
	interval95: "\\text{Im}\\,\\mathcal{X}^{(3)}_{95\\%}( \\nu )"
})

const gridlines = reactive({
	spectra: true
})

const fontSizes = reactive({
	axis: 16,
	label: 16,
	legend: 16
})

const colors = reactive({
	data: "#1f77b4",
	median: "#1f77b4",
	area: "#1f77b4",
	opacity: 0.15
})

const comparisonColors = reactive({
	data: "#d62728",
	median: "#d62728",
	area: "#d62728",
	opacity: 0.15
})

const visibility = reactive({
	data: true,
	median: true,
	interval50: true,
	interval75: true,
	interval90: true,
	interval95: true
})

const comparisonVisibility = reactive({
	data: true,
	median: true,
	interval50: false,
	interval75: false,
	interval90: false,
	interval95: true
})

const normalizeCheckbox = ( value, fallback = true ) => {
	if( typeof value === "boolean" ){
		return value
	}

	if( typeof value === "string" ){
		if( value === "true" ) return true
		if( value === "false" ) return false
	}

	return fallback
}

const normalizeText = ( value, fallback = "" ) => {
	return typeof value === "string" && value.length > 0 ? value : fallback
}

const normalizeOpacity = ( value, fallback = 0.15 ) => {
	const numeric = Number( value )
	if( Number.isFinite( numeric ) === false ){
		return fallback
	}

	return Math.min( 1, Math.max( 0, numeric ))
}

const normalizeFontSize = ( value, fallback = 16 ) => {
	const numeric = Number( value )
	if( Number.isFinite( numeric ) === false ){
		return fallback
	}

	return Math.min( 72, Math.max( 8, Math.round( numeric ) ))
}

const normalizeLayoutMode = ( value ) => {
	const normalized = String( value ?? "" ).trim().toLowerCase()
	if([ "vertical", "horizontal", "single" ].includes( normalized )){
		return normalized
	}

	return "vertical"
}

const normalizeReversed = ( value ) => {
	return String( value ?? "" ).trim().toLowerCase() === "false" ? "false" : "true"
}

const syncVisibility = ( target, source, fallbacks ) => {
	for( const entry of visibilityEntries ){
		target[ entry.key ] = normalizeCheckbox(
			source?.[ entry.key ],
			fallbacks[ entry.key ]
		)
	}
}

const syncFromSettings = ( savedSettings ) => {
	layout.reversed = normalizeReversed( savedSettings?.layout?.reversed )
	layout.layout = normalizeLayoutMode( savedSettings?.layout?.layout )

	labels.horizontal = normalizeText( savedSettings?.labels?.horizontal, "\\nu" )

	legends.data = normalizeText( savedSettings?.legends?.data, "y" )
	legends.median = normalizeText( savedSettings?.legends?.median, "\\text{Im}\\,\\mathcal{X}^{(3)}_{\\text{median}}( \\nu )" )
	legends.interval50 = normalizeText( savedSettings?.legends?.interval50, "\\text{Im}\\,\\mathcal{X}^{(3)}_{50\\%}( \\nu )" )
	legends.interval75 = normalizeText( savedSettings?.legends?.interval75, "\\text{Im}\\,\\mathcal{X}^{(3)}_{75\\%}( \\nu )" )
	legends.interval90 = normalizeText( savedSettings?.legends?.interval90, "\\text{Im}\\,\\mathcal{X}^{(3)}_{90\\%}( \\nu )" )
	legends.interval95 = normalizeText( savedSettings?.legends?.interval95, "\\text{Im}\\,\\mathcal{X}^{(3)}_{95\\%}( \\nu )" )

	gridlines.spectra = normalizeCheckbox( savedSettings?.gridlines?.spectra, true )

	fontSizes.axis = normalizeFontSize( savedSettings?.font?.sizes?.axis, 16 )
	fontSizes.label = normalizeFontSize( savedSettings?.font?.sizes?.label, 16 )
	fontSizes.legend = normalizeFontSize( savedSettings?.font?.sizes?.legend, 16 )

	colors.data = normalizeText( savedSettings?.colors?.data, "#1f77b4" )
	colors.median = normalizeText( savedSettings?.colors?.median, colors.data )
	colors.area = normalizeText( savedSettings?.colors?.area, colors.data )
	colors.opacity = normalizeOpacity( savedSettings?.colors?.opacity, 0.15 )

	comparisonColors.data = normalizeText( savedSettings?.comparisonColors?.data, "#d62728" )
	comparisonColors.median = normalizeText( savedSettings?.comparisonColors?.median, comparisonColors.data )
	comparisonColors.area = normalizeText( savedSettings?.comparisonColors?.area, comparisonColors.data )
	comparisonColors.opacity = normalizeOpacity( savedSettings?.comparisonColors?.opacity, 0.15 )

	syncVisibility(
		visibility,
		savedSettings?.visibility?.plot,
		{
			data: true,
			median: true,
			interval50: true,
			interval75: true,
			interval90: true,
			interval95: true
		}
	)

	syncVisibility(
		comparisonVisibility,
		savedSettings?.visibility?.comparison,
		{
			data: true,
			median: true,
			interval50: false,
			interval75: false,
			interval90: false,
			interval95: true
		}
	)
}

const updateSettings = async () => {
	updating.value = true

	const savedSettings = await settingslib.get()

	savedSettings.layout = {
		...( savedSettings.layout ?? {} ),
		reversed: layout.reversed,
		layout: layout.layout
	}

	savedSettings.labels = {
		...( savedSettings.labels ?? {} ),
		horizontal: labels.horizontal
	}

	savedSettings.legends = {
		...( savedSettings.legends ?? {} ),
		data: legends.data,
		median: legends.median,
		interval50: legends.interval50,
		interval75: legends.interval75,
		interval90: legends.interval90,
		interval95: legends.interval95
	}

	savedSettings.gridlines = {
		...( savedSettings.gridlines ?? {} ),
		spectra: gridlines.spectra === true
	}

	savedSettings.font = {
		...( savedSettings.font ?? {} ),
		sizes: {
			...( savedSettings.font?.sizes ?? {} ),
			axis: normalizeFontSize( fontSizes.axis, 16 ),
			label: normalizeFontSize( fontSizes.label, 16 ),
			legend: normalizeFontSize( fontSizes.legend, 16 )
		}
	}

	savedSettings.colors = {
		...( savedSettings.colors ?? {} ),
		data: colors.data,
		median: colors.median,
		area: colors.area,
		opacity: normalizeOpacity( colors.opacity, 0.15 )
	}

	savedSettings.comparisonColors = {
		...( savedSettings.comparisonColors ?? {} ),
		data: comparisonColors.data,
		median: comparisonColors.median,
		area: comparisonColors.area,
		opacity: normalizeOpacity( comparisonColors.opacity, 0.15 )
	}

	savedSettings.visibility = {
		...( savedSettings.visibility ?? {} ),
		plot: {
			...( savedSettings.visibility?.plot ?? {} ),
			data: visibility.data === true,
			median: visibility.median === true,
			interval50: visibility.interval50 === true,
			interval75: visibility.interval75 === true,
			interval90: visibility.interval90 === true,
			interval95: visibility.interval95 === true
		},
		comparison: {
			...( savedSettings.visibility?.comparison ?? {} ),
			data: comparisonVisibility.data === true,
			median: comparisonVisibility.median === true,
			interval50: comparisonVisibility.interval50 === true,
			interval75: comparisonVisibility.interval75 === true,
			interval90: comparisonVisibility.interval90 === true,
			interval95: comparisonVisibility.interval95 === true
		}
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
