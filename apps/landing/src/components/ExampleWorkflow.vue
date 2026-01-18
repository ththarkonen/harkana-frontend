<!-- Carousel.vue -->
<template>
<section id = "example-workflow" class = "py-10 bg-gray-50 text-gray-800 px-6">

	<div class = "max-w-6xl mx-auto text-center mb-12">
		<h2 class = "text-3xl sm:text-4xl font-bold">
			Example workflow
		</h2>
	</div>

	<div class = "w-full bg-gray py-0">
		<div class = "max-w-6xl mx-auto relative">

			<!-- Slides container -->
			<div class = "overflow-hidden rounded-xl shadow-lg">
				<div class = "flex transition-transform duration-700 ease-out"
					:style = "{ transform: `translateX(-${currentIndex * 100}%)` }">
					<!-- Slide -->
					<div v-for = "( slide, idx) in slides" :key = "idx"
						class = "min-w-full flex flex-col items-center bg-white text-gray-800 p-8">

						<img :src = "slide.image" class = "w-full max-w-3xl rounded-lg shadow mb-6 object-contain"/>

						<h3 class = "text-2xl font-bold mb-2">
							{{ slide.title }}
						</h3>

						<p class = "text-gray-600 text-lg">
							{{ slide.text }}
						</p>

					</div>
				</div>
			</div>

			<!-- Navigation Arrows -->
			<button @click = "prev" class = "absolute top-1/2 text-3xl -left-4 transform-translate-y-1/2
											 bg-brand-light text-gray-900 w-10 h-10 rounded-full shadow
											 hover:bg-brand transition flex items-center justify-center">
				‹
			</button>

			<button @click = "next" class = "absolute top-1/2 text-3xl -right-4 transform -translate-y-1/2
											 bg-brand-light text-gray-900 w-10 h-10 rounded-full shadow
											 hover:bg-brand transition flex items-center justify-center">
				›
			</button>

			<!-- Dots -->
			<div class = "flex justify-center mt-6 space-x-3">
				<button @click = "goTo( idx )" v-for = "( slide, idx) in slides" :key = "idx"
						:class="['w-3 h-3 rounded-full transition', idx === currentIndex ? 'bg-brand' : 'bg-gray-400']">
				</button>
			</div>

		</div>
	</div>
</section>
</template>

<script setup>

import { ref } from 'vue'
const currentIndex = ref(0)

const slides = [
	{
		image: '/images/project-menu.png',
		title: 'Project menu',
		text: 'Upon sign-in, the user is presented with their projects dashboard.'
	},
	{
		image: '/images/data-upload.png',
		title: 'Uploading data',
		text: 'The user can upload datasets in compatible data formats.'
	},
	{
		image: '/images/upload-progress.png',
		title: 'Automatic correction',
		text: 'Upon selection, the uploaded datasets are validated and the automatic correction is performed in the cloud.'
	},
	{
		image: '/images/project-example.png',
		title: 'Project initialized',
		text: 'After correction, a project is initialized and shown in the project menu.'
	},
	{
		image: '/images/result-view.png',
		title: 'Project view',
		text: 'Clicking a project opens a project view showing the uploaded data, corrected spectrum, and additional functionality.'
	}
]

function next() {
	currentIndex.value = (currentIndex.value + 1) % slides.length
}

function prev() {
  	currentIndex.value = (currentIndex.value - 1 + slides.length) % slides.length
}

function goTo( idx ) {
  	currentIndex.value = idx
}

</script>