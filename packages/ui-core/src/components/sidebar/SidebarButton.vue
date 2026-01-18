<template>
<button class = "inline-flex items-center justify-center px-4 py-2 rounded rounded-full w-full
                bg-brand text-white font-semibold cursor-pointer hover:bg-brand-dark transition shadow-md shadow-black"
        :class = "{ 'opacity-50 cursor-not-allowed': loading || disabled }"
        :disabled = "disabled">
    <div class="relative">
        <span :class="{ invisible: loading }">
            <slot></slot>
        </span>
        <!-- Spinner overlay -->
        <span v-if="loading" class="absolute inset-0 flex items-center justify-center">
            <Spinner class="w-6 h-6 text-white" />
        </span>
    </div>
</button>
</template>

<script setup>

import Spinner from "../general/Spinner.vue"

const props = defineProps({
    loading: { type: Boolean, default: false},
    disabled: { type: Boolean, default: false}
});

</script>