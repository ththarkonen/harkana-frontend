<template>
<section id = "examples" class = "py-12 bg-gray-50 text-gray-800 px-6">
    <div class = "max-w-6xl mx-auto">

        <h2 class = "text-3xl sm:text-4xl font-bold text-center mb-3">
            Example results
        </h2>

        <p class = "mb-10 text-center text-base sm:text-lg text-gray-600">
            Representative single-spectrum outputs from automatic correction and Raman spectrum estimation workflows.
        </p>

        <div class = "grid md:grid-cols-2 gap-12">
            <ExampleResult v-for = "example in visibleExamples"
                           :key = "example.title"
                           :title = "example.title"
                           :description = "example.description"
                           :rawImage = "example.rawImage"
                           :correctedImage = "example.correctedImage"
                           :rawCaption = "example.rawCaption"
                           :correctedCaption = "example.correctedCaption"/>
        </div>

    </div>
</section>
</template>

<script setup>

import { computed } from 'vue'
import ExampleResult from '@/components/ExampleResult.vue'

const examples = [
    {
        enabled: true,
        title: 'CARS to Raman spectrum',
        description: 'Automatic phase correction and denoising',
        rawImage: '/examples/cars-raw.png',
        correctedImage: '/examples/cars-corrected.png',
        rawCaption: 'Raw CARS spectrum with strong non-resonant background.',
        correctedCaption: 'CARS spectrum after phase correction and background suppression. Automatic processing, no manual parameter tuning.'
    },
    {
        enabled: true,
        title: 'Raman baseline correction',
        description: 'Noise suppression and baseline removal',
        rawImage: '/examples/raman-raw.png',
        correctedImage: '/examples/raman-corrected.png',
        rawCaption: 'Raw Raman spectrum with background and measurement noise.',
        correctedCaption: 'Baseline-corrected and denoised Raman spectrum with enhanced vibrational peak visibility. Automatic processing, no manual parameter tuning.'
    },
    {
        enabled: false,
        title: 'Hyperspectral false-color analysis',
        description: 'Representative hyperspectral visualization and spectral estimation',
        rawImage: '/examples/hyperspectral-raw.png',
        correctedImage: '/examples/hyperspectral-result.png',
        rawCaption: 'Uploaded hyperspectral microscopy dataset.',
        correctedCaption: 'False-color visualization with spectral analysis outputs.'
    }
]

const visibleExamples = computed(() => examples.filter((example) => example.enabled))

</script>
