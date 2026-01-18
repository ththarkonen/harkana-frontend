<template>
<div class="flex items-center justify-between
            gap-3 px-2 py-1 text-sm text-white">
    <span class="flex-1 truncate">
        <slot></slot>
    </span>
    <span class="flex items-center justify-center w-5 h-5 shrink-0">

        <div v-show = "showProgress"><Spinner class="w-5 h-5 text-brand"></Spinner></div>
        <div v-show = "showSuccess"><i class = "w-4 h-4 fa fa-check"></i></div>
        <div v-show = "showError"><i class = "w-4 h-4 fa fa-exclamation-triangle"></i></div>
    </span>
</div>
</template>

<script setup>

import { computed } from 'vue'

import Spinner from '../general/Spinner.vue'
const props = defineProps({ state: { type: String}})

const showProgress = computed(() => props.state === "progress")
const showSuccess = computed(() => props.state === "success")
const showError = computed(() => props.state === "error")

</script>


