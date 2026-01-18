import { Amplify, Storage} from 'aws-amplify';
import awsconfig from '@/aws-exports.js';
Amplify.configure( awsconfig );

import { setProjects, getProjects, setInfo, getInfo} from './helpers.js';

var updateFolders = async function( project, folders){

    folders.push("All projects");

    if( project.folders.includes("Shared with you") ){
        folders.push("Shared with you");
    };
    
    var projects = await getProjects();

    projects[ project.id ].folders = folders;
    await setProjects( projects );

    return projects;
}

var updateLastModified = async function( project ){

    const date = Date.now();

    var projectInfo = await getInfo( project );
    var projectList = await getProjects();

    projectInfo.lastModified = date;
    projectList[ project.id ].lastModified = date;

    console.log( projectInfo )

	await setInfo( projectInfo )
	await setProjects( projectList );
}

export {
    updateFolders,
    updateLastModified,
}