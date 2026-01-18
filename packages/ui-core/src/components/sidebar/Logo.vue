<template>
<div>
    <h2 class="text-4xl mt-0 pt-0 text-brand font-harkana">HARKANA</h2>
    <hr class="h-0.5 bg-gray border-0 ">
    <h2 class="text-xl mt-0 pt-0 text-brand font-extrabold">{{ appName }}</h2>
</div>
</template>

<script setup>
const appName = import.meta.env.VITE_APP_NAME
</script>