import { Amplify, Storage} from 'aws-amplify';
import awsconfig from '@/aws-exports.js';
import utils from '../utils.js';
import { getProjects, setProjects, setInfo} from './helpers.js';

Amplify.configure( awsconfig );
const Auth = Amplify.Auth;

var copy = async function( sourceProject ){

    const project = {...sourceProject};
    var projects = await getProjects();

    console.log( project )

    const projectID = utils.generateID( projects );
    const accessSettings = { level: "private", 
                             identityId: project.owner.id,
                             pageSize: "ALL"};

    

    const projectFiles = await Storage.list( project.id + "/", accessSettings);

    const user = Auth.user;
    const userId = Auth.Credentials._identityId;

    const date = Date.now();

    var projectObject = {...project};
    projectObject.folders = ["All projects"];
    projectObject.id = projectID;
    projectObject.name = project.name + "(copy)";
    projectObject.projectPath = projectID;
    projectObject.lastModified = date;

    projectObject.owner = {};
    projectObject.owner.firstName = user.attributes.given_name;
    projectObject.owner.familyName = user.attributes.family_name;
    projectObject.owner.id = userId;

    var projectInfoObject = {};
    projectInfoObject.fileName = project.fileName;
    projectInfoObject.id = projectID;
    projectInfoObject.name = project.name + "(copy)";

    projectInfoObject.owner = {};
    projectInfoObject.owner.firstName = user.attributes.given_name;
    projectInfoObject.owner.familyName = user.attributes.family_name;
    projectInfoObject.owner.id = userId;
    projectInfoObject.lastModified = date;

    var promises = [];
    for( const file of projectFiles.results ){

        const targetKey = projectObject.id + "/" + file.key.substring( file.key.lastIndexOf("/") + 1 );
        
        const source = { key: file.key, identityId: project.owner.id, level: "private"};
        const target = { key: targetKey, identityId: userId, level: "private"};

        const copyCall = Storage.copy( source, target);
        promises.push( copyCall );
    };

    await Promise.all( promises );
    console.log("Project copied.")

    projects[projectID] = projectObject;

    await setInfo( projectInfoObject );
    await setProjects( projects );

    return projects;
}

export {
    copy
}