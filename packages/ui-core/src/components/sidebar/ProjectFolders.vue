<template>
<div>
    <!-- Title -->
    <h5 class = "mb-3 flex ml-0 my-4 items-center gap-2 text-sm font-semibold tracking-wide text-white">
        <i class = "far fa-folder"></i>
        Folders
    </h5>

    <!-- Static folders -->
    <ul class = "space-y-1">
        <li @click = "activeFolder = 'All projects'"
            class = "flex cursor-pointer items-center rounded-md px-3 py-2 transition"
            :class = "activeFolder == 'All projects' ? 'bg-brand text-white' : 'text-white hover:bg-white/10'">

            <div class = "flex items-center gap-2">
                <i class = "fa fa-asterisk text-xs"></i>
                All projects
            </div>

            <span class = "ml-1 text-xs opacity-70">
                ({{ userFolders["All projects"]?.length ?? 0 }})
            </span>
        </li>

        <li @click = "activeFolder = 'Shared with you'"
            class = "flex cursor-pointer items-center rounded-md px-3 py-2 transition text-white"
            :class = "activeFolder == 'Shared with you'
                ? 'bg-brand'
                : 'hover:bg-white/10'">

            <div class = "flex items-center gap-2">
                <i class = "fa fa-link text-xs"></i>
                Shared with you
            </div>

            <span class = "ml-1 text-xs opacity-70">
                ({{ userFolders["Shared with you"]?.length ?? 0 }})
            </span>
        </li>
    </ul>

    <hr class = "h-0.5 my-2 bg-gray border-0">

    <!-- Custom folders -->
    <ul class = "space-y-1">
        <li @click = "addFolderModal.open()"
            class = "flex cursor-pointer items-center gap-2 rounded-md py-2
                     text-sm text-white transition
                     hover:bg-white/10">
            <i class = "fa fa-plus-minus text-xs"></i>
            Add or delete folders
        </li>

        <li v-for = "folder in sortedUserFolders"
            :key = "folder"
            @click = "activeFolder = folder"
            :title="folder"
            class = "flex cursor-pointer items-center rounded-md px-3 py-2 transition text-white line-clamp-2"
            :class = "activeFolder == folder ? 'bg-brand text-white' : 'text-gray-300 hover:bg-white/10'">
            
            <span><i class = "far fa-folder-open"></i> {{ folder }} 
                <span class = "opacity-70 text-sm">({{ userFolders[ folder ].length }})</span>
            </span>
        </li>
    </ul>

    <AddFolderModal ref = "addFolderModal" v-model:folders = "userFolders"></AddFolderModal>
</div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeMount} from 'vue'
import { lists, folders} from "@harkana/tools"

import AddFolderModal from '../modals/AddFolderModal.vue'

const addFolderModal = ref(null)

const props = defineProps({ 
    projects: { type: Object, required: true}
})

const activeFolder = defineModel("activeFolder", { required: true, type: String})
const userFolders = ref({"All projects": [], "Shared with you": []})
const sortedUserFolders = computed(() => {

	var uniqueFolders = Object.keys( userFolders.value )

	uniqueFolders = [...new Set( uniqueFolders )]
	uniqueFolders = lists.sortAlphabetical( uniqueFolders )

	uniqueFolders = lists.removeItem( uniqueFolders, "All projects")
	uniqueFolders = lists.removeItem( uniqueFolders, "Shared with you")

	return uniqueFolders
})

watch(() => props.projects, async ( projects ) => {

    userFolders.value = await folders.get()

    userFolders.value["All projects"] = []
    userFolders.value["Shared with you"] = []

    for( const id in projects ){

        const project = projects[id]
        userFolders.value["All projects"].push( project.id )

        if( project.shared ) userFolders.value["Shared with you"].push( project.id )
    }
}, { deep: true, immediate: true})

</script>
