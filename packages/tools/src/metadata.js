import { Amplify, Storage } from 'aws-amplify';
import awsconfig from '@/aws-exports.js';
Amplify.configure( awsconfig );

import sanitize from "./sanitize.js"
import share from "./sharing.js"
import settingslib from "./settings.js"
import { updateLastModified } from './projects/update.js';

var upload = async function( project, file){

	try {
		await sanitize.metadata( file );
	} catch (error) {
		return error;
	};	

	const key = project.id + "/metadata.json";
	const accessSettings = { level: "private" };

	try {
		await Storage.put( key, file, accessSettings);
	} catch (error) {
		return error;
	};

	await updateLastModified( project )
	return null;
}

var load = async function( project ){

	if( project.shared ) return await share.load( project.shareInfo, "metadata.json")

	const metadataKey = project.id + "/metadata.json";
	const accessSettings = { level: "private",
							 identityId: project.owner.id,
							 cacheControl: 'no-cache',
							 download: true};

	var result;

	try {
		result = await Storage.get( metadataKey, accessSettings);
	} catch (error) {
		console.log("Metadata not found: ", error);
		console.log("Loading default metadata template.");

		const settings = await settingslib.getDefaultSettings();
		return settings.defaultMetadata;
	};

	const projectListString = await new Response( result.Body ).text();
	const projectList = JSON.parse( projectListString );

	return projectList;
}

var set = function( obj, path, value) {

	var metadata = structuredClone( obj )

	if (path.endsWith('.') || path.trim().endsWith(' '))  return metadata
	if (!path || typeof path !== "string") return metadata;

	const pathParts = path.match(/[^.[\]]+/g); // Matches keys and indices

	let current = metadata;
	for (let i = 0; i < pathParts.length; i++) {
		const key = isNaN(pathParts[i]) ? pathParts[i] : Number(pathParts[i]);

		if (i === pathParts.length - 1) {
			current[key] = value;
		} else {
			const nextKey = isNaN(pathParts[i + 1]) ? pathParts[i + 1] : Number(pathParts[i + 1]);

			if (!(key in current)) {
				// Create array or object based on next key
				current[key] = typeof nextKey === "number" ? [] : {};
			}

			current = current[key];
		}
	}

	return metadata
}

var remove = function( obj, path) {

	var metadata = structuredClone( obj )

	if (path.endsWith('.') || path.trim().endsWith(' ')) return metadata
	if (!path || typeof path !== "string") return metadata;

	const pathParts = path.match(/[^.[\]]+/g); // Parse dot and bracket notation
	if (!pathParts || pathParts.length === 0) return metadata;
  
	let current = metadata;
	for (let i = 0; i < pathParts.length - 1; i++) {
	  const key = isNaN(pathParts[i]) ? pathParts[i] : Number(pathParts[i]);
	  if (!(key in current)) return metadata; // Nothing to delete
	  current = current[key];
	}
  
	const lastKey = isNaN(pathParts.at(-1)) ? pathParts.at(-1) : Number(pathParts.at(-1));
	delete current[lastKey];

	return metadata
  }

export default {
	upload,
    load,
	set,
	remove,
}