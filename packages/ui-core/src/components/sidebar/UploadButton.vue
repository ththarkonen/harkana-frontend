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

                <BaseDropdownItem :disabled = "isUploadLocked" @select = "openOirPicker">
                    Upload OIR
                </BaseDropdownItem>
                <BaseDropdownItem :disabled = "isUploadLocked" @select = "openLegacyTiffPicker">
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
               accept = ".tif,.tiff"
               :disabled = "isUploadLocked"
               @change = "handleStandardUpload"
               @click = "resetInputValue"/>

        <input ref = "oirInput"
               type = "file"
               hidden
               multiple
               accept = ".oir"
               :disabled = "isUploadLocked"
               @change = "handleOirUpload"
               @click = "resetInputValue"/>

        <input ref = "omeZarrInput"
               type = "file"
               hidden
               multiple
               webkitdirectory
               directory
               :disabled = "isUploadLocked"
               @change = "handleInspectableOmeZarrUpload"
               @click = "resetInputValue"/>

        <input ref = "omeTiffInput"
               type = "file"
               hidden
               multiple
               accept = ".ome.tif,.ome.tiff,.tif,.tiff"
               :disabled = "isUploadLocked"
               @change = "handleInspectableOmeTiffUpload"
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
                        <ProgressRow :state = "estimateState">Starting estimate job.</ProgressRow>
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

        <HyperspectrumSourceModal
            ref = "sourceAnalysisModal"
            :sourceTypeLabel = "inspectedSourceTypeLabel"
            :preparing = "sourcePreparing"
            :preparationError = "sourcePreparationError"
            :inspectResponse = "sourceInspectResponse"
            :submitting = "sourceSubmitting"
            :submissionError = "sourceSubmissionError"
            :activeFileName = "activeFile?.name || ''"
            :currentIteration = "currentIteration"
            :nFiles = "nFiles"
            :datasetIteration = "sourceDatasetIteration"
            :datasetCount = "sourceDatasetCount"
            :reuseMatchingDimensions = "sourceReuseMatchingDimensions"
            :uploadPercentage = "uploadPercentage"
            :uploadState = "uploadState"
            :validationState = "validationState"
            @submit = "submitSourceAnalysis"
            @update:reuseMatchingDimensions = "updateSourceReuseMatchingDimensions"
            @cancel = "cancelSourceAnalysis"/>
    </div>
</template>

<script setup lang = "ts">

import { ref, computed } from "vue"
import { projects as projectlib, settings as settingslib, utils } from "@harkana/tools"

import Modal from "../modals/Modal.vue"
import ProgressRow from "../modals/ProgressRow.vue"
import HyperspectrumSourceModal from "../modals/HyperspectrumOmeZarrModal.vue"
import BaseDropdown from "../navbar/BaseDropdown.vue"
import BaseDropdownItem from "../navbar/BaseDropdownItem.vue"

const dataType = String((import.meta as any).env.VITE_DATA_TYPE ?? "" ).trim().toLowerCase()
const isHyperspectrum = dataType === "hypercars" || dataType === "hyperraman"

const emit = defineEmits([ "updateProjects" ])

const progressModal = ref<any>( null )
const sourceAnalysisModal = ref<any>( null )
const standardFileInput = ref<HTMLInputElement | null>( null )
const oirInput = ref<HTMLInputElement | null>( null )
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

const inspectedSourceType = ref<"oir" | "ome-zarr" | "ome-tiff">( "ome-zarr" )
const sourcePreparedProject = ref<any>( null )
const sourceAnalysisGroupID = ref( "" )
const sourceDatasetQueue = ref<any[]>( [] )
const sourceDatasetIndex = ref( 0 )
const sourcePreparing = ref( false )
const sourcePreparationError = ref( "" )
const sourceInspectResponse = ref<any>( null )
const sourceReuseMatchingDimensions = ref( false )
const sourceReusableSelections = ref<Record<string, { axisMapping: Record<string, string>, fixedIndices?: Record<string, number> }>>( {} )
const sourceSubmitting = ref( false )
const sourceSubmissionError = ref( "" )
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

const sourceTypeLabels: Record<string, string> = {
    oir: "OIR",
    "ome-zarr": "OME-Zarr",
    "ome-tiff": "OME-TIFF"
}

const inspectedSourceTypeLabel = computed(() => {
    return sourceTypeLabels[ inspectedSourceType.value ] ?? "Source"
})

const sourceDatasetCount = computed(() => {
    return Math.max( 1, sourceDatasetQueue.value.length || 0 )
})

const sourceDatasetIteration = computed(() => {
    return Math.min( sourceDatasetCount.value, sourceDatasetIndex.value + 1 )
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

const resetSourceAnalysisState = () => {
    inspectedSourceType.value = "ome-zarr"
    sourcePreparedProject.value = null
    sourceDatasetQueue.value = []
    sourceDatasetIndex.value = 0
    sourcePreparing.value = false
    sourcePreparationError.value = ""
    sourceInspectResponse.value = null
    sourceReuseMatchingDimensions.value = false
    sourceReusableSelections.value = {}
    sourceSubmitting.value = false
    sourceSubmissionError.value = ""
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

const openLegacyTiffPicker = () => {
    openStandardPicker()
}

const openOirPicker = () => {
    if( isUploadLocked.value ){
        return
    }

    oirInput.value?.click()
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
        project: () => emit( "updateProjects" ),
        file: ( state: { name?: string, index?: number, totalFiles?: number } ) => {
            activeFile.value = { name: String( state?.name ?? "No file selected" ) }
            currentIteration.value = Math.max( 1, Number.parseInt( String( state?.index ?? 1 ), 10 ) || 1 )
            nFiles.value = Math.max( 1, Number.parseInt( String( state?.totalFiles ?? 1 ), 10 ) || 1 )
        }
    }
}

const updateSourceReuseMatchingDimensions = ( nextValue: boolean ) => {
    sourceReuseMatchingDimensions.value = nextValue === true

    if( sourceReuseMatchingDimensions.value === false ){
        sourceReusableSelections.value = {}
    }
}

const finishSourceAnalysisBatch = () => {
    resetProgressModalState()
    resetSourceAnalysisState()
    sourceAnalysisModal.value?.close()
    uploadLock.value = false
    emit( "updateProjects" )
}

const prepareNextSourceDataset = async () => {
    const dataset = sourceDatasetQueue.value[ sourceDatasetIndex.value ]

    if( dataset === undefined ){
        finishSourceAnalysisBatch()
        return
    }

    resetProgressModalState()
    sourcePreparedProject.value = null
    sourcePreparationError.value = ""
    sourceInspectResponse.value = null
    sourceSubmissionError.value = ""
    sourcePreparing.value = true
    uploadState.value = "progress"
    validationState.value = "progress"
    nFiles.value = Array.isArray( dataset?.files ) ? dataset.files.length : 1
    currentIteration.value = nFiles.value > 0 ? 1 : 0

    try {
        let preparedProject: any

        if( inspectedSourceType.value === "oir" ){
            preparedProject = await projectlib.prepareHyperspectrumOirDataset( dataset, uploadProgressCallbacks() )
        } else if( inspectedSourceType.value === "ome-tiff" ){
            preparedProject = await projectlib.prepareHyperspectrumOmeTiffDataset( dataset, uploadProgressCallbacks() )
        } else {
            preparedProject = await projectlib.prepareHyperspectrumOmeZarrDataset( dataset, uploadProgressCallbacks() )
        }

        if( preparedProject instanceof Error ){
            throw preparedProject
        }

        sourcePreparedProject.value = preparedProject
        sourceInspectResponse.value = preparedProject.inspectResponse
        sourcePreparing.value = false

        const dimensionsSignature = buildInspectDimensionsSignature( preparedProject.inspectResponse )
        if(
            sourceReuseMatchingDimensions.value === true &&
            typeof sourceReusableSelections.value[ dimensionsSignature ] === "object"
        ){
            await submitCurrentSourceAnalysis( cloneAnalysisPayload( sourceReusableSelections.value[ dimensionsSignature ] ))
        }
    } catch (error: any) {
        sourcePreparing.value = false
        sourcePreparationError.value = error?.message || String( error )
    }
}

const submitCurrentSourceAnalysis = async (
    payload: { axisMapping: Record<string, string>, fixedIndices?: Record<string, number> }
) => {

    if( sourcePreparedProject.value === null ){
        sourceSubmissionError.value = "No prepared " + inspectedSourceTypeLabel.value + " source is available."
        return
    }

    sourceSubmitting.value = true
    sourceSubmissionError.value = ""

    try {
        let result: any

        if( inspectedSourceType.value === "oir" ){
            result = await projectlib.launchHyperspectrumOirAnalysis(
                sourcePreparedProject.value,
                sourceAnalysisGroupID.value,
                payload
            )
        } else if( inspectedSourceType.value === "ome-tiff" ){
            result = await projectlib.launchHyperspectrumOmeTiffAnalysis(
                sourcePreparedProject.value,
                sourceAnalysisGroupID.value,
                payload
            )
        } else {
            result = await projectlib.launchHyperspectrumOmeZarrAnalysis(
                sourcePreparedProject.value,
                sourceAnalysisGroupID.value,
                payload
            )
        }

        if( result instanceof Error ){
            throw result
        }

        if( sourceReuseMatchingDimensions.value === true && sourceInspectResponse.value !== null ){
            const dimensionsSignature = buildInspectDimensionsSignature( sourceInspectResponse.value )
            sourceReusableSelections.value = {
                ...sourceReusableSelections.value,
                [ dimensionsSignature ]: cloneAnalysisPayload( payload )
            }
        } else {
            sourceReusableSelections.value = {}
        }

        sourcePreparedProject.value = null
        sourceInspectResponse.value = null
        sourceSubmissionError.value = ""
        sourceSubmitting.value = false
        sourceDatasetIndex.value += 1

        if( sourceDatasetIndex.value >= sourceDatasetQueue.value.length ){
            finishSourceAnalysisBatch()
            return
        }

        await prepareNextSourceDataset()
        return
    } catch (error: any) {
        sourceSubmissionError.value = error?.message || String( error )
    } finally {
        if( sourcePreparedProject.value !== null ){
            sourceSubmitting.value = false
        }
    }
}

const startInspectableSourceUploadBatch = async (
    sourceType: "oir" | "ome-zarr" | "ome-tiff",
    files: FileList
) => {

    uploadLock.value = true
    resetProgressModalState()
    resetSourceAnalysisState()
    inspectedSourceType.value = sourceType
    await sourceAnalysisModal.value?.open()

    try {
        if( sourceType === "oir" ){
            sourceDatasetQueue.value = projectlib.listHyperspectrumOirDatasets( files )
        } else if( sourceType === "ome-tiff" ){
            sourceDatasetQueue.value = projectlib.listHyperspectrumOmeTiffDatasets( files )
        } else {
            sourceDatasetQueue.value = projectlib.listHyperspectrumOmeZarrDatasets( files )
        }
        sourceDatasetIndex.value = 0
        currentIteration.value = 0
        nFiles.value = 0
        activeFile.value = null

        const billingSettings = await settingslib.getBilling()
        sourceAnalysisGroupID.value = typeof billingSettings?.groupID === "string" ? billingSettings.groupID : ""

        await prepareNextSourceDataset()
    } catch (error: any) {
        sourcePreparationError.value = error?.message || String( error )
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

        if( isSpectrumUpload.value ){
            uploadState.value = "progress"
            validationState.value = "progress"
            estimateState.value = "idle"

            const result = await projectlib.uploadBatch( files, billingSettings.groupID, uploadProgressCallbacks() )
            if( result instanceof Error ){
                throw result
            }
        } else {
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
                    const result = await projectlib.hyperspectrum( file, billingSettings.groupID, progress )

                    if( result instanceof Error ){
                        throw result
                    }
                } catch (error: any) {
                    setProgressError( error )
                    hasError = true
                    break
                }
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

const handleOirUpload = async ( event: Event ) => {

    if( isUploadLocked.value ){
        return
    }

    const files = ( event.target as HTMLInputElement ).files
    if( !files || !files.length ) return

    await startInspectableSourceUploadBatch( "oir", files )
}

const handleInspectableOmeZarrUpload = async ( event: Event ) => {

    if( isUploadLocked.value ){
        return
    }

    const files = ( event.target as HTMLInputElement ).files
    if( !files || !files.length ) return

    await startInspectableSourceUploadBatch( "ome-zarr", files )
}

const handleInspectableOmeTiffUpload = async ( event: Event ) => {

    if( isUploadLocked.value ){
        return
    }

    const files = ( event.target as HTMLInputElement ).files
    if( !files || !files.length ) return

    await startInspectableSourceUploadBatch( "ome-tiff", files )
}

const submitSourceAnalysis = async ( payload: { axisMapping: Record<string, string>, fixedIndices?: Record<string, number> } ) => {
    await submitCurrentSourceAnalysis( payload )
}

const cancelSourceAnalysis = async () => {

    sourceSubmissionError.value = ""

    if( sourcePreparedProject.value !== null ){
        try {
            await projectlib.remove( sourcePreparedProject.value.project )
        } catch (error) {
            console.log( error )
        }
    }

    resetProgressModalState()
    resetSourceAnalysisState()
    uploadLock.value = false
}
</script>
