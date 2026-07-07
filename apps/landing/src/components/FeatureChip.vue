<template>
<span :class = "chipClass" :title = "description || undefined">
    {{ label }}
    <span v-if = "description"
          class = "pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-20 hidden w-52 -translate-x-1/2 rounded-lg bg-gray-700 px-2 py-2 text-xs font-medium leading-snug text-white shadow-lg group-hover:block">
        {{ description }}
    </span>
</span>
</template>

<script setup>

import { computed } from 'vue'

const props = defineProps({
    label: { type: String, required: true },
    description: { type: String, default: '' },
    tone: { type: String, default: 'neutral' }
})

const chipClass = computed(() => {
    const base = 'group relative rounded-full px-2 py-1'
    if( props.tone === 'brand' ){
        return base + ' bg-brand/10 text-brand'
    }
    if( props.tone === 'hero' ){
        return base + ' border border-white/20 bg-white/10 text-white px-3'
    }
    return base + ' bg-gray-100 text-gray-700'
})

</script>
