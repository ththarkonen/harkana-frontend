import { Amplify, Storage} from 'aws-amplify'
import awsconfig from '@/aws-exports.js'
import axios from 'axios';
import utils from "./utils.js"

Amplify.configure( awsconfig )
const Auth = Amplify.Auth;

var apiParameters = async function( project ){

    const jwt = ( await Auth.currentSession() ).getIdToken().getJwtToken();

    var parameters =  {};
    parameters = {};
    parameters.jwt = jwt;
    parameters.projectID = project.id;
    parameters.dataType = import.meta.env.VITE_DATA_TYPE

    return { params: parameters}
}

var draft = async function( project ){

    const parameters = await apiParameters( project );
    const api = import.meta.env.VITE_BASE_URL + "/zenodo/draft";

    const response = await axios.get( api, parameters);
    const isError = response.data.hasOwnProperty("Error");

    if( isError ) throw new Error( response.data.Error );
    return response;
}

var upload = async function( project, draftID, fileName){

    var parameters = await apiParameters( project );

    parameters.params.id = draftID;
    parameters.params.fileName = fileName;

    const api = import.meta.env.VITE_BASE_URL + "/zenodo/upload";

    var response = null;
    var isError = false;

    for( var ii = 1; ii <= 10; ii++ ){

        try{
        response = await axios.get( api, parameters);
        isError = response.data.hasOwnProperty("Error");
        console.log( isError, response )
        } catch (error) {
            console.log( error )
        }
        if( isError ){
            console.log( "upload failed, retrying" )
            console.log( response.data.Error )
            await utils.wait( 1000 * ii );
            continue;
        };

        break;
    };

    if( isError ) throw new Error( response.data.Error );
    return response;
}

var remove = async function( project, draftID){

    var parameters = await apiParameters( project );

    parameters.params.id = draftID;

    const api = import.meta.env.VITE_BASE_URL + "/zenodo/delete";

    const response = await axios.get( api, parameters);
    const isError = response.data.hasOwnProperty("Error");

    if( isError ) throw new Error( response.data.Error );
    return response;
}

var checkDraft = async function( project, draftID){
    
    var parameters = await apiParameters( project );
    parameters.params.id = draftID;

    const api = import.meta.env.VITE_BASE_URL + "/zenodo/check/draft";
    
    const response = await axios.get( api, parameters);
    const isError = response.data.hasOwnProperty("Error");
    
    if( isError ) throw new Error( response.data.Error );
    return response;
}

var checkToken = async function( project ){
    
    var parameters = await apiParameters( project );

    const api = import.meta.env.VITE_BASE_URL + "/zenodo/check/token";
    
    const response = await axios.get( api, parameters);
    const isError = response.data.hasOwnProperty("Error");
    
    if( isError ) throw new Error( response.data.Error );
    return response;
}

export default { draft, upload, remove, checkDraft, checkToken}