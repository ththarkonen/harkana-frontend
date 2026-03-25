<template>
<Teleport to = "body">
	<template v-if = "visible">
		<div class = "fixed inset-0 z-[10020]">
			<div v-if = "showSpotlight === false"
				 class = "absolute inset-0 bg-black/60"></div>

			<div v-else
				 class = "pointer-events-none absolute rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] transition-all duration-200"
				 :style = "spotlightStyle"></div>
		</div>

		<div v-if = "showSpotlight"
			 class = "fixed inset-0 z-[10030] pointer-events-none">
			<div class = "absolute rounded-xl border-2 border-brand shadow-[0_0_18px_rgba(0,117,255,0.35)] transition-all duration-200"
				 :style = "spotlightStyle"></div>
		</div>

		<div class = "fixed inset-0 z-[10040] pointer-events-none">
			<div ref = "dialog"
				 class = "pointer-events-auto fixed w-[22rem] max-w-[calc(100vw-1rem)] rounded-lg border-2 border-brand bg-dark-gray shadow-xl"
				 :style = "dialogStyle"
				 role = "dialog"
				 aria-modal = "true"
				 :aria-labelledby = "'viewer-tutorial-title-' + stepId"
				 :aria-describedby = "'viewer-tutorial-body-' + stepId"
				 tabindex = "-1"
				 @keydown.esc.stop.prevent = "emit('skip')">
				<div class = "flex items-start justify-between gap-3 px-4 py-3">
					<div>
						<div class = "text-xs font-medium uppercase tracking-wide text-white/50">
							Step {{ stepNumber }} of {{ stepCount }}
						</div>
						<h2 :id = "'viewer-tutorial-title-' + stepId"
							class = "mt-1 text-lg font-semibold text-white">
							{{ title }}
						</h2>
					</div>

					<button type = "button"
							class = "inline-flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
							aria-label = "Skip tutorial"
							@click = "emit('skip')">
						<i class = "fas fa-times" aria-hidden = "true"></i>
					</button>
				</div>

				<div class = "px-4 pb-4 text-sm leading-relaxed text-white/85">
					<div v-if = "isFinal"
						 class = "mb-4 flex justify-center"
						 aria-hidden = "true">
						<div class = "tutorial-complete-ornament">
							<div class = "tutorial-complete-ring"></div>
							<div class = "tutorial-complete-badge">
								<i class = "fas fa-check tutorial-complete-icon"></i>
							</div>
						</div>
					</div>

					<p :id = "'viewer-tutorial-body-' + stepId"
					   class = "whitespace-pre-line">
						{{ body }}
					</p>
				</div>

				<div class = "flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
					<button type = "button"
							class = "inline-flex items-center justify-center rounded-md border border-white/20 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
							:disabled = "canGoBack === false"
							@click = "emit('back')">
						Back
					</button>

					<div class = "flex items-center gap-2">
						<button type = "button"
								class = "inline-flex items-center justify-center rounded-md border border-white/20 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
								@click = "emit('skip')">
							Skip tutorial
						</button>

						<button type = "button"
								class = "inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90"
								@click = "emit('next')">
							{{ isFinal ? "Finish" : "Next" }}
						</button>
					</div>
				</div>
			</div>
		</div>
	</template>
</Teleport>
</template>

<script setup lang = "ts">

import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue"

type RectLike = {
	left: number
	top: number
	width: number
	height: number
}

const props = defineProps({
	visible: { type: Boolean, default: false },
	stepId: { type: String, default: "" },
	title: { type: String, default: "" },
	body: { type: String, default: "" },
	stepNumber: { type: Number, default: 1 },
	stepCount: { type: Number, default: 1 },
	canGoBack: { type: Boolean, default: false },
	isFinal: { type: Boolean, default: false },
	preferredPlacement: { type: String, default: "right" },
	targetElement: { type: Object, default: null },
	spotlightPadding: { type: Number, default: 8 },
	spotlightEnabled: { type: Boolean, default: true }
})

const emit = defineEmits([ "next", "back", "skip" ])

const dialog = ref<HTMLElement | null>( null )
const targetRect = ref<RectLike | null>( null )
const dialogSize = ref({ width: 352, height: 220 })

const showSpotlight = computed(() => {
	return props.visible === true &&
		props.spotlightEnabled === true &&
		targetRect.value !== null
})

const spotlightStyle = computed(() => {
	if( targetRect.value === null ){
		return undefined
	}

	const padding = Math.max( 0, Number( props.spotlightPadding ) || 0 )
	return {
		left: `${Math.round( targetRect.value.left - padding )}px`,
		top: `${Math.round( targetRect.value.top - padding )}px`,
		width: `${Math.round( targetRect.value.width + ( padding * 2 ))}px`,
		height: `${Math.round( targetRect.value.height + ( padding * 2 ))}px`
	}
})

const dialogStyle = computed(() => {
	const viewportWidth = window.innerWidth || 1280
	const viewportHeight = window.innerHeight || 720
	const dialogWidth = dialogSize.value.width
	const dialogHeight = dialogSize.value.height
	return {
		left: `${Math.round(( viewportWidth - dialogWidth ) / 2 )}px`,
		top: `${Math.round(( viewportHeight - dialogHeight ) / 2 )}px`
	}
})

const updateTargetRect = () => {
	const element = props.targetElement instanceof HTMLElement ? props.targetElement : null
	if( element === null ){
		targetRect.value = null
		return
	}

	const rect = element.getBoundingClientRect()
	if( rect.width <= 0 || rect.height <= 0 ){
		targetRect.value = null
		return
	}

	targetRect.value = {
		left: rect.left,
		top: rect.top,
		width: rect.width,
		height: rect.height
	}
}

const updateDialogMetrics = async ( focusDialog = false ) => {
	await nextTick()
	if( dialog.value === null ){
		return
	}

	const rect = dialog.value.getBoundingClientRect()
	if( rect.width > 0 && rect.height > 0 ){
		dialogSize.value = {
			width: rect.width,
			height: rect.height
		}
	}
	if( focusDialog ){
		dialog.value.focus()
	}
}

const trapFocus = ( event: KeyboardEvent ) => {
	if( props.visible === false || event.key !== "Tab" || dialog.value === null ){
		return
	}

	const focusable = dialog.value.querySelectorAll<HTMLElement>(
		'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
	)

	if( focusable.length === 0 ){
		event.preventDefault()
		dialog.value.focus()
		return
	}

	const first = focusable[0]
	const last = focusable[ focusable.length - 1 ]

	if( event.shiftKey && document.activeElement === first ){
		event.preventDefault()
		last.focus()
		return
	}

	if( event.shiftKey === false && document.activeElement === last ){
		event.preventDefault()
		first.focus()
	}
}

const handleViewportChange = async () => {
	updateTargetRect()
	await updateDialogMetrics( false )
}

watch(() => props.visible, async ( nextVisible ) => {
	if( nextVisible === false ){
		document.removeEventListener( "keydown", trapFocus )
		window.removeEventListener( "resize", handleViewportChange )
		window.removeEventListener( "scroll", handleViewportChange, true )
		targetRect.value = null
		return
	}

	updateTargetRect()
	await updateDialogMetrics( true )
	document.addEventListener( "keydown", trapFocus )
	window.addEventListener( "resize", handleViewportChange )
	window.addEventListener( "scroll", handleViewportChange, true )
}, { immediate: true } )

watch(() => [ props.stepId, props.targetElement, props.preferredPlacement ], async () => {
	if( props.visible === false ){
		return
	}

	updateTargetRect()
	await updateDialogMetrics( false )
})

onBeforeUnmount(() => {
	document.removeEventListener( "keydown", trapFocus )
	window.removeEventListener( "resize", handleViewportChange )
	window.removeEventListener( "scroll", handleViewportChange, true )
})

</script>

<style scoped>

.tutorial-complete-ornament {
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 5.5rem;
	height: 5.5rem;
}

.tutorial-complete-ring {
	position: absolute;
	inset: 0;
	border: 2px solid rgba( 211, 52, 121, 0.4 );
	border-radius: 9999px;
	animation: tutorial-ring-pulse 1s ease-out both;
}

.tutorial-complete-badge {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 4.25rem;
	height: 4.25rem;
	border-radius: 9999px;
	background: #d33479;
	animation: tutorial-badge-pop 320ms cubic-bezier( 0.2, 0.9, 0.25, 1.15 ) both;
}

.tutorial-complete-icon {
	font-size: 2rem;
	color: white;
}

@keyframes tutorial-badge-pop {
	0% {
		opacity: 0;
		transform: scale( 0.72 );
	}

	70% {
		opacity: 1;
		transform: scale( 1.08 );
	}

	100% {
		opacity: 1;
		transform: scale( 1 );
	}
}

@keyframes tutorial-ring-pulse {
	0% {
		opacity: 0;
		transform: scale( 0.82 );
	}

	35% {
		opacity: 0.5;
	}

	100% {
		opacity: 0;
		transform: scale( 1.22 );
	}
}

</style>
