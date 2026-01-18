<template>
    <div class="flex flex-col gap-2 rounded-lg
                border-2 border-brand bg-black/5 p-4 shadow-sm">
        <!-- Label -->
        <h4 class=" font-semibold text-black">
            {{ description }}
        </h4>

        <!-- Picker Row -->
        <div class="flex items-center gap-3">
            <!-- Native color input -->
            <input
                type="color"
                v-model="color"
                class="h-10 w-10 cursor-pointer rounded-md border border-gray-300 bg-transparent p-0"
            />

            <!-- Hex display -->
            <input
                type="text"
                v-model="color"
                class="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-800
                       focus:outline-none focus:ring-2 focus:ring-brand"
            />

            <!-- Preview swatch -->
            <div
                class="h-10 w-10 rounded-md border border-gray-300"
                :style="{ backgroundColor: color }"
            />
        </div>
    </div>
</template>

<script setup>

const color = defineModel({ type: String, default: '#000000' })

defineProps({
    description: {
        type: String,
        default: 'Color',
    },
})

</script>
