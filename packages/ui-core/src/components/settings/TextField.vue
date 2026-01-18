<template>
    <div class="my-4 rounded-md border-2 border-brand bg-black/5 shadow-black shadow-lg p-4">
        <label class="block">
            <h4 class="mb-2 text-sm font-semibold text-black">
                {{ description }}
            </h4>

            <input
                type="text"
                v-model="model"
                :placeholder="placeholder"
                class="w-full rounded border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand"
            />
        </label>

        <slot></slot>
    </div>
</template>

<script setup>

defineProps({
    description: { type: String, default: 'Latex formula' },
    placeholder: { type: String, default: 'e.g., y, \\ell, \\alpha_1' }
})

const model = defineModel({ type: String, default: '' })

</script>
