import results from "./results.js"
import hyperspectra from "./api/hyperspectra.ts"
import {
    cacheKey,
    clampLayerIndexToMaximum,
    createDeferred,
    decompositionMipModeFromCount,
    decompositionScoreModeFromIndex,
    estimateValueSizeBytes,
    layerIndexFromMode,
    matchesModePrefixes,
    modeFromCacheKey,
    normalizeDecompositionFamily,
    normalizeLayerIndex,
    normalizeModePrefixes,
    normalizeOptionalNonNegativeInteger,
    normalizePcaIndex,
    normalizePositiveInteger,
    pcaIndexFromMode,
    pcaMipModeFromCount,
    pcaModeFromIndex,
    readProjectID,
    resolveLayerWindowBounds,
    rpcaMipModeFromCount,
    rpcaModeFromIndex,
    shouldPersistLoadedValue
} from "./hyperspectrumCache/helpers.js"
import {
    clearPersistentStore,
    deletePersistentEntry,
    deletePersistentProjectEntries,
    deletePersistentProjectEntriesByModePrefixes,
    ensureDatabase,
    readPersistentValue,
    writePersistentValue
} from "./hyperspectrumCache/persistence.js"
import {
    normalizeRoiPayload
} from "./hyperspectrumCache/roi.js"

const DEFAULT_MEMORY_BUDGET_BYTES = 600 * 1024 * 1024
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000
const DEFAULT_PREFETCH_RADIUS = 3
const DEFAULT_LOW_CONCURRENCY = 1
const DEFAULT_PCA_MAX_COMPONENT = 10

var projectCaches = new Map()

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

var getArtifact = async function( project, mode, options = {} ){

    const normalizedMode = typeof mode === "string" ? mode.trim() : ""
    if( normalizedMode.length === 0 ){
        throw new Error( "Artifact mode must be a non-empty string." )
    }

    const priority = options.priority === "low" ? "low" : "high"
    return await getOrLoad( project, normalizedMode, { ...options, priority })
}

var getMipHsv = async function( project, options = {} ){
    const priority = options.priority === "low" ? "low" : "high"
    return await getOrLoad( project, "mip_hsv", { ...options, priority })
}

var getUmap = async function( project, options = {} ){

    const priority = options.priority === "low" ? "low" : "high"

    const [ redChannel, greenChannel, blueChannel ] = await Promise.all([
        getOrLoad( project, "umap/r", { ...options, priority }),
        getOrLoad( project, "umap/g", { ...options, priority }),
        getOrLoad( project, "umap/b", { ...options, priority })
    ])

    return {
        r: redChannel,
        g: greenChannel,
        b: blueChannel
    }
}

var getXyz = async function( project, options = {} ){
    const priority = options.priority === "low" ? "low" : "high"
    return await getOrLoad( project, "xyz", { ...options, priority })
}

var setXyz = async function( project, xyz, options = {} ){

    const state = ensureProjectState( project, options )
    const mode = "xyz"
    const key = cacheKey( state.projectID, mode )

    setMemoryValue( state, key, xyz )

    try{
        await writePersistentValue( key, state.projectID, mode, xyz, state.ttlMs )
        state.stats.persistentWrites += 1
    } catch( error ){
        state.stats.persistentErrors += 1
    }

    return xyz
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

var peekArtifact = function( project, mode, options = {} ){

    const normalizedMode = typeof mode === "string" ? mode.trim() : ""
    if( normalizedMode.length === 0 ){
        return null
    }

    const state = ensureProjectState( project, options )
    const key = cacheKey( state.projectID, normalizedMode )
    const memoryEntry = state.memory.get( key )
    return memoryEntry ? memoryEntry.value : null
}

var peekLayer = function( project, layerIndex, options = {} ){

    const normalizedLayer = normalizeLayerIndex( layerIndex )
    return peekArtifact( project, "layers/" + normalizedLayer, options )
}

var getPcaScore = async function( project, componentIndex, options = {} ){

    return await getDecompositionScore( project, "pca", componentIndex, options )
}

var getRpcaScore = async function( project, componentIndex, options = {} ){
    return await getDecompositionScore( project, "rpca", componentIndex, options )
}

var getLoadings = async function( project, options = {} ){

    return await getDecompositionLoadings( project, "pca", options )
}

var getRpcaLoadings = async function( project, options = {} ){
    return await getDecompositionLoadings( project, "rpca", options )
}

var getPcaMip = async function( project, options = {} ){

    return await getDecompositionMip( project, "pca", options )
}

var getRpcaMip = async function( project, options = {} ){
    return await getDecompositionMip( project, "rpca", options )
}

var setActiveLayer = function( project, layerIndex, options = {} ){

    const state = ensureProjectState( project, options )
    state.activeLayer = clampLayerIndexToMaximum( normalizeLayerIndex( layerIndex ), state.maxLayerIndex )

    pruneLowQueue( state )
    updatePins( state )
    enforceMemoryBudget( state )
    pumpLowQueue( state )
}

var setInitialLayerWindow = function( project, layerIndex, options = {} ){

    const state = ensureProjectState( project, options )
    state.initialLayer = clampLayerIndexToMaximum( normalizeLayerIndex( layerIndex ), state.maxLayerIndex )

    pruneLowQueue( state )
    updatePins( state )
    enforceMemoryBudget( state )
    pumpLowQueue( state )
}

var setActivePca = function( project, componentIndex, options = {} ){

    setActiveDecomposition( project, "pca", componentIndex, options )
}

var setActiveRpca = function( project, componentIndex, options = {} ){
    setActiveDecomposition( project, "rpca", componentIndex, options )
}

var prefetchWindow = async function( project, centerIndex, radius = null, options = {} ){

    const state = ensureProjectState( project, options )
    const center = clampLayerIndexToMaximum( normalizeLayerIndex( centerIndex ), state.maxLayerIndex )
    const prefetchRadius = normalizePositiveInteger( radius ) ?? state.prefetchRadius

    setActiveLayer( project, center, options )

    const windowBounds = resolveLayerWindowBounds( center, prefetchRadius, state.maxLayerIndex )

    for( let layerIndex = windowBounds.start; layerIndex <= windowBounds.end; layerIndex++ ){
        if( layerIndex === center ) continue
        void getLayer( project, layerIndex, { ...options, priority: "low" }).catch(() => null)
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

async function getDecompositionScore( project, family, componentIndex, options = {} ){

    const normalizedComponent = normalizePcaIndex( componentIndex )
    const mode = decompositionScoreModeFromIndex( family, normalizedComponent )
    const priority = options.priority === "low" ? "low" : "high"

    return await getOrLoad( project, mode, { ...options, priority })
}

async function getDecompositionLoadings( project, family, options = {} ){

    const normalizedFamily = normalizeDecompositionFamily( family )
    const priority = options.priority === "low" ? "low" : "high"

    return await getOrLoad( project, normalizedFamily + "/loadings", { ...options, priority })
}

async function getDecompositionMip( project, family, options = {} ){

    const normalizedFamily = normalizeDecompositionFamily( family )
    const normalizedComponentCount = normalizePcaIndex( options.componentCount ?? options.count ?? DEFAULT_PCA_MAX_COMPONENT )
    const state = ensureProjectState( project, options )

    if( normalizedFamily === "pca" ){
        state.activePcaMip = normalizedComponentCount
        if( Number.isInteger( state.initialPcaMip ) === false ){
            state.initialPcaMip = normalizedComponentCount
        }
    } else {
        state.activeRpcaMip = normalizedComponentCount
        if( Number.isInteger( state.initialRpcaMip ) === false ){
            state.initialRpcaMip = normalizedComponentCount
        }
    }

    updatePins( state )
    enforceMemoryBudget( state )

    const mode = decompositionMipModeFromCount( normalizedFamily, normalizedComponentCount )
    const priority = options.priority === "low" ? "low" : "high"

    return await getOrLoad( project, mode, { ...options, priority })
}

function setActiveDecomposition( project, family, componentIndex, options = {} ){

    const normalizedFamily = normalizeDecompositionFamily( family )
    const state = ensureProjectState( project, options )
    const normalizedComponent = normalizePcaIndex( componentIndex )

    if( normalizedFamily === "pca" ){
        state.activePca = normalizedComponent
    } else {
        state.activeRpca = normalizedComponent
    }

    pruneLowQueue( state )
    updatePins( state )
    enforceMemoryBudget( state )
    pumpLowQueue( state )
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

var clearProjectModePrefixes = async function( project, prefixes = [] ){

    const normalizedPrefixes = normalizeModePrefixes( prefixes )
    if( normalizedPrefixes.length === 0 ) return

    const projectID = readProjectID( project )
    const state = projectCaches.get( projectID )

    if( state ){

        const removedQueuedKeys = new Set()

        state.lowQueue = state.lowQueue.filter(( task ) => {

            const shouldRemove = matchesModePrefixes( task?.mode, normalizedPrefixes )
            if( shouldRemove ){
                removedQueuedKeys.add( task.key )
            }

            return !shouldRemove
        })

        for( const [ key, inflightEntry ] of state.inFlight.entries() ){

            const mode = modeFromCacheKey( projectID, key )
            if( matchesModePrefixes( mode, normalizedPrefixes ) === false ){
                continue
            }

            if( inflightEntry?.status === "queued" ||
                inflightEntry?.status === "running" ||
                removedQueuedKeys.has( key ) ){
                inflightEntry.deferred.resolve( null )
                state.inFlight.delete( key )
            }
        }

        for( const key of [ ...state.memory.keys() ] ){
            const mode = modeFromCacheKey( projectID, key )
            if( matchesModePrefixes( mode, normalizedPrefixes ) === false ){
                continue
            }

            removeMemoryEntry( state, key )
        }
    }

    await deletePersistentProjectEntriesByModePrefixes( projectID, normalizedPrefixes )
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
            activePcaMip: DEFAULT_PCA_MAX_COMPONENT,
            activeRpca: 1,
            activeRpcaMip: DEFAULT_PCA_MAX_COMPONENT,
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
        activePcaMip: state.activePcaMip,
        activeRpca: state.activeRpca,
        activeRpcaMip: state.activeRpcaMip,
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
            const value = await loadFromNetwork( project, mode, inflightEntry.priority )

            if( state.inFlight.get( key ) !== inflightEntry ){
                return
            }

            state.stats.networkHits += 1

            setMemoryValue( state, key, value )

            if( shouldPersistLoadedValue( inflightEntry.priority, mode ) ){
                void writePersistentValue( key, state.projectID, mode, value, state.ttlMs )
                    .then(() => {
                        state.stats.persistentWrites += 1
                    })
                    .catch(() => {
                        state.stats.persistentErrors += 1
                    })
            }

            inflightEntry.deferred.resolve( value )

        } catch( error ){
            if( state.inFlight.get( key ) !== inflightEntry ){
                return
            }
            inflightEntry.deferred.reject( error )

        } finally {

            if( state.inFlight.get( key ) === inflightEntry ){
                state.inFlight.delete( key )
            }

            if( fromLowQueue ){
                state.runningLow = Math.max( 0, state.runningLow - 1 )
                pumpLowQueue( state )
            }
        }
    })()
}

function pruneLowQueue( state ){

    var keptTasks = []
    const activeLayerWindow = resolveLayerWindowBounds( state.activeLayer, state.prefetchRadius, state.maxLayerIndex )

    for( const task of state.lowQueue ){

        const layerIndex = layerIndexFromMode( task.mode )
        const pcaIndex = pcaIndexFromMode( task.mode )

        if( layerIndex === null && pcaIndex === null ){
            keptTasks.push( task )
            continue
        }

        if( layerIndex !== null &&
            layerIndex >= activeLayerWindow.start &&
            layerIndex <= activeLayerWindow.end ){
            keptTasks.push( task )
            continue
        }

        if( pcaIndex !== null && Math.abs( pcaIndex - state.activePca ) <= state.prefetchRadius ){
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

async function loadFromNetwork( project, mode, priority = "high" ){

    if( mode === "roi/frontend" ){
        return await hyperspectra.listRois( project )
    }

    const loaded = await results.load( project, mode, { priority } )

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
    const value = await loadFromNetwork( project, mode, "high" )

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
        maxLayerIndex: null,
        activeLayer: 0,
        initialLayer: null,
        activePca: 1,
        activePcaMip: DEFAULT_PCA_MAX_COMPONENT,
        initialPcaMip: null,
        activeRpca: 1,
        activeRpcaMip: DEFAULT_PCA_MAX_COMPONENT,
        initialRpcaMip: null,
        accessCounter: 0,
        memory: new Map(),
        memoryBytes: 0,
        pinnedKeys: new Set(),
        pinsDirty: true,
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
    if( radius !== null && state.prefetchRadius !== radius ){
        state.prefetchRadius = radius
        state.pinsDirty = true
    }

    const lowConcurrency = normalizePositiveInteger( options.lowConcurrency )
    if( lowConcurrency !== null ) state.lowConcurrency = lowConcurrency

    const maxLayerIndex = normalizeOptionalNonNegativeInteger( options.maxLayerIndex )
    if( maxLayerIndex !== null && state.maxLayerIndex !== maxLayerIndex ){
        state.maxLayerIndex = maxLayerIndex
        state.pinsDirty = true
    }
}

function updatePins( state ){

    const pinnedKeys = computePinnedKeys( state )
    state.pinnedKeys = pinnedKeys
    state.pinsDirty = false

    for( const [ key, entry ] of state.memory.entries() ){
        entry.pinned = pinnedKeys.has( key )
    }
}

function computePinnedKeys( state ){

    const pinnedKeys = new Set([
        cacheKey( state.projectID, "mip" ),
        cacheKey( state.projectID, "mip_hsv" ),
        cacheKey( state.projectID, "umap/r" ),
        cacheKey( state.projectID, "umap/g" ),
        cacheKey( state.projectID, "umap/b" ),
        cacheKey( state.projectID, "xyz" ),
        cacheKey( state.projectID, "pca/loadings" ),
        cacheKey( state.projectID, "rpca/loadings" ),
        cacheKey( state.projectID, pcaMipModeFromCount( state.activePcaMip ) ),
        cacheKey( state.projectID, rpcaMipModeFromCount( state.activeRpcaMip ) )
    ])

    if( Number.isInteger( state.initialPcaMip ) ){
        pinnedKeys.add( cacheKey( state.projectID, pcaMipModeFromCount( state.initialPcaMip ) ))
    }

    if( Number.isInteger( state.initialRpcaMip ) ){
        pinnedKeys.add( cacheKey( state.projectID, rpcaMipModeFromCount( state.initialRpcaMip ) ))
    }

    addPinnedLayerWindow( pinnedKeys, state.projectID, state.activeLayer, state.prefetchRadius, state.maxLayerIndex )

    if( Number.isInteger( state.initialLayer ) ){
        addPinnedLayerWindow( pinnedKeys, state.projectID, state.initialLayer, state.prefetchRadius, state.maxLayerIndex )
    }

    for( var componentIndex = 1; componentIndex <= DEFAULT_PCA_MAX_COMPONENT; componentIndex++ ){
        pinnedKeys.add( cacheKey( state.projectID, pcaModeFromIndex( componentIndex ) ))
        pinnedKeys.add( cacheKey( state.projectID, rpcaModeFromIndex( componentIndex ) ))
    }

    return pinnedKeys
}

function addPinnedLayerWindow( pinnedKeys, projectID, centerLayer, radius = 1, maxLayerIndex = null ){

    if( Number.isInteger( centerLayer ) === false || centerLayer < 0 ) return
    const windowBounds = resolveLayerWindowBounds( centerLayer, radius, maxLayerIndex )
    const prefixes = [ "layers/", "estimate/layers/" ]

    for( const prefix of prefixes ){
        for( let layerIndex = windowBounds.start; layerIndex <= windowBounds.end; layerIndex++ ){
            pinnedKeys.add( cacheKey( projectID, prefix + layerIndex ))
        }
    }
}

function setMemoryValue( state, key, value ){

    const sizeBytes = estimateValueSizeBytes( value )
    const previous = state.memory.get( key )

    if( previous ){
        state.memoryBytes -= previous.sizeBytes
    }

    state.accessCounter += 1

    if( state.pinsDirty ){
        updatePins( state )
    }

    if( state.pinnedKeys.size === 0 ){
        state.pinnedKeys = computePinnedKeys( state )
        state.pinsDirty = false
    }

    state.memory.set( key, {
        value,
        sizeBytes,
        pinned: state.pinnedKeys.has( key ),
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


export default {
    initProjectCache,
    getArtifact,
    peekArtifact,
    getMip,
    getMipHsv,
    getUmap,
    getXyz,
    setXyz,
    getRois,
    refreshRois,
    getLayer,
    peekLayer,
    getPcaScore,
    getRpcaScore,
    getLoadings,
    getRpcaLoadings,
    getPcaMip,
    getRpcaMip,
    setActiveLayer,
    setInitialLayerWindow,
    setActivePca,
    setActiveRpca,
    prefetchWindow,
    prefetchPcaWindow,
    prefetchPcaScores,
    clearProjectCache,
    clearProjectModePrefixes,
    clearAllHyperspectrumCache,
    getCacheStats
}
