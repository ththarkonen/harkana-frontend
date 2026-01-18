import { Amplify, Storage} from 'aws-amplify';
import awsconfig from '@/aws-exports.js';
Amplify.configure( awsconfig );

import { ZipWriter } from '@zip.js/zip.js'
import streamSaver from 'streamsaver'

import utils from '../utils.js'
import share from "../sharing.js"

var download = async function( projects ){
    
    const dataType = import.meta.env.VITE_DATA_TYPE
    const timeStamp = utils.getTimeStamp()
    const fileName = dataType + '_projects_' + timeStamp + '.zip'

    const fileStream = streamSaver.createWriteStream( fileName )
    const zipWriter = new ZipWriter( fileStream, { level: 0 })

    for( const project of projects ){

        console.log( "A single project: ", project )

        if( project.shared ){
            await downloadShared( project, zipWriter)
        } else {
            await downloadOwned( project, zipWriter)
        };
    }

    await zipWriter.close()
}

var downloadOwned = async function( project, zipWriter){

    const accessSettings = { level: "private",
                                 identityId: project.owner.id,
                                 pageSize: "ALL",
                                 download: true};

    const projectFiles = await Storage.list( project.id + "/", accessSettings);
    var info = await Storage.get( project.id + "/info.json", accessSettings);

    info = await info.Body.text();
    info = JSON.parse( info );

    for( const file of projectFiles.results ){

        const isStatusFile = file.key.split("/").pop() == "info.json";
        if( isStatusFile ) continue
        
        const zipPath = info.name.replace(/[^a-zA-Z0-9]/g,'_') + "_" + info.id + "_" + file.key

        const result = await Storage.get( file.key, accessSettings);
        console.log( result.Body )
        await zipWriter.add( zipPath, result.Body.stream());
    };

}

var downloadShared = async function( project, zipWriter){

    const response = await share.listSharedFiles( project );
    const info = project.shareInfo;
    
    for( const file of response.files ){

        const fileName = file.split("/").pop()
        const isStatusFile = fileName == "info.json";
        if( isStatusFile ) continue

        const zipPath = project.name.replace(/[^a-zA-Z0-9]/g,'_') + "_" + project.rawid + "/" + fileName;

        const result = await share.loadResponse( project.shareInfo, fileName)
        await zipWriter.add( zipPath, result.body);
    };
};

export {
    download
}