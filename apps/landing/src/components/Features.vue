<template>
<section id = "features" class = "py-10 bg-gray-50 text-gray-800 px-6">

    <div class = "max-w-6xl mx-auto text-center mb-12">
        <h2 class = "text-3xl sm:text-4xl font-bold">
            Features
        </h2>
        <p class = "text-base sm:text-lg text-gray-600 mt-3 max-w-3xl mx-auto">
            Every new account includes free starter compute tokens, so you can run analyses before buying additional bundles.
        </p>
    </div>

    <div class = "max-w-6xl mx-auto space-y-12">

        <div class = "grid md:grid-cols-3 gap-8 text-center">

            <!-- Card 1 -->
            <div class = "flex flex-col h-full p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition bg-white">
                <div class = "flex justify-center mb-4">
                    <CogIcon class = "w-12 h-12 text-brand"/>
                </div>

                <h3 class = "text-xl font-semibold mb-2">
                    Automatic Correction
                </h3>

                <p class = "text-gray-600">
                    Automatic correction and denoising of data.
                </p>
            </div>

            <!-- Card 2 -->
            <div class = "flex flex-col h-full p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition bg-white">
                <div class = "flex justify-center mb-4">
                    <UsersIcon class = "w-12 h-12 text-brand"/>
                </div>

                <h3 class = "text-xl font-semibold mb-2">
                    Sharing & Collaboration
                </h3>

                <p class = "text-gray-600">
                    Easily share datasets and results with your team or collaborators.
                </p>
            </div>

            <!-- Card 3 -->
            <div class = "flex flex-col h-full p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition bg-white">
                <div class = "flex justify-center mb-4">
                    <ArrowUpTrayIcon class = "w-12 h-12 text-brand"/>
                </div>

                <h3 class = "text-xl font-semibold mb-2">
                    Digital Object Identifiers
                </h3>

                <p class = "text-gray-600">
                    Publish your data, metadata, and results to Zenodo and obtain a DOI instantly.
                </p>
            </div>
            
        </div>

        <!-- Bottom Row: Cards 4–5, centered -->
        <div class = "grid md:grid-cols-2 gap-8 text-center justify-center">

            <!-- Card 4 -->
            <div class = "flex flex-col h-full p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition bg-white">
                <div class = "flex justify-center mb-4 max-w-6xl mx-auto">
                    <CpuChipIcon class = "w-12 h-12 text-brand"/>
                </div>

                <h3 class = "text-xl font-semibold mb-2">
                    Free Starter Tokens
                </h3>

                <p class = "text-gray-600">
                    New users receive free compute tokens at signup, and shared token pools let teams analyze data without individual setup.
                </p>
            </div>

            <!-- Card 5 -->
            <div class = "flex flex-col h-full p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition bg-white">
                <div class = "flex justify-center mb-4">
                    <ShieldCheckIcon class = "w-12 h-12 text-brand"/>
                </div>

                <h3 class = "text-xl font-semibold mb-2">
                    No Credit Card Required
                </h3>

                <p class = "text-gray-600">
                    Start with your free tokens immediately, with no payment details needed.
                </p>
            </div>

        </div>
    </div>
</section>
</template>

<script setup>

import { defineAsyncComponent } from 'vue'

const CogIcon = defineAsyncComponent(() =>
    import('@heroicons/vue/24/outline/CogIcon')
)

const UsersIcon = defineAsyncComponent(() =>
    import('@heroicons/vue/24/outline/UsersIcon')
)

const ArrowUpTrayIcon = defineAsyncComponent(() =>
    import('@heroicons/vue/24/outline/ArrowUpTrayIcon')
)

const CpuChipIcon = defineAsyncComponent(() =>
    import('@heroicons/vue/24/outline/CpuChipIcon')
)

const ShieldCheckIcon = defineAsyncComponent(() =>
    import('@heroicons/vue/24/outline/ShieldCheckIcon')
)

</script>
