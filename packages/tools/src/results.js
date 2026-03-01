import { Amplify, Storage } from 'aws-amplify';
import awsconfig from '@/aws-exports.js';
Amplify.configure( awsconfig );

import { get as getCalibration, set as setCalibration} from './projects/calibration.js';
import share from "./sharing.js"

var load = async function( project, mode){

    if( project.shared ) return await share.load( project.shareInfo, mode + ".json")

    var result;
    const key = project.id + "/" + mode + ".json";
    const accessSettings = { level: "private", download: true};

    try {
        result = await Storage.get( key, accessSettings);
    } catch (error) {
        return error
    };

    result = await new Response( result.Body ).text();
    result = JSON.parse( result )

    return result;
};

var loadEstimate = async function( project ){
    return await load( project, "estimate")
}

var loadData = async function( project ){
    return await load( project, "data")
}

export default {
    load,
    loadData,
    loadEstimate,
    getCalibration,
    setCalibration
}