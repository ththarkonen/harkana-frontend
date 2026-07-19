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

type InspectAxis = {
    index: number
    name: string
    type: string
    unit: string | null
    size: number
}

type InspectLayerAxisOption = {
    index: number
    name: string
    type: string
    unit: string | null
    size: number
}

type HyperspectrumSourceFormat = "oir" | "ome-zarr" | "ome-tiff" | "tiff" | "igor"

type InspectSource = {
    format: HyperspectrumSourceFormat
    kind: "s3-object" | "s3-prefix"
    s3Uri: string
    bucket: string
    key: string
    name: string
    extension: string
}

type InspectDimensions = {
    axisOrder: string
    shape: number[]
    shapeByAxis: Record<string, number>
    axes: InspectAxis[]
    analysisRoles: Record<string, unknown>
    layerAxisOptions: InspectLayerAxisOption[]
    recommendedLayerAxis: string | null
}

type OirInspectResponse = {
    version: "hyperspectrum-source-inspect-v1"
    projectID: string
    dataType: "hypercars" | "hyperraman"
    source: InspectSource & {
        format: "oir"
        kind: "s3-object"
    }
    dimensions: InspectDimensions
    metadata: {
        sourceAxisOrder: string | null
        sourceShape: number[]
        normalizedAxisOrder: "TCZYX"
        dtype: string
        estimatedNbytes: number
        sceneCount: number
        currentScene: string | null
        channelLabels: string[]
        physicalSizeX: number | null
        physicalSizeY: number | null
        physicalSizeZ: number | null
        physicalSizeXUnit: string | null
        physicalSizeYUnit: string | null
        physicalSizeZUnit: string | null
    }
    warnings: string[]
}

type OmeZarrInspectResponse = {
    version: "hyperspectrum-source-inspect-v1"
    projectID: string
    dataType: "hypercars" | "hyperraman"
    source: InspectSource & {
        format: "ome-zarr"
        kind: "s3-prefix"
        extension: "zarr"
    }
    dimensions: InspectDimensions
    metadata: {
        omeZarrVersion: string | null
        zarrFormat: number | null
        datasetPath: string
        multiscalesCount: number
        rootMetadataPath: string
        datasetMetadataPath: string
    }
    warnings: string[]
}

type OmeTiffInspectResponse = {
    version: "hyperspectrum-source-inspect-v1"
    projectID: string
    dataType: "hypercars" | "hyperraman"
    source: InspectSource & {
        format: "ome-tiff"
        kind: "s3-object"
        extension: "tif" | "tiff"
    }
    dimensions: InspectDimensions
    metadata: {
        omeSchema: string | null
        dimensionOrder: string
        seriesIndex: 0
        imageDescriptionTag: 270
        imageDescriptionOffset: number
        physicalSizeX: number | null
        physicalSizeY: number | null
        physicalSizeZ: number | null
        physicalSizeXUnit: string | null
        physicalSizeYUnit: string | null
        physicalSizeZUnit: string | null
        channelLabels: string[]
    }
    warnings: string[]
}

type TiffInspectResponse = {
    version: "hyperspectrum-source-inspect-v1"
    projectID: string
    dataType: "hypercars" | "hyperraman"
    source: InspectSource & {
        format: "tiff"
        kind: "s3-object"
        extension: "tif" | "tiff"
    }
    dimensions: {
        axisOrder: "tczyx"
        shape: [1, number, 1, number, number]
        shapeByAxis: {
            t: 1
            c: number
            z: 1
            y: number
            x: number
        }
        axes: [
            { index: 0, name: "t", type: "time", unit: null, size: 1 },
            { index: 1, name: "c", type: "channel", unit: null, size: number },
            { index: 2, name: "z", type: "space", unit: null, size: 1 },
            { index: 3, name: "y", type: "space", unit: string | null, size: number },
            { index: 4, name: "x", type: "space", unit: string | null, size: number }
        ]
        analysisRoles: {
            required: ["x", "y"]
            optional: []
            fixed: {
                x: "x"
                y: "y"
                c: "c"
                t: "t"
                z: "z"
            }
        }
        layerAxisOptions: [
            { index: 1, name: "c", type: "channel", unit: null, size: number }
        ]
        recommendedLayerAxis: "c"
    }
    metadata: {
        seriesIndex: 0
        seriesCount: number
        seriesAxes: string | null
        seriesShape: number[]
        dtype: string
        isOme: boolean
        omeXmlPresent: boolean
        imagejMetadataPresent: boolean
        pixelSizeX: number | null
        pixelSizeY: number | null
        pixelSizeXUnit: string | null
        pixelSizeYUnit: string | null
    }
    warnings: string[]
}

type IgorWaveOption = {
    path: string
    name: string
    shape: number[]
    dtype: string
    dimensionScales: Array<number | null>
    dimensionOffsets: Array<number | null>
    dimensionUnits: Array<string | null>
}

type IgorInspectResponse = {
    version: "hyperspectrum-source-inspect-v1"
    projectID: string
    dataType: "hypercars" | "hyperraman"
    source: InspectSource & {
        format: "igor"
        kind: "s3-object"
        extension: "ibw" | "pxp" | "pxt"
    }
    dimensions: InspectDimensions
    metadata: {
        sourceAxisOrder: string
        sourceShape: number[]
        normalizedAxisOrder: "TCZYX"
        dtype: string
        estimatedNbytes: number
        selectedWavePath: string
        selectedWaveName: string
        defaultWavePath: string
        numericWaveCount: number
        waveOptions: IgorWaveOption[]
        dimensionScales: Array<number | null>
        dimensionOffsets: Array<number | null>
        dimensionUnits: Array<string | null>
    }
    warnings: string[]
}

type HyperspectrumSourceInspectResponse = OirInspectResponse | OmeZarrInspectResponse | OmeTiffInspectResponse | TiffInspectResponse | IgorInspectResponse

type HyperspectrumSourceAnalysisRequest = {
    projectID: string
    dataType?: "hypercars" | "hyperraman"
    inputS3Uri?: string
    axisMapping: {
        x: string
        y: string
        z?: string
        c?: string
        t?: string
    }
    fixedIndices?: Record<string, number>
}

type HyperspectrumTiffAnalysisRequest = {
    projectID: string
    dataType?: "hypercars" | "hyperraman"
    inputS3Uri?: string
}

type HyperspectrumIgorAnalysisRequest = {
    projectID: string
    inputS3Uri: string
    wavePath: string
    sourceAxisOrder: string
    axisMapping: Partial<Record<"x" | "y" | "z" | "c" | "t", string>>
    fixedIndices: Record<string, number>
}

type ParseJobResponse = {
    jobId: string
    taskArn: string
    status: "STARTED"
    submittedAt: string
}

type CustomIndexScope = "owned" | "shared"

type CustomIndexSourceKind = "data" | "estimate"

type CustomIndexOperand = {
    symbol: "D" | "E"
    sourceKind: CustomIndexSourceKind
    layerNumber: number
    layerIndex: number
    axisValue: number | null
    axisUnit: string | null
}

type CustomIndexFormulaModel = {
    version: "custom-index-formula-v1"
    expression: string
    operands: CustomIndexOperand[]
    outputLabel: string
    outputUnit: string | null
}

type CustomIndexProfileWriteRequest = {
    version: "custom-index-profile-write-v1"
    profileKind: "hyperspectral-custom-index"
    dataType: "hypercars" | "hyperraman"
    friendlyName: string
    description: string
    sourceProjectID: string
    model: CustomIndexFormulaModel
}

type CustomIndexPreviewRequest = {
    version: "custom-index-preview-request-v1"
    projectID: string
    projectKey?: string
    dataType: "hypercars" | "hyperraman"
    model: CustomIndexFormulaModel
}

type ProjectCustomIndexAssignmentWriteRequest = {
    version: "project-custom-index-assignment-write-v1"
    entries: Array<{
        profileID: string
        order: number
    }>
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

var resolveHyperspectrumDataType = ( dataType: string = "" ) => {

    const normalized = resolveDataType( dataType ).toLowerCase()
    if( normalized === "hyperraman" || normalized === "raman" ){
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

var inspectSource = async (
    project: any,
    options: {
        inputS3Uri?: string
        dataType?: string
        wavePath?: string
        waveName?: string
        sourceAxisOrder?: string
    } = {}
) => {

    const projectReference = resolveProjectReference( project )
    if( projectReference.projectID.length === 0 ){
        throw new Error( "Missing projectID for hyperspectrum inspect request." )
    }

    const parameters: Record<string, string> = {
        projectID: projectReference.projectID,
        dataType: resolveHyperspectrumDataType( options?.dataType )
    }

    const inputS3Uri = String( options?.inputS3Uri ?? "" ).trim()
    if( inputS3Uri.length > 0 ){
        parameters.inputS3Uri = inputS3Uri
    }

    const wavePath = String( options?.wavePath ?? "" ).trim()
    if( wavePath.length > 0 ){
        parameters.wavePath = wavePath
    }

    const waveName = String( options?.waveName ?? "" ).trim()
    if( waveName.length > 0 ){
        parameters.waveName = waveName
    }

    const sourceAxisOrder = String( options?.sourceAxisOrder ?? "" ).trim()
    if( sourceAxisOrder.length > 0 ){
        parameters.sourceAxisOrder = sourceAxisOrder
    }

    if( projectReference.isShared || projectReference.projectKey.length > 0 ){
        parameters.projectKey = projectReference.projectKey
    }

    const route = projectReference.isShared
        ? "/hyperspectrum/shared/inspect"
        : "/hyperspectrum/inspect"

    const base = (import.meta as any).env.VITE_BASE_URL + route
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<HyperspectrumSourceInspectResponse>( url )
}

var launchSourceAnalysis = async (
    project: any,
    groupID: string = "",
    payload: Partial<HyperspectrumSourceAnalysisRequest> = {},
    dataType: string = "",
    route: string = "/hyperspectrum/ome-zarr/analysis"
) => {

    const projectReference = resolveProjectReference( project )
    if( projectReference.projectID.length === 0 ){
        throw new Error( "Missing projectID for hyperspectrum source analysis request." )
    }

    if( projectReference.isShared ){
        throw new Error( "Hyperspectrum source analysis launch is not available for shared projects." )
    }

    const normalizedDataType = resolveHyperspectrumDataType( dataType )
    const axisMapping = typeof payload?.axisMapping === "object" && payload?.axisMapping !== null
        ? payload.axisMapping
        : null

    if( axisMapping === null ){
        throw new Error( "Hyperspectrum source analysis axisMapping is required." )
    }

    const parameters: Record<string, string> = {
        projectID: projectReference.projectID,
        dataType: normalizedDataType,
        groupID: groupID ?? ""
    }

    const body: HyperspectrumSourceAnalysisRequest = {
        projectID: projectReference.projectID,
        dataType: normalizedDataType,
        axisMapping: {
            x: String( axisMapping?.x ?? "" ).trim(),
            y: String( axisMapping?.y ?? "" ).trim()
        }
    }

    const optionalRoles = [ "z", "c", "t" ]
    for( const role of optionalRoles ){
        const axisName = String( axisMapping?.[ role as keyof typeof axisMapping ] ?? "" ).trim()
        if( axisName.length > 0 ){
            body.axisMapping[ role as "z" | "c" | "t" ] = axisName
        }
    }

    const inputS3Uri = String( payload?.inputS3Uri ?? "" ).trim()
    if( inputS3Uri.length > 0 ){
        body.inputS3Uri = inputS3Uri
    }

    const fixedIndicesInput = payload?.fixedIndices
    if( fixedIndicesInput && typeof fixedIndicesInput === "object" ){
        const fixedIndices: Record<string, number> = {}
        for( const [ axisName, rawValue ] of Object.entries( fixedIndicesInput ) ){
            const normalizedAxisName = String( axisName ?? "" ).trim()
            const numericValue = Number.parseInt( String( rawValue ), 10 )
            if( normalizedAxisName.length === 0 || Number.isInteger( numericValue ) === false ){
                continue
            }
            fixedIndices[ normalizedAxisName ] = numericValue
        }

        if( Object.keys( fixedIndices ).length > 0 ){
            body.fixedIndices = fixedIndices
        }
    }

    const base = (import.meta as any).env.VITE_BASE_URL + route
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<ParseJobResponse>( url, {
        method: "POST",
        body: JSON.stringify( body )
    })
}

var launchOmeZarrAnalysis = async (
    project: any,
    groupID: string = "",
    payload: Partial<HyperspectrumSourceAnalysisRequest> = {},
    dataType: string = ""
) => {
    return await launchSourceAnalysis(
        project,
        groupID,
        payload,
        dataType,
        "/hyperspectrum/ome-zarr/analysis"
    )
}

var launchOmeTiffAnalysis = async (
    project: any,
    groupID: string = "",
    payload: Partial<HyperspectrumSourceAnalysisRequest> = {},
    dataType: string = ""
) => {
    return await launchSourceAnalysis(
        project,
        groupID,
        payload,
        dataType,
        "/hyperspectrum/ome-tiff/analysis"
    )
}

var launchOirAnalysis = async (
    project: any,
    groupID: string = "",
    payload: Partial<HyperspectrumSourceAnalysisRequest> = {},
    dataType: string = ""
) => {
    return await launchSourceAnalysis(
        project,
        groupID,
        payload,
        dataType,
        "/hyperspectrum/oir/analysis"
    )
}

var launchTiffAnalysis = async (
    project: any,
    groupID: string = "",
    payload: Partial<HyperspectrumTiffAnalysisRequest> = {},
    dataType: string = ""
) => {

    const projectReference = resolveProjectReference( project )
    if( projectReference.projectID.length === 0 ){
        throw new Error( "Missing projectID for hyperspectrum TIFF analysis request." )
    }

    if( projectReference.isShared ){
        throw new Error( "Hyperspectrum TIFF analysis launch is not available for shared projects." )
    }

    const normalizedDataType = resolveHyperspectrumDataType( dataType )
    const parameters: Record<string, string> = {
        projectID: projectReference.projectID,
        dataType: normalizedDataType,
        groupID: groupID ?? ""
    }

    const body: HyperspectrumTiffAnalysisRequest = {
        projectID: projectReference.projectID,
        dataType: normalizedDataType
    }

    const inputS3Uri = String( payload?.inputS3Uri ?? "" ).trim()
    if( inputS3Uri.length > 0 ){
        body.inputS3Uri = inputS3Uri
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/hyperspectrum/tiff/analysis"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<ParseJobResponse>( url, {
        method: "POST",
        body: JSON.stringify( body )
    })
}

var launchIgorAnalysis = async (
    project: any,
    groupID: string = "",
    payload: Partial<HyperspectrumIgorAnalysisRequest> = {},
    dataType: string = ""
) => {

    const projectReference = resolveProjectReference( project )
    if( projectReference.projectID.length === 0 ){
        throw new Error( "Missing projectID for hyperspectrum Igor analysis request." )
    }

    if( projectReference.isShared ){
        throw new Error( "Hyperspectrum Igor analysis launch is not available for shared projects." )
    }

    const normalizedDataType = resolveHyperspectrumDataType( dataType )
    const axisMapping = typeof payload?.axisMapping === "object" && payload?.axisMapping !== null
        ? payload.axisMapping
        : null

    if( axisMapping === null ){
        throw new Error( "Hyperspectrum Igor analysis axisMapping is required." )
    }

    const inputS3Uri = String( payload?.inputS3Uri ?? "" ).trim()
    if( inputS3Uri.length === 0 ){
        throw new Error( "Hyperspectrum Igor analysis inputS3Uri is required." )
    }

    const wavePath = String( payload?.wavePath ?? "" ).trim()
    if( wavePath.length === 0 ){
        throw new Error( "Hyperspectrum Igor analysis wavePath is required." )
    }

    const sourceAxisOrder = String( payload?.sourceAxisOrder ?? "" ).trim()
    if( sourceAxisOrder.length === 0 ){
        throw new Error( "Hyperspectrum Igor analysis sourceAxisOrder is required." )
    }

    const parameters: Record<string, string> = {
        projectID: projectReference.projectID,
        dataType: normalizedDataType,
        groupID: groupID ?? ""
    }

    const body: HyperspectrumIgorAnalysisRequest = {
        projectID: projectReference.projectID,
        inputS3Uri,
        wavePath,
        sourceAxisOrder,
        axisMapping: {
            x: String( axisMapping?.x ?? "" ).trim(),
            y: String( axisMapping?.y ?? "" ).trim()
        },
        fixedIndices: {}
    }

    const optionalRoles = [ "z", "c", "t" ]
    for( const role of optionalRoles ){
        const axisName = String( axisMapping?.[ role as keyof typeof axisMapping ] ?? "" ).trim()
        if( axisName.length > 0 ){
            body.axisMapping[ role as "z" | "c" | "t" ] = axisName
        }
    }

    const fixedIndicesInput = payload?.fixedIndices
    if( fixedIndicesInput && typeof fixedIndicesInput === "object" ){
        for( const [ axisName, rawValue ] of Object.entries( fixedIndicesInput ) ){
            const normalizedAxisName = String( axisName ?? "" ).trim()
            const numericValue = Number.parseInt( String( rawValue ), 10 )
            if( normalizedAxisName.length === 0 || Number.isInteger( numericValue ) === false ){
                continue
            }
            body.fixedIndices[ normalizedAxisName ] = numericValue
        }
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/hyperspectrum/igor/analysis"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<ParseJobResponse>( url, {
        method: "POST",
        body: JSON.stringify( body )
    })
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

var listCustomIndexProfiles = async ({
    dataType = "",
    scope = "owned"
}: {
    dataType?: string
    scope?: CustomIndexScope
} = {}) => {

    const parameters: Record<string, string> = {
        dataType: resolveHyperspectrumDataType( dataType ),
        scope: scope === "shared" ? "shared" : "owned"
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/hyperspectrum/custom-index/profiles"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<any>( url )
}

var getCustomIndexProfile = async (
    profileID: string,
    dataType: string = ""
) => {

    const normalizedProfileID = String( profileID ?? "" ).trim()
    if( normalizedProfileID.length === 0 ){
        throw new Error( "Custom index profile id is required." )
    }

    const parameters: Record<string, string> = {
        profileID: normalizedProfileID,
        dataType: resolveHyperspectrumDataType( dataType )
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/hyperspectrum/custom-index/profile"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<any>( url )
}

var createCustomIndexProfile = async (
    payload: Partial<CustomIndexProfileWriteRequest> = {},
    dataType: string = ""
) => {

    const normalizedDataType = resolveHyperspectrumDataType( dataType || payload?.dataType )
    const body: CustomIndexProfileWriteRequest = {
        version: "custom-index-profile-write-v1",
        profileKind: "hyperspectral-custom-index",
        dataType: normalizedDataType,
        friendlyName: String( payload?.friendlyName ?? "" ).trim(),
        description: String( payload?.description ?? "" ).trim(),
        sourceProjectID: String( payload?.sourceProjectID ?? "" ).trim(),
        model: payload?.model as CustomIndexFormulaModel
    }

    if( body.friendlyName.length === 0 ){
        throw new Error( "Custom index profile name is required." )
    }
    if( body.sourceProjectID.length === 0 ){
        throw new Error( "Custom index source project id is required." )
    }
    if( body.model === null || typeof body.model !== "object" ){
        throw new Error( "Custom index formula model is required." )
    }

    const parameters: Record<string, string> = {
        dataType: normalizedDataType
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/hyperspectrum/custom-index/profile"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<any>( url, {
        method: "POST",
        body: JSON.stringify( body )
    })
}

var updateCustomIndexProfile = async (
    profileID: string,
    payload: Partial<CustomIndexProfileWriteRequest> = {},
    dataType: string = ""
) => {

    const normalizedProfileID = String( profileID ?? "" ).trim()
    if( normalizedProfileID.length === 0 ){
        throw new Error( "Custom index profile id is required." )
    }

    const normalizedDataType = resolveHyperspectrumDataType( dataType || payload?.dataType )
    const body: CustomIndexProfileWriteRequest = {
        version: "custom-index-profile-write-v1",
        profileKind: "hyperspectral-custom-index",
        dataType: normalizedDataType,
        friendlyName: String( payload?.friendlyName ?? "" ).trim(),
        description: String( payload?.description ?? "" ).trim(),
        sourceProjectID: String( payload?.sourceProjectID ?? "" ).trim(),
        model: payload?.model as CustomIndexFormulaModel
    }

    const parameters: Record<string, string> = {
        profileID: normalizedProfileID,
        dataType: normalizedDataType
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/hyperspectrum/custom-index/profile"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<any>( url, {
        method: "PUT",
        body: JSON.stringify( body )
    })
}

var deleteCustomIndexProfile = async (
    profileID: string,
    dataType: string = ""
) => {

    const normalizedProfileID = String( profileID ?? "" ).trim()
    if( normalizedProfileID.length === 0 ){
        throw new Error( "Custom index profile id is required." )
    }

    const parameters: Record<string, string> = {
        profileID: normalizedProfileID,
        dataType: resolveHyperspectrumDataType( dataType )
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/hyperspectrum/custom-index/profile"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<any>( url, { method: "DELETE" })
}

var listCustomIndexProfileCollaborators = async (
    profileID: string,
    dataType: string = ""
) => {

    const normalizedProfileID = String( profileID ?? "" ).trim()
    if( normalizedProfileID.length === 0 ){
        throw new Error( "Custom index profile id is required." )
    }

    const parameters: Record<string, string> = {
        profileID: normalizedProfileID,
        dataType: resolveHyperspectrumDataType( dataType )
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/hyperspectrum/custom-index/profile/collaborators"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<any>( url )
}

var addCustomIndexProfileCollaborator = async (
    profileID: string,
    email: string,
    dataType: string = ""
) => {

    const normalizedProfileID = String( profileID ?? "" ).trim()
    const normalizedEmail = String( email ?? "" ).trim()
    if( normalizedProfileID.length === 0 ){
        throw new Error( "Custom index profile id is required." )
    }
    if( normalizedEmail.length === 0 ){
        throw new Error( "Collaborator email is required." )
    }

    const parameters: Record<string, string> = {
        profileID: normalizedProfileID,
        dataType: resolveHyperspectrumDataType( dataType )
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/hyperspectrum/custom-index/profile/collaborator"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<any>( url, {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail })
    })
}

var removeCustomIndexProfileCollaborator = async (
    profileID: string,
    collaboratorID: string,
    dataType: string = ""
) => {

    const normalizedProfileID = String( profileID ?? "" ).trim()
    const normalizedCollaboratorID = String( collaboratorID ?? "" ).trim()
    if( normalizedProfileID.length === 0 ){
        throw new Error( "Custom index profile id is required." )
    }
    if( normalizedCollaboratorID.length === 0 ){
        throw new Error( "Custom index collaborator id is required." )
    }

    const parameters: Record<string, string> = {
        profileID: normalizedProfileID,
        collaboratorID: normalizedCollaboratorID,
        dataType: resolveHyperspectrumDataType( dataType )
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/hyperspectrum/custom-index/profile/collaborator"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<any>( url, { method: "DELETE" })
}

var previewCustomIndex = async (
    project: any,
    model: CustomIndexFormulaModel,
    dataType: string = ""
) => {

    const projectReference = resolveProjectReference( project )
    if( projectReference.projectID.length === 0 ){
        throw new Error( "Missing projectID for custom index preview request." )
    }

    const normalizedDataType = resolveHyperspectrumDataType( dataType )
    const parameters: Record<string, string> = {
        projectID: projectReference.projectID,
        dataType: normalizedDataType
    }
    if( projectReference.isShared || projectReference.projectKey.length > 0 ){
        parameters.projectKey = projectReference.projectKey
    }

    const body: CustomIndexPreviewRequest = {
        version: "custom-index-preview-request-v1",
        projectID: projectReference.projectID,
        dataType: normalizedDataType,
        model
    }
    if( projectReference.isShared || projectReference.projectKey.length > 0 ){
        body.projectKey = projectReference.projectKey
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/hyperspectrum/custom-index/preview"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<any>( url, {
        method: "POST",
        body: JSON.stringify( body )
    })
}

var loadProjectCustomIndexAssignment = async (
    project: any,
    dataType: string = ""
) => {

    const projectReference = resolveProjectReference( project )
    if( projectReference.projectID.length === 0 ){
        throw new Error( "Missing projectID for custom index assignment request." )
    }

    const parameters: Record<string, string> = {
        projectID: projectReference.projectID,
        dataType: resolveHyperspectrumDataType( dataType )
    }
    if( projectReference.isShared || projectReference.projectKey.length > 0 ){
        parameters.projectKey = projectReference.projectKey
    }

    const route = projectReference.isShared
        ? "/hyperspectrum/shared/custom-index/project"
        : "/hyperspectrum/custom-index/project"
    const base = (import.meta as any).env.VITE_BASE_URL + route
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<any>( url )
}

var saveProjectCustomIndexAssignment = async (
    project: any,
    entries: Array<{ profileID: string, order: number }> = [],
    dataType: string = ""
) => {

    const projectReference = resolveProjectReference( project )
    if( projectReference.projectID.length === 0 ){
        throw new Error( "Missing projectID for custom index assignment save." )
    }
    if( projectReference.isShared ){
        throw new Error( "Custom index assignment is not available for shared projects." )
    }

    const normalizedEntries = ( Array.isArray( entries ) ? entries : [] )
        .map(( entry, index ) => ({
            profileID: String( entry?.profileID ?? "" ).trim(),
            order: Number.isInteger( Number( entry?.order )) ? Number( entry.order ) : index
        }))
        .filter(( entry ) => entry.profileID.length > 0 )

    const body: ProjectCustomIndexAssignmentWriteRequest = {
        version: "project-custom-index-assignment-write-v1",
        entries: normalizedEntries
    }
    const parameters: Record<string, string> = {
        projectID: projectReference.projectID,
        dataType: resolveHyperspectrumDataType( dataType )
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/hyperspectrum/custom-index/project"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<any>( url, {
        method: "PUT",
        body: JSON.stringify( body )
    })
}

var loadCustomIndexArtifact = async (
    project: any,
    profileID: string,
    dataType: string = ""
) => {

    const projectReference = resolveProjectReference( project )
    const normalizedProfileID = String( profileID ?? "" ).trim()
    if( projectReference.projectID.length === 0 ){
        throw new Error( "Missing projectID for custom index artifact request." )
    }
    if( normalizedProfileID.length === 0 ){
        throw new Error( "Custom index profile id is required." )
    }

    const parameters: Record<string, string> = {
        projectID: projectReference.projectID,
        profileID: normalizedProfileID,
        dataType: resolveHyperspectrumDataType( dataType )
    }
    if( projectReference.isShared || projectReference.projectKey.length > 0 ){
        parameters.projectKey = projectReference.projectKey
    }

    const route = projectReference.isShared
        ? "/hyperspectrum/shared/custom-index/artifact"
        : "/hyperspectrum/custom-index/artifact"
    const base = (import.meta as any).env.VITE_BASE_URL + route
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<any>( url )
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
    inspectSource,
    launchOirAnalysis,
    launchTiffAnalysis,
    launchOmeZarrAnalysis,
    launchOmeTiffAnalysis,
    launchIgorAnalysis,
    spectrum,
    meanSpectrum,
    status,
    listCustomIndexProfiles,
    getCustomIndexProfile,
    createCustomIndexProfile,
    updateCustomIndexProfile,
    deleteCustomIndexProfile,
    listCustomIndexProfileCollaborators,
    addCustomIndexProfileCollaborator,
    removeCustomIndexProfileCollaborator,
    previewCustomIndex,
    loadProjectCustomIndexAssignment,
    saveProjectCustomIndexAssignment,
    loadCustomIndexArtifact,
    listRois,
    createRoi,
    deleteRoi,
    loadZBlendSettings,
    saveZBlendSettings,
    loadSpectrumGridlineSettings,
    saveSpectrumGridlineSettings
}
