<template>
    <div class = "w-full">
        <!-- Upload Button -->
        <label
            class = "inline-flex items-center justify-center px-4 py-2 rounded rounded-full w-full
                    bg-brand text-white font-semibold cursor-pointer hover:bg-brand-dark transition shadow-md shadow-black">
            Upload data
            <input  type = "file"
                    hidden
                    multiple
                    @change = "handleUpload"
                    @click = "$event.target.value=''"/>
        </label>

        <!-- Upload Progress Modal -->
        <Modal ref = "modal" title = "Project initialization" :showClose = "!closeDisabled">
            <!-- Main -->
            <template #main>
                <hr class = "h-0.5 my-2 bg-gray border-0">

                <p class="text-white mb-2 truncate">
                    ({{ currentIteration }} / {{ nFiles }}) - {{ activeFile.name || 'No file selected' }}
                </p>

                <ProgressRow :state="uploadState">Uploading to database.</ProgressRow>
                <ProgressRow :state="validationState">Validating input file.</ProgressRow>
                <ProgressRow :state="estimateState">Estimating Raman spectrum.</ProgressRow>

                <hr class = "h-0.5 my-2 bg-gray border-0">

                <p class="text-red-500 mt-2" v-if="showError">
                    <i class="fa fa-exclamation-triangle fa-lg mr-2"></i>
                    {{ errorMessage }}
                </p>
            </template>

            <!-- Footer -->
            <template #footer>
                <button
                    class = "px-4 py-2 mb-4 mt-2 bg-brand rounded text-white hover:bg-brand-dark
                            disabled:opacity-50 disabled:cursor-not-allowed transition float-right"
                    :disabled = "closeDisabled"
                    @click = "modal.close()">
                    Close
                </button>
            </template>
        </Modal>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { projects as projectlib, settings as settingslib, utils } from '@harkana/tools'

import Modal from '../modals/Modal.vue'
import ProgressRow from '../modals/ProgressRow.vue'

const emit = defineEmits(['updateProjects'])

const modal = ref<any>(null)
const showError = ref(false)
const closeDisabled = ref(false)
const errorMessage = ref('')

const validationState = ref('')
const uploadState = ref('')
const estimateState = ref('')

const activeFile = ref<File | null>(null)
const currentIteration = ref(0)
const nFiles = ref(0)

const resetProgress = () => {
    validationState.value = 'idle'
    uploadState.value = 'idle'
    estimateState.value = 'idle'
}


const handleUpload = async (event: Event) => {

    const files = (event.target as HTMLInputElement).files
    if (!files || !files.length) return

    nFiles.value = files.length
    currentIteration.value = 1
    activeFile.value = files[0]

    modal.value.open()
    showError.value = false
    errorMessage.value = ''

    var hasError = false

    validationState.value = 'progress'
    uploadState.value = 'idle'
    estimateState.value = 'idle'

    const billingSettings = await settingslib.getBilling();

    for(var ii = 0; ii < nFiles.value; ii++){

        closeDisabled.value = true
        resetProgress()

        const file = files[ii]
        activeFile.value = file
        currentIteration.value = ii + 1

        validationState.value = 'progress'
        uploadState.value = 'progress'
        estimateState.value = 'progress'

        const progress = {
            validate: (state ) => (validationState.value = state),
            upload: (state ) => (uploadState.value = state),
            estimate: (state ) => (estimateState.value = state)
        }

        try {

            const result = await projectlib.upload( file, billingSettings.groupID, progress)
            if (result instanceof Error) throw result

        } catch (error: any) {

            errorMessage.value = error.message || String(error)
            showError.value = true
            closeDisabled.value = false
            hasError = true
            break
        }
    }

    emit("updateProjects")
    closeDisabled.value = false

    if (!hasError) {
        await utils.wait(500)
        modal.value.close()
    }
}
</script>
