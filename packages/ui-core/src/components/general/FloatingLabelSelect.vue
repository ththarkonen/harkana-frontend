<template>
<BaseDropdown ref = "dropdown"
			  :open = "resolvedOpen"
			  @update:open = "handleOpenUpdate"
			  @trigger-keydown = "handleTriggerKeydown"
			  root-class = "relative block w-full text-left"
			  :show-chevron = "false"
			  :close-on-select = "true"
			  :teleport-to-body = "teleportToBody"
			  :portal-placement = "portalPlacement"
			  :portal-offset-x = "portalOffsetX"
			  :portal-offset-y = "portalOffsetY"
			  trigger-arrow-behavior = "emit"
			  :trigger-class = "triggerClass"
			  :menu-class = "resolvedMenuClass">
	<template v-slot:trigger>
		<div :class = "containerClass">
			<div class = "min-w-0 flex-1 text-left">
				<div :class = "valueClass">{{ selectedLabel }}</div>
			</div>

			<div :class = "chevronClass">
				<i class = "fas fa-chevron-down text-xs" aria-hidden = "true"></i>
			</div>
		</div>
	</template>

	<li v-for = "option in options"
		:key = "option.value">
		<button type = "button"
				class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white"
				@click = "selectOption( option.value )">
			<span>{{ option.label }}</span>
			<i :class = "modelValue === option.value ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
			   aria-hidden = "true"></i>
		</button>
	</li>
</BaseDropdown>
</template>

<script setup lang = "ts">

import { computed, ref, watch } from "vue"

import BaseDropdown from "../navbar/BaseDropdown.vue"

type SelectOption = {
	value: string
	label: string
}

const props = withDefaults( defineProps<{
	modelValue: string
	options: SelectOption[]
	label?: string
	variant?: string
	open?: boolean
	teleportToBody?: boolean
	menuClass?: string
	portalPlacement?: string
	portalOffsetX?: number
	portalOffsetY?: number
}>(), {
	label: "Display",
	variant: "soft",
	open: undefined,
	teleportToBody: true,
	menuClass: "fixed z-[45] min-w-[16rem] w-max max-w-[50vw] origin-top-left rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30",
	portalPlacement: "bottom-start",
	portalOffsetX: 0,
	portalOffsetY: 8
})

const emit = defineEmits([ "update:modelValue", "update:open" ])

const dropdown = ref(null)
const internalOpen = ref(false)

watch(() => props.open, ( nextOpen ) => {
	if( typeof nextOpen === "boolean" ){
		internalOpen.value = nextOpen === true
	}
}, { immediate: true } )

const resolvedOpen = computed(() => {
	return typeof props.open === "boolean" ? props.open === true : internalOpen.value
})

const selectedLabel = computed(() => {
	const selectedOption = props.options.find(( option ) => option.value === props.modelValue )
	return selectedOption?.label ?? props.options[0]?.label ?? ""
})

const selectedIndex = computed(() => {
	const currentIndex = props.options.findIndex(( option ) => option.value === props.modelValue )
	return currentIndex >= 0 ? currentIndex : 0
})

const variantClasses = computed(() => {
	const variant = String( props.variant ?? "soft" ).trim().toLowerCase()
	const isOpen = resolvedOpen.value === true

	if( variant === "outlined" ){
		return {
			container: `flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition ${
				isOpen
					? "border border-white/10 bg-gray-700 ring-2 ring-brand"
					: "border border-white/10 bg-gray-700/90"
			} group-focus:border-white/10 group-focus:bg-gray-700 group-focus:ring-2 group-focus:ring-brand`,
			iconWrap: `inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand transition ${
				isOpen ? "bg-white/10" : "bg-white/8"
			} group-focus:bg-white/10`,
			label: "hidden",
			value: "truncate text-sm font-semibold text-white",
			chevron: `inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition ${
				isOpen ? "bg-white/10" : "bg-white/5"
			} group-focus:bg-white/10`
		}
	}

	if( variant === "glass" ){
		return {
			container: `flex items-center gap-2.5 rounded-xl border px-2.5 py-1.5 transition ${
				isOpen
					? "border-white/10 bg-gray-700 ring-2 ring-brand"
					: "border-white/10 bg-gray-700/90"
			} group-focus:border-white/10 group-focus:bg-gray-700 group-focus:ring-2 group-focus:ring-brand`,
			iconWrap: `inline-flex h-8 w-8 items-center justify-center rounded-full text-brand transition ${
				isOpen ? "bg-white/10" : "bg-white/8"
			} group-focus:bg-white/10`,
			label: "hidden",
			value: "truncate text-sm font-semibold text-white",
			chevron: `inline-flex h-8 w-8 items-center justify-center rounded-full text-white/75 transition ${
				isOpen ? "bg-white/10" : "bg-white/8"
			} group-focus:bg-white/10`
		}
	}

	return {
		container: `flex items-center gap-2.5 rounded-xl border px-2.5 py-1.5 transition ${
			isOpen
				? "border-white/10 bg-gray-700 ring-2 ring-brand"
				: "border-white/10 bg-gray-700/90"
		} group-focus:border-white/10 group-focus:bg-gray-700 group-focus:ring-2 group-focus:ring-brand`,
		iconWrap: `inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand transition ${
			isOpen ? "bg-white/10" : "bg-white/8"
		} group-focus:bg-white/10`,
		label: "hidden",
		value: "truncate text-sm font-semibold text-white",
		chevron: `inline-flex h-8 w-8 items-center justify-center rounded-full text-white/75 transition ${
			isOpen ? "bg-white/10" : "bg-white/8"
		} group-focus:bg-white/10`
	}
})

const triggerClass = computed(() => {
	return "group w-full rounded-xl text-white transition focus:outline-none"
})

const resolvedMenuClass = computed(() => {
	return props.menuClass
})

const containerClass = computed(() => {
	return variantClasses.value.container
})

const iconWrapClass = computed(() => {
	return variantClasses.value.iconWrap
})

const labelClass = computed(() => {
	return variantClasses.value.label
})

const valueClass = computed(() => {
	return variantClasses.value.value
})

const chevronClass = computed(() => {
	return variantClasses.value.chevron
})

const restoreTriggerFocus = () => {
	window.setTimeout(() => {
		dropdown.value?.focusTrigger?.()
	}, 0 )
}

const selectOption = ( nextValue: string ) => {
	if( nextValue !== props.modelValue ){
		emit( "update:modelValue", nextValue )
	}

	dropdown.value?.close?.()
	restoreTriggerFocus()
}

const focusOptionIndex = ( nextIndex: number ) => {
	if( props.options.length === 0 ){
		return
	}

	const clampedIndex = Math.max( 0, Math.min( props.options.length - 1, nextIndex ))
	selectOption( props.options[ clampedIndex ]?.value ?? props.modelValue )
}

const handleOpenUpdate = ( nextOpen: boolean ) => {
	internalOpen.value = nextOpen === true
	emit( "update:open", nextOpen )
}

const handleTriggerKeydown = ( event: KeyboardEvent ) => {
	if( props.options.length === 0 ){
		return
	}

	if( event.key === "ArrowDown" || event.key === "ArrowRight" ){
		focusOptionIndex( selectedIndex.value + 1 )
		return
	}

	if( event.key === "ArrowUp" || event.key === "ArrowLeft" ){
		focusOptionIndex( selectedIndex.value - 1 )
		return
	}

	if( event.key === "Home" ){
		focusOptionIndex( 0 )
		return
	}

	if( event.key === "End" ){
		focusOptionIndex( props.options.length - 1 )
	}
}

defineExpose({
	open: () => dropdown.value?.open?.(),
	close: () => dropdown.value?.close?.(),
	toggle: () => dropdown.value?.toggle?.(),
	focusTrigger: () => dropdown.value?.focusTrigger?.()
})

</script>
