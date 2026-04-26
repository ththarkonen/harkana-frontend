const unsupported = () => {
	throw new Error( "child_process is not available in the browser build." )
}

export const spawn = unsupported

export const exec = ( command, callback ) => {
	if( typeof callback === "function" ){
		callback( new Error( `Cannot execute "${command}" in the browser build.` ), "", "" )
	}
}

export default {
	spawn,
	exec
}
