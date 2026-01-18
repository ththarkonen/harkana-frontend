<template>
<header class="absolute top-0 left-0 w-full flex justify-between items-center px-4 md:px-8 py-4 z-20">
    <div class="text-2xl md:text-4xl brand-logo font-bold text-brand">
        HARKANA
    </div>
    
    <!-- Mobile menu button -->
    <button @click = "mobileMenuOpen = !mobileMenuOpen" class = "md:hidden text-white hover:text-brand focus:outline-none">
        <svg v-if = "!mobileMenuOpen" class = "w-6 h-6" fill = "none" stroke = "currentColor" viewBox = "0 0 24 24">
            <path stroke-linecap = "round" stroke-linejoin = "round" stroke-width = "2" d = "M4 6h16M4 12h16M4 18h16"></path>
        </svg>
        <svg v-else class = "w-6 h-6" fill = "none" stroke = "currentColor" viewBox = "0 0 24 24">
            <path stroke-linecap = "round" stroke-linejoin = "round" stroke-width="2" d = "M6 18L18 6M6 6l12 12"></path>
        </svg>
    </button>

    <!-- Desktop Navigation -->
    <nav class="hidden md:flex items-center space-x-6">
        <!-- Dropdown -->
        <div class = "relative">
            <button @click = "dropdownOpen = !dropdownOpen"
                    class = "flex items-center text-xl hover:text-brand focus:outline-none">
                Tools
                <svg
                    class = "ml-1 w-4 h-4"
                    fill = "none"
                    stroke = "currentColor"
                    viewBox = "0 0 24 24"
                    xmlns = "http://www.w3.org/2000/svg">
                    <path stroke-linecap = "round" stroke-linejoin = "round" stroke-width = "2" d = "M19 9l-7 7-7-7"></path>
                </svg>
            </button>

            <div v-show = "dropdownOpen" class = "absolute right-0 mt-2 px-2 inline-block bg-white
                                                border border-brand rounded-lg shadow-lg py-2 text-left z-30">

                <a  href = "https://cars.harkana.com" target="_blank" rel = "noopener noreferrer"
                    class="block whitespace-nowrap text-black rounded-sm px-4 py-2 hover:bg-brand hover:text-white transition">
                    Coherent anti-Stokes Raman scattering
                </a>

                <a  href = "https://raman.harkana.com" target = "_blank" rel = "noopener noreferrer"
                    class = "block whitespace-nowrap text-black rounded-sm px-4 py-2 hover:bg-brand hover:text-white transition">
                    Raman scattering
                </a>
                
            </div>
        </div>

        <router-link to="/#examples" class="text-xl hover:text-brand">Examples</router-link>
        <router-link to="/#features" class="text-xl hover:text-brand">Features</router-link>
        <router-link to="/pricing" class="text-xl hover:text-brand">Pricing</router-link>
        <router-link to="/terms" class="text-xl hover:text-brand">Terms & Privacy</router-link>
    </nav>

    <!-- Mobile Navigation -->
    <nav v-show = "mobileMenuOpen" class = "md:hidden absolute top-full left-0 w-full bg-gray-700 shadow-lg py-4 px-4 space-y-4">
        <!-- Mobile Tools Dropdown -->
        <div>
            <button @click = "mobileDropdownOpen = !mobileDropdownOpen"
                    class="flex items-center justify-between w-full text-lg hover:text-brand focus:outline-none py-2">
                Tools
                <svg
                    :class = "['w-4 h-4 transition-transform', mobileDropdownOpen ? 'rotate-180' : '']"
                    fill = "none"
                    stroke = "currentColor"
                    viewBox = "0 0 24 24">
                    <path stroke-linecap = "round" stroke-linejoin = "round" stroke-width = "2" d = "M19 9l-7 7-7-7"></path>
                </svg>
            </button>
            
            <div v-show="mobileDropdownOpen" class="pl-4 mt-2 space-y-2">
                <a  href = "https://cars.harkana.com" target = "_blank" rel = "noopener noreferrer"
                    class = "block text-gray-300 hover:text-brand py-2">
                    Coherent anti-Stokes Raman scattering
                </a>
                <a  href = "https://raman.harkana.com" target="_blank" rel="noopener noreferrer"
                    class = "block text-gray-300 hover:text-brand py-2">
                    Raman scattering
                </a>
            </div>
        </div>

        <router-link to = "/#examples" @click = "mobileMenuOpen = false" class = "block text-lg hover:text-brand py-2">
            Examples
        </router-link>
        <router-link to = "/#features" @click = "mobileMenuOpen = false" class = "block text-lg hover:text-brand py-2">
            Features
        </router-link>
        <router-link to = "/pricing" @click = "mobileMenuOpen = false" class = "block text-lg hover:text-brand py-2">
            Pricing
        </router-link>
        <router-link to = "/terms" @click = "mobileMenuOpen = false" class = "block text-lg hover:text-brand py-2">
            Terms & Privacy
        </router-link>
    </nav>
</header>
</template>

<script setup>

import { ref } from 'vue'

const dropdownOpen = ref(false)
const mobileMenuOpen = ref(false)
const mobileDropdownOpen = ref(false)

</script>