<template>
<button class = "w-full mt-4 mb-4 bg-brand hover:bg-brand-dark text-white
                font-semibold py-2 px-4 rounded transition-colors
                focus:outline-none focus:color-brand-dark"
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