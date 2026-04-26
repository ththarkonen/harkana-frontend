import { apiFetch, buildQueryString} from './http'

export type SingleSpectrumDataType = "cars" | "raman"

export type SingleSpectrumEstimateItem = {
    index: number
    projectID: string
    dataType: SingleSpectrumDataType
    status: "PENDING" | "STARTED" | "SUCCEEDED" | "FAILED"
    dataS3Uri: string
    outputEstimateS3Uri: string
    tokenChargeAmount: number
    tokenRefunded: boolean
    tokenRefundedAt?: string
    tokenRefundTarget?: "personal" | "group"
    submittedAt?: string
    startedAt?: string
    finishedAt?: string
    updatedAt?: string
    errorCode?: string
    errorMessage?: string
}

export type SingleSpectrumEstimateJobStart = {
    jobId: string
    taskArn: string
    status: "STARTED"
    submittedAt: string
    jobType: "SINGLE_SPECTRUM_ESTIMATE_BATCH"
    dataType: SingleSpectrumDataType
    itemCount: number
    completedCount: number
    failedCount: number
    refundedCount: number
    items: SingleSpectrumEstimateItem[]
}

export type SingleSpectrumEstimateJobStatus = {
    jobId: string
    status: "SUBMITTED" | "STARTED" | "SUCCEEDED" | "PARTIAL_SUCCEEDED" | "FAILED"
    jobType: "SINGLE_SPECTRUM_ESTIMATE_BATCH"
    dataType: SingleSpectrumDataType
    submittedAt: string
    updatedAt: string
    startedAt?: string
    finishedAt?: string
    taskArn?: string
    taskCluster?: string
    taskContainerName?: string
    itemCount: number
    completedCount: number
    failedCount: number
    refundedCount: number
    tokenChargeDebited?: boolean
    tokenChargeAmount?: number
    tokenChargeRefunded?: boolean
    tokenChargeRefundedAmount?: number
    errorCode?: string
    errorMessage?: string
    items: SingleSpectrumEstimateItem[]
}

var apiParameters = ( project: any ) => {

    var parameters: Record<string, string> = {}

    parameters.projectID = project.id
    parameters.dataType = (import.meta as any).env.VITE_DATA_TYPE === "raman" ? "raman" : "cars"

    return parameters
}


var estimate = async (
    project: any,
    tokenGroupID: string = "",
    jobId: string = ""
) => {

    var parameters = apiParameters( project )
    parameters.groupID = tokenGroupID ?? ""
    if( String( jobId ?? "" ).trim().length > 0 ){
        parameters.jobId = String( jobId ).trim()
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/data/estimate"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<SingleSpectrumEstimateJobStart>( url )
}


var estimateBatch = async (
    projects: any[],
    dataType: SingleSpectrumDataType,
    tokenGroupID: string = "",
    jobId: string = ""
) => {

    var parameters: Record<string, string> = {
        groupID: tokenGroupID ?? ""
    }

    if( String( jobId ?? "" ).trim().length > 0 ){
        parameters.jobId = String( jobId ).trim()
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/data/estimate/jobs"
    const url = base + "?" + buildQueryString( parameters )
    const body = {
        version: "single-spectrum-estimate-batch-v1",
        dataType,
        projects: projects.map(( project ) => ({
            projectID: String( project?.id ?? project?.projectID ?? "" )
        }))
    }

    return await apiFetch<SingleSpectrumEstimateJobStart>( url, {
        method: "POST",
        body: JSON.stringify( body )
    })
}


var estimateJobStatus = async ( jobId: string ) => {

    const normalizedJobId = String( jobId ?? "" ).trim()
    if( normalizedJobId.length === 0 ){
        throw new Error( "Estimate job id is required." )
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/data/estimate/jobs/status"
    const url = base + "?" + buildQueryString({ jobId: normalizedJobId })

    return await apiFetch<SingleSpectrumEstimateJobStatus>( url )
}


var validate = async ( project: any ) => {

    var parameters = apiParameters( project )

    const base = (import.meta as any).env.VITE_BASE_URL + "/data/validate"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<{ success: boolean }>( url )
}


export default { estimate, estimateBatch, estimateJobStatus, validate}
