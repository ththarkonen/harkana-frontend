import { getIdToken } from './auth';

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
        var detail = ""

        try{
            const jsonPayload = await response.clone().json() as Record<string, unknown>
            const detailCandidate = typeof jsonPayload?.detail === "string"
                ? jsonPayload.detail
                : ( typeof jsonPayload?.errorMessage === "string"
                    ? jsonPayload.errorMessage
                    : "" )

            detail = String( detailCandidate ?? "" ).trim()
        } catch{
            try{
                const textPayload = await response.clone().text()
                detail = String( textPayload ?? "" ).trim()
            } catch{
                detail = ""
            }
        }

        const message = detail.length > 0
            ? `API error ${response.status}: ${response.statusText} - ${detail}`
            : `API error ${response.status}: ${response.statusText}`
        const error = new Error( message ) as Error & { status?: number, detail?: string }
        error.status = response.status
        error.detail = detail
        throw error
    }

    if( response.status === 204 ){
        return {} as T;
    }

    return await response.json() as T
}

export const buildQueryString = ( params: Record<string, string> ): string => {

    const search = new URLSearchParams()

    for( const key in params ){
        search.append( key, params[key])
    }

    return search.toString()
}
