import Plotly from "plotly.js-dist"
import { prepareVisualizationPayloadInWorker } from "./visualizationWorkerClient.js"

const DEFAULT_PCA_COMPONENT_COLOR_STRINGS = [
    "#0072b2",
    "#e69f00",
    "#009e73",
    "#d55e00",
    "#cc79a7",
    "#56b4e9",
    "#f0e442",
    "#8c564b",
    "#f781bf",
    "#7f7f7f"
]
const DEFAULT_UMAP_CHANNEL_COLOR_STRINGS = {
    r: "#ff0000",
    g: "#00ff00",
    b: "#0000ff"
}
const DEFAULT_Z_BLEND_PALETTE_COLOR_STRINGS = [
    "#0000ff",
    "#00ff00",
    "#ff00ff",
    "#ffff00",
    "#00ffff",
    "#ff0000",
    "#0000ff",
    "#00ff00",
    "#ff00ff",
    "#ffff00"
]
const SUPPORTED_HEATMAP_COLOR_SCALES = new Set([
    "Blackbody",
    "Bluered",
    "Blues",
    "Cividis",
    "Earth",
    "Electric",
    "Greens",
    "Greys",
    "Hot",
    "Jet",
    "Picnic",
    "Portland",
    "Rainbow",
    "RdBu",
    "Reds",
    "Viridis",
    "YlGnBu",
    "YlOrRd"
])
const EXTERNAL_HEATMAP_COLOR_SCALES = {
    Greys: [[ 0, "rgb(0,0,0)" ], [ 1, "rgb(255,255,255)" ]],
    YlGnBu: [[ 0, "rgb(8,29,88)" ], [ 0.125, "rgb(37,52,148)" ], [ 0.25, "rgb(34,94,168)" ], [ 0.375, "rgb(29,145,192)" ], [ 0.5, "rgb(65,182,196)" ], [ 0.625, "rgb(127,205,187)" ], [ 0.75, "rgb(199,233,180)" ], [ 0.875, "rgb(237,248,217)" ], [ 1, "rgb(255,255,217)" ]],
    Greens: [[ 0, "rgb(0,68,27)" ], [ 0.125, "rgb(0,109,44)" ], [ 0.25, "rgb(35,139,69)" ], [ 0.375, "rgb(65,171,93)" ], [ 0.5, "rgb(116,196,118)" ], [ 0.625, "rgb(161,217,155)" ], [ 0.75, "rgb(199,233,192)" ], [ 0.875, "rgb(229,245,224)" ], [ 1, "rgb(247,252,245)" ]],
    YlOrRd: [[ 0, "rgb(128,0,38)" ], [ 0.125, "rgb(189,0,38)" ], [ 0.25, "rgb(227,26,28)" ], [ 0.375, "rgb(252,78,42)" ], [ 0.5, "rgb(253,141,60)" ], [ 0.625, "rgb(254,178,76)" ], [ 0.75, "rgb(254,217,118)" ], [ 0.875, "rgb(255,237,160)" ], [ 1, "rgb(255,255,204)" ]],
    Bluered: [[ 0, "rgb(0,0,255)" ], [ 1, "rgb(255,0,0)" ]],
    RdBu: [[ 0, "rgb(5,10,172)" ], [ 0.35, "rgb(106,137,247)" ], [ 0.5, "rgb(190,190,190)" ], [ 0.6, "rgb(220,170,132)" ], [ 0.7, "rgb(230,145,90)" ], [ 1, "rgb(178,10,28)" ]],
    Reds: [[ 0, "rgb(220,220,220)" ], [ 0.2, "rgb(245,195,157)" ], [ 0.4, "rgb(245,160,105)" ], [ 1, "rgb(178,10,28)" ]],
    Blues: [[ 0, "rgb(5,10,172)" ], [ 0.35, "rgb(40,60,190)" ], [ 0.5, "rgb(70,100,245)" ], [ 0.6, "rgb(90,120,245)" ], [ 0.7, "rgb(106,137,247)" ], [ 1, "rgb(220,220,220)" ]],
    Picnic: [[ 0, "rgb(0,0,255)" ], [ 0.1, "rgb(51,153,255)" ], [ 0.2, "rgb(102,204,255)" ], [ 0.3, "rgb(153,204,255)" ], [ 0.4, "rgb(204,204,255)" ], [ 0.5, "rgb(255,255,255)" ], [ 0.6, "rgb(255,204,255)" ], [ 0.7, "rgb(255,153,255)" ], [ 0.8, "rgb(255,102,204)" ], [ 0.9, "rgb(255,102,102)" ], [ 1, "rgb(255,0,0)" ]],
    Rainbow: [[ 0, "rgb(150,0,90)" ], [ 0.125, "rgb(0,0,200)" ], [ 0.25, "rgb(0,25,255)" ], [ 0.375, "rgb(0,152,255)" ], [ 0.5, "rgb(44,255,150)" ], [ 0.625, "rgb(151,255,0)" ], [ 0.75, "rgb(255,234,0)" ], [ 0.875, "rgb(255,111,0)" ], [ 1, "rgb(255,0,0)" ]],
    Portland: [[ 0, "rgb(12,51,131)" ], [ 0.25, "rgb(10,136,186)" ], [ 0.5, "rgb(242,211,56)" ], [ 0.75, "rgb(242,143,56)" ], [ 1, "rgb(217,30,30)" ]],
    Jet: [[ 0, "rgb(0,0,131)" ], [ 0.125, "rgb(0,60,170)" ], [ 0.375, "rgb(5,255,255)" ], [ 0.625, "rgb(255,255,0)" ], [ 0.875, "rgb(250,0,0)" ], [ 1, "rgb(128,0,0)" ]],
    Hot: [[ 0, "rgb(0,0,0)" ], [ 0.3, "rgb(230,0,0)" ], [ 0.6, "rgb(255,210,0)" ], [ 1, "rgb(255,255,255)" ]],
    Blackbody: [[ 0, "rgb(0,0,0)" ], [ 0.2, "rgb(230,0,0)" ], [ 0.4, "rgb(230,210,0)" ], [ 0.7, "rgb(255,255,255)" ], [ 1, "rgb(160,200,255)" ]],
    Earth: [[ 0, "rgb(0,0,130)" ], [ 0.1, "rgb(0,180,180)" ], [ 0.2, "rgb(40,210,40)" ], [ 0.4, "rgb(230,230,50)" ], [ 0.6, "rgb(120,70,20)" ], [ 1, "rgb(255,255,255)" ]],
    Electric: [[ 0, "rgb(0,0,0)" ], [ 0.15, "rgb(30,0,100)" ], [ 0.4, "rgb(120,0,100)" ], [ 0.6, "rgb(160,90,0)" ], [ 0.8, "rgb(230,200,0)" ], [ 1, "rgb(255,250,220)" ]],
    Viridis: [[ 0, "#440154" ], [ 0.06274509803921569, "#48186a" ], [ 0.12549019607843137, "#472d7b" ], [ 0.18823529411764706, "#424086" ], [ 0.25098039215686274, "#3b528b" ], [ 0.3137254901960784, "#33638d" ], [ 0.3764705882352941, "#2c728e" ], [ 0.4392156862745098, "#26828e" ], [ 0.5019607843137255, "#21918c" ], [ 0.5647058823529412, "#1fa088" ], [ 0.6274509803921569, "#28ae80" ], [ 0.6901960784313725, "#3fbc73" ], [ 0.7529411764705882, "#5ec962" ], [ 0.8156862745098039, "#84d44b" ], [ 0.8784313725490196, "#addc30" ], [ 0.9411764705882353, "#d8e219" ], [ 1, "#fde725" ]],
    Cividis: [[ 0, "rgb(0,32,76)" ], [ 0.058824, "rgb(0,42,102)" ], [ 0.117647, "rgb(0,52,110)" ], [ 0.176471, "rgb(39,63,108)" ], [ 0.235294, "rgb(60,74,107)" ], [ 0.294118, "rgb(76,85,107)" ], [ 0.352941, "rgb(91,95,109)" ], [ 0.411765, "rgb(104,106,112)" ], [ 0.470588, "rgb(117,117,117)" ], [ 0.529412, "rgb(131,129,120)" ], [ 0.588235, "rgb(146,140,120)" ], [ 0.647059, "rgb(161,152,118)" ], [ 0.705882, "rgb(176,165,114)" ], [ 0.764706, "rgb(192,177,109)" ], [ 0.823529, "rgb(209,191,102)" ], [ 0.882353, "rgb(225,204,92)" ], [ 0.941176, "rgb(243,219,79)" ], [ 1, "rgb(255,233,69)" ]]
}
const TOP_LEFT_INSTRUCTION_TEXT = "Select a region of interest (ROI) from the sidebar to view its stored spectrum here.<br>In PCA and RPCA views, this panel can also show component loadings."
const LOWER_LEFT_INSTRUCTION_TEXT = "Enable Select spectra in the sidebar, then drag a region or click a pixel to view a spectrum here."
const FULL_HEATMAP_AXIS_CONFIG = {
    xaxisKey: "xaxis3",
    yaxisKey: "yaxis3",
    traceXaxis: "x3",
    traceYaxis: "y3"
}
const STANDALONE_HEATMAP_AXIS_CONFIG = {
    xaxisKey: "xaxis",
    yaxisKey: "yaxis",
    traceXaxis: "x",
    traceYaxis: "y"
}
const STANDALONE_SPECTRUM_GRID_AXIS_KEYS = [ "xaxis", "yaxis" ]
const COMBINED_SPECTRUM_GRID_AXIS_KEYS = [ "xaxis", "yaxis", "xaxis2", "yaxis2" ]
const SPECTRUM_GRID_MODEBAR_ICON = {
    width: 512,
    height: 512,
    ascent: 512,
    descent: 0,
    path: "M64 64H448V448H64V64ZM96 96V192H192V96H96ZM224 96V192H320V96H224ZM352 96V192H416V96H352ZM96 224V320H192V224H96ZM224 224V320H320V224H224ZM352 224V320H416V224H352ZM96 352V416H192V352H96ZM224 352V416H320V352H224ZM352 352V416H416V352H352Z"
}
var pcaComponentColors = DEFAULT_PCA_COMPONENT_COLOR_STRINGS
    .map(( color ) => parseColorValue( color ))
    .filter(( color ) => color !== null )
const EXTERNAL_HEATMAP_PAYLOAD_CACHE_LIMIT = 40
const SCALAR_COLOR_MAP_TEXTURE_SIZE = 1024
const heatmapPayloadObjectIDs = new WeakMap()
let nextHeatmapPayloadObjectID = 1
const scalarColorMapTextureSources = new Map()
const scalarIntensityTextureSources = new WeakMap()
const normalizedMipCache = new WeakMap()
const normalizedPcaScoresCache = new WeakMap()
const robustScaleCache = new WeakMap()
const pcaRgbNormalizedChannelsCache = new WeakMap()
const zBlendIntensityTextureCache = new WeakMap()

var setPcaComponentColors = function( pcaLegend = [] ){

    const legendEntries = Array.isArray( pcaLegend )
        ? pcaLegend
        : ( Array.isArray( pcaLegend?.value ) ? pcaLegend.value : [] )

    if( legendEntries.length === 0 ){
        pcaComponentColors = defaultPcaComponentColors()
        return
    }

    const defaultColors = defaultPcaComponentColors()
    var resolvedColors = [ ...defaultColors ]

    for( const entry of legendEntries ){

        const componentIndex = Number.parseInt( entry?.componentIndex, 10 )
        const parsedColor = parseColorValue( entry?.color )

        if( Number.isInteger( componentIndex ) === false || componentIndex < 1 ) continue
        if( parsedColor === null ) continue

        const targetIndex = componentIndex - 1
        while( resolvedColors.length <= targetIndex ){
            resolvedColors.push( defaultColors[ resolvedColors.length % defaultColors.length ] )
        }
        resolvedColors[targetIndex] = parsedColor
    }

    pcaComponentColors = resolvedColors.length > 0 ? resolvedColors : defaultColors
}

function defaultPcaComponentColors(){
    return DEFAULT_PCA_COMPONENT_COLOR_STRINGS
        .map(( color ) => parseColorValue( color ))
        .filter(( color ) => color !== null )
}

function resolveHeatmapAxisConfig( graphContainer ){

    const customConfig = graphContainer?.__harkanaHeatmapAxisConfig
    if( customConfig &&
        typeof customConfig === "object" &&
        typeof customConfig.xaxisKey === "string" &&
        typeof customConfig.yaxisKey === "string" &&
        typeof customConfig.traceXaxis === "string" &&
        typeof customConfig.traceYaxis === "string" ){
        return customConfig
    }

    return FULL_HEATMAP_AXIS_CONFIG
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

function normalizeModebarButtonSpacing( graphContainer ){
    const customButton = graphContainer?.querySelector?.('.modebar-btn[data-attr="toggle-gridlines"]')
    const customGroup = customButton?.closest?.('.modebar-group')

    if( customGroup && customGroup.parentElement?.lastElementChild === customGroup ){
        customGroup.style.marginLeft = "0px"
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

function parseColorValue( color ){

    if( typeof color !== "string" ){
        if( Array.isArray( color ) && color.length >= 3 ){
            return [
                Math.max( 0, Math.min( 255, Number.parseInt( color[0], 10 ) || 0 )),
                Math.max( 0, Math.min( 255, Number.parseInt( color[1], 10 ) || 0 )),
                Math.max( 0, Math.min( 255, Number.parseInt( color[2], 10 ) || 0 ))
            ]
        }
        return null
    }

    const match = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i)
    if( match !== null ){
        return [
            Math.max( 0, Math.min( 255, Number.parseInt( match[1], 10 ) || 0 )),
            Math.max( 0, Math.min( 255, Number.parseInt( match[2], 10 ) || 0 )),
            Math.max( 0, Math.min( 255, Number.parseInt( match[3], 10 ) || 0 ))
        ]
    }

    const hex = color.trim()
    const shortHexMatch = hex.match(/^#([0-9a-f]{3})$/i)
    if( shortHexMatch !== null ){
        return [
            Number.parseInt( shortHexMatch[1][0] + shortHexMatch[1][0], 16 ),
            Number.parseInt( shortHexMatch[1][1] + shortHexMatch[1][1], 16 ),
            Number.parseInt( shortHexMatch[1][2] + shortHexMatch[1][2], 16 )
        ]
    }

    const longHexMatch = hex.match(/^#([0-9a-f]{6})$/i)
    if( longHexMatch !== null ){
        return [
            Number.parseInt( longHexMatch[1].slice( 0, 2 ), 16 ),
            Number.parseInt( longHexMatch[1].slice( 2, 4 ), 16 ),
            Number.parseInt( longHexMatch[1].slice( 4, 6 ), 16 )
        ]
    }

    return null
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

var updateLowerSpectrum = async function( graphContainer, spectrum, options = {} ){

    if( !graphContainer ) return

    const axes = normalizeAxisMetadata( options?.axes )
    const traces = Array.isArray( graphContainer.data ) ? graphContainer.data : []
    const traceIndices = findLowerSpectrumTraceIndices( traces )
    if( traceIndices.length === 0 ) return

    const lowerPlot = buildBottomLeftTraces( options?.settings ?? {},
                                             options?.bottomLeftSpectrum,
                                             spectrum,
                                             axes.zValues )
    const lowerTraceCount = Math.min( traceIndices.length, lowerPlot.traces.length )
    if( lowerTraceCount <= 0 ) return

    const lowerAxisTicks = valueLatexTicks( lowerPlot.axisValues )
    const settings = options?.settings ?? {}
    const spectralLabel = sanitizeLatexLabel( settings?.labels?.spectral, "\\nu" )
    const spectralTitle = formatAxisTitle( spectralLabel, axes.zUnit, settings?.labels?.showUnits !== false && settings?.labels?.showUnits !== "false" )
    const intensityTitle = resolveIntensityAxisTitle( settings )
    const annotations = buildSidePanelInstructionAnnotations(
        graphContainer?.layout ?? {},
        TOP_LEFT_INSTRUCTION_TEXT,
        lowerPlot.message
    )

    for( var index = 0; index < lowerTraceCount; index++ ){

        const trace = lowerPlot.traces[index] ?? {}

        await Plotly.restyle( graphContainer,
                              {
                                  x: [ Array.isArray( trace.x ) ? trace.x : [] ],
                                  y: [ Array.isArray( trace.y ) ? trace.y : [] ],
                                  mode: [ typeof trace.mode === "string" ? trace.mode : "lines" ],
                                  fill: [ typeof trace.fill === "string" ? trace.fill : "none" ],
                                  fillcolor: [ typeof trace.fillcolor === "string" ? trace.fillcolor : "rgba(0, 0, 0, 0)" ],
                                  hovertemplate: [ typeof trace.hovertemplate === "string" ? trace.hovertemplate : "(%{x}, %{y})<extra></extra>" ],
                                  hoverinfo: [ typeof trace.hoverinfo === "string" ? trace.hoverinfo : "all" ],
                                  showlegend: [ trace.showlegend === true ]
                              },
                              [ traceIndices[index] ] )

        await Plotly.restyle( graphContainer,
                              {
                                  "line.color": [ typeof trace?.line?.color === "string" ? trace.line.color : "rgba(0, 0, 0, 0)" ],
                                  "line.width": [ Number.isFinite( Number( trace?.line?.width )) ? Number( trace.line.width ) : 1 ]
                              },
                              [ traceIndices[index] ] )
    }

    await Plotly.relayout( graphContainer,
                           {
                               annotations,
                               "xaxis.showticklabels": false,
                               "yaxis.showticklabels": false,
                               "yaxis.title.text": "",
                               "xaxis2.tickmode": "array",
                               "xaxis2.tickvals": lowerAxisTicks.tickvals,
                               "xaxis2.ticktext": lowerAxisTicks.ticktext,
                               "xaxis2.showticklabels": lowerPlot.usingSpectrum,
                               "yaxis2.showticklabels": lowerPlot.usingSpectrum,
                               "xaxis2.title.text": lowerPlot.usingSpectrum ? spectralTitle : "",
                               "yaxis2.title.text": lowerPlot.usingSpectrum ? intensityTitle : ""
                           } )
}

var resizeGraph = async function( graphContainer ){

    if( !graphContainer ) return
    if( typeof Plotly?.Plots?.resize !== "function" ) return

    await Plotly.Plots.resize( graphContainer )
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

function normalizeExternalHeatmapRendererMode( renderer ){
    return renderer === "deckgl" ? "deckgl" : "plotly"
}

function shouldUseExternalHeatmapRenderer( options ){
    return normalizeExternalHeatmapRendererMode( options?.heatmapRenderer ) === "deckgl"
}

function normalizeExternalHeatmapPayloadCache( graphContainer ){

    if( !graphContainer ) return null

    if( graphContainer.__harkanaExternalHeatmapPayloadCache instanceof Map ){
        return graphContainer.__harkanaExternalHeatmapPayloadCache
    }

    const cache = new Map()
    graphContainer.__harkanaExternalHeatmapPayloadCache = cache
    return cache
}

function heatmapPayloadObjectKey( value ){

    if( value !== null && typeof value === "object" ){

        if( heatmapPayloadObjectIDs.has( value ) === false ){
            heatmapPayloadObjectIDs.set( value, nextHeatmapPayloadObjectID )
            nextHeatmapPayloadObjectID += 1
        }

        return "object:" + heatmapPayloadObjectIDs.get( value )
    }

    return "primitive:" + String( value )
}

function stringifyHeatmapPayloadKeyPart( value ){

    if( Array.isArray( value ) ){
        return "[" + value.map(( entry ) => stringifyHeatmapPayloadKeyPart( entry )).join( "," ) + "]"
    }

    if( value !== null && typeof value === "object" ){
        const keys = Object.keys( value ).sort()
        return "{" + keys.map(( key ) => key + ":" + stringifyHeatmapPayloadKeyPart( value[key] )).join( "," ) + "}"
    }

    return String( value )
}

function buildExternalHeatmapPayloadCacheKey( kind, source, options = {} ){

    const entries = Object.entries( options )
        .filter(([, value ]) => value !== undefined )
        .sort(([ left ], [ right ]) => left.localeCompare( right ))
        .map(([ key, value ]) => key + "=" + stringifyHeatmapPayloadKeyPart( value ))

    return kind + "|" + heatmapPayloadSourceKey( kind, source ) + "|" + entries.join( "|" )
}

function heatmapPayloadSourceKey( kind, source ){

    if( kind === "umap" || kind === "pca-classification" || kind === "pca-rgb" ){
        return structuredHeatmapPayloadObjectKey( source )
    }

    return heatmapPayloadObjectKey( source )
}

function structuredHeatmapPayloadObjectKey( value ){

    if( value === null || typeof value !== "object" ){
        return heatmapPayloadObjectKey( value )
    }

    if( Array.isArray( value ) ){
        if( value.length > 0 &&
            Array.isArray( value[0] ) &&
            value[0].length > 0 &&
            Array.isArray( value[0][0] ) ){
            return "array:[" + value.map(( entry, index ) => {
                return index + ":" + heatmapPayloadObjectKey( entry )
            }).join( "|" ) + "]"
        }

        return heatmapPayloadObjectKey( value )
    }

    const keys = Object.keys( value ).sort()
    return "object:{" + keys.map(( key ) => {
        return key + ":" + heatmapPayloadObjectKey( value[key] )
    }).join( "|" ) + "}"
}

function getCachedExternalHeatmapPayload( graphContainer, cacheKey ){

    if( typeof cacheKey !== "string" || cacheKey.length === 0 ) return null

    const cache = normalizeExternalHeatmapPayloadCache( graphContainer )
    if( cache === null ) return null

    const payload = cache.get( cacheKey ) ?? null
    if( payload !== null ){
        cache.delete( cacheKey )
        cache.set( cacheKey, payload )
    }

    return payload
}

function setCachedExternalHeatmapPayload( graphContainer, cacheKey, payload ){

    if( typeof cacheKey !== "string" || cacheKey.length === 0 ) return
    if( payload === null || typeof payload !== "object" ) return

    const cache = normalizeExternalHeatmapPayloadCache( graphContainer )
    if( cache === null ) return

    if( cache.has( cacheKey ) ){
        cache.delete( cacheKey )
    }

    cache.set( cacheKey, payload )

    while( cache.size > EXTERNAL_HEATMAP_PAYLOAD_CACHE_LIMIT ){
        const oldestKey = cache.keys().next().value
        cache.delete( oldestKey )
    }
}

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
            componentColors: pcaComponentColors,
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
                componentColors: pcaComponentColors,
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
            componentColors: pcaComponentColors
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
            componentColors: pcaComponentColors
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

    cacheHeatmapRendererPayload(
        graphContainer,
        payload,
        normalizeExternalHeatmapRendererMode( options?.heatmapRenderer )
    )

    return payload
}

function cacheHeatmapRendererPayload( graphContainer, payload, mode ){

    if( !graphContainer ) return

    graphContainer.__harkanaHeatmapRendererPayload = payload ?? null
    graphContainer.__harkanaHeatmapRendererMode = mode
}

function normalizeHeatmapOrigin( origin ){
    return origin === "bottom-left" ? "bottom-left" : "top-left"
}

function resolveStoredHeatmapOrigin( graphContainer, fallback = "top-left" ){

    const storedOrigin = graphContainer?.__harkanaHeatmapOrigin
    if( storedOrigin === "bottom-left" || storedOrigin === "top-left" ){
        return storedOrigin
    }

    return normalizeHeatmapOrigin( fallback )
}

function cacheHeatmapOrigin( graphContainer, settings ){

    if( !graphContainer ) return
    graphContainer.__harkanaHeatmapOrigin = normalizeHeatmapOrigin( settings?.layout?.heatmapOrigin )
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

function normalizeHeatmapInteractionMode( mode ){
    return mode === "select" ? "select" : "zoom"
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

    if( figure?.heatmapPanelOnly === true ){
        config.displayModeBar = false
    } else if( spectrumGridAxisKeys.length > 0 ){
        config.modeBarButtonsToAdd = [ buildSpectrumGridModebarButton( graphContainer ) ]
    }

    const hasExistingFigure = Array.isArray( graphContainer.data ) && graphContainer.data.length > 0

    graphContainer.__harkanaHeatmapAxisConfig = figure?.heatmapPanelOnly === true
        ? STANDALONE_HEATMAP_AXIS_CONFIG
        : FULL_HEATMAP_AXIS_CONFIG

    if( figure?.heatmapPanelOnly === true ){
        if( preferReact || hasExistingFigure ){
            await Plotly.react( graphContainer, figure.traces, figure.layout, config )
            normalizeModebarButtonSpacing( graphContainer )
            return
        }

        await Plotly.newPlot( graphContainer, figure.traces, figure.layout, config )
        normalizeModebarButtonSpacing( graphContainer )
        return
    }

    if( figure?.externalHeatmap === true && hasExistingFigure ){
        const incrementallyUpdated = await updateExternalHeatmapFigure( graphContainer, figure )
        if( incrementallyUpdated ){
            return
        }
    }

    if( preferReact || hasExistingFigure ){
        await Plotly.react( graphContainer, figure.traces, figure.layout, config )
        normalizeModebarButtonSpacing( graphContainer )
        return
    }

    await Plotly.newPlot( graphContainer, figure.traces, figure.layout, config )
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

function buildMeanTrace( x, y, xaxis, yaxis, color ){

    var trace = {}
    trace.type = "scatter"
    trace.mode = "lines"
    trace.x = x
    trace.y = y
    trace.xaxis = xaxis
    trace.yaxis = yaxis
    trace.line = { color, width: 2 }
    trace.hovertemplate = "(%{x}, %{y})<extra></extra>"

    return trace
}

function resolveQueriedSpectrumStyle( settings ){

    const lineColor = resolveColorString( settings?.hyperspectrumColors?.queriedSpectrum, "#1f77b4" )
    const intervalColor = resolveColorString( settings?.hyperspectrumColors?.queriedInterval, lineColor )
    const configuredOpacity = Number( settings?.hyperspectrumSpectrum?.intervalOpacity )
    const intervalOpacity = Number.isFinite( configuredOpacity )
        ? Math.max( 0, Math.min( 1, configuredOpacity ))
        : 0.25
    const showInterval = settings?.hyperspectrumSpectrum?.showInterval !== false &&
        settings?.hyperspectrumSpectrum?.showInterval !== "false"

    return {
        lineColor,
        intervalColor,
        intervalFillColor: colorWithAlpha( intervalColor, intervalOpacity ),
        showInterval,
        lineWidth: 2
    }
}

function resolveRoiSpectrumStyle( settings ){

    const lineColor = resolveColorString( settings?.hyperspectrumColors?.roiSpectrum, "#333333" )
    const intervalColor = resolveColorString( settings?.hyperspectrumColors?.roiInterval, lineColor )
    const configuredOpacity = Number( settings?.hyperspectrumRoi?.intervalOpacity )
    const intervalOpacity = Number.isFinite( configuredOpacity )
        ? Math.max( 0, Math.min( 1, configuredOpacity ))
        : 0.25
    const showInterval = settings?.hyperspectrumRoi?.showInterval !== false &&
        settings?.hyperspectrumRoi?.showInterval !== "false"

    return {
        lineColor,
        intervalColor,
        intervalFillColor: colorWithAlpha( intervalColor, intervalOpacity ),
        showInterval,
        lineWidth: 2
    }
}

function resolveColorString( color, fallback ){

    if( typeof color !== "string" || color.length === 0 ){
        return fallback
    }

    return parseColorValue( color ) === null ? fallback : color
}

function colorWithAlpha( color, alpha ){

    const rgb = parseColorValue( color )
    if( rgb === null ){
        return "rgba(31, 119, 180, " + alpha + ")"
    }

    return "rgba(" + rgb[0] + ", " + rgb[1] + ", " + rgb[2] + ", " + alpha + ")"
}

function buildUncertaintyLowerTrace( x, y, xaxis, yaxis, color ){

    var trace = {}
    trace.type = "scatter"
    trace.mode = "lines"
    trace.x = x
    trace.y = y
    trace.xaxis = xaxis
    trace.yaxis = yaxis
    trace.line = { color, width: 0 }
    trace.showlegend = false
    trace.hovertemplate = "(%{x}, %{y})<extra></extra>"

    return trace
}

function buildUncertaintyUpperTrace( x, y, xaxis, yaxis, color, fillcolor ){

    var trace = {}
    trace.type = "scatter"
    trace.mode = "lines"
    trace.x = x
    trace.y = y
    trace.xaxis = xaxis
    trace.yaxis = yaxis
    trace.fill = "tonexty"
    trace.fillcolor = fillcolor
    trace.line = { color, width: 0 }
    trace.showlegend = false
    trace.hovertemplate = "(%{x}, %{y})<extra></extra>"

    return trace
}

function buildPlaceholderTrace( x, xaxis, yaxis ){

    const xValues = Array.isArray( x ) && x.length > 0 ? x : [ 0 ]

    var trace = {}
    trace.type = "scatter"
    trace.mode = "lines"
    trace.x = xValues
    trace.y = xValues.map(() => null )
    trace.xaxis = xaxis
    trace.yaxis = yaxis
    trace.line = { color: "rgba(0, 0, 0, 0)", width: 1 }
    trace.hoverinfo = "skip"

    return trace
}

function buildSpectrumTraceGroup( style, spectrumPayload, spectralAxisValues = [], xaxis = "x2", yaxis = "y2" ){

    const normalizedSpectrum = normalizeSpectrumSeries( spectrumPayload )

    if( normalizedSpectrum !== null ){
        const xValues = resolveSeriesXValues( spectralAxisValues,
                                              normalizedSpectrum.y.length,
                                              normalizedSpectrum.x )
        const hasBounds = style?.showInterval === true &&
            Array.isArray( normalizedSpectrum.lowerBound ) &&
            Array.isArray( normalizedSpectrum.upperBound ) &&
            normalizedSpectrum.lowerBound.length === xValues.length &&
            normalizedSpectrum.upperBound.length === xValues.length

        const lowerTrace = hasBounds
            ? buildUncertaintyLowerTrace( xValues,
                                          normalizedSpectrum.lowerBound,
                                          xaxis,
                                          yaxis,
                                          style.intervalColor )
            : buildPlaceholderTrace( xValues, xaxis, yaxis )
        const upperTrace = hasBounds
            ? buildUncertaintyUpperTrace( xValues,
                                          normalizedSpectrum.upperBound,
                                          xaxis,
                                          yaxis,
                                          style.intervalColor,
                                          style.intervalFillColor )
            : buildPlaceholderTrace( xValues, xaxis, yaxis )
        const meanTrace = buildMeanTrace( xValues,
                                          normalizedSpectrum.y,
                                          xaxis,
                                          yaxis,
                                          style.lineColor )
        meanTrace.line.width = Number.isFinite( Number( style?.lineWidth ))
            ? Number( style.lineWidth )
            : 2

        return {
            traces: [ lowerTrace, upperTrace, meanTrace ],
            axisLength: xValues.length,
            axisValues: xValues,
            usingSpectrum: true
        }
    }

    const fallbackAxisLength = Array.isArray( spectralAxisValues ) && spectralAxisValues.length > 0 ? spectralAxisValues.length : 1
    const fallbackX = resolveSeriesXValues( spectralAxisValues, fallbackAxisLength )

    return {
        traces: [
            buildPlaceholderTrace( fallbackX, xaxis, yaxis ),
            buildPlaceholderTrace( fallbackX, xaxis, yaxis ),
            buildPlaceholderTrace( fallbackX, xaxis, yaxis )
        ],
        axisLength: fallbackAxisLength,
        axisValues: fallbackX,
        usingSpectrum: false
    }
}

function buildLowerSpectrumTraces( settings, selectedSpectrum, spectralAxisValues = [], xaxis = "x2", yaxis = "y2" ){
    const group = buildSpectrumTraceGroup( resolveQueriedSpectrumStyle( settings ), selectedSpectrum, spectralAxisValues, xaxis, yaxis )
    return {
        ...group,
        message: group.usingSpectrum ? "" : LOWER_LEFT_INSTRUCTION_TEXT
    }
}

function buildBottomLeftTraces( settings, bottomLeftSpectrum, selectedSpectrum, spectralAxisValues = [], xaxis = "x2", yaxis = "y2" ){

    const roiPayload = bottomLeftSpectrum?.roi ?? null
    const currentPayload = bottomLeftSpectrum?.current ?? null
    const hasCompositePayload = roiPayload !== null || currentPayload !== null

    if( hasCompositePayload ){
        const roiGroup = buildSpectrumTraceGroup(
            resolveRoiSpectrumStyle( settings ),
            roiPayload,
            spectralAxisValues,
            xaxis,
            yaxis
        )
        const currentGroup = buildSpectrumTraceGroup(
            resolveQueriedSpectrumStyle( settings ),
            currentPayload,
            spectralAxisValues,
            xaxis,
            yaxis
        )
        const usingSpectrum = roiGroup.usingSpectrum || currentGroup.usingSpectrum
        const axisValues = roiGroup.usingSpectrum
            ? roiGroup.axisValues
            : currentGroup.axisValues

        return {
            traces: [ ...roiGroup.traces, ...currentGroup.traces ],
            axisValues,
            usingSpectrum,
            message: usingSpectrum
                ? ""
                : ( typeof bottomLeftSpectrum?.fallbackMessage === "string" && bottomLeftSpectrum.fallbackMessage.length > 0
                    ? bottomLeftSpectrum.fallbackMessage
                    : LOWER_LEFT_INSTRUCTION_TEXT )
        }
    }

    if( typeof bottomLeftSpectrum?.fallbackMessage === "string" && bottomLeftSpectrum.fallbackMessage.length > 0 ){
        const fallback = buildLowerSpectrumTraces( settings, selectedSpectrum, spectralAxisValues, xaxis, yaxis )
        return {
            ...fallback,
            message: fallback.usingSpectrum ? "" : bottomLeftSpectrum.fallbackMessage
        }
    }

    return buildLowerSpectrumTraces( settings, selectedSpectrum, spectralAxisValues, xaxis, yaxis )
}

function buildTopLeftTraces( settings, topLeftSpectrum, spectralAxisValues = [], fallbackTraces = [], fallbackLabel = "" ){

    const roiPayload = topLeftSpectrum?.roi ?? null
    const currentPayload = topLeftSpectrum?.current ?? null
    const hasCompositePayload = roiPayload !== null || currentPayload !== null

    if( hasCompositePayload ){
        const roiGroup = buildSpectrumTraceGroup(
            resolveRoiSpectrumStyle( settings ),
            roiPayload,
            spectralAxisValues,
            "x",
            "y"
        )
        const currentGroup = buildSpectrumTraceGroup(
            resolveQueriedSpectrumStyle( settings ),
            currentPayload,
            spectralAxisValues,
            "x",
            "y"
        )
        const usingSpectrum = roiGroup.usingSpectrum || currentGroup.usingSpectrum
        const axisValues = roiGroup.usingSpectrum
            ? roiGroup.axisValues
            : currentGroup.axisValues

        return {
            traces: [ ...roiGroup.traces, ...currentGroup.traces ],
            axisValues,
            label: resolveIntensityAxisTitle( settings ),
            message: usingSpectrum
                ? ""
                : ( typeof topLeftSpectrum?.fallbackMessage === "string" && topLeftSpectrum.fallbackMessage.length > 0
                    ? topLeftSpectrum.fallbackMessage
                    : TOP_LEFT_INSTRUCTION_TEXT )
        }
    }

    if( topLeftSpectrum?.showFallback === true && Array.isArray( fallbackTraces ) && fallbackTraces.length > 0 ){
        const referenceTrace = fallbackTraces.find(( trace ) => Array.isArray( trace?.x ) && trace.x.length > 0 ) ?? null
        const axisValues = Array.isArray( referenceTrace?.x ) && referenceTrace.x.length > 0
            ? referenceTrace.x
            : resolveSeriesXValues( spectralAxisValues, Array.isArray( spectralAxisValues ) && spectralAxisValues.length > 0 ? spectralAxisValues.length : 1 )

        return {
            traces: fallbackTraces,
            axisValues,
            label: fallbackLabel
        }
    }

    const referenceTrace = Array.isArray( fallbackTraces ) && fallbackTraces.length > 0
        ? ( fallbackTraces.find(( trace ) => Array.isArray( trace?.x ) && trace.x.length > 0 ) ?? fallbackTraces[0] )
        : null
    const primaryTrace = referenceTrace
    const axisValues = Array.isArray( primaryTrace?.x ) && primaryTrace.x.length > 0
        ? primaryTrace.x
        : resolveSeriesXValues( spectralAxisValues, Array.isArray( spectralAxisValues ) && spectralAxisValues.length > 0 ? spectralAxisValues.length : 1 )

    return {
        traces: [ buildPlaceholderTrace( axisValues, "x", "y" ) ],
        axisValues,
        label: fallbackLabel,
        message: typeof topLeftSpectrum?.fallbackMessage === "string" && topLeftSpectrum.fallbackMessage.length > 0
            ? topLeftSpectrum.fallbackMessage
            : TOP_LEFT_INSTRUCTION_TEXT
    }
}

function normalizeSpectrumSeries( spectrumPayload ){

    if( spectrumPayload === null || spectrumPayload === undefined ){
        return null
    }

    if( Array.isArray( spectrumPayload ) ){
        return normalizeSpectrumArray( spectrumPayload )
    }

    if( typeof spectrumPayload !== "object" ){
        return null
    }

    if( Array.isArray( spectrumPayload.x ) && Array.isArray( spectrumPayload.y ) ){
        return attachOptionalBounds(
            normalizeSpectrumXYArrays( spectrumPayload.x, spectrumPayload.y ),
            spectrumPayload.lowerBound,
            spectrumPayload.upperBound
        )
    }

    if( Array.isArray( spectrumPayload.spectrum ) ){
        return attachOptionalBounds(
            normalizeSpectrumArray( spectrumPayload.spectrum ),
            spectrumPayload.lowerBound,
            spectrumPayload.upperBound
        )
    }

    if( Array.isArray( spectrumPayload.values ) ){
        return attachOptionalBounds(
            normalizeSpectrumArray( spectrumPayload.values ),
            spectrumPayload.lowerBound,
            spectrumPayload.upperBound
        )
    }

    if( Array.isArray( spectrumPayload.intensity ) ){
        return attachOptionalBounds(
            normalizeSpectrumArray( spectrumPayload.intensity ),
            spectrumPayload.lowerBound,
            spectrumPayload.upperBound
        )
    }

    return null
}

function normalizeSpectrumXYArrays( xValues, yValues ){

    const length = Math.min( xValues.length, yValues.length )
    if( length <= 0 ) return null

    var x = []
    var y = []

    for( var index = 0; index < length; index++ ){

        const xValue = Number( xValues[index] )
        const yValue = Number( yValues[index] )

        x.push( Number.isFinite( xValue ) ? xValue : index )
        y.push( Number.isFinite( yValue ) ? yValue : null )
    }

    if( y.some(( value ) => value !== null ) === false ){
        return null
    }

    return {
        x,
        y,
        lowerBound: null,
        upperBound: null
    }
}

function normalizeSpectrumArray( values ){

    if( values.length === 0 ){
        return null
    }

    const firstValue = values[0]

    if( firstValue !== null &&
        typeof firstValue === "object" &&
        Array.isArray( firstValue ) === false ){

        return normalizeSpectrumEntries( values )
    }

    var x = []
    var y = []

    for( var index = 0; index < values.length; index++ ){
        const numeric = Number( values[index] )
        x.push( index )
        y.push( Number.isFinite( numeric ) ? numeric : null )
    }

    if( y.some(( value ) => value !== null ) === false ){
        return null
    }

    return {
        x,
        y,
        lowerBound: null,
        upperBound: null
    }
}

function normalizeSpectrumEntries( entries ){

    var x = []
    var y = []

    for( var index = 0; index < entries.length; index++ ){

        const entry = entries[index] ?? {}
        const xValue = Number( entry.x )
        const yValue = Number( entry.y ?? entry.value ?? entry.intensity )

        x.push( Number.isFinite( xValue ) ? xValue : index )
        y.push( Number.isFinite( yValue ) ? yValue : null )
    }

    if( y.some(( value ) => value !== null ) === false ){
        return null
    }

    return {
        x,
        y,
        lowerBound: null,
        upperBound: null
    }
}

function attachOptionalBounds( spectrumSeries, lowerBounds, upperBounds ){

    if( spectrumSeries === null ) return null

    const lowerBoundSeries = normalizeBoundSeries( lowerBounds, spectrumSeries.y.length )
    const upperBoundSeries = normalizeBoundSeries( upperBounds, spectrumSeries.y.length )

    if( lowerBoundSeries === null || upperBoundSeries === null ){
        return {
            ...spectrumSeries,
            lowerBound: null,
            upperBound: null
        }
    }

    return {
        ...spectrumSeries,
        lowerBound: lowerBoundSeries,
        upperBound: upperBoundSeries
    }
}

function normalizeBoundSeries( values, expectedLength ){

    if( Array.isArray( values ) === false || values.length !== expectedLength ){
        return null
    }

    var series = []

    for( const value of values ){

        if( value !== null && typeof value === "object" && Array.isArray( value ) === false ){
            const numericEntry = Number( value.y ?? value.value ?? value.intensity )
            series.push( Number.isFinite( numericEntry ) ? numericEntry : null )
            continue
        }

        const numeric = Number( value )
        series.push( Number.isFinite( numeric ) ? numeric : null )
    }

    if( series.some(( value ) => value !== null ) === false ){
        return null
    }

    return series
}

function buildLoadingTraces( loadingsPayload, options = {}, xaxis = "x", yaxis = "y" ){

    const components = normalizeLoadingsPayload( loadingsPayload )
    if( components.length === 0 ) return []

    const axes = normalizeAxisMetadata( options?.axes )

    const loadingSeries = normalizeLoadingSeries( options.loadingSeries )
    const selectedComponents = loadingSeries.length > 0
        ? loadingSeries
        : normalizeLoadingComponentIndices( options.loadingComponents )

    if( selectedComponents.length === 0 ) return []

    var traces = []

    for( const selected of selectedComponents ){

        const componentIndex = typeof selected === "object" ? selected.componentIndex : selected

        const vector = components[ componentIndex - 1 ]
        if( Array.isArray( vector ) === false || vector.length === 0 ) continue

        const x = resolveSeriesXValues( axes.zValues, vector.length )
        const color = resolveLoadingColor( componentIndex, options.loadingColors, selected.color )
        const traceLabel = typeof selected === "object" && typeof selected.label === "string" && selected.label.length > 0
            ? selected.label
            : "PC" + String( componentIndex ).padStart( 2, "0" )

        var trace = {}
        trace.type = "scatter"
        trace.mode = "lines"
        trace.x = x
        trace.y = vector
        trace.xaxis = xaxis
        trace.yaxis = yaxis
        trace.line = { color, width: 2 }
        trace.hovertemplate = traceLabel + ": (%{x}, %{y})<extra></extra>"

        traces.push( trace )
    }

    return traces
}

function normalizeLoadingsPayload( loadingsPayload ){

    const components = Array.isArray( loadingsPayload )
        ? loadingsPayload
        : loadingsPayload?.components

    if( Array.isArray( components ) === false ){
        return []
    }

    var normalizedComponents = []

    for( const vector of components ){
        if( Array.isArray( vector ) === false ){
            normalizedComponents.push( [] )
            continue
        }

        normalizedComponents.push( vector.map(( value ) => Number.isFinite( Number( value )) ? Number( value ) : null ))
    }

    return normalizedComponents
}

function normalizeLoadingComponentIndices( componentIndices ){

    if( Array.isArray( componentIndices ) === false ) return []

    var normalized = []
    var seen = new Set()

    for( const value of componentIndices ){
        const componentIndex = Number.parseInt( value, 10 )
        if( Number.isInteger( componentIndex ) === false ) continue
        if( componentIndex < 1 ) continue
        if( seen.has( componentIndex ) ) continue

        seen.add( componentIndex )
        normalized.push( componentIndex )
    }

    return normalized
}

function normalizeLoadingSeries( loadingSeries ){

    if( Array.isArray( loadingSeries ) === false ) return []

    var normalized = []

    for( const seriesEntry of loadingSeries ){
        const componentIndex = Number.parseInt( seriesEntry?.componentIndex, 10 )
        if( Number.isInteger( componentIndex ) === false ) continue
        if( componentIndex < 1 ) continue

        normalized.push({
            componentIndex,
            label: typeof seriesEntry?.label === "string" ? seriesEntry.label : "",
            color: typeof seriesEntry?.color === "string" ? seriesEntry.color : ""
        })
    }

    return normalized
}

function resolveLoadingColor( componentIndex, loadingColors, explicitColor = "" ){

    if( typeof explicitColor === "string" && explicitColor.length > 0 ){
        return explicitColor
    }

    if( loadingColors && typeof loadingColors === "object" ){
        const customColor = loadingColors[componentIndex]
        if( typeof customColor === "string" && customColor.length > 0 ){
            return customColor
        }
    }

    return rgbArrayToString( componentColor( componentIndex ))
}

function rgbArrayToString( rgb ){

    if( Array.isArray( rgb ) === false || rgb.length < 3 ) return "rgb(51, 51, 51)"

    const red = Math.max( 0, Math.min( 255, Number.parseInt( rgb[0], 10 ) || 0 ))
    const green = Math.max( 0, Math.min( 255, Number.parseInt( rgb[1], 10 ) || 0 ))
    const blue = Math.max( 0, Math.min( 255, Number.parseInt( rgb[2], 10 ) || 0 ))

    return "rgb(" + red + ", " + green + ", " + blue + ")"
}

function upperAxisLength( traces ){

    if( Array.isArray( traces ) === false || traces.length === 0 ) return 1

    var maximum = 1

    for( const trace of traces ){
        if( Array.isArray( trace?.x ) === false ) continue
        maximum = Math.max( maximum, trace.x.length )
    }

    return maximum
}

function buildHeatmapPlaceholderTrace( width, height, xaxis = "x3", yaxis = "y3" ){

    return {
        type: "scatter",
        mode: "lines",
        x: [ -0.5, width - 0.5 ],
        y: [ -0.5, height - 0.5 ],
        xaxis,
        yaxis,
        line: {
            color: "rgba(0, 0, 0, 0)",
            width: 1
        },
        hoverinfo: "skip",
        showlegend: false
    }
}

function buildScalarHeatmapTrace( matrix, colorscale, xaxis = "x3", yaxis = "y3" ){

    const height = matrix.length
    const width = matrix[0].length
    const x = Array.from({ length: width }, (_, index ) => index )
    const y = Array.from({ length: height }, (_, index ) => index )

    return {
        type: "heatmap",
        z: matrix,
        x,
        y,
        xaxis,
        yaxis,
        colorscale: resolveHeatmapColorscale( colorscale ),
        xgap: 0,
        ygap: 0,
        zsmooth: false,
        showscale: false,
        hovertemplate: "(%{x}, %{y})<br>Intensity: %{z}<extra></extra>"
    }
}

function buildImageHeatmapTrace( imagePayload, xaxis = "x3", yaxis = "y3" ){

    return {
        type: "image",
        source: imagePayload.source,
        x0: 0,
        y0: 0,
        dx: 1,
        dy: 1,
        xaxis,
        yaxis,
        hovertemplate: "(%{x:.0f}, %{y:.0f})<extra></extra>"
    }
}

function buildPanelMessageAnnotation( message ){

    if( typeof message !== "string" || message.length === 0 ){
        return []
    }

    return [ {
        xref: "paper",
        yref: "paper",
        x: 0.5,
        y: 0.5,
        text: message,
        showarrow: false,
        align: "center",
        font: {
            color: "#4b5563",
            size: 13
        }
    } ]
}

function buildStandaloneUpperPanelLayout( graphContainer, settings, topLeftPlot ){

    const tickFontSize = settings?.font?.sizes?.axis ?? 14
    const labelFontSize = settings?.font?.sizes?.label ?? 16
    const leftPlotsReversed = settings?.layout?.leftPlotsReversed === "true"
    const upperAxisTicks = valueLatexTicks( topLeftPlot.axisValues )
    const showSpectrum = typeof topLeftPlot.message !== "string" || topLeftPlot.message.length === 0

    var layout = {}
    layout.autosize = true
    layout.paper_bgcolor = "white"
    layout.plot_bgcolor = "white"
    layout.showlegend = false
    layout.margin = {
        t: 20,
        r: 32,
        b: 32,
        l: 56
    }
    layout.xaxis = {
        anchor: "y",
        tickfont: { size: tickFontSize },
        showgrid: false,
        zeroline: false,
        autorange: leftPlotsReversed ? "reversed" : true,
        tickmode: "array",
        tickvals: upperAxisTicks.tickvals,
        ticktext: upperAxisTicks.ticktext,
        showticklabels: showSpectrum
    }
    layout.yaxis = {
        anchor: "x",
        tickfont: { size: tickFontSize },
        showgrid: false,
        zeroline: false,
        title: {
            text: showSpectrum ? ( topLeftPlot.label ?? "" ) : "",
            font: { size: labelFontSize }
        },
        showticklabels: showSpectrum
    }

    const annotations = buildPanelMessageAnnotation( topLeftPlot.message )
    if( annotations.length > 0 ){
        layout.annotations = annotations
    }

    return layout
}

function buildStandaloneLowerPanelLayout( graphContainer, settings, lowerPlot, axes ){

    const tickFontSize = settings?.font?.sizes?.axis ?? 14
    const labelFontSize = settings?.font?.sizes?.label ?? 16
    const leftPlotsReversed = settings?.layout?.leftPlotsReversed === "true"
    const spectralLabel = sanitizeLatexLabel( settings?.labels?.spectral, "\\nu" )
    const showUnits = settings?.labels?.showUnits !== false && settings?.labels?.showUnits !== "false"
    const spectralTitle = formatAxisTitle( spectralLabel, axes.zUnit, showUnits )
    const intensityTitle = resolveIntensityAxisTitle( settings )
    const lowerAxisTicks = valueLatexTicks( lowerPlot.axisValues )
    const showSpectrum = typeof lowerPlot.message !== "string" || lowerPlot.message.length === 0

    var layout = {}
    layout.autosize = true
    layout.paper_bgcolor = "white"
    layout.plot_bgcolor = "white"
    layout.showlegend = false
    layout.margin = {
        t: 20,
        r: 32,
        b: 52,
        l: 56
    }
    layout.xaxis = {
        anchor: "y",
        tickfont: { size: tickFontSize },
        showgrid: false,
        zeroline: false,
        autorange: leftPlotsReversed ? "reversed" : true,
        tickmode: "array",
        tickvals: lowerAxisTicks.tickvals,
        ticktext: lowerAxisTicks.ticktext,
        showticklabels: showSpectrum,
        title: {
            text: showSpectrum ? spectralTitle : "",
            font: { size: labelFontSize }
        }
    }
    layout.yaxis = {
        anchor: "x",
        tickfont: { size: tickFontSize },
        showgrid: false,
        zeroline: false,
        title: {
            text: showSpectrum ? intensityTitle : "",
            font: { size: labelFontSize }
        },
        showticklabels: showSpectrum
    }

    const annotations = buildPanelMessageAnnotation( lowerPlot.message )
    if( annotations.length > 0 ){
        layout.annotations = annotations
    }

    return layout
}

function buildHeatmapPaneLayout( width, height, graphContainer, settings, options = {} ){

    const tickFontSize = settings?.font?.sizes?.axis ?? 14
    const labelFontSize = settings?.font?.sizes?.label ?? 16
    const showUnits = settings?.labels?.showUnits !== false && settings?.labels?.showUnits !== "false"
    const heatmapOrigin = settings?.layout?.heatmapOrigin === "bottom-left" ? "bottom-left" : "top-left"
    const axes = normalizeAxisMetadata( options?.axes )
    const xTicks = indexedLatexTicks( width, options.heatmapXValues )
    const yTicks = indexedLatexTicks( height, options.heatmapYValues )
    const horizontalTitle = formatAxisTitle( sanitizeLatexLabel( settings?.labels?.horizontal, "x" ), axes.xUnit, showUnits )
    const verticalTitle = formatAxisTitle( sanitizeLatexLabel( settings?.labels?.vertical, "y" ), axes.yUnit, showUnits )
    const heatmapViewport = resolveHeatmapViewport( graphContainer,
                                                    width,
                                                    height,
                                                    heatmapOrigin,
                                                    STANDALONE_HEATMAP_AXIS_CONFIG )

    var layout = {}
    layout.autosize = true
    layout.paper_bgcolor = "white"
    layout.plot_bgcolor = "white"
    layout.showlegend = false
    layout.margin = {
        t: 8,
        r: 8,
        b: 8,
        l: 8
    }
    layout.xaxis = {
        domain: [ 0, 1 ],
        anchor: "y",
        showgrid: false,
        zeroline: false,
        tickfont: { size: tickFontSize },
        automargin: true,
        ticks: "outside",
        ticklen: 2,
        ticklabelposition: "outside",
        constrain: "domain",
        constraintoward: "center",
        autorange: false,
        range: heatmapViewport.xRange,
        tickmode: "array",
        tickvals: xTicks.tickvals,
        ticktext: xTicks.ticktext,
        title: {
            text: horizontalTitle,
            font: { size: labelFontSize },
            standoff: 2
        }
    }
    layout.yaxis = {
        domain: [ 0, 1 ],
        anchor: "x",
        showgrid: false,
        zeroline: false,
        tickfont: { size: tickFontSize },
        automargin: true,
        ticks: "outside",
        ticklen: 2,
        ticklabelposition: "outside",
        constrain: "domain",
        constraintoward: "middle",
        scaleanchor: "x",
        scaleratio: 1,
        range: heatmapViewport.yRange,
        tickmode: "array",
        tickvals: yTicks.tickvals,
        ticktext: yTicks.ticktext,
        title: {
            text: verticalTitle,
            font: { size: labelFontSize },
            standoff: 12
        }
    }

    return layout
}

function buildUpperPanelFigure( graphContainer, settings, options = {} ){

    const axes = normalizeAxisMetadata( options?.axes )
    const defaultUpperAxisValues = resolveSeriesXValues(
        axes.zValues,
        Array.isArray( axes.zValues ) && axes.zValues.length > 0 ? axes.zValues.length : 1
    )
    const loadingTraces = buildLoadingTraces( options.loadings, options, "x", "y" )
    const fallbackTraces = loadingTraces.length > 0
        ? loadingTraces
        : [ buildPlaceholderTrace( defaultUpperAxisValues, "x", "y" ) ]
    const fallbackLabel = loadingTraces.length > 0 ? "$$\\Large p_{k}$$" : ""
    const topLeftPlot = buildTopLeftTraces( settings,
                                            options.topLeftSpectrum,
                                            axes.zValues,
                                            fallbackTraces,
                                            fallbackLabel )

    return {
        traces: topLeftPlot.traces,
        layout: buildStandaloneUpperPanelLayout( graphContainer, settings, topLeftPlot ),
        spectrumGridAxisKeys: STANDALONE_SPECTRUM_GRID_AXIS_KEYS,
        spectrumGridAvailability: buildSpectrumGridAvailabilityMap(
            STANDALONE_SPECTRUM_GRID_AXIS_KEYS,
            typeof topLeftPlot.message !== "string" || topLeftPlot.message.length === 0
        ),
        spectrumGridDefaultVisible: resolveDefaultHyperspectrumGridlinesForSource(
            settings,
            options?.topSpectrumGridlineSource,
            options?.projectSpectrumGridlines
        )
    }
}

function buildLowerPanelFigure( graphContainer, settings, options = {} ){

    const axes = normalizeAxisMetadata( options?.axes )
    const lowerPlot = buildBottomLeftTraces( settings,
                                             options.bottomLeftSpectrum,
                                             options.selectedSpectrum,
                                             axes.zValues,
                                             "x",
                                             "y" )

    return {
        traces: lowerPlot.traces,
        layout: buildStandaloneLowerPanelLayout( graphContainer, settings, lowerPlot, axes ),
        spectrumGridAxisKeys: STANDALONE_SPECTRUM_GRID_AXIS_KEYS,
        spectrumGridAvailability: buildSpectrumGridAvailabilityMap(
            STANDALONE_SPECTRUM_GRID_AXIS_KEYS,
            typeof lowerPlot.message !== "string" || lowerPlot.message.length === 0
        ),
        spectrumGridDefaultVisible: resolveDefaultHyperspectrumGridlinesForSource(
            settings,
            options?.bottomSpectrumGridlineSource,
            options?.projectSpectrumGridlines
        )
    }
}

function buildHeatmapPaneFigure( width, height, graphContainer, settings, options = {} ){

    const axes = normalizeAxisMetadata( options?.axes )

    return {
        traces: [ buildHeatmapPlaceholderTrace( width, height, "x", "y" ) ],
        layout: buildHeatmapPaneLayout( width,
                                        height,
                                        graphContainer,
                                        settings,
                                        {
                                            axes,
                                            heatmapXValues: axes.xValues,
                                            heatmapYValues: axes.yValues
                                        } ),
        externalHeatmap: true,
        heatmapPanelOnly: true
    }
}

function buildFigure( matrix, graphContainer, settings, options = {} ){

    const height = matrix.length
    const width = matrix[0].length
    if( options?.panelMode === "heatmap-only" ){
        return buildHeatmapPaneFigure( width, height, graphContainer, settings, options )
    }
    const axes = normalizeAxisMetadata( options?.axes )

    const defaultUpperAxisValues = resolveSeriesXValues( axes.zValues,
                                                         Array.isArray( axes.zValues ) && axes.zValues.length > 0 ? axes.zValues.length : 1 )
    const topLeftPlot = buildTopLeftTraces(
        settings,
        options.topLeftSpectrum,
        axes.zValues,
        [ buildPlaceholderTrace( defaultUpperAxisValues, "x", "y" ) ],
        ""
    )
    const lowerPlot = buildBottomLeftTraces( settings,
                                             options.bottomLeftSpectrum,
                                             options.selectedSpectrum,
                                             axes.zValues )
    const useExternalRenderer = shouldUseExternalHeatmapRenderer( options )
    const heatmapTrace = useExternalRenderer
        ? buildHeatmapPlaceholderTrace( width, height )
        : buildScalarHeatmapTrace( matrix, options.colorscale )

    const layout = buildBaseLayout( width,
                                    height,
                                    graphContainer,
                                    settings,
                                    topLeftPlot.label,
                                    resolveIntensityAxisTitle( settings ),
                                    {
                                        axes,
                                        upperAxisValues: topLeftPlot.axisValues,
                                        lowerAxisValues: lowerPlot.axisValues,
                                        upperPanelMessage: topLeftPlot.message,
                                        lowerPanelMessage: lowerPlot.message,
                                        heatmapXValues: axes.xValues,
                                        heatmapYValues: axes.yValues,
                                        roiOverlays: useExternalRenderer ? [] : options.roiOverlays
                                    } )

    return {
        traces: [ ...topLeftPlot.traces, ...lowerPlot.traces, heatmapTrace ],
        layout,
        externalHeatmap: useExternalRenderer,
        spectrumGridAxisKeys: COMBINED_SPECTRUM_GRID_AXIS_KEYS,
        spectrumGridAvailability: {
            ...buildSpectrumGridAvailabilityMap(
                [ "xaxis", "yaxis" ],
                typeof topLeftPlot.message !== "string" || topLeftPlot.message.length === 0
            ),
            ...buildSpectrumGridAvailabilityMap(
                [ "xaxis2", "yaxis2" ],
                typeof lowerPlot.message !== "string" || lowerPlot.message.length === 0
            )
        },
        spectrumGridDefaultVisible: {
            ...buildSpectrumGridDefaultVisibilityMap(
                [ "xaxis", "yaxis" ],
                resolveDefaultHyperspectrumGridlinesForSource( settings, options?.topSpectrumGridlineSource, options?.projectSpectrumGridlines )
            ),
            ...buildSpectrumGridDefaultVisibilityMap(
                [ "xaxis2", "yaxis2" ],
                resolveDefaultHyperspectrumGridlinesForSource( settings, options?.bottomSpectrumGridlineSource, options?.projectSpectrumGridlines )
            )
        }
    }
}

function buildRgbFigure( rgbComposite, graphContainer, settings, options = {} ){

    const width = rgbComposite.width
    const height = rgbComposite.height
    if( options?.panelMode === "heatmap-only" ){
        return buildHeatmapPaneFigure( width, height, graphContainer, settings, options )
    }
    const axes = normalizeAxisMetadata( options?.axes )

    const defaultUpperAxisValues = resolveSeriesXValues( axes.zValues,
                                                         Array.isArray( axes.zValues ) && axes.zValues.length > 0 ? axes.zValues.length : 1 )
    const topLeftPlot = buildTopLeftTraces(
        settings,
        options.topLeftSpectrum,
        axes.zValues,
        [ buildPlaceholderTrace( defaultUpperAxisValues, "x", "y" ) ],
        ""
    )
    const lowerPlot = buildBottomLeftTraces( settings,
                                             options.bottomLeftSpectrum,
                                             options.selectedSpectrum,
                                             axes.zValues )
    const useExternalRenderer = shouldUseExternalHeatmapRenderer( options )
    const rgbTrace = useExternalRenderer
        ? buildHeatmapPlaceholderTrace( width, height )
        : buildImageHeatmapTrace( rgbComposite )

    const layout = buildBaseLayout( width,
                                    height,
                                    graphContainer,
                                    settings,
                                    topLeftPlot.label,
                                    resolveIntensityAxisTitle( settings ),
                                    {
                                        axes,
                                        upperAxisValues: topLeftPlot.axisValues,
                                        lowerAxisValues: lowerPlot.axisValues,
                                        upperPanelMessage: topLeftPlot.message,
                                        lowerPanelMessage: lowerPlot.message,
                                        heatmapXValues: axes.xValues,
                                        heatmapYValues: axes.yValues,
                                        roiOverlays: useExternalRenderer ? [] : options.roiOverlays
                                    } )

    return {
        traces: [ ...topLeftPlot.traces, ...lowerPlot.traces, rgbTrace ],
        layout,
        externalHeatmap: useExternalRenderer,
        spectrumGridAxisKeys: COMBINED_SPECTRUM_GRID_AXIS_KEYS,
        spectrumGridAvailability: {
            ...buildSpectrumGridAvailabilityMap(
                [ "xaxis", "yaxis" ],
                typeof topLeftPlot.message !== "string" || topLeftPlot.message.length === 0
            ),
            ...buildSpectrumGridAvailabilityMap(
                [ "xaxis2", "yaxis2" ],
                typeof lowerPlot.message !== "string" || lowerPlot.message.length === 0
            )
        },
        spectrumGridDefaultVisible: {
            ...buildSpectrumGridDefaultVisibilityMap(
                [ "xaxis", "yaxis" ],
                resolveDefaultHyperspectrumGridlinesForSource( settings, options?.topSpectrumGridlineSource, options?.projectSpectrumGridlines )
            ),
            ...buildSpectrumGridDefaultVisibilityMap(
                [ "xaxis2", "yaxis2" ],
                resolveDefaultHyperspectrumGridlinesForSource( settings, options?.bottomSpectrumGridlineSource, options?.projectSpectrumGridlines )
            )
        }
    }
}

function buildPcaFigure( classification, graphContainer, settings, options = {} ){

    const width = classification.width
    const height = classification.height
    if( options?.panelMode === "heatmap-only" ){
        return buildHeatmapPaneFigure( width, height, graphContainer, settings, options )
    }
    const axes = normalizeAxisMetadata( options?.axes )

    const x = Array.from({ length: width }, (_, index ) => index )
    const y = Array.from({ length: height }, (_, index ) => index )

    const loadingTraces = buildLoadingTraces( options.loadings, options, "x", "y" )

    const topLeftPlot = buildTopLeftTraces(
        settings,
        options.topLeftSpectrum,
        axes.zValues,
        loadingTraces,
        "$$\\Large p_{k}$$"
    )

    const lowerPlot = buildBottomLeftTraces( settings,
                                             options.bottomLeftSpectrum,
                                             options.selectedSpectrum,
                                             axes.zValues )
    const useExternalRenderer = shouldUseExternalHeatmapRenderer( options )
    const classificationTrace = useExternalRenderer
        ? buildHeatmapPlaceholderTrace( width, height )
        : buildImageHeatmapTrace( classification )

    const layout = buildBaseLayout( width,
                                    height,
                                    graphContainer,
                                    settings,
                                    topLeftPlot.label,
                                    resolveIntensityAxisTitle( settings ),
                                    {
                                        axes,
                                        upperAxisValues: topLeftPlot.axisValues,
                                        lowerAxisValues: lowerPlot.axisValues,
                                        upperPanelMessage: topLeftPlot.message,
                                        lowerPanelMessage: lowerPlot.message,
                                        heatmapXValues: axes.xValues,
                                        heatmapYValues: axes.yValues,
                                        roiOverlays: useExternalRenderer ? [] : options.roiOverlays
                                    } )

    return {
        traces: [ ...topLeftPlot.traces, ...lowerPlot.traces, classificationTrace ],
        layout,
        externalHeatmap: useExternalRenderer,
        spectrumGridAxisKeys: COMBINED_SPECTRUM_GRID_AXIS_KEYS,
        spectrumGridAvailability: {
            ...buildSpectrumGridAvailabilityMap(
                [ "xaxis", "yaxis" ],
                typeof topLeftPlot.message !== "string" || topLeftPlot.message.length === 0
            ),
            ...buildSpectrumGridAvailabilityMap(
                [ "xaxis2", "yaxis2" ],
                typeof lowerPlot.message !== "string" || lowerPlot.message.length === 0
            )
        },
        spectrumGridDefaultVisible: {
            ...buildSpectrumGridDefaultVisibilityMap(
                [ "xaxis", "yaxis" ],
                resolveDefaultHyperspectrumGridlinesForSource( settings, options?.topSpectrumGridlineSource, options?.projectSpectrumGridlines )
            ),
            ...buildSpectrumGridDefaultVisibilityMap(
                [ "xaxis2", "yaxis2" ],
                resolveDefaultHyperspectrumGridlinesForSource( settings, options?.bottomSpectrumGridlineSource, options?.projectSpectrumGridlines )
            )
        }
    }
}

function buildPcaMipFigure( rgbComposite, graphContainer, settings, options = {} ){

    const width = rgbComposite.width
    const height = rgbComposite.height
    if( options?.panelMode === "heatmap-only" ){
        return buildHeatmapPaneFigure( width, height, graphContainer, settings, options )
    }
    const axes = normalizeAxisMetadata( options?.axes )

    const loadingTraces = buildLoadingTraces( options.loadings, options, "x", "y" )

    const topLeftPlot = buildTopLeftTraces(
        settings,
        options.topLeftSpectrum,
        axes.zValues,
        loadingTraces,
        "$$\\Large p_{k}$$"
    )

    const lowerPlot = buildBottomLeftTraces( settings,
                                             options.bottomLeftSpectrum,
                                             options.selectedSpectrum,
                                             axes.zValues )
    const useExternalRenderer = shouldUseExternalHeatmapRenderer( options )
    const rgbTrace = useExternalRenderer
        ? buildHeatmapPlaceholderTrace( width, height )
        : buildImageHeatmapTrace( rgbComposite )

    const layout = buildBaseLayout( width,
                                    height,
                                    graphContainer,
                                    settings,
                                    topLeftPlot.label,
                                    resolveIntensityAxisTitle( settings ),
                                    {
                                        axes,
                                        upperAxisValues: topLeftPlot.axisValues,
                                        lowerAxisValues: lowerPlot.axisValues,
                                        upperPanelMessage: topLeftPlot.message,
                                        lowerPanelMessage: lowerPlot.message,
                                        heatmapXValues: axes.xValues,
                                        heatmapYValues: axes.yValues,
                                        roiOverlays: useExternalRenderer ? [] : options.roiOverlays
                                    } )

    return {
        traces: [ ...topLeftPlot.traces, ...lowerPlot.traces, rgbTrace ],
        layout,
        externalHeatmap: useExternalRenderer,
        spectrumGridAxisKeys: COMBINED_SPECTRUM_GRID_AXIS_KEYS,
        spectrumGridAvailability: {
            ...buildSpectrumGridAvailabilityMap(
                [ "xaxis", "yaxis" ],
                typeof topLeftPlot.message !== "string" || topLeftPlot.message.length === 0
            ),
            ...buildSpectrumGridAvailabilityMap(
                [ "xaxis2", "yaxis2" ],
                typeof lowerPlot.message !== "string" || lowerPlot.message.length === 0
            )
        },
        spectrumGridDefaultVisible: {
            ...buildSpectrumGridDefaultVisibilityMap(
                [ "xaxis", "yaxis" ],
                resolveDefaultHyperspectrumGridlinesForSource( settings, options?.topSpectrumGridlineSource, options?.projectSpectrumGridlines )
            ),
            ...buildSpectrumGridDefaultVisibilityMap(
                [ "xaxis2", "yaxis2" ],
                resolveDefaultHyperspectrumGridlinesForSource( settings, options?.bottomSpectrumGridlineSource, options?.projectSpectrumGridlines )
            )
        }
    }
}

function buildPcaRgbFigure( rgbComposite, graphContainer, settings, options = {} ){

    const width = rgbComposite.width
    const height = rgbComposite.height
    if( options?.panelMode === "heatmap-only" ){
        return buildHeatmapPaneFigure( width, height, graphContainer, settings, options )
    }
    const axes = normalizeAxisMetadata( options?.axes )

    const loadingTraces = buildLoadingTraces( options.loadings, options, "x", "y" )

    const topLeftPlot = buildTopLeftTraces(
        settings,
        options.topLeftSpectrum,
        axes.zValues,
        loadingTraces,
        "$$\\Large p_{k}$$"
    )

    const lowerPlot = buildBottomLeftTraces( settings,
                                             options.bottomLeftSpectrum,
                                             options.selectedSpectrum,
                                             axes.zValues )
    const useExternalRenderer = shouldUseExternalHeatmapRenderer( options )
    const rgbTrace = useExternalRenderer
        ? buildHeatmapPlaceholderTrace( width, height )
        : buildImageHeatmapTrace( rgbComposite )

    const layout = buildBaseLayout( width,
                                    height,
                                    graphContainer,
                                    settings,
                                    topLeftPlot.label,
                                    resolveIntensityAxisTitle( settings ),
                                    {
                                        axes,
                                        upperAxisValues: topLeftPlot.axisValues,
                                        lowerAxisValues: lowerPlot.axisValues,
                                        upperPanelMessage: topLeftPlot.message,
                                        lowerPanelMessage: lowerPlot.message,
                                        heatmapXValues: axes.xValues,
                                        heatmapYValues: axes.yValues,
                                        roiOverlays: useExternalRenderer ? [] : options.roiOverlays
                                    } )

    return {
        traces: [ ...topLeftPlot.traces, ...lowerPlot.traces, rgbTrace ],
        layout,
        externalHeatmap: useExternalRenderer,
        spectrumGridAxisKeys: COMBINED_SPECTRUM_GRID_AXIS_KEYS,
        spectrumGridAvailability: {
            ...buildSpectrumGridAvailabilityMap(
                [ "xaxis", "yaxis" ],
                typeof topLeftPlot.message !== "string" || topLeftPlot.message.length === 0
            ),
            ...buildSpectrumGridAvailabilityMap(
                [ "xaxis2", "yaxis2" ],
                typeof lowerPlot.message !== "string" || lowerPlot.message.length === 0
            )
        },
        spectrumGridDefaultVisible: {
            ...buildSpectrumGridDefaultVisibilityMap(
                [ "xaxis", "yaxis" ],
                resolveDefaultHyperspectrumGridlinesForSource( settings, options?.topSpectrumGridlineSource, options?.projectSpectrumGridlines )
            ),
            ...buildSpectrumGridDefaultVisibilityMap(
                [ "xaxis2", "yaxis2" ],
                resolveDefaultHyperspectrumGridlinesForSource( settings, options?.bottomSpectrumGridlineSource, options?.projectSpectrumGridlines )
            )
        }
    }
}

function buildBaseLayout( width, height, graphContainer, settings, upperLeftLabel, lowerLeftLabel, options = {} ){

    const tickFontSize = settings?.font?.sizes?.axis ?? 14
    const labelFontSize = settings?.font?.sizes?.label ?? 16
    const showUnits = settings?.labels?.showUnits !== false && settings?.labels?.showUnits !== "false"
    const leftPlotsReversed = settings?.layout?.leftPlotsReversed === "true"
    const heatmapOrigin = settings?.layout?.heatmapOrigin === "bottom-left" ? "bottom-left" : "top-left"

    const horizontalLabel = sanitizeLatexLabel( settings?.labels?.horizontal, "x" )
    const verticalLabel = sanitizeLatexLabel( settings?.labels?.vertical, "y" )
    const axes = normalizeAxisMetadata( options?.axes )
    const spectralLabel = sanitizeLatexLabel( settings?.labels?.spectral, "\\nu" )

    const domains = squareDomains( graphContainer )
    const upperAxisLengthValue = Number.isInteger( Number( options.upperAxisLength ))
        ? Math.max( 1, Number( options.upperAxisLength ))
        : width

    const lowerAxisLengthValue = Number.isInteger( Number( options.lowerAxisLength ))
        ? Math.max( 1, Number( options.lowerAxisLength ))
        : height

    const upperAxisTicks = Array.isArray( options.upperAxisValues ) && options.upperAxisValues.length > 0
        ? valueLatexTicks( options.upperAxisValues )
        : latexTicks( upperAxisLengthValue )
    const lowerAxisTicks = Array.isArray( options.lowerAxisValues ) && options.lowerAxisValues.length > 0
        ? valueLatexTicks( options.lowerAxisValues )
        : latexTicks( lowerAxisLengthValue )
    const xTicks = indexedLatexTicks( width, options.heatmapXValues )
    const yTicks = indexedLatexTicks( height, options.heatmapYValues )
    const horizontalTitle = formatAxisTitle( horizontalLabel, axes.xUnit, showUnits )
    const verticalTitle = formatAxisTitle( verticalLabel, axes.yUnit, showUnits )
    const spectralTitle = formatAxisTitle( spectralLabel, axes.zUnit, showUnits )
    const heatmapViewport = resolveHeatmapViewport( graphContainer, width, height, heatmapOrigin )

    var layout = {}
    layout.autosize = true
    layout.paper_bgcolor = "white"
    layout.plot_bgcolor = "white"
    layout.showlegend = false

    layout.margin = {}
    layout.margin.t = 20
    layout.margin.r = 20 + 2 * labelFontSize
    layout.margin.b = 50 + 2 * labelFontSize
    layout.margin.l = 50 + 2 * labelFontSize

    layout.xaxis = {}
    layout.xaxis.domain = [ 0, domains.leftEnd ]
    layout.xaxis.anchor = "y"
    layout.xaxis.tickfont = { size: tickFontSize }
    layout.xaxis.showgrid = false
    layout.xaxis.zeroline = false
    layout.xaxis.autorange = leftPlotsReversed ? "reversed" : true
    layout.xaxis.tickmode = "array"
    layout.xaxis.tickvals = upperAxisTicks.tickvals
    layout.xaxis.ticktext = upperAxisTicks.ticktext
    layout.xaxis.showticklabels = typeof options.upperPanelMessage === "string" && options.upperPanelMessage.length > 0 ? false : true

    layout.yaxis = {}
    layout.yaxis.domain = [ 0.56, 1 ]
    layout.yaxis.anchor = "x"
    layout.yaxis.tickfont = { size: tickFontSize }
    layout.yaxis.showgrid = false
    layout.yaxis.zeroline = false
    layout.yaxis.title = {}
    layout.yaxis.title.text = typeof options.upperPanelMessage === "string" && options.upperPanelMessage.length > 0 ? "" : upperLeftLabel
    layout.yaxis.title.font = { size: labelFontSize }
    layout.yaxis.showticklabels = typeof options.upperPanelMessage === "string" && options.upperPanelMessage.length > 0 ? false : true

    layout.xaxis2 = {}
    layout.xaxis2.domain = [ 0, domains.leftEnd ]
    layout.xaxis2.anchor = "y2"
    layout.xaxis2.tickfont = { size: tickFontSize }
    layout.xaxis2.showgrid = false
    layout.xaxis2.zeroline = false
    layout.xaxis2.autorange = leftPlotsReversed ? "reversed" : true
    layout.xaxis2.tickmode = "array"
    layout.xaxis2.tickvals = lowerAxisTicks.tickvals
    layout.xaxis2.ticktext = lowerAxisTicks.ticktext
    layout.xaxis2.showticklabels = typeof options.lowerPanelMessage === "string" && options.lowerPanelMessage.length > 0 ? false : true
    layout.xaxis2.title = {}
    layout.xaxis2.title.text = typeof options.lowerPanelMessage === "string" && options.lowerPanelMessage.length > 0
        ? ""
        : ( typeof options.lowerAxisTitle === "string" && options.lowerAxisTitle.length > 0
        ? options.lowerAxisTitle
        : spectralTitle )
    layout.xaxis2.title.font = { size: labelFontSize }

    layout.yaxis2 = {}
    layout.yaxis2.domain = [ 0, 0.44 ]
    layout.yaxis2.anchor = "x2"
    layout.yaxis2.tickfont = { size: tickFontSize }
    layout.yaxis2.showgrid = false
    layout.yaxis2.zeroline = false
    layout.yaxis2.title = {}
    layout.yaxis2.title.text = typeof options.lowerPanelMessage === "string" && options.lowerPanelMessage.length > 0 ? "" : lowerLeftLabel
    layout.yaxis2.title.font = { size: labelFontSize }
    layout.yaxis2.showticklabels = typeof options.lowerPanelMessage === "string" && options.lowerPanelMessage.length > 0 ? false : true

    layout.xaxis3 = {}
    layout.xaxis3.domain = [ domains.heatmapStart, 1 ]
    layout.xaxis3.anchor = "y3"
    layout.xaxis3.showgrid = false
    layout.xaxis3.zeroline = false
    layout.xaxis3.tickfont = { size: tickFontSize }
    layout.xaxis3.constrain = "domain"
    layout.xaxis3.range = heatmapViewport.xRange
    layout.xaxis3.tickmode = "array"
    layout.xaxis3.tickvals = xTicks.tickvals
    layout.xaxis3.ticktext = xTicks.ticktext
    layout.xaxis3.title = {}
    layout.xaxis3.title.text = horizontalTitle
    layout.xaxis3.title.font = { size: labelFontSize }

    layout.yaxis3 = {}
    layout.yaxis3.domain = [ 0, 1 ]
    layout.yaxis3.anchor = "x3"
    layout.yaxis3.showgrid = false
    layout.yaxis3.zeroline = false
    layout.yaxis3.tickfont = { size: tickFontSize }
    layout.yaxis3.constrain = "domain"
    layout.yaxis3.scaleanchor = false
    layout.yaxis3.range = heatmapViewport.yRange
    layout.yaxis3.autorange = false
    layout.yaxis3.tickmode = "array"
    layout.yaxis3.tickvals = yTicks.tickvals
    layout.yaxis3.ticktext = yTicks.ticktext
    layout.yaxis3.title = {}
    layout.yaxis3.title.text = verticalTitle
    layout.yaxis3.title.font = { size: labelFontSize }

    var annotations = buildSidePanelInstructionAnnotations(
        layout,
        options?.upperPanelMessage,
        options?.lowerPanelMessage
    )

    const roiOverlays = normalizeRoiOverlays( options?.roiOverlays ?? options?.roiOverlay )
    if( roiOverlays.length > 0 ){
        layout.shapes = roiOverlays.map(( roiOverlay ) => {
            return {
                type: "rect",
                xref: "x3",
                yref: "y3",
                x0: roiOverlay.x0,
                x1: roiOverlay.x1,
                y0: roiOverlay.y0,
                y1: roiOverlay.y1,
                line: {
                    color: roiOverlay.boxColor,
                    width: 2
                },
                fillcolor: colorWithAlpha( roiOverlay.boxColor, roiOverlay.opacity * 0.25 ),
                layer: "above"
            }
        })

        for( const roiOverlay of roiOverlays ){
            if( roiOverlay.showTitle !== true ) continue

            const annotationY = heatmapOrigin === "top-left"
                ? Math.min( roiOverlay.y0, roiOverlay.y1 )
                : Math.max( roiOverlay.y0, roiOverlay.y1 )

            annotations.push({
                xref: "x3",
                yref: "y3",
                x: ( roiOverlay.x0 + roiOverlay.x1 ) / 2,
                y: annotationY,
                yanchor: "bottom",
                yshift: 8,
                text: roiOverlay.name,
                showarrow: false,
                font: {
                    color: roiOverlay.titleColor,
                    size: Math.max( 10, tickFontSize - 1 )
                },
                bgcolor: colorWithAlpha( roiOverlay.titleColor, roiOverlay.opacity ),
                bordercolor: roiOverlay.titleColor,
                borderpad: 4
            })
        }
    }

    if( annotations.length > 0 ){
        layout.annotations = annotations
    }

    return layout
}

function resolveHeatmapViewport( graphContainer,
                                 width,
                                 height,
                                 heatmapOrigin,
                                 axisConfig = FULL_HEATMAP_AXIS_CONFIG ){

    const minimumX = -0.5
    const maximumX = width - 0.5
    const minimumY = -0.5
    const maximumY = height - 0.5

    const defaultYRange = heatmapOrigin === "top-left"
        ? [ maximumY, minimumY ]
        : [ minimumY, maximumY ]

    const defaultViewport = {
        xRange: [ minimumX, maximumX ],
        yRange: defaultYRange,
        preserved: false
    }

    const existingXRange = sanitizeAxisRange( graphContainer?.layout?.[ axisConfig.xaxisKey ]?.range )
    const existingYRange = sanitizeAxisRange( graphContainer?.layout?.[ axisConfig.yaxisKey ]?.range )

    if( existingXRange === null || existingYRange === null ){
        return defaultViewport
    }

    return {
        xRange: clampAxisRange( existingXRange, minimumX, maximumX ),
        yRange: clampAxisRange( existingYRange, minimumY, maximumY ),
        preserved: true
    }
}

function sanitizeAxisRange( range ){

    if( Array.isArray( range ) === false || range.length < 2 ){
        return null
    }

    const start = Number( range[0] )
    const end = Number( range[1] )

    if( Number.isFinite( start ) === false || Number.isFinite( end ) === false ){
        return null
    }

    return [ start, end ]
}

function normalizeViewportRange( range ){

    const sanitizedRange = sanitizeAxisRange( range )
    if( sanitizedRange === null ){
        return null
    }

    return [
        Math.min( Number( sanitizedRange[0] ), Number( sanitizedRange[1] )),
        Math.max( Number( sanitizedRange[0] ), Number( sanitizedRange[1] ))
    ]
}

function clampAxisRange( range, minimum, maximum ){

    const start = Math.max( minimum, Math.min( maximum, Number( range[0] )))
    const end = Math.max( minimum, Math.min( maximum, Number( range[1] )))

    if( Number.isFinite( start ) === false || Number.isFinite( end ) === false ){
        return [ minimum, maximum ]
    }

    return [ start, end ]
}

function resolveExternalRendererYRange( graphContainer, axisYRange ){

    const sanitizedAxisYRange = sanitizeAxisRange( axisYRange )
    if( sanitizedAxisYRange === null ){
        return null
    }

    const heatmapOrigin = resolveStoredHeatmapOrigin(
        graphContainer,
        sanitizedAxisYRange[0] > sanitizedAxisYRange[1] ? "top-left" : "bottom-left"
    )

    if( heatmapOrigin !== "top-left" ){
        return sanitizedAxisYRange
    }

    const payloadHeight = Number( graphContainer?.__harkanaHeatmapRendererPayload?.height )
    if( Number.isFinite( payloadHeight ) === false || payloadHeight <= 0 ){
        return sanitizedAxisYRange
    }

    const mirroredRange = sanitizedAxisYRange.map(( value ) => {
        return ( payloadHeight - 1 ) - Number( value )
    })

    return sanitizeAxisRange( mirroredRange ) ?? sanitizedAxisYRange
}

function getHeatmapPaneState( graphContainer ){

    if( !graphContainer ) return null

    const axisConfig = resolveHeatmapAxisConfig( graphContainer )
    const fullLayout = graphContainer._fullLayout ?? graphContainer.layout
    const xaxis = fullLayout?.[ axisConfig.xaxisKey ] ?? graphContainer?.layout?.[ axisConfig.xaxisKey ]
    const yaxis = fullLayout?.[ axisConfig.yaxisKey ] ?? graphContainer?.layout?.[ axisConfig.yaxisKey ]
    const pixelWindow = resolveHeatmapPixelWindow( graphContainer, fullLayout, xaxis, yaxis )
    const xRange = sanitizeAxisRange( xaxis?.range ?? graphContainer?.layout?.[ axisConfig.xaxisKey ]?.range )
    const yRange = sanitizeAxisRange( yaxis?.range ?? graphContainer?.layout?.[ axisConfig.yaxisKey ]?.range )

    if( pixelWindow === null || xRange === null || yRange === null ){
        return null
    }

    return {
        pixelBounds: {
            left: pixelWindow.xOffset,
            top: pixelWindow.yOffset,
            width: pixelWindow.xLength,
            height: pixelWindow.yLength
        },
        xRange,
        yRange,
        renderYRange: resolveExternalRendererYRange( graphContainer, yRange ),
        heatmapOrigin: resolveStoredHeatmapOrigin(
            graphContainer,
            yRange[0] > yRange[1] ? "top-left" : "bottom-left"
        )
    }
}

function getHeatmapRendererPayload( graphContainer ){

    if( !graphContainer ) return null
    return graphContainer.__harkanaHeatmapRendererPayload ?? null
}

async function relayoutHeatmapViewport( graphContainer, xRange, yRange ){

    if( !graphContainer ) return

    const axisConfig = resolveHeatmapAxisConfig( graphContainer )
    const nextXRange = normalizeViewportRange( xRange )
    const nextYRange = normalizeViewportRange( yRange )
    const currentYRange = sanitizeAxisRange(
        graphContainer?._fullLayout?.[ axisConfig.yaxisKey ]?.range ??
        graphContainer?.layout?.[ axisConfig.yaxisKey ]?.range
    )
    const heatmapOrigin = resolveStoredHeatmapOrigin(
        graphContainer,
        currentYRange !== null && Number( currentYRange[0] ) > Number( currentYRange[1] ) ? "top-left" : "bottom-left"
    )

    if( nextXRange === null || nextYRange === null ){
        return
    }

    const resolvedYRange = heatmapOrigin === "top-left"
        ? [ nextYRange[1], nextYRange[0] ]
        : [ nextYRange[0], nextYRange[1] ]

    await Plotly.relayout( graphContainer, {
        [ `${axisConfig.xaxisKey}.autorange` ]: false,
        [ `${axisConfig.yaxisKey}.autorange` ]: false,
        [ `${axisConfig.xaxisKey}.range` ]: nextXRange,
        [ `${axisConfig.yaxisKey}.range` ]: resolvedYRange
    } )
}

async function resetHeatmapViewport( graphContainer, width, height, heatmapOrigin = "top-left" ){

    if( !graphContainer ) return

    const numericWidth = Number( width )
    const numericHeight = Number( height )
    if( Number.isFinite( numericWidth ) === false || Number.isFinite( numericHeight ) === false ){
        return
    }

    const minimumX = -0.5
    const maximumX = numericWidth - 0.5
    const minimumY = -0.5
    const maximumY = numericHeight - 0.5
    const normalizedHeatmapOrigin = resolveStoredHeatmapOrigin( graphContainer, heatmapOrigin )
    const yRange = normalizedHeatmapOrigin === "top-left"
        ? [ maximumY, minimumY ]
        : [ minimumY, maximumY ]

    await relayoutHeatmapViewport(
        graphContainer,
        [ minimumX, maximumX ],
        yRange
    )
}

function buildSidePanelInstructionAnnotations( layout, upperMessage = "", lowerMessage = "" ){

    var annotations = []
    const xDomain = Array.isArray( layout?.xaxis?.domain ) ? layout.xaxis.domain : [ 0, 0.4 ]
    const upperYDomain = Array.isArray( layout?.yaxis?.domain ) ? layout.yaxis.domain : [ 0.56, 1 ]
    const lowerYDomain = Array.isArray( layout?.yaxis2?.domain ) ? layout.yaxis2.domain : [ 0, 0.44 ]
    const centerX = ( Number( xDomain[0] ) + Number( xDomain[1] )) / 2

    if( typeof upperMessage === "string" && upperMessage.length > 0 ){
        annotations.push( sidePanelInstructionAnnotation(
            centerX,
            ( Number( upperYDomain[0] ) + Number( upperYDomain[1] )) / 2,
            upperMessage
        ))
    }

    if( typeof lowerMessage === "string" && lowerMessage.length > 0 ){
        annotations.push( sidePanelInstructionAnnotation(
            centerX,
            ( Number( lowerYDomain[0] ) + Number( lowerYDomain[1] )) / 2,
            lowerMessage
        ))
    }

    return annotations
}

function sidePanelInstructionAnnotation( x, y, text ){

    return {
        xref: "paper",
        yref: "paper",
        x,
        y,
        xanchor: "center",
        yanchor: "middle",
        align: "center",
        text,
        showarrow: false,
        font: {
            color: "#334155",
            size: 13
        },
        bgcolor: "rgba(241, 245, 249, 0.92)",
        bordercolor: "rgba(148, 163, 184, 0.9)",
        borderpad: 8
    }
}

function normalizeRoiOverlay( roiOverlay ){

    if( roiOverlay === null || typeof roiOverlay !== "object" ){
        return null
    }

    const x0 = Number( roiOverlay.x0 )
    const x1 = Number( roiOverlay.x1 )
    const y0 = Number( roiOverlay.y0 )
    const y1 = Number( roiOverlay.y1 )

    if( Number.isFinite( x0 ) === false ||
        Number.isFinite( x1 ) === false ||
        Number.isFinite( y0 ) === false ||
        Number.isFinite( y1 ) === false ){
        return null
    }

    return {
        name: typeof roiOverlay.name === "string" && roiOverlay.name.length > 0 ? roiOverlay.name : "ROI",
        showTitle: roiOverlay.showTitle !== false,
        x0,
        x1,
        y0,
        y1,
        boxColor: resolveColorString(
            roiOverlay.boxColor ?? roiOverlay.color,
            "#ffffff"
        ),
        titleColor: resolveColorString(
            roiOverlay.titleColor ?? roiOverlay.color,
            "#ffffff"
        ),
        opacity: Number.isFinite( Number( roiOverlay.opacity ))
            ? Math.max( 0, Math.min( 1, Number( roiOverlay.opacity )))
            : 0.25
    }
}

function normalizeRoiOverlays( roiOverlays ){

    if( Array.isArray( roiOverlays ) ){
        return roiOverlays
            .map(( roiOverlay ) => normalizeRoiOverlay( roiOverlay ))
            .filter(( roiOverlay ) => roiOverlay !== null )
    }

    const singleOverlay = normalizeRoiOverlay( roiOverlays )
    return singleOverlay === null ? [] : [ singleOverlay ]
}

function normalizeAxisMetadata( axes ){

    const metadata = axes !== null && typeof axes === "object" ? axes : {}

    return {
        xValues: normalizeAxisArray( metadata.x ),
        yValues: normalizeAxisArray( metadata.y ),
        zValues: normalizeAxisArray( metadata.z ),
        xUnit: typeof metadata.xUnit === "string" ? metadata.xUnit : "",
        yUnit: typeof metadata.yUnit === "string" ? metadata.yUnit : "",
        zUnit: typeof metadata.zUnit === "string" ? metadata.zUnit : ""
    }
}

function normalizeAxisArray( values ){

    if( Array.isArray( values ) === false ){
        return []
    }

    return values.map(( value, index ) => {

        const numeric = Number( value )
        if( Number.isFinite( numeric ) ){
            return numeric
        }

        return index
    })
}

function resolveSeriesXValues( preferredValues, expectedLength, fallbackValues = [] ){

    const normalizedLength = Math.max( 1, Number.parseInt( expectedLength, 10 ) || 1 )
    const preferred = normalizeAxisArray( preferredValues )

    if( preferred.length === normalizedLength ){
        return preferred
    }

    if( Array.isArray( fallbackValues ) && fallbackValues.length === normalizedLength ){
        return fallbackValues.map(( value, index ) => {

            const numeric = Number( value )
            if( Number.isFinite( numeric ) ){
                return numeric
            }

            return index
        })
    }

    return Array.from({ length: normalizedLength }, (_, index ) => index )
}

function indexedLatexTicks( length, axisValues = [], maxTicks = 6 ){

    if( Array.isArray( axisValues ) === false || axisValues.length !== length ){
        return latexTicks( length, maxTicks )
    }

    const indices = tickIndices( length, maxTicks )

    return {
        tickvals: indices,
        ticktext: indices.map(( index ) => "$$" + formatLatexNumber( axisValues[index] ) + "$$")
    }
}

function valueLatexTicks( axisValues = [], maxTicks = 6 ){

    if( Array.isArray( axisValues ) === false || axisValues.length === 0 ){
        return latexTicks( 1, maxTicks )
    }

    const indices = tickIndices( axisValues.length, maxTicks )

    return {
        tickvals: indices.map(( index ) => axisValues[index] ),
        ticktext: indices.map(( index ) => "$$" + formatLatexNumber( axisValues[index] ) + "$$")
    }
}

function tickIndices( length, maxTicks = 6 ){

    if( length <= 1 ){
        return [ 0 ]
    }

    const step = Math.max( 1, Math.ceil(( length - 1 ) / ( maxTicks - 1 )))
    var indices = []

    for( var index = 0; index < length; index += step ){
        indices.push( index )
    }

    if( indices[indices.length - 1] !== ( length - 1 )){
        indices.push( length - 1 )
    }

    return indices
}

function formatLatexNumber( value ){

    const numeric = Number( value )
    if( Number.isFinite( numeric ) === false ){
        return "0"
    }

    const absolute = Math.abs( numeric )
    const useExponential = absolute >= 10_000 || ( absolute > 0 && absolute < 0.01 )
    const formatted = useExponential
        ? numeric.toExponential( 3 )
        : numeric.toFixed( 3 )

    const compact = formatted
        .replace(/(\.\d*?[1-9])0+$/, "$1" )
        .replace(/\.0+$/, "" )
        .replace(/e\+?/, "e" )

    const exponentialMatch = compact.match(/^(-?\d+(?:\.\d+)?)e(-?\d+)$/)
    if( exponentialMatch !== null ){
        return exponentialMatch[1] + "\\times 10^{" + exponentialMatch[2] + "}"
    }

    return compact
}

function formatAxisTitle( label, unit, showUnits = true ){
    return "$$\\Large " + label + ( showUnits ? formatAxisUnitSuffix( unit ) : "" ) + "$$"
}

function resolveIntensityAxisTitle( settings ){
    return formatAxisTitle( sanitizeLatexLabel( settings?.labels?.intensity, "I" ), "", false )
}

function resolveHeatmapColorscale( colorscale ){

    if( typeof colorscale === "string" && SUPPORTED_HEATMAP_COLOR_SCALES.has( colorscale ) ){
        return colorscale
    }

    return "Viridis"
}

function resolveExternalHeatmapColorscale( colorscale ){

    const scaleName = resolveHeatmapColorscale( colorscale )
    return EXTERNAL_HEATMAP_COLOR_SCALES[scaleName] ?? EXTERNAL_HEATMAP_COLOR_SCALES.Viridis
}

function matrixFiniteRange( matrix ){

    var minimum = Infinity
    var maximum = -Infinity

    for( const row of matrix ){
        for( const value of row ){
            const numeric = Number( value )
            if( Number.isFinite( numeric ) === false ) continue
            if( numeric < minimum ) minimum = numeric
            if( numeric > maximum ) maximum = numeric
        }
    }

    if( minimum === Infinity || maximum === -Infinity ){
        return { minimum: 0, maximum: 1 }
    }

    if( maximum <= minimum ){
        return { minimum, maximum: minimum + 1 }
    }

    return { minimum, maximum }
}

function interpolateColorStop( lower, upper, fraction ){

    const lowerColor = parseColorValue( lower?.[1] ) ?? [ 0, 0, 0 ]
    const upperColor = parseColorValue( upper?.[1] ) ?? lowerColor
    const amount = clampUnit( fraction )

    return [
        Math.round( lowerColor[0] + amount * ( upperColor[0] - lowerColor[0] )),
        Math.round( lowerColor[1] + amount * ( upperColor[1] - lowerColor[1] )),
        Math.round( lowerColor[2] + amount * ( upperColor[2] - lowerColor[2] ))
    ]
}

function colorFromScale( scale, normalizedValue ){

    const stops = Array.isArray( scale ) && scale.length > 0 ? scale : EXTERNAL_HEATMAP_COLOR_SCALES.Viridis
    const clampedValue = clampUnit( normalizedValue )

    for( var index = 1; index < stops.length; index++ ){

        const lower = stops[index - 1]
        const upper = stops[index]
        const lowerOffset = Number( lower?.[0] )
        const upperOffset = Number( upper?.[0] )

        if( Number.isFinite( lowerOffset ) === false || Number.isFinite( upperOffset ) === false ){
            continue
        }

        if( clampedValue <= upperOffset || index === stops.length - 1 ){
            const denominator = upperOffset - lowerOffset
            const fraction = denominator > 0 ? ( clampedValue - lowerOffset ) / denominator : 0
            return interpolateColorStop( lower, upper, fraction )
        }
    }

    return parseColorValue( stops[stops.length - 1]?.[1] ) ?? [ 253, 231, 37 ]
}

function buildScalarColorMapTextureSource( colorscale ){

    const resolvedColorscale = resolveHeatmapColorscale( colorscale )
    const cachedTextureSource = scalarColorMapTextureSources.get( resolvedColorscale ) ?? null
    if( cachedTextureSource !== null ){
        return cachedTextureSource
    }

    const scale = resolveExternalHeatmapColorscale( resolvedColorscale )
    const textureData = new Uint8Array( SCALAR_COLOR_MAP_TEXTURE_SIZE * 4 )

    for( var index = 0; index < SCALAR_COLOR_MAP_TEXTURE_SIZE; index++ ){

        const normalizedValue = SCALAR_COLOR_MAP_TEXTURE_SIZE <= 1
            ? 0
            : index / ( SCALAR_COLOR_MAP_TEXTURE_SIZE - 1 )
        const color = colorFromScale( scale, normalizedValue )
        const offset = index * 4

        textureData[offset] = color[0]
        textureData[offset + 1] = color[1]
        textureData[offset + 2] = color[2]
        textureData[offset + 3] = 255
    }

    const textureSource = {
        width: SCALAR_COLOR_MAP_TEXTURE_SIZE,
        height: 1,
        format: "rgba8unorm",
        data: textureData
    }

    scalarColorMapTextureSources.set( resolvedColorscale, textureSource )
    return textureSource
}

function buildScalarIntensityTextureSource( matrix ){

    const normalizedMatrix = normalizeMip( matrix )
    const cachedTextureSource = scalarIntensityTextureSources.get( normalizedMatrix ) ?? null
    if( cachedTextureSource !== null ){
        return cachedTextureSource
    }

    const height = normalizedMatrix.length
    const width = normalizedMatrix[0].length
    const valueRange = matrixFiniteRange( normalizedMatrix )
    const textureData = new Uint8Array( width * height * 2 )
    let offset = 0

    for( let row = 0; row < height; row++ ){
        for( let col = 0; col < width; col++ ){

            const value = Number( normalizedMatrix[row][col] )
            if( Number.isFinite( value ) === false ){
                textureData[offset++] = 0
                textureData[offset++] = 0
                continue
            }

            const normalizedValue = clampUnit(( value - valueRange.minimum ) / ( valueRange.maximum - valueRange.minimum ))
            textureData[offset++] = Math.max( 0, Math.min( 255, Math.round( normalizedValue * 255 )))
            textureData[offset++] = 255
        }
    }

    const textureSource = {
        width,
        height,
        format: "rg8unorm",
        data: textureData
    }

    scalarIntensityTextureSources.set( normalizedMatrix, textureSource )
    return textureSource
}

function buildCanvasImagePayload( canvas, width, height, extra = {}, options = {} ){

    const payload = {
        kind: "bitmap",
        canvas,
        width,
        height,
        ...extra
    }

    if( options.includeSource !== false ){
        payload.source = canvas.toDataURL( "image/png" )
    }

    return payload
}

function buildCanvasFromRgbaPayload( rgbaPayload ){

    const width = Math.max( 1, Number.parseInt( rgbaPayload?.width, 10 ) || 1 )
    const height = Math.max( 1, Number.parseInt( rgbaPayload?.height, 10 ) || 1 )
    const rgba = rgbaPayload?.rgba instanceof Uint8ClampedArray
        ? rgbaPayload.rgba
        : new Uint8ClampedArray( rgbaPayload?.rgba ?? [] )

    if( typeof document === "undefined" ){
        throw new Error( "Bitmap payload materialization requires a browser environment." )
    }

    const canvas = document.createElement( "canvas" )
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext( "2d" )
    if( context === null ){
        throw new Error( "Unable to create canvas context for bitmap payload materialization." )
    }

    const imageData = context.createImageData( width, height )
    imageData.data.set( rgba )
    context.putImageData( imageData, 0, 0 )

	return { canvas, width, height }
}

async function buildBitmapPayloadFromRgbaPayloadAsync( rgbaPayload, extra = {}, options = {} ){

	const width = Math.max( 1, Number.parseInt( rgbaPayload?.width, 10 ) || 1 )
	const height = Math.max( 1, Number.parseInt( rgbaPayload?.height, 10 ) || 1 )
	const rgba = rgbaPayload?.rgba instanceof Uint8ClampedArray
		? rgbaPayload.rgba
		: new Uint8ClampedArray( rgbaPayload?.rgba ?? [] )

	if( typeof createImageBitmap === "function" && typeof ImageData !== "undefined" ){
		try{
			const imageData = new ImageData( rgba, width, height )
			const image = await createImageBitmap( imageData )
			return {
				kind: "bitmap",
				image,
				width,
				height,
				...extra
			}
		} catch( error ){
			console.log( error )
		}
	}

	const { canvas } = buildCanvasFromRgbaPayload({ width, height, rgba })
	return buildCanvasImagePayload( canvas, width, height, extra, options )
}

function dimensionStubMatrix( width, height ){

    const normalizedWidth = Math.max( 1, Number.parseInt( width, 10 ) || 1 )
    const normalizedHeight = Math.max( 1, Number.parseInt( height, 10 ) || 1 )
    const rows = new Array( normalizedHeight )
    rows[0] = { length: normalizedWidth }

    return rows
}

function buildScalarHeatmapPayload( matrix, colorscale ){

    const normalizedMatrix = normalizeMip( matrix )
    const height = normalizedMatrix.length
    const width = normalizedMatrix[0].length

    return {
        kind: "scalar-texture",
        width,
        height,
        textureSource: buildScalarIntensityTextureSource( normalizedMatrix ),
        colorMapTexture: buildScalarColorMapTextureSource( colorscale )
    }
}

function formatAxisUnitSuffix( unit ){

    const normalized = String( unit ?? "" ).trim()
    if( normalized.length === 0 ){
        return ""
    }

    const canonical = normalized.toLowerCase()
    var latexUnit = ""

    if([ "micrometer", "micrometers", "micrometre", "micrometres", "micron", "microns", "um", "µm", "μm" ].includes( canonical )){
        latexUnit = "\\mathrm{\\mu m}"
    } else if([ "nanometer", "nanometers", "nanometre", "nanometres", "nm" ].includes( canonical )){
        latexUnit = "nm"
    } else if([ "millimeter", "millimeters", "millimetre", "millimetres", "mm" ].includes( canonical )){
        latexUnit = "mm"
    } else if([ "centimeter", "centimeters", "centimetre", "centimetres", "cm" ].includes( canonical )){
        latexUnit = "cm"
    } else if([ "meter", "meters", "metre", "metres", "m" ].includes( canonical )){
        latexUnit = "m"
    } else if([ "cm^-1", "cm-1", "cm^{-1}", "cm⁻¹", "1/cm" ].includes( canonical )){
        latexUnit = "\\mathrm{cm}^{-1}"
    } else if([ "index", "indices" ].includes( canonical )){
        latexUnit = "\\mathrm{index}"
    } else if([ "pixel", "pixels" ].includes( canonical )){
        latexUnit = "\\mathrm{pixel}"
    } else if([ "a.u.", "au", "arb", "arbitrary unit", "arbitrary units" ].includes( canonical )){
        latexUnit = "\\mathrm{a.u.}"
    } else {
        latexUnit = sanitizeLatexLabel( normalized, normalized ).replace(/\s+/g, "\\ " )
    }

    return "\\;[" + latexUnit + "]"
}

function normalizeMip( mip ){

    if( mip !== null &&
        typeof mip === "object" &&
        normalizedMipCache.has( mip ) ){
        return normalizedMipCache.get( mip )
    }

    if( Array.isArray( mip ) === false || mip.length === 0 ){
        throw new Error( "MIP must be a non-empty 2D array." )
    }

    const width = Array.isArray( mip[0] ) ? mip[0].length : 0
    if( width === 0 ) throw new Error( "MIP must be a non-empty 2D array." )

    var matrix = []
    for( const row of mip ){

        if( Array.isArray( row ) === false || row.length !== width ){
            throw new Error( "MIP must be a rectangular 2D array." )
        }

        matrix.push( row.map(( value ) => Number.isFinite( Number( value )) ? Number( value ) : null ))
    }

    if( mip !== null && typeof mip === "object" ){
        normalizedMipCache.set( mip, matrix )
    }

    return matrix
}

function normalizeRgbMip( mipRgb ){

    if( Array.isArray( mipRgb ) === false || mipRgb.length === 0 ){
        throw new Error( "RGB MIP must be a non-empty 3D array." )
    }

    const width = Array.isArray( mipRgb[0] ) ? mipRgb[0].length : 0
    if( width === 0 ){
        throw new Error( "RGB MIP must be a non-empty 3D array." )
    }

    var matrix = []
    var maxChannelValue = 0

    for( const row of mipRgb ){

        if( Array.isArray( row ) === false || row.length !== width ){
            throw new Error( "RGB MIP must be a rectangular 3D array." )
        }

        var normalizedRow = []
        for( const pixel of row ){

            if( Array.isArray( pixel ) === false || pixel.length < 3 ){
                throw new Error( "RGB MIP pixels must contain at least three channels." )
            }

            const red = Number( pixel[0] )
            const green = Number( pixel[1] )
            const blue = Number( pixel[2] )

            const normalizedPixel = [
                Number.isFinite( red ) ? red : 0,
                Number.isFinite( green ) ? green : 0,
                Number.isFinite( blue ) ? blue : 0
            ]

            maxChannelValue = Math.max( maxChannelValue,
                                        normalizedPixel[0],
                                        normalizedPixel[1],
                                        normalizedPixel[2] )

            normalizedRow.push( normalizedPixel )
        }

        matrix.push( normalizedRow )
    }

    const scaleToByte = maxChannelValue <= 1 ? 255 : 1

    return matrix.map(( row ) => {
        return row.map(( pixel ) => {
            return pixel.map(( value ) => {
                return Math.max( 0, Math.min( 255, Math.round( value * scaleToByte )))
            })
        })
    })
}

function normalizeUmapChannels( umapChannels ){

    if( umapChannels === null || typeof umapChannels !== "object" ){
        throw new Error( "UMAP channels must be an object with r, g, and b matrices." )
    }

    const redMatrix = normalizeMip( umapChannels.r )
    const greenMatrix = normalizeMip( umapChannels.g )
    const blueMatrix = normalizeMip( umapChannels.b )

    const width = redMatrix[0].length
    const height = redMatrix.length

    if( greenMatrix.length !== height || blueMatrix.length !== height ){
        throw new Error( "All UMAP channel matrices must have the same dimensions." )
    }

    if( greenMatrix[0].length !== width || blueMatrix[0].length !== width ){
        throw new Error( "All UMAP channel matrices must have the same dimensions." )
    }

    return {
        r: redMatrix,
        g: greenMatrix,
        b: blueMatrix
    }
}

function normalizePcaMip( pcaMip ){

    if( Array.isArray( pcaMip ) === false || pcaMip.length === 0 ){
        throw new Error( "PCA MIP must be a non-empty 2D array." )
    }

    const width = Array.isArray( pcaMip[0] ) ? pcaMip[0].length : 0
    if( width === 0 ){
        throw new Error( "PCA MIP must be a non-empty 2D array." )
    }

    var matrix = []

    for( const row of pcaMip ){

        if( Array.isArray( row ) === false || row.length !== width ){
            throw new Error( "PCA MIP must be a rectangular 2D array." )
        }

        matrix.push( row.map(( value ) => {
            const numeric = Number( value )
            if( Number.isFinite( numeric ) === false ) return null

            const componentIndex = Math.floor( numeric )
            if( Number.isInteger( componentIndex ) === false ) return null
            if( componentIndex < 0 || componentIndex > 9 ) return null

            const brightness = clampUnit( numeric - componentIndex )

            return {
                componentIndex: componentIndex + 1,
                brightness
            }
        }) )
    }

    return matrix
}

function normalizePcaScores( scoresByComponent ){

    if( scoresByComponent !== null &&
        typeof scoresByComponent === "object" &&
        normalizedPcaScoresCache.has( scoresByComponent ) ){
        return normalizedPcaScoresCache.get( scoresByComponent )
    }

    var entries = []

    if( Array.isArray( scoresByComponent ) ){
        entries = scoresByComponent.map(( matrix, index ) => {
            return { componentIndex: index + 1, matrix: normalizeMip( matrix ) }
        })
    } else if( scoresByComponent !== null && typeof scoresByComponent === "object" ){
        entries = Object.entries( scoresByComponent ).map(([ key, matrix ]) => {
            return { componentIndex: parsePcaComponentKey( key ), matrix: normalizeMip( matrix ) }
        })
    } else {
        throw new Error( "PCA scores must be an object or array of 2D arrays." )
    }

    entries = entries.filter(( entry ) => Number.isInteger( entry.componentIndex ))

    if( entries.length === 0 ){
        throw new Error( "At least one PCA score matrix is required." )
    }

    entries.sort(( left, right ) => left.componentIndex - right.componentIndex )

    const referenceWidth = entries[0].matrix[0].length
    const referenceHeight = entries[0].matrix.length

    for( const entry of entries ){
        if( entry.matrix.length !== referenceHeight || entry.matrix[0].length !== referenceWidth ){
            throw new Error( "All PCA score matrices must have the same dimensions." )
        }
    }

    if( scoresByComponent !== null && typeof scoresByComponent === "object" ){
        normalizedPcaScoresCache.set( scoresByComponent, entries )
    }

    return entries
}

function resolveZBlendPalette( palette ){

    const source = Array.isArray( palette ) && palette.length > 0
        ? palette
        : DEFAULT_Z_BLEND_PALETTE_COLOR_STRINGS

    const resolvedPalette = source
        .map(( color ) => parseColorValue( color ))
        .filter(( color ) => color !== null )

    if( resolvedPalette.length > 0 ){
        return resolvedPalette
    }

    return DEFAULT_Z_BLEND_PALETTE_COLOR_STRINGS
        .map(( color ) => parseColorValue( color ))
        .filter(( color ) => color !== null )
}

function normalizeZBlendSource( zBlendSource ){

    if( zBlendSource === null || typeof zBlendSource !== "object" ){
        throw new Error( "Z-blend source must be an object." )
    }

    const channels = Array.isArray( zBlendSource.channels ) ? zBlendSource.channels : []
    if( channels.length === 0 ){
        throw new Error( "Z-blend source must include at least one channel." )
    }

    const palette = resolveZBlendPalette( zBlendSource.palette )
    var normalizedChannels = []

    for( let index = 0; index < channels.length; index++ ){
        const channel = channels[index] ?? {}
        const matrix = normalizeMip( channel.matrix )
        const color = parseColorValue( channel.color ) ?? palette[index % palette.length]
        const intensityMaximum = resolveZBlendIntensityMaximum( channel.intensityMaximum, matrix )
        const clampMin = clampZBlendWindowValue( channel.clampMin, 0, intensityMaximum )
        const clampMax = clampZBlendWindowValue( channel.clampMax, intensityMaximum, intensityMaximum )

        normalizedChannels.push({
            enabled: channel.enabled !== false,
            requestedZ: Number.isFinite( Number( channel.requestedZ )) ? Number( channel.requestedZ ) : index,
            resolvedLayerIndex: Number.isInteger( Number( channel.resolvedLayerIndex ) )
                ? Number( channel.resolvedLayerIndex )
                : index,
            resolvedZ: Number.isFinite( Number( channel.resolvedZ ))
                ? Number( channel.resolvedZ )
                : index,
            clampMin: Math.min( clampMin, clampMax ),
            clampMax: Math.max( clampMin, clampMax ),
            intensityMaximum,
            color,
            matrix
        })
    }

    const width = normalizedChannels[0].matrix[0].length
    const height = normalizedChannels[0].matrix.length

    for( const channel of normalizedChannels ){
        if( channel.matrix.length !== height || channel.matrix[0].length !== width ){
            throw new Error( "All z-blend channel matrices must have the same dimensions." )
        }
    }

    return {
        kind: "z-blend-source",
        palette,
        channels: normalizedChannels,
        width,
        height
    }
}

function zBlendPayloadSignature( zBlendSource ){

    const normalizedSource = normalizeZBlendSource( zBlendSource )

    return normalizedSource.channels.map(( channel ) => {
        return [
            "req=" + channel.requestedZ,
            "layer=" + channel.resolvedLayerIndex,
            "z=" + channel.resolvedZ,
            "enabled=" + ( channel.enabled === false ? "0" : "1" ),
            "max=" + channel.intensityMaximum.toFixed( 6 ),
            "clamp=" + channel.clampMin.toFixed( 4 ) + ":" + channel.clampMax.toFixed( 4 ),
            "color=" + channel.color.join( "," ),
            "matrix=" + heatmapPayloadObjectKey( channel.matrix )
        ].join( "," )
    }).join( "|" )
}

function parsePcaComponentKey( key ){

    if( typeof key === "number" && Number.isInteger( key ) ) return key
    if( typeof key !== "string" ) return null

    const numeric = Number.parseInt( key, 10 )
    if( Number.isInteger( numeric ) ) return numeric

    const match = key.match(/^pc(\d+)$/i)
    if( match === null ) return null

    const parsed = Number.parseInt( match[1], 10 )
    if( Number.isInteger( parsed ) === false ) return null

    return parsed
}

function buildRgbMipImage( rgbMatrix, options = {} ){

    const height = rgbMatrix.length
    const width = rgbMatrix[0].length

    if( typeof document === "undefined" ){
        throw new Error( "RGB MIP rendering requires a browser environment." )
    }

    const canvas = document.createElement( "canvas" )
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext( "2d" )
    if( context === null ){
        throw new Error( "Unable to create canvas context for RGB MIP rendering." )
    }

    const imageData = context.createImageData( width, height )
    const includePixelMetrics = options?.includePixelMetrics === true
    var intensityMatrix = includePixelMetrics
        ? Array.from({ length: height }, () => Array( width ).fill( 0 ))
        : null

    var offset = 0
    for( var row = 0; row < height; row++ ){
        for( var col = 0; col < width; col++ ){

            const pixel = rgbMatrix[row][col]
            const red = Number( pixel[0] ) || 0
            const green = Number( pixel[1] ) || 0
            const blue = Number( pixel[2] ) || 0

            imageData.data[offset++] = Math.max( 0, Math.min( 255, Math.round( red )))
            imageData.data[offset++] = Math.max( 0, Math.min( 255, Math.round( green )))
            imageData.data[offset++] = Math.max( 0, Math.min( 255, Math.round( blue )))
            imageData.data[offset++] = 255

            if( includePixelMetrics ){
                intensityMatrix[row][col] = ( red + green + blue ) / ( 3 * 255 )
            }
        }
    }

    context.putImageData( imageData, 0, 0 )

    const extraPayload = includePixelMetrics ? { intensityMatrix } : {}
    return buildCanvasImagePayload( canvas, width, height, extraPayload, options )
}

function buildUmapImage( umapChannels, options = {} ){

    const redMatrix = umapChannels.r
    const greenMatrix = umapChannels.g
    const blueMatrix = umapChannels.b

    const height = redMatrix.length
    const width = redMatrix[0].length

    if( typeof document === "undefined" ){
        throw new Error( "UMAP rendering requires a browser environment." )
    }

    const channelColors = resolveUmapChannelColors( options.channelColors )

    const canvas = document.createElement( "canvas" )
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext( "2d" )
    if( context === null ){
        throw new Error( "Unable to create canvas context for UMAP rendering." )
    }

    const imageData = context.createImageData( width, height )
    const includePixelMetrics = options?.includePixelMetrics === true
    var intensityMatrix = includePixelMetrics
        ? Array.from({ length: height }, () => Array( width ).fill( 0 ))
        : null

    var offset = 0
    for( var row = 0; row < height; row++ ){
        for( var col = 0; col < width; col++ ){

            const redWeight = clampUnit( redMatrix[row][col] )
            const greenWeight = clampUnit( greenMatrix[row][col] )
            const blueWeight = clampUnit( blueMatrix[row][col] )

            const redValue = Math.max( 0,
                                       Math.min( 255,
                                                 Math.round(
                                                     ( redWeight * channelColors.r[0] ) +
                                                     ( greenWeight * channelColors.g[0] ) +
                                                     ( blueWeight * channelColors.b[0] )
                                                 ) ) )
            const greenValue = Math.max( 0,
                                         Math.min( 255,
                                                   Math.round(
                                                       ( redWeight * channelColors.r[1] ) +
                                                       ( greenWeight * channelColors.g[1] ) +
                                                       ( blueWeight * channelColors.b[1] )
                                                   ) ) )
            const blueValue = Math.max( 0,
                                        Math.min( 255,
                                                  Math.round(
                                                      ( redWeight * channelColors.r[2] ) +
                                                      ( greenWeight * channelColors.g[2] ) +
                                                      ( blueWeight * channelColors.b[2] )
                                                  ) ) )

            imageData.data[offset++] = redValue
            imageData.data[offset++] = greenValue
            imageData.data[offset++] = blueValue
            imageData.data[offset++] = 255

            if( includePixelMetrics ){
                intensityMatrix[row][col] = ( redWeight + greenWeight + blueWeight ) / 3
            }
        }
    }

    context.putImageData( imageData, 0, 0 )

    const extraPayload = includePixelMetrics ? { intensityMatrix } : {}
    return buildCanvasImagePayload( canvas, width, height, extraPayload, options )
}

function buildPcaMipImage( pcaMipMatrix, options = {} ){

    const height = pcaMipMatrix.length
    const width = pcaMipMatrix[0].length
    const useEncodedBrightness = options.useEncodedBrightness !== false

    if( typeof document === "undefined" ){
        throw new Error( "PCA MIP rendering requires a browser environment." )
    }

    const canvas = document.createElement( "canvas" )
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext( "2d" )
    if( context === null ){
        throw new Error( "Unable to create canvas context for PCA MIP rendering." )
    }

    const imageData = context.createImageData( width, height )
    const includePixelMetrics = options?.includePixelMetrics === true
    var intensityMatrix = includePixelMetrics
        ? Array.from({ length: height }, () => Array( width ).fill( 0 ))
        : null

    var offset = 0
    for( var row = 0; row < height; row++ ){
        for( var col = 0; col < width; col++ ){

            const encodedPixel = pcaMipMatrix[row][col]
            const baseColor = encodedPixel === null ? [ 0, 0, 0 ] : componentColor( encodedPixel.componentIndex )
            const brightness = encodedPixel === null
                ? 0
                : ( useEncodedBrightness ? clampUnit( encodedPixel.brightness ) : 1 )

            imageData.data[offset++] = Math.max( 0, Math.min( 255, Math.round( baseColor[0] * brightness )))
            imageData.data[offset++] = Math.max( 0, Math.min( 255, Math.round( baseColor[1] * brightness )))
            imageData.data[offset++] = Math.max( 0, Math.min( 255, Math.round( baseColor[2] * brightness )))
            imageData.data[offset++] = 255

            if( includePixelMetrics ){
                intensityMatrix[row][col] = brightness
            }
        }
    }

    context.putImageData( imageData, 0, 0 )

    const extraPayload = includePixelMetrics ? { intensityMatrix } : {}
    return buildCanvasImagePayload( canvas, width, height, extraPayload, options )
}

function buildPcaClassificationImage( componentScores, options = {} ){

    const width = componentScores[0].matrix[0].length
    const height = componentScores[0].matrix.length

    var maxAbs = 0

    for( const entry of componentScores ){
        for( var row = 0; row < height; row++ ){
            for( var col = 0; col < width; col++ ){
                const value = entry.matrix[row][col]
                if( value === null ) continue

                const absolute = Math.abs( value )
                if( absolute > maxAbs ) maxAbs = absolute
            }
        }
    }

    if( maxAbs <= 0 ) maxAbs = 1

    if( typeof document === "undefined" ){
        throw new Error( "PCA classification rendering requires a browser environment." )
    }

    const canvas = document.createElement( "canvas" )
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext( "2d" )
    if( context === null ){
        throw new Error( "Unable to create canvas context for PCA classification rendering." )
    }

    const imageData = context.createImageData( width, height )
    const includePixelMetrics = options?.includePixelMetrics === true
    var magnitudeMatrix = includePixelMetrics
        ? Array.from({ length: height }, () => Array( width ).fill( 0 ))
        : null

    var offset = 0
    for( var row = 0; row < height; row++ ){
        for( var col = 0; col < width; col++ ){

            var dominantAbs = -1
            var dominantComponent = componentScores[0].componentIndex

            for( const entry of componentScores ){
                const value = entry.matrix[row][col]
                const absolute = value === null ? 0 : Math.abs( value )

                if( absolute > dominantAbs ){
                    dominantAbs = absolute
                    dominantComponent = entry.componentIndex
                }
            }

            if( dominantAbs < 0 ) dominantAbs = 0

            const normalizedMagnitude = clampUnit( dominantAbs / maxAbs )
            const brightness = Math.sqrt( normalizedMagnitude )

            const baseColor = componentColor( dominantComponent )

            imageData.data[offset++] = Math.round( baseColor[0] * brightness )
            imageData.data[offset++] = Math.round( baseColor[1] * brightness )
            imageData.data[offset++] = Math.round( baseColor[2] * brightness )
            imageData.data[offset++] = 255

            if( includePixelMetrics ){
                magnitudeMatrix[row][col] = normalizedMagnitude
            }
        }
    }

    context.putImageData( imageData, 0, 0 )

    const extraPayload = includePixelMetrics ? { magnitudeMatrix } : {}
    return buildCanvasImagePayload( canvas, width, height, extraPayload, options )
}

function buildPcaRgbImage( componentScores, options = {} ){

    const channelContext = normalizedPcaRgbChannels( componentScores )
    const width = channelContext.width
    const height = channelContext.height

    if( typeof document === "undefined" ){
        throw new Error( "PCA RGB rendering requires a browser environment." )
    }

    const selectedChannels = resolveRgbChannels( componentScores, options.channels )
    const totalPixels = width * height
    const zeroChannel = new Uint8Array( totalPixels )
    const redChannel = normalizedPcaRgbChannel( channelContext, selectedChannels.r ) ?? zeroChannel
    const greenChannel = normalizedPcaRgbChannel( channelContext, selectedChannels.g ) ?? zeroChannel
    const blueChannel = normalizedPcaRgbChannel( channelContext, selectedChannels.b ) ?? zeroChannel

    const canvas = document.createElement( "canvas" )
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext( "2d" )
    if( context === null ){
        throw new Error( "Unable to create canvas context for PCA RGB rendering." )
    }

    const imageData = context.createImageData( width, height )
    const includePixelMetrics = options?.includePixelMetrics === true
    var magnitudeMatrix = includePixelMetrics
        ? Array.from({ length: height }, () => Array( width ).fill( 0 ))
        : null

    var offset = 0
    var pixelIndex = 0

    if( includePixelMetrics ){
        for( var row = 0; row < height; row++ ){
            for( var col = 0; col < width; col++ ){

                const red = redChannel[pixelIndex]
                const green = greenChannel[pixelIndex]
                const blue = blueChannel[pixelIndex]

                imageData.data[offset++] = red
                imageData.data[offset++] = green
                imageData.data[offset++] = blue
                imageData.data[offset++] = 255

                magnitudeMatrix[row][col] = ( red + green + blue ) / ( 3 * 255 )
                pixelIndex += 1
            }
        }
    } else {
        for( ; pixelIndex < totalPixels; pixelIndex++ ){
            imageData.data[offset++] = redChannel[pixelIndex]
            imageData.data[offset++] = greenChannel[pixelIndex]
            imageData.data[offset++] = blueChannel[pixelIndex]
            imageData.data[offset++] = 255
        }
    }

    context.putImageData( imageData, 0, 0 )

    const extraPayload = includePixelMetrics ? { magnitudeMatrix } : {}
    return buildCanvasImagePayload( canvas, width, height, extraPayload, options )
}

function clampZBlendWindowValue( value, fallback, maximum = Infinity ){

    const numeric = Number( value )
    if( Number.isFinite( numeric ) === false ){
        return fallback
    }

    const safeMaximum = Number.isFinite( Number( maximum ) ) && Number( maximum ) > 0
        ? Number( maximum )
        : Infinity

    return Math.max( 0, Math.min( safeMaximum, numeric ) )
}

function resolveZBlendIntensityMaximum( value, matrix ){

    const numeric = Number( value )
    if( Number.isFinite( numeric ) && numeric > 0 ){
        return numeric
    }

    const range = matrixFiniteRange( matrix )
    const maximum = Number( range?.maximum )
    if( Number.isFinite( maximum ) && maximum > 0 ){
        return maximum
    }

    return 1
}

function zBlendTextureCacheKey( intensityMaximum ){

    const maximum = Number( intensityMaximum )
    if( Number.isFinite( maximum ) === false || maximum <= 0 ){
        return "1.000000"
    }

    return maximum.toFixed( 6 )
}

function buildZBlendChannelTexture( matrix, intensityMaximum ){

    const normalizedMatrix = normalizeMip( matrix )
    const cacheKey = zBlendTextureCacheKey( intensityMaximum )
    let cachedTextures = zBlendIntensityTextureCache.get( normalizedMatrix ) ?? null

    if( cachedTextures !== null && cachedTextures.has( cacheKey ) ){
        return cachedTextures.get( cacheKey )
    }

    const height = normalizedMatrix.length
    const width = normalizedMatrix[0].length
    const safeMaximum = resolveZBlendIntensityMaximum( intensityMaximum, normalizedMatrix )

    if( typeof document === "undefined" ){
        throw new Error( "Z-blend channel textures require a browser environment." )
    }

    const canvas = document.createElement( "canvas" )
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext( "2d" )
    if( context === null ){
        throw new Error( "Unable to create canvas context for z-blend texture rendering." )
    }

    const imageData = context.createImageData( width, height )
    let offset = 0

    for( let row = 0; row < height; row++ ){
        for( let col = 0; col < width; col++ ){
            const rawValue = Math.max( 0, Number( normalizedMatrix[row][col] ) || 0 )
            const normalizedValue = clampUnit( rawValue / safeMaximum )
            const byteValue = Math.max( 0, Math.min( 255, Math.round( normalizedValue * 255 )))

            imageData.data[offset++] = byteValue
            imageData.data[offset++] = byteValue
            imageData.data[offset++] = byteValue
            imageData.data[offset++] = 255
        }
    }

    context.putImageData( imageData, 0, 0 )

    const texturePayload = {
        kind: "z-blend-channel-texture",
        canvas,
        width,
        height,
        intensityMaximum: safeMaximum
    }

    if( cachedTextures === null ){
        cachedTextures = new Map()
        zBlendIntensityTextureCache.set( normalizedMatrix, cachedTextures )
    }

    cachedTextures.set( cacheKey, texturePayload )
    return texturePayload
}

function normalizeZBlendContrastLimit( value, intensityMaximum ){

    const safeMaximum = resolveZBlendIntensityMaximum( intensityMaximum, [ [ intensityMaximum ] ] )
    return clampUnit(( Number( value ) || 0 ) / safeMaximum )
}

function buildZBlendRendererPayload( zBlendSource ){

    const normalizedSource = normalizeZBlendSource( zBlendSource )

    return {
        kind: "z-blend",
        width: normalizedSource.width,
        height: normalizedSource.height,
        channels: normalizedSource.channels.map(( channel ) => {
            const texturePayload = buildZBlendChannelTexture( channel.matrix, channel.intensityMaximum )
            return {
                enabled: channel.enabled !== false,
                color: channel.color,
                contrastLimits: [
                    normalizeZBlendContrastLimit( channel.clampMin, channel.intensityMaximum ),
                    normalizeZBlendContrastLimit( channel.clampMax, channel.intensityMaximum )
                ],
                image: texturePayload.canvas
            }
        })
    }
}

function clampIntensityWindow( normalizedValue, minimum, maximum ){

    const value = Math.max( 0, Number( normalizedValue ) || 0 )
    const low = Math.max( 0, Number( minimum ) || 0 )
    const high = Math.max( low, Number( maximum ) || low )

    if( high <= low ){
        return value >= high ? 1 : 0
    }

    return clampUnit(( value - low ) / ( high - low ))
}

function buildZBlendImage( zBlendSource, options = {} ){

    const normalizedSource = normalizeZBlendSource( zBlendSource )
    const width = normalizedSource.width
    const height = normalizedSource.height

    if( typeof document === "undefined" ){
        throw new Error( "Z-blend rendering requires a browser environment." )
    }

    const canvas = document.createElement( "canvas" )
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext( "2d" )
    if( context === null ){
        throw new Error( "Unable to create canvas context for z-blend rendering." )
    }

    const imageData = context.createImageData( width, height )
    const includePixelMetrics = options?.includePixelMetrics === true
    const magnitudeMatrix = includePixelMetrics
        ? Array.from({ length: height }, () => Array( width ).fill( 0 ))
        : null

    for( let row = 0; row < height; row++ ){
        for( let col = 0; col < width; col++ ){

            let red = 0
            let green = 0
            let blue = 0

            for( let channelIndex = 0; channelIndex < normalizedSource.channels.length; channelIndex++ ){
                const channel = normalizedSource.channels[channelIndex]
                if( channel.enabled === false ) continue
                const rawValue = Math.max( 0, Number( channel.matrix[row][col] ) || 0 )
                const clampedValue = clampIntensityWindow( rawValue, channel.clampMin, channel.clampMax )

                if( clampedValue <= 0 ) continue

                red += channel.color[0] * clampedValue
                green += channel.color[1] * clampedValue
                blue += channel.color[2] * clampedValue
            }

            const pixelOffset = ( row * width + col ) * 4
            imageData.data[pixelOffset] = Math.max( 0, Math.min( 255, Math.round( red )))
            imageData.data[pixelOffset + 1] = Math.max( 0, Math.min( 255, Math.round( green )))
            imageData.data[pixelOffset + 2] = Math.max( 0, Math.min( 255, Math.round( blue )))
            imageData.data[pixelOffset + 3] = 255

            if( includePixelMetrics ){
                magnitudeMatrix[row][col] = clampUnit( Math.max( red, green, blue ) / 255 )
            }
        }
    }

    context.putImageData( imageData, 0, 0 )

    const extraPayload = includePixelMetrics ? { magnitudeMatrix } : {}
    return buildCanvasImagePayload( canvas, width, height, extraPayload, options )
}

function resolveRgbChannels( componentScores, requestedChannels ){

    const available = componentScores.map(( entry ) => entry.componentIndex )
    const availableSet = new Set( available )

    return {
        r: resolveSingleRgbChannel( requestedChannels?.r, 1, available, availableSet, 0 ),
        g: resolveSingleRgbChannel( requestedChannels?.g, 2, available, availableSet, 1 ),
        b: resolveSingleRgbChannel( requestedChannels?.b, 3, available, availableSet, 2 )
    }
}

function normalizedPcaRgbChannels( componentScores ){

    if( pcaRgbNormalizedChannelsCache.has( componentScores ) ){
        return pcaRgbNormalizedChannelsCache.get( componentScores )
    }

    const width = componentScores[0].matrix[0].length
    const height = componentScores[0].matrix.length
    const matrixByComponent = new Map()
    for( const entry of componentScores ){
        matrixByComponent.set( entry.componentIndex, entry.matrix )
    }

    const cached = {
        width,
        height,
        matrixByComponent,
        channels: new Map()
    }
    pcaRgbNormalizedChannelsCache.set( componentScores, cached )

    return cached
}

function normalizedPcaRgbChannel( channelContext, componentIndex ){

    if( channelContext === null || typeof channelContext !== "object" ){
        return null
    }

    if( channelContext.channels.has( componentIndex ) ){
        return channelContext.channels.get( componentIndex )
    }

    const matrix = channelContext.matrixByComponent.get( componentIndex )
    if( Array.isArray( matrix ) === false ){
        return null
    }

    const width = channelContext.width
    const height = channelContext.height
    const totalPixels = width * height
    const normalized = new Uint8Array( totalPixels )
    const scale = buildRobustScale( matrix )

    var pixelIndex = 0
    for( var row = 0; row < height; row++ ){
        for( var col = 0; col < width; col++ ){
            normalized[pixelIndex] = Math.round( 255 * normalizeByScale( matrix[row][col], scale ))
            pixelIndex += 1
        }
    }

    channelContext.channels.set( componentIndex, normalized )
    return normalized
}

function resolveUmapChannelColors( channelColors ){

    return {
        r: parseColorValue( channelColors?.r ) ?? parseColorValue( DEFAULT_UMAP_CHANNEL_COLOR_STRINGS.r ) ?? [ 255, 0, 0 ],
        g: parseColorValue( channelColors?.g ) ?? parseColorValue( DEFAULT_UMAP_CHANNEL_COLOR_STRINGS.g ) ?? [ 0, 255, 0 ],
        b: parseColorValue( channelColors?.b ) ?? parseColorValue( DEFAULT_UMAP_CHANNEL_COLOR_STRINGS.b ) ?? [ 0, 0, 255 ]
    }
}

function resolveSingleRgbChannel( requested, preferredDefault, available, availableSet, fallbackOffset ){

    const requestedIndex = Number.parseInt( requested, 10 )
    if( Number.isInteger( requestedIndex ) && availableSet.has( requestedIndex ) ){
        return requestedIndex
    }

    if( availableSet.has( preferredDefault ) ){
        return preferredDefault
    }

    const fallbackIndex = Math.max( 0, Math.min( fallbackOffset, available.length - 1 ))
    return available[fallbackIndex]
}

function buildRobustScale( matrix, lowerQuantile = 0.02, upperQuantile = 0.98 ){

    const useCache = lowerQuantile === 0.02 &&
        upperQuantile === 0.98 &&
        matrix !== null &&
        typeof matrix === "object"
    if( useCache && robustScaleCache.has( matrix ) ){
        return robustScaleCache.get( matrix )
    }

    const values = sampleFiniteValues( matrix )
    if( values.length === 0 ){
        const fallbackScale = { low: 0, high: 1 }
        if( useCache ){
            robustScaleCache.set( matrix, fallbackScale )
        }
        return fallbackScale
    }

    values.sort(( left, right ) => left - right )

    const quantileLow = quantileFromSorted( values, lowerQuantile )
    const quantileHigh = quantileFromSorted( values, upperQuantile )

    if( Number.isFinite( quantileLow ) && Number.isFinite( quantileHigh ) && quantileHigh > quantileLow ){
        const quantileScale = { low: quantileLow, high: quantileHigh }
        if( useCache ){
            robustScaleCache.set( matrix, quantileScale )
        }
        return quantileScale
    }

    const minimum = values[0]
    const maximum = values[values.length - 1]

    if( maximum > minimum ){
        const minMaxScale = { low: minimum, high: maximum }
        if( useCache ){
            robustScaleCache.set( matrix, minMaxScale )
        }
        return minMaxScale
    }

    const fallbackScale = { low: minimum, high: minimum + 1 }
    if( useCache ){
        robustScaleCache.set( matrix, fallbackScale )
    }
    return fallbackScale
}

function sampleFiniteValues( matrix, maxSamples = 200000 ){

    const height = matrix.length
    const width = matrix[0].length
    const total = height * width
    const step = Math.max( 1, Math.ceil( total / maxSamples ))

    var values = []
    var index = 0

    for( var row = 0; row < height; row++ ){
        for( var col = 0; col < width; col++ ){

            if(( index % step ) !== 0 ){
                index += 1
                continue
            }
            index += 1

            const value = matrix[row][col]
            if( Number.isFinite( value ) ){
                values.push( value )
            }
        }
    }

    return values
}

function quantileFromSorted( values, quantile ){

    if( values.length === 0 ) return null
    if( values.length === 1 ) return values[0]

    const clampedQuantile = clampUnit( quantile )
    const position = clampedQuantile * ( values.length - 1 )
    const lower = Math.floor( position )
    const upper = Math.ceil( position )

    if( lower === upper ) return values[lower]

    const fraction = position - lower
    return values[lower] * ( 1 - fraction ) + values[upper] * fraction
}

function normalizeByScale( value, scale ){

    if( Number.isFinite( value ) === false ){
        return 0
    }

    const denominator = scale.high - scale.low
    if( denominator <= 0 ){
        return 0
    }

    return clampUnit(( value - scale.low ) / denominator )
}

function componentColor( componentIndex ){

    const normalized = Math.max( 1, Number.parseInt( componentIndex, 10 ) || 1 )
    const availableColors = Array.isArray( pcaComponentColors ) && pcaComponentColors.length > 0
        ? pcaComponentColors
        : DEFAULT_PCA_COMPONENT_COLOR_STRINGS
            .map(( color ) => parseColorValue( color ))
            .filter(( color ) => color !== null )

    const colorIndex = ( normalized - 1 ) % availableColors.length
    return availableColors[ colorIndex ]
}

function clampUnit( value ){

    if( Number.isFinite( value ) === false ) return 0
    if( value <= 0 ) return 0
    if( value >= 1 ) return 1
    return value
}

function buildColumnMean( matrix, width, height ){

    var mean = []
    for( var col = 0; col < width; col++ ){

        var sum = 0
        var count = 0

        for( var row = 0; row < height; row++ ){
            const value = matrix[row][col]
            if( value === null ) continue
            sum += value
            count += 1
        }

        mean.push( count > 0 ? sum / count : null )
    }

    return mean
}

function buildRowMean( matrix, width, height ){

    var mean = []
    for( var row = 0; row < height; row++ ){

        var sum = 0
        var count = 0

        for( var col = 0; col < width; col++ ){
            const value = matrix[row][col]
            if( value === null ) continue
            sum += value
            count += 1
        }

        mean.push( count > 0 ? sum / count : null )
    }

    return mean
}

function squareDomains( graphContainer ){

    const containerWidth = Math.max( graphContainer.clientWidth || 1, 1 )
    const containerHeight = Math.max( graphContainer.clientHeight || 1, 1 )
    const gap = 0.075

    const heatmapWidth = Math.min( 1, containerHeight / containerWidth )
    const heatmapStart = Math.max( 0, 1 - heatmapWidth )
    const leftEnd = Math.max( 0, heatmapStart - gap )

    return { heatmapStart, leftEnd }
}

function latexTicks( length, maxTicks = 6 ){

    if( length <= 1 ){
        return { tickvals: [ 0 ], ticktext: [ "$$0$$" ] }
    }

    const step = Math.max( 1, Math.ceil(( length - 1 ) / ( maxTicks - 1 )))
    var tickvals = []

    for( var value = 0; value < length; value += step ){
        tickvals.push( value )
    }

    if( tickvals[tickvals.length - 1] !== length - 1 ){
        tickvals.push( length - 1 )
    }

    return {
        tickvals,
        ticktext: tickvals.map(( value ) => "$$" + value + "$$")
    }
}

function sanitizeLatexLabel( label, fallback ){

    if( typeof label !== "string" || label.length === 0 ) return fallback
    return label.replace(/\\/g, "\\")
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
    setSpectrumGridlinesVisible
}
