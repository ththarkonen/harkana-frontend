import { Amplify, Storage} from 'aws-amplify'
import awsconfig from '@/aws-exports.js'
Amplify.configure( awsconfig )

export var set = async function( project, calibration){

    const key = project.id + "/calibration.json"
    const accessSettings = { level: "private"}
    const calibrationString = JSON.stringify( calibration, null, 2)

    try {
        await Storage.put( key, calibrationString, accessSettings)
    } catch (error) {
        return error
    }

    return null
}

export var get = async function( project ){

    const key = project.id + "/calibration.json"
    const accessSettings = { level: "private",
                             download: true}

    var result

    try {
        result = await Storage.get( key, accessSettings)
    } catch (error) {
        return error
    }

    const infoString = await new Response( result.Body ).text()
    const info = JSON.parse( infoString )

    return info
}

export var setDefault = async function( project ){

    const defaultCalibration = { x: 0};
    const response = await set( project, defaultCalibration);

    const isError = response instanceof Error;
    if( isError ) throw response;

    return response
}

export default {
    set,
    get,
    setDefault
}   