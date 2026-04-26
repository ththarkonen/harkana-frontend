<template>
<div :class = "rowClasses">
    <span class = "min-w-0 flex-1 text-black">
        <slot></slot>
    </span>
    <span class = "flex h-5 w-5 shrink-0 items-center justify-center">

        <div v-show = "showProgress"><Spinner class = "h-5 w-5 text-brand"></Spinner></div>
        <div v-show = "showSuccess"><i class = "fa fa-check text-brand"></i></div>
        <div v-show = "showError"><i class = "fa fa-exclamation-triangle text-red-500"></i></div>
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

const rowClasses = computed(() => {
    const baseClass = "flex items-center justify-between gap-3 rounded-lg border bg-white p-4 text-sm"
    if( showError.value ){
        return baseClass + " border-red-500/70"
    }

    return baseClass + " border-brand"
})

</script>

