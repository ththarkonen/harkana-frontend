<template>
<div class = "space-y-2">
    <label class = "block">
        <div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">{{ description }}</div>
        <input
            type="text"
            class="w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand"
            v-model="input"
            :placeholder="placeholder"
        />
    </label>
    <div
        class="min-h-[1.5rem] text-base text-black/80"
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
