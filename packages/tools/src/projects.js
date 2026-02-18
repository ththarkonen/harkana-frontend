import { Amplify, Storage} from 'aws-amplify';
import awsconfig from '@/aws-exports.js';

Amplify.configure( awsconfig );
const Auth = Amplify.Auth;

import utils from "./utils.js"
import share from "./sharing.js"
import settingslib from "./settings.js"
import calibrationlib from './projects/calibration.js';

import api from "./api/data.ts"
import create from './projects/constructors.js';
import { getProjects, setProjects, setInfo, getInfo} from './projects/helpers.js';

var upload = async function( file, tokenGroupID, progress){

	const accessSettings = { level: "private" };

	var projectList = await getProjects();

	const projectID = utils.generateID( projectList );
	const [ projectName, extension] = utils.parseProjectName( file );

	const rawFileName = "raw_" + projectName + "." + extension;

	const project = await create.project( projectID, projectName, rawFileName);
	const projectInfo = await create.info( project );
	
	const metadataKey = project.id + "/" + "metadata.json"; 
	const rawDataFileKey = project.id + "/" + rawFileName;
	const rawData = await file.arrayBuffer()

	try {
		await Storage.put( rawDataFileKey, rawData, accessSettings);
		progress.upload("success");
	} catch (error) {
		progress.upload("error");
		await remove( project );
		return error
	};

	try {
		await api.validate( project );
		await calibrationlib.setDefault( project );
		progress.validate("success");
	} catch (error) {
		progress.validate("error");
		await remove( project );
		return error
	}

	try {
		await api.estimate( project, tokenGroupID);
		progress.estimate("success");
	} catch (error) {
		progress.estimate("error");
		await remove( project );
		return error
	}

	try {
		const settings = await settingslib.getDefaultSettings();

		await Storage.put( metadataKey, settings.defaultMetadata, accessSettings);
	} catch (error) {
		await remove( project );
		return error
	};

	try {
		projectList[ project.id ] = project;

		await setInfo( projectInfo )
		await setProjects( projectList );

	} catch (error) {
		await remove( project );
		return error
	};

	return projectList;
}

var remove = async function( project ){

	var folders = await getFolders();
	for( const folderName in folders ){
		folders[ folderName ] = folders[ folderName ].filter( id => id != project.id );
	};
	await setFolders( folders );

	if( project.shared ) return deleteShared( project );

	const accessSettings = { level: "private",
							 identityId: project.owner.id,
							 pageSize: "ALL"};

	var projectFiles = await Storage.list( project.id + "/", accessSettings);
	var projectList = await getProjects();

	delete projectList[ project.id ];
	await setProjects( projectList );

	if( project.owner.id != Auth.Credentials._identityId ){
		return projectList;
	};

	const response = await share.removeProject( project )
	console.log( response )

	for( const file of projectFiles.results ){
		Storage.remove( file.key, accessSettings);
	};

	return projectList;
}

var deleteShared = async function( project ){

	console.log( "Deleting shared project" )

	await share.removeShared( project );
	const projectList = await getProjects();

	return projectList;
}

var rename = async function( project, name){

    const date = Date.now();

	var projectList = await list();
	var projectInfo = await getInfo( project );

	console.log( projectInfo )

	projectList[ project.id ].name = name;
    projectList[ project.id ].lastModified = date;

	projectInfo.name = name;
    projectInfo.lastModified = date;

	await setProjects( projectList );
	await setInfo( projectInfo );
	
	return projectList;
}

var list = async() => {

	const ownedProjects = await getProjects()
	const sharedProjects = await share.list()

	return { ...ownedProjects, ...sharedProjects}
}

import { copy } from "./projects/copy.js"
import { download } from "./projects/download.js"
import { updateFolders, updateLastModified} from "./projects/update.js"
import { setFolders, getFolders} from "./projects/helpers.js"

export default {
	upload,
	remove,
	list,
	setFolders,
	getFolders,
	rename,
	copy,
	download,
    updateFolders,
    updateLastModified,
	setInfo,
	getInfo
}