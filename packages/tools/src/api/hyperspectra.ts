import { apiFetch, buildQueryString} from './http'

type ZBlendChannelPreset = {
    enabled: boolean
    requestedZ: number
    resolvedLayerIndex: number
    clampMin: number
    clampMax: number
}

type ZBlendPreset = {
    version: "zblend-v1"
    projectID: string
    dataType: "hypercars" | "hyperraman"
    channels: ZBlendChannelPreset[]
}

type SpectrumGridlinePreset = {
    version: "spectrum-gridlines-v1"
    projectID: string
    dataType: "hypercars" | "hyperraman"
    measurement: boolean
    estimate: boolean
}

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

var resolveDataType = ( dataType: string = "" ) => {

    const normalized = String( dataType ?? "" ).trim()
    if( normalized.length > 0 ){
        return normalized
    }

    return String((import.meta as any).env.VITE_DATA_TYPE ?? "" ).trim()
}

var resolveRoiDataType = ( dataType: string = "" ) => {

    const normalized = resolveDataType( dataType ).toLowerCase()
    if( normalized === "raman" || normalized === "hyperraman" ){
        return "hyperraman"
    }

    return "hypercars"
}

var resolveDataSource = ( dataSource: string = "" ) => {
    return String( dataSource ?? "" ).trim()
}

var resolveBoundingBox = ( boundingBox: any ) => {

    if( boundingBox === null || typeof boundingBox !== "object" ){
        return null
    }

    const minX = Number.parseInt( boundingBox.minX, 10 )
    const maxX = Number.parseInt( boundingBox.maxX, 10 )
    const minY = Number.parseInt( boundingBox.minY, 10 )
    const maxY = Number.parseInt( boundingBox.maxY, 10 )

    if(
        Number.isInteger( minX ) === false ||
        Number.isInteger( maxX ) === false ||
        Number.isInteger( minY ) === false ||
        Number.isInteger( maxY ) === false
    ){
        return null
    }

    if( maxX < minX || maxY < minY ){
        return null
    }

    return {
        minX,
        maxX,
        minY,
        maxY,
        width: maxX - minX + 1,
        height: maxY - minY + 1
    }
}

var resolveConfidenceLevels = ( confidenceLevels: Array<number | string> = [] ) => {

    if( Array.isArray( confidenceLevels ) === false || confidenceLevels.length === 0 ){
        return ""
    }

    const normalizedLevels = confidenceLevels
        .map(( value ) => Number.parseInt( String( value ), 10 ))
        .filter(( value ) => Number.isInteger( value ) && value > 0 && value <= 100 )

    if( normalizedLevels.length === 0 ){
        return ""
    }

    const uniqueLevels = Array.from( new Set( normalizedLevels ))
    uniqueLevels.sort(( left, right ) => left - right )

    return uniqueLevels.join( "," )
}

var parse = async ( project: any, tokenGroupID: string) => {

    var parameters = apiParameters( project )
    parameters.groupID = tokenGroupID

    const base = (import.meta as any).env.VITE_BASE_URL + "/hyperspectrum/parse"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<{ success: boolean }>( url )
}

var estimate = async (
    project: any,
    groupID: string = ""
) => {

	var parameters = apiParameters( project )
	parameters.groupID = groupID ?? ""

    const dataType = String((import.meta as any).env.VITE_DATA_TYPE ?? "" ).trim()
    if( dataType.toLowerCase() === "hypercars" ){
        parameters.dataType = dataType
    } else {
        delete parameters.dataType
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/hyperspectrum/estimate"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<any>( url )
}

var spectrum = async (
    project: any,
    x: number,
    y: number,
    groupID: string = "",
    dataType: string = "",
    dataSource: string = "",
    confidenceLevels: Array<number | string> = []
) => {

    const projectReference = resolveProjectReference( project )
    var parameters = apiParameters( project )
    parameters.projectID = projectReference.projectID
    if( projectReference.isShared || projectReference.projectKey.length > 0 ){
        parameters.projectKey = projectReference.projectKey
    }
    parameters.x = String( Math.round( Number( x )))
    parameters.y = String( Math.round( Number( y )))
    parameters.groupID = groupID ?? ""
    parameters.dataType = resolveDataType( dataType )
    const resolvedDataSource = resolveDataSource( dataSource )
    if( resolvedDataSource.length > 0 ){
        parameters.dataSource = resolvedDataSource
    }
    const resolvedConfidenceLevels = resolveConfidenceLevels( confidenceLevels )
    if( resolvedConfidenceLevels.length > 0 ){
        parameters.confidenceLevels = resolvedConfidenceLevels
    }

    const route = projectReference.isShared
        ? "/hyperspectrum/shared/spectrum"
        : "/hyperspectrum/spectrum"

    const base = (import.meta as any).env.VITE_BASE_URL + route
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<any>( url )
}

var meanSpectrum = async (
    project: any,
    boundingBox: {
        minX: number
        maxX: number
        minY: number
        maxY: number
        width?: number
        height?: number
    },
    groupID: string = "",
    strictBounds: boolean = false,
    dataType: string = "",
    dataSource: string = "",
    confidenceLevels: Array<number | string> = []
) => {

    var parameters: Record<string, string> = {}
    parameters.groupID = groupID ?? ""
    parameters.dataType = resolveDataType( dataType )
    const resolvedDataSource = resolveDataSource( dataSource )
    if( resolvedDataSource.length > 0 ){
        parameters.dataSource = resolvedDataSource
    }
    const resolvedConfidenceLevels = resolveConfidenceLevels( confidenceLevels )
    if( resolvedConfidenceLevels.length > 0 ){
        parameters.confidenceLevels = resolvedConfidenceLevels
    }
    const projectReference = resolveProjectReference( project )
    if( projectReference.isShared || projectReference.projectKey.length > 0 ){
        parameters.projectKey = projectReference.projectKey
    }

    const route = projectReference.isShared
        ? "/hyperspectrum/shared/mean-spectrum"
        : "/hyperspectrum/mean-spectrum"

    const base = (import.meta as any).env.VITE_BASE_URL + route
    const url = base + "?" + buildQueryString( parameters )

    const normalizedBoundingBox = resolveBoundingBox( boundingBox )
    if( normalizedBoundingBox === null ){
        throw new Error( "Mean spectrum boundingBox is required." )
    }

    const body: Record<string, any> = {
        projectID: projectReference.projectID,
        dataType: resolveDataType( dataType ),
        boundingBox: normalizedBoundingBox,
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

var status = async ( projectOrJobID: any ) => {

    const resolvedJobID = typeof projectOrJobID === "string"
        ? String( projectOrJobID ).trim()
        : String( projectOrJobID?.jobId ?? "" ).trim()

    if( resolvedJobID.length === 0 ){
        throw new Error( "Missing project.jobId for hyperspectrum status query" )
    }

    var parameters: Record<string, string> = {}
    parameters.jobId = resolvedJobID

    const base = (import.meta as any).env.VITE_BASE_URL + "/hyperspectrum/status"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<{ status: string }>( url )
}

var listRois = async (
    project: any,
    dataType: string = ""
) => {

    const projectReference = resolveProjectReference( project )
    if( projectReference.projectID.length === 0 ){
        throw new Error( "Missing projectID for ROI list request." )
    }

    var parameters: Record<string, string> = {}
    parameters.projectID = projectReference.projectID
    parameters.dataType = resolveRoiDataType( dataType )

    if( projectReference.isShared || projectReference.projectKey.length > 0 ){
        parameters.projectKey = projectReference.projectKey
    }

    const route = projectReference.isShared
        ? "/hyperspectrum/shared/roi"
        : "/hyperspectrum/roi"

    const base = (import.meta as any).env.VITE_BASE_URL + route
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<any>( url )
}

var createRoi = async (
    project: any,
    payload: {
        roiId?: string
        name: string
        description?: string
        shapeType?: "bounding-box"
        strictBounds?: boolean
        boundingBox: {
            minX: number
            maxX: number
            minY: number
            maxY: number
            width?: number
            height?: number
        }
    },
    groupID: string = "",
    confidenceLevels: Array<number | string> = []
) => {

    const projectReference = resolveProjectReference( project )
    if( projectReference.projectID.length === 0 ){
        throw new Error( "Missing projectID for ROI create request." )
    }
    const name = String( payload?.name ?? "" ).trim()
    if( name.length === 0 ){
        throw new Error( "ROI name is required." )
    }

    const boundingBox = resolveBoundingBox( payload?.boundingBox )
    if( boundingBox === null ){
        throw new Error( "ROI boundingBox is required." )
    }

    const body: Record<string, any> = {
        projectID: projectReference.projectID,
        name,
        description: String( payload?.description ?? "" ),
        shapeType: "bounding-box",
        strictBounds: payload?.strictBounds === true,
        boundingBox
    }

    const roiId = String( payload?.roiId ?? "" ).trim()
    if( roiId.length > 0 ){
        body.roiId = roiId
    }

    var parameters: Record<string, string> = {}
    parameters.dataType = resolveRoiDataType()

    if( projectReference.isShared || projectReference.projectKey.length > 0 ){
        parameters.projectKey = projectReference.projectKey
    } else {
        parameters.groupID = groupID ?? ""
    }

    const hasMultiplePixels = ( boundingBox.width * boundingBox.height ) > 1

    const resolvedConfidenceLevels = resolveConfidenceLevels( confidenceLevels )
    if( hasMultiplePixels && resolvedConfidenceLevels.length > 0 ){
        parameters.confidenceLevels = resolvedConfidenceLevels
    }

    const route = projectReference.isShared
        ? "/hyperspectrum/shared/roi"
        : "/hyperspectrum/roi"

    const base = (import.meta as any).env.VITE_BASE_URL + route
    const url = base + "?" + buildQueryString( parameters )

    await apiFetch<void>( url, {
        method: "POST",
        body: JSON.stringify( body )
    })
}

var deleteRoi = async ( project: any, roiId: string ) => {

    const projectReference = resolveProjectReference( project )
    if( projectReference.projectID.length === 0 ){
        throw new Error( "Missing projectID for ROI delete request." )
    }
    const normalizedRoiId = String( roiId ?? "" ).trim()

    if( normalizedRoiId.length === 0 ){
        throw new Error( "ROI id is required." )
    }

    var parameters: Record<string, string> = {}
    parameters.projectID = projectReference.projectID
    parameters.roiId = normalizedRoiId
    parameters.dataType = resolveRoiDataType()
    if( projectReference.isShared || projectReference.projectKey.length > 0 ){
        parameters.projectKey = projectReference.projectKey
    }

    const route = projectReference.isShared
        ? "/hyperspectrum/shared/roi"
        : "/hyperspectrum/roi"

    const base = (import.meta as any).env.VITE_BASE_URL + route
    const url = base + "?" + buildQueryString( parameters )

    await apiFetch<void>( url, {
        method: "DELETE"
    })
}

var loadZBlendSettings = async (
    project: any,
    dataType: string = ""
) => {

    const projectReference = resolveProjectReference( project )
    if( projectReference.projectID.length === 0 ){
        throw new Error( "Missing projectID for z-blend settings request." )
    }

    const parameters: Record<string, string> = {
        projectID: projectReference.projectID,
        dataType: resolveRoiDataType( dataType )
    }

    if( projectReference.isShared || projectReference.projectKey.length > 0 ){
        parameters.projectKey = projectReference.projectKey
    }

    const route = projectReference.isShared
        ? "/hyperspectrum/shared/zblend/settings"
        : "/hyperspectrum/zblend/settings"

    const base = (import.meta as any).env.VITE_BASE_URL + route
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<ZBlendPreset>( url )
}

var saveZBlendSettings = async (
    project: any,
    preset: Partial<ZBlendPreset> = {},
    dataType: string = ""
) => {

    const projectReference = resolveProjectReference( project )
    if( projectReference.projectID.length === 0 ){
        throw new Error( "Missing projectID for z-blend settings save." )
    }

    const normalizedDataType = resolveRoiDataType( dataType )
    const normalizedChannels = Array.isArray( preset?.channels ) ? preset.channels : []

    const body: ZBlendPreset = {
        version: "zblend-v1",
        projectID: projectReference.projectID,
        dataType: normalizedDataType,
        channels: normalizedChannels.map(( channel ) => {
            return {
                enabled: channel?.enabled !== false,
                requestedZ: Number( channel?.requestedZ ?? 0 ),
                resolvedLayerIndex: Math.max( 0, Number.parseInt( channel?.resolvedLayerIndex ?? 0, 10 ) || 0 ),
                clampMin: Number( channel?.clampMin ?? 0 ),
                clampMax: Number( channel?.clampMax ?? 1 )
            }
        })
    }

    const parameters: Record<string, string> = {
        projectID: projectReference.projectID,
        dataType: normalizedDataType
    }

    if( projectReference.isShared || projectReference.projectKey.length > 0 ){
        parameters.projectKey = projectReference.projectKey
    }

    const route = projectReference.isShared
        ? "/hyperspectrum/shared/zblend/settings"
        : "/hyperspectrum/zblend/settings"

    const base = (import.meta as any).env.VITE_BASE_URL + route
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<any>( url, {
        method: "PUT",
        body: JSON.stringify( body )
    })
}

var loadSpectrumGridlineSettings = async (
    project: any,
    dataType: string = ""
) => {

    const projectReference = resolveProjectReference( project )
    if( projectReference.projectID.length === 0 ){
        throw new Error( "Missing projectID for spectrum gridline settings request." )
    }

    const normalizedDataType = resolveRoiDataType( dataType )
    const parameters: Record<string, string> = {
        projectID: projectReference.projectID,
        dataType: normalizedDataType
    }

    if( projectReference.isShared || projectReference.projectKey.length > 0 ){
        parameters.projectKey = projectReference.projectKey
    }

    const route = projectReference.isShared
        ? "/hyperspectrum/shared/spectrum-gridlines/settings"
        : "/hyperspectrum/spectrum-gridlines/settings"

    const base = (import.meta as any).env.VITE_BASE_URL + route
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<SpectrumGridlinePreset>( url )
}

var saveSpectrumGridlineSettings = async (
    project: any,
    preset: Partial<SpectrumGridlinePreset> = {},
    dataType: string = ""
) => {

    const projectReference = resolveProjectReference( project )
    if( projectReference.projectID.length === 0 ){
        throw new Error( "Missing projectID for spectrum gridline settings save." )
    }

    const normalizedDataType = resolveRoiDataType( dataType )
    const body: SpectrumGridlinePreset = {
        version: "spectrum-gridlines-v1",
        projectID: projectReference.projectID,
        dataType: normalizedDataType,
        measurement: preset?.measurement === true,
        estimate: preset?.estimate === true
    }

    const parameters: Record<string, string> = {
        projectID: projectReference.projectID,
        dataType: normalizedDataType
    }

    if( projectReference.isShared || projectReference.projectKey.length > 0 ){
        parameters.projectKey = projectReference.projectKey
    }

    const route = projectReference.isShared
        ? "/hyperspectrum/shared/spectrum-gridlines/settings"
        : "/hyperspectrum/spectrum-gridlines/settings"

    const base = (import.meta as any).env.VITE_BASE_URL + route
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<any>( url, {
        method: "PUT",
        body: JSON.stringify( body )
    })
}

export default {
    parse,
    estimate,
    spectrum,
    meanSpectrum,
    status,
    listRois,
    createRoi,
    deleteRoi,
    loadZBlendSettings,
    saveZBlendSettings,
    loadSpectrumGridlineSettings,
    saveSpectrumGridlineSettings
}
