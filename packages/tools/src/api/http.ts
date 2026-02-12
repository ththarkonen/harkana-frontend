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
        throw new Error(`API error ${response.status}: ${response.statusText}`)
    }

    if( response.status === 204 ){
        return {} as T;
    }

    return await response.json() as T
}


