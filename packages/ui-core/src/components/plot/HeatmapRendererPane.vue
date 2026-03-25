<template>
	<div ref = "root"
		 v-show = "isVisible"
		 class = "absolute z-10 overflow-hidden rounded-sm"
		 :style = "rootStyle"
		 @pointerdown = "handlePointerDown"
		 @pointermove = "handlePointerMove"
		 @pointerup = "handlePointerUp"
		 @dblclick = "handleDoubleClick"
		 @pointercancel = "cancelSelection"
		 @pointerleave = "handlePointerLeave"
		 @lostpointercapture = "cancelSelection">
		<div ref = "deckContainer" class = "absolute inset-0"></div>

		<svg class = "pointer-events-none absolute inset-0 h-full w-full">
			<template v-for = "overlay in projectedOverlays" :key = "overlay.key">
				<rect :x = "overlay.left"
					  :y = "overlay.top"
					  :width = "overlay.width"
					  :height = "overlay.height"
					  :fill = "overlay.fillColor"
					  :stroke = "overlay.boxColor"
					  stroke-width = "2"></rect>
			</template>

			<rect v-if = "selectionPreviewRect"
				  :x = "selectionPreviewRect.left"
				  :y = "selectionPreviewRect.top"
				  :width = "selectionPreviewRect.width"
				  :height = "selectionPreviewRect.height"
				  fill = "rgba(156, 163, 175, 0.12)"
				  stroke = "#9ca3af"
				  stroke-width = "2"
				  stroke-dasharray = "4 2"></rect>
		</svg>

		<div v-for = "overlay in titledOverlays"
			 :key = "overlay.key"
			 class = "pointer-events-none absolute rounded-sm border px-1.5 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap"
			 :style = "overlay.labelStyle">
			{{ overlay.name }}
		</div>

		<div v-if = "hoverTooltip"
			 ref = "hoverTooltipElement"
			 class = "pointer-events-none absolute z-30 rounded-sm border border-gray bg-white/95 px-1.5 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap text-black shadow-sm"
			 :style = "hoverTooltip.style">
			{{ hoverTooltip.label }}
		</div>
	</div>
</template>

<script setup>

import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { heatmapRenderer } from "@harkana/plot"

const props = defineProps({
	rendererMode: {
		type: String,
		default: "plotly"
	},
	payload: {
		type: Object,
		default: null
	},
	paneState: {
		type: Object,
		default: null
	},
	interactionMode: {
		type: String,
		default: "select"
	},
	lockSquareZoom: {
		type: Boolean,
		default: true
	},
	overlays: {
		type: Array,
		default: () => []
	},
	viewMode: {
		type: String,
		default: ""
	},
	benchmarkToken: {
		type: Number,
		default: 0
	}
})

const emit = defineEmits([ "point-select", "region-select", "zoom-range", "reset-zoom", "render-timing" ])

const root = ref( null )
const deckContainer = ref( null )
const hoverTooltipElement = ref( null )

let renderer = null
let renderRequestId = 0

const dragState = ref( null )
const hoverState = ref( null )
const hoverTooltipSize = ref({
	width: 0,
	height: 0
})

const isVisible = computed(() => {
	return props.rendererMode === "deckgl" &&
		props.payload !== null &&
		props.paneState !== null
})

const paneStyle = computed(() => {

	const pixelBounds = props.paneState?.pixelBounds ?? {}
	const left = Number( pixelBounds.left ) || 0
	const top = Number( pixelBounds.top ) || 0
	const width = Math.max( 0, Number( pixelBounds.width ) || 0 )
	const height = Math.max( 0, Number( pixelBounds.height ) || 0 )

	return {
		left: `${left}px`,
		top: `${top}px`,
		width: `${width}px`,
		height: `${height}px`
	}
})

const rootStyle = computed(() => {
	return {
		...paneStyle.value,
		cursor: props.interactionMode === "zoom" ? "zoom-in" : "crosshair"
	}
})

const projectedOverlays = computed(() => {

	if( isVisible.value === false ){
		return []
	}

	return ( Array.isArray( props.overlays ) ? props.overlays : [] )
		.map(( overlay, index ) => projectOverlay( overlay, index ))
		.filter(( overlay ) => overlay !== null )
})

const titledOverlays = computed(() => {
	return projectedOverlays.value
		.filter(( overlay ) => overlay.showTitle && overlay.name.length > 0 )
		.map(( overlay ) => {
			return {
				...overlay,
				labelStyle: {
					left: `${overlay.labelLeft}px`,
					top: `${overlay.labelTop}px`,
					transform: "translate(-50%, calc(-100% - 6px))",
					color: overlay.titleColor,
					backgroundColor: overlay.labelBackground,
					borderColor: overlay.titleColor
				}
			}
		})
})

const selectionPreviewRect = computed(() => {

	const selection = dragState.value
	if( selection === null || selection.current === null ){
		return null
	}

	const left = Math.min( selection.start.x, selection.current.x )
	const top = Math.min( selection.start.y, selection.current.y )
	const width = Math.abs( selection.current.x - selection.start.x )
	const height = Math.abs( selection.current.y - selection.start.y )

	if( width < 1 && height < 1 ){
		return null
	}

	return { left, top, width, height }
})

const hoverTooltip = computed(() => {

	const hover = hoverState.value
	if( hover === null ) return null

	const label = `(${hover.x}, ${hover.y})`
	const { width, height } = paneDimensions()
	const tooltipPaddingPx = 10
	const tooltipOffsetPx = 8
	const edgePaddingPx = 6
	const approximateCharacterWidthPx = 7
	const approximateTooltipWidth = ( label.length * approximateCharacterWidthPx ) + ( tooltipPaddingPx * 2 )
	const tooltipWidth = Math.max( approximateTooltipWidth, Number( hoverTooltipSize.value.width ) || 0 )
	const tooltipHeight = Math.max( 22, Number( hoverTooltipSize.value.height ) || 0 )
	const fitsRight = ( hover.left + tooltipOffsetPx + tooltipWidth ) <= ( width - edgePaddingPx )
	const fitsLeft = ( hover.left - tooltipOffsetPx - tooltipWidth ) >= edgePaddingPx
	const fitsAbove = ( hover.top - tooltipOffsetPx - tooltipHeight ) >= edgePaddingPx
	const fitsBelow = ( hover.top + tooltipOffsetPx + tooltipHeight ) <= ( height - edgePaddingPx )
	const placeLeft = fitsRight === false && fitsLeft === true
	const placeBelow = fitsAbove === false && fitsBelow === true
	const clampHorizontally = fitsRight === false && fitsLeft === false
	const clampVertically = fitsAbove === false && fitsBelow === false

	const left = clampHorizontally
		? clamp( hover.left - ( tooltipWidth / 2 ), edgePaddingPx, Math.max( edgePaddingPx, width - tooltipWidth - edgePaddingPx ))
		: hover.left
	const top = clampVertically
		? clamp( hover.top - ( tooltipHeight / 2 ), edgePaddingPx, Math.max( edgePaddingPx, height - tooltipHeight - edgePaddingPx ))
		: hover.top

	const transformX = clampHorizontally
		? "translateX(0)"
		: ( placeLeft ? `translateX(calc(-100% - ${tooltipOffsetPx}px))` : `translateX(${tooltipOffsetPx}px)` )
	const transformY = clampVertically
		? "translateY(0)"
		: ( placeBelow ? `translateY(${tooltipOffsetPx}px)` : `translateY(calc(-100% - ${tooltipOffsetPx}px))` )

	return {
		label,
		style: {
			left: `${left}px`,
			top: `${top}px`,
			transform: `${transformX} ${transformY}`
		}
	}
})

function measureHoverTooltip(){

	const element = hoverTooltipElement.value
	if( element === null ){
		hoverTooltipSize.value = {
			width: 0,
			height: 0
		}
		return
	}

	hoverTooltipSize.value = {
		width: Number( element.offsetWidth ) || 0,
		height: Number( element.offsetHeight ) || 0
	}
}

function clamp( value, minimum, maximum ){
	return Math.min( maximum, Math.max( minimum, value ))
}

function colorWithAlpha( color, alpha ){

	const normalized = String( color ?? "" ).trim()
	if( normalized.length === 0 ){
		return `rgba(156, 163, 175, ${alpha})`
	}

	const rgbMatch = normalized.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i)
	if( rgbMatch !== null ){
		return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`
	}

	const hexMatch = normalized.match(/^#([0-9a-f]{6})$/i)
	if( hexMatch !== null ){
		const red = Number.parseInt( hexMatch[1].slice( 0, 2 ), 16 )
		const green = Number.parseInt( hexMatch[1].slice( 2, 4 ), 16 )
		const blue = Number.parseInt( hexMatch[1].slice( 4, 6 ), 16 )
		return `rgba(${red}, ${green}, ${blue}, ${alpha})`
	}

	const shortHexMatch = normalized.match(/^#([0-9a-f]{3})$/i)
	if( shortHexMatch !== null ){
		const red = Number.parseInt( shortHexMatch[1][0] + shortHexMatch[1][0], 16 )
		const green = Number.parseInt( shortHexMatch[1][1] + shortHexMatch[1][1], 16 )
		const blue = Number.parseInt( shortHexMatch[1][2] + shortHexMatch[1][2], 16 )
		return `rgba(${red}, ${green}, ${blue}, ${alpha})`
	}

	return normalized
}

function paneDimensions(){

	const pixelBounds = props.paneState?.pixelBounds ?? {}

	return {
		width: Math.max( 1, Number( pixelBounds.width ) || 1 ),
		height: Math.max( 1, Number( pixelBounds.height ) || 1 )
	}
}

function normalizeAxisBounds( range ){

	if( Array.isArray( range ) === false || range.length < 2 ){
		return null
	}

	const start = Number( range[0] )
	const end = Number( range[1] )

	if( Number.isFinite( start ) === false || Number.isFinite( end ) === false ){
		return null
	}

	return {
		min: Math.min( start, end ),
		max: Math.max( start, end )
	}
}

function resolvedHeatmapOrigin(){
	return props.paneState?.heatmapOrigin === "bottom-left" ? "bottom-left" : "top-left"
}

function payloadDimensions(){
	return {
		width: Math.max( 1, Number( props.payload?.width ) || 1 ),
		height: Math.max( 1, Number( props.payload?.height ) || 1 )
	}
}

function resolvedRenderYBounds(){

	const renderBounds = normalizeAxisBounds(
		Array.isArray( props.paneState?.renderYRange )
			? props.paneState.renderYRange
			: props.paneState?.yRange
	)

	return renderBounds
}

function semanticYToWorldY( value ){

	const numeric = Number( value )
	if( Number.isFinite( numeric ) === false ){
		return 0
	}

	if( resolvedHeatmapOrigin() !== "top-left" ){
		return numeric
	}

	const { height } = payloadDimensions()
	return ( height - 1 ) - numeric
}

function worldYToSemanticY( value ){

	const numeric = Number( value )
	if( Number.isFinite( numeric ) === false ){
		return 0
	}

	if( resolvedHeatmapOrigin() !== "top-left" ){
		return numeric
	}

	const { height } = payloadDimensions()
	return ( height - 1 ) - numeric
}

function selectionYFromAxisY( value ){

	const numeric = Number( value )
	if( Number.isFinite( numeric ) === false ){
		return 0
	}

	if( resolvedHeatmapOrigin() === "top-left" ){
		return numeric
	}

	const { height } = payloadDimensions()
	return ( height - 1 ) - numeric
}

function axisYFromSelectionY( value ){

	const numeric = Number( value )
	if( Number.isFinite( numeric ) === false ){
		return 0
	}

	if( resolvedHeatmapOrigin() === "top-left" ){
		return numeric
	}

	const { height } = payloadDimensions()
	return ( height - 1 ) - numeric
}

function projectX( value ){

	const xBounds = normalizeAxisBounds( props.paneState?.xRange )
	if( xBounds === null ) return 0

	const { width } = paneDimensions()
	const denominator = Number( xBounds.max ) - Number( xBounds.min )
	if( denominator === 0 ) return 0

	return (( Number( value ) - Number( xBounds.min )) / denominator ) * width
}

function projectY( value ){

	const renderYBounds = resolvedRenderYBounds()
	if( renderYBounds === null ) return 0

	const { height } = paneDimensions()
	const denominator = Number( renderYBounds.max ) - Number( renderYBounds.min )
	if( denominator === 0 ) return 0

	const axisY = axisYFromSelectionY( value )
	const worldY = semanticYToWorldY( axisY )
	if( resolvedHeatmapOrigin() === "top-left" ){
		return (( Number( renderYBounds.max ) - worldY ) / denominator ) * height
	}

	return (( worldY - Number( renderYBounds.min )) / denominator ) * height
}

function projectOverlay( overlay, index ){

	if( overlay === null || typeof overlay !== "object" ){
		return null
	}

	const x0 = Number( overlay.x0 )
	const x1 = Number( overlay.x1 )
	const y0 = Number( overlay.y0 )
	const y1 = Number( overlay.y1 )

	if([ x0, x1, y0, y1 ].some(( value ) => Number.isFinite( value ) === false )){
		return null
	}

	const projectedX0 = projectX( x0 )
	const projectedX1 = projectX( x1 )
	const projectedY0 = projectY( y0 )
	const projectedY1 = projectY( y1 )

	const left = Math.min( projectedX0, projectedX1 )
	const top = Math.min( projectedY0, projectedY1 )
	const width = Math.abs( projectedX1 - projectedX0 )
	const height = Math.abs( projectedY1 - projectedY0 )
	const boxColor = typeof overlay.boxColor === "string" && overlay.boxColor.length > 0
		? overlay.boxColor
		: "#9ca3af"
	const titleColor = typeof overlay.titleColor === "string" && overlay.titleColor.length > 0
		? overlay.titleColor
		: boxColor
	const opacity = Number.isFinite( Number( overlay.opacity ))
		? Math.max( 0, Math.min( 1, Number( overlay.opacity )))
		: 0.25
	const showTitle = overlay.showTitle !== false

	return {
		key: `${index}:${overlay.name ?? ""}:${x0}:${x1}:${y0}:${y1}`,
		name: typeof overlay.name === "string" ? overlay.name : "",
		showTitle,
		left,
		top,
		width,
		height,
		boxColor,
		titleColor,
		fillColor: colorWithAlpha( boxColor, opacity * 0.25 ),
		labelBackground: colorWithAlpha( titleColor, opacity ),
		labelLeft: left + ( width / 2 ),
		labelTop: top
	}
}

function localPointFromEvent( event ){

	const element = root.value
	if( element === null ) return null

	const bounds = element.getBoundingClientRect()
	const width = Math.max( 1, bounds.width )
	const height = Math.max( 1, bounds.height )

	return {
		x: clamp( event.clientX - bounds.left, 0, width ),
		y: clamp( event.clientY - bounds.top, 0, height )
	}
}

function axisPointFromLocalPoint( point ){

	const xBounds = normalizeAxisBounds( props.paneState?.xRange )
	const renderYBounds = resolvedRenderYBounds()
	if( xBounds === null || renderYBounds === null ) return null

	const { width, height } = paneDimensions()
	const relativeX = point.x / width
	const relativeY = point.y / height
	const worldY = resolvedHeatmapOrigin() === "top-left"
		? Number( renderYBounds.max ) - relativeY * ( Number( renderYBounds.max ) - Number( renderYBounds.min ))
		: Number( renderYBounds.min ) + relativeY * ( Number( renderYBounds.max ) - Number( renderYBounds.min ))

	return {
		x: Number( xBounds.min ) + relativeX * ( Number( xBounds.max ) - Number( xBounds.min )),
		y: worldYToSemanticY( worldY )
	}
}

function dataPointFromLocalPoint( point ){

	const axisPoint = axisPointFromLocalPoint( point )
	if( axisPoint === null ){
		return null
	}

	return {
		x: axisPoint.x,
		y: selectionYFromAxisY( axisPoint.y )
	}
}

function constrainedDragPoint( startPoint, currentPoint ){

	if( startPoint === null || currentPoint === null ){
		return currentPoint
	}

	if( props.interactionMode !== "zoom" || props.lockSquareZoom !== true ){
		return currentPoint
	}

	const { width, height } = paneDimensions()
	const deltaX = currentPoint.x - startPoint.x
	const deltaY = currentPoint.y - startPoint.y
	const horizontalDirection = deltaX < 0 ? -1 : 1
	const verticalDirection = deltaY < 0 ? -1 : 1
	const requestedSideLength = Math.max( Math.abs( deltaX ), Math.abs( deltaY ))
	const maxHorizontalSpan = horizontalDirection < 0 ? startPoint.x : ( width - startPoint.x )
	const maxVerticalSpan = verticalDirection < 0 ? startPoint.y : ( height - startPoint.y )
	const sideLength = Math.min( requestedSideLength, maxHorizontalSpan, maxVerticalSpan )

	return {
		x: clamp( startPoint.x + ( horizontalDirection * sideLength ), 0, width ),
		y: clamp( startPoint.y + ( verticalDirection * sideLength ), 0, height )
	}
}

function clampIndex( value, size ){

	const numeric = Number( value )
	if( Number.isFinite( numeric ) === false ) return null
	if( size <= 0 ) return null

	return clamp( Math.round( numeric ), 0, size - 1 )
}

function selectionFromDrag( startPoint, endPoint ){

	const payloadWidth = Math.max( 1, Number( props.payload?.width ) || 1 )
	const payloadHeight = Math.max( 1, Number( props.payload?.height ) || 1 )

	const startData = dataPointFromLocalPoint( startPoint )
	const endData = dataPointFromLocalPoint( endPoint )
	if( startData === null || endData === null ) return null

	const xMinimum = Math.max( 0, Math.ceil( Math.min( startData.x, endData.x )))
	const xMaximum = Math.min( payloadWidth - 1, Math.floor( Math.max( startData.x, endData.x )))
	const yMinimum = Math.max( 0, Math.ceil( Math.min( startData.y, endData.y )))
	const yMaximum = Math.min( payloadHeight - 1, Math.floor( Math.max( startData.y, endData.y )))

	if( xMaximum < xMinimum || yMaximum < yMinimum ){
		return null
	}

	var xIndices = []
	for( var xValue = xMinimum; xValue <= xMaximum; xValue++ ){
		xIndices.push( xValue )
	}

	var yIndices = []
	for( var yValue = yMinimum; yValue <= yMaximum; yValue++ ){
		yIndices.push( yValue )
	}

	return {
		xIndices,
		yIndices,
		boundingBox: {
			minX: xMinimum,
			maxX: xMaximum,
			minY: yMinimum,
			maxY: yMaximum,
			width: xMaximum - xMinimum + 1,
			height: yMaximum - yMinimum + 1
		}
	}
}

function updateHoverFromLocalPoint( point ){

	if( point === null || isVisible.value === false ){
		hoverState.value = null
		return
	}

	const payloadWidth = Math.max( 1, Number( props.payload?.width ) || 1 )
	const payloadHeight = Math.max( 1, Number( props.payload?.height ) || 1 )
	const dataPoint = dataPointFromLocalPoint( point )
	if( dataPoint === null ){
		hoverState.value = null
		return
	}

	const x = clampIndex( dataPoint.x, payloadWidth )
	const y = clampIndex( dataPoint.y, payloadHeight )
	if( x === null || y === null ){
		hoverState.value = null
		return
	}

	const { width, height } = paneDimensions()
	hoverState.value = {
		x,
		y,
		left: clamp( point.x, 0, width ),
		top: clamp( point.y, 0, height )
	}
}

function destroyRenderer(){
	renderRequestId += 1
	if( renderer !== null ){
		renderer.destroy()
		renderer = null
	}
}

function ensureRenderer(){

	if( renderer !== null ){
		return renderer
	}

	if( deckContainer.value === null ){
		return null
	}

	renderer = heatmapRenderer.createRenderer( deckContainer.value, {
		onError: ( error ) => {
			console.error( error )
		}
	})

	return renderer
}

async function syncRenderer(){

	const activeRequestId = renderRequestId + 1
	renderRequestId = activeRequestId

	if( isVisible.value === false ){
		if( renderer !== null ){
			renderer.clear()
		}
		return
	}

	const activeRenderer = ensureRenderer()
	if( activeRenderer === null ){
		return
	}

	const startedAt = performance.now()
	await activeRenderer.render({
		payload: props.payload,
		paneState: props.paneState
	})

	if( activeRequestId !== renderRequestId ){
		return
	}

	emit("render-timing", {
		renderer: "deckgl",
		viewMode: props.viewMode,
		initialRenderMs: performance.now() - startedAt,
		benchmarkToken: props.benchmarkToken
	})
}

function handlePointerDown( event ){

	if( isVisible.value === false ){
		return
	}

	const start = localPointFromEvent( event )
	if( start === null ) return
	updateHoverFromLocalPoint( start )

	dragState.value = {
		pointerId: event.pointerId,
		start,
		current: start
	}

	root.value?.setPointerCapture( event.pointerId )
}

function handlePointerMove( event ){

	const localPoint = localPointFromEvent( event )
	if( localPoint === null ) return

	const current = dragState.value !== null
		? constrainedDragPoint( dragState.value.start, localPoint )
		: localPoint
	updateHoverFromLocalPoint( current )

	if( dragState.value === null ) return
	if( dragState.value.pointerId !== event.pointerId ) return

	dragState.value = {
		...dragState.value,
		current
	}
}

function handlePointerUp( event ){

	if( dragState.value === null ) return
	if( dragState.value.pointerId !== event.pointerId ) return

	const startPoint = dragState.value.start
	const rawFinalPoint = localPointFromEvent( event )
	const finalPoint = rawFinalPoint === null
		? dragState.value.current
		: constrainedDragPoint( startPoint, rawFinalPoint )
	dragState.value = null

	if( finalPoint === null ){
		hoverState.value = null
		return
	}
	updateHoverFromLocalPoint( finalPoint )

	const deltaX = Math.abs( finalPoint.x - startPoint.x )
	const deltaY = Math.abs( finalPoint.y - startPoint.y )

	if( props.interactionMode === "zoom" ){
		if( deltaX < 4 && deltaY < 4 ){
			return
		}

		const startAxisPoint = axisPointFromLocalPoint( startPoint )
		const endAxisPoint = axisPointFromLocalPoint( finalPoint )
		if( startAxisPoint === null || endAxisPoint === null ) return

		emit("zoom-range", {
			xRange: [
				Math.min( startAxisPoint.x, endAxisPoint.x ),
				Math.max( startAxisPoint.x, endAxisPoint.x )
			],
			yRange: [
				Math.min( startAxisPoint.y, endAxisPoint.y ),
				Math.max( startAxisPoint.y, endAxisPoint.y )
			]
		})
		return
	}

	if( deltaX < 4 && deltaY < 4 ){
		const payloadWidth = Math.max( 1, Number( props.payload?.width ) || 1 )
		const payloadHeight = Math.max( 1, Number( props.payload?.height ) || 1 )
		const dataPoint = dataPointFromLocalPoint( finalPoint )
		if( dataPoint === null ) return

		const x = clampIndex( dataPoint.x, payloadWidth )
		const y = clampIndex( dataPoint.y, payloadHeight )

		if( x === null || y === null ) return

		emit("point-select", { x, y })
		return
	}

	const selection = selectionFromDrag( startPoint, finalPoint )
	if( selection === null ) return

	if( selection.xIndices.length === 1 && selection.yIndices.length === 1 ){
		emit("point-select", {
			x: selection.xIndices[0],
			y: selection.yIndices[0]
		})
		return
	}

	emit("region-select", selection)
}

function cancelSelection(){
	dragState.value = null
}

function handlePointerLeave(){

	if( dragState.value !== null ){
		return
	}

	hoverState.value = null
}

function handleDoubleClick( event ){

	if( props.interactionMode !== "zoom" ){
		return
	}

	event.preventDefault()
	dragState.value = null
	emit("reset-zoom")
}

onMounted(() => {
	void syncRenderer()
})

watch(
	() => hoverState.value === null ? "" : `${hoverState.value.x}:${hoverState.value.y}`,
	async () => {
		await nextTick()
		measureHoverTooltip()
	}
)

watch(
	() => [
		props.rendererMode,
		props.viewMode,
		props.payload,
		props.payload?.kind,
		props.payload?.canvas,
		props.payload?.textureSource,
		props.payload?.colorMapTexture,
		props.payload?.width,
		props.payload?.height,
		props.paneState?.pixelBounds?.left,
		props.paneState?.pixelBounds?.top,
		props.paneState?.pixelBounds?.width,
		props.paneState?.pixelBounds?.height,
		props.paneState?.xRange?.[0],
		props.paneState?.xRange?.[1],
		props.paneState?.yRange?.[0],
		props.paneState?.yRange?.[1],
		props.paneState?.heatmapOrigin
	],
	() => {
		void syncRenderer()
	}
)

onBeforeUnmount(() => {
	hoverState.value = null
	destroyRenderer()
})

</script>

<style scoped>
:deep(.deck-widget-container){
	cursor: inherit !important;
}
</style>
