<template>
    <div class = "w-full">
        <div class = "relative w-full">

            <!-- Search icon -->
            <span
                class = "pointer-events-none absolute inset-y-0 left-4
                       flex items-center text-gray-400
                       transition-colors duration-150
                       group-focus-within:text-brand">
                <i class = "fas fa-search"></i>
            </span>

            <!-- Input -->
            <input
                type = "text"
                class = "group w-full rounded-full border border-gray-300
                         bg-white pl-11 pr-11 py-2
                         text-gray-900 placeholder-gray-500
                         shadow-sm
                         transition-all duration-150
                         focus:outline-none focus:ring-2 focus:ring-brand
                         focus:border-brand"
                placeholder = "Search projects"
                v-model = "searchPattern" />

            <!-- Clear button -->
            <button
                v-if = "searchPattern.length"
                @click = "searchPattern = ''"
                aria-label = "Clear search"
                class = "absolute right-2 top-1/2 -translate-y-1/2
                    flex h-8 w-8 items-center justify-center
                    rounded-full
                    text-gray-400
                    transition-all duration-150
                    hover:bg-gray-100 hover:text-brand
                    focus:outline-none focus:ring-2 focus:ring-brand
                    animate-fade-in">
                <i class = "fas fa-times"></i>
            </button>

        </div>
    </div>
</template>

<script setup>

const searchPattern = defineModel({ default: "" })

</script>
