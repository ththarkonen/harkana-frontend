<template>
<div class = "min-h-screen bg-gray-50 text-gray-800">
    
	<SiteHeader/>

	<main class = "max-w-5xl mx-auto px-6 py-10">
		<div class = "max-w-4xl mx-auto space-y-16 pt-16">
			
			<section class = "text-center">
				<h1 class = "text-3xl md:text-4xl font-bold mb-4">
					Simple, token-based pricing
				</h1>
				<p class = "text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
					Pay only for what you use. Tokens let you run computations, analyze spectroscopic data,
					and generate visualizations. No subscriptions — you stay in full control. All users
					get free tokens upon signup to explore the platform.
				</p>
			</section>

			<div class = "grid gap-8 justify-items-center">
				<div class = " w-full max-w-md bg-white border-2 border-brand rounded-2xl shadow p-6 md:p-8 flex flex-col">
					<h3 class = "text-xl md:text-2xl font-semibold mb-2">
						Compute token bundle
					</h3>
					<p class = "text-gray-600 mb-6">
						For trying out the platform or small datasets.
					</p>
					<div class = "text-4xl md:text-5xl font-bold mb-4">
						€9.99
					</div>
					<p class = "text-gray-600 mb-6">
						200 tokens
					</p>

					<ul class = "text-gray-700 space-y-2 mb-8">
						<li class = "flex items-center gap-2">
							<CpuChipIcon class = "w-6 h-6 text-brand stroke-[2] flex-shrink-0"/>
							<span>Access to all our analysis tools</span>
						</li>
						<li class = "flex items-center gap-2">
							<CircleStackIcon class = "w-6 h-6 text-brand stroke-[2] flex-shrink-0"/>
							<span>Project database upkeep</span>
						</li>
						<li class = "flex items-center gap-2">
							<ChartBarIcon class = "w-6 h-6 text-brand stroke-[2] flex-shrink-0"/>
							<span>Visualize your data and results</span>
						</li>
						<li class = "flex items-center gap-2">
							<BeakerIcon class = "w-6 h-6 text-brand stroke-[2] flex-shrink-0"/>
							<span>Only €0.50 per spectrum</span>
						</li>
					</ul>
				</div>
			</div>

			<div class = "text-center">
				<p class = "text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
					Tokens can be purchased directly after signing in to any HARKANA analysis tool. Once authenticated, you may securely acquire additional compute tokens as needed to support your ongoing research and data-processing.
				</p>
				</div>

				<!-- Refund Policy -->
				<div class = "mt-20 max-w-3xl mx-auto text-center text-gray-600 text-sm">
				<p class = "mb-2">
					Tokens purchased through Paddle can be refunded for <strong class = "text-brand">90% of the original cost</strong>
					if requested within <strong class = "text-brand">14 days</strong> and if the tokens are unused.
				</p>
				<p>
					All payments are securely handled by
					<a class = "text-brand hover:text-brand-light font-bold" href = "https://www.paddle.com" target = "_blank" rel = "noopener noreferrer">
						Paddle</a>.
					No payment data is stored by HARKANA.
				</p>
			</div>
		</div>
	</main>

    <SiteFooter/>

</div>
</template>

<script setup>

import { defineAsyncComponent } from 'vue'

import SiteHeader from '@/components/SiteHeader.vue'
import SiteFooter from '@/components/SiteFooter.vue'

const BeakerIcon = defineAsyncComponent(() =>
	import('@heroicons/vue/24/outline/BeakerIcon')
)

const ChartBarIcon = defineAsyncComponent(() =>
	import('@heroicons/vue/24/outline/ChartBarIcon')
)

const CpuChipIcon = defineAsyncComponent(() =>
	import('@heroicons/vue/24/outline/CpuChipIcon')
)

const CircleStackIcon = defineAsyncComponent(() =>
	import('@heroicons/vue/24/outline/CircleStackIcon')
)

</script>

<style scoped>

div[v-show] {
	transition: all 0.2s ease-in-out;
}

</style>
