import { Amplify, Storage} from 'aws-amplify'
import awsconfig from '@/aws-exports.js'
Amplify.configure( awsconfig )

var set = async function( folders ){

	const key = "folders.json"
	const accessSettings = { level: "private"}
	const foldersString = JSON.stringify( folders, null, 2)

	try {
		await Storage.put( key, foldersString, accessSettings)
	} catch (error) {
		return error
	}

    return null
}

var get = async function(){

    const key = "folders.json"
    const accessSettings = { level: "private",
                             cacheControl: 'no-cache',
                             download: true}

    var result

    try {
        result = await Storage.get( key, accessSettings)
    } catch (error) {
        if( error == "NoSuchKey: The specified key does not exist." ){
            console.log("Project folders do not exist.")
            
            var folders = {}
            folders["All projects"] = []
            folders["Shared with you"] = []
            await set( folders )
            result = await Storage.get( key, accessSettings)
        } else {
            return error
        }
    }

    const foldersString = await new Response( result.Body ).text()
    var folders = JSON.parse( foldersString )

    return folders
}

export default { set, get}