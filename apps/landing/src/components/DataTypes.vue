<template>
<section id = "tools" class = "py-10 bg-gray-50 text-gray-800 px-6">

    <div class = "max-w-6xl mx-auto text-center mb-12">
        <h2 class = "text-3xl sm:text-4xl font-bold">
            Tools
        </h2>
        <p class = "text-base sm:text-lg text-gray-600 mt-3 max-w-3xl mx-auto">
            Choose your spectroscopy modality and start a free analysis session in one click.
        </p>
    </div>

    <div class = "max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-center">

        <a class = "block" :href = "carsToolUrl" target = "_blank" rel = "noopener noreferrer">
            <div class = "flex flex-col h-full p-6 rounded-xl shadow-sm border border-gray-200
                            hover:shadow-brand-dark transition hover:cursor-pointer bg-white">

                <div class = "flex justify-center mb-4">
                    <BeakerIcon class = "w-12 h-12 text-brand"/>
                </div>

                <h3 class = "text-xl font-semibold mb-2">
                    Coherent anti-Stokes Raman scattering
                </h3>
                
                <p class = "text-gray-600">
                    Raw and preprocessed CARS spectra in various formats for analysis and correction.
                </p>

                <div class = "mt-4 md:flex-1"></div>

                <span class = "inline-flex items-center justify-center bg-brand text-white font-semibold px-4 py-2 rounded-lg hover:bg-brand-dark transition">
                    Start free analysis
                </span>

            </div>
        </a>

        <a class = "block" :href = "ramanToolUrl" target = "_blank" rel = "noopener noreferrer">
            <div class = "flex flex-col h-full p-6 rounded-xl shadow-sm border border-gray-200
                            hover:shadow-brand-dark transition hover:cursor-pointer bg-white">

                <div class = "flex justify-center mb-4">
                    <BeakerIcon class = "w-12 h-12 text-brand"/>
                </div>

                <h3 class = "text-xl font-semibold mb-2">
                    Raman scattering
                </h3>

                <p class = "text-gray-600">
                    Raw and preprocessed Raman spectra in various formats for analysis and correction.
                </p>

                <div class = "mt-4 md:flex-1"></div>

                <span class = "inline-flex items-center justify-center bg-brand text-white font-semibold px-4 py-2 rounded-lg hover:bg-brand-dark transition">
                    Start free analysis
                </span>

            </div>
        </a>

        <div class = "flex flex-col h-full p-6 rounded-xl border border-gray-300 bg-gray-100
                        text-gray-400 opacity-50 cursor-not-allowed">
            
            <div class = "flex justify-center mb-4">
                <CubeTransparentIcon class = "w-12 h-12 text-gray-400" />
            </div>

            <h3 class = "text-xl font-semibold mb-2">
                Hyperspectra
            </h3>

            <p class = "text-gray-400">
                Under Construction.
            </p>
            
        </div>
    
    </div>
</section>
</template>

<script setup>

import { defineAsyncComponent } from 'vue'

const carsToolUrl = 'https://cars.harkana.com'
const ramanToolUrl = 'https://raman.harkana.com'

const CubeTransparentIcon = defineAsyncComponent(() =>
  import('@heroicons/vue/24/outline/CubeTransparentIcon')
)

const BeakerIcon = defineAsyncComponent(() =>
  import('@heroicons/vue/24/outline/BeakerIcon')
)

</script>
