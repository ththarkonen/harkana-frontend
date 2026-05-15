<template>
	<div v-if = "modelValue"
		 ref = "panel"
		 class = "fixed z-[140] h-[min(34rem,calc(100vh-1rem))] w-[min(32rem,calc(100vw-1rem))] overflow-hidden rounded-lg border border-gray bg-dark-gray shadow-2xl flex flex-col"
		 :style = "panelStyles"
		 @keydown.esc.stop.prevent = "close">

		<header class = "flex items-start justify-between gap-3 border-b border-gray bg-gray-800/80 px-4 py-3 cursor-move select-none"
				@mousedown = "startDragging">
			<div class = "min-w-0">
				<h3 class = "truncate text-sm font-semibold text-white">Calibration points</h3>
				<p class = "truncate text-xs text-white/70">{{ subtitle }}</p>
			</div>

			<button class = "inline-flex h-8 w-8 items-center justify-center rounded-md text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand"
					title = "Close calibration panel"
					aria-label = "Close calibration panel"
					@mousedown.stop
					@click = "close">
				<i class = "fas fa-times" aria-hidden = "true"></i>
			</button>
		</header>

		<div class = "flex-1 min-h-0 flex flex-col bg-gray-800/40">
			<div class = "shrink-0 px-4 py-4 space-y-4">
			<p class = "text-xs leading-snug text-white/70">
				{{ descriptionText }}
			</p>

				<div class = "flex items-center gap-3">
					<button type = "button"
							@click = "$emit( 'apply-calibration' )"
							:disabled = "canApply === false"
							class = "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-brand/35 text-white transition hover:border-brand hover:bg-brand hover:text-white focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-brand/35 disabled:hover:bg-transparent disabled:hover:text-white"
							title = "Apply calibration preview"
							aria-label = "Apply calibration preview">
						<i class = "fas fa-wand-magic-sparkles" aria-hidden = "true"></i>
					</button>

					<button type = "button"
							@click = "$emit( 'save-profile' )"
							:disabled = "canSaveProfile === false || savingProfile"
							:title = "saveDisabledReason || 'Save calibration profile'"
							class = "relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-brand/35 text-white transition hover:border-brand hover:bg-brand hover:text-white focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-brand/35 disabled:hover:bg-transparent disabled:hover:text-white"
							aria-label = "Save calibration profile">
						<span class = "inline-flex h-4 w-4 items-center justify-center"
							  :class = "{ invisible: savingProfile }">
							<i class = "fas fa-save" aria-hidden = "true"></i>
						</span>
						<span v-if = "savingProfile"
							  class = "absolute inset-0 flex items-center justify-center">
							<Spinner class = "h-4 w-4 text-brand"></Spinner>
						</span>
					</button>

					<div class = "shrink-0">
						<div class = "text-xs font-semibold uppercase tracking-wide text-white/70">
							Polynomial order
						</div>
						<p class = "mt-1 text-[11px] text-white/55">
							Maximum order: {{ maxPolynomialOrder }}
						</p>
					</div>

					<label class = "min-w-0 flex-1">
						<input :value = "polynomialOrder"
							   type = "number"
							   min = "0"
							   :max = "maxPolynomialOrder"
							   inputmode = "numeric"
							   class = "calibration-input calibration-order-input h-9 w-full border-0 border-b border-white/20 bg-transparent px-0 py-1 text-sm font-medium text-white focus:border-brand focus:outline-none focus-visible:border-brand"
							   @input = "updatePolynomialOrder">
					</label>
				</div>

				<div class = "flex flex-wrap items-center gap-x-4 gap-y-2">
					<div class = "text-xs font-semibold uppercase tracking-wide text-white/70">
						Included orders
					</div>

					<label v-for = "order in orderOptions"
						   :key = "`calibration-order-${order}`"
						   class = "inline-flex items-center gap-2 text-sm text-white/80">
						<input type = "checkbox"
							   class = "h-4 w-4 rounded border border-brand/50 accent-brand focus:ring-brand disabled:cursor-not-allowed disabled:opacity-70"
							   :checked = "isOrderChecked( order )"
							   :disabled = "isOrderLocked( order )"
							   @change = "toggleOrder( order )">
						<span>Order {{ order }}</span>
					</label>
				</div>

			</div>

			<div v-if = "points.length === 0"
				 class = "flex min-h-0 flex-1 items-center justify-center px-4 pb-4 text-center text-sm text-white/60">
				No calibration points selected yet.
			</div>

				<div v-else class = "min-h-0 flex-1 overflow-y-auto px-4 pb-4 space-y-2">
				<div v-for = "( point, index ) in points"
					 :key = "point.id"
					 class = "rounded-lg border px-3 py-2 transition"
					 :class = "point.id === focusedPointId ? 'border-brand/70 bg-brand/10' : 'border-white/10 bg-white/5'">
					<div class = "flex items-center gap-3 text-sm text-white/80">
						<div class = "shrink-0 text-[11px] font-semibold uppercase tracking-wide text-white/50">
							Point {{ index + 1 }}
						</div>
						<div class = "shrink-0 text-white/80">
							Location: <span class = "font-semibold text-white">{{ formatNumber( point.sourceX ) }}</span>
						</div>
						<label class = "min-w-0 flex flex-1 items-center gap-2">
							<span class = "shrink-0 text-white/70">True location:</span>
							<input :value = "point.targetInput"
								   type = "number"
								   inputmode = "decimal"
								   class = "calibration-input calibration-point-input min-w-0 flex-1 border-0 border-b border-white/20 bg-transparent px-0 py-1 text-sm font-medium text-white focus:border-brand focus:outline-none focus-visible:border-brand"
								   @focus = "$emit( 'focus-point', point.id )"
								   @blur = "$emit( 'focus-point', '' )"
								   @input = "updatePointTarget( point.id, $event )">
						</label>
						<button type = "button"
								class = "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/70 transition hover:bg-white/10 hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand"
								title = "Remove calibration point"
								aria-label = "Remove calibration point"
								@click = "$emit( 'remove-point', point.id )">
							<i class = "fas fa-trash" aria-hidden = "true"></i>
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed, ref, watch, onBeforeUnmount } from "vue"
import Spinner from "../general/Spinner.vue"

const WINDOW_MARGIN = 8

const props = defineProps({
	modelValue: { type: Boolean, default: false },
	project: { type: Object, default: () => ({}) },
	anchorElement: { type: Object, default: null },
	points: { type: Array, default: () => [] },
	polynomialOrder: { type: Number, default: 0 },
	includedOrders: { type: Array, default: () => [ 0 ] },
	maxPolynomialOrder: { type: Number, default: 0 },
	focusedPointId: { type: String, default: "" },
	canApply: { type: Boolean, default: false },
	canSaveProfile: { type: Boolean, default: false },
	savingProfile: { type: Boolean, default: false },
	saveDisabledReason: { type: String, default: "" },
	descriptionText: {
		type: String,
		default: "Click measurement or estimate traces to add points. Preview the current calibration here, save the previewed profile beside it, and assign the selected saved profile from the sidebar."
	}
})

const emit = defineEmits([
	"update:modelValue",
	"update:point-target",
	"update:polynomial-order",
	"toggle-order",
	"apply-calibration",
	"save-profile",
	"remove-point",
	"focus-point"
])

const panel = ref(null)
const panelPosition = ref({ left: WINDOW_MARGIN, top: WINDOW_MARGIN })
const hasInitializedPosition = ref(false)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

const subtitle = computed(() => {
	const projectName = String( props.project?.name ?? props.project?.id ?? "" ).trim()
	return projectName.length > 0 ? projectName : "Current project"
})

const orderOptions = computed(() => {
	const polynomialOrder = Math.max( Math.trunc( Number( props.polynomialOrder ) ), 0 )
	return Array.from({ length: polynomialOrder + 1 }, ( _, index ) => index )
})

const includedOrderSet = computed(() => {
	return new Set(
		( Array.isArray( props.includedOrders ) ? props.includedOrders : [] )
			.map(( order ) => Math.trunc( Number( order ) ) )
			.filter(( order ) => Number.isInteger( order ) && order >= 0 && order <= props.polynomialOrder )
	)
})

const panelStyles = computed(() => ({
	left: `${panelPosition.value.left}px`,
	top: `${panelPosition.value.top}px`
}))

const clampPosition = ( nextLeft, nextTop ) => {
	const panelWidth = panel.value?.offsetWidth ?? 512
	const panelHeight = panel.value?.offsetHeight ?? 544
	const maxLeft = Math.max( WINDOW_MARGIN, window.innerWidth - panelWidth - WINDOW_MARGIN )
	const maxTop = Math.max( WINDOW_MARGIN, window.innerHeight - panelHeight - WINDOW_MARGIN )

	return {
		left: Math.min( Math.max( nextLeft, WINDOW_MARGIN ), maxLeft ),
		top: Math.min( Math.max( nextTop, WINDOW_MARGIN ), maxTop )
	}
}

const initializePosition = () => {
	if( hasInitializedPosition.value ){
		return
	}

	const anchorRect = typeof props.anchorElement?.getBoundingClientRect === "function"
		? props.anchorElement.getBoundingClientRect()
		: null
	const sidebarRect = typeof props.anchorElement?.closest === "function"
		? props.anchorElement.closest( "aside" )?.getBoundingClientRect?.() ?? null
		: null

	if( anchorRect !== null ){
		const dividerGap = sidebarRect !== null
			? Math.max( sidebarRect.right - anchorRect.right, WINDOW_MARGIN )
			: WINDOW_MARGIN
		panelPosition.value = clampPosition(
			( sidebarRect?.right ?? anchorRect.right ) + dividerGap,
			anchorRect.top
		)
	}else{
		const panelWidth = panel.value?.offsetWidth ?? 512
		panelPosition.value = clampPosition(
			window.innerWidth - panelWidth - WINDOW_MARGIN,
			WINDOW_MARGIN
		)
	}

	hasInitializedPosition.value = true
}

const close = () => {
	hasInitializedPosition.value = false
	emit( "focus-point", "" )
	emit( "update:modelValue", false )
}

const formatNumber = ( value ) => {
	const numericValue = Number( value )
	if( Number.isFinite( numericValue ) === false ){
		return ""
	}

	return numericValue.toLocaleString( undefined, { maximumFractionDigits: 6 } )
}

const updatePointTarget = ( pointID, event ) => {
	emit( "update:point-target", {
		id: pointID,
		value: event?.target?.value ?? ""
	} )
}

const updatePolynomialOrder = ( event ) => {
	emit( "update:polynomial-order", event?.target?.value ?? "0" )
}

const isOrderLocked = ( order ) => {
	return Number( order ) === Number( props.polynomialOrder )
}

const isOrderChecked = ( order ) => {
	return includedOrderSet.value.has( Number( order ) )
}

const toggleOrder = ( order ) => {
	if( isOrderLocked( order ) ){
		return
	}

	emit( "toggle-order", order )
}

const stopDragging = () => {
	isDragging.value = false
	window.removeEventListener( "mousemove", handleDragging )
	window.removeEventListener( "mouseup", stopDragging )
}

const handleDragging = ( event ) => {
	if( isDragging.value === false ){
		return
	}

	panelPosition.value = clampPosition(
		event.clientX - dragOffset.value.x,
		event.clientY - dragOffset.value.y
	)
}

const startDragging = ( event ) => {
	if( event.button !== 0 ){
		return
	}

	const panelRect = panel.value?.getBoundingClientRect()
	if( panelRect === undefined ){
		return
	}

	isDragging.value = true
	dragOffset.value = {
		x: event.clientX - panelRect.left,
		y: event.clientY - panelRect.top
	}

	window.addEventListener( "mousemove", handleDragging )
	window.addEventListener( "mouseup", stopDragging )
}

watch(() => props.modelValue, ( isOpen ) => {
	if( isOpen ){
		requestAnimationFrame(() => {
			initializePosition()
		})
	}else{
		hasInitializedPosition.value = false
	}
})

onBeforeUnmount(() => {
	stopDragging()
})
</script>

<style scoped>
.calibration-input[type="number"] {
	appearance: textfield;
	-moz-appearance: textfield;
}

.calibration-point-input::-webkit-outer-spin-button,
.calibration-point-input::-webkit-inner-spin-button {
	-webkit-appearance: none;
	appearance: none;
	display: none;
	margin: 0;
}

.calibration-order-input[type="number"] {
	appearance: auto;
	-moz-appearance: auto;
	color-scheme: dark;
}

.calibration-order-input::-webkit-outer-spin-button,
.calibration-order-input::-webkit-inner-spin-button {
	background: transparent;
	margin: 0;
	opacity: 1;
}
</style>
