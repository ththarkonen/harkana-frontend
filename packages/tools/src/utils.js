

var wait = function( ms ){
    return new Promise( resolve => setTimeout( resolve, ms) );
};

var getTimeStamp = function(){
    const timestamp = Date.now()
    const date = new Date(timestamp)

    const formatted =
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_` +
        `${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}-${String(date.getSeconds()).padStart(2, '0')}_` +
        `${String(date.getMilliseconds()).padStart(3, '0')}`

    return formatted
}

function dec2hex (dec) {
    return dec.toString(16).padStart(2, "0")
}

function randomID( len ){
    var arr = new Uint8Array((len || 40) / 2)
    window.crypto.getRandomValues( arr )
    return Array.from( arr, dec2hex).join('')
}
  
// generateId :: Integer -> String
function generateID ( list ) {
    const len = 64
    
    var id = randomID( len )
    while( id in list ) id = randomID( len, list)
    return id
}

function isValidJSON(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function parseProjectName( file ){

    const dotIndex = file.name.lastIndexOf(".");
    const extension = dotIndex !== -1 ? file.name.substring( dotIndex + 1).toLowerCase() : "";

	const fileNameNoExtension = file.name.substring( 0, file.name.lastIndexOf("."));
	const projectName = fileNameNoExtension.replace(/[^a-zA-Z0-9]/g,'_');

    return [ projectName, extension];
}

export default {
    wait,
    generateID,
    getTimeStamp,
    isValidJSON,
    parseProjectName
}   