<template>
<section class = "bg-white px-6 py-8 text-gray-800">
    <div class = "mx-auto grid max-w-6xl gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm md:grid-cols-2">
        <div class = "rounded-xl bg-white p-4">
            <div class = "text-xs font-semibold uppercase tracking-wide text-black/60">
                Single-spectrum inputs
            </div>
            <div class = "mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <FeatureChip v-for = "chip in spectralFormatChips"
                             :key = "chip.label"
                             :label = "chip.label"
                             :description = "chip.description"
                             tone = "brand" />
            </div>
        </div>

        <div class = "rounded-xl bg-white p-4">
            <div class = "text-xs font-semibold uppercase tracking-wide text-black/60">
                Hyperspectral inputs
            </div>
            <div class = "mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <FeatureChip v-for = "chip in hyperspectralFormatChips"
                             :key = "chip.label"
                             :label = "chip.label"
                             :description = "chip.description"
                             tone = "brand" />
            </div>
        </div>
    </div>
</section>
</template>

<script setup>

import FeatureChip from './FeatureChip.vue'

const spectralFormatChips = [
    { label: 'TXT', description: 'Plain text spectrum files' },
    { label: 'CSV', description: 'Comma-separated spectrum tables' },
    { label: 'JSON', description: 'Structured spectrum data' },
    { label: 'SPC', description: 'Binary spectroscopy file format' }
]

const hyperspectralFormatChips = [
    { label: 'OIR', description: 'Olympus Image Resource hyperspectral microscopy data' },
    { label: 'TIFF', description: 'Standard TIFF image stacks analyzed as layers' },
    { label: 'OME-TIFF', description: 'OME-TIFF microscopy datasets with embedded axis metadata' },
    { label: 'OME-Zarr', description: 'OME-Zarr multiscale microscopy datasets' }
]

</script>
