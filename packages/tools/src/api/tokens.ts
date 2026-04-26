import { apiFetch, buildQueryString } from './http'

type BalanceApiResponse = {
    balance: number
    [key: string]: any
}

type GenericApiResponse = {
    [key: string]: any
}

export type TokenHistoryActor = {
    sub: string
    email: string
    givenName: string
    familyName: string
}

export type TokenHistoryEvent = {
    PK: string
    SK: string
    eventId: string
    createdAt: string
    scopeType: "PERSONAL" | "GROUP"
    scopeId: string
    groupId: string
    eventType: string
    direction: "DEBIT" | "CREDIT"
    deltaTokens: number
    actorUserSub: string
    actor: TokenHistoryActor
    subjectUserSub: string
    source: string
    operationId: string
    status: "APPLIED"
    projectId: string
    projectName: string
    fileName: string
    dataType: string
    jobId: string
    purchaseId: string
    reason: string
    relatedEventId?: string
}

export type TokenHistoryListResponse = {
    items: TokenHistoryEvent[]
    nextToken: string | null
}

export type OwnedGroupHistorySummaryItem = {
    groupId: string
    groupName: string
    tokenBalance: number
    lastEvent: TokenHistoryEvent | null
    recent?: TokenHistoryEvent[]
}

export type OwnedGroupsHistorySummaryResponse = {
    groups: OwnedGroupHistorySummaryItem[]
}

type TokenHistoryQuery = {
    limit?: number
    nextToken?: string
    from?: string
    to?: string
}

const normalizeTokenHistoryActor = ( value: any, fallbackSub = "" ): TokenHistoryActor => {
    return {
        sub: String( value?.sub ?? fallbackSub ?? "" ),
        email: String( value?.email ?? "" ),
        givenName: String( value?.givenName ?? "" ),
        familyName: String( value?.familyName ?? "" )
    }
}

const normalizeTokenHistoryEvent = ( value: any ): TokenHistoryEvent => {
    const actorUserSub = String( value?.actorUserSub ?? "" )

    return {
        ...value,
        actorUserSub,
        actor: normalizeTokenHistoryActor( value?.actor, actorUserSub )
    } as TokenHistoryEvent
}

const normalizeTokenHistoryListResponse = ( value: any ): TokenHistoryListResponse => {
    return {
        items: Array.isArray( value?.items ) ? value.items.map(( item: any ) => normalizeTokenHistoryEvent( item )) : [],
        nextToken: value?.nextToken ?? null
    }
}

const normalizeOwnedGroupsHistorySummaryResponse = ( value: any ): OwnedGroupsHistorySummaryResponse => {
    return {
        groups: Array.isArray( value?.groups )
            ? value.groups.map(( group: any ) => {
                return {
                    ...group,
                    lastEvent: group?.lastEvent ? normalizeTokenHistoryEvent( group.lastEvent ) : null,
                    recent: Array.isArray( group?.recent )
                        ? group.recent.map(( item: any ) => normalizeTokenHistoryEvent( item ))
                        : group?.recent
                }
            })
            : []
    }
}

const normalizeHistoryLimit = ( value: any ) => {

    const numeric = Number.parseInt( String( value ?? "" ), 10 )
    if( Number.isInteger( numeric ) === false ){
        return 50
    }

    return Math.max( 1, Math.min( 200, numeric ))
}

const appendHistoryQueryParameters = (
    parameters: Record<string, string>,
    query: TokenHistoryQuery = {}
) => {

    parameters.limit = String( normalizeHistoryLimit( query?.limit ))

    const nextToken = String( query?.nextToken ?? "" ).trim()
    if( nextToken.length > 0 ){
        parameters.nextToken = nextToken
    }

    const from = String( query?.from ?? "" ).trim()
    if( from.length > 0 ){
        parameters.from = from
    }

    const to = String( query?.to ?? "" ).trim()
    if( to.length > 0 ){
        parameters.to = to
    }
}

var balance = async function( groupID ){
    
    var parameters: Record<string, string> = {}
    parameters.groupID = groupID;

    const base = import.meta.env.VITE_BASE_URL + "/tokens/balance";
    const url = base + "?" + buildQueryString( parameters )

    const response = await apiFetch<BalanceApiResponse>( url )
    return response.balance
}

var createGroup = async function( groupName ){
    
    var parameters: Record<string, string> = {}
    parameters.tokenGroupName = groupName;

    const base = import.meta.env.VITE_BASE_URL + "/tokens/group/create";
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<GenericApiResponse>( url )
}

var listGroupsAndMembers = async function(){

    const url = import.meta.env.VITE_BASE_URL + "/tokens/groups/owner"
    const response = await apiFetch<GenericApiResponse>( url )
    return response.groups
}

var addGroupMember = async function( groupID, email){
    
    var parameters: Record<string, string> = {}
    parameters.groupID = groupID;
    parameters.email = email;

    const base = import.meta.env.VITE_BASE_URL + "/tokens/group/add/member";
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<GenericApiResponse>( url )
}

var removeGroupMember = async function( groupID, userID){
    
    var parameters: Record<string, string> = {}
    parameters.groupID = groupID;
    parameters.memberID = userID;

    const base = import.meta.env.VITE_BASE_URL + "/tokens/group/remove/member";
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<GenericApiResponse>( url )
}

var removeGroup = async function( groupName ){
    
    var parameters: Record<string, string> = {}
    parameters.tokenGroupName = groupName

    const base = import.meta.env.VITE_BASE_URL + "/tokens/group/delete"
    const url = base + "?" + buildQueryString( parameters )

    return await apiFetch<GenericApiResponse>( url )
}

var getPersonalHistory = async function( query: TokenHistoryQuery = {} ){

    var parameters: Record<string, string> = {}
    appendHistoryQueryParameters( parameters, query )

    const base = import.meta.env.VITE_BASE_URL + "/tokens/history/personal"
    const url = base + "?" + buildQueryString( parameters )

    const response = await apiFetch<TokenHistoryListResponse>( url )
    return normalizeTokenHistoryListResponse( response )
}

var getGroupHistory = async function( query: TokenHistoryQuery & { groupID: string } ){

    const groupID = String( query?.groupID ?? "" ).trim()
    if( groupID.length === 0 ){
        throw new Error( "groupID is required for group token history." )
    }

    var parameters: Record<string, string> = {
        groupID
    }
    appendHistoryQueryParameters( parameters, query )

    const base = import.meta.env.VITE_BASE_URL + "/tokens/history/group"
    const url = base + "?" + buildQueryString( parameters )

    const response = await apiFetch<TokenHistoryListResponse>( url )
    return normalizeTokenHistoryListResponse( response )
}

var getOwnedGroupsHistorySummary = async function(
    query: { includeRecent?: boolean | string | number } = {}
){

    var parameters: Record<string, string> = {}
    const includeRecent = query?.includeRecent

    if(
        includeRecent === true ||
        includeRecent === 1 ||
        String( includeRecent ?? "" ).trim().toLowerCase() === "true" ||
        String( includeRecent ?? "" ).trim().toLowerCase() === "yes"
    ){
        parameters.includeRecent = "true"
    }

    const base = import.meta.env.VITE_BASE_URL + "/tokens/history/groups/owned"
    const queryString = buildQueryString( parameters )
    const url = queryString.length > 0 ? base + "?" + queryString : base

    const response = await apiFetch<OwnedGroupsHistorySummaryResponse>( url )
    return normalizeOwnedGroupsHistorySummaryResponse( response )
}

export default { balance,
                 createGroup,
                 listGroupsAndMembers,
                 addGroupMember,
                 removeGroupMember,
                 removeGroup,
                 getPersonalHistory,
                 getGroupHistory,
                 getOwnedGroupsHistorySummary}
