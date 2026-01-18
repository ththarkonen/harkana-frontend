<template>
<div class = "min-h-screen bg-gray-50 text-gray-800">

    <SiteHeader/>

	<main class = "min-h-screen bg-gray-50 text-gray-800 px-6 py-10">
		<div class = "max-w-4xl mx-auto space-y-16 pt-16">

			<section class = "text-center">
				<h1 class = "text-3xl md:text-4xl font-bold mb-4">
					Terms of Service & Privacy Policy
				</h1>
				<p class = "text-brand">
					Last updated: {{ lastUpdated }}
				</p>
			</section>

			<TermsOfService></TermsOfService>
			<hr class = "border-gray-300">
			<PrivacyPolicy></PrivacyPolicy>
		</div>
	</main>

	<SiteFooter/>

</div>
</template>

<script setup>

import { ref } from 'vue'

import SiteHeader from '@/components/SiteHeader.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import TermsOfService from '@/components/TermsOfService.vue';
import PrivacyPolicy from './components/PrivacyPolicy.vue';

const lastUpdated = ref('2025-12-07')

</script>

<style scoped>

div[v-show] {
	transition: all 0.2s ease-in-out;
}

</style>

