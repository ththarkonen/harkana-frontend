<template>
<section id = "features" class = "py-10 bg-gray-50 text-gray-800 px-6">

    <div class = "max-w-6xl mx-auto text-center mb-12">
        <h2 class = "text-3xl sm:text-4xl font-bold">
            Features
        </h2>
        <p class = "text-base sm:text-lg text-gray-600 mt-3 max-w-3xl mx-auto">
            A research-oriented environment for single-spectrum and hyperspectral spectroscopy workflows.
        </p>
    </div>

    <div class = "max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-center">

        <div v-for = "feature in featureCards"
             :key = "feature.title"
             class = "flex flex-col h-full p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition bg-white">
            <div class = "flex justify-center mb-4">
                <component :is = "feature.icon" class = "w-12 h-12 text-brand"/>
            </div>

            <h3 class = "text-xl font-semibold mb-2">
                {{ feature.title }}
            </h3>

            <p class = "text-gray-600">
                {{ feature.description }}
            </p>
        </div>

    </div>
</section>
</template>

<script setup>

import { defineAsyncComponent } from 'vue'

const CogIcon = defineAsyncComponent(() =>
    import('@heroicons/vue/24/outline/CogIcon')
)

const ChartBarIcon = defineAsyncComponent(() =>
    import('@heroicons/vue/24/outline/ChartBarIcon')
)

const AdjustmentsHorizontalIcon = defineAsyncComponent(() =>
    import('@heroicons/vue/24/outline/AdjustmentsHorizontalIcon')
)

const CursorArrowRaysIcon = defineAsyncComponent(() =>
    import('@heroicons/vue/24/outline/CursorArrowRaysIcon')
)

const ArrowUpTrayIcon = defineAsyncComponent(() =>
    import('@heroicons/vue/24/outline/ArrowUpTrayIcon')
)

const CpuChipIcon = defineAsyncComponent(() =>
    import('@heroicons/vue/24/outline/CpuChipIcon')
)

const featureCards = [
    {
        title: 'Spectral Correction and Estimation',
        description: 'Automatic correction, denoising, and Raman spectrum estimation for CARS and Raman spectra.',
        icon: CogIcon
    },
    {
        title: 'Hyperspectral Visualization',
        description: 'Explore hyperspectral datasets with MIP, HSV-mapped MIP, UMAP, PCA, RPCA, layer, and Z-blend views.',
        icon: ChartBarIcon
    },
    {
        title: 'Spectral Axis Calibration',
        description: 'Create, preview, save, share, and reuse calibration profiles to align spectral axes across projects.',
        icon: AdjustmentsHorizontalIcon
    },
    {
        title: 'Pixel and ROI Spectra',
        description: 'Inspect spectra from selected pixels and regions of interest, then compare measured and estimated responses.',
        icon: CursorArrowRaysIcon
    },
    {
        title: 'Collaboration and DOI Export',
        description: 'Share datasets and results with collaborators, curate metadata, and publish datasets to Zenodo with DOI export.',
        icon: ArrowUpTrayIcon
    },
    {
        title: 'Compute Tokens and Team Billing',
        description: 'Use starter compute tokens, shared group token pools, and monthly billing previews for team workflows.',
        icon: CpuChipIcon
    }
]

</script>
