<template>
<Modal ref = "modal" :title = "'Axis values and units'" :showClose = "!saving">
	<template #main>
		<p class = "text-white mb-4">
			Configure axis values and units used in hyperspectral visualizations.
		</p>

		<div class = "space-y-4">
			<div v-for = "axisKey in axisKeys"
				 :key = "axisKey"
				 class = "rounded-lg border border-brand bg-black/10 p-4">
				<div class = "flex items-center justify-between mb-3">
					<h4 class = "text-white font-semibold">
						{{ axisLabels[axisKey] }} axis
					</h4>
					<span class = "text-xs text-white/80">
						{{ axisState[axisKey].length }} values
					</span>
				</div>

				<label :for = "axisKey + '-unit'" class = "block text-sm font-semibold text-white mb-1">
					Unit
				</label>
				<select :id = "axisKey + '-unit'"
						v-model = "axisState[axisKey].unit"
						class = "w-full rounded border border-gray-600 px-2 py-1 text-black bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand">
					<option v-for = "unitOption in axisUnitOptions(axisKey)"
							:key = "axisKey + '-unit-' + unitOption"
							:value = "unitOption">
						{{ unitOption }}
					</option>
				</select>

				<label :for = "axisKey + '-mode'" class = "block text-sm font-semibold text-white mt-3 mb-1">
					Value construction
				</label>
				<select :id = "axisKey + '-mode'"
						v-model = "axisState[axisKey].mode"
						class = "w-full rounded border border-gray-600 px-2 py-1 text-black bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand">
					<option value = "minmax">Minimum and maximum</option>
					<option value = "step">Step size (minimum fixed to 0)</option>
				</select>

				<div v-if = "axisState[axisKey].mode === 'minmax'" class = "grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
					<div>
						<label :for = "axisKey + '-min'" class = "block text-sm font-semibold text-white mb-1">
							Minimum
						</label>
						<input :id = "axisKey + '-min'"
							   v-model.number = "axisState[axisKey].min"
							   type = "number"
							   step = "any"
							   class = "w-full rounded border border-gray-600 px-2 py-1 text-black bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand"/>
					</div>
					<div>
						<label :for = "axisKey + '-max'" class = "block text-sm font-semibold text-white mb-1">
							Maximum
						</label>
						<input :id = "axisKey + '-max'"
							   v-model.number = "axisState[axisKey].max"
							   type = "number"
							   step = "any"
							   class = "w-full rounded border border-gray-600 px-2 py-1 text-black bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand"/>
					</div>
				</div>

				<div v-else class = "mt-3">
					<label :for = "axisKey + '-step'" class = "block text-sm font-semibold text-white mb-1">
						Step size
					</label>
					<input :id = "axisKey + '-step'"
						   v-model.number = "axisState[axisKey].step"
						   type = "number"
						   step = "any"
						   class = "w-full rounded border border-gray-600 px-2 py-1 text-black bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand"/>
				</div>

				<p class = "text-xs text-white/80 mt-3">
					Preview: {{ axisPreviewText(axisKey) }}
				</p>
			</div>
		</div>
	</template>

	<template #footer>
		<hr class = "h-0.5 mt-4 bg-gray border-0">
		<button @click = "emitSave"
				:disabled = "!canSave"
				class = "w-full mt-4 mb-4 bg-brand hover:bg-brand-dark text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
			{{ saving ? "Saving..." : "Save axis values" }}
		</button>
	</template>
</Modal>
</template>

<script setup>

import { computed, reactive, ref } from "vue"

import Modal from "./Modal.vue"

const props = defineProps({
	saving: { type: Boolean, default: false }
})

const emit = defineEmits([ "save" ])

const modal = ref(null)

const axisKeys = [ "x", "y", "z" ]
const axisLabels = {
	x: "X",
	y: "Y",
	z: "Z"
}
const defaultUnits = {
	x: "index",
	y: "index",
	z: "index"
}
const unitCandidates = [
	"index",
	"pixel",
	"micrometer",
	"um",
	"nm",
	"mm",
	"cm",
	"m",
	"cm-1",
	"a.u."
]

const axisState = reactive({
	x: createAxisState(),
	y: createAxisState(),
	z: createAxisState()
})

const canSave = computed(() => {
	if( props.saving ) return false

	for( const axisKey of axisKeys ){
		const axis = axisState[axisKey]
		if( Number.isInteger( axis.length ) === false || axis.length <= 0 ) return false
		if( axis.mode === "minmax" ){
			if( Number.isFinite( Number( axis.min )) === false ) return false
			if( Number.isFinite( Number( axis.max )) === false ) return false
		} else {
			if( Number.isFinite( Number( axis.step )) === false ) return false
		}
	}

	return true
})

function createAxisState(){
	return {
		length: 1,
		mode: "minmax",
		min: 0,
		max: 0,
		step: 1,
		unit: "index"
	}
}

function initializeAxisState( axisKey, xyz ){

	const rawValues = Array.isArray( xyz?.[axisKey] ) ? xyz[axisKey] : []
	const length = rawValues.length > 0 ? rawValues.length : 1

	const firstValue = Number( rawValues[0] )
	const lastRawValue = Number( rawValues[ Math.max( 0, length - 1 ) ] )
	const minValue = Number.isFinite( firstValue ) ? firstValue : 0
	const maxValue = Number.isFinite( lastRawValue )
		? lastRawValue
		: ( length > 1 ? ( minValue + length - 1 ) : minValue )
	const stepValue = length > 1
		? ( maxValue - minValue ) / ( length - 1 )
		: 1

	const unitKey = axisKey + "Unit"
	const unit = typeof xyz?.[unitKey] === "string" && xyz[unitKey].trim().length > 0
		? xyz[unitKey].trim()
		: defaultUnits[axisKey]

	axisState[axisKey].length = length
	axisState[axisKey].mode = "minmax"
	axisState[axisKey].min = minValue
	axisState[axisKey].max = maxValue
	axisState[axisKey].step = Number.isFinite( stepValue ) ? stepValue : 1
	axisState[axisKey].unit = unit
}

function axisUnitOptions( axisKey ){

	const current = String( axisState[axisKey].unit ?? "" ).trim()
	if( current.length === 0 ){
		return [ ...unitCandidates ]
	}

	if( unitCandidates.includes( current ) ){
		return [ ...unitCandidates ]
	}

	return [ current, ...unitCandidates ]
}

function buildAxisValues( axisKey ){

	const axis = axisState[axisKey]
	const length = Math.max( 1, Number.parseInt( axis.length, 10 ) || 1 )
	const mode = axis.mode === "step" ? "step" : "minmax"

	if( mode === "step" ){
		const step = Number( axis.step )
		const safeStep = Number.isFinite( step ) ? step : 1
		var stepValues = []
		for( var index = 0; index < length; index++ ){
			stepValues.push( index * safeStep )
		}
		return stepValues
	}

	const minValue = Number( axis.min )
	const maxValue = Number( axis.max )
	const safeMin = Number.isFinite( minValue ) ? minValue : 0
	const safeMax = Number.isFinite( maxValue ) ? maxValue : safeMin

	if( length <= 1 ){
		return [ safeMin ]
	}

	const step = ( safeMax - safeMin ) / ( length - 1 )
	var values = []
	for( var index = 0; index < length; index++ ){
		values.push( safeMin + step * index )
	}

	return values
}

function formatPreviewNumber( value ){
	if( Number.isFinite( value ) === false ) return "NaN"
	if( Math.abs( value ) >= 1e4 || ( Math.abs( value ) > 0 && Math.abs( value ) < 1e-3 ) ){
		return value.toExponential( 3 )
	}
	return value.toFixed( 6 ).replace(/\.?0+$/, "" )
}

function axisPreviewText( axisKey ){

	const values = buildAxisValues( axisKey )
	const length = values.length
	const first = length > 0 ? values[0] : 0
	const last = length > 0 ? values[length - 1] : 0

	return formatPreviewNumber( first ) + " ... " + formatPreviewNumber( last ) + " (" + length + " values)"
}

const open = async ( xyz = null ) => {

	const source = xyz !== null && typeof xyz === "object" ? xyz : {}

	for( const axisKey of axisKeys ){
		initializeAxisState( axisKey, source )
	}

	await modal.value?.open()
}

const close = () => modal.value?.close()

const emitSave = () => {

	if( canSave.value === false ) return

	var payload = {}

	for( const axisKey of axisKeys ){
		payload[axisKey] = buildAxisValues( axisKey )
		payload[axisKey + "Unit"] = axisState[axisKey].unit
	}

	emit( "save", payload )
}

defineExpose({ open, close })

</script>
