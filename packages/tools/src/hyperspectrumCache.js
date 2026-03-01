import results from "./results.js"

const DEFAULT_MEMORY_BUDGET_BYTES = 600 * 1024 * 1024
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000
const DEFAULT_PREFETCH_RADIUS = 3
const DEFAULT_LOW_CONCURRENCY = 1
const DEFAULT_PCA_MAX_COMPONENT = 10

const DB_NAME = "harkana-hyperspectrum-cache"
const DB_VERSION = 1
const STORE_NAME = "entries"
const SCHEMA_VERSION = 1

var projectCaches = new Map()
var databasePromise = null

var initProjectCache = async function( project, options = {} ){

    const state = ensureProjectState( project, options )
    updatePins( state )
    await ensureDatabase()

    return {
        projectID: state.projectID,
        budgetBytes: state.budgetBytes,
        ttlMs: state.ttlMs,
        prefetchRadius: state.prefetchRadius
    }
}

var getMip = async function( project, options = {} ){
    const priority = options.priority === "low" ? "low" : "high"
    return await getOrLoad( project, "mip", { ...options, priority })
}

var getMipHsv = async function( project, options = {} ){
    const priority = options.priority === "low" ? "low" : "high"
    return await getOrLoad( project, "mip_hsv", { ...options, priority })
}

var getXyz = async function( project, options = {} ){
    const priority = options.priority === "low" ? "low" : "high"
    return await getOrLoad( project, "xyz", { ...options, priority })
}

var getRois = async function( project, options = {} ){

    const priority = options.priority === "low" ? "low" : "high"

    try{
        const payload = await getOrLoad( project, "roi/frontend", { ...options, priority })
        return normalizeRoiPayload( payload )
    } catch( error ){
        return []
    }
}

var refreshRois = async function( project, options = {} ){

    const state = ensureProjectState( project, options )
    const mode = "roi/frontend"

    try{
        const payload = await refreshMode( state, project, mode )
        return normalizeRoiPayload( payload )
    } catch( error ){
        await clearModeEntry( state, mode )
        return []
    }
}

var getLayer = async function( project, layerIndex, options = {} ){

    const normalizedLayer = normalizeLayerIndex( layerIndex )
    const mode = "layers/" + normalizedLayer
    const priority = options.priority === "low" ? "low" : "high"

    return await getOrLoad( project, mode, { ...options, priority })
}

var getPcaScore = async function( project, componentIndex, options = {} ){

    const normalizedComponent = normalizePcaIndex( componentIndex )
    const mode = pcaModeFromIndex( normalizedComponent )
    const priority = options.priority === "low" ? "low" : "high"

    return await getOrLoad( project, mode, { ...options, priority })
}

var getLoadings = async function( project, options = {} ){

    const priority = options.priority === "low" ? "low" : "high"
    return await getOrLoad( project, "pca/loadings", { ...options, priority })
}

var setActiveLayer = function( project, layerIndex, options = {} ){

    const state = ensureProjectState( project, options )
    state.activeLayer = normalizeLayerIndex( layerIndex )

    pruneLowQueue( state )
    updatePins( state )
    enforceMemoryBudget( state )
    pumpLowQueue( state )
}

var setActivePca = function( project, componentIndex, options = {} ){

    const state = ensureProjectState( project, options )
    state.activePca = normalizePcaIndex( componentIndex )

    pruneLowQueue( state )
    updatePins( state )
    enforceMemoryBudget( state )
    pumpLowQueue( state )
}

var prefetchWindow = async function( project, centerIndex, radius = null, options = {} ){

    const state = ensureProjectState( project, options )
    const center = normalizeLayerIndex( centerIndex )
    const prefetchRadius = normalizePositiveInteger( radius ) ?? state.prefetchRadius

    setActiveLayer( project, center, options )

    for( var distance = 1; distance <= prefetchRadius; distance++ ){

        const left = center - distance
        const right = center + distance

        if( left >= 0 ){
            void getLayer( project, left, { ...options, priority: "low" }).catch(() => null)
        }

        void getLayer( project, right, { ...options, priority: "low" }).catch(() => null)
    }
}

var prefetchPcaWindow = async function( project, centerIndex, radius = null, options = {} ){

    const state = ensureProjectState( project, options )
    const center = normalizePcaIndex( centerIndex )
    const prefetchRadius = normalizePositiveInteger( radius ) ?? state.prefetchRadius

    setActivePca( project, center, options )

    for( var distance = 1; distance <= prefetchRadius; distance++ ){

        const left = center - distance
        const right = center + distance

        if( left >= 1 ){
            void getPcaScore( project, left, { ...options, priority: "low" }).catch(() => null)
        }

        if( right <= DEFAULT_PCA_MAX_COMPONENT ){
            void getPcaScore( project, right, { ...options, priority: "low" }).catch(() => null)
        }
    }
}

var prefetchPcaScores = async function( project, options = {} ){

    const startValue = normalizePositiveInteger( options.startIndex ) ?? 1
    const endValue = normalizePositiveInteger( options.endIndex ) ?? DEFAULT_PCA_MAX_COMPONENT

    const start = Math.max( 1, Math.min( startValue, endValue ))
    const end = Math.min( DEFAULT_PCA_MAX_COMPONENT, Math.max( startValue, endValue ))

    for( var index = start; index <= end; index++ ){
        try{
            await getPcaScore( project, index, { ...options, priority: "high" })
        } catch( error ){
            console.log( error )
        }
    }
}

var clearProjectCache = async function( project ){

    const projectID = readProjectID( project )
    const state = projectCaches.get( projectID )

    if( state ){
        clearQueuedTasks( state )
        state.memory.clear()
        state.inFlight.clear()
        state.memoryBytes = 0
        state.lowQueue = []
        state.runningLow = 0
        projectCaches.delete( projectID )
    }

    await deletePersistentProjectEntries( projectID )
}

var clearAllHyperspectrumCache = async function(){

    for( const state of projectCaches.values() ){
        clearQueuedTasks( state )
    }

    projectCaches.clear()
    await clearPersistentStore()
}

var getCacheStats = function( project ){

    const projectID = readProjectID( project )
    const state = projectCaches.get( projectID )

    if( !state ){
        return {
            projectID,
            memoryEntries: 0,
            memoryBytes: 0,
            inflight: 0,
            queuedPrefetch: 0,
            activeLayer: 0,
            activePca: 1,
            budgetBytes: DEFAULT_MEMORY_BUDGET_BYTES,
            ttlMs: DEFAULT_TTL_MS,
            stats: defaultStats()
        }
    }

    return {
        projectID,
        memoryEntries: state.memory.size,
        memoryBytes: state.memoryBytes,
        inflight: state.inFlight.size,
        queuedPrefetch: state.lowQueue.length,
        activeLayer: state.activeLayer,
        activePca: state.activePca,
        budgetBytes: state.budgetBytes,
        ttlMs: state.ttlMs,
        stats: { ...state.stats }
    }
}

async function getOrLoad( project, mode, options = {} ){

    const state = ensureProjectState( project, options )
    const projectID = state.projectID
    const key = cacheKey( projectID, mode )

    const memoryEntry = state.memory.get( key )
    if( memoryEntry ){
        state.stats.memoryHits += 1
        touchMemoryEntry( state, key, memoryEntry )
        return memoryEntry.value
    }

    const persistent = await readPersistentValue( key, state.ttlMs )
    if( persistent ){

        state.stats.persistentHits += 1
        setMemoryValue( state, key, persistent.value )

        if( persistent.stale ){
            void requestNetwork( state, project, mode, "low" ).catch(() => null)
        }

        return persistent.value
    }

    state.stats.misses += 1

    const priority = options.priority === "low" ? "low" : "high"
    return await requestNetwork( state, project, mode, priority )
}

function requestNetwork( state, project, mode, priority ){

    const key = cacheKey( state.projectID, mode )
    const inflightEntry = state.inFlight.get( key )

    if( inflightEntry ){

        if( priority === "high" && inflightEntry.status === "queued" ){
            promoteQueuedTask( state, project, mode, key, inflightEntry )
        }

        return inflightEntry.promise
    }

    if( priority === "low" ){
        return enqueueLowRequest( state, project, mode, key )
    }

    return startImmediateRequest( state, project, mode, key, "high" )
}

function enqueueLowRequest( state, project, mode, key ){

    const deferred = createDeferred()

    const task = {
        key,
        project,
        mode,
        enqueuedAt: Date.now()
    }

    const inflightEntry = {
        promise: deferred.promise,
        deferred,
        status: "queued",
        priority: "low",
        task
    }

    state.inFlight.set( key, inflightEntry )
    state.lowQueue.push( task )

    pruneLowQueue( state )
    pumpLowQueue( state )

    return deferred.promise
}

function startImmediateRequest( state, project, mode, key, priority ){

    const deferred = createDeferred()

    const inflightEntry = {
        promise: deferred.promise,
        deferred,
        status: "running",
        priority,
        task: null
    }

    state.inFlight.set( key, inflightEntry )
    executeRequest( state, project, mode, key, inflightEntry, false )

    return deferred.promise
}

function promoteQueuedTask( state, project, mode, key, inflightEntry ){

    state.lowQueue = state.lowQueue.filter(( task ) => task.key !== key )

    inflightEntry.priority = "high"
    inflightEntry.status = "running"
    inflightEntry.task = null

    executeRequest( state, project, mode, key, inflightEntry, false )
}

function pumpLowQueue( state ){

    while( state.runningLow < state.lowConcurrency && state.lowQueue.length > 0 ){

        const task = takeNextLowTask( state )
        if( task === null ) return

        const inflightEntry = state.inFlight.get( task.key )
        if( !inflightEntry || inflightEntry.status !== "queued" ) continue

        inflightEntry.status = "running"
        state.runningLow += 1

        executeRequest( state, task.project, task.mode, task.key, inflightEntry, true )
    }
}

function executeRequest( state, project, mode, key, inflightEntry, fromLowQueue ){

    void (async () => {

        try{
            const value = await loadFromNetwork( project, mode )

            state.stats.networkHits += 1

            setMemoryValue( state, key, value )

            void writePersistentValue( key, state.projectID, mode, value, state.ttlMs )
                .then(() => {
                    state.stats.persistentWrites += 1
                })
                .catch(() => {
                    state.stats.persistentErrors += 1
                })

            inflightEntry.deferred.resolve( value )

        } catch( error ){
            inflightEntry.deferred.reject( error )

        } finally {

            state.inFlight.delete( key )

            if( fromLowQueue ){
                state.runningLow = Math.max( 0, state.runningLow - 1 )
                pumpLowQueue( state )
            }
        }
    })()
}

function pruneLowQueue( state ){

    const limit = state.prefetchRadius + 1
    var keptTasks = []

    for( const task of state.lowQueue ){

        const layerIndex = layerIndexFromMode( task.mode )
        const pcaIndex = pcaIndexFromMode( task.mode )

        if( layerIndex === null && pcaIndex === null ){
            keptTasks.push( task )
            continue
        }

        if( layerIndex !== null && Math.abs( layerIndex - state.activeLayer ) <= limit ){
            keptTasks.push( task )
            continue
        }

        if( pcaIndex !== null && Math.abs( pcaIndex - state.activePca ) <= limit ){
            keptTasks.push( task )
            continue
        }

        const inflightEntry = state.inFlight.get( task.key )
        if( inflightEntry && inflightEntry.status === "queued" ){
            inflightEntry.deferred.resolve( null )
            state.inFlight.delete( task.key )
        }
    }

    state.lowQueue = keptTasks
}

function clearQueuedTasks( state ){

    for( const [ key, inflightEntry ] of state.inFlight.entries() ){
        if( inflightEntry.status !== "queued" ) continue
        inflightEntry.deferred.resolve( null )
        state.inFlight.delete( key )
    }
}

function takeNextLowTask( state ){

    if( state.lowQueue.length === 0 ) return null

    var selectedIndex = 0
    var selectedScore = taskScore( state, state.lowQueue[0] )

    for( var ii = 1; ii < state.lowQueue.length; ii++ ){
        const candidateScore = taskScore( state, state.lowQueue[ii] )
        if( candidateScore < selectedScore ){
            selectedScore = candidateScore
            selectedIndex = ii
        }
    }

    const selectedTask = state.lowQueue[ selectedIndex ]
    state.lowQueue.splice( selectedIndex, 1 )

    return selectedTask
}

function taskScore( state, task ){

    const layerIndex = layerIndexFromMode( task.mode )
    if( layerIndex !== null ){
        const distance = Math.abs( layerIndex - state.activeLayer )
        return distance * 1_000_000 + task.enqueuedAt
    }

    const pcaIndex = pcaIndexFromMode( task.mode )
    if( pcaIndex !== null ){
        const distance = Math.abs( pcaIndex - state.activePca )
        return distance * 1_000_000 + task.enqueuedAt
    }

    return Number.MAX_SAFE_INTEGER
}

async function loadFromNetwork( project, mode ){

    const loaded = await results.load( project, mode )

    if( loaded instanceof Error ){
        throw loaded
    }

    if( loaded === undefined ){
        throw new Error( "No data returned for " + mode + "." )
    }

    return loaded
}

async function refreshMode( state, project, mode ){

    const key = cacheKey( state.projectID, mode )
    const value = await loadFromNetwork( project, mode )

    setMemoryValue( state, key, value )

    try{
        await writePersistentValue( key, state.projectID, mode, value, state.ttlMs )
        state.stats.persistentWrites += 1
    } catch( error ){
        state.stats.persistentErrors += 1
    }

    return value
}

async function clearModeEntry( state, mode ){

    const key = cacheKey( state.projectID, mode )
    removeMemoryEntry( state, key )
    await deletePersistentEntry( key )
}

function ensureProjectState( project, options = {} ){

    const projectID = readProjectID( project )

    var state = projectCaches.get( projectID )
    if( !state ){
        state = createProjectState( projectID )
        projectCaches.set( projectID, state )
    }

    applyStateOptions( state, options )
    return state
}

function createProjectState( projectID ){
    return {
        projectID,
        budgetBytes: DEFAULT_MEMORY_BUDGET_BYTES,
        ttlMs: DEFAULT_TTL_MS,
        prefetchRadius: DEFAULT_PREFETCH_RADIUS,
        lowConcurrency: DEFAULT_LOW_CONCURRENCY,
        activeLayer: 0,
        activePca: 1,
        accessCounter: 0,
        memory: new Map(),
        memoryBytes: 0,
        inFlight: new Map(),
        lowQueue: [],
        runningLow: 0,
        stats: defaultStats()
    }
}

function defaultStats(){
    return {
        memoryHits: 0,
        persistentHits: 0,
        networkHits: 0,
        misses: 0,
        persistentWrites: 0,
        persistentErrors: 0
    }
}

function applyStateOptions( state, options ){

    const budgetBytes = normalizePositiveInteger( options.memoryBudgetBytes )
    if( budgetBytes !== null ) state.budgetBytes = budgetBytes

    const ttlMs = normalizePositiveInteger( options.ttlMs )
    if( ttlMs !== null ) state.ttlMs = ttlMs

    const radius = normalizePositiveInteger( options.prefetchRadius )
    if( radius !== null ) state.prefetchRadius = radius

    const lowConcurrency = normalizePositiveInteger( options.lowConcurrency )
    if( lowConcurrency !== null ) state.lowConcurrency = lowConcurrency
}

function updatePins( state ){

    const pinnedKeys = new Set([
        cacheKey( state.projectID, "mip" ),
        cacheKey( state.projectID, "mip_hsv" ),
        cacheKey( state.projectID, "xyz" ),
        cacheKey( state.projectID, "pca/loadings" ),
        cacheKey( state.projectID, "layers/" + state.activeLayer ),
        cacheKey( state.projectID, "layers/" + ( state.activeLayer - 1 )),
        cacheKey( state.projectID, "layers/" + ( state.activeLayer + 1 )),
        cacheKey( state.projectID, pcaModeFromIndex( state.activePca )),
        cacheKey( state.projectID, pcaModeFromIndex( Math.max( 1, state.activePca - 1 ))),
        cacheKey( state.projectID, pcaModeFromIndex( Math.min( DEFAULT_PCA_MAX_COMPONENT, state.activePca + 1 )))
    ])

    for( const [ key, entry ] of state.memory.entries() ){
        entry.pinned = pinnedKeys.has( key )
    }
}

function setMemoryValue( state, key, value ){

    const sizeBytes = estimateValueSizeBytes( value )
    const previous = state.memory.get( key )

    if( previous ){
        state.memoryBytes -= previous.sizeBytes
    }

    state.accessCounter += 1

    state.memory.set( key, {
        value,
        sizeBytes,
        pinned: false,
        lastAccess: state.accessCounter
    })

    state.memoryBytes += sizeBytes

    updatePins( state )
    enforceMemoryBudget( state )
}

function removeMemoryEntry( state, key ){

    const existing = state.memory.get( key )
    if( !existing ) return

    state.memory.delete( key )
    state.memoryBytes -= existing.sizeBytes
}

function touchMemoryEntry( state, key, entry ){
    state.accessCounter += 1
    entry.lastAccess = state.accessCounter
    state.memory.set( key, entry )
}

function enforceMemoryBudget( state ){

    if( state.memoryBytes <= state.budgetBytes ) return

    var evictable = []
    var pinned = []

    for( const [ key, entry ] of state.memory.entries() ){

        if( entry.pinned ){
            pinned.push({ key, entry })
            continue
        }

        evictable.push({ key, entry })
    }

    evictable.sort(( left, right ) => left.entry.lastAccess - right.entry.lastAccess )
    pinned.sort(( left, right ) => left.entry.lastAccess - right.entry.lastAccess )

    removeEntriesFromCache( state, evictable )

    if( state.memoryBytes <= state.budgetBytes ) return

    removeEntriesFromCache( state, pinned )
}

function removeEntriesFromCache( state, entries ){

    for( const candidate of entries ){

        if( state.memoryBytes <= state.budgetBytes ) return

        const existing = state.memory.get( candidate.key )
        if( !existing ) continue

        state.memory.delete( candidate.key )
        state.memoryBytes -= existing.sizeBytes
    }
}

function cacheKey( projectID, mode ){
    return projectID + "::" + mode
}

function layerIndexFromMode( mode ){

    if( typeof mode !== "string" ) return null
    if( mode.startsWith( "layers/" ) === false ) return null

    const index = Number.parseInt( mode.replace( "layers/", "" ), 10 )
    if( Number.isInteger( index ) === false ) return null
    if( index < 0 ) return null

    return index
}

function pcaIndexFromMode( mode ){

    if( typeof mode !== "string" ) return null

    const match = mode.match(/^pca\/scores\/pc(\d{2})$/)
    if( match === null ) return null

    const index = Number.parseInt( match[1], 10 )
    if( Number.isInteger( index ) === false ) return null
    if( index < 1 || index > DEFAULT_PCA_MAX_COMPONENT ) return null

    return index
}

function normalizeLayerIndex( value ){

    const index = Number.parseInt( value, 10 )
    if( Number.isInteger( index ) === false || index < 0 ){
        throw new Error( "Layer index must be a non-negative integer." )
    }

    return index
}

function normalizePcaIndex( value ){

    const index = Number.parseInt( value, 10 )
    if( Number.isInteger( index ) === false ){
        throw new Error( "PCA component index must be an integer from 1 to 10." )
    }

    if( index < 1 || index > DEFAULT_PCA_MAX_COMPONENT ){
        throw new Error( "PCA component index must be an integer from 1 to 10." )
    }

    return index
}

function pcaModeFromIndex( componentIndex ){

    const normalized = normalizePcaIndex( componentIndex )
    const suffix = String( normalized ).padStart( 2, "0" )
    return "pca/scores/pc" + suffix
}

function normalizePositiveInteger( value ){

    const number = Number( value )
    if( Number.isInteger( number ) === false ) return null
    if( number <= 0 ) return null

    return number
}

function readProjectID( project ){

    const id = project?.id

    if( typeof id !== "string" || id.length === 0 ){
        throw new Error( "Project must have a valid id." )
    }

    return id
}

function estimateValueSizeBytes( value ){

    const visited = new Set()
    return estimateRecursive( value, visited )
}

function estimateRecursive( value, visited ){

    if( value === null || value === undefined ) return 4

    const type = typeof value

    if( type === "number" ) return 8
    if( type === "boolean" ) return 4
    if( type === "string" ) return value.length * 2
    if( type !== "object" ) return 16

    if( visited.has( value ) ) return 0
    visited.add( value )

    if( Array.isArray( value ) ){

        if( value.length > 0 && Array.isArray( value[0] ) ){
            var total2D = 16
            for( const row of value ){
                if( Array.isArray( row ) ){
                    total2D += row.length * 8
                } else {
                    total2D += estimateRecursive( row, visited )
                }
            }
            return total2D
        }

        var totalArray = 16
        for( const item of value ){
            totalArray += estimateRecursive( item, visited )
        }

        return totalArray
    }

    var totalObject = 32

    for( const [ key, nestedValue ] of Object.entries( value )){
        totalObject += key.length * 2
        totalObject += estimateRecursive( nestedValue, visited )
    }

    return totalObject
}

function createDeferred(){

    var resolve
    var reject

    const promise = new Promise(( resolver, rejecter ) => {
        resolve = resolver
        reject = rejecter
    })

    return {
        promise,
        resolve,
        reject
    }
}

async function readPersistentValue( key, ttlMs ){

    const entry = await readPersistentEntry( key )
    if( !entry ) return null

    if( entry.schemaVersion !== SCHEMA_VERSION ) return null

    const stale = entry.expiresAt < Date.now()
    if( stale && ttlMs <= 0 ) return null

    return {
        value: entry.value,
        stale
    }
}

async function writePersistentValue( key, projectID, mode, value, ttlMs ){

    const now = Date.now()

    const entry = {
        cacheKey: key,
        projectID,
        mode,
        value,
        sizeBytes: estimateValueSizeBytes( value ),
        schemaVersion: SCHEMA_VERSION,
        updatedAt: now,
        expiresAt: now + ttlMs
    }

    await writePersistentEntry( entry )
}

async function ensureDatabase(){

    if( databasePromise ) return databasePromise

    if( typeof indexedDB === "undefined" ){
        databasePromise = Promise.resolve( null )
        return databasePromise
    }

    databasePromise = new Promise(( resolve ) => {

        const request = indexedDB.open( DB_NAME, DB_VERSION )

        request.onupgradeneeded = ( event ) => {

            const db = event.target?.result
            if( !db ) return

            if( db.objectStoreNames.contains( STORE_NAME ) === false ){
                const store = db.createObjectStore( STORE_NAME, { keyPath: "cacheKey" })
                store.createIndex( "projectID", "projectID", { unique: false })
                store.createIndex( "updatedAt", "updatedAt", { unique: false })
            }
        }

        request.onsuccess = () => resolve( request.result )
        request.onerror = () => resolve( null )
        request.onblocked = () => resolve( null )
    })

    return databasePromise
}

async function readPersistentEntry( key ){

    const db = await ensureDatabase()
    if( !db ) return null

    return await new Promise(( resolve ) => {

        const transaction = db.transaction( STORE_NAME, "readonly" )
        const store = transaction.objectStore( STORE_NAME )
        const request = store.get( key )

        request.onsuccess = () => resolve( request.result ?? null )
        request.onerror = () => resolve( null )
    })
}

async function deletePersistentEntry( key ){

    const db = await ensureDatabase()
    if( !db ) return

    await new Promise(( resolve, reject ) => {

        const transaction = db.transaction( STORE_NAME, "readwrite" )
        const store = transaction.objectStore( STORE_NAME )
        store.delete( key )

        transaction.oncomplete = () => resolve( null )
        transaction.onerror = () => reject( transaction.error )
        transaction.onabort = () => reject( transaction.error )
    })
}

async function writePersistentEntry( entry ){

    const db = await ensureDatabase()
    if( !db ) return

    await new Promise(( resolve, reject ) => {

        const transaction = db.transaction( STORE_NAME, "readwrite" )
        const store = transaction.objectStore( STORE_NAME )
        store.put( entry )

        transaction.oncomplete = () => resolve( null )
        transaction.onerror = () => reject( transaction.error )
        transaction.onabort = () => reject( transaction.error )
    })
}

async function deletePersistentProjectEntries( projectID ){

    const db = await ensureDatabase()
    if( !db ) return

    await new Promise(( resolve, reject ) => {

        const transaction = db.transaction( STORE_NAME, "readwrite" )
        const store = transaction.objectStore( STORE_NAME )

        if( store.indexNames.contains( "projectID" ) === false ){
            store.clear()
            transaction.oncomplete = () => resolve( null )
            transaction.onerror = () => reject( transaction.error )
            transaction.onabort = () => reject( transaction.error )
            return
        }

        const index = store.index( "projectID" )
        const request = typeof IDBKeyRange === "undefined"
            ? index.openCursor()
            : index.openCursor( IDBKeyRange.only( projectID ))

        request.onsuccess = () => {

            const cursor = request.result
            if( !cursor ) return

            if( cursor.value?.projectID !== projectID ){
                cursor.continue()
                return
            }

            store.delete( cursor.primaryKey )
            cursor.continue()
        }

        request.onerror = () => reject( request.error )

        transaction.oncomplete = () => resolve( null )
        transaction.onerror = () => reject( transaction.error )
        transaction.onabort = () => reject( transaction.error )
    })
}

async function clearPersistentStore(){

    const db = await ensureDatabase()
    if( !db ) return

    await new Promise(( resolve, reject ) => {

        const transaction = db.transaction( STORE_NAME, "readwrite" )
        const store = transaction.objectStore( STORE_NAME )
        store.clear()

        transaction.oncomplete = () => resolve( null )
        transaction.onerror = () => reject( transaction.error )
        transaction.onabort = () => reject( transaction.error )
    })
}

function normalizeRoiPayload( payload ){

    if( Array.isArray( payload?.rois ) === false ){
        return []
    }

    var rois = []

    for( const roi of payload.rois ){
        const normalized = normalizeRoiEntry( roi )
        if( normalized === null ) continue
        rois.push( normalized )
    }

    return rois
}

function normalizeRoiEntry( roi ){

    if( roi === null || typeof roi !== "object" ) return null
    if( roi.shapeType !== "pixel-list" ) return null

    const roiId = String( roi.roiId ?? "" ).trim()
    if( roiId.length === 0 ) return null

    const boundingBox = normalizeRoiBoundingBox( roi.boundingBox )
    if( boundingBox === null ) return null

    const meanSpectrum = normalizeNumericSeries( roi.meanSpectrum )
    if( meanSpectrum === null ) return null

    const lowerBound = normalizeOptionalNumericSeries( roi.lowerBound, meanSpectrum.length )
    const upperBound = normalizeOptionalNumericSeries( roi.upperBound, meanSpectrum.length )
    const hasBounds = lowerBound !== null && upperBound !== null

    return {
        roiId,
        name: String( roi.name ?? "" ).trim() || "Untitled ROI",
        description: String( roi.description ?? "" ),
        createdAt: typeof roi.createdAt === "string" ? roi.createdAt : "",
        shapeType: "pixel-list",
        pixelCount: Number.isInteger( Number( roi.pixelCount )) ? Number( roi.pixelCount ) : ( boundingBox.width * boundingBox.height ),
        boundingBox,
        meanSpectrum,
        spectrumLength: meanSpectrum.length,
        lowerPercentage: Number.isFinite( Number( roi.lowerPercentage )) ? Number( roi.lowerPercentage ) : null,
        lowerBound: hasBounds ? lowerBound : null,
        upperPercentage: Number.isFinite( Number( roi.upperPercentage )) ? Number( roi.upperPercentage ) : null,
        upperBound: hasBounds ? upperBound : null,
        xy: roi.xy !== null && typeof roi.xy === "object" ? roi.xy : null,
        normalization: roi.normalization !== null && typeof roi.normalization === "object" ? roi.normalization : null,
        source: roi.source !== null && typeof roi.source === "object" ? roi.source : null
    }
}

function normalizeRoiBoundingBox( boundingBox ){

    if( boundingBox === null || typeof boundingBox !== "object" ) return null

    const minX = Number.parseInt( boundingBox.minX, 10 )
    const maxX = Number.parseInt( boundingBox.maxX, 10 )
    const minY = Number.parseInt( boundingBox.minY, 10 )
    const maxY = Number.parseInt( boundingBox.maxY, 10 )

    if( Number.isInteger( minX ) === false ||
        Number.isInteger( maxX ) === false ||
        Number.isInteger( minY ) === false ||
        Number.isInteger( maxY ) === false ){
        return null
    }

    if( maxX < minX || maxY < minY ){
        return null
    }

    const width = Number.isInteger( Number( boundingBox.width ))
        ? Number( boundingBox.width )
        : ( maxX - minX + 1 )
    const height = Number.isInteger( Number( boundingBox.height ))
        ? Number( boundingBox.height )
        : ( maxY - minY + 1 )

    return {
        minX,
        maxX,
        minY,
        maxY,
        width,
        height
    }
}

function normalizeNumericSeries( values ){

    if( Array.isArray( values ) === false || values.length === 0 ){
        return null
    }

    var series = []

    for( const value of values ){
        const numeric = Number( value )
        series.push( Number.isFinite( numeric ) ? numeric : null )
    }

    if( series.some(( value ) => value !== null ) === false ){
        return null
    }

    return series
}

function normalizeOptionalNumericSeries( values, expectedLength ){

    if( Array.isArray( values ) === false || values.length !== expectedLength ){
        return null
    }

    return normalizeNumericSeries( values )
}

export default {
    initProjectCache,
    getMip,
    getMipHsv,
    getXyz,
    getRois,
    refreshRois,
    getLayer,
    getPcaScore,
    getLoadings,
    setActiveLayer,
    setActivePca,
    prefetchWindow,
    prefetchPcaWindow,
    prefetchPcaScores,
    clearProjectCache,
    clearAllHyperspectrumCache,
    getCacheStats
}
