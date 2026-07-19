import { getIdToken } from './auth';

export const ACCOUNT_DELETION_HTTP_STATUS_EVENT = "harkana:account-deletion-http-status"

const parseApiErrorDetail = async ( response: Response ): Promise<string> => {

    try{
        const jsonPayload = await response.clone().json() as Record<string, unknown>
        const detailCandidate = typeof jsonPayload?.detail === "string"
            ? jsonPayload.detail
            : ( typeof jsonPayload?.errorMessage === "string"
                ? jsonPayload.errorMessage
                : "" )

        return String( detailCandidate ?? "" ).trim()
    } catch{
        try{
            const textPayload = await response.clone().text()
            return String( textPayload ?? "" ).trim()
        } catch{
            return ""
        }
    }
}

const notifyAccountDeletionHttpStatus = ( response: Response, detail: string, url: string ) => {

    if( response.status !== 423 && response.status !== 410 ){
        return
    }

    if( typeof window === "undefined" || typeof window.dispatchEvent !== "function" ){
        return
    }

    window.dispatchEvent( new CustomEvent( ACCOUNT_DELETION_HTTP_STATUS_EVENT, {
        detail: {
            status: response.status,
            statusText: response.statusText,
            detail,
            url
        }
    }))
}

const buildApiError = ( response: Response, detail: string ) => {

    const message = detail.length > 0
        ? `API error ${response.status}: ${response.statusText} - ${detail}`
        : `API error ${response.status}: ${response.statusText}`
    const error = new Error( message ) as Error & { status?: number, detail?: string }
    error.status = response.status
    error.detail = detail
    return error
}

const responseJsonOrEmpty = async <T>( response: Response ): Promise<T> => {
    if( response.status === 204 ){
        return {} as T;
    }

    return await response.json() as T
}

export async function apiFetch<T>( url: string, options?: RequestInit): Promise<T>{

    const token: string | null = await getIdToken();
    const headers: Record<string, string> = {};

    if( options && options.headers ){
        const incoming: Headers = new Headers( options.headers );
        incoming.forEach( ( value: string, key: string ) => {
            headers[ key ] = value;
        });
    }

    if( !headers["Content-Type"] ){
        headers["Content-Type"] = "application/json";
    }

    if( token ){
        headers["Authorization"] = `Bearer ${token}`;
    }

    const fetchParameters: RequestInit = {...options, headers: headers}
    const response: Response = await fetch( url, fetchParameters )

    if( !response.ok ){
        const detail = await parseApiErrorDetail( response )
        notifyAccountDeletionHttpStatus( response, detail, url )
        throw buildApiError( response, detail )
    }

    return await responseJsonOrEmpty<T>( response )
}

export async function apiFetchWithoutAuth<T>( url: string, options?: RequestInit): Promise<T>{

    const headers: Record<string, string> = {};

    if( options && options.headers ){
        const incoming: Headers = new Headers( options.headers );
        incoming.forEach( ( value: string, key: string ) => {
            headers[ key ] = value;
        });
    }

    if( !headers["Content-Type"] ){
        headers["Content-Type"] = "application/json";
    }

    const fetchParameters: RequestInit = {...options, headers: headers}
    const response: Response = await fetch( url, fetchParameters )

    if( !response.ok ){
        const detail = await parseApiErrorDetail( response )
        throw buildApiError( response, detail )
    }

    return await responseJsonOrEmpty<T>( response )
}

export const buildQueryString = ( params: Record<string, string> ): string => {

    const search = new URLSearchParams()

    for( const key in params ){
        search.append( key, params[key])
    }

    return search.toString()
}
