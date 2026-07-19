import Plotly from "plotly.js-dist"
import { plotlyNewPlot, plotlyReact } from "./mathjax.js"
import { setPcaComponentColors } from "./hyperspectrum/pcaColors.js"
import {
    buildExternalHeatmapPayloadCacheKey,
    buildPcaClassificationImage,
    buildPcaMipImage,
    buildPcaRgbImage,
    buildRgbMipImage,
    buildScalarHeatmapPayload,
    buildUmapImage,
    buildZBlendImage,
    dimensionStubMatrix,
    getCachedExternalHeatmapPayload,
    normalizeExternalHeatmapRendererMode,
    normalizeMip,
    normalizePcaMip,
    normalizePcaScores,
    normalizeRgbMip,
    normalizeUmapChannels,
    normalizeZBlendSource,
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
    setCachedExternalHeatmapPayload,
    shouldUseExternalHeatmapRenderer,
    updateZBlendHeatmapPayload
} from "./hyperspectrum/payloads.js"
import {
    cacheHeatmapOrigin,
    cacheHeatmapRendererPayload,
    resolveStoredHeatmapOrigin
} from "./hyperspectrum/rendererMode.js"
import {
    FULL_HEATMAP_AXIS_CONFIG,
    STANDALONE_HEATMAP_AXIS_CONFIG,
    clampUnit
} from "./hyperspectrum/shared.js"
import {
    buildFigure,
    buildLowerPanelFigure,
    buildPcaFigure,
    buildPcaMipFigure,
    buildPcaRgbFigure,
    buildRgbFigure,
    buildUpperPanelFigure,
    getHeatmapPaneState,
    relayoutHeatmapViewport,
    resetHeatmapViewport,
    resolveHeatmapAxisConfig,
    sanitizeAxisRange,
    updateLowerSpectrum
} from "./hyperspectrum/figures.js"

const SPECTRUM_GRID_MODEBAR_ICON = {
    width: 512,
    height: 512,
    ascent: 512,
    descent: 0,
    path: "M64 64H448V448H64V64ZM96 96V192H192V96H96ZM224 96V192H320V96H224ZM352 96V192H416V96H352ZM96 224V320H192V224H96ZM224 224V320H320V224H224ZM352 224V320H416V224H352ZM96 352V416H192V352H96ZM224 352V416H320V352H224ZM352 352V416H416V352H352Z"
}
const SPECTRUM_LEGEND_MODEBAR_ATTR = "toggle-legends"
const SPECTRUM_LEGEND_MODEBAR_ICON = {
    width: 512,
    height: 512,
    ascent: 512,
    descent: 0,
    path: "M88 120H152V184H88V120ZM184 132H424V172H184V132ZM88 224H152V288H88V224ZM184 236H424V276H184V236ZM88 328H152V392H88V328ZM184 340H424V380H184V340Z"
}
const HEATMAP_INTERACTION_CHANGE_EVENT = "harkana:heatmap-interaction-change"
const HEATMAP_RESET_VIEW_EVENT = "harkana:heatmap-reset-view"
const HEATMAP_SELECT_MODEBAR_ATTR = "heatmap-select-mode"
const HEATMAP_ZOOM_SQUARE_MODEBAR_ATTR = "heatmap-zoom-square-mode"
const HEATMAP_ZOOM_FREE_MODEBAR_ATTR = "heatmap-zoom-free-mode"
const HEATMAP_RESET_MODEBAR_ATTR = "heatmap-reset-view"
const HEATMAP_ZOOM_MODEBAR_ICON = Plotly?.Icons?.zoombox ?? {
    width: 512,
    height: 512,
    ascent: 512,
    descent: 0,
    path: "M96 96H416V416H96V96Z"
}
function normalizeSpectrumGridAxisKeys( axisKeys ){

    if( Array.isArray( axisKeys ) === false ){
        return []
    }

    return axisKeys.filter(( axisKey ) => typeof axisKey === "string" && axisKey.length > 0 )
}

function normalizeSpectrumGridlineVisibility( value, fallback = false ){
    if( typeof value === "boolean" ) return value
    if( typeof value === "string" ){
        if( value === "true" ) return true
        if( value === "false" ) return false
    }
    return fallback
}

function resolveDefaultHyperspectrumGridlines( settings ){
    return normalizeSpectrumGridlineVisibility( settings?.gridlines?.hyperspectra, false )
}

function normalizeSpectrumGridlineSourceKey( sourceKey ){
    return sourceKey === "estimate" ? "estimate" : "measurement"
}

function resolveDefaultHyperspectrumGridlinesForSource( settings, sourceKey, projectGridlineState = null ){

    const defaults = projectGridlineState !== null && typeof projectGridlineState === "object"
        ? projectGridlineState
        : settings?.projectSpectrumGridlines
    const normalizedSourceKey = normalizeSpectrumGridlineSourceKey( sourceKey )

    if( defaults !== null && typeof defaults === "object" ){
        return normalizeSpectrumGridlineVisibility(
            defaults[normalizedSourceKey],
            resolveDefaultHyperspectrumGridlines( settings )
        )
    }

    return resolveDefaultHyperspectrumGridlines( settings )
}

function buildSpectrumGridDefaultVisibilityMap( axisKeys, visible ){

    const resolvedAxisKeys = normalizeSpectrumGridAxisKeys( axisKeys )
    const normalizedVisible = normalizeSpectrumGridlineVisibility( visible, false )
    var visibilityMap = {}

    for( const axisKey of resolvedAxisKeys ){
        visibilityMap[axisKey] = normalizedVisible
    }

    return visibilityMap
}

function buildSpectrumGridAvailabilityMap( axisKeys, available ){

    const resolvedAxisKeys = normalizeSpectrumGridAxisKeys( axisKeys )
    const normalizedAvailable = available !== false
    var availabilityMap = {}

    for( const axisKey of resolvedAxisKeys ){
        availabilityMap[axisKey] = normalizedAvailable
    }

    return availabilityMap
}

function defaultSpectrumGridlineColor(){
    return "rgba(148, 163, 184, 0.22)"
}

function defaultSpectrumLegendLayout(){

    return {
        orientation: "h",
        x: 0.02,
        xanchor: "left",
        y: 0.98,
        yanchor: "top",
        bgcolor: "rgba(255, 255, 255, 0.82)",
        bordercolor: "rgba(148, 163, 184, 0.35)",
        borderwidth: 1,
        font: {
            size: 11,
            color: "#111827"
        },
        itemclick: false,
        itemdoubleclick: false
    }
}

function normalizeSpectrumGridlineVisibilityState( axisKeys, value, fallback = false ){

    const resolvedAxisKeys = normalizeSpectrumGridAxisKeys( axisKeys )
    var normalizedState = {}

    const normalizedFallback = value !== null && typeof value === "object" && Array.isArray( value ) === false
        ? null
        : normalizeSpectrumGridlineVisibility( fallback, false )

    for( const axisKey of resolvedAxisKeys ){
        if( value !== null && typeof value === "object" && Array.isArray( value ) === false ){
            normalizedState[axisKey] = normalizeSpectrumGridlineVisibility(
                value[axisKey],
                normalizeSpectrumGridlineVisibility( fallback?.[axisKey], false )
            )
            continue
        }

        normalizedState[axisKey] = normalizeSpectrumGridlineVisibility( value, normalizedFallback )
    }

    return normalizedState
}

function normalizeSpectrumGridlineAvailabilityState( axisKeys, value, fallback = true ){

    const resolvedAxisKeys = normalizeSpectrumGridAxisKeys( axisKeys )
    var normalizedState = {}
    const normalizedFallback = fallback !== false

    for( const axisKey of resolvedAxisKeys ){
        if( value !== null && typeof value === "object" && Array.isArray( value ) === false ){
            normalizedState[axisKey] = value[axisKey] !== false
            continue
        }

        normalizedState[axisKey] = value !== false && normalizedFallback
    }

    return normalizedState
}

function areSpectrumGridlinesVisible( graphContainer, axisKeys = [] ){

    const resolvedAxisKeys = normalizeSpectrumGridAxisKeys( axisKeys )
    if( resolvedAxisKeys.length === 0 ){
        return false
    }

    const visibilityState = normalizeSpectrumGridlineVisibilityState(
        resolvedAxisKeys,
        graphContainer?.__harkanaSpectrumGridlinesVisible,
        false
    )

    return resolvedAxisKeys.every(( axisKey ) => visibilityState[axisKey] === true )
}

function applySpectrumGridlineLayoutState( layout, graphContainer, axisKeys, defaultVisible = false, availability = true ){

    if( layout === null || typeof layout !== "object" ){
        return []
    }

    const resolvedAxisKeys = normalizeSpectrumGridAxisKeys( axisKeys )
    if( resolvedAxisKeys.length === 0 ){
        return []
    }

    const visibilityState = normalizeSpectrumGridlineVisibilityState(
        resolvedAxisKeys,
        graphContainer?.__harkanaSpectrumGridlinesVisible,
        defaultVisible
    )
    const availabilityState = normalizeSpectrumGridlineAvailabilityState(
        resolvedAxisKeys,
        availability,
        graphContainer?.__harkanaSpectrumGridlineAvailability
    )
    if( graphContainer ){
        graphContainer.__harkanaSpectrumGridlinesVisible = visibilityState
        graphContainer.__harkanaSpectrumGridlineAvailability = availabilityState
    }

    for( const axisKey of resolvedAxisKeys ){
        const axisLayout = layout[ axisKey ]
        if( axisLayout === null || typeof axisLayout !== "object" ) continue

        const showGrid = visibilityState[axisKey] === true && availabilityState[axisKey] !== false
        axisLayout.showgrid = showGrid
        if( showGrid ){
            if( typeof axisLayout.gridcolor !== "string" || axisLayout.gridcolor.length === 0 ){
                axisLayout.gridcolor = defaultSpectrumGridlineColor()
            }
            if( Number.isFinite( Number( axisLayout.gridwidth )) === false ){
                axisLayout.gridwidth = 1
            }
        }
    }

    return resolvedAxisKeys
}

function buildSpectrumGridlineRelayout( graphContainer, showGrid, axisKeys ){

    const resolvedAxisKeys = normalizeSpectrumGridAxisKeys( axisKeys )
    const visibilityState = normalizeSpectrumGridlineVisibilityState(
        resolvedAxisKeys,
        showGrid,
        graphContainer?.__harkanaSpectrumGridlinesVisible
    )
    const availabilityState = normalizeSpectrumGridlineAvailabilityState(
        resolvedAxisKeys,
        graphContainer?.__harkanaSpectrumGridlineAvailability,
        true
    )
    var relayout = {}

    for( const axisKey of resolvedAxisKeys ){
        const visible = visibilityState[axisKey] === true && availabilityState[axisKey] !== false
        relayout[ `${axisKey}.showgrid` ] = visible
        if( visible ){
            const existingGridColor = graphContainer?.layout?.[ axisKey ]?.gridcolor
            relayout[ `${axisKey}.gridcolor` ] = typeof existingGridColor === "string" && existingGridColor.length > 0
                ? existingGridColor
                : defaultSpectrumGridlineColor()
            relayout[ `${axisKey}.gridwidth` ] = 1
        }
    }

    return relayout
}

function buildSpectrumGridModebarButton( graphContainer ){
    return {
        name: "Toggle gridlines",
        title: "Toggle gridlines",
        attr: "toggle-gridlines",
        icon: SPECTRUM_GRID_MODEBAR_ICON,
        click: ( gd ) => {
            const axisKeys = normalizeSpectrumGridAxisKeys(
                gd?.__harkanaSpectrumGridAxisKeys ?? graphContainer?.__harkanaSpectrumGridAxisKeys
            )
            if( axisKeys.length === 0 ) return

            const nextVisible = !areSpectrumGridlinesVisible( gd, axisKeys )
            const nextState = normalizeSpectrumGridlineVisibilityState( axisKeys, nextVisible, false )
            gd.__harkanaSpectrumGridlinesVisible = nextState

            Plotly.relayout( gd, buildSpectrumGridlineRelayout( gd, nextState, axisKeys ))
                .then(() => {
                    if( typeof gd?.dispatchEvent === "function" ){
                        gd.dispatchEvent( new CustomEvent( "harkana:spectrum-gridlines-change", {
                            detail: {
                                visible: nextVisible
                            }
                        }) )
                    }
                    normalizeModebarButtonSpacing( gd )
                })
                .catch(( error ) => {
                    console.log( error )
                })
        }
    }
}

function normalizeSpectrumLegendVisibility( value, fallback = true ){
    if( value === null || value === undefined ){
        return fallback === true
    }

    return value === true || value === "true"
}

function hasSpectrumLegendItems( traces ){

    if( Array.isArray( traces ) === false ){
        return false
    }

    return traces.some(( trace ) => trace?.showlegend === true )
}

function areSpectrumLegendsVisible( graphContainer ){
    return normalizeSpectrumLegendVisibility( graphContainer?.__harkanaSpectrumLegendVisible, true )
}

function syncSpectrumLegendModebarState( graphContainer ){

    if( !graphContainer ){
        return
    }

    const legendButton = graphContainer.querySelector?.(`.modebar-btn[data-attr="${SPECTRUM_LEGEND_MODEBAR_ATTR}"]`)
    if( legendButton ){
        legendButton.classList.toggle(
            "active",
            areSpectrumLegendsVisible( graphContainer ) === true && graphContainer?.__harkanaSpectrumLegendAvailable === true
        )
    }
}

function buildSpectrumLegendModebarButton( graphContainer ){
    return {
        name: "Toggle legends",
        title: "Toggle legends",
        attr: SPECTRUM_LEGEND_MODEBAR_ATTR,
        icon: SPECTRUM_LEGEND_MODEBAR_ICON,
        click: ( gd ) => {
            const nextVisible = !areSpectrumLegendsVisible( gd )
            gd.__harkanaSpectrumLegendVisible = nextVisible
            gd.__harkanaSpectrumLegendAvailable = true

            if( typeof gd?.dispatchEvent === "function" ){
                gd.dispatchEvent( new CustomEvent( "harkana:spectrum-chip-legend-change", {
                    detail: {
                        visible: nextVisible
                    }
                }) )
            }

            syncSpectrumLegendModebarState( gd )
            normalizeModebarButtonSpacing( gd )
        }
    }
}

function normalizeModebarButtonSpacing( graphContainer ){
    const modebarGroups = Array.from( graphContainer?.querySelectorAll?.(".modebar-group") ?? [] )

    for( const group of modebarGroups ){
        group.style.marginLeft = "0px"
        group.style.paddingLeft = "0px"
    }
}

function resolveHeatmapModebarInteractionMode( graphContainer ){
    return graphContainer?.__harkanaHeatmapInteractionMode === "zoom" ? "zoom" : "select"
}

function resolveHeatmapModebarZoomAspectRatio( graphContainer ){
    return normalizeHeatmapZoomAspectRatio( graphContainer?.__harkanaHeatmapZoomAspectRatio )
}

function syncHeatmapModebarState( graphContainer, mode = "select", zoomAspectRatio = "square" ){

    if( !graphContainer ) return

    const normalizedMode = normalizeHeatmapInteractionMode( mode )
    const normalizedAspectRatio = normalizeHeatmapZoomAspectRatio( zoomAspectRatio )
    graphContainer.__harkanaHeatmapInteractionMode = normalizedMode
    graphContainer.__harkanaHeatmapZoomAspectRatio = normalizedAspectRatio

    const selectButton = graphContainer?.querySelector?.(`.modebar-btn[data-attr="${HEATMAP_SELECT_MODEBAR_ATTR}"]`)
    const zoomSquareButton = graphContainer?.querySelector?.(`.modebar-btn[data-attr="${HEATMAP_ZOOM_SQUARE_MODEBAR_ATTR}"]`)
    const zoomFreeButton = graphContainer?.querySelector?.(`.modebar-btn[data-attr="${HEATMAP_ZOOM_FREE_MODEBAR_ATTR}"]`)

    selectButton?.classList?.toggle( "active", normalizedMode === "select" )
    zoomSquareButton?.classList?.toggle( "active", normalizedMode === "zoom" && normalizedAspectRatio === "square" )
    zoomFreeButton?.classList?.toggle( "active", normalizedMode === "zoom" && normalizedAspectRatio === "free" )
}

function dispatchHeatmapModebarEvent( graphContainer, eventName, detail = {} ){

    if( typeof graphContainer?.dispatchEvent !== "function" ){
        return
    }

    graphContainer.dispatchEvent( new CustomEvent( eventName, { detail } ) )
}

function buildHeatmapSelectModebarButton( graphContainer ){

    return {
        name: "Select spectra",
        title: "Select spectra",
        attr: HEATMAP_SELECT_MODEBAR_ATTR,
        icon: Plotly.Icons.selectbox,
        click: ( gd ) => {
            const nextMode = "select"
            gd.__harkanaHeatmapInteractionMode = nextMode
            syncHeatmapModebarState( gd, nextMode, resolveHeatmapModebarZoomAspectRatio( gd ))
            dispatchHeatmapModebarEvent( gd, HEATMAP_INTERACTION_CHANGE_EVENT, {
                mode: nextMode
            })
        }
    }
}

function buildHeatmapZoomModebarButton( graphContainer, aspectRatio = "square" ){

    const normalizedAspectRatio = normalizeHeatmapZoomAspectRatio( aspectRatio )
    const isFree = normalizedAspectRatio === "free"
    const label = isFree ? "Zoom (free aspect ratio)" : "Zoom (square aspect ratio)"

    return {
        name: label,
        title: label,
        attr: isFree ? HEATMAP_ZOOM_FREE_MODEBAR_ATTR : HEATMAP_ZOOM_SQUARE_MODEBAR_ATTR,
        icon: HEATMAP_ZOOM_MODEBAR_ICON,
        click: ( gd ) => {
            gd.__harkanaHeatmapInteractionMode = "zoom"
            gd.__harkanaHeatmapZoomAspectRatio = normalizedAspectRatio
            syncHeatmapModebarState( gd, "zoom", normalizedAspectRatio )
            dispatchHeatmapModebarEvent( gd, HEATMAP_INTERACTION_CHANGE_EVENT, {
                mode: "zoom",
                zoomAspectRatio: normalizedAspectRatio
            })
        }
    }
}

function buildHeatmapResetModebarButton( graphContainer ){
    return {
        name: "Reset zoom",
        title: "Reset zoom",
        attr: HEATMAP_RESET_MODEBAR_ATTR,
        icon: Plotly.Icons.home,
        click: ( gd ) => {
            syncHeatmapModebarState(
                gd,
                resolveHeatmapModebarInteractionMode( gd ),
                resolveHeatmapModebarZoomAspectRatio( gd )
            )
            dispatchHeatmapModebarEvent( gd, HEATMAP_RESET_VIEW_EVENT )
        }
    }
}

async function setSpectrumGridlinesVisible( graphContainer, visible ){

    if( !graphContainer ) return

    const axisKeys = normalizeSpectrumGridAxisKeys( graphContainer.__harkanaSpectrumGridAxisKeys )
    if( axisKeys.length === 0 ) return
    const visibilityState = normalizeSpectrumGridlineVisibilityState(
        axisKeys,
        visible,
        graphContainer.__harkanaSpectrumGridlinesVisible
    )
    graphContainer.__harkanaSpectrumGridlinesVisible = visibilityState
    if( Array.isArray( graphContainer.data ) === false || graphContainer.data.length === 0 ) return

    await Plotly.relayout( graphContainer, buildSpectrumGridlineRelayout( graphContainer, visibilityState, axisKeys ))
    normalizeModebarButtonSpacing( graphContainer )
}

var initialize = async function( mip, graphContainer, settings = {}, options = {} ){
    await renderMatrix( mip, graphContainer, settings, options, false )
}

var update = async function( mip, graphContainer, settings = {}, options = {} ){
    await renderMatrix( mip, graphContainer, settings, options, true )
}

var initializeRgb = async function( mipRgb, graphContainer, settings = {}, options = {} ){
    await renderRgbMatrix( mipRgb, graphContainer, settings, options, false )
}

var updateRgb = async function( mipRgb, graphContainer, settings = {}, options = {} ){
    await renderRgbMatrix( mipRgb, graphContainer, settings, options, true )
}

var initializeUmap = async function( umapChannels, graphContainer, settings = {}, options = {} ){
    await renderUmapMatrix( umapChannels, graphContainer, settings, options, false )
}

var updateUmap = async function( umapChannels, graphContainer, settings = {}, options = {} ){
    await renderUmapMatrix( umapChannels, graphContainer, settings, options, true )
}

var initializePcaMip = async function( pcaMip, graphContainer, settings = {}, options = {} ){
    await renderPcaMipMatrix( pcaMip, graphContainer, settings, options, false )
}

var updatePcaMip = async function( pcaMip, graphContainer, settings = {}, options = {} ){
    await renderPcaMipMatrix( pcaMip, graphContainer, settings, options, true )
}

var initializePcaClassification = async function( scoresByComponent, graphContainer, settings = {}, options = {} ){
    await renderPcaClassification( scoresByComponent, graphContainer, settings, options, false )
}

var updatePcaClassification = async function( scoresByComponent, graphContainer, settings = {}, options = {} ){
    await renderPcaClassification( scoresByComponent, graphContainer, settings, options, true )
}

var initializePcaRgb = async function( scoresByComponent, graphContainer, settings = {}, options = {} ){
    await renderPcaRgb( scoresByComponent, graphContainer, settings, options, false )
}

var updatePcaRgb = async function( scoresByComponent, graphContainer, settings = {}, options = {} ){
    await renderPcaRgb( scoresByComponent, graphContainer, settings, options, true )
}

var initializeZBlend = async function( zBlendSource, graphContainer, settings = {}, options = {} ){
    await renderZBlendMatrix( zBlendSource, graphContainer, settings, options, false )
}

var updateZBlend = async function( zBlendSource, graphContainer, settings = {}, options = {} ){
    await renderZBlendMatrix( zBlendSource, graphContainer, settings, options, true )
}

var initializeUpperPanel = async function( graphContainer, settings = {}, options = {} ){
    await renderUpperPanel( graphContainer, settings, options, false )
}

var updateUpperPanel = async function( graphContainer, settings = {}, options = {} ){
    await renderUpperPanel( graphContainer, settings, options, true )
}

var initializeLowerPanel = async function( graphContainer, settings = {}, options = {} ){
    await renderLowerPanel( graphContainer, settings, options, false )
}

var updateLowerPanel = async function( graphContainer, settings = {}, options = {} ){
    await renderLowerPanel( graphContainer, settings, options, true )
}

var resizeGraph = async function( graphContainer ){

    if( !graphContainer ) return
    if( typeof Plotly?.Plots?.resize !== "function" ) return

    await Plotly.Plots.resize( graphContainer )
}

async function renderMatrix( mip, graphContainer, settings, options, preferReact ){

    if( !graphContainer ) return
    cacheHeatmapOrigin( graphContainer, settings )

    const externalRenderer = shouldUseExternalHeatmapRenderer( options )
    const cacheKey = externalRenderer
        ? buildExternalHeatmapPayloadCacheKey( "scalar", mip, { colorscale: options?.colorscale } )
        : ""
    let heatmapPayload = externalRenderer
        ? getCachedExternalHeatmapPayload( graphContainer, cacheKey )
        : null
    const matrix = ( externalRenderer && heatmapPayload !== null )
        ? dimensionStubMatrix( heatmapPayload.width, heatmapPayload.height )
        : normalizeMip( mip )

    if( externalRenderer && heatmapPayload === null ){
        heatmapPayload = buildScalarHeatmapPayload( matrix, options.colorscale )
        setCachedExternalHeatmapPayload( graphContainer, cacheKey, heatmapPayload )
    }

    cacheHeatmapRendererPayload( graphContainer, heatmapPayload, normalizeExternalHeatmapRendererMode( options?.heatmapRenderer ) )
    if( options?.skipFigureRender === true && externalRenderer ){
        return
    }

    const figure = buildFigure( matrix, graphContainer, settings, options )
    await renderFigure( graphContainer, figure, preferReact )
}

async function renderRgbMatrix( mipRgb, graphContainer, settings, options, preferReact ){

    if( !graphContainer ) return
    cacheHeatmapOrigin( graphContainer, settings )

    const externalRenderer = shouldUseExternalHeatmapRenderer( options )
    const cacheKey = externalRenderer
        ? buildExternalHeatmapPayloadCacheKey( "rgb", mipRgb )
        : ""
    let rgbComposite = externalRenderer
        ? getCachedExternalHeatmapPayload( graphContainer, cacheKey )
        : null

    if( rgbComposite === null ){
        const rgbMatrix = normalizeRgbMip( mipRgb )
        rgbComposite = buildRgbMipImage( rgbMatrix, {
            includeSource: externalRenderer === false,
            includePixelMetrics: false
        } )

        if( externalRenderer ){
            setCachedExternalHeatmapPayload( graphContainer, cacheKey, rgbComposite )
        }
    }

    cacheHeatmapRendererPayload( graphContainer,
                                 externalRenderer ? rgbComposite : null,
                                 normalizeExternalHeatmapRendererMode( options?.heatmapRenderer ) )
    if( options?.skipFigureRender === true && externalRenderer ){
        return
    }
    const figure = buildRgbFigure( rgbComposite, graphContainer, settings, options )
    await renderFigure( graphContainer, figure, preferReact )
}

async function renderUmapMatrix( umapChannels, graphContainer, settings, options, preferReact ){

    if( !graphContainer ) return
    cacheHeatmapOrigin( graphContainer, settings )

    const externalRenderer = shouldUseExternalHeatmapRenderer( options )
    const cacheKey = externalRenderer
        ? buildExternalHeatmapPayloadCacheKey( "umap", umapChannels, { channelColors: options?.channelColors } )
        : ""
    let rgbComposite = externalRenderer
        ? getCachedExternalHeatmapPayload( graphContainer, cacheKey )
        : null

    if( rgbComposite === null ){
        const normalizedChannels = normalizeUmapChannels( umapChannels )
        rgbComposite = buildUmapImage( normalizedChannels, {
            ...options,
            includeSource: externalRenderer === false,
            includePixelMetrics: false
        } )

        if( externalRenderer ){
            setCachedExternalHeatmapPayload( graphContainer, cacheKey, rgbComposite )
        }
    }

    cacheHeatmapRendererPayload( graphContainer,
                                 externalRenderer ? rgbComposite : null,
                                 normalizeExternalHeatmapRendererMode( options?.heatmapRenderer ) )
    if( options?.skipFigureRender === true && externalRenderer ){
        return
    }
    const figure = buildRgbFigure( rgbComposite, graphContainer, settings, options )
    await renderFigure( graphContainer, figure, preferReact )
}

async function renderPcaMipMatrix( pcaMip, graphContainer, settings, options, preferReact ){

    if( !graphContainer ) return
    cacheHeatmapOrigin( graphContainer, settings )

    const externalRenderer = shouldUseExternalHeatmapRenderer( options )
    const cacheKey = externalRenderer
        ? buildExternalHeatmapPayloadCacheKey( "pca-mip", pcaMip )
        : ""
    let rgbComposite = externalRenderer
        ? getCachedExternalHeatmapPayload( graphContainer, cacheKey )
        : null

    if( rgbComposite === null ){
        const normalizedPcaMip = normalizePcaMip( pcaMip )
        rgbComposite = buildPcaMipImage( normalizedPcaMip, {
            includeSource: externalRenderer === false,
            includePixelMetrics: false
        } )

        if( externalRenderer ){
            setCachedExternalHeatmapPayload( graphContainer, cacheKey, rgbComposite )
        }
    }

    cacheHeatmapRendererPayload( graphContainer,
                                 externalRenderer ? rgbComposite : null,
                                 normalizeExternalHeatmapRendererMode( options?.heatmapRenderer ) )
    if( options?.skipFigureRender === true && externalRenderer ){
        return
    }
    const figure = buildPcaMipFigure( rgbComposite, graphContainer, settings, options )
    await renderFigure( graphContainer, figure, preferReact )
}

async function renderPcaClassification( scoresByComponent, graphContainer, settings, options, preferReact ){

    if( !graphContainer ) return
    cacheHeatmapOrigin( graphContainer, settings )

    const externalRenderer = shouldUseExternalHeatmapRenderer( options )

    if( Array.isArray( scoresByComponent ) &&
        scoresByComponent.length > 0 &&
        Array.isArray( scoresByComponent[0] ) &&
        Array.isArray( scoresByComponent[0][0] ) === false ){

        const cacheKey = externalRenderer
            ? buildExternalHeatmapPayloadCacheKey( "pca-classification-mip", scoresByComponent )
            : ""
        let classification = externalRenderer
            ? getCachedExternalHeatmapPayload( graphContainer, cacheKey )
            : null

        if( classification === null ){
            const normalizedPcaMip = normalizePcaMip( scoresByComponent )
            classification = buildPcaMipImage( normalizedPcaMip, {
                useEncodedBrightness: false,
                includeSource: externalRenderer === false,
                includePixelMetrics: false
            } )

            if( externalRenderer ){
                setCachedExternalHeatmapPayload( graphContainer, cacheKey, classification )
            }
        }

        cacheHeatmapRendererPayload( graphContainer,
                                     externalRenderer ? classification : null,
                                     normalizeExternalHeatmapRendererMode( options?.heatmapRenderer ) )
        if( options?.skipFigureRender === true && externalRenderer ){
            return
        }
        const figure = buildPcaFigure( classification, graphContainer, settings, options )
        await renderFigure( graphContainer, figure, preferReact )
        return
    }

    const cacheKey = externalRenderer
        ? buildExternalHeatmapPayloadCacheKey( "pca-classification", scoresByComponent )
        : ""
    let classification = externalRenderer
        ? getCachedExternalHeatmapPayload( graphContainer, cacheKey )
        : null

    if( classification === null ){
        const componentScores = normalizePcaScores( scoresByComponent )
        classification = buildPcaClassificationImage( componentScores, {
            includeSource: externalRenderer === false,
            includePixelMetrics: false
        } )

        if( externalRenderer ){
            setCachedExternalHeatmapPayload( graphContainer, cacheKey, classification )
        }
    }

    cacheHeatmapRendererPayload( graphContainer,
                                 externalRenderer ? classification : null,
                                 normalizeExternalHeatmapRendererMode( options?.heatmapRenderer ) )
    if( options?.skipFigureRender === true && externalRenderer ){
        return
    }
    const figure = buildPcaFigure( classification, graphContainer, settings, options )
    await renderFigure( graphContainer, figure, preferReact )
}

async function renderPcaRgb( scoresByComponent, graphContainer, settings, options, preferReact ){

    if( !graphContainer ) return
    cacheHeatmapOrigin( graphContainer, settings )

    const externalRenderer = shouldUseExternalHeatmapRenderer( options )
    const cacheKey = externalRenderer
        ? buildExternalHeatmapPayloadCacheKey( "pca-rgb", scoresByComponent, { channels: options?.channels } )
        : ""
    let rgbComposite = externalRenderer
        ? getCachedExternalHeatmapPayload( graphContainer, cacheKey )
        : null

    if( rgbComposite === null ){
        const componentScores = normalizePcaScores( scoresByComponent )
        rgbComposite = buildPcaRgbImage( componentScores, {
            ...options,
            includeSource: externalRenderer === false,
            includePixelMetrics: false
        } )

        if( externalRenderer ){
            setCachedExternalHeatmapPayload( graphContainer, cacheKey, rgbComposite )
        }
    }

    cacheHeatmapRendererPayload( graphContainer,
                                 externalRenderer ? rgbComposite : null,
                                 normalizeExternalHeatmapRendererMode( options?.heatmapRenderer ) )
    if( options?.skipFigureRender === true && externalRenderer ){
        return
    }
    const figure = buildPcaRgbFigure( rgbComposite, graphContainer, settings, options )
    await renderFigure( graphContainer, figure, preferReact )
}

async function renderZBlendMatrix( zBlendSource, graphContainer, settings, options, preferReact ){

    if( !graphContainer ) return
    cacheHeatmapOrigin( graphContainer, settings )

    const externalRenderer = shouldUseExternalHeatmapRenderer( options )
    const normalizedSource = normalizeZBlendSource( zBlendSource )
    const rgbComposite = externalRenderer
        ? updateZBlendHeatmapPayload( normalizedSource, graphContainer, { heatmapRenderer: options?.heatmapRenderer } )
        : buildZBlendImage( normalizedSource, {
            includeSource: true,
            includePixelMetrics: false
        } )

    if( options?.skipFigureRender === true ){
        return
    }

    const figure = buildRgbFigure( rgbComposite, graphContainer, settings, options )
    cacheHeatmapRendererPayload( graphContainer,
                                 externalRenderer ? rgbComposite : null,
                                 normalizeExternalHeatmapRendererMode( options?.heatmapRenderer ) )
    await renderFigure( graphContainer, figure, preferReact )
}

async function renderUpperPanel( graphContainer, settings, options, preferReact ){

    if( !graphContainer ) return

    const figure = buildUpperPanelFigure( graphContainer, settings, options )
    await renderFigure( graphContainer, figure, preferReact )
}

async function renderLowerPanel( graphContainer, settings, options, preferReact ){

    if( !graphContainer ) return

    const figure = buildLowerPanelFigure( graphContainer, settings, options )
    await renderFigure( graphContainer, figure, preferReact )
}
function normalizeSpectrumHighlightGroup( highlightedGroup = "" ){
    return typeof highlightedGroup === "string" ? highlightedGroup.trim() : ""
}

const DEFAULT_HYPERSPECTRUM_TRACE_LINE_WIDTH = 2
const DEFAULT_HYPERSPECTRUM_BAND_LINE_WIDTH = 0
const HIGHLIGHTED_HYPERSPECTRUM_TRACE_LINE_WIDTH = 3.5
const DIMMED_HYPERSPECTRUM_TRACE_OPACITY = 0.45
const HYPERSPECTRUM_BAND_HIGHLIGHT_ALPHA_FACTOR = 2.4
const HYPERSPECTRUM_BAND_DIM_ALPHA_FACTOR = 0.3
const HYPERSPECTRUM_BAND_MIN_FILL_ALPHA = 0.015
const HYPERSPECTRUM_BAND_MAX_FILL_ALPHA = 0.35
const HYPERSPECTRUM_HIGHLIGHT_ANIMATION_DURATION_MS = 140
const HYPERSPECTRUM_HIGHLIGHT_PULSE_DURATION_MS = 1840

function isHyperspectrumFillTrace( trace ){
    return typeof trace?.fill === "string" && trace.fill.length > 0
}

function requestHyperspectrumAnimationFrame( callback ){
    if( typeof globalThis?.requestAnimationFrame === "function" ){
        return globalThis.requestAnimationFrame( callback )
    }

    return globalThis.setTimeout(() => callback( Date.now() ), 16 )
}

function cancelHyperspectrumAnimationFrame( handle ){
    if( handle === null || handle === undefined ){
        return
    }

    if( typeof globalThis?.cancelAnimationFrame === "function" ){
        globalThis.cancelAnimationFrame( handle )
        return
    }

    globalThis.clearTimeout( handle )
}

function hyperspectrumAnimationNow(){
    if( typeof globalThis?.performance?.now === "function" ){
        return globalThis.performance.now()
    }

    return Date.now()
}

function clampUnitInterval( value ){
    if( Number.isFinite( Number( value )) === false ){
        return 0
    }

    return Math.min( 1, Math.max( 0, Number( value ) ) )
}

function easeOutCubic( value ){
    const progress = clampUnitInterval( value )
    return 1 - Math.pow( 1 - progress, 3 )
}

function readNumericTraceStyleValue( value, fallback ){
    const numericValue = Number( value )
    return Number.isFinite( numericValue ) ? numericValue : fallback
}

function defaultHyperspectrumTraceLineWidth( trace ){
    return isHyperspectrumFillTrace( trace )
        ? DEFAULT_HYPERSPECTRUM_BAND_LINE_WIDTH
        : DEFAULT_HYPERSPECTRUM_TRACE_LINE_WIDTH
}

function isHyperspectrumPrimaryLineTrace( trace ){
    if( isHyperspectrumFillTrace( trace ) ){
        return false
    }

    return readNumericTraceStyleValue( trace?.line?.width, defaultHyperspectrumTraceLineWidth( trace ) ) > 0
}

function parseRgbaColor( value ){
    if( typeof value !== "string" ){
        return null
    }

    const rgbaMatch = value.match(/^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)$/i)
    if( rgbaMatch ){
        return {
            r: Number( rgbaMatch[1] ),
            g: Number( rgbaMatch[2] ),
            b: Number( rgbaMatch[3] ),
            a: rgbaMatch[4] === undefined ? 1 : Number( rgbaMatch[4] )
        }
    }

    const hexMatch = value.trim().match(/^#([0-9a-f]{6})$/i)
    if( hexMatch ){
        return {
            r: Number.parseInt( hexMatch[1].slice( 0, 2 ), 16 ),
            g: Number.parseInt( hexMatch[1].slice( 2, 4 ), 16 ),
            b: Number.parseInt( hexMatch[1].slice( 4, 6 ), 16 ),
            a: 1
        }
    }

    return null
}

function resolveTraceFillBaseColor( trace ){
    const parsedColor = parseRgbaColor( trace?.fillcolor )
    if( parsedColor !== null ){
        return parsedColor
    }

    const parsedLineColor = parseRgbaColor( trace?.line?.color )
    if( parsedLineColor !== null ){
        return parsedLineColor
    }

    return null
}

function readTraceFillAlpha( trace ){
    if( isHyperspectrumFillTrace( trace ) === false ){
        return null
    }

    const parsedColor = parseRgbaColor( trace?.fillcolor )
    if( parsedColor !== null && Number.isFinite( parsedColor.a ) ){
        return parsedColor.a
    }

    return 0.1
}

function buildTraceFillColor( trace, fillAlpha ){
    if( isHyperspectrumFillTrace( trace ) === false ){
        return trace?.fillcolor ?? null
    }

    const baseColor = resolveTraceFillBaseColor( trace )
    if( baseColor === null ){
        return trace?.fillcolor ?? null
    }

    const alpha = clampUnitInterval( fillAlpha )
    return `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${alpha})`
}

function cloneHyperspectrumTraceStyleState( state ){
    return {
        opacities: Array.isArray( state?.opacities ) ? [ ...state.opacities ] : [],
        lineWidths: Array.isArray( state?.lineWidths ) ? [ ...state.lineWidths ] : [],
        fillAlphas: Array.isArray( state?.fillAlphas ) ? [ ...state.fillAlphas ] : []
    }
}

function isHyperspectrumTraceStyleStateForTraces( state, traces = [] ){
    return Array.isArray( state?.opacities ) &&
        Array.isArray( state?.lineWidths ) &&
        Array.isArray( state?.fillAlphas ) &&
        state.opacities.length === traces.length &&
        state.lineWidths.length === traces.length &&
        state.fillAlphas.length === traces.length
}

function readHyperspectrumTraceStyleState( traces = [] ){
    return {
        opacities: traces.map(( trace ) => readNumericTraceStyleValue( trace?.opacity, 1 )),
        lineWidths: traces.map(( trace ) => readNumericTraceStyleValue( trace?.line?.width, defaultHyperspectrumTraceLineWidth( trace ) )),
        fillAlphas: traces.map(( trace ) => readTraceFillAlpha( trace ))
    }
}

function getBaseHyperspectrumTraceStyleState( graphContainer, traces = [] ){
    const cachedBaseState = graphContainer?.__harkanaHyperspectrumBaseStyleState
    const cachedBaseDataReference = graphContainer?.__harkanaHyperspectrumBaseStyleStateDataReference
    if(
        cachedBaseDataReference === graphContainer?.data &&
        isHyperspectrumTraceStyleStateForTraces( cachedBaseState, traces )
    ){
        return cloneHyperspectrumTraceStyleState( cachedBaseState )
    }

    const baseState = readHyperspectrumTraceStyleState( traces )
    graphContainer.__harkanaHyperspectrumBaseStyleState = cloneHyperspectrumTraceStyleState( baseState )
    graphContainer.__harkanaHyperspectrumBaseStyleStateDataReference = graphContainer?.data
    return baseState
}

function getCurrentHyperspectrumTraceStyleState( graphContainer, traces = [] ){
    const cachedState = graphContainer?.__harkanaHyperspectrumHighlightState
    const cachedDataReference = graphContainer?.__harkanaHyperspectrumHighlightStateDataReference
    if(
        cachedDataReference === graphContainer?.data &&
        isHyperspectrumTraceStyleStateForTraces( cachedState, traces )
    ){
        return cloneHyperspectrumTraceStyleState( cachedState )
    }

    return readHyperspectrumTraceStyleState( traces )
}

function setCurrentHyperspectrumTraceStyleState( graphContainer, state ){
    if( graphContainer === null || graphContainer === undefined ){
        return
    }

    graphContainer.__harkanaHyperspectrumHighlightState = cloneHyperspectrumTraceStyleState( state )
    graphContainer.__harkanaHyperspectrumHighlightStateDataReference = graphContainer.data
}

function beginHyperspectrumTraceStyleAnimationSession( graphContainer ){
    cancelHyperspectrumAnimationFrame( graphContainer?.__harkanaHyperspectrumHighlightAnimationHandle )
    graphContainer.__harkanaHyperspectrumHighlightAnimationHandle = null

    const animationToken = Number( graphContainer?.__harkanaHyperspectrumHighlightAnimationToken ?? 0 ) + 1
    graphContainer.__harkanaHyperspectrumHighlightAnimationToken = animationToken
    return animationToken
}

function hyperspectrumTraceStyleStatesEqual( leftState, rightState ){
    if( Array.isArray( leftState?.opacities ) === false ||
        Array.isArray( leftState?.lineWidths ) === false ||
        Array.isArray( leftState?.fillAlphas ) === false ||
        Array.isArray( rightState?.opacities ) === false ||
        Array.isArray( rightState?.lineWidths ) === false ||
        Array.isArray( rightState?.fillAlphas ) === false ){
        return false
    }

    if( leftState.opacities.length !== rightState.opacities.length ||
        leftState.lineWidths.length !== rightState.lineWidths.length ||
        leftState.fillAlphas.length !== rightState.fillAlphas.length ){
        return false
    }

    for( let index = 0; index < leftState.opacities.length; index++ ){
        if( Math.abs( leftState.opacities[index] - rightState.opacities[index] ) > 0.0001 ){
            return false
        }
    }

    for( let index = 0; index < leftState.lineWidths.length; index++ ){
        if( Math.abs( leftState.lineWidths[index] - rightState.lineWidths[index] ) > 0.0001 ){
            return false
        }
    }

    for( let index = 0; index < leftState.fillAlphas.length; index++ ){
        const leftAlpha = leftState.fillAlphas[index]
        const rightAlpha = rightState.fillAlphas[index]
        if( leftAlpha === null && rightAlpha === null ){
            continue
        }

        if( leftAlpha === null || rightAlpha === null ){
            return false
        }

        if( Math.abs( leftAlpha - rightAlpha ) > 0.0001 ){
            return false
        }
    }

    return true
}

function interpolateHyperspectrumTraceStyleState( fromState, toState, progress ){
    const easedProgress = easeOutCubic( progress )

    return {
        opacities: fromState.opacities.map(( fromValue, index ) => {
            const toValue = toState.opacities[index] ?? fromValue
            return fromValue + ( toValue - fromValue ) * easedProgress
        }),
        lineWidths: fromState.lineWidths.map(( fromValue, index ) => {
            const toValue = toState.lineWidths[index] ?? fromValue
            return fromValue + ( toValue - fromValue ) * easedProgress
        }),
        fillAlphas: fromState.fillAlphas.map(( fromValue, index ) => {
            const toValue = toState.fillAlphas[index]
            if( fromValue === null || toValue === null ){
                return fromValue
            }

            return fromValue + ( toValue - fromValue ) * easedProgress
        })
    }
}

async function restyleHyperspectrumTraceStyleState( graphContainer, traceIndices, state ){
    const traces = Array.isArray( graphContainer?.data ) ? graphContainer.data : []
    const nextFillColors = traces.map(( trace, index ) => buildTraceFillColor( trace, state.fillAlphas[index] ))

    await Plotly.restyle(
        graphContainer,
        {
            opacity: state.opacities,
            "line.width": state.lineWidths,
            fillcolor: nextFillColors
        },
        traceIndices
    )

    setCurrentHyperspectrumTraceStyleState( graphContainer, state )
    normalizeModebarButtonSpacing( graphContainer )
}

function buildHyperspectrumHighlightedTraceStyleState( traces = [], highlightedGroup = "", options = {} ){
    const normalizedGroup = normalizeSpectrumHighlightGroup( highlightedGroup )
    const hiddenSet = options?.hiddenSet instanceof Set ? options.hiddenSet : new Set()
    const emphasizeSelected = options?.emphasizeSelected === true
    const baseState = isHyperspectrumTraceStyleStateForTraces( options?.baseState, traces )
        ? options.baseState
        : readHyperspectrumTraceStyleState( traces )
    const hasMatchingGroup = normalizedGroup.length > 0 && traces.some(( trace ) => {
        const traceGroup = typeof trace?.legendgroup === "string" ? trace.legendgroup.trim() : ""
        return traceGroup === normalizedGroup && hiddenSet.has( traceGroup ) === false
    })

    return {
        opacities: traces.map(( trace ) => {
            if( hasMatchingGroup === false ){
                return 1
            }

            const traceGroup = typeof trace?.legendgroup === "string" ? trace.legendgroup.trim() : ""
            if( traceGroup.length === 0 ){
                return DIMMED_HYPERSPECTRUM_TRACE_OPACITY
            }

            if( traceGroup === normalizedGroup ){
                return 1
            }

            return isHyperspectrumPrimaryLineTrace( trace )
                ? DIMMED_HYPERSPECTRUM_TRACE_OPACITY
                : 1
        }),
        lineWidths: traces.map(( trace, index ) => {
            const traceGroup = typeof trace?.legendgroup === "string" ? trace.legendgroup.trim() : ""
            const baseWidth = readNumericTraceStyleValue(
                baseState.lineWidths[index],
                defaultHyperspectrumTraceLineWidth( trace )
            )

            if( hasMatchingGroup === false ){
                return baseWidth
            }

            if( traceGroup === normalizedGroup && isHyperspectrumPrimaryLineTrace( trace ) ){
                return emphasizeSelected
                    ? Math.max( baseWidth, HIGHLIGHTED_HYPERSPECTRUM_TRACE_LINE_WIDTH )
                    : baseWidth
            }

            return baseWidth
        }),
        fillAlphas: traces.map(( trace, index ) => {
            const baseAlpha = isHyperspectrumFillTrace( trace )
                ? readNumericTraceStyleValue( baseState.fillAlphas[index], readTraceFillAlpha( trace ))
                : null
            if( baseAlpha === null ){
                return null
            }

            if( hasMatchingGroup === false ){
                return baseAlpha
            }

            const traceGroup = typeof trace?.legendgroup === "string" ? trace.legendgroup.trim() : ""
            if( traceGroup === normalizedGroup ){
                return emphasizeSelected
                    ? Math.min( HYPERSPECTRUM_BAND_MAX_FILL_ALPHA, Math.max( baseAlpha, baseAlpha * HYPERSPECTRUM_BAND_HIGHLIGHT_ALPHA_FACTOR ) )
                    : baseAlpha
            }

            return Math.max( HYPERSPECTRUM_BAND_MIN_FILL_ALPHA, baseAlpha * HYPERSPECTRUM_BAND_DIM_ALPHA_FACTOR )
        })
    }
}

async function animateHyperspectrumTraceStyleState( graphContainer, traceIndices, fromState, toState ){
    if( graphContainer === null || graphContainer === undefined ){
        return false
    }

    if( hyperspectrumTraceStyleStatesEqual( fromState, toState ) ){
        setCurrentHyperspectrumTraceStyleState( graphContainer, toState )
        return true
    }

    const animationToken = beginHyperspectrumTraceStyleAnimationSession( graphContainer )

    return await new Promise(( resolve ) => {
        const startTime = hyperspectrumAnimationNow()

        const step = () => {
            if( graphContainer.__harkanaHyperspectrumHighlightAnimationToken !== animationToken ){
                resolve( false )
                return
            }

            const elapsed = hyperspectrumAnimationNow() - startTime
            const progress = clampUnitInterval( elapsed / HYPERSPECTRUM_HIGHLIGHT_ANIMATION_DURATION_MS )
            const nextState = interpolateHyperspectrumTraceStyleState( fromState, toState, progress )

            restyleHyperspectrumTraceStyleState( graphContainer, traceIndices, nextState )
                .then(() => {
                    if( graphContainer.__harkanaHyperspectrumHighlightAnimationToken !== animationToken ){
                        resolve( false )
                        return
                    }

                    if( progress >= 1 ){
                        graphContainer.__harkanaHyperspectrumHighlightAnimationHandle = null
                        resolve( true )
                        return
                    }

                    graphContainer.__harkanaHyperspectrumHighlightAnimationHandle = requestHyperspectrumAnimationFrame( step )
                })
                .catch(() => {
                    graphContainer.__harkanaHyperspectrumHighlightAnimationHandle = null
                    resolve( false )
                })
        }

        graphContainer.__harkanaHyperspectrumHighlightAnimationHandle = requestHyperspectrumAnimationFrame( step )
    })
}

function pulseHyperspectrumTraceStyleState( graphContainer, traceIndices, baseState, highlightedState ){
    if( graphContainer === null || graphContainer === undefined ){
        return
    }

    if( hyperspectrumTraceStyleStatesEqual( baseState, highlightedState ) ){
        setCurrentHyperspectrumTraceStyleState( graphContainer, baseState )
        return
    }

    const animationToken = beginHyperspectrumTraceStyleAnimationSession( graphContainer )
    const startTime = hyperspectrumAnimationNow()

    const step = () => {
        if( graphContainer.__harkanaHyperspectrumHighlightAnimationToken !== animationToken ){
            return
        }

        const elapsed = hyperspectrumAnimationNow() - startTime
        const cyclePosition = elapsed / HYPERSPECTRUM_HIGHLIGHT_PULSE_DURATION_MS
        const cycleProgress = 0.5 + 0.5 * Math.cos( cyclePosition * Math.PI * 2 )
        const nextState = interpolateHyperspectrumTraceStyleState( baseState, highlightedState, cycleProgress )

        restyleHyperspectrumTraceStyleState( graphContainer, traceIndices, nextState )
            .then(() => {
                if( graphContainer.__harkanaHyperspectrumHighlightAnimationToken !== animationToken ){
                    return
                }

                graphContainer.__harkanaHyperspectrumHighlightAnimationHandle = requestHyperspectrumAnimationFrame( step )
            })
            .catch(() => {
                graphContainer.__harkanaHyperspectrumHighlightAnimationHandle = null
            })
    }

    graphContainer.__harkanaHyperspectrumHighlightAnimationHandle = requestHyperspectrumAnimationFrame( step )
}

function normalizeHiddenSpectrumTraceGroups( hiddenGroups = [] ){

    if( Array.isArray( hiddenGroups ) === false ){
        return []
    }

    return Array.from( new Set(
        hiddenGroups
            .map(( group ) => typeof group === "string" ? group.trim() : "" )
            .filter(( group ) => group.length > 0 )
    ))
}

async function applySpectrumTracePresentationInternal( graphContainer, highlightedGroup = "" ){

    if( !graphContainer ) return

    const traces = Array.isArray( graphContainer.data ) ? graphContainer.data : []
    if( traces.length === 0 ) return

    const normalizedGroup = normalizeSpectrumHighlightGroup( highlightedGroup )
    graphContainer.__harkanaSpectrumHighlightGroup = normalizedGroup
    const hiddenGroups = normalizeHiddenSpectrumTraceGroups( graphContainer?.__harkanaHiddenSpectrumTraceGroups )
    const hiddenSet = new Set( hiddenGroups )
    graphContainer.__harkanaHiddenSpectrumTraceGroups = hiddenGroups
    const traceIndices = traces.map(( _, index ) => index )
    const visibility = traces.map(( trace ) => {
        const traceGroup = typeof trace?.legendgroup === "string" ? trace.legendgroup.trim() : ""
        if( traceGroup.length === 0 ){
            return true
        }

        return hiddenSet.has( traceGroup ) === false
    })

    await Plotly.restyle( graphContainer, {
        visible: visibility
    }, traceIndices )

    const fromState = getCurrentHyperspectrumTraceStyleState( graphContainer, traces )
    const baseState = getBaseHyperspectrumTraceStyleState( graphContainer, traces )
    const restingState = normalizedGroup.length > 0
        ? buildHyperspectrumHighlightedTraceStyleState( traces, normalizedGroup, {
            hiddenSet,
            emphasizeSelected: false,
            baseState
        })
        : buildHyperspectrumHighlightedTraceStyleState( traces, "", { hiddenSet, baseState })
    const emphasizedState = normalizedGroup.length > 0
        ? buildHyperspectrumHighlightedTraceStyleState( traces, normalizedGroup, {
            hiddenSet,
            emphasizeSelected: true,
            baseState
        })
        : restingState
    graphContainer.__harkanaSpectrumRequestedHighlightedGroup = normalizedGroup

    const animationCompleted = await animateHyperspectrumTraceStyleState(
        graphContainer,
        traceIndices,
        fromState,
        emphasizedState
    )
    if( animationCompleted !== true ){
        return
    }

    if( graphContainer.__harkanaSpectrumRequestedHighlightedGroup !== normalizedGroup ){
        return
    }

    if( normalizedGroup.length === 0 || hyperspectrumTraceStyleStatesEqual( restingState, emphasizedState ) ){
        return
    }

    pulseHyperspectrumTraceStyleState( graphContainer, traceIndices, restingState, emphasizedState )
}

var setSpectrumHighlightGroup = async function( graphContainer, highlightedGroup = "" ){

    try{
        await applySpectrumTracePresentationInternal( graphContainer, highlightedGroup )
    } catch( error ){
        console.log( error )
    }
}

var setSpectrumHiddenGroups = async function( graphContainer, hiddenGroups = [] ){

    try{
        if( graphContainer ){
            graphContainer.__harkanaHiddenSpectrumTraceGroups = normalizeHiddenSpectrumTraceGroups( hiddenGroups )
        }
        await applySpectrumTracePresentationInternal(
            graphContainer,
            graphContainer?.__harkanaSpectrumHighlightGroup
        )
    } catch( error ){
        console.log( error )
    }
}

var configureHeatmapInteraction = async function( graphContainer, options = {} ){

    if( !graphContainer ) return

    const mode = normalizeHeatmapInteractionMode( options.mode )
    const rendererMode = normalizeExternalHeatmapRendererMode( options.rendererMode )
    const width = Number.isInteger( Number( options.width )) ? Math.max( 1, Number( options.width )) : inferHeatmapWidth( graphContainer )
    const height = Number.isInteger( Number( options.height )) ? Math.max( 1, Number( options.height )) : inferHeatmapHeight( graphContainer )
    graphContainer.__harkanaHeatmapInteractionMode = mode

    detachHeatmapPointerSelection( graphContainer )

    if( typeof graphContainer.removeAllListeners === "function" ){
        graphContainer.removeAllListeners( "plotly_click" )
        graphContainer.removeAllListeners( "plotly_relayout" )
    }

    if( rendererMode === "deckgl" ){
        if( mode === "zoom" ){
            await Plotly.relayout( graphContainer, { dragmode: "zoom" })
        }
        return
    }

    if( mode === "select" && typeof graphContainer.on === "function" ){

        graphContainer.__harkanaHeatmapSelectionReset = false
        attachHeatmapPointerSelection( graphContainer, width, height, options )

        graphContainer.on( "plotly_click", ( eventData ) => {

            const point = extractHeatmapClickPoint( eventData, graphContainer, width, height )
            if( point === null ) return

            dispatchPointSelection( graphContainer, options, point )
        })

        graphContainer.on( "plotly_relayout", ( relayoutData ) => {

            if( graphContainer.__harkanaHeatmapSelectionReset ) return

            const selectionShape = extractHeatmapSelectionShape( relayoutData, graphContainer )
            if( selectionShape === null ) return

            const selection = selectionFromRanges( selectionShape, width, height )
            if( selection === null ) return

            const shouldRouteSingleSelectionToPoint = options.routeSingleSelectionToPoint !== false

            if( shouldRouteSingleSelectionToPoint &&
                selection.xIndices.length === 1 &&
                selection.yIndices.length === 1 ){

                dispatchPointSelection( graphContainer,
                                        options,
                                        {
                                            x: selection.xIndices[0],
                                            y: selection.yIndices[0]
                                        } )
            } else if( typeof options.onRegionSelect === "function" ){
                options.onRegionSelect( selection )
            }

            graphContainer.__harkanaLastShapeSelectionTime = Date.now()

            const shouldClearShape = options.keepSelectionShape === true ? false : true
            if( shouldClearShape ){
                void clearHeatmapSelectionShape( graphContainer, selectionShape.shapeIndex )
            }
        })
    }

    await Plotly.relayout( graphContainer, { dragmode: mode === "select" ? "drawrect" : "zoom" })
}
function normalizeHeatmapInteractionMode( mode ){
    return mode === "select" ? "select" : "zoom"
}

function normalizeHeatmapZoomAspectRatio( value ){
    return value === "free" ? "free" : "square"
}

function attachHeatmapPointerSelection( graphContainer, width, height, options ){

    if( typeof graphContainer.addEventListener !== "function" ) return

    const pointerClickHandler = ( event ) => {

        const mouseButton = Number( event.button )
        if( Number.isFinite( mouseButton ) && mouseButton !== 0 ) return

        const lastShapeSelectionTime = Number( graphContainer.__harkanaLastShapeSelectionTime ) || 0
        if(( Date.now() - lastShapeSelectionTime ) < 300 ){
            return
        }

        const point = pointFromPointerEvent( event, graphContainer, width, height )
        if( point === null ) return

        dispatchPointSelection( graphContainer, options, point )
    }

    graphContainer.__harkanaPointerClickHandler = pointerClickHandler
    graphContainer.addEventListener( "click", pointerClickHandler, true )
}

function detachHeatmapPointerSelection( graphContainer ){

    if( typeof graphContainer.removeEventListener !== "function" ) return

    const pointerClickHandler = graphContainer.__harkanaPointerClickHandler
    if( typeof pointerClickHandler === "function" ){
        graphContainer.removeEventListener( "click", pointerClickHandler, true )
    }

    graphContainer.__harkanaPointerClickHandler = null
}

function pointFromPointerEvent( event, graphContainer, width, height ){

    const fullLayout = graphContainer?._fullLayout
    const axisConfig = resolveHeatmapAxisConfig( graphContainer )
    const xaxis = fullLayout?.[ axisConfig.xaxisKey ]
    const yaxis = fullLayout?.[ axisConfig.yaxisKey ]

    const bounds = graphContainer.getBoundingClientRect()
    const pixelX = Number( event.clientX ) - bounds.left
    const pixelY = Number( event.clientY ) - bounds.top

    if( Number.isFinite( pixelX ) === false || Number.isFinite( pixelY ) === false ){
        return null
    }

    const heatmapWindow = resolveHeatmapPixelWindow( graphContainer, fullLayout, xaxis, yaxis )
    if( heatmapWindow === null ){
        return null
    }

    const xOffset = heatmapWindow.xOffset
    const yOffset = heatmapWindow.yOffset
    const xLength = heatmapWindow.xLength
    const yLength = heatmapWindow.yLength

    if( pixelX < xOffset || pixelX > ( xOffset + xLength ) ){
        return null
    }

    if( pixelY < yOffset || pixelY > ( yOffset + yLength ) ){
        return null
    }

    const relativeX = clampUnit(( pixelX - xOffset ) / xLength )
    const relativeY = clampUnit(( pixelY - yOffset ) / yLength )
    const yAxisRange = sanitizeAxisRange( yaxis?.range ?? fullLayout?.[ axisConfig.yaxisKey ]?.range )
    const yAxisAutoRange = yaxis?.autorange ?? fullLayout?.[ axisConfig.yaxisKey ]?.autorange
    const cachedHeatmapOrigin = resolveStoredHeatmapOrigin(
        graphContainer,
        yAxisRange !== null && Number( yAxisRange[0] ) > Number( yAxisRange[1] ) ? "top-left" : ( yAxisAutoRange === "reversed" ? "top-left" : "bottom-left" )
    )
    const isTopLeftOrigin = cachedHeatmapOrigin === "top-left"

    const x = clampIndex( relativeX * ( width - 1 ), width )
    const y = clampIndex(( isTopLeftOrigin ? relativeY : ( 1 - relativeY )) * ( height - 1 ), height )

    if( x === null || y === null ){
        return null
    }

    return { x, y }
}

function resolveHeatmapPixelWindow( graphContainer, fullLayout, xaxis, yaxis ){

    const xOffset = Number( xaxis?._offset )
    const yOffset = Number( yaxis?._offset )
    const xLength = Number( xaxis?._length )
    const yLength = Number( yaxis?._length )

    if( Number.isFinite( xOffset ) &&
        Number.isFinite( yOffset ) &&
        Number.isFinite( xLength ) &&
        Number.isFinite( yLength ) &&
        xLength > 0 &&
        yLength > 0 ){

        return { xOffset, yOffset, xLength, yLength }
    }

    const axisConfig = resolveHeatmapAxisConfig( graphContainer )
    const xDomain = Array.isArray( fullLayout?.[ axisConfig.xaxisKey ]?.domain )
        ? fullLayout[ axisConfig.xaxisKey ].domain
        : null
    const yDomain = Array.isArray( fullLayout?.[ axisConfig.yaxisKey ]?.domain )
        ? fullLayout[ axisConfig.yaxisKey ].domain
        : null

    if( xDomain === null || yDomain === null || xDomain.length !== 2 || yDomain.length !== 2 ){
        return null
    }

    const containerWidth = Number( graphContainer?.clientWidth )
    const containerHeight = Number( graphContainer?.clientHeight )

    if( Number.isFinite( containerWidth ) === false ||
        Number.isFinite( containerHeight ) === false ||
        containerWidth <= 0 ||
        containerHeight <= 0 ){
        return null
    }

    const xStart = Number( xDomain[0] )
    const xEnd = Number( xDomain[1] )
    const yStart = Number( yDomain[0] )
    const yEnd = Number( yDomain[1] )

    if( Number.isFinite( xStart ) === false ||
        Number.isFinite( xEnd ) === false ||
        Number.isFinite( yStart ) === false ||
        Number.isFinite( yEnd ) === false ){
        return null
    }

    const domainXMinimum = Math.min( xStart, xEnd )
    const domainXMaximum = Math.max( xStart, xEnd )
    const domainYMinimum = Math.min( yStart, yEnd )
    const domainYMaximum = Math.max( yStart, yEnd )

    return {
        xOffset: domainXMinimum * containerWidth,
        xLength: Math.max( 1, ( domainXMaximum - domainXMinimum ) * containerWidth ),
        yOffset: ( 1 - domainYMaximum ) * containerHeight,
        yLength: Math.max( 1, ( domainYMaximum - domainYMinimum ) * containerHeight )
    }
}

function dispatchPointSelection( graphContainer, options, point ){

    if( typeof options.onPointSelect !== "function" ) return

    const x = Number.parseInt( point?.x, 10 )
    const y = Number.parseInt( point?.y, 10 )

    if( Number.isInteger( x ) === false || Number.isInteger( y ) === false ) return

    const key = x + ":" + y
    const now = Date.now()
    const previousKey = graphContainer.__harkanaLastPointSelectionKey
    const previousTime = Number( graphContainer.__harkanaLastPointSelectionTime ) || 0

    if( previousKey === key && ( now - previousTime ) < 250 ){
        return
    }

    graphContainer.__harkanaLastPointSelectionKey = key
    graphContainer.__harkanaLastPointSelectionTime = now

    options.onPointSelect({ x, y })
}

async function clearHeatmapSelectionShape( graphContainer, shapeIndex ){

    graphContainer.__harkanaHeatmapSelectionReset = true

    const update = {}
    if( Number.isInteger( shapeIndex ) && shapeIndex >= 0 ){
        update[ "shapes[" + shapeIndex + "]" ] = null
    } else {
        update.shapes = []
    }

    await Plotly.relayout( graphContainer, update ).finally(() => {
        graphContainer.__harkanaHeatmapSelectionReset = false
    })
}

function inferHeatmapWidth( graphContainer ){

    const axisConfig = resolveHeatmapAxisConfig( graphContainer )
    const range = graphContainer?.layout?.[ axisConfig.xaxisKey ]?.range
    if( Array.isArray( range ) && range.length === 2 ){
        const width = Math.round( Number( range[1] ) - Number( range[0] ))
        if( Number.isFinite( width ) && width > 0 ){
            return width
        }
    }

    return 1
}

function inferHeatmapHeight( graphContainer ){

    const axisConfig = resolveHeatmapAxisConfig( graphContainer )
    const range = graphContainer?.layout?.[ axisConfig.yaxisKey ]?.range
    if( Array.isArray( range ) && range.length === 2 ){
        const height = Math.round( Number( range[1] ) - Number( range[0] ))
        if( Number.isFinite( height ) && height > 0 ){
            return height
        }
    }

    return 1
}

function extractHeatmapClickPoint( eventData, graphContainer, width, height ){

    const points = Array.isArray( eventData?.points ) ? eventData.points : []
    for( const point of points ){

        if( isHeatmapPoint( point, graphContainer ) === false ) continue

        const x = clampIndex( point.x, width )
        const y = clampIndex( point.y, height )

        if( x === null || y === null ) continue
        return { x, y }
    }

    return null
}

function isHeatmapPoint( point, graphContainer ){

    const trace = graphContainer?.data?.[ point?.curveNumber ] ?? {}
    const axisConfig = resolveHeatmapAxisConfig( graphContainer )

    const xaxisID = normalizeAxisID(
        point?.xaxis?._id ??
        point?.data?.xaxis ??
        point?.fullData?.xaxis ??
        trace?.xaxis
    )

    const yaxisID = normalizeAxisID(
        point?.yaxis?._id ??
        point?.data?.yaxis ??
        point?.fullData?.yaxis ??
        trace?.yaxis
    )

    return xaxisID === normalizeAxisID( axisConfig.traceXaxis ) &&
        yaxisID === normalizeAxisID( axisConfig.traceYaxis )
}

function normalizeAxisID( axisID ){

    if( typeof axisID !== "string" ) return ""
    return axisID.replace( /^xaxis/, "x" ).replace( /^yaxis/, "y" )
}

function findLowerSpectrumTraceIndices( traces ){

    var traceIndices = []

    for( var ii = 0; ii < traces.length; ii++ ){
        const trace = traces[ii] ?? {}
        const xaxisID = normalizeAxisID( trace.xaxis )
        const yaxisID = normalizeAxisID( trace.yaxis )

        if( xaxisID === "x2" && yaxisID === "y2" ){
            traceIndices.push( ii )
        }
    }

    return traceIndices
}

function findTraceIndicesForAxes( traces, expectedXaxisID, expectedYaxisID ){

    var traceIndices = []

    for( var index = 0; index < traces.length; index++ ){
        const trace = traces[index] ?? {}
        const xaxisID = normalizeAxisID( trace.xaxis )
        const yaxisID = normalizeAxisID( trace.yaxis )

        if( xaxisID === expectedXaxisID && yaxisID === expectedYaxisID ){
            traceIndices.push( index )
        }
    }

    return traceIndices
}

function extractHeatmapSelectionShape( relayoutData, graphContainer ){

    if( relayoutData === null || typeof relayoutData !== "object" ) return null

    const relayoutShapes = collectRelayoutShapes( relayoutData )
    if( relayoutShapes.length === 0 ) return null

    const sortedShapes = relayoutShapes.sort(( left, right ) => right.shapeIndex - left.shapeIndex )
    for( const shape of sortedShapes ){
        const normalizedShape = normalizeHeatmapSelectionShape( shape, graphContainer )
        if( normalizedShape !== null ){
            return normalizedShape
        }
    }

    return null
}

function collectRelayoutShapes( relayoutData ){

    var shapesByIndex = new Map()

    if( Array.isArray( relayoutData.shapes ) ){
        for( var shapeIndex = 0; shapeIndex < relayoutData.shapes.length; shapeIndex++ ){
            const shape = relayoutData.shapes[shapeIndex]
            if( shape === null || typeof shape !== "object" ) continue

            shapesByIndex.set( shapeIndex, {
                shapeIndex,
                x0: shape.x0,
                x1: shape.x1,
                y0: shape.y0,
                y1: shape.y1,
                xref: shape.xref,
                yref: shape.yref
            })
        }
    }

    for( const [ key, value ] of Object.entries( relayoutData ) ){
        const match = key.match(/^shapes\[(\d+)\]\.(x0|x1|y0|y1|xref|yref)$/)
        if( match === null ) continue

        const shapeIndex = Number.parseInt( match[1], 10 )
        if( Number.isInteger( shapeIndex ) === false ) continue

        const attribute = match[2]
        const existing = shapesByIndex.get( shapeIndex ) ?? { shapeIndex }
        existing[attribute] = value
        shapesByIndex.set( shapeIndex, existing )
    }

    return Array.from( shapesByIndex.values() )
}

function normalizeHeatmapSelectionShape( selectionShape, graphContainer ){

    const shapeIndex = Number.parseInt( selectionShape?.shapeIndex, 10 )
    if( Number.isInteger( shapeIndex ) === false || shapeIndex < 0 ) return null

    const layoutShape = graphContainer?.layout?.shapes?.[shapeIndex] ?? {}

    const xref = normalizeAxisID( selectionShape?.xref ?? layoutShape.xref )
    const yref = normalizeAxisID( selectionShape?.yref ?? layoutShape.yref )

    if( xref !== "x3" || yref !== "y3" ){
        return null
    }

    const x0 = Number( selectionShape?.x0 ?? layoutShape.x0 )
    const x1 = Number( selectionShape?.x1 ?? layoutShape.x1 )
    const y0 = Number( selectionShape?.y0 ?? layoutShape.y0 )
    const y1 = Number( selectionShape?.y1 ?? layoutShape.y1 )

    if( Number.isFinite( x0 ) === false ||
        Number.isFinite( x1 ) === false ||
        Number.isFinite( y0 ) === false ||
        Number.isFinite( y1 ) === false ){
        return null
    }

    return {
        xRange: [ x0, x1 ],
        yRange: [ y0, y1 ],
        shapeIndex
    }
}

function selectionFromRanges( ranges, width, height ){

    const rawXMin = Math.min( ranges.xRange[0], ranges.xRange[1] )
    const rawXMax = Math.max( ranges.xRange[0], ranges.xRange[1] )
    const rawYMin = Math.min( ranges.yRange[0], ranges.yRange[1] )
    const rawYMax = Math.max( ranges.yRange[0], ranges.yRange[1] )

    var xMin = Math.max( 0, Math.ceil( rawXMin ))
    var xMax = Math.min( width - 1, Math.floor( rawXMax ))
    var yMin = Math.max( 0, Math.ceil( rawYMin ))
    var yMax = Math.min( height - 1, Math.floor( rawYMax ))

    if( xMax < xMin ){
        const xCenterIndex = clampIndex(( rawXMin + rawXMax ) / 2, width )
        if( xCenterIndex === null ) return null
        xMin = xCenterIndex
        xMax = xCenterIndex
    }

    if( yMax < yMin ){
        const yCenterIndex = clampIndex(( rawYMin + rawYMax ) / 2, height )
        if( yCenterIndex === null ) return null
        yMin = yCenterIndex
        yMax = yCenterIndex
    }

    if( xMax < xMin || yMax < yMin ){
        return null
    }

    const xIndices = integerRange( xMin, xMax )
    const yIndices = integerRange( yMin, yMax )

    return {
        xIndices,
        yIndices,
        boundingBox: {
            minX: xMin,
            maxX: xMax,
            minY: yMin,
            maxY: yMax,
            width: xMax - xMin + 1,
            height: yMax - yMin + 1
        }
    }
}

function integerRange( minimum, maximum ){

    var values = []
    for( var value = minimum; value <= maximum; value++ ){
        values.push( value )
    }

    return values
}

function clampIndex( value, size ){

    const numeric = Number( value )
    if( Number.isFinite( numeric ) === false ) return null

    const rounded = Math.round( numeric )
    if( rounded < 0 ) return 0
    if( rounded >= size ) return size - 1

    return rounded
}

async function renderFigure( graphContainer, figure, preferReact ){

    const config = {
        responsive: true,
        displaylogo: false,
        modeBarButtonsToRemove: [ "autoScale2d" ]
    }

    const spectrumGridAxisKeys = applySpectrumGridlineLayoutState(
        figure?.layout,
        graphContainer,
        figure?.spectrumGridAxisKeys,
        figure?.spectrumGridDefaultVisible,
        figure?.spectrumGridAvailability
    )
    graphContainer.__harkanaSpectrumGridAxisKeys = spectrumGridAxisKeys
    graphContainer.__harkanaSpectrumLegendVisible = normalizeSpectrumLegendVisibility(
        graphContainer?.__harkanaSpectrumLegendVisible,
        true
    )
    graphContainer.__harkanaSpectrumLegendAvailable = figure?.externalLegendToggle === true

    if( figure?.heatmapPanelOnly !== true && spectrumGridAxisKeys.length > 0 ){
        config.modeBarButtonsToAdd = [ buildSpectrumGridModebarButton( graphContainer ) ]
        if( figure?.externalLegendToggle === true ){
            config.modeBarButtonsToAdd.push( buildSpectrumLegendModebarButton( graphContainer ) )
        }
    }

    const hasExistingFigure = Array.isArray( graphContainer.data ) && graphContainer.data.length > 0

    graphContainer.__harkanaHeatmapAxisConfig = figure?.heatmapPanelOnly === true
        ? STANDALONE_HEATMAP_AXIS_CONFIG
        : FULL_HEATMAP_AXIS_CONFIG

    if( figure?.heatmapPanelOnly === true ){
        config.displayModeBar = true
        config.modeBarButtons = [[
            buildHeatmapSelectModebarButton( graphContainer ),
            buildHeatmapZoomModebarButton( graphContainer, "square" ),
            buildHeatmapZoomModebarButton( graphContainer, "free" ),
            buildHeatmapResetModebarButton( graphContainer )
        ]]

        if( preferReact || hasExistingFigure ){
            await plotlyReact( Plotly,  graphContainer, figure.traces, figure.layout, config )
            syncHeatmapModebarState(
                graphContainer,
                resolveHeatmapModebarInteractionMode( graphContainer ),
                resolveHeatmapModebarZoomAspectRatio( graphContainer )
            )
            normalizeModebarButtonSpacing( graphContainer )
            return
        }

        await plotlyNewPlot( Plotly,  graphContainer, figure.traces, figure.layout, config )
        syncHeatmapModebarState(
            graphContainer,
            resolveHeatmapModebarInteractionMode( graphContainer ),
            resolveHeatmapModebarZoomAspectRatio( graphContainer )
        )
        normalizeModebarButtonSpacing( graphContainer )
        return
    }

    if( figure?.externalHeatmap === true && hasExistingFigure ){
        const incrementallyUpdated = await updateExternalHeatmapFigure( graphContainer, figure )
        if( incrementallyUpdated ){
            await applySpectrumTracePresentationInternal(
                graphContainer,
                graphContainer?.__harkanaSpectrumHighlightGroup
            )
            syncSpectrumLegendModebarState( graphContainer )
            normalizeModebarButtonSpacing( graphContainer )
            return
        }
    }

    if( preferReact || hasExistingFigure ){
        await plotlyReact( Plotly,  graphContainer, figure.traces, figure.layout, config )
        await applySpectrumTracePresentationInternal(
            graphContainer,
            graphContainer?.__harkanaSpectrumHighlightGroup
        )
        syncSpectrumLegendModebarState( graphContainer )
        normalizeModebarButtonSpacing( graphContainer )
        return
    }

    await plotlyNewPlot( Plotly,  graphContainer, figure.traces, figure.layout, config )
    await applySpectrumTracePresentationInternal(
        graphContainer,
        graphContainer?.__harkanaSpectrumHighlightGroup
    )
    syncSpectrumLegendModebarState( graphContainer )
    normalizeModebarButtonSpacing( graphContainer )
}

async function updateExternalHeatmapFigure( graphContainer, figure ){

    if( !graphContainer ) return false

    const existingTraces = Array.isArray( graphContainer.data ) ? graphContainer.data : []
    const nextTraces = Array.isArray( figure?.traces ) ? figure.traces : []

    if( existingTraces.length !== nextTraces.length ){
        return false
    }

    for( var index = 0; index < nextTraces.length; index++ ){

        const existingTrace = existingTraces[index] ?? {}
        const nextTrace = nextTraces[index] ?? {}

        if(( existingTrace.type ?? "" ) !== ( nextTrace.type ?? "" )){
            return false
        }

        if( normalizeAxisID( existingTrace.xaxis ) !== normalizeAxisID( nextTrace.xaxis ) ){
            return false
        }

        if( normalizeAxisID( existingTrace.yaxis ) !== normalizeAxisID( nextTrace.yaxis ) ){
            return false
        }
    }

    const traceIndices = nextTraces.map(( _, index ) => index )
    if( traceIndices.length > 0 ){
        await restyleScatterTraces( graphContainer, nextTraces, traceIndices )
    }

    await Plotly.relayout( graphContainer, externalHeatmapLayoutUpdate( figure.layout ) )

    return true
}

async function restyleScatterTraces( graphContainer, traces, traceIndices ){

    await Plotly.restyle(
        graphContainer,
        {
            x: traces.map(( trace ) => Array.isArray( trace?.x ) ? trace.x : [] ),
            y: traces.map(( trace ) => Array.isArray( trace?.y ) ? trace.y : [] ),
            mode: traces.map(( trace ) => typeof trace?.mode === "string" ? trace.mode : "lines" ),
            fill: traces.map(( trace ) => typeof trace?.fill === "string" ? trace.fill : "none" ),
            fillcolor: traces.map(( trace ) => typeof trace?.fillcolor === "string" ? trace.fillcolor : "rgba(0, 0, 0, 0)" ),
            hovertemplate: traces.map(( trace ) => typeof trace?.hovertemplate === "string" ? trace.hovertemplate : "(%{x}, %{y})<extra></extra>" ),
            hoverinfo: traces.map(( trace ) => typeof trace?.hoverinfo === "string" ? trace.hoverinfo : "all" ),
            name: traces.map(( trace ) => typeof trace?.name === "string" ? trace.name : "" ),
            legendgroup: traces.map(( trace ) => typeof trace?.legendgroup === "string" ? trace.legendgroup : "" ),
            visible: traces.map(( trace ) => trace?.visible !== false ),
            opacity: traces.map(( trace ) => Number.isFinite( Number( trace?.opacity )) ? Number( trace.opacity ) : 1 ),
            showlegend: traces.map(( trace ) => trace?.showlegend === true )
        },
        traceIndices
    )

    await Plotly.restyle(
        graphContainer,
        {
            "line.color": traces.map(( trace ) => typeof trace?.line?.color === "string" ? trace.line.color : "rgba(0, 0, 0, 0)" ),
            "line.width": traces.map(( trace ) => Number.isFinite( Number( trace?.line?.width )) ? Number( trace.line.width ) : 1 )
        },
        traceIndices
    )
}

function externalHeatmapLayoutUpdate( layout ){

    return {
        annotations: Array.isArray( layout?.annotations ) ? layout.annotations : [],
        shapes: Array.isArray( layout?.shapes ) ? layout.shapes : [],
        showlegend: layout?.showlegend === true,
        "margin.t": Number( layout?.margin?.t ) || 0,
        "margin.r": Number( layout?.margin?.r ) || 0,
        "margin.b": Number( layout?.margin?.b ) || 0,
        "margin.l": Number( layout?.margin?.l ) || 0,
        "xaxis.domain": Array.isArray( layout?.xaxis?.domain ) ? layout.xaxis.domain : [ 0, 0.4 ],
        "xaxis.autorange": layout?.xaxis?.autorange ?? false,
        "xaxis.tickmode": layout?.xaxis?.tickmode ?? "array",
        "xaxis.tickvals": Array.isArray( layout?.xaxis?.tickvals ) ? layout.xaxis.tickvals : [],
        "xaxis.ticktext": Array.isArray( layout?.xaxis?.ticktext ) ? layout.xaxis.ticktext : [],
        "xaxis.showticklabels": layout?.xaxis?.showticklabels !== false,
        "yaxis.domain": Array.isArray( layout?.yaxis?.domain ) ? layout.yaxis.domain : [ 0.56, 1 ],
        "yaxis.showticklabels": layout?.yaxis?.showticklabels !== false,
        "yaxis.title.text": layout?.yaxis?.title?.text ?? "",
        "xaxis2.domain": Array.isArray( layout?.xaxis2?.domain ) ? layout.xaxis2.domain : [ 0, 0.4 ],
        "xaxis2.autorange": layout?.xaxis2?.autorange ?? true,
        "xaxis2.tickmode": layout?.xaxis2?.tickmode ?? "array",
        "xaxis2.tickvals": Array.isArray( layout?.xaxis2?.tickvals ) ? layout.xaxis2.tickvals : [],
        "xaxis2.ticktext": Array.isArray( layout?.xaxis2?.ticktext ) ? layout.xaxis2.ticktext : [],
        "xaxis2.showticklabels": layout?.xaxis2?.showticklabels !== false,
        "xaxis2.title.text": layout?.xaxis2?.title?.text ?? "",
        "yaxis2.domain": Array.isArray( layout?.yaxis2?.domain ) ? layout.yaxis2.domain : [ 0, 0.44 ],
        "yaxis2.showticklabels": layout?.yaxis2?.showticklabels !== false,
        "yaxis2.title.text": layout?.yaxis2?.title?.text ?? "",
        "xaxis3.domain": Array.isArray( layout?.xaxis3?.domain ) ? layout.xaxis3.domain : [ 0.6, 1 ],
        "xaxis3.range": Array.isArray( layout?.xaxis3?.range ) ? layout.xaxis3.range : [ -0.5, 0.5 ],
        "xaxis3.tickmode": layout?.xaxis3?.tickmode ?? "array",
        "xaxis3.tickvals": Array.isArray( layout?.xaxis3?.tickvals ) ? layout.xaxis3.tickvals : [],
        "xaxis3.ticktext": Array.isArray( layout?.xaxis3?.ticktext ) ? layout.xaxis3.ticktext : [],
        "xaxis3.title.text": layout?.xaxis3?.title?.text ?? "",
        "yaxis3.domain": Array.isArray( layout?.yaxis3?.domain ) ? layout.yaxis3.domain : [ 0, 1 ],
        "yaxis3.range": Array.isArray( layout?.yaxis3?.range ) ? layout.yaxis3.range : [ -0.5, 0.5 ],
        "yaxis3.autorange": layout?.yaxis3?.autorange ?? true,
        "yaxis3.tickmode": layout?.yaxis3?.tickmode ?? "array",
        "yaxis3.tickvals": Array.isArray( layout?.yaxis3?.tickvals ) ? layout.yaxis3.tickvals : [],
        "yaxis3.ticktext": Array.isArray( layout?.yaxis3?.ticktext ) ? layout.yaxis3.ticktext : [],
        "yaxis3.title.text": layout?.yaxis3?.title?.text ?? ""
    }
}

function getHeatmapRendererPayload( graphContainer ){

    if( !graphContainer ) return null
    return graphContainer.__harkanaHeatmapRendererPayload ?? null
}

export default {
    setPcaComponentColors,
    initialize,
    update,
    initializeRgb,
    updateRgb,
    initializeUmap,
    updateUmap,
    initializePcaMip,
    updatePcaMip,
    initializePcaClassification,
    updatePcaClassification,
    initializePcaRgb,
    updatePcaRgb,
    initializeZBlend,
    updateZBlend,
    initializeUpperPanel,
    updateUpperPanel,
    initializeLowerPanel,
    updateLowerPanel,
    resizeGraph,
    updateLowerSpectrum,
    configureHeatmapInteraction,
    getHeatmapPaneState,
    getHeatmapRendererPayload,
    relayoutHeatmapViewport,
    resetHeatmapViewport,
    prewarmScalarHeatmapRendererPayload,
    prewarmRgbHeatmapRendererPayload,
    prewarmRgbHeatmapRendererPayloadAsync,
    prewarmUmapHeatmapRendererPayload,
    prewarmUmapHeatmapRendererPayloadAsync,
    prewarmPcaMipHeatmapRendererPayload,
    prewarmPcaMipHeatmapRendererPayloadAsync,
    prewarmPcaClassificationHeatmapRendererPayload,
    prewarmPcaClassificationHeatmapRendererPayloadAsync,
    prewarmPcaRgbHeatmapRendererPayload,
    prewarmPcaRgbHeatmapRendererPayloadAsync,
    prewarmZBlendHeatmapRendererPayload,
    updateZBlendHeatmapPayload,
    setSpectrumGridlinesVisible,
    setSpectrumHighlightGroup,
    setSpectrumHiddenGroups,
    syncHeatmapModebarState
}
