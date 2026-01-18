import { Amplify, Storage} from 'aws-amplify'
import awsconfig from '@/aws-exports.js'
Amplify.configure( awsconfig )

import share from "../sharing.js"

var setProjects = async function( projects ){

	const key = "projects.json"
	const accessSettings = { level: "private"}
	const projectsString = JSON.stringify( projects, null, 2)

	try {
		await Storage.put( key, projectsString, accessSettings)
	} catch (error) {
		return error
	}

    return null
}

var getProjects = async function(){

    var result
    const key = "projects.json"
    const accessSettings = { level: "private",
                             cacheControl: 'no-cache',
                             download: true}    
    try {
        result = await Storage.get( key, accessSettings)
    } catch (error) {
        if( error == "NoSuchKey: The specified key does not exist." ){
            await setProjects({})
            result = await Storage.get( key, accessSettings)
        } else {
            return error
        }
    }

    const projectsString = await new Response( result.Body ).text()
    const projects = JSON.parse( projectsString )

    for( const id in projects ){

        const project = projects[id]
        const shared = project.shared
        
        projects[id].checked = false

        if( shared ){
            
            const info = await getInfo( project )
            projects[id].lastModified = info.lastModified
            projects[id].projectName = info.projectName
        }
    }

    return projects
}

var setFolders = async function( folders ){

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

var getFolders = async function(){

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
            await setFolders( folders )
            result = await Storage.get( key, accessSettings)
        } else {
            return error
        }
    }

    const foldersString = await new Response( result.Body ).text()
    var folders = JSON.parse( foldersString )

    return folders
}

var setInfo = async function( projectInfo ){

    const key = projectInfo.id + "/info.json"
    const accessSettings = { level: "private"}
    const infoString = JSON.stringify( projectInfo, null, 2)

    try {
        await Storage.put( key, infoString, accessSettings)
    } catch (error) {
        return error
    }

    return null
}

var getInfo = async function( project ){

    if( project.shared ) return  share.load( project.shareInfo, "info")

    const key = project.id + "/info.json"
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

var getTransform = async function( project ){

    const key = project.id + "/transform.json"
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

export {
    setProjects,
    getProjects,
    setFolders,
    getFolders,
    setInfo,
    getInfo,
    getTransform
}   