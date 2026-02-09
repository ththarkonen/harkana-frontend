import { Amplify } from 'aws-amplify'
import awsconfig from '@/aws-exports.js'
import axios from 'axios';

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


var estimate = async function( project, tokenGroupID){
    
    var parameters = await apiParameters( project );
    parameters.params.groupID = tokenGroupID;
    const api = import.meta.env.VITE_BASE_URL + "/data/estimate";

    const response = await axios.get( api, parameters);
    const isError = response.data.hasOwnProperty("Error");

    if( isError ) throw new Error( response.data.Error );
    return response;
}


var validate = async function( project ){

    const parameters = await apiParameters( project );
    const api = import.meta.env.VITE_BASE_URL + "/data/validate";

    const response = await axios.get( api, parameters);
    const isError = response.data.hasOwnProperty("Error");

    if( isError ) throw new Error( response.data.Error );
    return response;
}

export default { estimate, validate}
