<template>
<section class = "relative min-h-screen min-h-[100svh] flex items-center justify-center text-center px-6">

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

        <div class = "space-y-4">
            <div class = "flex flex-col sm:flex-row gap-4 justify-center">
                <a :href = "carsToolUrl" target = "_blank" rel = "noopener noreferrer"
                    class = "bg-brand font-bold text-white px-6 py-3 rounded-lg shadow hover:bg-brand-dark transition">
                    Start free CARS analysis
                </a>
                <a :href = "ramanToolUrl" target = "_blank" rel = "noopener noreferrer"
                    class = "bg-brand font-bold text-white px-6 py-3 rounded-lg shadow hover:bg-brand-dark transition">
                    Start free Raman analysis
                </a>
            </div>

            <p class = "text-sm sm:text-base text-gray-300">
                New users can sign up and run first analyses for free. No credit card required.
            </p>

            <div class = "flex flex-wrap gap-3 justify-center">
                <router-link to = "/#examples" class="bg-white/10 font-semibold text-white px-4 py-2 rounded-lg hover:bg-white/20 transition">
                    Example results
                </router-link>
                <router-link to = "/#example-workflow" class="bg-white/10 font-semibold text-white px-4 py-2 rounded-lg hover:bg-white/20 transition">
                    How it works
                </router-link>
                <router-link to = "/#tools" class="bg-white/10 font-semibold text-white px-4 py-2 rounded-lg hover:bg-white/20 transition">
                    All tools
                </router-link>
            </div>
        </div>

    </div>

</section>
</template>

<script setup>

import { ref, onMounted} from 'vue'
const videoLoaded = ref(false)

const carsToolUrl = 'https://cars.harkana.com'
const ramanToolUrl = 'https://raman.harkana.com'

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
