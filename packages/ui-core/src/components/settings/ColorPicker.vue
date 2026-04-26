<template>
    <div class="space-y-2">
        <div class="text-xs font-semibold uppercase tracking-wide text-black/70">
            {{ description }}
        </div>

        <div class="flex items-center gap-3">
            <input
                type="color"
                v-model="color"
                class="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-black/15 bg-transparent p-0"
            />

            <input
                type="text"
                v-model="color"
                class="flex-1 border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-mono text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand"
            />

            <div
                class="h-9 w-9 shrink-0 rounded-md border border-black/10"
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
