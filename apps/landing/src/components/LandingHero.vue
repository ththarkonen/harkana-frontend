<template>
<section class = "relative h-screen flex items-center justify-center text-center px-6">

    <video id = "lazy-hero-video" class = "absolute inset-0 w-full h-full object-cover"
            autoplay loop muted playsinline preload = "none"
            poster = "/videos/poster.png" data-src = "/videos/spectra.mp4">
    </video>

    <!-- Overlay for readability -->
    <div class = "absolute inset-0" style = "background-color: rgba(0, 0, 0, 0.8);"></div>

    <!-- Hero Content -->
    <div class = "relative z-10 max-w-3xl mx-auto space-y-6">
        
        <h1 class = "text-3xl sm:text-4xl md:text-6xl font-bold leading-tight">
            Automatic <span class = "text-brand">correction</span>,
            <span class="text-brand">collaboration</span>, and
            <span class="text-brand">management</span>
            for spectroscopic datasets.
        </h1>

        <p class = "text-base sm:text-lg md:text-xl text-gray-200">
            Streamline your spectroscopy workflow: automatic correction, collaborative data sharing, and DOI generation for reproducible research.
        </p>

        <div class = "flex flex-col sm:flex-row gap-4 justify-center">
            <router-link to = "/#examples" class="bg-brand font-bold text-white px-6 py-3 rounded-lg shadow hover:bg-brand-dark transition">
                Examples
            </router-link>
            <router-link to = "/#features" class="bg-brand font-bold text-white px-6 py-3 rounded-lg shadow hover:bg-brand-dark transition">
                Features
            </router-link>
            <router-link to = "/#example-workflow" class="bg-brand font-bold text-white px-6 py-3 rounded-lg shadow hover:bg-brand-dark transition">
                Example workflow
            </router-link>
            <router-link to = "/#tools" class="bg-brand font-bold text-white px-6 py-3 rounded-lg shadow hover:bg-brand-dark transition">
                Tools
            </router-link>
        </div>

    </div>

</section>
</template>

<script setup>

import { ref, onMounted} from 'vue'
const videoLoaded = ref(false)

onMounted(() => {

	const video = document.querySelector('#lazy-hero-video')
	if( !video )return

	const observer = new IntersectionObserver(
		(entries) => {
			if( entries[0].isIntersecting ){
				video.src = video.dataset.src
				videoLoaded.value = true
				observer.disconnect()
			}},
		{ threshold: 0.1 }
	)

	observer.observe(video)
})

</script>

<style scoped>

video {
	object-fit: cover;
	width: 100%;
	height: 100%;
}

</style>