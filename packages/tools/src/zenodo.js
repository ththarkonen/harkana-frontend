import { apiFetch, buildQueryString } from "./api/http.ts"

const SUPPORTED_DATA_TYPES = new Set([ "cars", "raman", "hypercars", "hyperraman" ])

var normalizeDataType = function( dataType = "" ){

    const fallback = String( import.meta.env.VITE_DATA_TYPE ?? "" ).trim().toLowerCase()
    const resolved = String( dataType ?? "" ).trim().toLowerCase()
    const normalized = resolved.length > 0 ? resolved : fallback

    if( SUPPORTED_DATA_TYPES.has( normalized ) ){
        return normalized
    }

    if( SUPPORTED_DATA_TYPES.has( fallback ) ){
        return fallback
    }

    return "raman"
}

var normalizeKeywords = function( keywords ){

    if( Array.isArray( keywords ) === false ){
        return []
    }

    var normalized = []
    for( const keyword of keywords ){
        const value = String( keyword ?? "" ).trim()
        if( value.length === 0 ) continue
        normalized.push( value )
    }

    return [ ...new Set( normalized ) ]
}

var ensureOwnerProject = function( project ){

    if( project?.shared === true ){
        throw new Error( "Zenodo export is only available for owned projects." )
    }

    const projectID = String( project?.id ?? "" ).trim()
    if( projectID.length === 0 ){
        throw new Error( "Missing projectID for Zenodo export." )
    }

    return projectID
}

var saveSettings = async function( payload = {} ){

    const body = {
        token: String( payload?.token ?? "" ),
        title: String( payload?.title ?? "" ),
        description: String( payload?.description ?? "" ),
        keywords: normalizeKeywords( payload?.keywords )
    }

    const api = import.meta.env.VITE_BASE_URL + "/zenodo/settings"
    return await apiFetch( api, {
        method: "PUT",
        body: JSON.stringify( body )
    })
}

var checkSettings = async function(){

    const api = import.meta.env.VITE_BASE_URL + "/zenodo/settings/check"
    return await apiFetch( api )
}

var startExport = async function( project, dataType = "" ){

    const projectID = ensureOwnerProject( project )

    var parameters = {}
    parameters.projectID = projectID
    parameters.dataType = normalizeDataType( dataType )

    const api = import.meta.env.VITE_BASE_URL + "/zenodo/export"
    const url = api + "?" + buildQueryString( parameters )

    return await apiFetch( url, {
        method: "POST"
    })
}

var status = async function( jobId ){

    const normalizedJobId = String( jobId ?? "" ).trim()
    if( normalizedJobId.length === 0 ){
        throw new Error( "Missing Zenodo export job id." )
    }

    var parameters = {}
    parameters.jobId = normalizedJobId

    const api = import.meta.env.VITE_BASE_URL + "/zenodo/export/status"
    const url = api + "?" + buildQueryString( parameters )

    return await apiFetch( url )
}

var depositionStatus = async function( jobId ){

    const normalizedJobId = String( jobId ?? "" ).trim()
    if( normalizedJobId.length === 0 ){
        throw new Error( "Missing Zenodo export job id." )
    }

    var parameters = {}
    parameters.jobId = normalizedJobId

    const api = import.meta.env.VITE_BASE_URL + "/zenodo/export/deposition-status"
    const url = api + "?" + buildQueryString( parameters )

    return await apiFetch( url )
}

export default {
    saveSettings,
    checkSettings,
    startExport,
    status,
    depositionStatus
}
