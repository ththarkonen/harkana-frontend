<template>
<Modal ref="modal" :title="'Project folders'" :showClose="true">
    <!-- Main -->
    <template #main>
        <p class="text-white mb-2">
            New folders can be created or deleted using the
            <span class="font-semibold">Add or delete folder</span> button in the sidebar.
            To add or remove the selected projects to or from folders, check or uncheck the boxes below.
            <br><br>
            Selected projects:
        </p>

        <hr class="h-0.5 bg-gray border-0 my-4">

        <!-- Selected projects -->
        <ul class="list-disc list-inside marker:text-brand text-white space-y-1 mb-2">
            <li v-for="(project, index) in projects" :key="index">
                {{ project.name }}
            </li>
        </ul>

        <hr class="h-0.5 bg-gray border-0 my-4">

        <!-- Folder checkboxes -->
        <ul class="flex flex-wrap gap-2 mb-2">
            <li
                v-for="(folderProjects, folder) in userFolders"
                :key="folder"
                class="
                    flex items-center gap-2
                    px-3 py-1 rounded-full
                    bg-gray-800 text-white
                    border border-gray-700
                    hover:border-brand transition
                "
            >
                <input
                    type="checkbox"
                    class="h-4 w-4 accent-brand"
                    v-model="checkedFolders[folder]"
                    @change="updateFolders(folder)"
                />
                <span class="truncate max-w-[12rem]" :title="folder">
                    {{ folder }}
                </span>
            </li>
        </ul>
    </template>
</Modal>
</template>

<script setup lang="ts">

import { ref } from 'vue'
import { projects as projectlib, folders} from '@harkana/tools'

import Modal from './Modal.vue'

const props = defineProps({
    projects: { type: Array, required: true }
})

const emit = defineEmits(["updateProjects"])

const modal = ref<any>(null)
const userFolders = ref({})
const checkedFolders = ref<Record<string, boolean>>({})

/* ───────────── Actions ───────────── */

const updateFolders = async (folder: string) => {

    const shouldAdd = checkedFolders.value[folder]

    for( const project of props.projects ) {

        const inFolder = userFolders.value[folder].includes( project.id )
        const add = shouldAdd && !inFolder
        const remove = !shouldAdd && inFolder

        if( add ) userFolders.value[folder].push( project.id )
        if( remove ) userFolders.value[folder] = userFolders.value[folder].filter( id => id !== project.id )
    }

    await projectlib.setFolders( userFolders.value )
    emit("updateProjects")
}

const initializeCheckedFolders = () => {

    const result: Record<string, boolean> = {}

    for( const folder in userFolders.value ) {

        let containsAll = true

        for( const project of props.projects ) {

            const inFolder = userFolders.value[ folder ].includes( project.id )

            if( !inFolder ){
                containsAll = false
                break
            }
        }

        result[ folder ] = containsAll
    }

    checkedFolders.value = result
}

const open = async () => {

    userFolders.value = await folders.get()

    delete userFolders.value["All projects"]
    delete userFolders.value["Shared with you"]

    initializeCheckedFolders()

    modal.value.open()
}

const close = () => {
    modal.value?.close()
}

defineExpose({ open, close })

</script>
