<template>
<!-- Outer frame -->
<div class="bg-brand min-h-screen p-[2px] overflow-hidden">

	<!-- Mobile overlay -->
	<div v-if = "sidebarOpen" @click = "sidebarOpen = false" class = "fixed inset-0 bg-black/40 z-30 md:hidden"></div>
	<!-- App Grid -->
	<div class="grid h-[calc(100vh-4px)] gap-[2px] grid-cols-1 grid-rows-[auto_1fr] md:grid-cols-[16rem_1fr] md:grid-rows-[auto_1fr]">

		<Sidebar :style = "sidebarStyle">
			<Logo></Logo>

			<SidebarButton @click = "navigation.route('Main menu', {})" class = "my-2">
				Project menu
			</SidebarButton>
			<SidebarButton @click = "navigation.redirect('Settings', 'Visualization')" class = "mb-4">
				Visualization settings
			</SidebarButton>

			<hr class = "h-0.5 bg-gray border-0 ">

			<SidebarButton @click = "metadataModal.open()" class = "mt-4">
				Metadata
			</SidebarButton>

			<div v-if = "!project.shared">
			<SidebarButton @click = "calibrating = !calibrating" class = "mt-2">
				Calibrate
			</SidebarButton>
			<CalibrationControls v-show = "calibrating"
								:project = "project"
								:marker = marker
								:calibration = "calibration"
								:step = "calibrationStep"
								class = "my-2">
			</CalibrationControls>
			</div>

			<SidebarButton @click = "comparisonSelectModal.open()" class = "mt-2 mb-4">
				Compare
			</SidebarButton>

			<hr class = "h-0.5 bg-gray border-0 ">

			<div v-if = "!project.shared">
				<SidebarButton @click = "download" :loading = "downloading" class = "mt-4">
					Download
				</SidebarButton>
				<SidebarButton @click = "shareModal.open()" class = "mt-2 mb-2">
					Share
				</SidebarButton>
				<SidebarButton @click = "zenodoModal.open()" class = "mb-4">
					Zenodo
				</SidebarButton>
			</div>

			<div v-else>
				<SidebarButton @click = "download" :loading = "downloading" class = "my-4">
					Download
				</SidebarButton>
			</div>

			<hr class = "h-0.5 bg-gray border-0 ">

		</Sidebar>

		<NavigationBar>
			<template v-slot:left-items>
				<button @click = "sidebarOpen = true" class = "md:hidden mr-4 px-3 py-2 rounded bg-slate-100">☰</button>
				<ProjectNameInput :project = "project"></ProjectNameInput>
			</template>
			<template v-slot:right-items>
				<AccountDropdown></AccountDropdown>
			</template>
		</NavigationBar>


		<!-- Main Content -->
		<main class="bg-dark-gray rounded-lg shadow-sm p-0">
			<div ref = "graph" class = "w-full h-full bg-white"></div>
		</main>

	</div>

	<MetadataModal ref = "metadataModal" :project = "project"></MetadataModal>
	<ComparisonSelectModal 	ref = "comparisonSelectModal"
							v-model = "comparisonProjectID"
							:currentID = "project.id"
							:projects = "projects" >
	</ComparisonSelectModal>
	<ShareModal ref = "shareModal" :project = "project"></ShareModal>
	<ZenodoModal ref = "zenodoModal" :project = "project"></ZenodoModal>
</div>
</template>

<script setup>

import { ref, toRaw, watch, computed, nextTick, onMounted} from 'vue'
import { useRoute } from 'vue-router'
import { debounce } from 'lodash'
const route = useRoute()

const emit = defineEmits(["loaded"])

import { projects as projectlib, settings as settingslib} from "@harkana/tools"
import { navigation, results, utils} from "@harkana/tools"
import { plot } from "@harkana/plot"

import Sidebar from './sidebar/Sidebar.vue'
import Logo from "./sidebar/Logo.vue"
import SidebarButton from './sidebar/SidebarButton.vue'
import CalibrationControls from './sidebar/CalibrationControls.vue'

import NavigationBar from './navbar/NavigationBar.vue'
import AccountDropdown from './navbar/AccountDropdown.vue'
import ProjectNameInput from './navbar/ProjectNameInput.vue'

import MetadataModal from './modals/MetadataModal.vue'
import ComparisonSelectModal from './modals/ComparisonSelectModal.vue'
import ShareModal from './modals/ShareModal.vue'
import ZenodoModal  from './modals/ZenodoModal.vue'

const metadataModal = ref(null)
const comparisonSelectModal = ref(null)
const shareModal = ref(null)
const zenodoModal = ref(null)

const projectID = route.params.id
const comparisonProjectID = ref("")

const project = ref({id: ""})
const projects = ref({})
const settings = ref({})

const data = ref(null)
const estimate = ref(null)
const comparison = ref({
    data: null,
    estimate: null
})

const downloading = ref(false)
const calibrating = ref(false)
const calibrationStep = ref(1)
const calibration = ref({
    x: 0
})

const marker = ref({
    x: 0
})

const graph = ref(null)

const sidebarOpen = ref(false)
const sidebarStyle = computed(() => {
  return sidebarOpen.value
    ? { left: '2px' }
    : { left: 'calc(-16rem - 2px)' }
})

const download = async() => {

	downloading.value = true
	await projectlib.download([ project.value ])

	await utils.wait(1000)
	downloading.value = false
}

watch( comparisonProjectID, async () => {

   	if( comparisonProjectID.value === project.value.id ){
		await plot.initialize( toRaw( data.value ), toRaw( estimate.value ), graph.value, settings.value);
		return
	}

	const comparisonProject = projects.value[ comparisonProjectID.value ];
        
	comparison.value.data = await results.load( comparisonProject, "data")
	comparison.value.estimate = await results.load( comparisonProject, "estimate")
	comparison.value.data.calibration = await results.load( comparisonProject, "calibration")
	
	await plot.comparison( toRaw( data.value ), toRaw( estimate.value ),
                           toRaw( comparison.value.data ), toRaw( comparison.value.estimate ),
                           graph.value, settings.value)

})

const debouncedUpdateHorizontalAxis = debounce( async () => {

	await plot.deleteMarker( graph.value );
	await plot.updateHorizontalAxis( data.value, calibration.value, graph.value);
	await plot.showMarker( marker.value, graph.value, settings.value);
}, 25)

watch( calibration, async () => {
        if( calibrating.value === false ) return;
        debouncedUpdateHorizontalAxis()
    }, 
{ deep: true })

watch( [marker, calibrating], async ([newMarker, newCalibrating]) => {
	
	if (newCalibrating === false) {
		await plot.deleteMarker( graph.value )
		return
	}

	await plot.showMarker(newMarker, graph.value, settings.value)

},{ deep: true })

onMounted( async () => {

    try{

        var savedSettings = await settingslib.get()

        settings.value = savedSettings;
        projects.value = await projectlib.list();
        project.value = projects.value[ projectID ];

		data.value = await results.load( project.value, "data");
		estimate.value = await results.load( project.value, "estimate");
		data.value.calibration = await results.load( project.value, "calibration");

		calibration.value = data.value.calibration;

        const minX = Math.min( ...data.value.x ) + data.value.calibration.x;
        const maxX = Math.max( ...data.value.x ) + data.value.calibration.x;

        marker.value.x = ( minX + maxX ) / 2;
        calibrationStep.value = ( maxX - minX ) / 1000;

        await nextTick()
        await plot.initialize( toRaw( data.value ), toRaw( estimate.value ), graph.value, settings.value);

    } catch( error ){
		console.log( error )
        navigation.route("Main menu", {})
    }

    emit("loaded")
})

</script>



