<template>
<footer class="text-center py-6 bg-gray-100 text-gray-600">
    <p>
        © {{ currentYear }} HARKANA. All rights reserved.
    </p>
    <p>
        Contact us:
        <a href="mailto:contact@harkana.com" class="text-brand hover:text-brand-light">
            contact@harkana.com
        </a>
    </p>
    <a href="https://github.com/ththarkonen/harkana-frontend" target="_blank" rel="noopener noreferrer" class="text-brand hover:text-brand-light">
        Frontend software repository
    </a>
    <p>
        <router-link to="/terms" class="text-brand hover:text-brand-light">Terms & Privacy</router-link>
    </p>
</footer>
</template>

<script setup>

const currentYear = new Date().getFullYear()

</script>
