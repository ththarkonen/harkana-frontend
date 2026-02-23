import { Amplify } from 'aws-amplify'
import { apiFetch, buildQueryString } from './http'

type ShareInfo = {
    projectId: string
    projectKey: string
    [key: string]: any
}

type SharedProjectInfo = {
    id: string
    shared?: boolean
    rawid?: string
    shareInfo?: ShareInfo
    [key: string]: any
}

type SharedProjectsMap = Record<string, SharedProjectInfo>

type SharedFilesResponse = {
    files: string[]
    [key: string]: any
}

type Collaborator = {
    sub: string
    given_name?: string
    family_name?: string
    email?: string
    [key: string]: any
}

type ShareGetUrlResponse = {
    url: string
}

type GenericApiResponse = {
    [key: string]: any
}

var apiParameters = async ( project: any ) => {

    const credentials = await Amplify.Auth.currentCredentials()
    const tokens = await Amplify.Auth.essentialCredentials( credentials )

    var parameters: Record<string, string> = {}
    const projectID = String( project.id )

    parameters.dataType = (import.meta as any).env.VITE_DATA_TYPE
    parameters.projectID = projectID
    parameters.key = "private/" + tokens.identityId + "/" + projectID
    parameters.zenodoKey = "private/" + tokens.identityId + "/zenodo.json"

    return parameters
}

var buildApiUrl = ( path: string, parameters: Record<string, string> ) => {
    const base = (import.meta as any).env.VITE_BASE_URL + path
    return base + "?" + buildQueryString( parameters )
}

var list = async () => {

    var parameters = await apiParameters( { id: null } )
    const url = buildApiUrl( "/share/list/projects", parameters )

    const shareInfos = await apiFetch<ShareInfo[]>( url )
    const nShares = shareInfos.length

    if( nShares == 0 ) return []

    var sharedProjects: SharedProjectsMap = {}

    for( var ii = 0; ii < nShares; ii++ ){

        const shareInfo = shareInfos[ii]
        var projectInfo = await load( shareInfo, "info.json" ) as SharedProjectInfo

        projectInfo.shared = true
        projectInfo.rawid = projectInfo.id
        projectInfo.id = shareInfo.projectKey
        projectInfo.shareInfo = shareInfo

        sharedProjects[ projectInfo.id ] = projectInfo
    }

    return sharedProjects
}


var load = async ( shareInfo: ShareInfo, fileName: string ) => {

    var parameters = await apiParameters( { id: null } )
    parameters.projectID = shareInfo.projectId
    parameters.projectKey = shareInfo.projectKey
    parameters.key = fileName

    const url = buildApiUrl( "/share/geturl", parameters )
    const response = await apiFetch<ShareGetUrlResponse>( url )

    try{
        var result = await fetch( response.url )
        return await result.json()
    } catch( error ){
        console.log( error )
        throw new Error( "The shared project is not available at the moment. Please try again later." )
    }
}


var loadResponse = async ( shareInfo: ShareInfo, fileName: string ) => {

    var parameters = await apiParameters( { id: null } )
    parameters.projectID = shareInfo.projectId
    parameters.projectKey = shareInfo.projectKey
    parameters.key = fileName

    const url = buildApiUrl( "/share/geturl", parameters )
    const response = await apiFetch<ShareGetUrlResponse>( url )

    try{
        var result = await fetch( response.url )
        return result
    } catch( error ){
        console.log( error )
        throw new Error( "The shared project is not available at the moment. Please try again later." )
    }
}


var removeShared = async ( project: any ) => {

    if( !project.shared ) throw new Error( "Project is owner by the user." )

    var parameters = await apiParameters( project )
    parameters.projectKey = project.id

    const url = buildApiUrl( "/share/remove/project", parameters )
    return await apiFetch<GenericApiResponse>( url )
}


var listSharedFiles = async ( project: any ) => {

    if( !project.shared ) throw new Error( "Project is owner by the user." )

    var parameters = await apiParameters( project )
    parameters.projectKey = project.id
    parameters.projectID = project.rawid

    const url = buildApiUrl( "/share/list/files", parameters )
    return await apiFetch<SharedFilesResponse>( url )
}


var listCollaborators = async ( project: any ) => {

    if( project.shared ) throw new Error( "Project is not owned by user. Cannot list collaborators." )

    var parameters = await apiParameters( project )
    parameters.projectKey = project.id
    parameters.projectID = project.id

    const url = buildApiUrl( "/share/list/collaborators", parameters )
    return await apiFetch<Collaborator[]>( url )
}


var addCollaborator = async ( project: any, email: string ) => {

    if( project.shared ) throw new Error( "Project is not owned by user. Cannot remove collaborator." )

    var parameters = await apiParameters( project )
    parameters.projectKey = project.id
    parameters.projectID = project.id
    parameters.email = email

    const url = buildApiUrl( "/share/add/collaborator", parameters )
    return await apiFetch<GenericApiResponse>( url )
}


var removeCollaborator = async ( project: any, id: string ) => {

    if( project.shared ) throw new Error( "Project is not owned by user. Cannot remove collaborator." )

    var parameters = await apiParameters( project )
    parameters.projectKey = project.id
    parameters.projectID = project.id
    parameters.collaboratorID = id

    const url = buildApiUrl( "/share/remove/collaborator", parameters )
    return await apiFetch<GenericApiResponse>( url )
}


var removeProject = async ( project: any ) => {

    if( project.shared ) throw new Error( "Project is not owned by user. Cannot remove the project." )

    var parameters = await apiParameters( project )
    parameters.projectKey = project.id
    parameters.projectID = project.id

    const url = buildApiUrl( "/share/remove/all", parameters )
    return await apiFetch<GenericApiResponse>( url )
}


export default {
    addCollaborator,
    removeCollaborator,
    listCollaborators,
    list,
    load,
    loadResponse,
    removeShared,
    listSharedFiles,
    removeProject
}
