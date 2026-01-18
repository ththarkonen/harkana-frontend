import Papa from 'papaparse';

var validateJSON = function( fileContent ){

    try{
        var data = JSON.parse( fileContent );
    } catch ( error ){
        throw new Error( 'Invalid JSON file. The file must be a valid JSON file.' );
    };

    if( !data.hasOwnProperty('x') ){
        throw new Error( 'Invalid JSON file. The file must contain key: "x".' );
    }

    if( !data.hasOwnProperty('y') ){
        throw new Error( 'Invalid JSON file. The file must contain a key: "y".' );
    }

    var x = data.x;
    var y = data.y;

    var xFiltered = data.x.filter( item => typeof item === 'number');
    var yFiltered = data.y.filter( item => typeof item === 'number');

    var nX = x.length;
    var nY = y.length;

    var nXFiltered = xFiltered.length;
    var nYFiltered = yFiltered.length;

    if( nX !== nXFiltered ){
        throw new Error( 'Invalid JSON file. The "x" key must contain only numbers.' );
    };

    if( nY !== nYFiltered ){
        throw new Error( 'Invalid JSON file. The "y" key must contain only numbers.' );
    };

    if( nX !== nY ){
        throw new Error( 'Invalid JSON file. The "x" and "y" keys must contain the same number of elements.' );
    };

    var dataCurated = {}
    dataCurated.x = data.x;
    dataCurated.y = data.y;

    return dataCurated;
};


var validateText = function( fileContent ){

    var data = Papa.parse( fileContent, { header: false, dynamicTyping: true, skipEmptyLines: true} );

    if( data.errors.length > 0 ){
        throw new Error( 'The file is malformed. Please check the data formatting.' );
    };

    var x = data.data.map( item => item[0] );
    var y = data.data.map( item => item[1] );

    var nX = x.length;
    var nY = y.length;

    var xFiltered = x.filter( item => typeof item === 'number');
    var yFiltered = y.filter( item => typeof item === 'number');

    var nXFiltered = xFiltered.length;
    var nYFiltered = yFiltered.length;

    if( nX !== nXFiltered ){
        throw new Error( 'Invalid file format. The first column must contain only numbers.' );
    };

    if( nY !== nYFiltered ){
        throw new Error( 'Invalid file format. The second column must contain only numbers.' );
    };

    if( nX !== nY ){
        throw new Error( 'Invalid file format. The the columns must contain the same number of elements.' );
    };

    var dataCurated = {}
    dataCurated.x = x;
    dataCurated.y = y;

    return dataCurated;
};

var input = async function( file ){

    const extension = file.name.slice((file.name.lastIndexOf(".") - 1 >>> 0) + 2);

    if( extension !== 'json' && extension !== 'csv' && extension !== 'txt' ){
        throw new Error( 'Invalid file type. The file type must be one of the following: .json, .csv, or .txt.' );
    };
    
    var fileContent = await file.text();
    var data = {};

    if( extension === 'json' ){
        data = validateJSON( fileContent );
    } else if( extension === 'csv' || extension === 'txt' ){
        data = validateText( fileContent );
    };

    return JSON.stringify( data, null, 2);
};

var metadata = async function( file ){

    try{
        var data = JSON.parse( await file.text() );
    } catch ( error ){

        var errorMessage = "Invalid JSON file. The file must be a valid JSON file."
        errorMessage += " Project metadata has not been updated. Please check the JSON formatting and try again."
        throw new Error( errorMessage );
    };

    return data
};

export default {
    input,
    metadata
}