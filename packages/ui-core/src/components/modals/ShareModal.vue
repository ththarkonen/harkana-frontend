<template>
    <Modal ref = "modal" :title = "'Project sharing'">
        <template v-slot:main>
            <div v-show = "!showInitialView">
                <p class = "text-white mb-4">
                    This project is shared with the following collaborators. Deleting the project will remove access for all collaborators.
                </p>
                
                <div v-show = "showCollaborators">
                    <hr class = "h-0.5 my-4 bg-gray border-0">
                    <p class = "text-white font-semibold mt-0 mb-2">Collaborators</p>
                    <ul class = "space-y-2">
                        <li v-for = "(collaborator, index) in collaborators" 
                            :key = "index"
                            class = "flex items-center justify-between bg-gray-700 rounded px-3 py-0 text-white">
                            <span>
                                {{ collaborator.given_name }} {{ collaborator.family_name }} - {{ collaborator.email }}
                            </span>
                            <button
                                @click = "removeCollaborator(collaborator)"
                                :title = "'Remove ' + collaborator.given_name + ' ' + collaborator.family_name + ' - ' + collaborator.email"
                                class = "ml-2 text-white hover:text-brand transition-colors">
                                <i class = "fas fa-trash"></i>
                            </button>
                        </li>
                    </ul>
                </div>
                
                <hr class = "h-0.5 my-4 bg-gray border-0">
                
                <p class = "text-white mb-4">
                    You can add collaborators by typing their email address and pressing share.
                </p>

                <p v-if = "errorMessage !== ''" class = "text-red-600 flex items-center gap-2 mb-4">
                    <i class = "fa fa-exclamation-triangle fa-lg"></i>
                    {{ errorMessage }}
                </p>
                
                <input 
                    type = "text" 
                    class = "w-full border border-gray-600 rounded px-3 py-2 mb-1 bg-gray-700 text-black
                            placeholder-gray focus:outline-none focus:ring-2 focus:ring-brand"
                    v-model = "inputEmail" 
                    placeholder = "Collaborator email address"
                    @keydown.enter = "addCollaborator"/>
            </div>

            <div v-show = "showInitialView" class = "w-full">
                <p v-show = "showInitialInfo" class = "text-white leading-relaxed mb-2">
                    Zenodo servers are responding slower than usual.
                    This may be due to maintenance or other server issues.
                    If this persists, please try again at a later time.
                </p>
                <div class = "w-full text-center mb-4">
                    <Spinner class = "w-8 h-8 text-brand"></Spinner>
                </div>
            </div>
        </template>
        
        <template v-slot:footer>
            <ModalButton v-show = "!showInitialView" @click = "addCollaborator" :loading = "addingCollaborator">
                Share
            </ModalButton>
        </template>
    </Modal>
</template>

<script setup>

import { ref, computed } from 'vue'
import { sharing } from "@harkana/tools"

import Modal from "./Modal.vue"
import ModalButton from './ModalButton.vue'
import Spinner from '../general/Spinner.vue'

const props = defineProps({
    project: { type: Object, required: true }
})

const modal = ref(null)
const inputEmail = ref("")
const collaborators = ref([])
const addingCollaborator = ref(false)

const showInitialView = ref(true)
const showInitialInfo = ref(false)

const errorMessage = ref("")

const removeCollaborator = async (collaborator) => {
    try {
        addingCollaborator.value = true
        await sharing.removeCollaborator( props.project, collaborator.sub)
        collaborators.value = await sharing.listCollaborators( props.project )
    } catch (error) {
        console.error( error )
        errorMessage.value = error.message
    } finally {
        addingCollaborator.value = false
    }
}

const addCollaborator = async () => {
    try {

        errorMessage.value = ""
        addingCollaborator.value = true
        await sharing.addCollaborator( props.project, inputEmail.value)

        collaborators.value = await sharing.listCollaborators( props.project )
        inputEmail.value = ""

    } catch (error) {
        console.error( error )
        errorMessage.value = error.message
    } finally {
        addingCollaborator.value = false
    }
}

const showCollaborators = computed(() => {
    return collaborators.value.length > 0
})

const open = async () => {

    showInitialView.value = true
    showInitialInfo.value = false
    setTimeout(() => showInitialInfo.value = true, 5000)
    
    modal.value.open()

    collaborators.value = await sharing.listCollaborators( props.project )
    showInitialView.value = false
}

const close = () => {
    modal.value.close()
}

defineExpose({
    open,
    close
})
</script>