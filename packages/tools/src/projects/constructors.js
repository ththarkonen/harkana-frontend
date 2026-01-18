import { Amplify } from 'aws-amplify'
import awsconfig from '@/aws-exports.js'

Amplify.configure( awsconfig )
const Auth = Amplify.Auth;

var project = async function( id, fileName, rawFileName){

	const date = Date.now();
	const user = Auth.user;
	const userID = Auth.Credentials._identityId;

	var project = {};
	project.id = id;
	project.name = fileName;
	project.rawFileName = rawFileName;
	project.version = import.meta.env.VITE_VERSION;
	project.folders = ["All projects"];
	project.state = "Ready";
    project.lastModified = date;

	project.owner = {};
	project.owner.firstName = user.attributes.given_name;
	project.owner.familyName = user.attributes.family_name;
	project.owner.id = userID;

    return project;
}

var info = async function( project ){

	var projectInfoObject = {};
	projectInfoObject.id = project.id;
	projectInfoObject.rawFileName = project.rawFileName;
	projectInfoObject.name = project.name;
	projectInfoObject.version = project.version;
    projectInfoObject.lastModified = project.lastModified;

	projectInfoObject.owner = {};
	projectInfoObject.owner.firstName = project.owner.firstName;
	projectInfoObject.owner.familyName = project.owner.familyName;
	projectInfoObject.owner.id = project.owner.id;

    return projectInfoObject;
}

export default { project,
         		 info }