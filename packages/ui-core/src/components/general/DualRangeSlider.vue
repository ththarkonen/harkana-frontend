<template>
	<div class = "relative h-8 w-full select-none"
		 :style = "{ '--dual-range-color': color }"
		 @mouseenter = "hovered = true"
		 @mouseleave = "hovered = false">
		<div class = "pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/15"></div>
		<div class = "pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full"
			 :style = "activeTrackStyle"></div>

		<div v-if = "showValuesOnHover && hovered" class = "pointer-events-none absolute inset-x-0 -top-7">
			<span class = "dual-range-badge" :style = "badgeStyle( lowerPercent )">
				{{ formattedLowerValue }}
			</span>
			<span class = "dual-range-badge" :style = "badgeStyle( upperPercent )">
				{{ formattedUpperValue }}
			</span>
		</div>

		<input
			:value = "normalizedLowerValue"
			type = "range"
			:min = "min"
			:max = "max"
			:step = "step"
			@pointerdown = "activeHandle = 'min'"
			@pointerup = "clearActiveHandle"
			@pointercancel = "clearActiveHandle"
			@input = "updateLowerValue"
			class = "dual-range-input absolute inset-0 h-8 w-full"
			:class = "activeHandle === 'min' ? 'z-20' : 'z-10'"
		/>
		<input
			:value = "normalizedUpperValue"
			type = "range"
			:min = "min"
			:max = "max"
			:step = "step"
			@pointerdown = "activeHandle = 'max'"
			@pointerup = "clearActiveHandle"
			@pointercancel = "clearActiveHandle"
			@input = "updateUpperValue"
			class = "dual-range-input absolute inset-0 h-8 w-full"
			:class = "activeHandle === 'max' ? 'z-20' : 'z-10'"
		/>
	</div>
</template>

<script setup>

import { computed, ref, watch, onBeforeUnmount } from "vue"

const props = defineProps({
	min: {
		type: Number,
		default: 0
	},
	max: {
		type: Number,
		default: 1
	},
	step: {
		type: Number,
		default: 0.01
	},
	minValue: {
		type: Number,
		default: 0
	},
	maxValue: {
		type: Number,
		default: 1
	},
	color: {
		type: String,
		default: "#3b82f6"
	},
	showValuesOnHover: {
		type: Boolean,
		default: true
	}
})

const emit = defineEmits([ "update:minValue", "update:maxValue" ])

const hovered = ref(false)
const activeHandle = ref(null)

const clampValue = ( value ) => {

	const numeric = Number( value )
	if( Number.isFinite( numeric ) === false ){
		return props.min
	}

	return Math.max( props.min, Math.min( props.max, numeric ))
}

const normalizedPropLowerValue = computed(() => {
	return Math.min( clampValue( props.minValue ), clampValue( props.maxValue ))
})

const normalizedPropUpperValue = computed(() => {
	return Math.max( clampValue( props.minValue ), clampValue( props.maxValue ))
})

const internalLowerValue = ref( normalizedPropLowerValue.value )
const internalUpperValue = ref( normalizedPropUpperValue.value )

watch(
	() => [ props.min, props.max, props.minValue, props.maxValue ],
	() => {
		internalLowerValue.value = normalizedPropLowerValue.value
		internalUpperValue.value = normalizedPropUpperValue.value
	}
)

const normalizedLowerValue = computed(() => {
	return Math.min( clampValue( internalLowerValue.value ), clampValue( internalUpperValue.value ))
})

const normalizedUpperValue = computed(() => {
	return Math.max( clampValue( internalLowerValue.value ), clampValue( internalUpperValue.value ))
})

const span = computed(() => {
	return Math.max( Number( props.max ) - Number( props.min ), 1e-9 )
})

const lowerPercent = computed(() => {
	return (( normalizedLowerValue.value - Number( props.min )) / span.value ) * 100
})

const upperPercent = computed(() => {
	return (( normalizedUpperValue.value - Number( props.min )) / span.value ) * 100
})

const activeTrackStyle = computed(() => {
	return {
		left: `${lowerPercent.value}%`,
		width: `${Math.max( upperPercent.value - lowerPercent.value, 0 )}%`,
		backgroundColor: props.color
	}
})

const formatDisplayedValue = ( value ) => {
	const magnitude = Math.abs( Number( value ) || 0 )
	if( magnitude >= 1000 ){
		return Math.round( value ).toString()
	}
	if( magnitude >= 100 ){
		return value.toFixed( 1 )
	}

	return value.toFixed( 2 )
}

const formattedLowerValue = computed(() => {
	return formatDisplayedValue( normalizedLowerValue.value )
})

const formattedUpperValue = computed(() => {
	return formatDisplayedValue( normalizedUpperValue.value )
})

const badgeStyle = ( percent ) => {
	return {
		left: `${Math.max( 0, Math.min( 100, Number( percent ) || 0 ))}%`
	}
}

const clearActiveHandle = () => {
	activeHandle.value = null
}

const updateLowerValue = ( event ) => {
	const nextValue = clampValue( event?.target?.value )
	const nextLowerValue = Math.min( nextValue, normalizedUpperValue.value )
	internalLowerValue.value = nextLowerValue
	emit("update:minValue", nextLowerValue )
}

const updateUpperValue = ( event ) => {
	const nextValue = clampValue( event?.target?.value )
	const nextUpperValue = Math.max( nextValue, normalizedLowerValue.value )
	internalUpperValue.value = nextUpperValue
	emit("update:maxValue", nextUpperValue )
}

if( typeof window !== "undefined" ){
	window.addEventListener( "pointerup", clearActiveHandle )
}

onBeforeUnmount(() => {
	if( typeof window !== "undefined" ){
		window.removeEventListener( "pointerup", clearActiveHandle )
	}
})

</script>

<style scoped>
.dual-range-input {
	-webkit-appearance: none;
	appearance: none;
	background: transparent;
	pointer-events: none;
}

.dual-range-input::-webkit-slider-runnable-track {
	height: 1.5rem;
	background: transparent;
}

.dual-range-input::-webkit-slider-thumb {
	-webkit-appearance: none;
	appearance: none;
	pointer-events: auto;
	height: 0.875rem;
	width: 0.875rem;
	margin-top: 0.3125rem;
	border-radius: 9999px;
	border: 2px solid rgba(255, 255, 255, 0.95);
	background: var(--dual-range-color);
	box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
	cursor: ew-resize;
}

.dual-range-input::-moz-range-track {
	height: 1.5rem;
	background: transparent;
	border: 0;
}

.dual-range-input::-moz-range-thumb {
	pointer-events: auto;
	height: 0.875rem;
	width: 0.875rem;
	border-radius: 9999px;
	border: 2px solid rgba(255, 255, 255, 0.95);
	background: var(--dual-range-color);
	box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
	cursor: ew-resize;
}

.dual-range-badge {
	position: absolute;
	transform: translateX(-50%);
	border-radius: 0.25rem;
	border: 1px solid rgba(255, 255, 255, 0.16);
	background: rgba(17, 24, 39, 0.95);
	padding: 0.125rem 0.375rem;
	font-size: 0.6875rem;
	font-weight: 600;
	line-height: 1;
	color: white;
	white-space: nowrap;
}
</style>
