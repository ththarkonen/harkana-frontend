import { Amplify } from 'aws-amplify'
import awsconfig from '@/aws-exports.js'
import axios from 'axios';

Amplify.configure( awsconfig )
const Auth = Amplify.Auth;

var apiParameters = async function(){

    const jwt = ( await Auth.currentSession() ).getIdToken().getJwtToken();

    var parameters =  {};
    parameters = {};
    parameters.jwt = jwt;

    return { params: parameters}
}

var balance = async function( groupID ){
    
    var parameters = await apiParameters();
    parameters.params.groupID = groupID;

    const api = import.meta.env.VITE_BASE_URL + "/tokens/balance";

    const response = await axios.get( api, parameters);
    const isError = response.data.hasOwnProperty("Error");

    if( isError ) throw new Error( response.data.Error );
    return response.data.balance;
}

var createGroup = async function( groupName ){
    
    var parameters = await apiParameters();
    parameters.params.tokenGroupName = groupName;

    const api = import.meta.env.VITE_BASE_URL + "/tokens/group/create";

    const response = await axios.get( api, parameters);
    const isError = response.data.hasOwnProperty("Error");

    if( isError ) throw new Error( response.data.Error );
    return response.data.balance;
}

var listGroupsAndMembers = async function(){
    
    var parameters = await apiParameters();

    const api = import.meta.env.VITE_BASE_URL + "/tokens/groups/owner";

    const response = await axios.get( api, parameters);
    const isError = response.data.hasOwnProperty("Error");

    if( isError ) throw new Error( response.data.Error );
    return response.data.groups;
}

var addGroupMember = async function( groupID, email){
    
    var parameters = await apiParameters();
    parameters.params.groupID = groupID;
    parameters.params.email = email;

    const api = import.meta.env.VITE_BASE_URL + "/tokens/group/add/member";

    const response = await axios.get( api, parameters);
    const isError = response.data.hasOwnProperty("Error");

    if( isError ) throw new Error( response.data.Error );
    return response.data;

}

var removeGroupMember = async function( groupID, userID){
    
    var parameters = await apiParameters();
    parameters.params.groupID = groupID;
    parameters.params.memberID = userID;

    const api = import.meta.env.VITE_BASE_URL + "/tokens/group/remove/member";

    const response = await axios.get( api, parameters);
    const isError = response.data.hasOwnProperty("Error");

    if( isError ) throw new Error( response.data.Error );
    return response.data;

}

var removeGroup = async function( groupName ){
    
    var parameters = await apiParameters();
    parameters.params.tokenGroupName = groupName;

    const api = import.meta.env.VITE_BASE_URL + "/tokens/group/delete";

    const response = await axios.get( api, parameters);
    const isError = response.data.hasOwnProperty("Error");

    if( isError ) throw new Error( response.data.Error );
    return response.data;

}

var buy = async function( groupID, quantity){
    
    var parameters = await apiParameters();
    parameters.params.priceID = "pri_01ka496prc6wkbwf6nqye15j3z";
    parameters.params.quantity = quantity;
    parameters.params.groupID = groupID;

    const api = import.meta.env.VITE_BASE_URL + "/checkout/session";

    const response = await axios.get( api, parameters);
    const isError = response.data.hasOwnProperty("Error");

    if( isError ) throw new Error( response.data.Error );
    window.location.href = response.data.url;
}

export default { balance,
                 createGroup,
                 listGroupsAndMembers,
                 addGroupMember,
                 removeGroupMember,
                 removeGroup,
                 buy}