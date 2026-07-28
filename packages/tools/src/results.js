import { Amplify, Storage } from 'aws-amplify';
import awsconfig from '@/aws-exports.js'
import { configureAmplify } from './authConfig.js';
configureAmplify( Amplify, awsconfig );

import { get as getCalibration, set as setCalibration} from './projects/calibration.js';
import share from "./sharing.js"
import { parseJsonBytes, parseJsonString } from "./jsonParseWorkerClient.js"

var load = async function( project, mode, options = {} ){

    if( project.shared ){
        return await share.load( project.shareInfo, mode + ".json", options )
    }

    var result;
    const key = project.id + "/" + mode + ".json";
    const accessSettings = { level: "private", download: true};

    try {
        result = await Storage.get( key, accessSettings);
    } catch (error) {
        return error
    };

    if( options?.priority === "low" ){
        result = await new Response( result.Body ).arrayBuffer()
        result = await parseJsonBytes( result, {
            useWorker: true
        })
    } else {
        result = await new Response( result.Body ).text();
        result = await parseJsonString( result, {
            useWorker: false
        })
    }

    return result;
};

var loadEstimate = async function( project, options = {} ){
    return await load( project, "estimate", options )
}

var loadData = async function( project, options = {} ){
    return await load( project, "data", options )
}

var set = async function( project, mode, value ){

    if( project.shared ){
        throw new Error( "Shared projects are read-only." )
    }

    const key = project.id + "/" + mode + ".json"
    const accessSettings = {
        level: "private",
        contentType: "application/json"
    }

    const payload = JSON.stringify( value, null, 2 )
    await Storage.put( key, payload, accessSettings )

    return value
}

export default {
    load,
    loadData,
    loadEstimate,
    set,
    getCalibration,
    setCalibration
}
