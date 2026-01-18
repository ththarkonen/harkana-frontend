<template>
    <div class="flex flex-col gap-2 rounded-lg
                border-2 border-brand bg-black/5 p-4 shadow-sm">
        <!-- Label -->
        <h4 class=" font-semibold text-black">
            {{ description }}
        </h4>

        <!-- Picker Row -->
        <div class="flex items-center gap-3">

            <!-- Hex display -->
            <input
                type="number"
                min = "0"
                max = "1"
                step = "0.01"
                v-model="opacity"
                class="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-800
                       focus:outline-none focus:ring-2 focus:ring-brand"
            />

            <!-- Preview swatch -->
            <div class = "h-10 w-10 rounded-md border border-gray-300" :style="{ backgroundColor: previewColor}"></div>
        </div>
    </div>
</template>

<script setup>

import { computed } from 'vue'

const props = defineProps({
    description: { type: String, default: 'Opacity'},
    color: { type: String, default: "#000000"}
})

const opacity = defineModel({ type: Number, default: 1})

const previewColor = computed(() => {
    
    let hex = props.color.replace('#', '').trim()

    // If 3-digit hex, expand to 6 digits
    if( hex.length === 3 ){
        hex = hex.split('').map( c => c + c ).join('')
    }

    // Now safely convert
    const r = parseInt( hex.substring( 0, 2), 16)
    const g = parseInt( hex.substring( 2, 4), 16)
    const b = parseInt( hex.substring( 4, 6), 16)

    return `rgba(${r}, ${g}, ${b}, ${opacity.value})`
})

</script>