<template>
<Modal ref = "modal" :title = "'Project metadata'" :showClose = "true">

    <template #main>
        
        <span class = "text-lg font-semibold text-white block mb-2">{{ project.name }}</span>
        <p class="text-white mb-2">
            <span v-if = "!project.shared">View and edit the metadata associated with this project.</span>
            <p v-if = "project.shared">This project is shared and metadata cannot be modified.</p>
        </p>

        <hr class = "h-0.5 bg-gray border-0 my-4">

        <!-- Scrollable JSON editor -->
        <div class = "mb-2 max-h-96 overflow-y-auto rounded bg-gray-800">
            <JsonEditorVue v-model="preview" mode = "tree"></JsonEditorVue>
        </div>
        <hr class = "h-0.5 bg-gray border-0 mt-4">

    </template>

    <template #footer v-if = "!project.shared">
        
        <ModalButton @click = "upload" :loading = "isUploading">
            Update metadata
        </ModalButton>

    </template>

</Modal>
</template>

<script setup>

import JsonEditorVue from 'json-editor-vue'
import { metadata as md, utils} from "@harkana/tools"

import { ref, toRaw} from 'vue'
import Modal from "./Modal.vue"
import ModalButton from './ModalButton.vue'

const props = defineProps({
    project: { type: Object, required: true }
})

const emit = defineEmits(["updateProjects"])

const modal = ref(null)
const preview = ref(null)
const metadata = ref({})
const isUploading = ref(false)

const upload = async () => {

    if ( isUploading.value ) return
    isUploading.value = true

    try {

        const metadataString = JSON.stringify(preview.value)
        const parameters = { type: "application/json" }
        const blob = new Blob([metadataString], parameters)
        const file = new File([blob], parameters)

        await md.upload( props.project, file)
        metadata.value = await md.load( props.project )

    } finally {

        emit("updateProjects")
        await utils.wait( 1000 )
        isUploading.value = false
    }
}

const open = async () => {

    metadata.value = await md.load( props.project )
    preview.value = structuredClone( toRaw( metadata.value ) )

    modal.value.open()
}

const close = () => modal.value.close()
defineExpose({ open, close})

</script>

