<template>
	<div ref = "root"
	     :class = "rootClasses"
	     @keydown.esc.stop.prevent = "close">

		<!-- Trigger -->
		<button ref = "triggerButton"
		        @click = "toggle"
		        @keydown = "handleTriggerKeydown"
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
					 @keydown.down.prevent = "moveFocus(1)"
					 @keydown.up.prevent = "moveFocus(-1)"
					 @keydown.home.prevent = "focusMenuItem('first')"
					 @keydown.end.prevent = "focusMenuItem('last')"
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
				 @click = "handleMenuClick"
				 @keydown.down.prevent = "moveFocus(1)"
				 @keydown.up.prevent = "moveFocus(-1)"
				 @keydown.home.prevent = "focusMenuItem('first')"
				 @keydown.end.prevent = "focusMenuItem('last')"
				 @keydown.esc.stop.prevent = "close"
				 tabindex = "-1">
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
	rootClass?: string
	triggerClass?: string
	menuClass?: string
	listClass?: string
	showChevron?: boolean
	closeOnSelect?: boolean
	teleportToBody?: boolean
	portalOffsetX?: number
	portalOffsetY?: number
	portalPlacement?: string
	triggerArrowBehavior?: string
	open?: boolean
}>(), {
	rootClass: "relative inline-block text-left",
	triggerClass: "inline-flex items-center gap-2 rounded-md px-3 py-2 text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand",
	menuClass: "absolute right-0 z-50 mt-2 min-w-full w-max max-w-[50vw] origin-top-right rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30",
	listClass: "py-1",
	showChevron: true,
	closeOnSelect: false,
	teleportToBody: false,
	portalOffsetX: 8,
	portalOffsetY: 0,
	portalPlacement: "right",
	triggerArrowBehavior: "open",
	open: undefined
})

const emit = defineEmits([ "update:open", "trigger-keydown" ])

const uncontrolledOpen = ref(false)
const root = ref<HTMLElement | null>(null)
const triggerButton = ref<HTMLElement | null>(null)
const menu = ref<HTMLElement | null>(null)
const portalPosition = ref({ left: 0, top: 0 })

const isControlled = computed(() => {
	return typeof props.open === "boolean"
})

const isOpen = computed({
	get: () => {
		return isControlled.value ? props.open === true : uncontrolledOpen.value
	},
	set: ( nextOpen: boolean ) => {
		if( isControlled.value === false ){
			uncontrolledOpen.value = nextOpen
		}
		emit( "update:open", nextOpen )
	}
})

const toggle = () => {
	isOpen.value = !isOpen.value
}

const open = () => {
	isOpen.value = true
}

const close = () => {
	isOpen.value = false
}

const focusTrigger = () => {
	triggerButton.value?.focus()
}

const handleMenuClick = () => {
	if( props.closeOnSelect ){
		close()
	}
}

const focusableMenuSelector = [
	'button:not([disabled])',
	'[href]',
	'input:not([disabled])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])'
].join( ", " )

const getFocusableMenuItems = () => {
	if( menu.value === null ){
		return []
	}

	return Array.from( menu.value.querySelectorAll<HTMLElement>( focusableMenuSelector ))
}

const focusMenuItem = ( position: "first" | "last" ) => {
	const items = getFocusableMenuItems()
	if( items.length === 0 ){
		menu.value?.focus()
		return
	}

	const nextItem = position === "last" ? items[ items.length - 1 ] : items[0]
	nextItem?.focus()
}

const moveFocus = ( direction: number ) => {
	const items = getFocusableMenuItems()
	if( items.length === 0 ){
		menu.value?.focus()
		return
	}

	const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
	const currentIndex = activeElement === null ? -1 : items.findIndex(( item ) => item === activeElement )

	if( currentIndex === -1 ){
		if( direction < 0 ){
			items[ items.length - 1 ]?.focus()
			return
		}

		items[0]?.focus()
		return
	}

	const nextIndex = ( currentIndex + direction + items.length ) % items.length
	items[ nextIndex ]?.focus()
}

const openAndFocus = async ( position: "first" | "last" ) => {
	if( isOpen.value === false ){
		isOpen.value = true
		await nextTick()
	}

	focusMenuItem( position )
}

const handleTriggerKeydown = ( event: KeyboardEvent ) => {
	const key = event.key
	if( key !== "ArrowDown" && key !== "ArrowUp" && key !== "Home" && key !== "End" ){
		return
	}

	if( props.triggerArrowBehavior === "emit" ){
		event.preventDefault()
		emit( "trigger-keydown", event )
		return
	}

	if( key === "ArrowDown" || key === "Home" ){
		event.preventDefault()
		openAndFocus( "first" )
		return
	}

	if( key === "ArrowUp" || key === "End" ){
		event.preventDefault()
		openAndFocus( "last" )
	}
}

const triggerClasses = computed(() => {
	return props.triggerClass
})

const rootClasses = computed(() => {
	return props.rootClass
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

	const placement = String( props.portalPlacement ?? "right" ).trim().toLowerCase()
	var left = triggerRect.right + Number( props.portalOffsetX ?? 0 )
	var top = triggerRect.top + Number( props.portalOffsetY ?? 0 )

	if( placement === "bottom-start" ){
		left = triggerRect.left + Number( props.portalOffsetX ?? 0 )
		top = triggerRect.bottom + Number( props.portalOffsetY ?? 0 )
	} else if( placement === "bottom-end" ){
		left = triggerRect.right - menuWidth + Number( props.portalOffsetX ?? 0 )
		top = triggerRect.bottom + Number( props.portalOffsetY ?? 0 )
	}

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

defineExpose({ close, open, toggle, focusTrigger })
</script>
