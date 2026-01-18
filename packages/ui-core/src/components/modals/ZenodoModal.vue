<template>
    <Modal ref="modal" title="Zenodo deposit" :showClose="showClose">
        <template v-slot:main>
            <div v-show="showUploadInfo">
                <hr class = "h-0.5 bg-gray border-0 my-0 mb-4">
                <p class="text-white leading-relaxed">
                    You can upload your project to <a class="text-blue-400 hover:text-blue-300 underline transition-colors" href="https://www.zenodo.org" target="_blank">Zenodo</a>
                    to create a DOI and make it publicly available.
                    This requires a Zenodo account, which you can create for free if you do not have one already.
                    The upload requires a <a class="text-blue-400 hover:text-blue-300 underline transition-colors" href="https://www.zenodo.org/account/settings/applications" target="_blank">personal access token</a> with deposit:write permissions.
                    You can set your access token in the <a class="text-blue-400 hover:text-blue-300 underline transition-colors" href="/settings?section=Zenodo" target="_blank">settings</a> page.
                    <br><br>
                    The upload includes the raw data file, the processed data, the Raman estimate, and the metadata.
                    Please ensure that your project metadata is complete and accurate before proceeding with the upload.
                    You can edit the metadata by clicking the "Metadata" button in the sidebar.
                    <br><br>
                    Note that uploading to Zenodo may take some time depending on the size of your files and the current Zenodo server load.
                    You will receive a link to your Zenodo draft once the upload is complete and the draft is visible in
                    <a class="text-white hover:text-brand underline transition-colors break-all" href="https://www.zenodo.org/me/uploads" target="_blank">Zenodo uploads</a> as well.
                </p>
                <hr class = "h-0.5 bg-gray border-0 my-4">
            </div>

            <div v-show="showProgress">
                <hr class = "h-0.5 bg-gray border-0 mb-1">

                <ProgressRow v-for = "( item, key) in progressItems" :state = "state[key]">{{ item }}</ProgressRow>
                <hr class = "h-0.5 bg-gray border-0 mt-0 my-2 mt-1">
            </div>

            <p class="text-white leading-relaxed my-2" v-show="showSuccess">
                The Zenodo deposit was created successfully. You can access it at the link below. Please remember to finalize and publish the draft in Zenodo to make it publicly available.
                <br>
                <a class="text-white hover:text-brand underline transition-colors break-all" :href="zenodoDraftUrl" target="_blank">{{ zenodoDraftUrl }}</a>
            </p>

            <p v-show = "errorMessage !== ''" class="text-red-600 flex items-start gap-2">
                <i class="fa fa-exclamation-triangle fa-lg mt-1"></i>
                <span>{{ errorMessage }}</span>
            </p>

            <p v-show="!validZenodoToken" class="text-yellow-400 leading-relaxed mb-4">
                Your current personal access token in your
                <a class="text-white hover:text-brand underline transition-colors break-all" href="/settings?section=Zenodo" target="_blank">Zenodo settings</a>
                is not valid. Please verify the personal access token and then reload this page to enable Zenodo depositions.
            </p>

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
            <button 
                v-show="showUpload && validZenodoToken" 
                class="w-full bg-brand hover:bg-brand-dark text-white font-semibold mb-4
                py-2 px-4 rounded transition-colors focus:outline-none"
                @click="zenodoDeposit"
            >
                Create a Zenodo draft
            </button>
        </template>
    </Modal>
</template>

<script setup>

import { ref } from 'vue'
import { zenodo, utils, projects as projectlib} from "@harkana/tools"

import Modal from "./Modal.vue"
import ProgressRow from './ProgressRow.vue'
import Spinner from '../general/Spinner.vue'

const props = defineProps({
    project: { type: Object, required: true }
})

const modal = ref(null)
const projectInfo = ref({})
const validZenodoToken = ref(true)
const zenodoDraftUrl = ref("")

const showInitialView = ref(true)
const showInitialInfo = ref(false)

const showUploadInfo = ref(false)
const showProgress = ref(false)
const showUpload = ref(false)
const showSuccess = ref(false)
const showError = ref(false)
const showClose = ref(true)
const errorMessage = ref("")

const state = ref({
    draft: "progress",
    raw: "progress",
    data: "progress",
    estimate: "progress",
    metadata: "progress",
    calibration: "progress"
})

const progressItems = {
    draft: "Creating Zenodo deposition.",
    raw: "Uploading raw data file.",
    data: "Uploading data file.",
    estimate: "Uploading Raman estimate.",
    metadata: "Uploading metadata.",
    calibration: "Uploading calibration settings."
}

const zenodoDeposit = async () => {

    showClose.value = false
    showUpload.value = false
    showUploadInfo.value = false
    showProgress.value = true

    var draftID = null
    var draftURL = null

    try {
        const response = await zenodo.draft(props.project)
        state.value.draft = "success"
        await utils.wait(1000)

        draftID = response.data.ID
        draftURL = response.data.URL

    } catch (error) {
        showClose.value = true
        showError.value = true
        showUpload.value = true
        showSuccess.value = false

        errorMessage.value = "Something went wrong while depositing the project to Zenodo. "
        errorMessage.value += "This can be due to Zenodo server congestion or maintenance. "
        errorMessage.value += "Please try the upload again."
        console.error(error)

        return
    }

    try {

        await zenodo.upload(props.project, draftID, props.project.rawFileName)
        state.value.raw = "success"
        await utils.wait(1000)

        await zenodo.upload(props.project, draftID, "data.json")
        state.value.data = "success"
        await utils.wait(1000)

        await zenodo.upload(props.project, draftID, "estimate.json")
        state.value.estimate = "success"
        await utils.wait(1000)

        await zenodo.upload(props.project, draftID, "metadata.json")
        state.value.metadata = "success"
        await utils.wait(1000)

        await zenodo.upload(props.project, draftID, "calibration.json")
        state.value.calibration = "success"

        projectInfo.value.draftID = draftID
        await projectlib.setInfo(projectInfo.value)

        showUpload.value = false

        zenodoDraftUrl.value = draftURL
        showSuccess.value = true

    } catch (error) {

        showClose.value = true
        showError.value = true
        showUpload.value = true
        showSuccess.value = false

        errorMessage.value = "Something went wrong while depositing the project to Zenodo. "
        errorMessage.value += "This can be due to Zenodo server congestion or maintenance. "
        errorMessage.value += "Please try the upload again."
        console.error(error)

        await zenodo.remove( props.project, draftID)
    }
    
    showClose.value = true
}

const open = async () => {

    showInitialView.value = true
    showInitialInfo.value = false
    setTimeout(() => showInitialInfo.value = true, 5000)

    showClose.value = true
    showUpload.value = false
    showUploadInfo.value = false
    showProgress.value = false
    showSuccess.value = false

    modal.value.open()

    projectInfo.value = await projectlib.getInfo( props.project )
    const draftLinkExists = projectInfo.value.hasOwnProperty("draftID") && projectInfo.value.draftID !== null

    try {
        const response = await zenodo.checkToken( props.project )
        validZenodoToken.value = true
    } catch {
        console.log("Nonvalid Zenodo token")
    }

    var draft = null
    if (draftLinkExists) {
        try {
            draft = await zenodo.checkDraft( props.project, projectInfo.value.draftID)
        
            showUpload.value = false
            zenodoDraftUrl.value = `https://www.zenodo.org/deposit/${projectInfo.value.draftID}`
            showSuccess.value = true

            state.value.draft = "success"
            state.value.raw = "success"
            state.value.data = "success"
            state.value.estimate = "success"
            state.value.metadata = "success"
            state.value.calibration = "success"

            showInitialView.value = false
            showProgress.value = true
            showUploadInfo.value = false

        } catch (error) {
            delete projectInfo.value.draftID
            await projectlib.setInfo(projectInfo.value)

            showInitialView.value = false
            showProgress.value = false
            showUploadInfo.value = true
            showUpload.value = true
            showSuccess.value = false
            showClose.value = true
            state.value.draft = "progress"
            state.value.raw = "progress"
            state.value.data = "progress"
            state.value.estimate = "progress"
            state.value.metadata = "progress"
            state.value.calibration = "progress"
        }
    }
    
    showError.value = false
}

const close = () => modal.value.close()

defineExpose({
    open,
    close
})
</script>