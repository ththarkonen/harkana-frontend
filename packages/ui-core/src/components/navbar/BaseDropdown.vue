<template>
	<div ref = "root"
	     class = "relative inline-block text-left">

		<!-- Trigger -->
		<button @click = "toggle"
		        class = "inline-flex items-center gap-2 rounded-md px-3 py-2
		                text-white transition hover:bg-white/10
		                focus:outline-none focus:ring-2 focus:ring-brand"
		        aria-haspopup = "true"
		        :aria-expanded = "isOpen">
			<slot name = "trigger"></slot>

			<span class = "transition-transform duration-200"
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

			<div v-if = "isOpen"
			     class = "absolute right-0 z-50 mt-2
			             min-w-full w-max max-w-[50vw]
			             origin-top-right rounded-md bg-dark-gray
			             shadow-lg ring-1 ring-black/30">

				<ul class = "py-1">
					<slot></slot>
				</ul>
			</div>
		</transition>
	</div>
</template>

<script setup lang = "ts">
    
import { ref, onMounted, onBeforeUnmount } from 'vue'

const isOpen = ref(false)
const root = ref<HTMLElement | null>(null)

const toggle = () => {
	isOpen.value = !isOpen.value
}

const close = () => {
	isOpen.value = false
}

const onClickOutside = (event: MouseEvent) => {
	if (root.value && !root.value.contains(event.target as Node)) {
		close()
	}
}

onMounted(() => {
	document.addEventListener('click', onClickOutside)
})

onBeforeUnmount(() => {
	document.removeEventListener('click', onClickOutside)
})
</script>
