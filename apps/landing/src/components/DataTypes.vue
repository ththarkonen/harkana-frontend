<template>
<section id = "tools" class = "py-10 bg-gray-50 text-gray-800 px-6">

    <div class = "max-w-6xl mx-auto text-center mb-12">
        <h2 class = "text-3xl sm:text-4xl font-bold">
            Tools
        </h2>
        <p class = "text-base sm:text-lg text-gray-600 mt-3 max-w-3xl mx-auto">
            Choose a spectroscopy workflow and start a free analysis session in one click.
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

                <div class = "mt-4 flex flex-wrap justify-center gap-2 text-xs font-semibold text-brand">
                    <span v-for = "chip in spectralFormatChips"
                          :key = "chip.label"
                          class = "group relative rounded-full bg-brand/10 px-2 py-1">
                        {{ chip.label }}
                        <span class = "pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-20 hidden w-52 -translate-x-1/2 rounded-lg bg-gray-700 px-2 py-2 text-xs font-medium leading-snug text-white shadow-lg group-hover:block">
                            {{ chip.description }}
                        </span>
                    </span>
                </div>

                <div class = "mt-3 flex flex-wrap justify-center gap-2 text-xs font-semibold text-gray-700">
                    <span v-for = "chip in spectralMethodChips"
                          :key = "chip.label"
                          class = "group relative rounded-full bg-gray-100 px-2 py-1">
                        {{ chip.label }}
                        <span class = "pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-20 hidden w-52 -translate-x-1/2 rounded-lg bg-gray-700 px-2 py-2 text-xs font-medium leading-snug text-white shadow-lg group-hover:block">
                            {{ chip.description }}
                        </span>
                    </span>
                </div>

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

                <div class = "mt-4 flex flex-wrap justify-center gap-2 text-xs font-semibold text-brand">
                    <span v-for = "chip in spectralFormatChips"
                          :key = "chip.label"
                          class = "group relative rounded-full bg-brand/10 px-2 py-1">
                        {{ chip.label }}
                        <span class = "pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-20 hidden w-52 -translate-x-1/2 rounded-lg bg-gray-700 px-2 py-2 text-xs font-medium leading-snug text-white shadow-lg group-hover:block">
                            {{ chip.description }}
                        </span>
                    </span>
                </div>

                <div class = "mt-3 flex flex-wrap justify-center gap-2 text-xs font-semibold text-gray-700">
                    <span v-for = "chip in spectralMethodChips"
                          :key = "chip.label"
                          class = "group relative rounded-full bg-gray-100 px-2 py-1">
                        {{ chip.label }}
                        <span class = "pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-20 hidden w-52 -translate-x-1/2 rounded-lg bg-gray-700 px-2 py-2 text-xs font-medium leading-snug text-white shadow-lg group-hover:block">
                            {{ chip.description }}
                        </span>
                    </span>
                </div>

                <div class = "mt-4 md:flex-1"></div>

                <span class = "inline-flex items-center justify-center bg-brand text-white font-semibold px-4 py-2 rounded-lg hover:bg-brand-dark transition">
                    Start free analysis
                </span>

            </div>
        </a>

        <a class = "block" :href = "hcarsToolUrl" target = "_blank" rel = "noopener noreferrer">
            <div class = "flex flex-col h-full p-6 rounded-xl shadow-sm border border-gray-200
                            hover:shadow-brand-dark transition hover:cursor-pointer bg-white">

                <div class = "flex justify-center mb-4">
                    <CubeTransparentIcon class = "w-12 h-12 text-brand" />
                </div>

                <h3 class = "text-xl font-semibold mb-2">
                    Hyperspectral CARS
                </h3>

                <p class = "text-gray-600">
                    Analyze hyperspectral microscopy datasets with axis-aware upload, UMAP and PCA visualizations, ROI analysis, and pixel-wise Raman spectrum estimation.
                </p>

                <div class = "mt-4 flex flex-wrap justify-center gap-2 text-xs font-semibold text-brand">
                    <span class = "rounded-full bg-brand/10 px-2 py-1">OIR</span>
                    <span class = "rounded-full bg-brand/10 px-2 py-1">TIFF</span>
                    <span class = "rounded-full bg-brand/10 px-2 py-1">OME-TIFF</span>
                    <span class = "rounded-full bg-brand/10 px-2 py-1">OME-Zarr</span>
                </div>

                <div class = "mt-3 flex flex-wrap justify-center gap-2 text-xs font-semibold text-gray-700">
                    <span v-for = "chip in hyperspectralMethodChips"
                          :key = "chip.label"
                          class = "group relative rounded-full bg-gray-100 px-2 py-1">
                        {{ chip.label }}
                        <span class = "pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-20 hidden w-52 -translate-x-1/2 rounded-lg bg-gray-700 px-2 py-2 text-xs font-medium leading-snug text-white shadow-lg group-hover:block">
                            {{ chip.description }}
                        </span>
                    </span>
                </div>

                <div class = "mt-4 md:flex-1"></div>

                <span class = "inline-flex items-center justify-center bg-brand text-white font-semibold px-4 py-2 rounded-lg hover:bg-brand-dark transition">
                    Start free HyperCARS analysis
                </span>

            </div>
        </a>
    
    </div>
</section>
</template>

<script setup>

import { defineAsyncComponent } from 'vue'

const carsToolUrl = 'https://cars.harkana.com'
const ramanToolUrl = 'https://raman.harkana.com'
const hcarsToolUrl = 'https://hcars.harkana.com'

const spectralFormatChips = [
    {
        label: 'TXT',
        description: 'Plain text spectrum files'
    },
    {
        label: 'CSV',
        description: 'Comma-separated spectrum tables'
    },
    {
        label: 'JSON',
        description: 'Structured spectrum data'
    },
    {
        label: 'SPC',
        description: 'Binary spectroscopy file format'
    }
]

const spectralMethodChips = [
    {
        label: 'Raman spectrum estimation',
        description: 'Estimate the underlying Raman spectrum and uncertainty intervals'
    },
    {
        label: 'Spectral axis calibration',
        description: 'Spectral axis alignment using reusable calibration profiles'
    }
]

const hyperspectralMethodChips = [
    {
        label: 'MIP',
        description: 'Maximum intensity projection'
    },
    {
        label: 'HSV-mapped MIP',
        description: 'HSV colormap maximum intensity projection'
    },
    {
        label: 'UMAP',
        description: 'Uniform manifold approximation and projection visualization'
    },
    {
        label: 'PCA',
        description: 'Principal component analysis visualization'
    },
    {
        label: 'RPCA',
        description: 'Robust principal component analysis visualization'
    },
    {
        label: 'Z-blend',
        description: 'Custom color blending of layers'
    },
    {
        label: 'Raman spectrum estimation',
        description: 'Pixel-wise Raman spectrum estimation from hyperspectral measurements'
    },
    {
        label: 'Spectral axis calibration',
        description: 'Spectral axis alignment using reusable calibration profiles'
    }
]

const CubeTransparentIcon = defineAsyncComponent(() =>
  import('@heroicons/vue/24/outline/CubeTransparentIcon')
)

const BeakerIcon = defineAsyncComponent(() =>
  import('@heroicons/vue/24/outline/BeakerIcon')
)

</script>
