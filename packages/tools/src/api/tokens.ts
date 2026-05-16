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

export type TokenBillingBucketUsage = {
    name: string
    bucket: string
    projectCount: number
    monthlyProjectTokenCost: number
    tokensDue: number
}

export type PersonalTokenBillingPreview = {
    userSub: string
    identityID: string
    tokenBalance: number
    activeBillingGroupID: string | null
    activeBillingGroupIDs: string[]
    billedToPersonal: boolean
    projectCount: number
    dueTokens: number
    missedMonths: number
    wouldDeleteOnNextMiss: boolean
    bucketUsage: TokenBillingBucketUsage[]
}

export type OwnedTokenGroupBillingPreviewUser = {
    userSub: string
    identityID: string
    email?: string
    given_name?: string
    family_name?: string
    projectCount: number
    dueTokens: number
    missedMonths: number
    wouldDeleteOnNextMiss: boolean
    bucketUsage: TokenBillingBucketUsage[]
}

export type OwnedTokenGroupBillingPreview = {
    groupID: string
    groupName: string
    tokenBalance: number
    userCount: number
    projectCount: number
    dueTokens: number
    maxMissedMonths: number
    usersAtRiskCount: number
    users: OwnedTokenGroupBillingPreviewUser[]
}

export type OwnedTokenGroupBillingPreviewResponse = {
    version: "owned-token-group-billing-preview-v1"
    monthKey: string
    personal: PersonalTokenBillingPreview
    groups: OwnedTokenGroupBillingPreview[]
    warnings: string[]
}

export type TokenBillingMissedMonthsResponse = {
    version: "token-billing-missed-months-v1"
    monthKey: string
    identityID: string
    missedMonths: number
    wouldDeleteOnNextMiss: boolean
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

const normalizeBucketUsage = ( value: any ): TokenBillingBucketUsage => {
    return {
        name: String( value?.name ?? "" ),
        bucket: String( value?.bucket ?? "" ),
        projectCount: Number( value?.projectCount ?? 0 ) || 0,
        monthlyProjectTokenCost: Number( value?.monthlyProjectTokenCost ?? 0 ) || 0,
        tokensDue: Number( value?.tokensDue ?? 0 ) || 0
    }
}

const normalizeBillingPreviewUser = ( value: any ): OwnedTokenGroupBillingPreviewUser => {
    return {
        userSub: String( value?.userSub ?? "" ),
        identityID: String( value?.identityID ?? "" ),
        email: typeof value?.email === "string" ? value.email : undefined,
        given_name: typeof value?.given_name === "string" ? value.given_name : undefined,
        family_name: typeof value?.family_name === "string" ? value.family_name : undefined,
        projectCount: Number( value?.projectCount ?? 0 ) || 0,
        dueTokens: Number( value?.dueTokens ?? 0 ) || 0,
        missedMonths: Number( value?.missedMonths ?? 0 ) || 0,
        wouldDeleteOnNextMiss: value?.wouldDeleteOnNextMiss === true,
        bucketUsage: Array.isArray( value?.bucketUsage )
            ? value.bucketUsage.map(( bucket: any ) => normalizeBucketUsage( bucket ))
            : []
    }
}

const normalizeActiveBillingGroupIDs = ( value: any ) => {
    const fromArray = Array.isArray( value?.activeBillingGroupIDs )
        ? value.activeBillingGroupIDs
        : []
    const legacyID = value?.activeBillingGroupID === null || value?.activeBillingGroupID === undefined
        ? ""
        : String( value.activeBillingGroupID )
    const ids = [ ...fromArray, legacyID ]
        .map(( groupID: any ) => String( groupID ?? "" ).trim() )
        .filter(( groupID: string ) => groupID.length > 0 )

    return [ ...new Set( ids ) ]
}

const normalizePersonalBillingPreview = ( value: any ): PersonalTokenBillingPreview => {
    return {
        userSub: String( value?.userSub ?? "" ),
        identityID: String( value?.identityID ?? "" ),
        tokenBalance: Number( value?.tokenBalance ?? 0 ) || 0,
        activeBillingGroupID: value?.activeBillingGroupID === null || value?.activeBillingGroupID === undefined
            ? null
            : String( value.activeBillingGroupID ),
        activeBillingGroupIDs: normalizeActiveBillingGroupIDs( value ),
        billedToPersonal: value?.billedToPersonal === true,
        projectCount: Number( value?.projectCount ?? 0 ) || 0,
        dueTokens: Number( value?.dueTokens ?? 0 ) || 0,
        missedMonths: Number( value?.missedMonths ?? 0 ) || 0,
        wouldDeleteOnNextMiss: value?.wouldDeleteOnNextMiss === true,
        bucketUsage: Array.isArray( value?.bucketUsage )
            ? value.bucketUsage.map(( bucket: any ) => normalizeBucketUsage( bucket ))
            : []
    }
}

const normalizeOwnedBillingPreviewGroup = ( value: any ): OwnedTokenGroupBillingPreview => {
    return {
        groupID: String( value?.groupID ?? "" ),
        groupName: String( value?.groupName ?? "" ),
        tokenBalance: Number( value?.tokenBalance ?? 0 ) || 0,
        userCount: Number( value?.userCount ?? 0 ) || 0,
        projectCount: Number( value?.projectCount ?? 0 ) || 0,
        dueTokens: Number( value?.dueTokens ?? 0 ) || 0,
        maxMissedMonths: Number( value?.maxMissedMonths ?? 0 ) || 0,
        usersAtRiskCount: Number( value?.usersAtRiskCount ?? 0 ) || 0,
        users: Array.isArray( value?.users )
            ? value.users.map(( user: any ) => normalizeBillingPreviewUser( user ))
            : []
    }
}

const normalizeOwnedBillingPreviewResponse = ( value: any ): OwnedTokenGroupBillingPreviewResponse => {
    return {
        version: "owned-token-group-billing-preview-v1",
        monthKey: String( value?.monthKey ?? "" ),
        personal: normalizePersonalBillingPreview( value?.personal ),
        groups: Array.isArray( value?.groups )
            ? value.groups.map(( group: any ) => normalizeOwnedBillingPreviewGroup( group ))
            : [],
        warnings: Array.isArray( value?.warnings )
            ? value.warnings.map(( warning: any ) => String( warning ?? "" )).filter(( warning: string ) => warning.length > 0 )
            : []
    }
}

const normalizeMissedMonthsResponse = ( value: any ): TokenBillingMissedMonthsResponse => {
    return {
        version: "token-billing-missed-months-v1",
        monthKey: String( value?.monthKey ?? "" ),
        identityID: String( value?.identityID ?? "" ),
        missedMonths: Number( value?.missedMonths ?? 0 ) || 0,
        wouldDeleteOnNextMiss: value?.wouldDeleteOnNextMiss === true
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

var getOwnedGroupsBillingPreview = async function(){

    const url = import.meta.env.VITE_BASE_URL + "/tokens/billing/groups/owned/preview"
    const response = await apiFetch<OwnedTokenGroupBillingPreviewResponse>( url )
    return normalizeOwnedBillingPreviewResponse( response )
}

var getBillingMissedMonths = async function(){

    const url = import.meta.env.VITE_BASE_URL + "/tokens/billing/missed-months"
    const response = await apiFetch<TokenBillingMissedMonthsResponse>( url )
    return normalizeMissedMonthsResponse( response )
}

export default { balance,
                 createGroup,
                 listGroupsAndMembers,
                 addGroupMember,
                 removeGroupMember,
                 removeGroup,
                 getPersonalHistory,
                 getGroupHistory,
                 getOwnedGroupsHistorySummary,
                 getOwnedGroupsBillingPreview,
                 getBillingMissedMonths}
