<template>
	<div class = "mx-auto mt-5 max-w-full xl:max-w-[1080px]
				 rounded-xl bg-dark-gray px-6 py-5
				 text-center text-lg leading-relaxed text-white
				 shadow-[0_8px_20px_rgba(0,0,0,0.5)]">

        Upload your datasets using the <strong>Upload Data</strong> button in the sidebar.<br>

		You can download an example dataset by clicking this
		<a :href = "exampleDatasetPath"
		   download
		   class = "text-brand underline transition hover:text-white hover:no-underline">
			example dataset link
		</a>.
		<br>

        Supported data formats and further example datasets can be found on the
        <a :href = "dataFormatsPath"
		   target = "_blank"
		   class = "text-brand underline transition hover:text-white hover:no-underline">
			Data formats
		</a> page.
        <br><br>

        <span v-if = "isHyperspectrum">
			After a successful upload, a project entry is created and shown here.
			Initially, the project appears under <strong>Processing</strong>; ongoing processing
			can be monitored by selecting <strong>Processing</strong> in the sidebar.
		</span>
		<span v-else>
			After a successful upload, a project entry is created and shown here.
		</span>
        <br><br>

		<span v-if = "isHyperspectrum">
			Clicking a project opens a project view with hyperspectral visualization,
			pixel-wise data exploration, and region-of-interest tools, together with additional
			functionality such as visualization settings, metadata editing, project sharing with collaborators,
			and publishing the project to Zenodo for a Digital Object Identifier (DOI).
		</span>
		<span v-else>
			Clicking a project opens a project view showing the uploaded data, the estimated
			Raman spectrum, and additional functionality such as visualization settings,
			metadata editing, calibration, project comparison, project sharing with
			collaborators, and publishing the project to Zenodo for a Digital Object Identifier
			(DOI).
		</span>
    </div>
</template>

<script setup>

const dataType = import.meta.env.VITE_DATA_TYPE
const isHyperspectrum = dataType === "hypercars"

const exampleDatasetPath = "/examples/data/example_data.txt"
const dataFormatsPath = isHyperspectrum
	? "/formats?section=OIR"
	: "/formats?section=Plain+text"

</script>
