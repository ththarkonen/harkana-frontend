self.onmessage = ( event ) => {

	const { jobId, text, bytes } = event.data ?? {}
	if( typeof jobId !== "string" || jobId.length === 0 ){
		return
	}

	try{
		const value = parseJsonPayload( text, bytes )
		self.postMessage({
			jobId,
			value
		})
	} catch( error ){
		self.postMessage({
			jobId,
			error: error instanceof Error ? error.message : String( error )
		})
	}
}

function parseJsonPayload( text, bytes ){

	if( bytes instanceof ArrayBuffer ){
		const decoded = new TextDecoder().decode( new Uint8Array( bytes ) )
		return JSON.parse( decoded )
	}

	if( typeof text === "string" ){
		return JSON.parse( text )
	}

	throw new Error( "Worker parse payload must be a string or ArrayBuffer." )
}
