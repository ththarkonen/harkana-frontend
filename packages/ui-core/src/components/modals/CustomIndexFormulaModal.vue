<template>
	<div v-if = "isOpen"
		 ref = "panel"
		 class = "fixed z-[140] flex h-[min(42rem,calc(100vh-1rem))] w-[min(48rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-lg border border-brand bg-dark-gray shadow-2xl"
		 :style = "panelStyles"
		 @keydown.esc.stop.prevent = "close">
		<header class = "flex items-start justify-between gap-3 border-b border-gray bg-gray-800/80 px-4 py-3 cursor-move select-none"
				@mousedown = "startDragging">
			<div class = "min-w-0">
				<div class = "flex min-w-0 items-center gap-2">
					<h3 class = "truncate text-sm font-semibold text-white">Custom index profile</h3>
					<span class = "inline-flex h-5 w-5 shrink-0 cursor-help items-center justify-center rounded-full border border-white/20 text-[11px] font-semibold text-white/70"
						  title = "Create a reusable custom index profile. Preview the formula against the current project, then save profile metadata for reuse in other projects.">
						?
					</span>
				</div>
				<div class = "mt-2 flex items-center gap-2 text-xs text-white/65">
					<span :class = "stepBadgeClass( 'preview' )">1. Preview</span>
					<span class = "h-px w-5 bg-white/20" aria-hidden = "true"></span>
					<span :class = "stepBadgeClass( 'save' )">2. Save profile</span>
				</div>
			</div>

			<button v-if = "saving === false && previewing === false"
					type = "button"
					class = "inline-flex h-8 w-8 items-center justify-center rounded-md text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand"
					title = "Close custom index editor"
					aria-label = "Close custom index editor"
					@mousedown.stop
					@click = "close">
				<i class = "fas fa-times" aria-hidden = "true"></i>
			</button>
		</header>

		<div class = "min-h-0 flex-1 overflow-y-auto bg-gray-800/40 px-4 py-4">
			<div v-if = "activeStep === 'preview'" class = "space-y-4">
				<section class = "space-y-4">
					<div class = "rounded-lg border border-white/10 bg-white/5 px-3 py-3">
						<label for = "custom-index-expression" class = "block">
							<div class = "mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
								<span>Formula</span>
								<span class = "inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-white/20 text-[10px] font-semibold text-white/65"
									  title = "Syntax: use D_{n} for measured layer n, E_{n} for estimated Raman layer n, or D(value) and E(value) to use the nearest layer at a physical horizontal-axis location. Supported operators are +, -, *, /, ^, parentheses, and unary minus. Supported functions are abs, sqrt, log, log10, exp, min, max, and pow.">
									?
								</span>
							</div>
							<textarea id = "custom-index-expression"
									  ref = "expressionInput"
									  v-model = "expression"
									  rows = "6"
									  placeholder = "(D_{11} - 0.5 * D_{12}) / D_{1}"
									  class = "w-full resize-y rounded-md border border-white/10 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/60"></textarea>
						</label>
					</div>

					<div class = "rounded-lg border border-white/10 bg-white/5 px-3 py-3">
						<div class = "mb-2 text-xs font-semibold uppercase tracking-wide text-white/70">
							Rendered formula
						</div>
						<div v-if = "hasFormulaInput"
							 class = "min-h-[3rem] overflow-x-auto rounded bg-white px-3 py-2 text-slate-900"
							 v-html = "renderedFormula"></div>
						<div v-else
							 class = "min-h-[3rem] rounded bg-white px-3 py-3 text-sm leading-snug text-slate-500">
							LaTeX rendering of the above formula is shown here.
						</div>
					</div>
				</section>

				<section class = "rounded-lg border border-white/10 bg-white/5 px-3 py-3">
					<div class = "mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
						<span>Operands</span>
						<span class = "inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-white/20 text-[10px] font-semibold text-white/65"
							  title = "Operands show each layer reference detected in the formula. D(value) and E(value) are resolved to the nearest available layer before previewing or saving.">
							?
						</span>
					</div>
					<div v-if = "operandRows.length === 0"
						 class = "px-1 py-3 text-sm leading-snug text-white/60">
						Formula references are listed here as they are added.
					</div>
					<div v-else class = "max-h-[25rem] overflow-y-auto pr-1">
						<div class = "sticky top-0 z-10 hidden grid-cols-[minmax(5.5rem,0.7fr)_minmax(7rem,0.9fr)_minmax(5rem,0.65fr)_minmax(9rem,1fr)] gap-3 border-b border-white/10 bg-gray-800/95 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-white/45 sm:grid">
							<div>Reference</div>
							<div>Source</div>
							<div>Layer</div>
							<div>Location</div>
						</div>
						<div v-for = "row in operandRows"
							 :key = "row.key"
							 class = "grid grid-cols-1 gap-1 border-b border-white/10 px-3 py-2 text-xs text-white/80 last:border-b-0 sm:grid-cols-[minmax(5.5rem,0.7fr)_minmax(7rem,0.9fr)_minmax(5rem,0.65fr)_minmax(9rem,1fr)] sm:gap-3">
							<div class = "min-w-0 truncate font-mono text-white">{{ row.token }}</div>
							<div class = "min-w-0 truncate">{{ row.source }}</div>
							<div class = "min-w-0 truncate">Layer {{ row.layerNumber }}</div>
							<div class = "min-w-0 truncate font-mono text-white/75">{{ row.axisText }}</div>
						</div>
					</div>

					<div v-if = "operandWarnings.length > 0"
						 class = "mt-3 space-y-1 rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs leading-snug text-amber-100">
						<div v-for = "warning in operandWarnings" :key = "warning">
							{{ warning }}
						</div>
					</div>
				</section>
			</div>

			<div v-else class = "space-y-4">
				<section class = "rounded-lg border border-white/10 bg-white/5 px-3 py-3">
					<div class = "mb-3 text-xs font-semibold uppercase tracking-wide text-white/70">
						Output metadata
					</div>
					<div class = "grid gap-4 md:grid-cols-2">
						<label for = "custom-index-output-label" class = "block">
							<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-white/70">
								Output label
							</div>
							<input id = "custom-index-output-label"
								   v-model = "outputLabel"
								   type = "text"
								   placeholder = "Required"
								   class = "w-full rounded-md border border-white/10 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/60"/>
						</label>

						<label for = "custom-index-output-unit" class = "block">
							<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-white/70">
								Output unit
							</div>
							<input id = "custom-index-output-unit"
								   v-model = "outputUnit"
								   type = "text"
								   placeholder = "Optional"
								   class = "w-full rounded-md border border-white/10 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/60"/>
						</label>
					</div>
				</section>

				<section class = "rounded-lg border border-white/10 bg-white/5 px-3 py-3">
					<div class = "mb-3 text-xs font-semibold uppercase tracking-wide text-white/70">
						Profile metadata
					</div>
					<div class = "grid gap-4 md:grid-cols-2">
						<label for = "custom-index-profile-name" class = "block">
							<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-white/70">
								Profile name
							</div>
							<input id = "custom-index-profile-name"
								   v-model = "friendlyName"
								   type = "text"
								   placeholder = "Required"
								   class = "w-full rounded-md border border-white/10 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/60"/>
						</label>

						<label for = "custom-index-profile-description" class = "block">
							<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-white/70">
								Description
							</div>
							<textarea id = "custom-index-profile-description"
									  v-model = "description"
									  rows = "3"
									  placeholder = "Describe when this custom index should be reused."
									  class = "w-full resize-y rounded-md border border-white/10 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/60"></textarea>
						</label>
					</div>
				</section>
			</div>

			<p v-if = "visibleValidationMessage.length > 0"
			   class = "mt-4 text-sm text-red-300">
				{{ visibleValidationMessage }}
			</p>
			<p v-if = "errorMessage.length > 0"
			   class = "mt-2 text-sm text-red-300">
				{{ errorMessage }}
			</p>
		</div>

		<footer class = "border-t border-gray bg-gray-800/80 px-4 py-3">
			<div v-if = "activeStep === 'preview'" class = "flex flex-wrap items-center gap-3">
				<span class = "flex-1" :title = "previewDisabledReason">
					<button type = "button"
							@click = "emitPreview"
							:disabled = "canPreview === false"
							class = "relative inline-flex min-h-10 w-full items-center justify-center rounded bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50">
						<span :class = "{ invisible: previewing }">Preview</span>
						<span v-if = "previewing" class = "absolute inset-0 flex items-center justify-center">
							<Spinner class = "h-5 w-5 text-brand"></Spinner>
						</span>
					</button>
				</span>
				<span :title = "profileStepDisabledReason">
					<button type = "button"
							@click = "activeStep = 'save'"
							:disabled = "canOpenProfileStep === false"
							class = "inline-flex min-h-10 items-center justify-center gap-2 rounded bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50">
						<span>To profile saving</span>
						<i class = "fas fa-arrow-right" aria-hidden = "true"></i>
					</button>
				</span>
			</div>

			<div v-else class = "flex flex-wrap items-center gap-3">
				<button type = "button"
						@click = "activeStep = 'preview'"
						:disabled = "saving"
						class = "inline-flex min-h-10 items-center justify-center gap-2 rounded bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50">
					<i class = "fas fa-arrow-left" aria-hidden = "true"></i>
					<span>Back to preview</span>
				</button>
				<span class = "flex-1" :title = "saveDisabledReason">
					<button type = "button"
							@click = "emitSave"
							:disabled = "canSave === false"
							class = "relative inline-flex min-h-10 w-full items-center justify-center rounded bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50">
						<span :class = "{ invisible: saving }">Save profile</span>
						<span v-if = "saving" class = "absolute inset-0 flex items-center justify-center">
							<Spinner class = "h-5 w-5 text-white"></Spinner>
						</span>
					</button>
				</span>
			</div>
		</footer>
	</div>
</template>

<script setup>
import { computed, nextTick, ref } from "vue"
import katex from "katex"

import Spinner from "../general/Spinner.vue"
import { useFloatingPanel } from "../../composables/useFloatingPanel.js"
import {
	buildCustomIndexFormulaModel,
	expressionToLatex,
	extractCustomIndexOperandDisplayRefs,
	formatCustomIndexOperandReferenceToken,
	formatCustomIndexOperandToken,
	normalizeCustomIndexOperand,
	serializeCustomIndexComputationModel
} from "../../composables/hyperspectrum/customIndex/formula.js"

const props = defineProps({
	axisValues: { type: Array, default: () => [] },
	axisUnit: { type: String, default: "" },
	dataSymbol: { type: String, default: "D" },
	estimateSymbol: { type: String, default: "E" },
	estimatesAvailable: { type: Boolean, default: false },
	previewing: { type: Boolean, default: false },
	saving: { type: Boolean, default: false },
	previewSignature: { type: String, default: "" },
	reservedNames: { type: Array, default: () => [] },
	errorMessage: { type: String, default: "" },
	anchorElement: { type: Object, default: null }
})

const emit = defineEmits([ "preview", "save" ])

const panel = ref(null)
const expressionInput = ref(null)
const isOpen = ref(false)
const activeStep = ref("preview")
const expression = ref("")
const outputLabel = ref("")
const outputUnit = ref("")
const friendlyName = ref("")
const description = ref("")

const {
	panelStyles,
	startDragging
} = useFloatingPanel({
	panel,
	isOpen,
	anchorElement: computed(() => props.anchorElement),
	defaultWidth: 768,
	defaultHeight: 672,
	placement: "anchor-top-left",
	windowMargin: 24,
	resetPositionOnClose: true
})

const symbolSettings = computed(() => ({
	data: props.dataSymbol,
	estimate: props.estimateSymbol
}))

const previewModel = computed(() => {
	return buildCustomIndexFormulaModel({
		expression: expression.value,
		outputLabel: "Custom index preview",
		outputUnit: "",
		axisValues: props.axisValues,
		axisUnit: props.axisUnit
	})
})

const saveModel = computed(() => {
	return buildCustomIndexFormulaModel({
		expression: expression.value,
		outputLabel: outputLabel.value,
		outputUnit: outputUnit.value,
		axisValues: props.axisValues,
		axisUnit: props.axisUnit
	})
})

const formulaComputationSignature = computed(() => serializeCustomIndexComputationModel( previewModel.value ))

const formulaWasPreviewed = computed(() => {
	return props.previewSignature.length > 0 && props.previewSignature === formulaComputationSignature.value
})

const normalizedFriendlyName = computed(() => String( friendlyName.value ?? "" ).trim())
const normalizedOutputLabel = computed(() => String( outputLabel.value ?? "" ).trim())

const profileNameConflict = computed(() => {
	const candidateName = normalizedFriendlyName.value
	if( candidateName.length === 0 ){
		return false
	}

	return props.reservedNames.some(( reservedName ) => {
		const normalizedReservedName = String( reservedName ?? "" ).trim()
		return normalizedReservedName.length > 0 &&
			normalizedReservedName.localeCompare( candidateName, undefined, { sensitivity: "accent" } ) === 0
	})
})

const operandWarnings = computed(() => {
	const warnings = []
	const axisLength = Array.isArray( props.axisValues ) ? props.axisValues.length : 0

	for( const operand of previewModel.value.operands ){
		const normalized = normalizeCustomIndexOperand( operand )
		if( normalized === null ){
			continue
		}
		if( axisLength > 0 && normalized.layerIndex >= axisLength ){
			warnings.push(`${normalized.symbol}_{${normalized.layerNumber}} is outside the loaded spectral axis range.`)
		}
		if( normalized.symbol === "E" && props.estimatesAvailable === false ){
			warnings.push(`${props.estimateSymbol}_{${normalized.layerNumber}} uses Raman estimates, but this project has no completed estimate artifacts loaded.`)
		}
	}

	return Array.from( new Set( warnings ))
})

const operandRows = computed(() => {
	return extractCustomIndexOperandDisplayRefs({
		expression: expression.value,
		axisValues: props.axisValues,
		axisUnit: props.axisUnit
	})
		.map(( operand ) => {
			const normalized = normalizeCustomIndexOperand( operand )
			if( normalized === null ){
				return null
			}

			const token = formatCustomIndexOperandReferenceToken( operand, symbolSettings.value ) ||
				formatCustomIndexOperandToken( normalized, symbolSettings.value )
			const axisText = normalized.axisValue === null
				? "Unavailable"
				: `${normalized.axisValue}${normalized.axisUnit ? ` ${normalized.axisUnit}` : ""}`
			return {
				key: `${normalized.symbol}-${normalized.layerNumber}`,
				token,
				source: normalized.symbol === "E" ? "Estimate" : "Measurement",
				layerNumber: normalized.layerNumber,
				axisText
			}
		})
		.filter(( row ) => row !== null )
})

const previewDisabledReason = computed(() => {
	if( props.previewing || props.saving ){
		return "Preview is already running."
	}
	if( String( previewModel.value.expression ?? "" ).trim().length === 0 ){
		return "Enter a formula before previewing."
	}
	if( previewModel.value.operands.length === 0 ){
		return "Use at least one reference such as D_{1} or D(value)."
	}
	return ""
})

const profileStepDisabledReason = computed(() => {
	if( formulaWasPreviewed.value ){
		return ""
	}
	return "Preview the custom index before continuing to profile saving."
})

const saveDisabledReason = computed(() => {
	if( props.saving || props.previewing ){
		return "Profile save is already running."
	}
	if( formulaWasPreviewed.value === false ){
		return "Preview the current formula before saving it as a profile."
	}
	if( normalizedOutputLabel.value.length === 0 ){
		return "Output label is required."
	}
	if( normalizedFriendlyName.value.length === 0 ){
		return "Profile name is required."
	}
	if( profileNameConflict.value ){
		return "Custom index profile names must be unique."
	}
	return ""
})

const visibleValidationMessage = computed(() => {
	if( props.saving || props.previewing ){
		return ""
	}

	return activeStep.value === "preview"
		? ""
		: saveDisabledReason.value
})

const canPreview = computed(() => previewDisabledReason.value.length === 0)
const canOpenProfileStep = computed(() => profileStepDisabledReason.value.length === 0)
const canSave = computed(() => saveDisabledReason.value.length === 0)
const hasFormulaInput = computed(() => String( expression.value ?? "" ).trim().length > 0 )

const renderedFormula = computed(() => {
	if( hasFormulaInput.value === false ){
		return ""
	}
	try{
		const latex = expressionToLatex( expression.value, symbolSettings.value )
		return katex.renderToString( latex, {
			throwOnError: false,
			displayMode: true
		})
	} catch{
		return String( expression.value ?? "" )
	}
})

const stepBadgeClass = ( step ) => {
	return [
		"rounded-full border px-2 py-0.5 font-medium",
		activeStep.value === step
			? "border-brand/70 bg-brand/15 text-white"
			: "border-white/10 bg-white/5 text-white/55"
	]
}

const open = async ( defaults = {} ) => {
	const model = defaults?.model ?? {}
	expression.value = String( model?.expression ?? defaults?.expression ?? "" ).trim()
	outputLabel.value = String( model?.outputLabel ?? defaults?.outputLabel ?? "" ).trim()
	outputUnit.value = String( model?.outputUnit ?? defaults?.outputUnit ?? "" ).trim()
	friendlyName.value = String( defaults?.friendlyName ?? "" ).trim()
	description.value = String( defaults?.description ?? "" ).trim()
	activeStep.value = "preview"
	isOpen.value = true
	await nextTick()
	expressionInput.value?.focus?.()
}

const close = () => {
	isOpen.value = false
}

const emitPreview = () => {
	if( canPreview.value === false ){
		return
	}
	emit( "preview", previewModel.value )
}

const emitSave = () => {
	if( canSave.value === false ){
		return
	}
	emit( "save", {
		friendlyName: normalizedFriendlyName.value,
		description: String( description.value ?? "" ).trim(),
		model: saveModel.value
	})
}

defineExpose({ open, close })
</script>
