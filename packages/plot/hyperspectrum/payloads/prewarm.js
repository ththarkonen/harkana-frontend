import { prepareVisualizationPayloadInWorker } from "../../visualizationWorkerClient.js"
import { getPcaComponentColors } from "../pcaColors.js"
import { normalizeExternalHeatmapRendererMode } from "../rendererMode.js"
import {
    buildExternalHeatmapPayloadCacheKey,
    getCachedExternalHeatmapPayload,
    setCachedExternalHeatmapPayload
} from "./cache.js"
import { buildBitmapPayloadFromRgbaPayloadAsync } from "./materialize.js"
import {
    normalizeMip,
    normalizePcaMip,
    normalizePcaScores,
    normalizeRgbMip,
    normalizeUmapChannels,
    normalizeZBlendSource,
    zBlendPayloadSignature
} from "./normalize.js"
import {
    buildPcaClassificationImage,
    buildPcaMipImage,
    buildPcaRgbImage,
    buildRgbMipImage,
    buildScalarHeatmapPayload,
    buildUmapImage,
    buildZBlendRendererPayload
} from "./images.js"

function prewarmScalarHeatmapRendererPayload( graphContainer, mip, options = {} ){

    if( !graphContainer ) return null

    const cacheKey = buildExternalHeatmapPayloadCacheKey( "scalar", mip, { colorscale: options?.colorscale } )
    const cachedPayload = getCachedExternalHeatmapPayload( graphContainer, cacheKey )
    if( cachedPayload !== null ){
        return cachedPayload
    }

    const matrix = normalizeMip( mip )
    const payload = buildScalarHeatmapPayload( matrix, options?.colorscale )
    setCachedExternalHeatmapPayload( graphContainer, cacheKey, payload )

    return payload
}

function prewarmRgbHeatmapRendererPayload( graphContainer, mipRgb ){

    if( !graphContainer ) return null

    const cacheKey = buildExternalHeatmapPayloadCacheKey( "rgb", mipRgb )
    const cachedPayload = getCachedExternalHeatmapPayload( graphContainer, cacheKey )
    if( cachedPayload !== null ){
        return cachedPayload
    }

    const rgbMatrix = normalizeRgbMip( mipRgb )
    const payload = buildRgbMipImage( rgbMatrix, {
        includeSource: false,
        includePixelMetrics: false
    } )
    setCachedExternalHeatmapPayload( graphContainer, cacheKey, payload )

    return payload
}

async function prewarmRgbHeatmapRendererPayloadAsync( graphContainer, mipRgb ){

    if( !graphContainer ) return null

    const cacheKey = buildExternalHeatmapPayloadCacheKey( "rgb", mipRgb )
    const cachedPayload = getCachedExternalHeatmapPayload( graphContainer, cacheKey )
    if( cachedPayload !== null ){
        return cachedPayload
    }

    try{
        const result = await prepareVisualizationPayloadInWorker( "rgb-mip", {
            rgbMatrix: mipRgb
        } )
        const payload = await buildBitmapPayloadFromRgbaPayloadAsync( result, {}, {
            includeSource: false
        } )
        setCachedExternalHeatmapPayload( graphContainer, cacheKey, payload )
        return payload
    } catch( error ){
        console.log( error )
        return prewarmRgbHeatmapRendererPayload( graphContainer, mipRgb )
    }
}

function prewarmUmapHeatmapRendererPayload( graphContainer, umapChannels, options = {} ){

    if( !graphContainer ) return null

    const cacheKey = buildExternalHeatmapPayloadCacheKey( "umap", umapChannels, { channelColors: options?.channelColors } )
    const cachedPayload = getCachedExternalHeatmapPayload( graphContainer, cacheKey )
    if( cachedPayload !== null ){
        return cachedPayload
    }

    const normalizedChannels = normalizeUmapChannels( umapChannels )
    const payload = buildUmapImage( normalizedChannels, {
        ...options,
        includeSource: false,
        includePixelMetrics: false
    } )
    setCachedExternalHeatmapPayload( graphContainer, cacheKey, payload )

    return payload
}

async function prewarmUmapHeatmapRendererPayloadAsync( graphContainer, umapChannels, options = {} ){

    if( !graphContainer ) return null

    const cacheKey = buildExternalHeatmapPayloadCacheKey( "umap", umapChannels, { channelColors: options?.channelColors } )
    const cachedPayload = getCachedExternalHeatmapPayload( graphContainer, cacheKey )
    if( cachedPayload !== null ){
        return cachedPayload
    }

    try{
        const result = await prepareVisualizationPayloadInWorker( "umap", {
            umapChannels,
            channelColors: options?.channelColors
        } )
        const payload = await buildBitmapPayloadFromRgbaPayloadAsync( result, {}, {
            includeSource: false
        } )
        setCachedExternalHeatmapPayload( graphContainer, cacheKey, payload )
        return payload
    } catch( error ){
        console.log( error )
        return prewarmUmapHeatmapRendererPayload( graphContainer, umapChannels, options )
    }
}

function prewarmPcaMipHeatmapRendererPayload( graphContainer, pcaMip ){

    if( !graphContainer ) return null

    const cacheKey = buildExternalHeatmapPayloadCacheKey( "pca-mip", pcaMip )
    const cachedPayload = getCachedExternalHeatmapPayload( graphContainer, cacheKey )
    if( cachedPayload !== null ){
        return cachedPayload
    }

    const normalizedPcaMip = normalizePcaMip( pcaMip )
    const payload = buildPcaMipImage( normalizedPcaMip, {
        includeSource: false,
        includePixelMetrics: false
    } )
    setCachedExternalHeatmapPayload( graphContainer, cacheKey, payload )

    return payload
}

async function prewarmPcaMipHeatmapRendererPayloadAsync( graphContainer, pcaMip ){

    if( !graphContainer ) return null

    const cacheKey = buildExternalHeatmapPayloadCacheKey( "pca-mip", pcaMip )
    const cachedPayload = getCachedExternalHeatmapPayload( graphContainer, cacheKey )
    if( cachedPayload !== null ){
        return cachedPayload
    }

    try{
        const result = await prepareVisualizationPayloadInWorker( "pca-mip", {
            pcaMip,
            componentColors: getPcaComponentColors(),
            useEncodedBrightness: true
        } )
        const payload = await buildBitmapPayloadFromRgbaPayloadAsync( result, {}, {
            includeSource: false
        } )
        setCachedExternalHeatmapPayload( graphContainer, cacheKey, payload )
        return payload
    } catch( error ){
        console.log( error )
        return prewarmPcaMipHeatmapRendererPayload( graphContainer, pcaMip )
    }
}

function prewarmPcaClassificationHeatmapRendererPayload( graphContainer, scoresByComponent ){

    if( !graphContainer ) return null

    if( Array.isArray( scoresByComponent ) &&
        scoresByComponent.length > 0 &&
        Array.isArray( scoresByComponent[0] ) &&
        Array.isArray( scoresByComponent[0][0] ) === false ){

        const mipCacheKey = buildExternalHeatmapPayloadCacheKey( "pca-classification-mip", scoresByComponent )
        const cachedMipPayload = getCachedExternalHeatmapPayload( graphContainer, mipCacheKey )
        if( cachedMipPayload !== null ){
            return cachedMipPayload
        }

        const normalizedPcaMip = normalizePcaMip( scoresByComponent )
        const mipPayload = buildPcaMipImage( normalizedPcaMip, {
            useEncodedBrightness: false,
            includeSource: false,
            includePixelMetrics: false
        } )
        setCachedExternalHeatmapPayload( graphContainer, mipCacheKey, mipPayload )

        return mipPayload
    }

    const cacheKey = buildExternalHeatmapPayloadCacheKey( "pca-classification", scoresByComponent )
    const cachedPayload = getCachedExternalHeatmapPayload( graphContainer, cacheKey )
    if( cachedPayload !== null ){
        return cachedPayload
    }

    const componentScores = normalizePcaScores( scoresByComponent )
    const payload = buildPcaClassificationImage( componentScores, {
        includeSource: false,
        includePixelMetrics: false
    } )
    setCachedExternalHeatmapPayload( graphContainer, cacheKey, payload )

    return payload
}

async function prewarmPcaClassificationHeatmapRendererPayloadAsync( graphContainer, scoresByComponent ){

    if( !graphContainer ) return null

    if( Array.isArray( scoresByComponent ) &&
        scoresByComponent.length > 0 &&
        Array.isArray( scoresByComponent[0] ) &&
        Array.isArray( scoresByComponent[0][0] ) === false ){

        const mipCacheKey = buildExternalHeatmapPayloadCacheKey( "pca-classification-mip", scoresByComponent )
        const cachedMipPayload = getCachedExternalHeatmapPayload( graphContainer, mipCacheKey )
        if( cachedMipPayload !== null ){
            return cachedMipPayload
        }

        try{
            const result = await prepareVisualizationPayloadInWorker( "pca-mip", {
                pcaMip: scoresByComponent,
                componentColors: getPcaComponentColors(),
                useEncodedBrightness: false
            } )
            const mipPayload = await buildBitmapPayloadFromRgbaPayloadAsync( result, {}, {
                includeSource: false
            } )
            setCachedExternalHeatmapPayload( graphContainer, mipCacheKey, mipPayload )
            return mipPayload
        } catch( error ){
            console.log( error )
            return prewarmPcaClassificationHeatmapRendererPayload( graphContainer, scoresByComponent )
        }
    }

    const cacheKey = buildExternalHeatmapPayloadCacheKey( "pca-classification", scoresByComponent )
    const cachedPayload = getCachedExternalHeatmapPayload( graphContainer, cacheKey )
    if( cachedPayload !== null ){
        return cachedPayload
    }

    try{
        const result = await prepareVisualizationPayloadInWorker( "pca-classification", {
            scoresByComponent,
            componentColors: getPcaComponentColors()
        } )
        const payload = await buildBitmapPayloadFromRgbaPayloadAsync( result, {}, {
            includeSource: false
        } )
        setCachedExternalHeatmapPayload( graphContainer, cacheKey, payload )
        return payload
    } catch( error ){
        console.log( error )
        return prewarmPcaClassificationHeatmapRendererPayload( graphContainer, scoresByComponent )
    }
}

function prewarmPcaRgbHeatmapRendererPayload( graphContainer, scoresByComponent, options = {} ){

    if( !graphContainer ) return null

    const cacheKey = buildExternalHeatmapPayloadCacheKey( "pca-rgb", scoresByComponent, { channels: options?.channels } )
    const cachedPayload = getCachedExternalHeatmapPayload( graphContainer, cacheKey )
    if( cachedPayload !== null ){
        return cachedPayload
    }

    const componentScores = normalizePcaScores( scoresByComponent )
    const payload = buildPcaRgbImage( componentScores, {
        ...options,
        includeSource: false,
        includePixelMetrics: false
    } )
    setCachedExternalHeatmapPayload( graphContainer, cacheKey, payload )

    return payload
}

async function prewarmPcaRgbHeatmapRendererPayloadAsync( graphContainer, scoresByComponent, options = {} ){

    if( !graphContainer ) return null

    const cacheKey = buildExternalHeatmapPayloadCacheKey( "pca-rgb", scoresByComponent, { channels: options?.channels } )
    const cachedPayload = getCachedExternalHeatmapPayload( graphContainer, cacheKey )
    if( cachedPayload !== null ){
        return cachedPayload
    }

    try{
        const result = await prepareVisualizationPayloadInWorker( "pca-rgb", {
            scoresByComponent,
            channels: options?.channels,
            componentColors: getPcaComponentColors()
        } )
        const payload = await buildBitmapPayloadFromRgbaPayloadAsync( result, {}, {
            includeSource: false
        } )
        setCachedExternalHeatmapPayload( graphContainer, cacheKey, payload )
        return payload
    } catch( error ){
        console.log( error )
        return prewarmPcaRgbHeatmapRendererPayload( graphContainer, scoresByComponent, options )
    }
}

function prewarmZBlendHeatmapRendererPayload( graphContainer, zBlendSource ){

    if( !graphContainer ) return null

    const cacheKey = buildExternalHeatmapPayloadCacheKey( "z-blend", zBlendPayloadSignature( zBlendSource ) )
    const cachedPayload = getCachedExternalHeatmapPayload( graphContainer, cacheKey )
    if( cachedPayload !== null ){
        return cachedPayload
    }

    const normalizedSource = normalizeZBlendSource( zBlendSource )
    const payload = buildZBlendRendererPayload( normalizedSource )
    setCachedExternalHeatmapPayload( graphContainer, cacheKey, payload )

    return payload
}

function updateZBlendHeatmapPayload( zBlendSource, graphContainer, options = {} ){

    if( !graphContainer ) return null

    const normalizedSource = normalizeZBlendSource( zBlendSource )
    const payload = buildZBlendRendererPayload( normalizedSource )

    graphContainer.__harkanaHeatmapRendererPayload = payload ?? null
    graphContainer.__harkanaHeatmapRendererMode = normalizeExternalHeatmapRendererMode( options?.heatmapRenderer )

    return payload
}

export {
    prewarmPcaClassificationHeatmapRendererPayload,
    prewarmPcaClassificationHeatmapRendererPayloadAsync,
    prewarmPcaMipHeatmapRendererPayload,
    prewarmPcaMipHeatmapRendererPayloadAsync,
    prewarmPcaRgbHeatmapRendererPayload,
    prewarmPcaRgbHeatmapRendererPayloadAsync,
    prewarmRgbHeatmapRendererPayload,
    prewarmRgbHeatmapRendererPayloadAsync,
    prewarmScalarHeatmapRendererPayload,
    prewarmUmapHeatmapRendererPayload,
    prewarmUmapHeatmapRendererPayloadAsync,
    prewarmZBlendHeatmapRendererPayload,
    updateZBlendHeatmapPayload
}
