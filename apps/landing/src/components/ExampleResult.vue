<template>
<div class = "rounded-xl border border-gray-200 bg-white shadow-sm p-6">

	<div class = "mb-4 text-center">
		<h3 class = "text-xl font-semibold">
			{{ title }}
		</h3>
		<p class = "text-gray-600 text-sm mt-1">
			{{ description }}
		</p>
	</div>

    <!-- Toggle -->
    <div class = "flex justify-center mb-4 space-x-2">
		
		<button @click = "view = 'raw'" :class = "buttonClass(view === 'raw')">
			Raw
      	</button>

		<button @click = "view = 'corrected'" :class = "buttonClass(view === 'corrected')">
			Corrected
		</button>

    </div>

    <!-- Image -->
    <div class = "relative overflow-hidden rounded-lg border-2 border-brand">

      <img :src = "rawImage" alt = "Raw spectrum" class = "absolute inset-0 w-full h-auto transition-opacity duration-200"
        	:class = "view === 'raw' ? 'opacity-100' : 'opacity-0'"/>

      <img :src = "correctedImage" alt = "Corrected spectrum" class = "w-full h-auto transition-opacity duration-200"
        	:class = "view === 'corrected' ? 'opacity-100' : 'opacity-0'"/>

    </div>

	<!-- Caption -->
	<p class = "text-gray-500 text-sm mt-3 text-center">
		{{ view === 'raw' ? rawCaption : correctedCaption }}
	</p>

</div>
</template>

<script setup>

import { ref } from 'vue'

const props = defineProps({
	title: String,
	description: String,
	rawImage: String,
	correctedImage: String,
	rawCaption: { type: String, default: 'Raw input spectrum'},
	correctedCaption: { type: String, default: 'Automatically corrected spectrum'}
})

const view = ref('raw')

const buttonClass = ( active ) =>
  active
    ? 'px-4 py-1.5 rounded-md bg-brand text-white font-semibold transition'
    : 'px-4 py-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition'

</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
	transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  	opacity: 0;
}
</style>
