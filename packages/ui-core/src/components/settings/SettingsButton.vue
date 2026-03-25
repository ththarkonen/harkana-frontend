<template>
<button
    :disabled="loading"
    class="inline-flex w-auto items-center justify-center rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-xs font-semibold text-black/75 transition-colors duration-150 hover:border-brand hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-50">
    <div class="relative">
        <span :class="{ invisible: loading }">
            <slot></slot>
        </span>
        <!-- Spinner overlay -->
        <span v-if="loading" class="absolute inset-0 flex items-center justify-center">
            <Spinner class="w-6 h-6 text-current" />
        </span>
    </div>
</button>
</template>

<script setup>

import Spinner from "../general/Spinner.vue"

const props = defineProps({
    loading: { type: Boolean, default: false}
});

</script>
