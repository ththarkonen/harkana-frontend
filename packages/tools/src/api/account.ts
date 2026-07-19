import { apiFetch, apiFetchWithoutAuth, buildQueryString } from "./http"

export type AccountDeletionStatus = "queued" | "running" | "failed" | "completed"

export type AccountDeletionStatusResponse = {
    version: "account-deletion-response-v1"
    deletionID: string
    status: AccountDeletionStatus
    stage: string
    createdAt: string | null
    updatedAt: string | null
    startedAt?: string | null
    finishedAt?: string | null
    attempts: number
    deleted: {
        s3Prefixes: string[]
        s3Objects: number
        dynamoItems: Record<string, number>
        cognitoUser: boolean
        projects?: Record<string, string[]>
    }
    retained: {
        purchases: "retained-for-billing-retention"
        billing: "retained-for-billing-retention"
        zenodoDrafts: "retained-on-zenodo-user-account"
        identityMapTombstone: "retained-to-block-unexpired-jwts"
    }
    warnings: string[]
    errorCode?: string | null
    errorMessage?: string | null
}

export type AccountDeletionStartResponse = AccountDeletionStatusResponse & {
    statusToken: string
}

export type AccountDeletionSession = {
    version: "account-deletion-session-v1"
    deletionID: string
    statusToken: string
    startedAt: string
}

const ACCOUNT_DELETION_SESSION_STORAGE_KEY = "harkana.accountDeletionSession"

const baseUrl = () => String((import.meta as any).env.VITE_BASE_URL ?? "").replace(/\/$/, "")

const browserSessionStorage = (): Storage | null => {
    if( typeof window === "undefined" || typeof window.sessionStorage === "undefined" ){
        return null
    }

    return window.sessionStorage
}

const normalizeDeletionSession = ( value: any ): AccountDeletionSession | null => {
    const deletionID = String( value?.deletionID ?? "" ).trim()
    const statusToken = String( value?.statusToken ?? "" ).trim()

    if( deletionID.length === 0 || statusToken.length === 0 ){
        return null
    }

    return {
        version: "account-deletion-session-v1",
        deletionID,
        statusToken,
        startedAt: String( value?.startedAt ?? new Date().toISOString() )
    }
}

const getAccountDeletionSession = (): AccountDeletionSession | null => {
    const storage = browserSessionStorage()
    if( storage === null ){
        return null
    }

    try{
        return normalizeDeletionSession(
            JSON.parse( storage.getItem( ACCOUNT_DELETION_SESSION_STORAGE_KEY ) ?? "null" )
        )
    } catch{
        return null
    }
}

const saveAccountDeletionSession = ( response: AccountDeletionStartResponse ): AccountDeletionSession => {
    const session = normalizeDeletionSession({
        deletionID: response?.deletionID,
        statusToken: response?.statusToken,
        startedAt: response?.createdAt ?? response?.updatedAt ?? new Date().toISOString()
    })

    if( session === null ){
        throw new Error( "Account deletion response did not include deletionID and statusToken." )
    }

    const storage = browserSessionStorage()
    if( storage !== null ){
        storage.setItem( ACCOUNT_DELETION_SESSION_STORAGE_KEY, JSON.stringify( session ))
    }

    return session
}

const clearAccountDeletionSession = () => {
    browserSessionStorage()?.removeItem( ACCOUNT_DELETION_SESSION_STORAGE_KEY )
}

const startDeletion = async (): Promise<AccountDeletionStartResponse> => {
    return await apiFetch<AccountDeletionStartResponse>( `${baseUrl()}/account`, {
        method: "DELETE",
        body: JSON.stringify({
            version: "account-deletion-request-v1",
            confirm: true,
            confirmationText: "DELETE"
        })
    })
}

const deletionStatus = async (
    deletionID: string,
    statusToken: string
): Promise<AccountDeletionStatusResponse> => {

    const parameters = buildQueryString({
        deletionID: String( deletionID ?? "" ).trim()
    })

    return await apiFetchWithoutAuth<AccountDeletionStatusResponse>(
        `${baseUrl()}/account/deletion/status?${parameters}`,
        {
            method: "GET",
            headers: {
                "X-Account-Deletion-Status-Token": String( statusToken ?? "" ).trim()
            }
        }
    )
}

const retryDeletion = async (
    deletionID: string,
    statusToken: string
): Promise<AccountDeletionStatusResponse> => {
    return await apiFetchWithoutAuth<AccountDeletionStatusResponse>(
        `${baseUrl()}/account/deletion/retry`,
        {
            method: "POST",
            body: JSON.stringify({
                deletionID: String( deletionID ?? "" ).trim(),
                statusToken: String( statusToken ?? "" ).trim()
            })
        }
    )
}

export default {
    startDeletion,
    deletionStatus,
    retryDeletion,
    getAccountDeletionSession,
    saveAccountDeletionSession,
    clearAccountDeletionSession
}
