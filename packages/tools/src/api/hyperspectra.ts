import { apiFetch, buildQueryString} from './http'

var resolveProjectReference = ( project: any ) => {

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

var requireOwnedProjectReference = ( project: any ) => {

    const projectReference = resolveProjectReference( project )
    if( projectReference.isShared ){
        throw new Error( "ROI creation and deletion are only available for owned projects." )
    }

    return projectReference
}

var apiParameters = ( project: any ) => {

    var parameters: Record<string, string> = {}
    const projectReference = resolveProjectReference( project )

    parameters.projectID = projectReference.projectID
    if( projectReference.isShared || projectReference.projectKey.length > 0 ){
        parameters.projectKey = projectReference.projectKey
    }
    parameters.dataType = (import.meta as any).env.VITE_DATA_TYPE

    return parameters
}

var parse = async ( project: any, tokenGroupID: string) => {

    var parameters = apiParameters( project )
    parameters.groupID = tokenGroupID

    const base = (import.meta as any).env.VITE_BASE_URL + "/hyperspectrum/parse"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<{ success: boolean }>( url )
}

var spectrum = async ( project: any, x: number, y: number, groupID: string = "" ) => {

    const projectReference = resolveProjectReference( project )
    var parameters = apiParameters( project )
    parameters.x = String( Math.round( Number( x )))
    parameters.y = String( Math.round( Number( y )))
    parameters.groupID = groupID ?? ""

    const route = projectReference.isShared
        ? "/hyperspectrum/shared/spectrum"
        : "/hyperspectrum/spectrum"

    const base = (import.meta as any).env.VITE_BASE_URL + route
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<any>( url )
}

var meanSpectrum = async (
    project: any,
    points: Array<[number, number] | { x: number, y: number }>,
    groupID: string = "",
    deduplicate: boolean = true,
    strictBounds: boolean = false,
    lowerPercentage: number = 2.5,
    upperPercentage: number = 97.5
) => {

    var parameters: Record<string, string> = {}
    parameters.groupID = groupID ?? ""
    parameters.lowerPercentage = String( Number.isFinite( Number( lowerPercentage )) ? Number( lowerPercentage ) : 2.5 )
    parameters.upperPercentage = String( Number.isFinite( Number( upperPercentage )) ? Number( upperPercentage ) : 97.5 )
    const projectReference = resolveProjectReference( project )
    if( projectReference.isShared || projectReference.projectKey.length > 0 ){
        parameters.projectKey = projectReference.projectKey
    }

    const route = projectReference.isShared
        ? "/hyperspectrum/shared/mean-spectrum"
        : "/hyperspectrum/mean-spectrum"

    const base = (import.meta as any).env.VITE_BASE_URL + route
    const url = base + "?" + buildQueryString( parameters )

    const body: Record<string, any> = {
        projectID: projectReference.projectID,
        dataType: (import.meta as any).env.VITE_DATA_TYPE,
        points,
        deduplicate,
        strictBounds
    }
    if( projectReference.isShared || projectReference.projectKey.length > 0 ){
        body.projectKey = projectReference.projectKey
    }

    return await apiFetch<any>( url, {
        method: "POST",
        body: JSON.stringify( body )
    })
}

var status = async ( project: any ) => {

    const jobId = String( project?.jobId ?? "" ).trim()
    if( jobId.length === 0 ){
        throw new Error( "Missing project.jobId for hyperspectrum status query" )
    }

    var parameters: Record<string, string> = {}
    parameters.jobId = jobId

    const base = (import.meta as any).env.VITE_BASE_URL + "/hyperspectrum/status"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<{ status: string }>( url )
}

var createRoi = async (
    project: any,
    payload: {
        roiId?: string
        name: string
        description?: string
        shapeType?: "pixel-list"
        deduplicate?: boolean
        strictBounds?: boolean
        points: Array<[number, number] | { x: number, y: number }>
    },
    groupID: string = "",
    lowerPercentage?: number,
    upperPercentage?: number
) => {

    const projectReference = requireOwnedProjectReference( project )
    const name = String( payload?.name ?? "" ).trim()
    if( name.length === 0 ){
        throw new Error( "ROI name is required." )
    }

    const points = Array.isArray( payload?.points ) ? payload.points : []
    if( points.length === 0 ){
        throw new Error( "ROI points are required." )
    }

    const body: Record<string, any> = {
        projectID: projectReference.projectID,
        dataType: (import.meta as any).env.VITE_DATA_TYPE,
        name,
        description: String( payload?.description ?? "" ),
        shapeType: "pixel-list",
        deduplicate: payload?.deduplicate !== false,
        strictBounds: payload?.strictBounds === true,
        points
    }

    const roiId = String( payload?.roiId ?? "" ).trim()
    if( roiId.length > 0 ){
        body.roiId = roiId
    }

    var parameters: Record<string, string> = {}
    parameters.groupID = groupID ?? ""

    const hasMultiplePoints = points.length > 1
    const normalizedLowerPercentage = Number( lowerPercentage )
    const normalizedUpperPercentage = Number( upperPercentage )

    if( hasMultiplePoints && Number.isFinite( normalizedLowerPercentage ) ){
        parameters.lowerPercentage = String( normalizedLowerPercentage )
    }

    if( hasMultiplePoints && Number.isFinite( normalizedUpperPercentage ) ){
        parameters.upperPercentage = String( normalizedUpperPercentage )
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/hyperspectrum/roi"
    const url = base + "?" + buildQueryString( parameters )

    await apiFetch<void>( url, {
        method: "POST",
        body: JSON.stringify( body )
    })
}

var deleteRoi = async ( project: any, roiId: string, groupID: string = "" ) => {

    const projectReference = requireOwnedProjectReference( project )
    const normalizedRoiId = String( roiId ?? "" ).trim()

    if( normalizedRoiId.length === 0 ){
        throw new Error( "ROI id is required." )
    }

    var parameters: Record<string, string> = {}
    parameters.projectID = projectReference.projectID
    parameters.roiId = normalizedRoiId
    parameters.dataType = (import.meta as any).env.VITE_DATA_TYPE
    parameters.groupID = groupID ?? ""

    const base = (import.meta as any).env.VITE_BASE_URL + "/hyperspectrum/roi"
    const url = base + "?" + buildQueryString( parameters )

    await apiFetch<void>( url, {
        method: "DELETE"
    })
}

export default { parse, spectrum, meanSpectrum, status, createRoi, deleteRoi }
