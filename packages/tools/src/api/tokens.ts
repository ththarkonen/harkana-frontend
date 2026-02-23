import { apiFetch, buildQueryString } from './http'

type BalanceApiResponse = {
    balance: number
    [key: string]: any
}

type GenericApiResponse = {
    [key: string]: any
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

export default { balance,
                 createGroup,
                 listGroupsAndMembers,
                 addGroupMember,
                 removeGroupMember,
                 removeGroup}