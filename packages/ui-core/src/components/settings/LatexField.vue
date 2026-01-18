<template>
<div class = "bg-black/5 rounded-lg p-2 border-2 border-brand">
    <label>
        <h4 class="m-0 mb-2 text-gray-800 font-semibold">{{ description }}</h4>
        <input
            type="text"
            class="w-full px-3 py-2 text-base border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand"
            v-model="input"
            :placeholder="placeholder"
        />
    </label>
    <div 
        class="mt-2 p-2 rounded min-h-[1.5rem] text-lg"
        v-html="renderedLatex"
    ></div>
</div>
</template>

<script setup>

import { computed } from 'vue'
import katex from 'katex'

const props = defineProps({
    description: { type: String, default: "Latex formula" },
    placeholder: { type: String, default: 'e.g., y, \\ell, \\alpha_1' }
})

const input = defineModel({ type: String, default: '' })

const renderedLatex = computed(() => {
    try {
        return katex.renderToString( input.value || '', {
            throwOnError: false,
            displayMode: false,
        })
    } catch {
        return input.value || ''
    }
})
</script>