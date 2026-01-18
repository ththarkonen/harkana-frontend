import { Amplify, Storage} from 'aws-amplify'
import awsconfig from '@/aws-exports.js'
Amplify.configure( awsconfig )

var set = async function( settings ){

    console.log( settings )

	const key = "settings.json"
	const accessSettings = { level: "private"}
	const settingsString = JSON.stringify( settings, null, 2)

	try {
		await Storage.put( key, settingsString, accessSettings)
	} catch (error) {
		return error
	}

    return null
}

var get = async function(){

    const key = "settings.json"
    const accessSettings = { level: "private", download: true}

    var result

    try {
        result = await Storage.get( key, accessSettings)
    } catch (error) {
        return await getDefaultSettings()
    }

    const settingsString = await new Response( result.Body ).text()
    const settings = JSON.parse( settingsString )

    return settings
}

var getDefaultSettings = async function() {
    return {
        layout: {
            reversed: "true",
            layout: "vertical"
        },
        labels: {
            horizontal: "\\nu",
            vertical: "y"
        },
        legends: {
            data: "y",
            median: "\\text{Im}\\,\\mathcal{X}^{(3)}_{\\text{median}}( \\nu )",
            interval50: "\\text{Im}\\,\\mathcal{X}^{(3)}_{50\\%}( \\nu )",
            interval75: "\\text{Im}\\,\\mathcal{X}^{(3)}_{75\\%}( \\nu )",
            interval90: "\\text{Im}\\,\\mathcal{X}^{(3)}_{90\\%}( \\nu )",
            interval95: "\\text{Im}\\,\\mathcal{X}^{(3)}_{95\\%}( \\nu )"
        },
        font: {
            sizes: {
                axis: 16,
                label: 16,
                legend: 16
            }
        },
        colors: {
            data: "#1f77b4",
            median: "#333333",
            area: "#333333",
            opacity: 0.15
        },
        comparisonColors: {
            data: "#d62728",
            median: "#d62728",
            area: "#d62728",
            opacity: 0.15
        },
        visibility: {
            plot: {
                data: true,
                median: true,
                interval50: true,
                interval75: true,
                interval90: true,
                interval95: true
            },
            comparison: {
                data: true,
                median: true,
                interval50: false,
                interval75: false,
                interval90: false,
                interval95: true,
            },
        },
        defaultMetadata: {
            Measurement: {
                time: "",
                person: "",
                device: "",
                location: "",
            },
            Sample: {
                type: ""
            }
        }
    };
}

var setZenodo = async function( settings ){

	const key = "zenodo.json"
	const accessSettings = { level: "private"}
	const settingsString = JSON.stringify( settings, null, 2)

	try {
		await Storage.put( key, settingsString, accessSettings)
	} catch (error) {
		return error
	}

    return null
}

var getZenodo = async function(){

    const key = "zenodo.json"
    const accessSettings = { level: "private", download: true}

    var result

    try {
        result = await Storage.get( key, accessSettings)
    } catch (error) {
        return await getDefaultSettings()
    }

    const settingsString = await new Response( result.Body ).text()
    const settings = JSON.parse( settingsString )

    return settings
}

var setBilling = async function( settings ){

	const key = "billing.json"
	const accessSettings = { level: "private"}
	const settingsString = JSON.stringify( settings, null, 2)

	try {
		await Storage.put( key, settingsString, accessSettings)
	} catch (error) {
        console.log( error )
		return error
	}

    return null
}

var getBilling = async function(){

    const key = "billing.json"
    const accessSettings = { level: "private", download: true}

    var result

    try {
        result = await Storage.get( key, accessSettings)
    } catch (error) {
        console.log( error )

        if( error == "NoSuchKey: The specified key does not exist." ){
            return {"groupID": "", "groupName": "Personal token balance"}
        }

        return error
    }

    const settingsString = await new Response( result.Body ).text()
    const settings = JSON.parse( settingsString )

    if( settings.hasOwnProperty("groupId") ) settings.groupID = settings.groupId
    return settings
}

var getDefaultZenodo = async function() {

    const dataType = import.meta.env.VITE_APP_NAME

    return {
        title: dataType + " dataset for [SAMPLE]. These are default values which you can edit and save.",
        description: "This is a " + dataType + " measurement of [SAMPLE]. The dataset contains the measurement data, estimated spectrum with uncertainty estimates, and metadata.",
        keywords: dataType + ", measurement",
        token: "123456789"
    };
}

export default { set,
                 get,
                 setZenodo,
                 getZenodo,
                 getDefaultSettings,
                 getDefaultZenodo,
                 setBilling,
                 getBilling}