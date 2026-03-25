import { toRaw } from "vue"

let visualizationWorker = null
let visualizationWorkerSequence = 0
const pendingJobs = new Map()

function workerSupported(){
    return typeof Worker !== "undefined"
}

function ensureWorker(){

    if( workerSupported() === false ){
        throw new Error( "Visualization worker is not supported in this environment." )
    }

    if( visualizationWorker !== null ){
        return visualizationWorker
    }

    visualizationWorker = new Worker(
        new URL( "./visualizationWorker.js", import.meta.url ),
        { type: "module" }
    )

    visualizationWorker.addEventListener( "message", ( event ) => {
        const { jobId, payload, error } = event.data ?? {}
        if( typeof jobId !== "string" || pendingJobs.has( jobId ) === false ){
            return
        }

        const job = pendingJobs.get( jobId )
        pendingJobs.delete( jobId )

        if( typeof error === "string" && error.length > 0 ){
            job.reject( new Error( error ) )
            return
        }

        job.resolve( payload ?? null )
    })

    visualizationWorker.addEventListener( "error", ( error ) => {
        for( const [ jobId, job ] of pendingJobs.entries() ){
            pendingJobs.delete( jobId )
            job.reject( error instanceof Error ? error : new Error( String( error ) ) )
        }
    })

    return visualizationWorker
}

function nextJobId(){
    visualizationWorkerSequence += 1
    return "visualization-worker-" + visualizationWorkerSequence
}

function prepareVisualizationPayloadInWorker( kind, payload ){

    const worker = ensureWorker()
    const jobId = nextJobId()

    return new Promise(( resolve, reject ) => {
        pendingJobs.set( jobId, { resolve, reject })

        try{
            const normalizedPayload = normalizeWorkerPayload( payload )
            worker.postMessage({
                jobId,
                kind,
                payload: normalizedPayload
            })
        } catch( error ){
            pendingJobs.delete( jobId )
            reject( error )
        }
    })
}

function terminateVisualizationWorker(){

    if( visualizationWorker === null ){
        return
    }

    visualizationWorker.terminate()
    visualizationWorker = null

    for( const [ jobId, job ] of pendingJobs.entries() ){
        pendingJobs.delete( jobId )
        job.reject( new Error( "Visualization worker terminated." ) )
    }
}

function normalizeWorkerPayload( payload ){

    if( payload === null || typeof payload !== "object" ){
        return payload
    }

    const rawPayload = toRaw( payload )

    if( Array.isArray( rawPayload ) ){
        return rawPayload
    }

    const normalized = {}

    for( const [ key, value ] of Object.entries( rawPayload )){
        normalized[ key ] = normalizeWorkerPayloadValue( value )
    }

    return normalized
}

function normalizeWorkerPayloadValue( value ){

    if( value === null || typeof value !== "object" ){
        return value
    }

    return toRaw( value )
}

export {
    prepareVisualizationPayloadInWorker,
    terminateVisualizationWorker
}
