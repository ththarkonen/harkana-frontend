import { apiFetch, buildQueryString} from './http'

var apiParameters = ( project: any ) => {

    var parameters: Record<string, string> = {}

    parameters.projectID = project.id
    parameters.dataType = (import.meta as any).env.VITE_DATA_TYPE

    return parameters
}


var estimate = async ( project: any, tokenGroupID: string) => {

    var parameters = apiParameters( project )
    parameters.groupID = tokenGroupID

    const base = (import.meta as any).env.VITE_BASE_URL + "/data/estimate"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<{ success: boolean }>( url )
}


var validate = async ( project: any ) => {

    var parameters = apiParameters( project )

    const base = (import.meta as any).env.VITE_BASE_URL + "/data/validate"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<{ success: boolean }>( url )
}


export default { estimate, validate}
