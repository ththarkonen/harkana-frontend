<template>
    <div class="flex flex-col gap-1 rounded-lg border-2 border-brand bg-black/5 p-4 shadow-sm">
        <div class = "font-semibold">{{ title }}</div>
        <label
            v-for="(label, index) in labels"
            :key="index"
            class="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1
                   hover:bg-white"
        >
            <!-- Checkbox -->
            <input
                type="checkbox"
                v-model="values[index]"
                class="h-4 w-4 accent-brand"
                :aria-label="label"
            />

            <!-- Label text -->
            <span class="font-semibold text-black">
                {{ label }}
            </span>
        </label>
    </div>
</template>

<script setup>

const values = defineModel({
    type: Array,
    required: true,
})

const props = defineProps({
    title: { type: String, required: true},
    labels: {
        type: Array,
        default: () => ["Measurement data","Median estimate",
                        "Marginal 50% uncertainty estimate","Marginal 75% uncertainty estimate",
                        "Marginal 90% uncertainty estimate","Marginal 95% uncertainty estimate",],
    },
})

</script>
