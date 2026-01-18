<template>
    <span class="inline-block w-3 text-xs text-right">
        <span v-if="active">
            {{ dir === 'asc' ? '▲' : '▼' }}
        </span>
    </span>
</template>

<script setup lang="ts">
defineProps<{
    active: boolean
    dir: 'asc' | 'desc'
}>()
</script>