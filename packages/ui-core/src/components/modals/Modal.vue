<template>
<Teleport to = "body">
<transition
    enter-active-class = "transition ease-out duration-150"
    enter-from-class  = "opacity-0"
    enter-to-class    = "opacity-100"
    leave-active-class= "transition ease-in duration-100"
    leave-from-class  = "opacity-100"
    leave-to-class    = "opacity-0">

    <div v-if = "isVisible"
        @keydown.esc = "onEsc"
        class = "fixed inset-0 z-50
                flex items-center justify-center
                bg-black/50">

        <!-- Modal -->
        <div ref = "dialog"
            class = "relative w-full max-w-2xl border-2 border-brand
                    rounded-lg bg-dark-gray shadow-xl max-h-[90vh]
                    flex flex-col"
            role = "dialog"
            aria-modal = "true"
            tabindex = "-1">

            <!-- Header -->
            <div class = "flex items-center justify-between px-4 py-3">
                <h2 class = "text-lg font-semibold text-white">{{ title }}</h2>
                <button v-if = "showClose"
                        @click = "close"
                        aria-label = "Close modal"
                        class = "group flex h-9 w-9 items-center text-white justify-center rounded-full ring-2 ring-white
                                transition hover:ring-brand hover:bg-white hover:text-brand
                                focus:ring-2 focus:ring-brand transition duration-500 ease-in-out">
                <i class = "fas fa-times transition-transform duration-300 group-hover:rotate-90"></i>
                </button>
            </div>

            <!-- Main -->
            <div class = "px-4 py-0  overflow-y-auto">
                <slot name = "main"></slot>
            </div>

            <!-- Footer -->
            <div class = "px-4 py-0">
                <slot name = "footer"></slot>
            </div>

        </div>
    </div>
</transition>
</Teleport>
</template>

<script setup lang = "ts">
import { ref, watch, nextTick} from 'vue'

const props = defineProps({
    title: { type: String, default: "Modal Title" },
    actionText: { type: String, default: "Apply" },
    showClose: { type: Boolean, default: true },
})

const isVisible = ref(false)
const dialog    = ref<HTMLElement | null>(null)
var lastFocusedElement: HTMLElement | null = null

const open = async () => {

    lastFocusedElement = document.activeElement as HTMLElement
    isVisible.value = true

    await nextTick()
    dialog.value?.focus()
}

const close = () => {
    isVisible.value = false
    lastFocusedElement?.focus()
}

/* ESC handler now respects showClose */
const onEsc = () => {
    if(props.showClose) close()
}

const trapFocus = (e: KeyboardEvent) => {
    if( e.key !== 'Tab' || !dialog.value) return

    const focusable = dialog.value.querySelectorAll<HTMLElement>(
        'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    )

    const first = focusable[0]
    const last  = focusable[focusable.length - 1]

    if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
    }
}

watch( isVisible, (visible) => {
    if (visible) document.addEventListener('keydown', trapFocus)
    else document.removeEventListener('keydown', trapFocus)
})

defineExpose({ open, close })
</script>

