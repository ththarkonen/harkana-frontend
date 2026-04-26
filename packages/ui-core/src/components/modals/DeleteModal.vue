<template>
<Modal ref = "modal" :title = "'Project deletion'" :showClose = "!deleting">
    <!-- Main content -->
    <template #main>
        <p class = "text-white mb-2">
            Project deletion is permanent and cannot be undone.
            Delete the following projects?
        </p>

        <hr class="h-0.5 bg-gray border-0 my-4">

        <ul class = "list-disc marker:text-brand list-inside text-white space-y-1 mb-2">
            <li v-for = "( project, index) in projects" :key = "index">
                {{ project.name }}
            </li>
        </ul>

        <div v-if = "deleting" class = "mt-3 mb-2">
            <p class = "text-white text-sm mb-1">
                Deleting project {{ progressCurrentProjectIndex }}/{{ progressTotalProjects }}:
                <strong>{{ progressCurrentProjectName }}</strong>
            </p>

            <div class = "w-full h-2 rounded bg-gray overflow-hidden">
                <div class = "h-2 bg-brand transition-all duration-200 ease-out"
                     :style = "{ width: deleteProgressPercent + '%' }">
                </div>
            </div>

            <p class = "text-xs text-white/80 mt-1">
                {{ deleteProgressPercent }}% complete
                <span v-if = "progressCurrentTotalFiles > 0">
                    · files {{ progressCurrentDeletedFiles }}/{{ progressCurrentTotalFiles }}
                </span>
            </p>
        </div>

        <hr class="h-0.5 bg-gray border-0 my-4">

        <p class = "text-white mb-2">
            Confirm project deletion by typing <em>delete</em> below.
        </p>
        <input  type = "text"
                v-model = "inputText"
                placeholder = "delete"
                class = "w-full px-3 py-2 mb-1 rounded text-black focus:outline-none focus:ring-2 focus:ring-brand"/>
    </template>

    <!-- Footer -->
    <template #footer>
        <ModalButton @click = "deleteProjects" :loading = "deleting" :disabled = "!verified || deleting">
            Delete
        </ModalButton>
    </template>
</Modal>
</template>

<script setup>

import { ref, computed} from 'vue'
import { projects as projectlib, utils} from "@harkana/tools"

import Modal from "./Modal.vue"
import ModalButton from './ModalButton.vue'

const props = defineProps({
    projects: { type: Array, required: true},
})

const emit = defineEmits(["updateProjects"])

const modal = ref(null)
const inputText = ref('')

const deleting = ref(false)
const verified = computed(() => inputText.value === 'delete')
const DELETE_POLL_INTERVAL_MS = 350
const DELETE_POLL_TIMEOUT_MS = 30000
const progressTotalProjects = ref(0)
const progressCompletedProjects = ref(0)
const progressCurrentProjectIndex = ref(0)
const progressCurrentProjectName = ref("")
const progressCurrentDeletedFiles = ref(0)
const progressCurrentTotalFiles = ref(0)

const resetDeleteProgress = () => {
    progressTotalProjects.value = 0
    progressCompletedProjects.value = 0
    progressCurrentProjectIndex.value = 0
    progressCurrentProjectName.value = ""
    progressCurrentDeletedFiles.value = 0
    progressCurrentTotalFiles.value = 0
}

const currentProjectProgressFraction = computed(() => {
    if( progressCurrentTotalFiles.value <= 0 ){
        return 0
    }

    return Math.max( 0, Math.min( 1, progressCurrentDeletedFiles.value / progressCurrentTotalFiles.value ))
})

const deleteProgressFraction = computed(() => {
    if( progressTotalProjects.value <= 0 ){
        return 0
    }

    const completedProjects = Math.max(
        0,
        Math.min( progressCompletedProjects.value, progressTotalProjects.value )
    )

    var overallFraction = completedProjects / progressTotalProjects.value

    const activeProjectInFlight = deleting.value &&
        progressCurrentProjectIndex.value > completedProjects &&
        progressCurrentProjectIndex.value <= progressTotalProjects.value

    if( activeProjectInFlight ){
        overallFraction += currentProjectProgressFraction.value / progressTotalProjects.value
    }

    return Math.max( 0, Math.min( 1, overallFraction ))
})

const deleteProgressPercent = computed(() => {
    return Math.round( deleteProgressFraction.value * 100 )
})

const waitForProjectRemoval = async ( projectIDs ) => {

    const normalizedIDs = Array.isArray( projectIDs )
        ? projectIDs.filter(( id ) => typeof id === "string" && id.length > 0 )
        : []

    if( normalizedIDs.length === 0 ) return

    const startedAt = Date.now()

    while( true ){
        const currentProjects = await projectlib.list()
        const stillExists = normalizedIDs.some(( id ) => {
            return Object.prototype.hasOwnProperty.call( currentProjects, id )
        })

        if( stillExists === false ){
            return
        }

        if(( Date.now() - startedAt ) >= DELETE_POLL_TIMEOUT_MS ){
            return
        }

        await utils.wait( DELETE_POLL_INTERVAL_MS )
    }
}

const deleteProjects = async () => {
    
    if( deleting.value ) return
    deleting.value = true

    const deletingProjects = props.projects.filter(( project ) => {
        return typeof project?.id === "string" && project.id.length > 0
    })
    const deletingProjectIDs = deletingProjects.map(( project ) => project.id )

    resetDeleteProgress()
    progressTotalProjects.value = deletingProjects.length

    try {
        for( var index = 0; index < deletingProjects.length; index++ ){
            const project = deletingProjects[index]
            progressCurrentProjectIndex.value = index + 1
            progressCurrentProjectName.value = String( project?.name ?? project?.id ?? "" )
            progressCurrentDeletedFiles.value = 0
            progressCurrentTotalFiles.value = 0

            await projectlib.remove( project, {
                onProgress: ( progress ) => {
                    if( progress === null || typeof progress !== "object" ) return

                    const nextDeleted = Number.parseInt( String( progress.deletedFiles ?? 0 ), 10 )
                    const nextTotal = Number.parseInt( String( progress.totalFiles ?? 0 ), 10 )

                    progressCurrentDeletedFiles.value = Number.isInteger( nextDeleted ) && nextDeleted >= 0
                        ? nextDeleted
                        : 0
                    progressCurrentTotalFiles.value = Number.isInteger( nextTotal ) && nextTotal >= 0
                        ? nextTotal
                        : 0
                }
            })

            progressCompletedProjects.value = index + 1
        }

        await waitForProjectRemoval( deletingProjectIDs )
        emit("updateProjects")

        inputText.value = ""
        close()
    } catch( error ){
        console.log( error )
    } finally {
        deleting.value = false
    }
}

const open = () => {
    inputText.value = ""
    resetDeleteProgress()
    modal.value.open()
}
const close = () => {
    inputText.value = ""
    resetDeleteProgress()
    modal.value.close()
}

defineExpose({ open, close })
</script>
