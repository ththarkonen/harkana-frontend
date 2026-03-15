<template>
	<div ref = "root"
	     class = "relative inline-block text-left"
	     @keydown.esc.stop.prevent = "close">

		<!-- Trigger -->
		<button ref = "triggerButton"
		        @click = "toggle"
		        :class = "triggerClasses"
		        aria-haspopup = "true"
		        :aria-expanded = "isOpen">
			<slot name = "trigger"></slot>

			<span v-if = "showChevron"
				  class = "transition-transform duration-200"
                :class = "{ 'rotate-180': isOpen }">
                <i class = "fas fa-chevron-down text-xs"></i>
            </span>
		</button>

		<!-- Menu -->
		<transition
			enter-active-class = "transition ease-out duration-150"
			enter-from-class   = "opacity-0 scale-95"
			enter-to-class     = "opacity-100 scale-100"
			leave-active-class = "transition ease-in duration-100"
			leave-from-class   = "opacity-100 scale-100"
			leave-to-class     = "opacity-0 scale-95">

			<Teleport v-if = "teleportToBody && isOpen"
			          to = "body">
				<div ref = "menu"
				     :class = "menuClasses"
					 :style = "portalMenuStyles"
					 @click = "handleMenuClick"
					 @keydown.esc.stop.prevent = "close"
					 tabindex = "-1">
					<ul :class = "listClasses">
						<slot></slot>
					</ul>
				</div>
			</Teleport>

			<div v-else-if = "isOpen"
			     ref = "menu"
			     :class = "menuClasses"
				 @click = "handleMenuClick">
				<ul :class = "listClasses">
					<slot></slot>
				</ul>
			</div>
		</transition>
	</div>
</template>

<script setup lang = "ts">

import { computed, nextTick, ref, watch, onMounted, onBeforeUnmount } from "vue"

const props = withDefaults( defineProps<{
	triggerClass?: string
	menuClass?: string
	listClass?: string
	showChevron?: boolean
	closeOnSelect?: boolean
	teleportToBody?: boolean
	portalOffsetX?: number
	portalOffsetY?: number
}>(), {
	triggerClass: "inline-flex items-center gap-2 rounded-md px-3 py-2 text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand",
	menuClass: "absolute right-0 z-50 mt-2 min-w-full w-max max-w-[50vw] origin-top-right rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30",
	listClass: "py-1",
	showChevron: true,
	closeOnSelect: false,
	teleportToBody: false,
	portalOffsetX: 8,
	portalOffsetY: 0
})

const isOpen = ref(false)
const root = ref<HTMLElement | null>(null)
const triggerButton = ref<HTMLElement | null>(null)
const menu = ref<HTMLElement | null>(null)
const portalPosition = ref({ left: 0, top: 0 })

const toggle = () => {
	isOpen.value = !isOpen.value
}

const close = () => {
	isOpen.value = false
}

const handleMenuClick = () => {
	if( props.closeOnSelect ){
		close()
	}
}

const triggerClasses = computed(() => {
	return props.triggerClass
})

const menuClasses = computed(() => {
	return props.menuClass
})

const listClasses = computed(() => {
	return props.listClass
})

const showChevron = computed(() => {
	return props.showChevron
})

const teleportToBody = computed(() => {
	return props.teleportToBody
})

const portalMenuStyles = computed(() => {
	if( props.teleportToBody === false ) return undefined
	return {
		left: `${portalPosition.value.left}px`,
		top: `${portalPosition.value.top}px`
	}
})

const onClickOutside = (event: MouseEvent) => {
	const target = event.target as Node
	if( root.value?.contains( target )) return
	if( props.teleportToBody && menu.value?.contains( target )) return
	close()
}

const updatePortalPosition = () => {
	if( props.teleportToBody === false ) return
	if( triggerButton.value === null ) return

	const triggerRect = triggerButton.value.getBoundingClientRect()
	const menuWidth = menu.value?.offsetWidth ?? 0
	const menuHeight = menu.value?.offsetHeight ?? 0

	const viewportWidth = window.innerWidth
	const viewportHeight = window.innerHeight

	var left = triggerRect.right + Number( props.portalOffsetX ?? 0 )
	var top = triggerRect.top + Number( props.portalOffsetY ?? 0 )

	const maxLeft = Math.max( 8, viewportWidth - menuWidth - 8 )
	const maxTop = Math.max( 8, viewportHeight - menuHeight - 8 )

	left = Math.min( Math.max( 8, left ), maxLeft )
	top = Math.min( Math.max( 8, top ), maxTop )

	portalPosition.value = { left, top }
}

const addPortalListeners = () => {
	window.addEventListener( "resize", updatePortalPosition )
	window.addEventListener( "scroll", updatePortalPosition, true )
}

const removePortalListeners = () => {
	window.removeEventListener( "resize", updatePortalPosition )
	window.removeEventListener( "scroll", updatePortalPosition, true )
}

onMounted(() => {
	document.addEventListener( "click", onClickOutside )
})

onBeforeUnmount(() => {
	document.removeEventListener( "click", onClickOutside )
	removePortalListeners()
})

watch( isOpen, async ( nextOpen ) => {
	if( props.teleportToBody === false ) return

	if( nextOpen ){
		await nextTick()
		updatePortalPosition()
		addPortalListeners()
		menu.value?.focus()
		return
	}

	removePortalListeners()
})

defineExpose({ close, toggle })
</script>
