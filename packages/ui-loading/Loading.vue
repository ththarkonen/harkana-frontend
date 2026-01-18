<template>
    <div 
        ref="overlay"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-dark-gray rounded-lg border-brand border-2 transition-opacity duration-100"
        :style="{
            opacity: opacity,
            pointerEvents: opacity > 0 ? 'auto' : 'none'
        }"
    >
        <Spinner class="text-brand" />
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import Spinner from './Spinner.vue'

const props = defineProps({
    visible: { type: Boolean, required: true }
})

const overlay = ref(null)
const opacity = ref(props.visible ? 1 : 0)

// Watch for visible changes
watch(() => props.visible, (newVal) => {
    if (newVal) {
        // Show immediately
        opacity.value = 1
    } else {
        // Fade out over 300ms
        const duration = 100
        const interval = 16 // ~60fps
        const decrement = interval / duration
        let currentOpacity = 1

        const fade = setInterval(() => {
            currentOpacity -= decrement
            if (currentOpacity <= 0) {
                currentOpacity = 0
                clearInterval(fade)
            }
            opacity.value = currentOpacity
        }, interval)
    }
})
</script>




