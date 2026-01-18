<template>
<section id = "examples" class = "py-12 bg-gray-50 text-gray-800 px-6">
    <div class = "max-w-6xl mx-auto">

        <h2 class = "text-3xl sm:text-4xl font-bold text-center mb-10">
            Example results
        </h2>

        <div class = "grid md:grid-cols-2 gap-12">
            <ExampleResult
                title = "CARS to Raman spectrum"
                description = "Automatic phase correction and denoising"
                rawImage = "/examples/cars-raw.png"
                correctedImage = "/examples/cars-corrected.png"
                rawCaption = "Raw CARS spectrum with strong non-resonant background."
                correctedCaption = "CARS spectrum after phase correction and background suppression.
                                    Automatic processing, no manual parameter tuning."/>

            <ExampleResult
                title = "Raman baseline correction"
                description = "Noise suppression and baseline removal"
                rawImage = "/examples/raman-raw.png"
                correctedImage = "/examples/raman-corrected.png"
                rawCaption = "Raw Raman spectrum with background and measurement noise."
                correctedCaption = "Baseline-corrected and denoised Raman spectrum with enhanced vibrational peak visibility.
                                    Automatic processing, no manual parameter tuning."/>
        </div>

    </div>
</section>
</template>

<script setup>

import ExampleResult from '@/components/ExampleResult.vue';

</script>