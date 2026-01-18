<template>
	<div class = "mx-auto mt-5 max-w-full xl:max-w-[1080px]
				 rounded-xl bg-dark-gray px-6 py-5
				 text-center text-lg leading-relaxed text-white
				 shadow-[0_8px_20px_rgba(0,0,0,0.5)]">

        Upload your datasets using the <strong>Upload Data</strong> button in the sidebar.<br>

		You can download an example dataset by clicking this
		<a href = "/examples/data/example_data.txt"
		   download
		   class = "text-brand underline transition hover:text-white hover:no-underline">
			example dataset link
		</a>.
		<br>

        Supported data formats and further example datasets can be found on the
        <a href = "/formats/?section=Plain+text"
		   target = "_blank"
		   class = "text-brand underline transition hover:text-white hover:no-underline">
			Data formats
		</a> page.
        <br><br>

        On a succesful upload, a project and project listing are created and shown here.
        <br><br>

        Clicking a project opens a project view showing the uploaded data, estimated Raman spectrum, and
        additional functionality such as visualization settings, metadata editing, calibration,
        project comparison, project sharing with collaborators, and publishing the project to
        Zenodo for a Digital Object Identifier (DOI).
    </div>
</template>
