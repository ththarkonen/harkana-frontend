let jsonParseWorker = null
let jsonParseWorkerSequence = 0
const pendingJsonParseJobs = new Map()

function workerSupported(){
	return typeof Worker !== "undefined"
}

function ensureWorker(){

	if( workerSupported() === false ){
		throw new Error( "JSON parse worker is not supported in this environment." )
	}

	if( jsonParseWorker !== null ){
		return jsonParseWorker
	}

	jsonParseWorker = new Worker(
		new URL( "./jsonParseWorker.js", import.meta.url ),
		{ type: "module" }
	)

	jsonParseWorker.addEventListener( "message", ( event ) => {
		const { jobId, value, error } = event.data ?? {}
		if( typeof jobId !== "string" || pendingJsonParseJobs.has( jobId ) === false ){
			return
		}

		const job = pendingJsonParseJobs.get( jobId )
		pendingJsonParseJobs.delete( jobId )

		if( typeof error === "string" && error.length > 0 ){
			job.reject( new Error( error ) )
			return
		}

		job.resolve( value )
	})

	jsonParseWorker.addEventListener( "error", ( error ) => {
		for( const [ jobId, job ] of pendingJsonParseJobs.entries() ){
			pendingJsonParseJobs.delete( jobId )
			job.reject( error instanceof Error ? error : new Error( String( error ) ) )
		}
	})

	return jsonParseWorker
}

function nextJobId(){
	jsonParseWorkerSequence += 1
	return "json-parse-worker-" + jsonParseWorkerSequence
}

async function parseJsonString( text, options = {} ){

	const shouldUseWorker = options?.useWorker === true

	if( shouldUseWorker === false || workerSupported() === false ){
		return JSON.parse( text )
	}

	const worker = ensureWorker()
	const jobId = nextJobId()

	return await new Promise(( resolve, reject ) => {
		pendingJsonParseJobs.set( jobId, { resolve, reject })

		try{
			worker.postMessage({ jobId, text })
		} catch( error ){
			pendingJsonParseJobs.delete( jobId )
			reject( error )
		}
	})
}

async function parseJsonBytes( bytes, options = {} ){

	const shouldUseWorker = options?.useWorker === true
	const normalizedBytes = bytes instanceof ArrayBuffer
		? bytes
		: bytes?.buffer instanceof ArrayBuffer
			? bytes.buffer.slice( bytes.byteOffset ?? 0, ( bytes.byteOffset ?? 0 ) + ( bytes.byteLength ?? bytes.buffer.byteLength ))
			: null

	if( normalizedBytes === null ){
		throw new Error( "JSON byte payload must be an ArrayBuffer or TypedArray." )
	}

	if( shouldUseWorker === false || workerSupported() === false ){
		return JSON.parse( new TextDecoder().decode( new Uint8Array( normalizedBytes ) ))
	}

	const worker = ensureWorker()
	const jobId = nextJobId()

	return await new Promise(( resolve, reject ) => {
		pendingJsonParseJobs.set( jobId, { resolve, reject })

		try{
			worker.postMessage({ jobId, bytes: normalizedBytes }, [ normalizedBytes ])
		} catch( error ){
			pendingJsonParseJobs.delete( jobId )
			reject( error )
		}
	})
}

function terminateJsonParseWorker(){

	if( jsonParseWorker === null ){
		return
	}

	jsonParseWorker.terminate()
	jsonParseWorker = null

	for( const [ jobId, job ] of pendingJsonParseJobs.entries() ){
		pendingJsonParseJobs.delete( jobId )
		job.reject( new Error( "JSON parse worker terminated." ) )
	}
}

export {
	parseJsonString,
	parseJsonBytes,
	terminateJsonParseWorker
}
