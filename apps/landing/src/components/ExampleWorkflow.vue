<template>
<section id = "example-workflow" class = "py-10 bg-gray-50 text-gray-800 px-6">

	<div class = "max-w-6xl mx-auto text-center mb-8">
		<h2 class = "text-3xl sm:text-4xl font-bold">
			Example workflow
		</h2>
		<p class = "text-base sm:text-lg text-gray-600 mt-3 max-w-3xl mx-auto">
			Single-spectrum and hyperspectral projects follow related, but distinct, analysis workflows.
		</p>
	</div>

	<div class = "max-w-6xl mx-auto">
		<div role = "tablist"
			 aria-label = "Example workflow type"
			 class = "mx-auto mb-6 flex max-w-xl rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
			<button v-for = "workflow in workflows"
					:id = "`workflow-tab-${workflow.key}`"
					:key = "workflow.key"
					type = "button"
					role = "tab"
					:aria-selected = "workflow.key === activeWorkflowKey"
					:aria-controls = "`workflow-panel-${workflow.key}`"
					@click = "activeWorkflowKey = workflow.key"
					:class = "[
						'flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition',
						workflow.key === activeWorkflowKey
							? 'bg-brand text-white shadow'
							: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
					]">
				{{ workflow.label }}
			</button>
		</div>

		<div v-for = "workflow in workflows"
			 v-show = "workflow.key === activeWorkflowKey"
			 :id = "`workflow-panel-${workflow.key}`"
			 :key = "workflow.key"
			 role = "tabpanel"
			 :aria-labelledby = "`workflow-tab-${workflow.key}`"
			 class = "rounded-2xl border border-gray-200 bg-white p-5 shadow-lg">
			<div class = "grid gap-5 lg:grid-cols-4">
				<article v-for = "(step, index) in workflow.steps"
						 :key = "step.title"
						 class = "flex h-full flex-col rounded-xl border border-gray-200 bg-gray-50 p-4 text-left">
					<div class = "mb-3 flex items-center gap-2">
						<span class = "inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
							{{ index + 1 }}
						</span>
						<h3 class = "text-base font-semibold text-gray-900">
							{{ step.title }}
						</h3>
					</div>

					<img :src = "step.image"
						 :alt = "step.alt"
						 class = "mb-4 aspect-[4/3] w-full rounded-lg border border-gray-200 bg-white object-contain shadow-sm"/>

					<p class = "text-sm leading-6 text-gray-600">
						{{ step.text }}
					</p>
				</article>
			</div>
		</div>

		<div class = "mt-10 text-center bg-white border border-gray-200 rounded-xl p-6">
			<p class = "text-lg text-gray-700 mb-4">
				Ready to run this workflow on your own data?
			</p>
			<div class = "flex flex-col sm:flex-row gap-3 justify-center">
				<a
					:href = "carsToolUrl"
					target = "_blank"
					rel = "noopener noreferrer"
					class = "bg-brand text-white font-semibold px-5 py-3 rounded-lg hover:bg-brand-dark transition">
					Start free CARS analysis
				</a>
				<a
					:href = "ramanToolUrl"
					target = "_blank"
					rel = "noopener noreferrer"
					class = "border border-brand text-brand font-semibold px-5 py-3 rounded-lg hover:bg-brand hover:text-white transition">
					Start free Raman analysis
				</a>
				<a
					:href = "hcarsToolUrl"
					target = "_blank"
					rel = "noopener noreferrer"
					class = "border border-brand text-brand font-semibold px-5 py-3 rounded-lg hover:bg-brand hover:text-white transition">
					Start free HyperCARS analysis
				</a>
			</div>
		</div>
	</div>
</section>
</template>

<script setup>

import { ref } from 'vue'

const activeWorkflowKey = ref('spectral')

const carsToolUrl = 'https://cars.harkana.com'
const ramanToolUrl = 'https://raman.harkana.com'
const hcarsToolUrl = 'https://hcars.harkana.com'

const workflows = [
	{
		key: 'spectral',
		label: 'Single-spectrum workflow',
		steps: [
			{
				image: '/images/project-menu.png',
				title: 'Project dashboard',
				alt: 'Project dashboard with available spectroscopy projects',
				text: 'Create or open a CARS or Raman project from the project dashboard.'
			},
			{
				image: '/images/data-upload.png',
				title: 'Upload spectra',
				alt: 'Single-spectrum data upload dialog',
				text: 'Upload TXT, CSV, JSON, or SPC spectra and validate the input before analysis starts.'
			},
			{
				image: '/images/upload-progress.png',
				title: 'Raman spectrum estimation',
				alt: 'Processing status for a single-spectrum project',
				text: 'The cloud workflow estimates the Raman spectrum and uncertainty intervals while the project remains accessible.'
			},
			{
				image: '/images/result-view.png',
				title: 'Project view',
				alt: 'Single-spectrum result view',
				text: 'Inspect measured and estimated spectra, compare projects, calibrate the spectral axis, edit metadata, share, and export.'
			}
		]
	},
	{
		key: 'hyperspectral',
		label: 'Hyperspectral workflow',
		steps: [
			{
				image: '/images/data-upload.png',
				title: 'Upload hyperspectral data',
				alt: 'Hyperspectral data upload dialog',
				text: 'Upload OIR, TIFF, OME-TIFF, or OME-Zarr datasets for hyperspectral analysis.'
			},
			{
				image: '/images/upload-progress.png',
				title: 'Confirm axes',
				alt: 'Hyperspectral upload progress and axis setup',
				text: 'Review inspected axes and configure spatial, layer, channel, or time dimensions before analysis.'
			},
			{
				image: '/images/result-view.png',
				title: 'Explore false-color views',
				alt: 'Hyperspectral false-color visualization view',
				text: 'Use MIP, HSV-mapped MIP, UMAP, PCA, RPCA, layer, and Z-blend visualizations.'
			},
			{
				image: '/images/project-example.png',
				title: 'Select pixels and regions',
				alt: 'Hyperspectral project with spectra and analysis panes',
				text: 'Inspect spectra from pixels and regions of interest, then run Raman spectrum estimation and spectral axis calibration.'
			}
		]
	}
]

</script>
