import { apiFetch, buildQueryString} from './http'

export type SingleSpectrumDataType = "cars" | "raman"
export type HyperspectrumCalibrationDataType = "hypercars" | "hyperraman"
export type CalibrationDataType = SingleSpectrumDataType | HyperspectrumCalibrationDataType
export type CalibrationAxisRole = "spectrum-x" | "hyperspectral-spectral"
export type CalibrationProfileScope = "owned" | "shared"

export type CalibrationPoint = {
    id: string
    sourceX: number
    targetX: number
}

export type CalibrationProfile = {
    version: "calibration-profile-v1" | "calibration-profile-v2"
    profileID: string
    ownerSub: string
    sourceProjectID: string
    dataType: CalibrationDataType
    profileKind?: "axis-calibration"
    axisRole?: CalibrationAxisRole
    friendlyName: string
    description?: string
    polynomialOrder: number
    includedOrders: number[]
    points: CalibrationPoint[]
    model?: CalibrationProfileModel
    shared?: boolean
    ownerDisplayName?: string
    ownerEmail?: string
    sharedAt?: string
    createdAt: string
    updatedAt: string
}

export type CalibrationProfileSummary = {
    profileID: string
    ownerSub: string
    sourceProjectID: string
    dataType: CalibrationDataType
    profileKind?: "axis-calibration"
    axisRole?: CalibrationAxisRole
    friendlyName: string
    description?: string
    polynomialOrder: number
    includedOrders: number[]
    pointCount: number
    assignedProjectCount: number
    collaboratorCount?: number
    shared?: boolean
    ownerDisplayName?: string
    ownerEmail?: string
    sharedAt?: string
    createdAt: string
    updatedAt: string
}

export type CalibrationProfileListResponse = {
    items: CalibrationProfileSummary[]
    nextToken: string | null
}

export type ProjectCalibrationAssignment = {
    version: "project-calibration-assignment-v1"
    projectID: string
    dataType: CalibrationDataType
    profileID: string | null
    profile: CalibrationProfile | null
}

export type CalibrationProfileWriteRequest = {
    version: "calibration-profile-write-v1" | "calibration-profile-write-v2"
    profileKind?: "axis-calibration"
    axisRole?: CalibrationAxisRole
    sourceProjectID: string
    dataType?: CalibrationDataType
    friendlyName: string
    description?: string
    polynomialOrder: number
    includedOrders: number[]
    points: CalibrationPoint[]
    model?: CalibrationProfileModel
}

export type CalibrationProfileModel = {
    type: "polynomial"
    polynomialOrder: number
    includedOrders: number[]
    points: CalibrationPoint[]
}

export type SetProjectCalibrationAssignmentRequest = {
    version: "project-calibration-assignment-write-v1"
    profileID: string | null
}

type CalibrationProfileListOptions = {
    dataType?: CalibrationDataType | string
    axisRole?: CalibrationAxisRole | string
    scope?: CalibrationProfileScope | string
    limit?: number
    nextToken?: string | null
    sourceProjectID?: string
    search?: string
}

export type CalibrationProfileCollaborator = {
    sub: string
    email: string
    given_name?: string
    family_name?: string
}

type DataProjectReference = {
    projectID: string
    projectKey: string
    isShared: boolean
}

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

var resolveProjectReference = ( project: any ): DataProjectReference => {

    const shareInfo = project?.shareInfo ?? {}
    const shareInfoProjectID = String( shareInfo?.projectId ?? "" ).trim()
    const shareInfoProjectKey = String( shareInfo?.projectKey ?? "" ).trim()
    const hasExplicitShareInfo = shareInfoProjectID.length > 0 && shareInfoProjectKey.length > 0
    const isShared = project?.shared === true || hasExplicitShareInfo

    if( isShared ){
        const sharedProjectID = String( shareInfoProjectID || project?.rawid || project?.id || "" ).trim()
        const sharedProjectKey = String( shareInfoProjectKey || project?.id || "" ).trim()

        return {
            projectID: sharedProjectID,
            projectKey: sharedProjectKey,
            isShared: true
        }
    }

    return {
        projectID: String( project?.id ?? "" ).trim(),
        projectKey: "",
        isShared: false
    }
}

var resolveDataType = ( dataType: CalibrationDataType | string = "" ) => {

    const normalized = String( dataType ?? "" ).trim()
    if( normalized.length > 0 ){
        return normalized
    }

    return String((import.meta as any).env.VITE_DATA_TYPE ?? "" ).trim()
}

var apiParameters = ( project: any ) => {

    var parameters: Record<string, string> = {}

    parameters.projectID = String( project?.id ?? "" ).trim()
    parameters.dataType = resolveDataType()

    return parameters
}

var calibrationParameters = ( dataType: CalibrationDataType | string = "" ): Record<string, string> => {

    const resolvedDataType = resolveDataType( dataType )
    if( resolvedDataType.length === 0 ){
        throw new Error( "Missing dataType for calibration request." )
    }

    return {
        dataType: resolvedDataType
    }
}

var normalizeAxisRole = ( axisRole: CalibrationAxisRole | string = "" ) => {

    const normalized = String( axisRole ?? "" ).trim()
    if( normalized.length === 0 ){
        return ""
    }

    if( normalized === "spectrum-x" || normalized === "hyperspectral-spectral" ){
        return normalized
    }

    throw new Error( "Unsupported calibration axisRole: " + normalized )
}

var normalizeProfileScope = ( scope: CalibrationProfileScope | string = "" ) => {

    const normalized = String( scope ?? "" ).trim()
    if( normalized.length === 0 ){
        return ""
    }

    if( normalized === "owned" || normalized === "shared" ){
        return normalized
    }

    throw new Error( "Unsupported calibration profile scope: " + normalized )
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

var listCalibrationProfiles = async ( options: CalibrationProfileListOptions = {} ) => {

    const parameters = calibrationParameters( options.dataType )

    const axisRole = normalizeAxisRole( options.axisRole )
    if( axisRole.length > 0 ){
        parameters.axisRole = axisRole
    }

    const scope = normalizeProfileScope( options.scope )
    if( scope.length > 0 ){
        parameters.scope = scope
    }

    const requestedLimit = Number.parseInt( String( options?.limit ?? 100 ), 10 )
    const normalizedLimit = Number.isFinite( requestedLimit )
        ? Math.min( 500, Math.max( 1, requestedLimit ))
        : 100
    parameters.limit = String( normalizedLimit )

    const nextToken = String( options?.nextToken ?? "" ).trim()
    if( nextToken.length > 0 ){
        parameters.nextToken = nextToken
    }

    const sourceProjectID = String( options?.sourceProjectID ?? "" ).trim()
    if( sourceProjectID.length > 0 ){
        parameters.sourceProjectID = sourceProjectID
    }

    const search = String( options?.search ?? "" ).trim()
    if( search.length > 0 ){
        parameters.search = search
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/data/calibration/profiles"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<CalibrationProfileListResponse>( url )
}

var getCalibrationProfile = async (
    profileID: string,
    dataType: CalibrationDataType | string = "",
    axisRole: CalibrationAxisRole | string = ""
) => {

    const normalizedProfileID = String( profileID ?? "" ).trim()
    if( normalizedProfileID.length === 0 ){
        throw new Error( "Calibration profile id is required." )
    }

    const parameters = calibrationParameters( dataType )
    parameters.profileID = normalizedProfileID
    const normalizedAxisRole = normalizeAxisRole( axisRole )
    if( normalizedAxisRole.length > 0 ){
        parameters.axisRole = normalizedAxisRole
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/data/calibration/profile"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<CalibrationProfile>( url )
}

var createCalibrationProfile = async (
    payload: CalibrationProfileWriteRequest,
    dataType: CalibrationDataType | string = "",
    axisRole: CalibrationAxisRole | string = ""
) => {

    const parameters = calibrationParameters( dataType )
    const normalizedAxisRole = normalizeAxisRole( axisRole )
    if( normalizedAxisRole.length > 0 ){
        parameters.axisRole = normalizedAxisRole
    }
    const base = (import.meta as any).env.VITE_BASE_URL + "/data/calibration/profile"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<CalibrationProfile>( url, {
        method: "POST",
        body: JSON.stringify( payload )
    })
}

var updateCalibrationProfile = async (
    profileID: string,
    payload: CalibrationProfileWriteRequest,
    dataType: CalibrationDataType | string = "",
    axisRole: CalibrationAxisRole | string = ""
) => {

    const normalizedProfileID = String( profileID ?? "" ).trim()
    if( normalizedProfileID.length === 0 ){
        throw new Error( "Calibration profile id is required." )
    }

    const parameters = calibrationParameters( dataType )
    parameters.profileID = normalizedProfileID
    const normalizedAxisRole = normalizeAxisRole( axisRole )
    if( normalizedAxisRole.length > 0 ){
        parameters.axisRole = normalizedAxisRole
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/data/calibration/profile"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<CalibrationProfile>( url, {
        method: "PUT",
        body: JSON.stringify( payload )
    })
}

var deleteCalibrationProfile = async (
    profileID: string,
    dataType: CalibrationDataType | string = "",
    axisRole: CalibrationAxisRole | string = ""
) => {

    const normalizedProfileID = String( profileID ?? "" ).trim()
    if( normalizedProfileID.length === 0 ){
        throw new Error( "Calibration profile id is required." )
    }

    const parameters = calibrationParameters( dataType )
    parameters.profileID = normalizedProfileID
    const normalizedAxisRole = normalizeAxisRole( axisRole )
    if( normalizedAxisRole.length > 0 ){
        parameters.axisRole = normalizedAxisRole
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/data/calibration/profile"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<Record<string, never>>( url, {
        method: "DELETE"
    })
}

var listCalibrationProfileCollaborators = async (
    profileID: string,
    dataType: CalibrationDataType | string = "",
    axisRole: CalibrationAxisRole | string = ""
) => {

    const normalizedProfileID = String( profileID ?? "" ).trim()
    if( normalizedProfileID.length === 0 ){
        throw new Error( "Calibration profile id is required." )
    }

    const parameters = calibrationParameters( dataType )
    parameters.profileID = normalizedProfileID
    const normalizedAxisRole = normalizeAxisRole( axisRole )
    if( normalizedAxisRole.length > 0 ){
        parameters.axisRole = normalizedAxisRole
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/data/calibration/profile/collaborators"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<CalibrationProfileCollaborator[]>( url )
}

var addCalibrationProfileCollaborator = async (
    profileID: string,
    email: string,
    dataType: CalibrationDataType | string = "",
    axisRole: CalibrationAxisRole | string = ""
) => {

    const normalizedProfileID = String( profileID ?? "" ).trim()
    const normalizedEmail = String( email ?? "" ).trim()
    if( normalizedProfileID.length === 0 ){
        throw new Error( "Calibration profile id is required." )
    }
    if( normalizedEmail.length === 0 ){
        throw new Error( "Collaborator email is required." )
    }

    const parameters = calibrationParameters( dataType )
    parameters.profileID = normalizedProfileID
    const normalizedAxisRole = normalizeAxisRole( axisRole )
    if( normalizedAxisRole.length > 0 ){
        parameters.axisRole = normalizedAxisRole
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/data/calibration/profile/collaborator"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<{ success?: boolean }>( url, {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail })
    })
}

var removeCalibrationProfileCollaborator = async (
    profileID: string,
    collaboratorID: string,
    dataType: CalibrationDataType | string = "",
    axisRole: CalibrationAxisRole | string = ""
) => {

    const normalizedProfileID = String( profileID ?? "" ).trim()
    const normalizedCollaboratorID = String( collaboratorID ?? "" ).trim()
    if( normalizedProfileID.length === 0 ){
        throw new Error( "Calibration profile id is required." )
    }
    if( normalizedCollaboratorID.length === 0 ){
        throw new Error( "Collaborator id is required." )
    }

    const parameters = calibrationParameters( dataType )
    parameters.profileID = normalizedProfileID
    parameters.collaboratorID = normalizedCollaboratorID
    const normalizedAxisRole = normalizeAxisRole( axisRole )
    if( normalizedAxisRole.length > 0 ){
        parameters.axisRole = normalizedAxisRole
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/data/calibration/profile/collaborator"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<{ success?: boolean }>( url, {
        method: "DELETE"
    })
}

var getProjectCalibration = async (
    project: any,
    dataType: CalibrationDataType | string = "",
    axisRole: CalibrationAxisRole | string = ""
) => {

    const projectReference = resolveProjectReference( project )
    if( projectReference.projectID.length === 0 ){
        throw new Error( "Missing projectID for project calibration request." )
    }

    const parameters = calibrationParameters( dataType )
    parameters.projectID = projectReference.projectID
    const normalizedAxisRole = normalizeAxisRole( axisRole )
    if( normalizedAxisRole.length > 0 ){
        parameters.axisRole = normalizedAxisRole
    }

    const route = projectReference.isShared || projectReference.projectKey.length > 0
        ? "/data/shared/calibration/project"
        : "/data/calibration/project"

    if( projectReference.isShared || projectReference.projectKey.length > 0 ){
        parameters.projectKey = projectReference.projectKey
    }

    const base = (import.meta as any).env.VITE_BASE_URL + route
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<ProjectCalibrationAssignment>( url )
}

var setProjectCalibration = async (
    project: any,
    profileID: string | null,
    dataType: CalibrationDataType | string = "",
    axisRole: CalibrationAxisRole | string = ""
) => {

    const projectReference = resolveProjectReference( project )
    if( projectReference.isShared || projectReference.projectKey.length > 0 ){
        throw new Error( "Project calibration assignment is not available for shared projects." )
    }

    if( projectReference.projectID.length === 0 ){
        throw new Error( "Missing projectID for project calibration save." )
    }

    const parameters = calibrationParameters( dataType )
    parameters.projectID = projectReference.projectID
    const normalizedAxisRole = normalizeAxisRole( axisRole )
    if( normalizedAxisRole.length > 0 ){
        parameters.axisRole = normalizedAxisRole
    }

    const body: SetProjectCalibrationAssignmentRequest = {
        version: "project-calibration-assignment-write-v1",
        profileID: profileID === null ? null : String( profileID ?? "" ).trim()
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/data/calibration/project"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<ProjectCalibrationAssignment>( url, {
        method: "PUT",
        body: JSON.stringify( body )
    })
}

export default {
    estimate,
    estimateBatch,
    estimateJobStatus,
    validate,
    listCalibrationProfiles,
    getCalibrationProfile,
    createCalibrationProfile,
    updateCalibrationProfile,
    deleteCalibrationProfile,
    listCalibrationProfileCollaborators,
    addCalibrationProfileCollaborator,
    removeCalibrationProfileCollaborator,
    getProjectCalibration,
    setProjectCalibration
}
