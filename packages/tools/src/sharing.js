import { Amplify } from 'aws-amplify'
import awsconfig from '@/aws-exports.js'
import axios from 'axios';
import utils from "./utils.js"

Amplify.configure( awsconfig )
const Auth = Amplify.Auth;

var apiParameters = async function( project ){

    const user = await Auth.currentAuthenticatedUser();
    const jwt = ( await Auth.currentSession() ).getIdToken().getJwtToken();
    const credentials = await Amplify.Auth.currentCredentials();
    const tokens = await Amplify.Auth.essentialCredentials( credentials );

    var parameters =  {};
    parameters = {};
    parameters.jwt = jwt;
    parameters.dataType = import.meta.env.VITE_DATA_TYPE

    parameters.projectID = project.id;
    parameters.key = "private/" + tokens.identityId + "/" + project.id;
    parameters.zenodoKey = "private/" + tokens.identityId + "/zenodo.json";

    parameters.name = user.attributes.given_name;
    parameters.family = user.attributes.family_name;

    return { params: parameters, headers: {"Authorization" : `Bearer ${jwt}`}}
}

var list = async function(){

    var parameters = await apiParameters( {id: null} );
    
    const api = import.meta.env.VITE_BASE_URL + "/share/list/projects";

    const response = await axios.get( api, parameters);
    const isError = response.data.hasOwnProperty("Error");

    if( isError ) throw new Error( response.data.Error );
    const shareInfos = response.data;
    const nShares = shareInfos.length;

    if( nShares == 0 ) return [];
    
    var sharedProjects = {};

    for( var ii = 0; ii < nShares; ii++ ){

        const shareInfo = shareInfos[ii]
        var projectInfo = await load( shareInfo, "info.json")

        projectInfo.shared = true;
        projectInfo.rawid = projectInfo.id;
        projectInfo.id = shareInfo.projectKey;
        projectInfo.shareInfo = shareInfo;

        sharedProjects[ projectInfo.id ] = projectInfo;
    };

    return sharedProjects
}


var load = async function( shareInfo, fileName){

    var parameters = await apiParameters( { id: null} );
    parameters.params.projectID = shareInfo.projectId;
    parameters.params.projectKey = shareInfo.projectKey;
    parameters.params.key = fileName;

    const api = import.meta.env.VITE_BASE_URL + "/share/geturl";
    const response = await axios.get( api, parameters);
    const isError = response.data.hasOwnProperty("Error");

    if( isError ) throw new Error( response.data.Error );

    try{
        var result = await fetch( response.data.url );
        return await result.json()
    } catch( error ){
        console.log( error )
        throw new Error("The shared project is not available at the moment. Please try again later.");
    };
}

var loadResponse = async function( shareInfo, fileName){

    var parameters = await apiParameters( { id: null} );
    parameters.params.projectID = shareInfo.projectId;
    parameters.params.projectKey = shareInfo.projectKey;
    parameters.params.key = fileName;

    const api = import.meta.env.VITE_BASE_URL + "/share/geturl";
    const response = await axios.get( api, parameters);
    const isError = response.data.hasOwnProperty("Error");

    if( isError ) throw new Error( response.data.Error );

    try{
        var result = await fetch( response.data.url );
        return result
    } catch( error ){
        console.log( error )
        throw new Error("The shared project is not available at the moment. Please try again later.");
    };
}

var removeShared = async function( project ){

    if( !project.shared ) throw new Error("Project is owner by the user.");

    var parameters = await apiParameters( project );
    parameters.params.projectKey = project.id;

    const api = import.meta.env.VITE_BASE_URL + "/share/remove/project";
    const response = await axios.get( api, parameters);
    const isError = response.data.hasOwnProperty("Error");

    if( isError ) throw new Error( response.data.Error );
    return response.data;
}


var listSharedFiles = async function( project ){

    if( !project.shared ) throw new Error("Project is owner by the user.");

    var parameters = await apiParameters( project );
    parameters.params.projectKey = project.id;
    parameters.params.projectID = project.rawid;

    const api = import.meta.env.VITE_BASE_URL + "/share/list/files";
    const response = await axios.get( api, parameters);
    const isError = response.data.hasOwnProperty("Error");

    if( isError ) throw new Error( response.data.Error );
    return response.data;
}


var listCollaborators = async function( project ){

    if( project.shared ) throw new Error("Project is not owned by user. Cannot list collaborators.");

    var parameters = await apiParameters( project );
    parameters.params.projectKey = project.id;
    parameters.params.projectID = project.id;

    const api = import.meta.env.VITE_BASE_URL + "/share/list/collaborators";
    const response = await axios.get( api, parameters);
    const isError = response.data.hasOwnProperty("Error");

    if( isError ) throw new Error( response.data.Error );
    return response.data;
}


var addCollaborator = async function( project, email ){

    if( project.shared ) throw new Error("Project is not owned by user. Cannot remove collaborator.");

    var parameters = await apiParameters( project );
    parameters.params.projectKey = project.id;
    parameters.params.projectID = project.id;
    parameters.params.email = email;

    const api = import.meta.env.VITE_BASE_URL + "/share/add/collaborator";
    const response = await axios.get( api, parameters);
    const isError = response.data.hasOwnProperty("Error");

    if( isError ) throw new Error( response.data.Error );
    return response.data;
}


var removeCollaborator = async function( project, id){

    if( project.shared ) throw new Error("Project is not owned by user. Cannot remove collaborator.");

    var parameters = await apiParameters( project );
    parameters.params.projectKey = project.id;
    parameters.params.projectID = project.id;
    parameters.params.collaboratorID = id;

    const api = import.meta.env.VITE_BASE_URL + "/share/remove/collaborator";
    const response = await axios.get( api, parameters);
    const isError = response.data.hasOwnProperty("Error");

    if( isError ) throw new Error( response.data.Error );
    return response.data;
}


var removeProject = async function( project ){

    if( project.shared ) throw new Error("Project is not owned by user. Cannot remove the project.");

    var parameters = await apiParameters( project );
    parameters.params.projectKey = project.id;
    parameters.params.projectID = project.id;

    const api = import.meta.env.VITE_BASE_URL + "/share/remove/all";
    const response = await axios.get( api, parameters);
    const isError = response.data.hasOwnProperty("Error");

    if( isError ) throw new Error( response.data.Error );
    return response.data;
}

export default {
    addCollaborator,
    removeCollaborator,
    listCollaborators,
    list,
    load,
    loadResponse,
    removeShared,
    listSharedFiles,
    removeProject
}