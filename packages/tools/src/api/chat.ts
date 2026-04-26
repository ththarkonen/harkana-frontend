import { apiFetch, buildQueryString } from './http'

export type ChatDataType = "cars" | "raman" | "hypercars"

export type ChatAuthor = {
    sub: string
    givenName: string | null
    familyName: string | null
    email: string | null
}

export type ChatMessage = {
    messageId: string
    projectID: string
    dataType: ChatDataType
    author: ChatAuthor
    body: string | null
    createdAt: string
    deleted: boolean
    deletedAt: string | null
}

export type ListChatMessagesResponse = {
    messages: ChatMessage[]
    nextCursor: string | null
}

export type CreateChatMessageBody = {
    body: string
}

type ListChatMessagesOptions = {
    dataType?: ChatDataType | string
    limit?: number
    cursor?: string | null
}

type ChatProjectReference = {
    projectID: string
    projectKey: string
    isShared: boolean
}

var resolveProjectReference = ( project: any ): ChatProjectReference => {

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

var resolveDataType = ( dataType: ChatDataType | string = "" ) => {

    const normalized = String( dataType ?? "" ).trim()
    if( normalized.length > 0 ){
        return normalized
    }

    return String((import.meta as any).env.VITE_DATA_TYPE ?? "" ).trim()
}

var chatParameters = ( project: any, dataType: ChatDataType | string = "" ) => {

    const projectReference = resolveProjectReference( project )
    if( projectReference.projectID.length === 0 ){
        throw new Error( "Missing projectID for chat request." )
    }

    const resolvedDataType = resolveDataType( dataType )
    if( resolvedDataType.length === 0 ){
        throw new Error( "Missing dataType for chat request." )
    }

    const parameters: Record<string, string> = {
        projectID: projectReference.projectID,
        dataType: resolvedDataType
    }

    if( projectReference.isShared || projectReference.projectKey.length > 0 ){
        parameters.projectKey = projectReference.projectKey
    }

    return parameters
}

var listMessages = async (
    project: any,
    options: ListChatMessagesOptions = {}
) => {

    const parameters = chatParameters( project, options.dataType )
    const requestedLimit = Number.parseInt( String( options?.limit ?? 50 ), 10 )
    const normalizedLimit = Number.isFinite( requestedLimit )
        ? Math.min( 200, Math.max( 1, requestedLimit ))
        : 50
    parameters.limit = String( normalizedLimit )

    const cursor = String( options?.cursor ?? "" ).trim()
    if( cursor.length > 0 ){
        parameters.cursor = cursor
    }

    const base = (import.meta as any).env.VITE_BASE_URL + "/chat/messages"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<ListChatMessagesResponse>( url )
}

var createMessage = async (
    project: any,
    payload: CreateChatMessageBody,
    dataType: ChatDataType | string = ""
) => {

    const messageBody = String( payload?.body ?? "" ).trim()
    if( messageBody.length === 0 ){
        throw new Error( "Message body cannot be empty." )
    }

    if( messageBody.length > 4000 ){
        throw new Error( "Message body must be at most 4000 characters." )
    }

    const parameters = chatParameters( project, dataType )
    const base = (import.meta as any).env.VITE_BASE_URL + "/chat/messages"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<ChatMessage>( url, {
        method: "POST",
        body: JSON.stringify({
            body: messageBody
        })
    })
}

var deleteMessage = async (
    project: any,
    messageID: string,
    dataType: ChatDataType | string = ""
) => {

    const normalizedMessageID = String( messageID ?? "" ).trim()
    if( normalizedMessageID.length === 0 ){
        throw new Error( "Message id is required for deletion." )
    }

    const parameters = chatParameters( project, dataType )
    const base = (import.meta as any).env.VITE_BASE_URL + "/chat/messages/" + encodeURIComponent( normalizedMessageID )
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<Record<string, never>>( url, {
        method: "DELETE"
    })
}

export default {
    listMessages,
    createMessage,
    deleteMessage
}
