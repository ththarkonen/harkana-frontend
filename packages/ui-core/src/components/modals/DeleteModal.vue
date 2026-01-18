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
        <ModalButton @click = "deleteProjects" :loading = "deleting" :disabled = "!verified">
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

const deleteProjects = async () => {
    
    if( deleting.value ) return
    deleting.value = true

    try {
        for( const project of props.projects ){
            console.log( project )
            await projectlib.remove( project )
        }
    } finally {

        emit("updateProjects")
        await utils.wait( 500 )

        inputText.value = ""
        deleting.value = false
        close()
    }
}

const open = () => modal.value.open()
const close = () => modal.value.close()

defineExpose({ open, close })
</script>
