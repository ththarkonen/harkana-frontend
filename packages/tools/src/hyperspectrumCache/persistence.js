import {
    estimateValueSizeBytes,
    matchesModePrefixes
} from "./helpers.js"

const DB_NAME = "harkana-hyperspectrum-cache"
const DB_VERSION = 1
const STORE_NAME = "entries"
const SCHEMA_VERSION = 1

let databasePromise = null

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

async function deletePersistentProjectEntriesByModePrefixes( projectID, prefixes ){

    const db = await ensureDatabase()
    if( !db ) return

    await new Promise(( resolve, reject ) => {

        const transaction = db.transaction( STORE_NAME, "readwrite" )
        const store = transaction.objectStore( STORE_NAME )

        if( store.indexNames.contains( "projectID" ) === false ){
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

            const value = cursor.value
            if( value?.projectID !== projectID ){
                cursor.continue()
                return
            }

            const mode = typeof value?.mode === "string" ? value.mode : ""
            if( matchesModePrefixes( mode, prefixes ) ){
                store.delete( cursor.primaryKey )
            }

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

export {
    clearPersistentStore,
    deletePersistentEntry,
    deletePersistentProjectEntries,
    deletePersistentProjectEntriesByModePrefixes,
    ensureDatabase,
    readPersistentValue,
    writePersistentValue
}
