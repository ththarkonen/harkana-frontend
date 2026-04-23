import { Amplify, Storage} from 'aws-amplify';
import awsconfig from '@/aws-exports.js';

Amplify.configure( awsconfig );
const Auth = Amplify.Auth;

import utils from "./utils.js"
import share from "./sharing.js"
import settingslib from "./settings.js"
import calibrationlib from './projects/calibration.js';

import api from "./api/data.ts"
import hyperspectra from "./api/hyperspectra.ts"

import create from './projects/constructors.js';
import { getProjects, setProjects, setInfo, getInfo} from './projects/helpers.js';

var formatPercentage = ( progress, state) => {

	var percentage = state.loaded / state.total;
	percentage = Number.parseFloat( percentage * 100 ).toFixed(1);
	progress.uploadPercentage( String( percentage ) + "%" )
}

var sanitizeProjectName = function( value ){

	const normalized = String( value ?? "" )
		.replace(/\.ome\.tiff?$/i, "")
		.replace(/\.tiff?$/i, "")
		.replace(/\.zarr$/i, "")
		.replace(/[^a-zA-Z0-9]/g, "_")
		.replace(/^_+|_+$/g, "")

	return normalized.length > 0 ? normalized : "project"
}

var createHyperspectrumProjectContext = async function( projectName, rawFileName ){

	var projectList = await getProjects();

	const projectID = utils.generateID( projectList );
	const normalizedProjectName = sanitizeProjectName( projectName );

	const project = await create.project( projectID, normalizedProjectName, rawFileName );
	const projectInfo = await create.info( project );

	return {
		projectList,
		project,
		projectInfo
	}
}

var persistHyperspectrumProject = async function( projectContext, response ){

	projectContext.project.status = response.status
	projectContext.project.jobId = response.jobId

	projectContext.projectInfo.status = response.status
	projectContext.projectInfo.jobId = response.jobId

	projectContext.projectList[ projectContext.project.id ] = projectContext.project;

	await setInfo( projectContext.projectInfo )
	await setProjects( projectContext.projectList )

	return projectContext.projectList;
}

var resolveOmeZarrDatasets = function( fileList ){

	const files = Array.from( fileList ?? [] )
	if( files.length === 0 ){
		throw new Error( "No OME-Zarr files were selected." )
	}

	var datasetsByRootPath = new Map()

	for( const file of files ){
		const rawRelativePath = typeof file?.webkitRelativePath === "string" && file.webkitRelativePath.length > 0
			? file.webkitRelativePath
			: file.name
		const segments = rawRelativePath.split( "/" ).filter( Boolean )
		const rootIndex = segments.findIndex(( segment ) => /\.zarr$/i.test( segment ))

		if( rootIndex === -1 ){
			throw new Error( "Select a folder containing one or more .zarr datasets." )
		}

		const candidateRootPath = segments.slice( 0, rootIndex + 1 ).join( "/" )
		const candidateRootName = segments[ rootIndex ]
		const relativePath = segments.slice( rootIndex + 1 ).join( "/" )
		const existingDataset = datasetsByRootPath.get( candidateRootPath ) ?? {
			datasetRootPath: candidateRootPath,
			datasetRootName: candidateRootName,
			projectName: sanitizeProjectName( candidateRootName ),
			rawFileName: candidateRootName,
			files: []
		}

		if( relativePath.length === 0 ){
			datasetsByRootPath.set( candidateRootPath, existingDataset )
			continue
		}

		existingDataset.files.push({
			file,
			relativePath,
			displayPath: candidateRootName + "/" + relativePath
		})
		datasetsByRootPath.set( candidateRootPath, existingDataset )
	}

	const datasets = Array.from( datasetsByRootPath.values() )
		.filter(( dataset ) => Array.isArray( dataset?.files ) && dataset.files.length > 0 )
		.sort(( left, right ) => {
			return String( left?.datasetRootPath ?? "" ).localeCompare( String( right?.datasetRootPath ?? "" ))
		})

	if( datasets.length === 0 ){
		throw new Error( "The selected folder did not contain any uploadable .zarr datasets." )
	}

	return datasets
}

var buildPrivateS3Uri = function( project, relativeKey ){

	const bucket = String( awsconfig?.aws_user_files_s3_bucket ?? "" ).trim()
	const identityID = String( project?.owner?.id ?? Auth.Credentials?._identityId ?? "" ).trim()
	const projectID = String( project?.id ?? "" ).trim()
	const keySuffix = String( relativeKey ?? "" ).trim().replace(/^\/+/, "")

	if( bucket.length === 0 || identityID.length === 0 || projectID.length === 0 || keySuffix.length === 0 ){
		throw new Error( "Failed to resolve the hyperspectral source location." )
	}

	return "s3://" + bucket + "/private/" + identityID + "/" + projectID + "/" + keySuffix
}

var uploadOmeZarrDataset = async function( project, omeZarrDataset, progress ){

	const totalFiles = omeZarrDataset.files.length
	const totalBytes = omeZarrDataset.files.reduce(( sum, entry ) => {
		return sum + Math.max( 0, Number( entry?.file?.size ?? 0 ) || 0 )
	}, 0 )

	var uploadedBytes = 0

	for( var index = 0; index < totalFiles; index++ ){

		const entry = omeZarrDataset.files[ index ]
		const fileKey = project.id + "/" + omeZarrDataset.datasetRootName + "/" + entry.relativePath

		if( typeof progress?.file === "function" ){
			progress.file({
				name: entry.displayPath,
				index: index + 1,
				totalFiles
			})
		}

		const fileSize = Math.max( 0, Number( entry?.file?.size ?? 0 ) || 0 )
		await Storage.put( fileKey, entry.file, {
			level: "private",
			progressCallback: ( state ) => {
				const loadedBytes = Math.min( fileSize, Math.max( 0, Number( state?.loaded ?? 0 ) || 0 ))
				const totalLoadedBytes = uploadedBytes + loadedBytes
				const denominator = totalBytes > 0 ? totalBytes : 1
				const percentage = Number.parseFloat(( totalLoadedBytes / denominator ) * 100 ).toFixed(1)
				progress.uploadPercentage( String( percentage ) + "%" )
			}
		})

		uploadedBytes += fileSize
	}

	progress.uploadPercentage( "100.0%" )
}

var prepareHyperspectrumOmeZarrDataset = async function( omeZarrDataset, progress ){
	const projectContext = await createHyperspectrumProjectContext(
		omeZarrDataset.projectName,
		omeZarrDataset.rawFileName
	)

	try {
		await uploadOmeZarrDataset( projectContext.project, omeZarrDataset, progress )
		progress.upload("success");
	} catch (error) {
		progress.upload("error");
		await remove( projectContext.project );
		return error
	}

	const inputS3Uri = buildPrivateS3Uri( projectContext.project, omeZarrDataset.datasetRootName )

	try {
		const inspectResponse = await hyperspectra.inspectSource( projectContext.project, {
			inputS3Uri
		})
		progress.validate("success");

		return {
			...projectContext,
			inputS3Uri,
			inspectResponse,
			datasetRootName: omeZarrDataset.datasetRootName
		}
	} catch (error) {
		progress.validate("error");
		await remove( projectContext.project );
		return error
	}
}

var listHyperspectrumOmeZarrDatasets = function( fileList ){
	return resolveOmeZarrDatasets( fileList )
}

var resolveOmeTiffDatasets = function( fileList ){

	const files = Array.from( fileList ?? [] )
	if( files.length === 0 ){
		throw new Error( "No OME-TIFF files were selected." )
	}

	const datasets = files
		.filter(( file ) => {
			const fileName = String( file?.name ?? "" ).trim().toLowerCase()
			return fileName.endsWith( ".ome.tif" ) || fileName.endsWith( ".ome.tiff" ) || fileName.endsWith( ".tif" ) || fileName.endsWith( ".tiff" )
		})
		.map(( file ) => {
			const fileName = String( file?.name ?? "" ).trim()
			return {
				file,
				projectName: sanitizeProjectName( fileName ),
				rawFileName: fileName
			}
		})
		.sort(( left, right ) => String( left?.rawFileName ?? "" ).localeCompare( String( right?.rawFileName ?? "" )))

	if( datasets.length === 0 ){
		throw new Error( "Select one or more OME-TIFF files." )
	}

	return datasets
}

var uploadOmeTiffDataset = async function( project, omeTiffDataset, progress ){

	const fileName = String( omeTiffDataset?.rawFileName ?? "" ).trim()
	const fileKey = project.id + "/" + fileName

	if( typeof progress?.file === "function" ){
		progress.file({
			name: fileName,
			index: 1,
			totalFiles: 1
		})
	}

	await Storage.put( fileKey, omeTiffDataset.file, {
		level: "private",
		progressCallback: ( state ) => formatPercentage( progress, state )
	})

	progress.uploadPercentage( "100.0%" )
}

var prepareHyperspectrumOmeTiffDataset = async function( omeTiffDataset, progress ){

	const projectContext = await createHyperspectrumProjectContext(
		omeTiffDataset.projectName,
		omeTiffDataset.rawFileName
	)

	try {
		await uploadOmeTiffDataset( projectContext.project, omeTiffDataset, progress )
		progress.upload("success");
	} catch (error) {
		progress.upload("error");
		await remove( projectContext.project );
		return error
	}

	const inputS3Uri = buildPrivateS3Uri( projectContext.project, omeTiffDataset.rawFileName )

	try {
		const inspectResponse = await hyperspectra.inspectSource( projectContext.project, {
			inputS3Uri
		})
		progress.validate("success");

		return {
			...projectContext,
			inputS3Uri,
			inspectResponse,
			rawFileName: omeTiffDataset.rawFileName
		}
	} catch (error) {
		progress.validate("error");
		await remove( projectContext.project );
		return error
	}
}

var listHyperspectrumOmeTiffDatasets = function( fileList ){
	return resolveOmeTiffDatasets( fileList )
}

var launchHyperspectrumOmeZarrAnalysis = async function( preparedProject, tokenGroupID, analysisRequest ){

	try {
		const response = await hyperspectra.launchOmeZarrAnalysis(
			preparedProject.project,
			tokenGroupID,
			{
				...analysisRequest,
				inputS3Uri: String(
					analysisRequest?.inputS3Uri
					?? preparedProject?.inspectResponse?.source?.s3Uri
					?? preparedProject?.inputS3Uri
					?? ""
				).trim()
			}
		)

		return await persistHyperspectrumProject( preparedProject, response )
	} catch (error) {
		return error
	}
}

var launchHyperspectrumOmeTiffAnalysis = async function( preparedProject, tokenGroupID, analysisRequest ){

	try {
		const response = await hyperspectra.launchOmeTiffAnalysis(
			preparedProject.project,
			tokenGroupID,
			{
				...analysisRequest,
				inputS3Uri: String(
					analysisRequest?.inputS3Uri
					?? preparedProject?.inspectResponse?.source?.s3Uri
					?? preparedProject?.inputS3Uri
					?? ""
				).trim()
			}
		)

		return await persistHyperspectrumProject( preparedProject, response )
	} catch (error) {
		return error
	}
}

var upload = async function( file, tokenGroupID, progress){

	const accessSettings = { level: "private",
							 progressCallback: (state) => formatPercentage( progress, state)
	};

	var projectList = await getProjects();

	const projectID = utils.generateID( projectList );
	const [ projectName, extension] = utils.parseProjectName( file );

	const rawFileName = "raw_" + projectName + "." + extension;

	const project = await create.project( projectID, projectName, rawFileName);
	const projectInfo = await create.info( project );
	
	const metadataKey = project.id + "/" + "metadata.json"; 
	const rawDataFileKey = project.id + "/" + rawFileName;

	try {
		await Storage.put( rawDataFileKey, file, accessSettings);
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

var hyperspectrum = async function( file, tokenGroupID, progress){
	const accessSettings = { level: "private",
							 progressCallback: (state) => formatPercentage( progress, state)
	};
	const [ projectName, extension] = utils.parseProjectName( file );
	const rawFileName = "raw_" + projectName + "." + extension;
	const projectContext = await createHyperspectrumProjectContext( projectName, rawFileName );
	const project = projectContext.project
	 
	const rawDataFileKey = project.id + "/" + rawFileName;

	try {
		await Storage.put( rawDataFileKey, file, accessSettings);
		progress.upload("success");
	} catch (error) {
		progress.upload("error");
		await remove( project );
		return error
	};

	var response

	try {
		response = await hyperspectra.parse( project, tokenGroupID);
		progress.validate("success");
		console.log( response )
	} catch (error) {
		progress.validate("error");
		await remove( project );
		return error
	}

	try {
		return await persistHyperspectrumProject( projectContext, response )
	} catch (error) {
		await remove( project );
		return error
	};
}

const PROJECT_DELETE_FILE_CONCURRENCY = 16
const PROJECT_DELETE_FILE_RETRIES = 2
const PROJECT_DELETE_FILE_RETRY_DELAY_MS = 200

var removeProjectFileWithRetry = async function( fileKey, accessSettings ){

	var lastError = null

	for( var attempt = 0; attempt <= PROJECT_DELETE_FILE_RETRIES; attempt++ ){
		try{
			await Storage.remove( fileKey, accessSettings )
			return
		} catch( error ){
			lastError = error

			if( attempt >= PROJECT_DELETE_FILE_RETRIES ){
				break
			}

			await utils.wait( PROJECT_DELETE_FILE_RETRY_DELAY_MS * ( attempt + 1 ))
		}
	}

	throw lastError
}

var removeProjectFiles = async function( projectFiles, accessSettings, onProgress = null ){

	const files = Array.isArray( projectFiles?.results ) ? projectFiles.results : []
	const totalFiles = files.length
	var deletedFiles = 0

	if( typeof onProgress === "function" ){
		onProgress({
			stage: "deleting-files",
			deletedFiles,
			totalFiles
		})
	}

	if( totalFiles === 0 ) return

	for( var index = 0; index < totalFiles; index += PROJECT_DELETE_FILE_CONCURRENCY ){
		const batch = files.slice( index, index + PROJECT_DELETE_FILE_CONCURRENCY )

		await Promise.all(
			batch.map( async( file ) => {
				await removeProjectFileWithRetry( file.key, accessSettings )
				deletedFiles += 1

				if( typeof onProgress === "function" ){
					onProgress({
						stage: "deleting-files",
						deletedFiles,
						totalFiles
					})
				}
			})
		)
	}
}

var remove = async function( project, options = {} ){

	const onProgress = typeof options?.onProgress === "function" ? options.onProgress : null

	var folders = await getFolders();
	for( const folderName in folders ){
		folders[ folderName ] = folders[ folderName ].filter( id => id != project.id );
	};
	await setFolders( folders );

	if( project.shared ) return deleteShared( project );

	const accessSettings = { level: "private",
							 identityId: project.owner.id,
							 pageSize: "ALL"};

	if( onProgress ){
		onProgress({
			stage: "listing-files",
			deletedFiles: 0,
			totalFiles: 0
		})
	}

	var projectFiles = await Storage.list( project.id + "/", accessSettings);
	var projectList = await getProjects();

	delete projectList[ project.id ];
	await setProjects( projectList );

	if( project.owner.id != Auth.Credentials._identityId ){
		return projectList;
	};

	const response = await share.removeProject( project )
	console.log( response )

	await removeProjectFiles( projectFiles, accessSettings, onProgress )

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
	var sharedProjects = {}

	try{
		sharedProjects = await share.list()
	} catch( error ){
		console.log( error )
		sharedProjects = {}
	}

	var ownedProjectsReady = {}

	for( const [ id, project] of Object.entries( ownedProjects ) ){

		const hasStatus = project.hasOwnProperty("status")
		
		if( !hasStatus ){
			ownedProjectsReady[ id ] = project
			continue
		}

		if( hasStatus ){

			if( project.status === "SUCCEEDED" ){
				ownedProjectsReady[ id ] = project
				continue
			}

			const response = await hyperspectra.status( project )
			
			if( response.status === "SUCCEEDED" ){

				var projectInfo = await getInfo( project )

				ownedProjects[id].status = response.status
				projectInfo.status = response.status

				await setInfo( projectInfo )

				project.status = response.status
				ownedProjectsReady[ id ] = project
				continue
			} else if( response.status === "FAILED" ){
				await remove( project )
				continue
			}
		}

	}

	await setProjects( ownedProjects )
	return { ...ownedProjectsReady, ...sharedProjects}
}

var listProcessing = async() => {

	const ownedProjects = await getProjects()
	var processing = {}

	for( const [ id, project] of Object.entries( ownedProjects ) ){

		const hasStatus = project.hasOwnProperty("status")
		if( !hasStatus ) continue

		if( project.status === "SUCCEEDED" ) continue
		else processing[id] = project
	}

	return processing
}

import { copy } from "./projects/copy.js"
import { download } from "./projects/download.js"
import { updateFolders, updateLastModified} from "./projects/update.js"
import { setFolders, getFolders} from "./projects/helpers.js"

export default {
	upload,
	hyperspectrum,
	listHyperspectrumOmeZarrDatasets,
	prepareHyperspectrumOmeZarrDataset,
	launchHyperspectrumOmeZarrAnalysis,
	listHyperspectrumOmeTiffDatasets,
	prepareHyperspectrumOmeTiffDataset,
	launchHyperspectrumOmeTiffAnalysis,
	remove,
	list,
	listProcessing,
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
