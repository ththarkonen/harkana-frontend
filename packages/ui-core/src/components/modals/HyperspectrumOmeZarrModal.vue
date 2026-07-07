<template>
<Modal ref = "modal"
       :title = "modalTitle"
       :showClose = "false"
       panelClass = "max-w-3xl">
    <template #main>
        <div class = "space-y-4 pb-4">
            <p class = "text-sm leading-relaxed text-white/90">
                {{ modalDescription }}
            </p>

            <div class = "rounded-lg border border-gray-600 bg-gray-800/70 px-3 py-2 text-sm text-white">
                A successful hyperspectral upload analysis job costs {{ uploadAnalysisTokenCostText }}.
            </div>

            <div v-if = "datasetCount > 1" class = "rounded-lg border border-brand bg-white p-4">
                <p class = "text-xs font-semibold uppercase tracking-wide text-black">
                    Dataset progress
                </p>
                <div class = "mt-2 text-sm font-semibold text-black">
                    Dataset {{ datasetIteration }} / {{ datasetCount }}
                </div>
            </div>

            <div v-if = "preparing" class = "rounded-lg border border-brand bg-white p-4">
                <div class = "flex items-start gap-3">
                    <Spinner class = "mt-0.5 h-5 w-5 text-brand"></Spinner>
                    <div class = "min-w-0">
                        <p class = "text-sm font-semibold text-black">
                            Uploading
                        </p>
                        <p class = "mt-1 text-xs text-black/70">
                            File {{ currentIteration }} / {{ nFiles }} | {{ uploadPercentage }}
                        </p>
                        <p class = "mt-2 text-xs text-black/70">
                            {{ preparationStatusText }}
                        </p>
                    </div>
                </div>
            </div>

            <div v-else-if = "preparationError.length > 0" class = "rounded-lg border border-red-500/70 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {{ preparationError }}
            </div>

            <template v-else-if = "hasInspectResponse">
                <div class = "rounded-lg border border-brand bg-white p-4">
                    <p class = "text-xs font-semibold uppercase tracking-wide text-black">
                        Dataset
                    </p>
                    <div class = "mt-2 break-words text-base font-semibold text-black">
                        {{ sourceName }}
                    </div>
                    <div class = "mt-2 text-sm text-black/80">
                        Axis order: {{ dimensions.axisOrder || "Unavailable" }} | Shape: {{ dimensions.shapeText }}
                    </div>
                    <div class = "mt-2 text-sm text-black/80">
                        Detected axes: {{ axes.length }}
                    </div>
                </div>

                <div class = "grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div class = "rounded-lg border border-brand bg-white p-3">
                        <p class = "text-xs font-semibold uppercase tracking-wide text-black">
                            Detected dimensions
                        </p>
                        <div class = "mt-2 text-sm font-semibold text-black">
                            {{ dimensions.dimensionCount }}
                        </div>
                    </div>
                </div>

                <div v-if = "showReuseCheckbox" class = "rounded-lg border border-brand bg-white p-4">
                    <label class = "flex items-start gap-3">
                        <input type = "checkbox"
                               :checked = "reuseMatchingDimensions"
                               :disabled = "submitting"
                               class = "mt-1 h-4 w-4 rounded border border-brand accent-brand focus:ring-brand"
                               @change = "updateReuseMatchingDimensions"/>
                        <div class = "min-w-0">
                            <div class = "text-sm font-semibold text-black">
                                Reuse these axis settings for subsequent datasets with matching dimensions
                            </div>
                            <div class = "mt-1 text-xs text-black/70">
                                The same mapping is applied automatically only when the inspected dimensions match exactly.
                            </div>
                        </div>
                    </label>
                </div>

                <div v-if = "warnings.length > 0" class = "rounded-lg border border-amber-500/70 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    <div class = "mb-2 text-xs font-semibold uppercase tracking-wide text-amber-200">Warnings</div>
                    <ul class = "space-y-1">
                        <li v-for = "(warning, index) in warnings"
                            :key = "'warning-' + index">
                            {{ warning }}
                        </li>
                    </ul>
                </div>

                <div v-if = "requiresAxisMapping" class = "grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div v-for = "role in analysisRoles"
                         :key = "role.key"
                         class = "rounded-lg border border-brand bg-white p-4">
                        <label :for = "'ome-role-' + role.key"
                               class = "block text-xs font-semibold uppercase tracking-wide text-black">
                            {{ role.label }}
                        </label>
                        <select :id = "'ome-role-' + role.key"
                                v-model = "axisMapping[ role.key ]"
                                :disabled = "submitting"
                                class = "mt-2 w-full rounded-lg border border-brand bg-white px-3 py-2 text-sm text-black transition focus:outline-none focus:ring-2 focus:ring-brand">
                            <option value = "" class = "text-black">
                                {{ role.required ? "Select axis" : "Not used" }}
                            </option>
                            <option v-for = "axis in axes"
                                    :key = "'axis-option-' + role.key + '-' + axis.index"
                                    :value = "axis.name"
                                    :disabled = "isAxisUnavailable( role.key, axis.name )"
                                    class = "text-black">
                                {{ formatAxisOption( axis ) }}
                            </option>
                        </select>
                    </div>
                </div>

                <div v-else class = "rounded-lg border border-brand bg-white p-4 text-sm text-black/80">
                    This TIFF file can be analyzed without additional axis choices. Image pages are used as layers.
                </div>

                <div v-if = "requiresAxisMapping && fixedAxisInputs.length > 0" class = "space-y-3">
                    <div class = "text-xs font-semibold uppercase tracking-wide text-white/70">Fixed indices</div>
                    <div class = "grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div v-for = "axis in fixedAxisInputs"
                             :key = "'fixed-axis-' + axis.index"
                             class = "rounded-lg border border-brand bg-white p-4">
                            <label :for = "'fixed-index-' + axis.index"
                                   class = "block text-xs font-semibold uppercase tracking-wide text-black">
                                {{ axis.name }} index
                            </label>
                            <input :id = "'fixed-index-' + axis.index"
                                   v-model = "fixedIndices[ axis.name ]"
                                   :disabled = "submitting"
                                   type = "number"
                                   min = "0"
                                   :max = "Math.max( 0, axis.size - 1 )"
                                   step = "1"
                                   inputmode = "numeric"
                                   class = "mt-2 w-full rounded-lg border border-brand bg-white px-3 py-2 text-sm text-black transition focus:outline-none focus:ring-2 focus:ring-brand"/>
                            <div class = "mt-2 text-xs text-black/65">
                                {{ formatAxisMetadata( axis ) }} | Allowed range: 0-{{ Math.max( 0, axis.size - 1 ) }}
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if = "validationError.length > 0" class = "rounded-lg border border-red-500/70 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {{ validationError }}
                </div>

                <div v-if = "submissionError.length > 0" class = "rounded-lg border border-red-500/70 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {{ submissionError }}
                </div>
            </template>
        </div>
    </template>

    <template #footer>
        <template v-if = "preparing === false">
        <hr class = "h-0.5 mt-4 bg-gray border-0">
        <div class = "mb-4 mt-4 flex flex-col gap-3 sm:flex-row">
            <button @click = "cancel"
                    :disabled = "submitting"
                    class = "w-full rounded bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50">
                {{ hasInspectResponse ? "Cancel" : "Close" }}
            </button>
            <button v-if = "hasInspectResponse"
                    @click = "submitSelection"
                    :disabled = "submitting"
                    class = "flex w-full items-center justify-center gap-2 rounded bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">
                <Spinner v-if = "submitting" class = "h-4 w-4 text-white"></Spinner>
                <span>{{ submitting ? "Starting analysis..." : "Start analysis" }}</span>
            </button>
        </div>
        </template>
    </template>
</Modal>
</template>

<script setup lang = "ts">

import { computed, reactive, ref, watch } from "vue"

import Modal from "./Modal.vue"
import Spinner from "../general/Spinner.vue"
import {
    HYPERSPECTRUM_UPLOAD_ANALYSIS_TOKEN_COST,
    formatTokenCost
} from "../../constants/tokenCosts.js"

type InspectAxis = {
    index: number
    name: string
    type: string
    unit: string | null
    size: number
}

type InspectResponse = {
    source?: {
        name?: string
        format?: string
    }
    dimensions?: {
        axisOrder?: string
        shape?: number[]
        axes?: InspectAxis[]
        recommendedLayerAxis?: string | null
    }
    warnings?: string[]
}

const props = defineProps({
    sourceTypeLabel: { type: String, default: "Source" },
    preparing: { type: Boolean, default: false },
    preparationError: { type: String, default: "" },
    inspectResponse: { type: Object, default: null },
    submitting: { type: Boolean, default: false },
    submissionError: { type: String, default: "" },
    activeFileName: { type: String, default: "" },
    currentIteration: { type: Number, default: 0 },
    nFiles: { type: Number, default: 0 },
    datasetIteration: { type: Number, default: 1 },
    datasetCount: { type: Number, default: 1 },
    reuseMatchingDimensions: { type: Boolean, default: false },
    uploadPercentage: { type: String, default: "0%" },
    uploadState: { type: String, default: "idle" },
    validationState: { type: String, default: "idle" }
})

const emit = defineEmits([ "submit", "cancel", "update:reuseMatchingDimensions" ])

const modal = ref<any>( null )
const validationError = ref( "" )
const uploadAnalysisTokenCostText = formatTokenCost( HYPERSPECTRUM_UPLOAD_ANALYSIS_TOKEN_COST )

const axisMapping = reactive<Record<string, string>>({
    x: "",
    y: "",
    z: "",
    c: "",
    t: ""
})

const fixedIndices = reactive<Record<string, string>>({})

const analysisRoles = [
    { key: "x", label: "X axis", required: true },
    { key: "y", label: "Y axis", required: true },
    { key: "z", label: "Layer axis", required: false },
    { key: "c", label: "Channel axis", required: false },
    { key: "t", label: "Time axis", required: false }
]

const response = computed<InspectResponse | null>(() => {
    return props.inspectResponse as InspectResponse | null
})

const inspectedSourceFormat = computed(() => {
    return String( response.value?.source?.format ?? "" ).trim().toLowerCase()
})

const requiresAxisMapping = computed(() => {
    return inspectedSourceFormat.value !== "tiff"
})

const modalTitle = computed(() => {
    return String( props.sourceTypeLabel ?? "Source" ).trim() + ( requiresAxisMapping.value ? " axis mapping" : " analysis" )
})

const modalDescription = computed(() => {
    if( requiresAxisMapping.value === false ){
        return "Upload the " + String( props.sourceTypeLabel ?? "Source" ).trim() + " dataset, inspect the available dimensions, review any warnings, and start the analysis."
    }

    return "Upload the " + String( props.sourceTypeLabel ?? "Source" ).trim() + " dataset, inspect the available axes, and map them to the analysis dimensions used by the hyperspectral viewer."
})

const hasInspectResponse = computed(() => {
    return Array.isArray( response.value?.dimensions?.axes ) && response.value.dimensions.axes.length > 0
})

const showReuseCheckbox = computed(() => {
    return requiresAxisMapping.value && props.datasetCount > 1 && props.datasetIteration < props.datasetCount
})

const preparationStatusText = computed(() => {
    if( props.validationState === "progress" && props.uploadState === "success" ){
        return "Inspecting " + String( props.sourceTypeLabel ?? "Source" ).trim() + " axes."
    }

    if( props.validationState === "success" ){
        return String( props.sourceTypeLabel ?? "Source" ).trim() + " inspection completed."
    }

    return "Uploading " + String( props.sourceTypeLabel ?? "Source" ).trim() + " source."
})

const axes = computed<InspectAxis[]>(() => {
    return Array.isArray( response.value?.dimensions?.axes )
        ? response.value.dimensions.axes
        : []
})

const warnings = computed(() => {
    return Array.isArray( response.value?.warnings ) ? response.value.warnings : []
})

const sourceName = computed(() => {
    return String( response.value?.source?.name ?? "" ).trim()
})

const dimensions = computed(() => {
    const shape = Array.isArray( response.value?.dimensions?.shape )
        ? response.value.dimensions.shape
        : []
    const axisOrder = String( response.value?.dimensions?.axisOrder ?? "" ).trim()

    return {
        axisOrder,
        shapeText: shape.length > 0 ? shape.join( " × " ) : "Unavailable",
        dimensionCount: shape.length > 0 ? shape.length : axisOrder.length
    }
})

const selectedAxisNamesByRole = computed(() => {
    const mapping: Record<string, string> = {}

    for( const role of Object.keys( axisMapping ) ){
        mapping[ role ] = normalizeAxisName( axisMapping[ role ] )
    }

    return mapping
})

const assignedAxisNames = computed(() => {
    return new Set(
        Object.values( selectedAxisNamesByRole.value )
            .filter(( value ) => value.length > 0 )
    )
})

const fixedAxisInputs = computed(() => {
    return axes.value.filter(( axis ) => {
        return axis.size > 1 && assignedAxisNames.value.has( axis.name ) === false
    })
})

function resetState(){

    validationError.value = ""

    for( const role of Object.keys( axisMapping ) ){
        axisMapping[ role ] = ""
    }

    for( const key of Object.keys( fixedIndices ) ){
        delete fixedIndices[ key ]
    }
}

function normalizeAxisName( value: unknown ){
    return String( value ?? "" ).trim()
}

function axisSymbol( axis: InspectAxis ){

    const axisOrder = String( response.value?.dimensions?.axisOrder ?? "" )
    if( axis.index < 0 || axis.index >= axisOrder.length ){
        return ""
    }

    return String( axisOrder[ axis.index ] ?? "" ).toLowerCase()
}

function isAxisUnavailable( roleKey: string, axisName: string ){

    const normalizedAxisName = normalizeAxisName( axisName )
    if( normalizedAxisName.length === 0 ){
        return false
    }

    for( const [ otherRoleKey, selectedAxisName ] of Object.entries( selectedAxisNamesByRole.value ) ){
        if( otherRoleKey === roleKey ){
            continue
        }

        if( selectedAxisName === normalizedAxisName ){
            return true
        }
    }

    return false
}

function pickAxisForRole( role: string, used: Set<string> ){

    const lowerRole = role.toLowerCase()
    const lowerRecommendedLayerAxis = normalizeAxisName( response.value?.dimensions?.recommendedLayerAxis ).toLowerCase()
    const exactNameMatch = axes.value.find(( axis ) => {
        return used.has( axis.name ) === false && normalizeAxisName( axis.name ).toLowerCase() === lowerRole
    })
    if( exactNameMatch ) return exactNameMatch.name

    const symbolMatch = axes.value.find(( axis ) => {
        const symbol = axisSymbol( axis )
        return used.has( axis.name ) === false && (
            symbol === lowerRole ||
            ( lowerRole === "z" && symbol === "i" )
        )
    })
    if( symbolMatch ) return symbolMatch.name

    if( lowerRole === "z" && lowerRecommendedLayerAxis.length > 0 ){
        const recommendedMatch = axes.value.find(( axis ) => {
            return used.has( axis.name ) === false && normalizeAxisName( axis.name ).toLowerCase() === lowerRecommendedLayerAxis
        })
        if( recommendedMatch ) return recommendedMatch.name
    }

    if( lowerRole === "x" || lowerRole === "y" ){
        const spaceAxes = axes.value.filter(( axis ) => {
            return used.has( axis.name ) === false && normalizeAxisName( axis.type ).toLowerCase() === "space"
        })

        if( lowerRole === "x" && spaceAxes.length > 0 ){
            return spaceAxes[ spaceAxes.length - 1 ].name
        }

        if( lowerRole === "y" && spaceAxes.length > 0 ){
            return spaceAxes[0].name
        }
    }

    const typeAlias = lowerRole === "c"
        ? "channel"
        : ( lowerRole === "t" ? "time" : lowerRole )
    const typeMatch = axes.value.find(( axis ) => {
        return used.has( axis.name ) === false && normalizeAxisName( axis.type ).toLowerCase() === typeAlias
    })
    if( typeMatch ) return typeMatch.name

    return ""
}

function initializeFromInspectResponse(){

    resetState()

    const used = new Set<string>()
    for( const role of [ "x", "y", "z", "c", "t" ] ){
        const nextAxisName = pickAxisForRole( role, used )
        axisMapping[ role ] = nextAxisName
        if( nextAxisName.length > 0 ){
            used.add( nextAxisName )
        }
    }

    for( const axis of axes.value ){
        if( axis.size > 1 && used.has( axis.name ) === false ){
            fixedIndices[ axis.name ] = "0"
        }
    }
}

function synchronizeFixedIndices(){

    const allowedAxisNames = new Set( fixedAxisInputs.value.map(( axis ) => axis.name ))

    for( const axis of fixedAxisInputs.value ){
        if( normalizeAxisName( fixedIndices[ axis.name ]).length === 0 ){
            fixedIndices[ axis.name ] = "0"
        }
    }

    for( const axisName of Object.keys( fixedIndices ) ){
        if( allowedAxisNames.has( axisName ) === false ){
            delete fixedIndices[ axisName ]
        }
    }
}

function formatAxisMetadata( axis: InspectAxis ){

    const type = normalizeAxisName( axis.type ) || "unknown"
    const unit = normalizeAxisName( axis.unit )
    const unitText = unit.length > 0 ? unit : "no unit"

    return type + " | size " + String( axis.size ) + " | " + unitText
}

function formatAxisOption( axis: InspectAxis ){
    return axis.name + " (" + formatAxisMetadata( axis ) + ")"
}

function validateSelection(){

    validationError.value = ""

    if( requiresAxisMapping.value === false ){
        return {}
    }

    const requiredRoles = [ "x", "y" ]
    for( const role of requiredRoles ){
        if( normalizeAxisName( axisMapping[ role ]).length === 0 ){
            validationError.value = "X and Y axes are required."
            return null
        }
    }

    const selectedAxisNames = Object.values( selectedAxisNamesByRole.value ).filter(( value ) => value.length > 0 )
    const uniqueNames = new Set( selectedAxisNames )
    if( uniqueNames.size !== selectedAxisNames.length ){
        validationError.value = "Each source axis can only be assigned once."
        return null
    }

    const payloadFixedIndices: Record<string, number> = {}
    for( const axis of fixedAxisInputs.value ){
        const rawValue = String( fixedIndices[ axis.name ] ?? "" ).trim()
        const numericValue = Number.parseInt( rawValue, 10 )
        if( Number.isInteger( numericValue ) === false || numericValue < 0 || numericValue >= axis.size ){
            validationError.value = "Fixed indices must be integers within the available axis bounds."
            return null
        }
        payloadFixedIndices[ axis.name ] = numericValue
    }

    const payloadAxisMapping: Record<string, string> = {
        x: normalizeAxisName( axisMapping.x ),
        y: normalizeAxisName( axisMapping.y )
    }

    for( const role of [ "z", "c", "t" ] ){
        const axisName = normalizeAxisName( axisMapping[ role ] )
        if( axisName.length > 0 ){
            payloadAxisMapping[ role ] = axisName
        }
    }

    return {
        axisMapping: payloadAxisMapping,
        fixedIndices: payloadFixedIndices
    }
}

function submitSelection(){

    if( props.submitting ){
        return
    }

    const payload = validateSelection()
    if( payload === null ){
        return
    }

    emit( "submit", payload )
}

function updateReuseMatchingDimensions( event: Event ){
    const target = event.target as HTMLInputElement | null
    emit( "update:reuseMatchingDimensions", target?.checked === true )
}

function cancel(){

    if( props.submitting ){
        return
    }

    emit( "cancel" )
    close()
}

function open(){
    validationError.value = ""
    modal.value?.open()
}

function close(){
    modal.value?.close()
}

watch( () => props.inspectResponse, () => {
    if( hasInspectResponse.value ){
        initializeFromInspectResponse()
        return
    }

    resetState()
}, { immediate: true })

watch( fixedAxisInputs, () => {
    synchronizeFixedIndices()
}, { immediate: true, deep: true })

defineExpose({
    open,
    close
})
</script>
