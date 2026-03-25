<template>
<!-- Outer frame -->
<div class="bg-brand min-h-screen p-[2px]">

	<!-- Mobile overlay -->
	<div v-if = "sidebarOpen" @click = "sidebarOpen = false" class = "fixed inset-0 bg-black/40 z-30 md:hidden"></div>
	<!-- App Grid -->
	<div class="grid h-[calc(100vh-4px)] gap-[2px] grid-cols-1 grid-rows-[auto_1fr] md:grid-cols-[16rem_1fr] md:grid-rows-[auto_1fr]">

		<Sidebar :style = "sidebarStyle">
			<Logo></Logo>
			<UploadButton class = "my-2 mb-4" @updateProjects = "updateProjectsClearChecks"></UploadButton>
			<hr v-if = "!showInfo" class = "h-0.5 bg-gray border-0 ">
			<ProjectFolders v-if = "!showInfo" v-model:activeFolder = "activeFolder" :projects = "projectList" :processing="processingList"></ProjectFolders>
		</Sidebar>

		<NavigationBar>
			<template v-slot:left-items>
				<button @click = "sidebarOpen = true" class = "md:hidden px-3 py-2 rounded bg-slate-100">☰</button>
				<BaseDropdown :close-on-select = "true"
							  :teleport-to-body = "true"
							  portal-placement = "bottom-start"
							  :portal-offset-x = "0"
							  :portal-offset-y = "8"
							  menu-class = "fixed z-[45] min-w-[12rem] origin-top-left rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30">
					<template v-slot:trigger>
						<span class = "font-medium">Menu</span>
					</template>

					<BaseDropdownItem @select = 'navigation.redirect("Main menu")'>
						Main menu
					</BaseDropdownItem>
				</BaseDropdown>
			</template>
			<template v-slot:right-items>
				<TokenBalanceDropdown ref = "balanceDropdown"></TokenBalanceDropdown>
				<AccountDropdown></AccountDropdown>
			</template>
		</NavigationBar>


		<!-- Main Content -->
		<main class="bg-dark-gray rounded-lg shadow-sm p-4 overflow-y-auto">
			<div class = "w-full text-white font-semibold pb-4">
				<div v-show = "!showInfo">{{ activeFolder }}</div>
				<div v-if = "showBatchActions" class = "float-right">
					<button
						class="h-8 w-8 items-center justify-center rounded-md text-white hover:bg-green-100 hover:text-brand transition-colors"
						@click="open( projectFoldersModal, selectedProjects)"
						title = "Add selected projects to folders">
						<i class="fas fa-folder-tree"></i>
					</button>
					<button
						class="h-8 w-8 items-center justify-center rounded-md text-white hover:bg-green-100 hover:text-brand transition-colors"
						@click = "projects.download( selectedProjects )"
						title = "Download selected projects">
						<i class="fas fa-cloud-download"></i>
					</button>
					<button
						class="h-8 w-8 items-center justify-center rounded-md text-white hover:bg-green-100 hover:text-brand transition-colors"
						@click="open( deleteModal, selectedProjects)"
						title = "Delete selected projects">
						<i class="fas fa-trash"></i>
					</button>
				</div>
			</div>
			<ProjectSearchBar v-if = "!showInfo" v-model = "searchPattern"></ProjectSearchBar>
			<ProjectUploadInstructions v-if = "showInfo"></ProjectUploadInstructions>
			<ProjectTable v-if = "!showInfo & activeFolder !== 'Processing'" :projects = "filteredProjects" :selectedProjectIDs = "activeIDs" class = "mt-4">
				<template v-slot:actions="{ project }">
					<button
						class="h-8 w-8 items-center justify-center rounded-md text-white hover:bg-green-100 hover:text-brand transition-colors"
						@click="open( projectFoldersModal, [ project ])"
						title = "Add to folders">
						<i class="fas fa-folder-tree"></i>
					</button>
					<button
						class="h-8 w-8 items-center justify-center rounded-md text-white hover:bg-green-100 hover:text-brand transition-colors"
						@click="open( metadataModal, [ project ])"
						title = "Project metadata">
						<i class="fas fa-database"></i>
					</button>
					<button
						class="h-8 w-8 items-center justify-center rounded-md text-white hover:bg-green-100 hover:text-brand transition-colors"
						@click = "projects.download([ project ])"
						title = "Download project">
						<i class="fas fa-cloud-download"></i>
					</button>
					<button
						class="h-8 w-8 items-center justify-center rounded-md text-white hover:bg-green-100 hover:text-brand transition-colors"
						@click="open( deleteModal, [ project ])"
						title = "Delete project">
						<i class="fas fa-trash"></i>
					</button>
				</template>
			</ProjectTable>
			<ProcessingTable v-if = "activeFolder === 'Processing'" :projects = "processingList" class = "mt-4">
			</ProcessingTable>
		</main>

	</div>

	<DeleteModal ref = "deleteModal" :projects = "activeProjects" @updateProjects = "updateProjectsClearChecks"></DeleteModal>
	<MetadataModal ref = "metadataModal" :project = "activeProject" @updateProjects = "updateProjects"></MetadataModal>
	<ProjectFoldersModal ref = "projectFoldersModal" :projects = "activeProjects" @updateProjects = "updateProjects"></ProjectFoldersModal>
</div>
</template>

<script setup>

import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { folders, projects, navigation } from "@harkana/tools"

import Sidebar from './sidebar/Sidebar.vue'
import Logo from "./sidebar/Logo.vue"
import UploadButton from './sidebar/UploadButton.vue'
import ProjectFolders from './sidebar/ProjectFolders.vue'

import NavigationBar from './navbar/NavigationBar.vue'
import BaseDropdown from './navbar/BaseDropdown.vue'
import BaseDropdownItem from './navbar/BaseDropdownItem.vue'
import TokenBalanceDropdown from './navbar/TokenBalanceDropdown.vue'
import AccountDropdown from './navbar/AccountDropdown.vue'

import ProjectUploadInstructions from './projects/ProjectUploadInstructions.vue'
import ProjectSearchBar from './projects/ProjectSearchBar.vue'
import ProjectTable from './projects/ProjectTable.vue'
import ProcessingTable from './projects/ProcessingTable.vue'

import DeleteModal from './modals/DeleteModal.vue'
import MetadataModal from './modals/MetadataModal.vue'
import ProjectFoldersModal from './modals/ProjectFoldersModal.vue'

const deleteModal = ref(null)
const metadataModal = ref(null)
const projectFoldersModal = ref(null)
const balanceDropdown = ref(null)

const emit = defineEmits(["loaded"])

const userFolders = ref({})
const activeFolder = ref("All projects")
const projectList = ref({})
const processingList = ref({})
const searchPattern = ref("")

const activeProject = ref({})
const activeProjects = ref({})
const activeIDs = ref( new Set() )
const selectedProjects = computed(() => {

	var selectedProjects = []
	activeIDs.value.forEach( id => {
		selectedProjects.push( projectList.value[id] )
	})

	return selectedProjects
})

const filteredProjects = computed(() => {

	parseFolders()

	if( activeFolder.value === "Processing" ) return []
	
	activeIDs.value.clear()
	const pattern = searchPattern.value.toLowerCase()
	const folderExists = activeFolder.value in userFolders.value

	if( !folderExists ){
		activeFolder.value = "All projects";
	};

	return Object.values( projectList.value ).filter( project => {
		
		const ownerName = `${project.owner.familyName} ${project.owner.firstName}`
		const ownerNameReversed = `${project.owner.firstName} ${project.owner.familyName}`

		const noSearchPattern = !pattern
		const inFolder = userFolders.value[ activeFolder.value ].includes( project.id )

		const inProjectName = project.name.toLowerCase().includes( pattern )
		const inOwnerFirstName = project.owner.firstName.toLowerCase().includes( pattern )
		const inOwnerFamilyName = project.owner.familyName.toLowerCase().includes( pattern )
		const inOwnerName = ownerName.toLowerCase().includes( pattern )
		const inOwnerNameReversed = ownerNameReversed.toLowerCase().includes( pattern )

		let condition = noSearchPattern || inProjectName || inOwnerFirstName || inOwnerFamilyName || inOwnerName || inOwnerNameReversed
		return condition && inFolder
	})
})

const showBatchActions = computed(() => {
	return selectedProjects.value.length > 0
})

const sidebarOpen = ref(false)
const sidebarStyle = computed(() => {
  return sidebarOpen.value
    ? { left: '2px' }
    : { left: 'calc(-16rem - 2px)' }
})

const showInfo = computed(() => {
	return Object.keys( projectList.value ).length === 0 && Object.keys( processingList.value ).length === 0
})

const hasProcessingProjects = computed(() => {
	return Object.keys( processingList.value ).length > 0
})

const PROCESSING_REFRESH_INTERVAL_MS = 2 * 60 * 1000
const refreshingProcessing = ref(false)
var processingRefreshTimer = null

const open = async ( modal, projectArray) => {

	activeProject.value = projectArray[0]
	activeProjects.value = projectArray
	await nextTick()
	modal.open()
}

const parseFolders = async () => {

    userFolders.value["All projects"] = []
    userFolders.value["Shared with you"] = []

    for( const id in projectList.value ){

        const project = projectList.value[id]
        userFolders.value["All projects"].push( project.id )

        if( project.shared ) userFolders.value["Shared with you"].push( project.id )
    }

	return userFolders.value
}

const updateProjects = async () => {

	userFolders.value = await folders.get()
	projectList.value = await projects.list()
	userFolders.value = await parseFolders()
	processingList.value = await projects.listProcessing()

	await balanceDropdown.value.updateBalance()
}

const updateProjectsClearChecks = async () => {
	
	activeIDs.value.clear()

	userFolders.value = await folders.get()
	projectList.value = await projects.list()
	userFolders.value = await parseFolders()
	processingList.value = await projects.listProcessing()

	await balanceDropdown.value.updateBalance()
}

const refreshProcessingProjects = async () => {

	if( refreshingProcessing.value ) return
	refreshingProcessing.value = true

	try{
		await updateProjects()
	} catch( error ){
		console.log( error )
	} finally {
		refreshingProcessing.value = false
	}
}

const startProcessingRefresh = () => {

	if( processingRefreshTimer !== null ) return

	processingRefreshTimer = setInterval(() => {
		void refreshProcessingProjects()
	}, PROCESSING_REFRESH_INTERVAL_MS )
}

const stopProcessingRefresh = () => {

	if( processingRefreshTimer === null ) return
	clearInterval( processingRefreshTimer )
	processingRefreshTimer = null
}

onMounted( async () => {

	userFolders.value = await folders.get()
	projectList.value = await projects.list()
	processingList.value = await projects.listProcessing()
	userFolders.value = await parseFolders()

	console.log( processingList.value )

	emit("loaded")
})

watch( hasProcessingProjects, ( hasProcessing ) => {

	if( hasProcessing ){
		startProcessingRefresh()
		return
	}

	stopProcessingRefresh()
}, { immediate: true })

onBeforeUnmount(() => {
	stopProcessingRefresh()
})

</script>
