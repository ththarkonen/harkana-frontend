<template>
    <div class = "w-full">
        <div v-if = "isHyperspectrum">
            <BaseDropdown
                rootClass = "relative block w-full text-left"
                :triggerClass = "uploadTriggerClass"
                menuClass = "absolute left-0 z-50 mt-2 min-w-full overflow-hidden rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30"
                listClass = "py-1"
                :closeOnSelect = "true">
                <template #trigger>
                    <span>Upload data</span>
                </template>

                <BaseDropdownItem :disabled = "isUploadLocked" @select = "openStandardPicker">
                    Upload OIR
                </BaseDropdownItem>
                <BaseDropdownItem :disabled = "isUploadLocked" @select = "openStandardPicker">
                    Upload TIFF
                </BaseDropdownItem>
                <BaseDropdownItem :disabled = "isUploadLocked" @select = "openOmeZarrPicker">
                    Upload OME-Zarr
                </BaseDropdownItem>
                <BaseDropdownItem :disabled = "isUploadLocked" @select = "openOmeTiffPicker">
                    Upload OME-TIFF
                </BaseDropdownItem>
            </BaseDropdown>
        </div>

        <label v-else
               :class = "standardUploadLabelClass">
            Upload data
            <input type = "file"
                   hidden
                   multiple
                   :disabled = "isUploadLocked"
                   @change = "handleStandardUpload"
                   @click = "resetInputValue"/>
        </label>

        <input ref = "standardFileInput"
               type = "file"
               hidden
               multiple
               :disabled = "isUploadLocked"
               @change = "handleStandardUpload"
               @click = "resetInputValue"/>

        <input ref = "omeZarrInput"
               type = "file"
               hidden
               multiple
               webkitdirectory
               directory
               :disabled = "isUploadLocked"
               @change = "handleOmeZarrUpload"
               @click = "resetInputValue"/>

        <input ref = "omeTiffInput"
               type = "file"
               hidden
               multiple
               accept = ".ome.tif,.ome.tiff,.tif,.tiff"
               :disabled = "isUploadLocked"
               @change = "handleOmeTiffUpload"
               @click = "resetInputValue"/>

        <Modal ref = "progressModal"
               title = "Project initialization"
               :showClose = "!closeDisabled"
               panelClass = "max-w-3xl"
               @close = "onProgressModalClose">
            <template #main>
                <div class = "space-y-4 pb-4">
                    <p class = "text-sm leading-relaxed text-white/90">
                        {{ progressModalDescription }}
                    </p>

                    <div class = "rounded-lg border border-brand bg-white p-4">
                        <p class = "text-xs font-semibold uppercase tracking-wide text-black">
                            Current upload
                        </p>
                        <div class = "mt-2 text-sm font-semibold text-black">
                            File {{ currentIteration }} / {{ nFiles }}
                        </div>
                        <div class = "mt-1 break-words text-sm text-black/80">
                            {{ activeFile?.name || "No file selected" }}
                        </div>
                    </div>

                    <div v-if = "isSpectrumUpload" class = "space-y-3">
                        <ProgressRow :state = "uploadState">Uploading to database. {{ uploadPercentage }}</ProgressRow>
                        <ProgressRow :state = "validationState">Validating input file.</ProgressRow>
                        <ProgressRow :state = "estimateState">Estimating Raman spectrum.</ProgressRow>
                    </div>
                    <div v-else class = "space-y-3">
                        <ProgressRow :state = "uploadState">Uploading to database. {{ uploadPercentage }}</ProgressRow>
                        <ProgressRow :state = "validationState">Parsing hyperspectral data.</ProgressRow>
                    </div>

                    <div v-if = "showError" class = "rounded-lg border border-red-500/70 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        <i class = "fa fa-exclamation-triangle mr-2"></i>
                        {{ errorMessage }}
                    </div>
                </div>
            </template>

            <template #footer>
                <template v-if = "closeDisabled === false">
                    <hr class = "h-0.5 mt-4 bg-gray border-0">
                    <div class = "mb-4 mt-4 flex justify-end">
                        <button
                            class = "rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                            :disabled = "closeDisabled"
                            @click = "progressModal?.close()">
                            Close
                        </button>
                    </div>
                </template>
            </template>
        </Modal>

        <HyperspectrumOmeZarrModal
            ref = "omeZarrModal"
            :sourceTypeLabel = "inspectedSourceTypeLabel"
            :preparing = "omeZarrPreparing"
            :preparationError = "omeZarrPreparationError"
            :inspectResponse = "omeZarrInspectResponse"
            :submitting = "omeZarrSubmitting"
            :submissionError = "omeZarrSubmissionError"
            :activeFileName = "activeFile?.name || ''"
            :currentIteration = "currentIteration"
            :nFiles = "nFiles"
            :datasetIteration = "omeZarrDatasetIteration"
            :datasetCount = "omeZarrDatasetCount"
            :reuseMatchingDimensions = "omeZarrReuseMatchingDimensions"
            :uploadPercentage = "uploadPercentage"
            :uploadState = "uploadState"
            :validationState = "validationState"
            @submit = "submitOmeZarrAnalysis"
            @update:reuseMatchingDimensions = "updateOmeZarrReuseMatchingDimensions"
            @cancel = "cancelOmeZarrAnalysis"/>
    </div>
</template>

<script setup lang = "ts">

import { ref, computed } from "vue"
import { projects as projectlib, settings as settingslib, utils } from "@harkana/tools"

import Modal from "../modals/Modal.vue"
import ProgressRow from "../modals/ProgressRow.vue"
import HyperspectrumOmeZarrModal from "../modals/HyperspectrumOmeZarrModal.vue"
import BaseDropdown from "../navbar/BaseDropdown.vue"
import BaseDropdownItem from "../navbar/BaseDropdownItem.vue"

const dataType = String((import.meta as any).env.VITE_DATA_TYPE ?? "" ).trim().toLowerCase()
const isHyperspectrum = dataType === "hypercars" || dataType === "hyperraman"

const emit = defineEmits([ "updateProjects" ])

const progressModal = ref<any>( null )
const omeZarrModal = ref<any>( null )
const standardFileInput = ref<HTMLInputElement | null>( null )
const omeZarrInput = ref<HTMLInputElement | null>( null )
const omeTiffInput = ref<HTMLInputElement | null>( null )

const showError = ref( false )
const closeDisabled = ref( false )
const errorMessage = ref( "" )

const uploadPercentage = ref( "0%" )
const validationState = ref( "idle" )
const uploadState = ref( "idle" )
const estimateState = ref( "idle" )

const activeFile = ref<{ name: string } | null>( null )
const currentIteration = ref( 0 )
const nFiles = ref( 0 )

const inspectedSourceType = ref<"ome-zarr" | "ome-tiff">( "ome-zarr" )
const omeZarrPreparedProject = ref<any>( null )
const omeZarrGroupID = ref( "" )
const omeZarrDatasetQueue = ref<any[]>( [] )
const omeZarrDatasetIndex = ref( 0 )
const omeZarrPreparing = ref( false )
const omeZarrPreparationError = ref( "" )
const omeZarrInspectResponse = ref<any>( null )
const omeZarrReuseMatchingDimensions = ref( false )
const omeZarrReusableSelections = ref<Record<string, { axisMapping: Record<string, string>, fixedIndices?: Record<string, number> }>>( {} )
const omeZarrSubmitting = ref( false )
const omeZarrSubmissionError = ref( "" )
const uploadLock = ref( false )

const isSpectrumUpload = computed(() => {
    return dataType === "cars" || dataType === "raman"
})

const progressModalDescription = computed(() => {
    if( isSpectrumUpload.value ){
        return "Upload the spectrum file, validate the input, and initialize the project analysis."
    }

    return "Upload the hyperspectral source, parse the data, and initialize the project analysis."
})

const isUploadLocked = computed(() => {
    return uploadLock.value === true
})

const inspectedSourceTypeLabel = computed(() => {
    return inspectedSourceType.value === "ome-tiff" ? "OME-TIFF" : "OME-Zarr"
})

const omeZarrDatasetCount = computed(() => {
    return Math.max( 1, omeZarrDatasetQueue.value.length || 0 )
})

const omeZarrDatasetIteration = computed(() => {
    return Math.min( omeZarrDatasetCount.value, omeZarrDatasetIndex.value + 1 )
})

const uploadTriggerClass = computed(() => {
    const baseClass = "inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 font-semibold text-white shadow-md shadow-black transition focus:outline-none focus:ring-2 focus:ring-brand"
    if( isUploadLocked.value ){
        return baseClass + " cursor-not-allowed opacity-60 pointer-events-none"
    }

    return baseClass + " hover:bg-brand-dark"
})

const standardUploadLabelClass = computed(() => {
    const baseClass = "inline-flex w-full items-center justify-center rounded-full bg-brand px-4 py-2 font-semibold text-white shadow-md shadow-black transition"
    if( isUploadLocked.value ){
        return baseClass + " cursor-not-allowed opacity-60 pointer-events-none"
    }

    return baseClass + " cursor-pointer hover:bg-brand-dark"
})

const resetProgress = () => {
    uploadPercentage.value = "0%"
    validationState.value = "idle"
    uploadState.value = "idle"
    estimateState.value = "idle"
}

const resetProgressModalState = () => {
    showError.value = false
    closeDisabled.value = false
    errorMessage.value = ""
    activeFile.value = null
    currentIteration.value = 0
    nFiles.value = 0
    resetProgress()
}

const resetOmeZarrModalState = () => {
    inspectedSourceType.value = "ome-zarr"
    omeZarrPreparedProject.value = null
    omeZarrDatasetQueue.value = []
    omeZarrDatasetIndex.value = 0
    omeZarrPreparing.value = false
    omeZarrPreparationError.value = ""
    omeZarrInspectResponse.value = null
    omeZarrReuseMatchingDimensions.value = false
    omeZarrReusableSelections.value = {}
    omeZarrSubmitting.value = false
    omeZarrSubmissionError.value = ""
}

const resetInputValue = ( event: Event ) => {
    const target = event.target as HTMLInputElement | null
    if( target ){
        target.value = ""
    }
}

const openStandardPicker = () => {
    if( isUploadLocked.value ){
        return
    }

    standardFileInput.value?.click()
}

const openOmeZarrPicker = () => {
    if( isUploadLocked.value ){
        return
    }

    omeZarrInput.value?.click()
}

const openOmeTiffPicker = () => {
    if( isUploadLocked.value ){
        return
    }

    omeTiffInput.value?.click()
}

const onProgressModalClose = () => {
    if( closeDisabled.value === false ){
        uploadLock.value = false
    }
}

const setProgressError = ( error: any ) => {
    errorMessage.value = error?.message || String( error )
    showError.value = true
    closeDisabled.value = false
}

const buildInspectDimensionsSignature = ( inspectResponse: any ) => {
    const dimensions = inspectResponse?.dimensions ?? {}
    return JSON.stringify({
        axisOrder: String( dimensions?.axisOrder ?? "" ).trim(),
        shape: Array.isArray( dimensions?.shape ) ? dimensions.shape : [],
        shapeByAxis: typeof dimensions?.shapeByAxis === "object" && dimensions?.shapeByAxis !== null
            ? dimensions.shapeByAxis
            : {},
        axes: Array.isArray( dimensions?.axes )
            ? dimensions.axes.map(( axis: any ) => ({
                index: Number.parseInt( String( axis?.index ?? 0 ), 10 ) || 0,
                name: String( axis?.name ?? "" ).trim(),
                type: String( axis?.type ?? "" ).trim(),
                unit: axis?.unit === null ? null : String( axis?.unit ?? "" ),
                size: Number.parseInt( String( axis?.size ?? 0 ), 10 ) || 0
            }))
            : [],
        analysisRoles: typeof dimensions?.analysisRoles === "object" && dimensions?.analysisRoles !== null
            ? dimensions.analysisRoles
            : {},
        layerAxisOptions: Array.isArray( dimensions?.layerAxisOptions ) ? dimensions.layerAxisOptions : [],
        recommendedLayerAxis: dimensions?.recommendedLayerAxis === null
            ? null
            : String( dimensions?.recommendedLayerAxis ?? "" )
    })
}

const cloneAnalysisPayload = ( payload: { axisMapping: Record<string, string>, fixedIndices?: Record<string, number> } ) => {
    const axisMapping: Record<string, string> = {}
    for( const [ role, axisName ] of Object.entries( payload?.axisMapping ?? {} )){
        axisMapping[ role ] = String( axisName ?? "" )
    }

    const fixedIndices: Record<string, number> = {}
    for( const [ axisName, rawValue ] of Object.entries( payload?.fixedIndices ?? {} )){
        const numericValue = Number.parseInt( String( rawValue ), 10 )
        if( Number.isInteger( numericValue ) ){
            fixedIndices[ axisName ] = numericValue
        }
    }

    return {
        axisMapping,
        fixedIndices
    }
}

const uploadProgressCallbacks = () => {
    return {
        uploadPercentage: ( state: string ) => ( uploadPercentage.value = state ),
        validate: ( state: string ) => ( validationState.value = state ),
        upload: ( state: string ) => ( uploadState.value = state ),
        estimate: ( state: string ) => ( estimateState.value = state ),
        file: ( state: { name?: string, index?: number, totalFiles?: number } ) => {
            activeFile.value = { name: String( state?.name ?? "No file selected" ) }
            currentIteration.value = Math.max( 1, Number.parseInt( String( state?.index ?? 1 ), 10 ) || 1 )
            nFiles.value = Math.max( 1, Number.parseInt( String( state?.totalFiles ?? 1 ), 10 ) || 1 )
        }
    }
}

const updateOmeZarrReuseMatchingDimensions = ( nextValue: boolean ) => {
    omeZarrReuseMatchingDimensions.value = nextValue === true

    if( omeZarrReuseMatchingDimensions.value === false ){
        omeZarrReusableSelections.value = {}
    }
}

const finishOmeZarrBatch = () => {
    resetProgressModalState()
    resetOmeZarrModalState()
    omeZarrModal.value?.close()
    uploadLock.value = false
    emit( "updateProjects" )
}

const prepareNextOmeZarrDataset = async () => {
    const dataset = omeZarrDatasetQueue.value[ omeZarrDatasetIndex.value ]

    if( dataset === undefined ){
        finishOmeZarrBatch()
        return
    }

    resetProgressModalState()
    omeZarrPreparedProject.value = null
    omeZarrPreparationError.value = ""
    omeZarrInspectResponse.value = null
    omeZarrSubmissionError.value = ""
    omeZarrPreparing.value = true
    uploadState.value = "progress"
    validationState.value = "progress"
    nFiles.value = Array.isArray( dataset?.files ) ? dataset.files.length : 1
    currentIteration.value = nFiles.value > 0 ? 1 : 0

    try {
        const preparedProject = inspectedSourceType.value === "ome-tiff"
            ? await projectlib.prepareHyperspectrumOmeTiffDataset( dataset, uploadProgressCallbacks() )
            : await projectlib.prepareHyperspectrumOmeZarrDataset( dataset, uploadProgressCallbacks() )
        if( preparedProject instanceof Error ){
            throw preparedProject
        }

        omeZarrPreparedProject.value = preparedProject
        omeZarrInspectResponse.value = preparedProject.inspectResponse
        omeZarrPreparing.value = false

        const dimensionsSignature = buildInspectDimensionsSignature( preparedProject.inspectResponse )
        if(
            omeZarrReuseMatchingDimensions.value === true &&
            typeof omeZarrReusableSelections.value[ dimensionsSignature ] === "object"
        ){
            await submitCurrentOmeZarrAnalysis( cloneAnalysisPayload( omeZarrReusableSelections.value[ dimensionsSignature ] ))
        }
    } catch (error: any) {
        omeZarrPreparing.value = false
        omeZarrPreparationError.value = error?.message || String( error )
    }
}

const submitCurrentOmeZarrAnalysis = async (
    payload: { axisMapping: Record<string, string>, fixedIndices?: Record<string, number> }
) => {

    if( omeZarrPreparedProject.value === null ){
        omeZarrSubmissionError.value = "No prepared " + inspectedSourceTypeLabel.value + " source is available."
        return
    }

    omeZarrSubmitting.value = true
    omeZarrSubmissionError.value = ""

    try {
        const result = inspectedSourceType.value === "ome-tiff"
            ? await projectlib.launchHyperspectrumOmeTiffAnalysis(
                omeZarrPreparedProject.value,
                omeZarrGroupID.value,
                payload
            )
            : await projectlib.launchHyperspectrumOmeZarrAnalysis(
                omeZarrPreparedProject.value,
                omeZarrGroupID.value,
                payload
            )

        if( result instanceof Error ){
            throw result
        }

        if( omeZarrReuseMatchingDimensions.value === true && omeZarrInspectResponse.value !== null ){
            const dimensionsSignature = buildInspectDimensionsSignature( omeZarrInspectResponse.value )
            omeZarrReusableSelections.value = {
                ...omeZarrReusableSelections.value,
                [ dimensionsSignature ]: cloneAnalysisPayload( payload )
            }
        } else {
            omeZarrReusableSelections.value = {}
        }

        omeZarrPreparedProject.value = null
        omeZarrInspectResponse.value = null
        omeZarrSubmissionError.value = ""
        omeZarrSubmitting.value = false
        omeZarrDatasetIndex.value += 1

        if( omeZarrDatasetIndex.value >= omeZarrDatasetQueue.value.length ){
            finishOmeZarrBatch()
            return
        }

        await prepareNextOmeZarrDataset()
        return
    } catch (error: any) {
        omeZarrSubmissionError.value = error?.message || String( error )
    } finally {
        if( omeZarrPreparedProject.value !== null ){
            omeZarrSubmitting.value = false
        }
    }
}

const startInspectableUploadBatch = async (
    sourceType: "ome-zarr" | "ome-tiff",
    files: FileList
) => {

    uploadLock.value = true
    resetProgressModalState()
    resetOmeZarrModalState()
    inspectedSourceType.value = sourceType
    await omeZarrModal.value?.open()

    try {
        omeZarrDatasetQueue.value = sourceType === "ome-tiff"
            ? projectlib.listHyperspectrumOmeTiffDatasets( files )
            : projectlib.listHyperspectrumOmeZarrDatasets( files )
        omeZarrDatasetIndex.value = 0
        currentIteration.value = 0
        nFiles.value = 0
        activeFile.value = null

        const billingSettings = await settingslib.getBilling()
        omeZarrGroupID.value = typeof billingSettings?.groupID === "string" ? billingSettings.groupID : ""

        await prepareNextOmeZarrDataset()
    } catch (error: any) {
        omeZarrPreparationError.value = error?.message || String( error )
    }
}

const handleStandardUpload = async ( event: Event ) => {

    if( isUploadLocked.value ){
        return
    }

    const files = ( event.target as HTMLInputElement ).files
    if( !files || !files.length ) return

    uploadLock.value = true
    resetProgressModalState()

    nFiles.value = files.length
    currentIteration.value = 1
    activeFile.value = { name: files[0].name }
    closeDisabled.value = true

    await progressModal.value?.open()
    var hasError = false

    try {
        const billingSettings = await settingslib.getBilling()

        for( var ii = 0; ii < nFiles.value; ii++ ){

            closeDisabled.value = true
            resetProgress()

            const file = files[ii]
            activeFile.value = { name: file.name }
            currentIteration.value = ii + 1

            validationState.value = "progress"
            uploadState.value = "progress"
            estimateState.value = "progress"

            const progress = uploadProgressCallbacks()

            try {
                const result = isHyperspectrum
                    ? await projectlib.hyperspectrum( file, billingSettings.groupID, progress )
                    : await projectlib.upload( file, billingSettings.groupID, progress )

                if( result instanceof Error ){
                    throw result
                }
            } catch (error: any) {
                setProgressError( error )
                hasError = true
                break
            }
        }
    } catch (error: any) {
        setProgressError( error )
        hasError = true
    }

    emit( "updateProjects" )
    closeDisabled.value = false

    if( !hasError ){
        await utils.wait( 500 )
        progressModal.value.close()
        uploadLock.value = false
    }
}

const handleOmeZarrUpload = async ( event: Event ) => {

    if( isUploadLocked.value ){
        return
    }

    const files = ( event.target as HTMLInputElement ).files
    if( !files || !files.length ) return

    await startInspectableUploadBatch( "ome-zarr", files )
}

const handleOmeTiffUpload = async ( event: Event ) => {

    if( isUploadLocked.value ){
        return
    }

    const files = ( event.target as HTMLInputElement ).files
    if( !files || !files.length ) return

    await startInspectableUploadBatch( "ome-tiff", files )
}

const submitOmeZarrAnalysis = async ( payload: { axisMapping: Record<string, string>, fixedIndices?: Record<string, number> } ) => {
    await submitCurrentOmeZarrAnalysis( payload )
}

const cancelOmeZarrAnalysis = async () => {

    omeZarrSubmissionError.value = ""

    if( omeZarrPreparedProject.value !== null ){
        try {
            await projectlib.remove( omeZarrPreparedProject.value.project )
        } catch (error) {
            console.log( error )
        }
    }

    resetProgressModalState()
    resetOmeZarrModalState()
    uploadLock.value = false
}
</script>
