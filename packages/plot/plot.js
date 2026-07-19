import Plotly from 'plotly.js-dist'
import { applyCalibrationToValues } from './calibration.js'
import { plotlyNewPlot } from './mathjax.js'

const SPECTRUM_GRID_MODEBAR_ICON = {
    width: 512,
    height: 512,
    ascent: 512,
    descent: 0,
    path: "M64 64H448V448H64V64ZM96 96V192H192V96H96ZM224 96V192H320V96H224ZM352 96V192H416V96H352ZM96 224V320H192V224H96ZM224 224V320H320V224H224ZM352 224V320H416V224H352ZM96 352V416H192V352H96ZM224 352V416H320V352H224ZM352 352V416H416V352H352Z"
}

export const splitSpectrumLegendGroups = Object.freeze({
    measurement: "measurement",
    estimateMedian: "estimate-median",
    estimateQ50: "estimate-q50",
    estimateQ75: "estimate-q75",
    estimateQ90: "estimate-q90",
    estimateQ95: "estimate-q95",
    calibrationMeasurement: "calibration-measurement",
    calibrationEstimateMedian: "calibration-estimate-median",
    calibrationEstimateQ50: "calibration-estimate-q50",
    calibrationEstimateQ75: "calibration-estimate-q75",
    calibrationEstimateQ90: "calibration-estimate-q90",
    calibrationEstimateQ95: "calibration-estimate-q95"
})

export function buildComparisonProjectLegendGroup( projectID, traceFamily = "project" ){
    const normalizedProjectID = String( projectID ?? "" ).trim()
    const normalizedTraceFamily = String( traceFamily ?? "project" ).trim().toLowerCase()
    return `comparison-project:${normalizedProjectID.length > 0 ? normalizedProjectID : "unknown"}:${normalizedTraceFamily.length > 0 ? normalizedTraceFamily : "project"}`
}

function parseComparisonProjectLegendGroup( legendGroup = "" ){
    const normalizedLegendGroup = normalizeLegendGroupKey( legendGroup )
    if( normalizedLegendGroup.startsWith( "comparison-project:" ) === false ){
        return null
    }

    const parts = normalizedLegendGroup.split( ":" )
    if( parts.length < 3 ){
        return null
    }

    return {
        projectID: parts.slice( 1, -1 ).join( ":" ),
        traceFamily: parts[ parts.length - 1 ]
    }
}

function normalizeGridlineVisibility( value, fallback = false ) {
    if( typeof value === "boolean" ) return value
    if( typeof value === "string" ){
        if( value === "true" ) return true
        if( value === "false" ) return false
    }
    return fallback
}

function defaultSpectrumGridlineColor(){
    return "rgba(148, 163, 184, 0.22)"
}

function normalizeLegendGroupKey( value ){
    return typeof value === "string" ? value.trim() : ""
}

function normalizeHighlightedTraceGroup( highlightedGroup = "" ){
    return normalizeLegendGroupKey( highlightedGroup )
}

const DEFAULT_SPECTRUM_TRACE_LINE_WIDTH = 2
const DEFAULT_SPECTRUM_BAND_LINE_WIDTH = 0
const HIGHLIGHTED_SPECTRUM_TRACE_LINE_WIDTH = 2.75
const DIMMED_SPECTRUM_TRACE_OPACITY = 0.45
const DEFAULT_SPECTRUM_BAND_FILL_ALPHA = 0.10
const HIGHLIGHTED_SPECTRUM_BAND_FILL_ALPHA = 0.24
const DIMMED_SPECTRUM_BAND_FILL_ALPHA = 0.03
const SPECTRUM_HIGHLIGHT_ANIMATION_DURATION_MS = 140
const SPECTRUM_HIGHLIGHT_PULSE_DURATION_MS = 1840

function isSpectrumUncertaintyLegendGroup( legendGroup = "" ){
    const normalizedLegendGroup = normalizeLegendGroupKey( legendGroup )
    if( normalizedLegendGroup.startsWith( "estimate-q" ) ){
        return true
    }
    if( normalizedLegendGroup.startsWith( "calibration-estimate-q" ) ){
        return true
    }

    const parsedComparisonLegendGroup = parseComparisonProjectLegendGroup( normalizedLegendGroup )
    return [ "q50", "q75", "q90", "q95" ].includes( parsedComparisonLegendGroup?.traceFamily )
}

function resolveAssociatedMedianLegendGroup( highlightedGroup = "" ){
    const normalizedGroup = normalizeLegendGroupKey( highlightedGroup )
    if( normalizedGroup.length === 0 ){
        return ""
    }

    if([
        splitSpectrumLegendGroups.estimateQ50,
        splitSpectrumLegendGroups.estimateQ75,
        splitSpectrumLegendGroups.estimateQ90,
        splitSpectrumLegendGroups.estimateQ95
    ].includes( normalizedGroup ) ){
        return splitSpectrumLegendGroups.estimateMedian
    }
    if([
        splitSpectrumLegendGroups.calibrationEstimateQ50,
        splitSpectrumLegendGroups.calibrationEstimateQ75,
        splitSpectrumLegendGroups.calibrationEstimateQ90,
        splitSpectrumLegendGroups.calibrationEstimateQ95
    ].includes( normalizedGroup ) ){
        return splitSpectrumLegendGroups.calibrationEstimateMedian
    }

    const parsedComparisonLegendGroup = parseComparisonProjectLegendGroup( normalizedGroup )
    if([ "q50", "q75", "q90", "q95" ].includes( parsedComparisonLegendGroup?.traceFamily ) ){
        return buildComparisonProjectLegendGroup( parsedComparisonLegendGroup.projectID, "median" )
    }

    return ""
}

function resolveSpectrumTraceKind( trace ){
    const traceKind = String( trace?.meta?.harkanaTraceKind ?? "" ).trim().toLowerCase()
    if([ "line", "band-line", "band-fill" ].includes( traceKind ) ){
        return traceKind
    }

    if( isSpectrumFillTrace( trace ) ){
        return "band-fill"
    }

    if( isSpectrumUncertaintyLegendGroup( trace?.legendgroup ) ){
        return "band-line"
    }

    return "line"
}

function resolveSpectrumTraceBaseVisible( trace ){
    const baseVisible = trace?.meta?.harkanaBaseVisible
    if( baseVisible === "legendonly" ){
        return "legendonly"
    }

    if( baseVisible === false ){
        return false
    }

    return true
}

function isSpectrumFillTrace( trace ){
    return typeof trace?.fill === "string" && trace.fill.length > 0
}

function requestSpectrumAnimationFrame( callback ){
    if( typeof globalThis?.requestAnimationFrame === "function" ){
        return globalThis.requestAnimationFrame( callback )
    }

    return globalThis.setTimeout(() => callback( Date.now() ), 16 )
}

function cancelSpectrumAnimationFrame( handle ){
    if( handle === null || handle === undefined ){
        return
    }

    if( typeof globalThis?.cancelAnimationFrame === "function" ){
        globalThis.cancelAnimationFrame( handle )
        return
    }

    globalThis.clearTimeout( handle )
}

function spectrumAnimationNow(){
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

function cloneTraceStyleState( state ){
    return {
        opacities: Array.isArray( state?.opacities ) ? [ ...state.opacities ] : [],
        lineWidths: Array.isArray( state?.lineWidths ) ? [ ...state.lineWidths ] : [],
        fillAlphas: Array.isArray( state?.fillAlphas ) ? [ ...state.fillAlphas ] : []
    }
}

function defaultTraceLineWidth( trace ){
    return resolveSpectrumTraceKind( trace ) !== "line"
        ? DEFAULT_SPECTRUM_BAND_LINE_WIDTH
        : DEFAULT_SPECTRUM_TRACE_LINE_WIDTH
}

function readNumericTraceStyleValue( value, fallback ){
    const numericValue = Number( value )
    return Number.isFinite( numericValue ) ? numericValue : fallback
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
    if( isSpectrumFillTrace( trace ) === false ){
        return null
    }

    const parsedColor = parseRgbaColor( trace?.fillcolor )
    if( parsedColor !== null && Number.isFinite( parsedColor.a ) ){
        return parsedColor.a
    }

    return DEFAULT_SPECTRUM_BAND_FILL_ALPHA
}

function buildTraceFillColor( trace, fillAlpha ){
    if( isSpectrumFillTrace( trace ) === false ){
        return trace?.fillcolor ?? null
    }

    const baseColor = resolveTraceFillBaseColor( trace )
    if( baseColor === null ){
        return trace?.fillcolor ?? null
    }

    const alpha = clampUnitInterval( fillAlpha )
    return `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${alpha})`
}

function getCurrentTraceStyleState( graphContainer, traces = [] ){
    const cachedState = graphContainer?.__harkanaSpectrumHighlightState
    const cachedDataReference = graphContainer?.__harkanaSpectrumHighlightStateDataReference
    if( Array.isArray( cachedState?.opacities ) &&
        Array.isArray( cachedState?.lineWidths ) &&
        Array.isArray( cachedState?.fillAlphas ) &&
        cachedDataReference === graphContainer?.data &&
        cachedState.opacities.length === traces.length &&
        cachedState.lineWidths.length === traces.length &&
        cachedState.fillAlphas.length === traces.length ){
        return cloneTraceStyleState( cachedState )
    }

    return {
        opacities: traces.map(( trace ) => readNumericTraceStyleValue( trace?.opacity, 1 )),
        lineWidths: traces.map(( trace ) => readNumericTraceStyleValue( trace?.line?.width, defaultTraceLineWidth( trace ) )),
        fillAlphas: traces.map(( trace ) => readTraceFillAlpha( trace ))
    }
}

function setCurrentTraceStyleState( graphContainer, state ){
    if( graphContainer === null || graphContainer === undefined ){
        return
    }

    graphContainer.__harkanaSpectrumHighlightState = cloneTraceStyleState( state )
    graphContainer.__harkanaSpectrumHighlightStateDataReference = graphContainer.data
}

function beginTraceStyleAnimationSession( graphContainer ){
    cancelSpectrumAnimationFrame( graphContainer?.__harkanaSpectrumHighlightAnimationHandle )
    graphContainer.__harkanaSpectrumHighlightAnimationHandle = null

    const animationToken = Number( graphContainer?.__harkanaSpectrumHighlightAnimationToken ?? 0 ) + 1
    graphContainer.__harkanaSpectrumHighlightAnimationToken = animationToken
    return animationToken
}

function traceStyleStatesEqual( leftState, rightState ){
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

function interpolateTraceStyleState( fromState, toState, progress ){
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

async function restyleTraceStyleState( graphContainer, traceIndices, state ){
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
    setCurrentTraceStyleState( graphContainer, state )
    normalizeModebarButtonSpacing( graphContainer )
}

function buildHighlightedTraceStyleState( traces = [], highlightedGroup = "", options = {} ){
    const normalizedGroup = normalizeHighlightedTraceGroup( highlightedGroup )
    const emphasizeSelected = options?.emphasizeSelected !== false
    const associatedMedianLegendGroup = resolveAssociatedMedianLegendGroup( normalizedGroup )
    const hasMatchingGroup = normalizedGroup.length > 0 && traces.some(( trace ) => {
        return normalizeLegendGroupKey( trace?.legendgroup ) === normalizedGroup &&
            trace?.visible !== "legendonly" &&
            trace?.visible !== false
    })

    return {
        opacities: traces.map(( trace ) => {
            if( hasMatchingGroup === false ){
                return 1
            }

            const traceGroup = normalizeLegendGroupKey( trace?.legendgroup )
            const traceKind = resolveSpectrumTraceKind( trace )
            if( traceGroup.length === 0 ){
                return DIMMED_SPECTRUM_TRACE_OPACITY
            }

            if( traceGroup === normalizedGroup ){
                return 1
            }

            if( associatedMedianLegendGroup.length > 0 && traceGroup === associatedMedianLegendGroup ){
                return 1
            }

            return traceKind === "band-line" || traceKind === "band-fill"
                ? 1
                : DIMMED_SPECTRUM_TRACE_OPACITY
        }),
        lineWidths: traces.map(( trace ) => {
            const traceGroup = normalizeLegendGroupKey( trace?.legendgroup )
            const traceKind = resolveSpectrumTraceKind( trace )

            if( hasMatchingGroup === false ){
                return traceKind !== "line"
                    ? DEFAULT_SPECTRUM_BAND_LINE_WIDTH
                    : DEFAULT_SPECTRUM_TRACE_LINE_WIDTH
            }

            if( traceKind !== "line" ){
                return DEFAULT_SPECTRUM_BAND_LINE_WIDTH
            }

            return traceGroup === normalizedGroup
                ? ( emphasizeSelected ? HIGHLIGHTED_SPECTRUM_TRACE_LINE_WIDTH : DEFAULT_SPECTRUM_TRACE_LINE_WIDTH )
                : DEFAULT_SPECTRUM_TRACE_LINE_WIDTH
        }),
        fillAlphas: traces.map(( trace ) => {
            if( resolveSpectrumTraceKind( trace ) !== "band-fill" ){
                return null
            }

            if( hasMatchingGroup === false ){
                return DEFAULT_SPECTRUM_BAND_FILL_ALPHA
            }

            const traceGroup = normalizeLegendGroupKey( trace?.legendgroup )
            if( traceGroup === normalizedGroup ){
                return emphasizeSelected
                    ? HIGHLIGHTED_SPECTRUM_BAND_FILL_ALPHA
                    : DEFAULT_SPECTRUM_BAND_FILL_ALPHA
            }

            return DIMMED_SPECTRUM_BAND_FILL_ALPHA
        })
    }
}

async function animateTraceStyleState( graphContainer, traceIndices, fromState, toState ){
    if( graphContainer === null || graphContainer === undefined ){
        return false
    }

    if( traceStyleStatesEqual( fromState, toState ) ){
        setCurrentTraceStyleState( graphContainer, toState )
        return true
    }

    const animationToken = beginTraceStyleAnimationSession( graphContainer )

    return await new Promise(( resolve ) => {
        const startTime = spectrumAnimationNow()

        const step = () => {
            if( graphContainer.__harkanaSpectrumHighlightAnimationToken !== animationToken ){
                resolve( false )
                return
            }

            const elapsed = spectrumAnimationNow() - startTime
            const progress = clampUnitInterval( elapsed / SPECTRUM_HIGHLIGHT_ANIMATION_DURATION_MS )
            const nextState = interpolateTraceStyleState( fromState, toState, progress )

            restyleTraceStyleState( graphContainer, traceIndices, nextState )
                .then(() => {
                    if( graphContainer.__harkanaSpectrumHighlightAnimationToken !== animationToken ){
                        resolve( false )
                        return
                    }

                    if( progress >= 1 ){
                        graphContainer.__harkanaSpectrumHighlightAnimationHandle = null
                        resolve( true )
                        return
                    }

                    graphContainer.__harkanaSpectrumHighlightAnimationHandle = requestSpectrumAnimationFrame( step )
                })
                .catch(() => {
                    graphContainer.__harkanaSpectrumHighlightAnimationHandle = null
                    resolve( false )
                })
        }

        graphContainer.__harkanaSpectrumHighlightAnimationHandle = requestSpectrumAnimationFrame( step )
    })
}

function pulseTraceStyleState( graphContainer, traceIndices, baseState, highlightedState ){
    if( graphContainer === null || graphContainer === undefined ){
        return
    }

    if( traceStyleStatesEqual( baseState, highlightedState ) ){
        setCurrentTraceStyleState( graphContainer, baseState )
        return
    }

    const animationToken = beginTraceStyleAnimationSession( graphContainer )
    const startTime = spectrumAnimationNow()

    const step = () => {
        if( graphContainer.__harkanaSpectrumHighlightAnimationToken !== animationToken ){
            return
        }

        const elapsed = spectrumAnimationNow() - startTime
        const cyclePosition = elapsed / SPECTRUM_HIGHLIGHT_PULSE_DURATION_MS
        const cycleProgress = 0.5 + 0.5 * Math.cos( cyclePosition * Math.PI * 2 )
        const nextState = interpolateTraceStyleState( baseState, highlightedState, cycleProgress )

        restyleTraceStyleState( graphContainer, traceIndices, nextState )
            .then(() => {
                if( graphContainer.__harkanaSpectrumHighlightAnimationToken !== animationToken ){
                    return
                }

                graphContainer.__harkanaSpectrumHighlightAnimationHandle = requestSpectrumAnimationFrame( step )
            })
            .catch(() => {
                graphContainer.__harkanaSpectrumHighlightAnimationHandle = null
            })
    }

    graphContainer.__harkanaSpectrumHighlightAnimationHandle = requestSpectrumAnimationFrame( step )
}

function resolveSpectrumGridlinesVisible( graphContainer, settings ){
    if( typeof graphContainer?.__harkanaSpectrumGridlinesVisible === "boolean" ){
        return graphContainer.__harkanaSpectrumGridlinesVisible
    }

    const initialValue = normalizeGridlineVisibility( settings?.gridlines?.spectra, false )
    if( graphContainer ){
        graphContainer.__harkanaSpectrumGridlinesVisible = initialValue
    }
    return initialValue
}

function applySpectrumGridlinesToLayout( layout, graphContainer, settings, axisKeys = [] ){
    const showGrid = resolveSpectrumGridlinesVisible( graphContainer, settings )

    for( const axisKey of axisKeys ){
        const axisLayout = layout?.[axisKey]
        if( axisLayout === null || typeof axisLayout !== "object" ) continue

        axisLayout.showgrid = showGrid
        if( showGrid ){
            axisLayout.gridcolor = typeof axisLayout.gridcolor === "string" && axisLayout.gridcolor.length > 0
                ? axisLayout.gridcolor
                : defaultSpectrumGridlineColor()
            axisLayout.gridwidth = Number.isFinite( Number( axisLayout.gridwidth )) ? axisLayout.gridwidth : 1
        }
    }
}

function buildSpectrumGridlineRelayout( graphContainer, showGrid, axisKeys = [] ){
    var relayout = {}

    for( const axisKey of axisKeys ){
        if( typeof axisKey !== "string" || axisKey.length === 0 ) continue
        if( graphContainer?.layout?.[axisKey] === undefined ) continue

        relayout[`${axisKey}.showgrid`] = showGrid === true
        if( showGrid === true ){
            relayout[`${axisKey}.gridcolor`] = typeof graphContainer?.layout?.[axisKey]?.gridcolor === "string" &&
                graphContainer.layout[axisKey].gridcolor.length > 0
                ? graphContainer.layout[axisKey].gridcolor
                : defaultSpectrumGridlineColor()
            relayout[`${axisKey}.gridwidth`] = 1
        }
    }

    return relayout
}

function normalizeModebarButtonSpacing( graphContainer ){
    const modebarGroups = Array.from( graphContainer?.querySelectorAll?.(".modebar-group") ?? [] )

    for( const group of modebarGroups ){
        group.style.marginLeft = "0px"
        group.style.paddingLeft = "0px"
    }
}

function buildSpectrumGridModebarButton( graphContainer, axisKeys = [] ){
    return {
        name: "Toggle gridlines",
        title: "Toggle gridlines",
        attr: "toggle-gridlines",
        icon: SPECTRUM_GRID_MODEBAR_ICON,
        click: ( gd ) => {
            const nextVisible = !resolveSpectrumGridlinesVisible( gd, { gridlines: { spectra: true } } )
            gd.__harkanaSpectrumGridlinesVisible = nextVisible

            Plotly.relayout( gd, buildSpectrumGridlineRelayout( gd, nextVisible, axisKeys ))
                .then(() => {
                    normalizeModebarButtonSpacing( gd )
                })
                .catch(( error ) => {
                    console.log( error )
                })
        }
    }
}

function buildPlotConfig( graphContainer, axisKeys = [] ){
    var config = {}
    config.responsive = true
    config.displaylogo = false
    config.modeBarButtonsToRemove = [ "autoScale2d" ]

    if( axisKeys.length > 0 ){
        config.modeBarButtonsToAdd = [ buildSpectrumGridModebarButton( graphContainer, axisKeys ) ]
    }

    return config
}

function hasEstimatePayload( estimate ){
    return estimate !== null &&
        typeof estimate === "object" &&
        Array.isArray( estimate.x ) &&
        Array.isArray( estimate.median ) &&
        estimate.lowerBound !== null &&
        typeof estimate.lowerBound === "object" &&
        estimate.upperBound !== null &&
        typeof estimate.upperBound === "object"
}

function spectrumLayoutMetrics( settings ){
    return {
        xLabel: settings.labels.horizontal.replace(/\\/g, "\\"),
        tickFontSize: settings.font.sizes.axis,
        labelFontSize: settings.font.sizes.label,
        legendFontSize: settings.font.sizes.legend,
        horizontalReverse: settings.layout.reversed == "true" ? "reversed" : true
    }
}

function singlePaneLayout( graphContainer, settings, options = {} ){
    const { xLabel, tickFontSize, labelFontSize, legendFontSize, horizontalReverse } = spectrumLayoutMetrics( settings )

    var layout = {}
    layout.autosize = true
    layout.paper_bgcolor = "white"
    layout.plot_bgcolor = "white"
    layout.xaxis = {}
    layout.xaxis.tickfont = { size: tickFontSize }
    layout.xaxis.title = {
        text: "$$\\Large " + xLabel + "$$",
        font: { size: labelFontSize }
    }
    layout.xaxis.autorange = horizontalReverse
    layout.xaxis.automargin = true
    layout.xaxis.showgrid = false
    layout.yaxis = {}
    layout.yaxis.tickfont = { size: tickFontSize }
    layout.yaxis.automargin = true
    layout.yaxis.showgrid = false
    layout.showlegend = options?.showlegend === true
    layout.legend = {}
    layout.legend.font = { size: legendFontSize }
    layout.legend.itemwidth = 20
    layout.legend.orientation = "v"
    layout.margin = {}
    layout.margin.t = 30
    layout.margin.l = 10 + 2 * labelFontSize
    layout.margin.r = 10 + 2 * labelFontSize
    layout.margin.b = 50 + labelFontSize

    applySpectrumGridlinesToLayout( layout, graphContainer, settings, [ "xaxis", "yaxis" ] )

    return {
        layout,
        config: buildPlotConfig( graphContainer, [ "xaxis", "yaxis" ] )
    }
}

function measurementTrace( data, settings, options = {} ){
    const calibratedDataX = applyCalibrationToValues( data?.x, data?.calibration )
    const sourceDataX = Array.isArray( data?.x ) ? data.x : calibratedDataX
    const legendLabel = String( options?.legendLabel ?? settings.legends.data ).replace(/\\/g, "\\")
    const color = String( options?.color ?? settings.colors.data )
    const visible = options?.visible === false ? "legendonly" : true

    var trace = {}
    trace.x = calibratedDataX
    trace.customdata = sourceDataX
    trace.y = data.y
    trace.mode = "lines"
    trace.name = "$" + legendLabel + "$"
    trace.line = {
        color: hexToRgba( color, 1 ),
        width: DEFAULT_SPECTRUM_TRACE_LINE_WIDTH
    }
    trace.showlegend = options?.showlegend !== false
    trace.visible = visible
    trace.meta = {
        ...( trace.meta ?? {} ),
        harkanaTraceKind: "line",
        harkanaBaseVisible: visible,
        harkanaCalibrationSource: String( options?.calibrationSource ?? "" ).trim()
    }
    trace.legendrank = Number.isFinite( Number( options?.legendrank )) ? Number( options.legendrank ) : 0
    const legendGroup = normalizeLegendGroupKey( options?.legendGroup )
    if( legendGroup.length > 0 ){
        trace.legendgroup = legendGroup
    }
    trace.hovertemplate = "(%{x}, %{y})<extra></extra>"
    return trace
}

function estimateLegends( settings ){
    return {
        "95": settings.legends.interval95.replace(/\\/g, "\\"),
        "90": settings.legends.interval90.replace(/\\/g, "\\"),
        "75": settings.legends.interval75.replace(/\\/g, "\\"),
        "50": settings.legends.interval50.replace(/\\/g, "\\")
    }
}

function estimateTraces( data, estimate, settings, options = {} ){
    const calibratedEstimateX = applyCalibrationToValues( estimate?.x, data?.calibration )
    const sourceEstimateX = Array.isArray( estimate?.x ) ? estimate.x : calibratedEstimateX
    const visibility = options?.visibility ?? settings.visibility.plot
    const medianLabel = String( options?.medianLabel ?? settings.legends.median ).replace(/\\/g, "\\")
    const medianColor = hexToRgba( String( options?.medianColor ?? settings.colors.median ), 1 )
    const areaColor = typeof options?.areaColor === "string" && options.areaColor.length > 0
        ? options.areaColor
        : hexToRgba( String( settings.colors.area ), 0.10 )
    const areaLineColor = typeof options?.areaLineColor === "string" && options.areaLineColor.length > 0
        ? options.areaLineColor
        : hexToRgba( String( options?.areaColor ?? settings.colors.area ), 0 )
    const legendFlag = String( options?.legendFlag ?? "" )
    const axes = options?.axes ?? { xaxis: "x", yaxis: "y" }
    const legendGroups = options?.legendGroups ?? {}

    var traceEstimate = {}
    traceEstimate.x = calibratedEstimateX
    traceEstimate.customdata = sourceEstimateX
    traceEstimate.y = estimate.median
    traceEstimate.mode = "lines"
    traceEstimate.name = "$" + medianLabel + "$"
    traceEstimate.line = {
        color: medianColor,
        width: DEFAULT_SPECTRUM_TRACE_LINE_WIDTH
    }
    traceEstimate.showlegend = options?.showlegend !== false
    traceEstimate.visible = visibility.median == false ? "legendonly" : true
    traceEstimate.meta = {
        ...( traceEstimate.meta ?? {} ),
        harkanaTraceKind: "line",
        harkanaBaseVisible: traceEstimate.visible,
        harkanaCalibrationSource: String( options?.calibrationSource ?? "" ).trim()
    }
    traceEstimate.legendrank = Number.isFinite( Number( options?.legendrank )) ? Number( options.legendrank ) : 1
    const medianLegendGroup = normalizeLegendGroupKey( legendGroups.median )
    if( medianLegendGroup.length > 0 ){
        traceEstimate.legendgroup = medianLegendGroup
    }
    traceEstimate.hovertemplate = "(%{x}, %{y})<extra></extra>"

    const quantiles = [ 50, 75, 90, 95 ]
    const traces = [ traceEstimate ]

    for( var ii = 0; ii < quantiles.length; ii++ ){
        const [ traceLowerBound, traceUpperBound ] = uncertaintyTraces(
            calibratedEstimateX,
            estimate.lowerBound,
            estimate.upperBound,
            quantiles[ii],
            estimateLegends( settings ),
            visibility,
            areaColor,
            legendFlag,
            axes,
            {
                legendGroup: legendGroups[`q${quantiles[ii]}`],
                showlegend: options?.showlegend,
                lineColor: areaLineColor,
                calibrationSource: options?.calibrationSource,
                sourceX: sourceEstimateX
            }
        )

        traces.push( traceLowerBound, traceUpperBound )
    }

    return traces
}

var renderMeasurementPane = async function( data, graphContainer, settings, options = {} ){
    const showLegend = options?.showlegend === true
    const { layout, config } = singlePaneLayout( graphContainer, settings, { showlegend: showLegend } )
    const traces = [
        measurementTrace( data, settings, {
        visible: settings.visibility.plot.data != false,
        showlegend: showLegend,
        legendGroup: options?.legendGroup ?? splitSpectrumLegendGroups.measurement,
        calibrationSource: "measurement"
        }),
        ...buildCalibrationPreviewMeasurementTrace( data, settings, {
            calibrationPreview: options?.calibrationPreview,
            visible: settings.visibility.plot.data != false,
            legendrank: 100
        })
    ]

    await plotlyNewPlot( Plotly,  graphContainer, traces, layout, config )
    normalizeModebarButtonSpacing( graphContainer )
}

var renderMeasurementComparisonPane = async function( data, comparisonEntriesInput, graphContainer, settings, options = {} ){
    const { layout, config } = singlePaneLayout( graphContainer, settings )
    const visibility = settings.visibility.comparison ?? {}
    const comparisonEntries = normalizeComparisonEntriesInput( comparisonEntriesInput )
    const traces = [
        ...comparisonEntries.map(( entry, index ) => measurementTrace( entry.data, settings, {
            color: resolveComparisonEntryColor( entry, index, settings ),
            visible: visibility.data != false,
            legendrank: index + 1,
            showlegend: false,
            legendGroup: buildComparisonProjectLegendGroup( entry.projectID, "measurement" )
        })),
        measurementTrace( data, settings, {
            visible: visibility.data != false,
            legendrank: 0,
            showlegend: false,
            legendGroup: splitSpectrumLegendGroups.measurement,
            calibrationSource: "measurement"
        }),
        ...buildCalibrationPreviewMeasurementTrace( data, settings, {
            calibrationPreview: options?.calibrationPreview,
            visible: visibility.data != false,
            legendrank: 100
        })
    ]

    await plotlyNewPlot( Plotly,  graphContainer, traces, layout, config )
    normalizeModebarButtonSpacing( graphContainer )
}

var renderEstimatePane = async function( data, estimate, graphContainer, settings, options = {} ){
    if( hasEstimatePayload( estimate ) === false ){
        Plotly.purge( graphContainer )
        return
    }

    const { layout, config } = singlePaneLayout( graphContainer, settings )
    const traces = estimateTraces( data, estimate, settings, {
        visibility: settings.visibility.plot,
        axes: { xaxis: "x", yaxis: "y" },
        showlegend: false,
        calibrationSource: "estimate",
        legendGroups: {
            median: splitSpectrumLegendGroups.estimateMedian,
            q50: splitSpectrumLegendGroups.estimateQ50,
            q75: splitSpectrumLegendGroups.estimateQ75,
            q90: splitSpectrumLegendGroups.estimateQ90,
            q95: splitSpectrumLegendGroups.estimateQ95
        }
    }).concat(
        buildCalibrationPreviewEstimateTraces( data, estimate, settings, {
            calibrationPreview: options?.calibrationPreview,
            visibility: settings.visibility.plot,
            axes: { xaxis: "x", yaxis: "y" },
            legendrank: 101
        })
    )

    await plotlyNewPlot( Plotly,  graphContainer, traces, layout, config )
    normalizeModebarButtonSpacing( graphContainer )
}

var renderEstimateComparisonPane = async function(
    data,
    estimate,
    comparisonEntriesInput,
    graphContainer,
    settings,
    options = {}
) {
    const comparisonEntries = normalizeComparisonEntriesInput( comparisonEntriesInput )
        .filter(( entry ) => hasEstimatePayload( entry?.estimate ) )
    if( hasEstimatePayload( estimate ) === false || comparisonEntries.length === 0 ){
        Plotly.purge( graphContainer )
        return
    }

    const { layout, config } = singlePaneLayout( graphContainer, settings )
    const visibility = settings.visibility.comparison ?? {}
    const traces = [
        ...comparisonEntries.flatMap(( entry, index ) => {
            const measurementLegendGroup = buildComparisonProjectLegendGroup( entry.projectID, "measurement" )
            const medianLegendGroup = buildComparisonProjectLegendGroup( entry.projectID, "median" )
            const color = resolveComparisonEntryColor( entry, index, settings )
            return estimateTraces( entry.data, entry.estimate, settings, {
                visibility,
                axes: { xaxis: "x", yaxis: "y" },
                medianColor: color,
                areaColor: hexToRgba( color, normalizeComparisonOpacity( settings ) ),
                areaLineColor: hexToRgba( color, 0 ),
                legendFlag: String( index + 2 ),
                legendrank: 10 + index,
                showlegend: false,
                legendGroups: {
                    measurement: measurementLegendGroup,
                    median: medianLegendGroup,
                    q50: buildComparisonProjectLegendGroup( entry.projectID, "q50" ),
                    q75: buildComparisonProjectLegendGroup( entry.projectID, "q75" ),
                    q90: buildComparisonProjectLegendGroup( entry.projectID, "q90" ),
                    q95: buildComparisonProjectLegendGroup( entry.projectID, "q95" )
                }
            } )
        }),
        ...estimateTraces( data, estimate, settings, {
            visibility,
            axes: { xaxis: "x", yaxis: "y" },
            legendFlag: "",
            legendrank: 0,
            showlegend: false,
            calibrationSource: "estimate",
            legendGroups: {
                median: splitSpectrumLegendGroups.estimateMedian,
                q50: splitSpectrumLegendGroups.estimateQ50,
                q75: splitSpectrumLegendGroups.estimateQ75,
                q90: splitSpectrumLegendGroups.estimateQ90,
                q95: splitSpectrumLegendGroups.estimateQ95
            }
        }),
        ...buildCalibrationPreviewEstimateTraces( data, estimate, settings, {
            calibrationPreview: options?.calibrationPreview,
            visibility,
            axes: { xaxis: "x", yaxis: "y" },
            legendrank: 101
        })
    ]

    await plotlyNewPlot( Plotly,  graphContainer, traces, layout, config )
    normalizeModebarButtonSpacing( graphContainer )
}

var initializeDataOnly = async function( data, graphContainer, settings ){
    await renderMeasurementPane( data, graphContainer, settings )
}

var initialize = async function( data, estimate, graphContainer, settings, options = {}) {

    if( hasEstimatePayload( estimate ) === false ){
        await renderMeasurementPane( data, graphContainer, settings, options )
        return
    }

    const xLabel = settings.labels.horizontal.replace(/\\/g, "\\");

    const dataLegend = settings.legends.data.replace(/\\/g, "\\");
    const medianLabel = settings.legends.median.replace(/\\/g, "\\");

    var legends = {};
    legends["95"] = settings.legends.interval95.replace(/\\/g, "\\");
    legends["90"] = settings.legends.interval90.replace(/\\/g, "\\");
    legends["75"] = settings.legends.interval75.replace(/\\/g, "\\");
    legends["50"] = settings.legends.interval50.replace(/\\/g, "\\");

    const tickFontSize = settings.font.sizes.axis;
    const labelFontSize = settings.font.sizes.label;
    const legendFontSize = settings.font.sizes.legend;

    const horizontalReverse = settings.layout.reversed == "true" ? "reversed" : true;

    const dataColorRGBA = hexToRgba( settings.colors.data, 1);
    const medianColorRGBA = hexToRgba( settings.colors.median, 1);
    const areaColorRGBA = hexToRgba( settings.colors.area, 0.10);
    const areaLineColorRGBA = hexToRgba( settings.colors.area, 0);

    const calibratedDataX = applyCalibrationToValues( data?.x, data?.calibration )
    const calibratedEstimateX = applyCalibrationToValues( estimate?.x, data?.calibration )

    var traceData = {};
    traceData.x = calibratedDataX;
    traceData.customdata = Array.isArray( data?.x ) ? data.x : calibratedDataX;
    traceData.y = data.y;
    traceData.mode = "lines";
    traceData.name = "$" + dataLegend  + "$";
    traceData.line = {};
    traceData.line.color = dataColorRGBA;
    traceData.line.width = DEFAULT_SPECTRUM_TRACE_LINE_WIDTH;
    traceData.showlegend = false;
    traceData.visible = settings.visibility.plot.data == false ? "legendonly" : true;
    traceData.meta = {
        harkanaTraceKind: "line",
        harkanaBaseVisible: traceData.visible,
        harkanaCalibrationSource: "measurement"
    }
    traceData.legendrank = 0;
    traceData.legendgroup = splitSpectrumLegendGroups.measurement;
    traceData.hovertemplate = "(%{x}, %{y})<extra></extra>"

    var traceEstimate = {};
    traceEstimate.x = calibratedEstimateX;
    traceEstimate.customdata = Array.isArray( estimate?.x ) ? estimate.x : calibratedEstimateX;
    traceEstimate.y = estimate.median;
    traceEstimate.mode = "lines";
    traceEstimate.name = "$" + medianLabel + "$";
    traceEstimate.line = {};
    traceEstimate.line.color = medianColorRGBA;
    traceEstimate.line.width = DEFAULT_SPECTRUM_TRACE_LINE_WIDTH;
    traceEstimate.showlegend = false;
    traceEstimate.visible = settings.visibility.plot.median == false ? "legendonly" : true;
    traceEstimate.meta = {
        harkanaTraceKind: "line",
        harkanaBaseVisible: traceEstimate.visible,
        harkanaCalibrationSource: "estimate"
    }
    traceEstimate.legendrank = 1;
    traceEstimate.legendgroup = splitSpectrumLegendGroups.estimateMedian;
    traceEstimate.xaxis = "x2";
    traceEstimate.yaxis = "y2";
    traceEstimate.hovertemplate = "(%{x}, %{y})<extra></extra>"

    const quantiles = [ 50, 75, 90, 95];

    var traces = [];
    traces.push(  traceData, traceEstimate);

    for( var ii = 0; ii < quantiles.length; ii++ ){

        var [ traceLowerBound, traceUpperBound] = uncertaintyTraces(calibratedEstimateX,
                                                                    estimate.lowerBound,
                                                                    estimate.upperBound,
                                                                    quantiles[ii],
                                                                    legends,
                                                                    settings.visibility.plot,
                                                                    areaColorRGBA,
                                                                    "",
                                                                    { xaxis: "x2", yaxis: "y2" },
                                                                    {
                                                                        legendGroup: splitSpectrumLegendGroups[`estimateQ${quantiles[ii]}`],
                                                                        showlegend: false,
                                                                        lineColor: areaLineColorRGBA,
                                                                        calibrationSource: "estimate",
                                                                        sourceX: Array.isArray( estimate?.x ) ? estimate.x : calibratedEstimateX
                                                                    });

        traces.push( traceLowerBound, traceUpperBound)
    }

    traces.push(
        ...buildCalibrationPreviewMeasurementTrace( data, settings, {
            calibrationPreview: options?.calibrationPreview,
            visible: settings.visibility.plot.data != false,
            legendrank: 100
        }),
        ...buildCalibrationPreviewEstimateTraces( data, estimate, settings, {
            calibrationPreview: options?.calibrationPreview,
            visibility: settings.visibility.plot,
            axes: { xaxis: "x2", yaxis: "y2" },
            legendrank: 101
        })
    )

    var tracesAll = structuredClone( traces )

    for( const ii in tracesAll ){
        tracesAll[ii].xaxis = "x";
    };

    var layout = {};

    layout.autosize = true;
    layout.xaxis = {};
    layout.xaxis.tickfont = {};
    layout.xaxis.title = {};
    layout.xaxis.title.font = {};

    layout.xaxis.tickfont.size = tickFontSize;
    layout.xaxis.title.text = "$$\\Large " + xLabel + "$$";
    layout.xaxis.title.font.size = labelFontSize
    layout.xaxis.autorange = horizontalReverse;
    layout.xaxis.showgrid = false;

    layout.showlegend = false;
    layout.legend = {};
    layout.legend.font = {};
    layout.legend.font.size = legendFontSize;
    layout.legend.itemwidth = 20;
    layout.legend.orientation = "v"

    layout.margin = {};
    layout.margin.t = 30;
    layout.margin.l = 10 + 2 * labelFontSize;
    layout.margin.r = 100;

    var layoutVertical = structuredClone( layout );
    layoutVertical.grid = {};
    layoutVertical.grid.rows = 2;
    layoutVertical.grid.columns = 1;
    layoutVertical.grid.pattern = "independent";

    layoutVertical.xaxis2 = {};
    layoutVertical.xaxis2.title = {};
    layoutVertical.xaxis2.title.font = {};
    layoutVertical.xaxis2.tickfont = {};
    layoutVertical.xaxis2.tickfont.size = tickFontSize;
    layoutVertical.xaxis2.title.text = "$$\\Large " + xLabel + "$$";
    layoutVertical.xaxis2.title.font.size = labelFontSize
    layoutVertical.xaxis2.autorange = horizontalReverse;

    layoutVertical.yaxis = {};
    layoutVertical.yaxis2 = {};
    layoutVertical.yaxis2.rangemode = "tozero";
    layoutVertical.yaxis.tickfont = {};
    layoutVertical.yaxis2.tickfont = {};
    layoutVertical.yaxis.tickfont.size = tickFontSize;
    layoutVertical.yaxis2.tickfont.size = tickFontSize;
    layoutVertical.yaxis.showgrid = false;
    layoutVertical.xaxis2.showgrid = false;
    layoutVertical.yaxis2.showgrid = false;

    var layoutHorizontal = structuredClone( layout );
    layoutHorizontal.grid = {};
    layoutHorizontal.grid.rows = 1;
    layoutHorizontal.grid.columns = 2;
    layoutHorizontal.grid.pattern = "independent";
    
    layoutHorizontal.xaxis2 = {};
    layoutHorizontal.xaxis2.title = {};
    layoutHorizontal.xaxis2.title.font = {};
    layoutHorizontal.xaxis2.tickfont = {};
    layoutHorizontal.xaxis2.tickfont.size = tickFontSize;
    layoutHorizontal.xaxis2.title.text = "$$\\Large " + xLabel + "$$";
    layoutHorizontal.xaxis2.title.font.size = labelFontSize
    layoutHorizontal.xaxis2.autorange = horizontalReverse;

    layoutHorizontal.yaxis = {};
    layoutHorizontal.yaxis2 = {};
    layoutHorizontal.rangemode = "tozero";
    layoutHorizontal.yaxis.tickfont = {};
    layoutHorizontal.yaxis2.tickfont = {};
    layoutHorizontal.yaxis.tickfont.size = tickFontSize;
    layoutHorizontal.yaxis2.tickfont.size = tickFontSize;
    layoutHorizontal.yaxis.showgrid = false;
    layoutHorizontal.xaxis2.showgrid = false;
    layoutHorizontal.yaxis2.showgrid = false;

    layout.margin.r = 10 + 2 * labelFontSize;
    layout.yaxis = {};
    layout.yaxis.tickfont = {};
    layout.yaxis.tickfont.size = tickFontSize;
    layout.yaxis.showgrid = false;

    layout.yaxis2 = {};
    layout.rangemode = "tozero";
    layout.yaxis2.overlaying = "y";
    layout.yaxis2.side = "right";
    layout.yaxis2.tickfont = {};
    layout.yaxis2.tickfont.size = tickFontSize;
    layout.yaxis2.showgrid = false;

    applySpectrumGridlinesToLayout( layoutVertical, graphContainer, settings, [ "xaxis", "yaxis", "xaxis2", "yaxis2" ] )
    applySpectrumGridlinesToLayout( layoutHorizontal, graphContainer, settings, [ "xaxis", "yaxis", "xaxis2", "yaxis2" ] )
    applySpectrumGridlinesToLayout( layout, graphContainer, settings, [ "xaxis", "yaxis", "yaxis2" ] )

    const activeAxisKeys = settings.layout.layout === "vertical" || settings.layout.layout === "horizontal"
        ? [ "xaxis", "yaxis", "xaxis2", "yaxis2" ]
        : [ "xaxis", "yaxis", "yaxis2" ]
    const config = buildPlotConfig( graphContainer, activeAxisKeys )

    if( settings.layout.layout === "vertical" )   await plotlyNewPlot( Plotly,  graphContainer, traces, layoutVertical, config)
    if( settings.layout.layout === "horizontal" ) await plotlyNewPlot( Plotly,  graphContainer, traces, layoutHorizontal, config)
    if( settings.layout.layout === "single" )     await plotlyNewPlot( Plotly,  graphContainer, tracesAll, layout, config)
    normalizeModebarButtonSpacing( graphContainer )
};

function uncertaintyTraces( x, lowerBounds, upperBounds, quantile, legends, visibility, color, flag = "", axes = { xaxis: "x2", yaxis: "y2" }, options = {} ){

    const legend = legends[ quantile ]
    const legendGroup = normalizeLegendGroupKey( options?.legendGroup ) || "uncertainty" + quantile + flag
    const lineColor = typeof options?.lineColor === "string" && options.lineColor.length > 0
        ? options.lineColor
        : color
    const sourceX = Array.isArray( options?.sourceX ) ? options.sourceX : x

    var traceLowerBound = {};
    traceLowerBound.x = x;
    traceLowerBound.customdata = sourceX;
    traceLowerBound.y = lowerBounds[ quantile ];
    traceLowerBound.mode = "lines";
    if( typeof axes?.xaxis === "string" && axes.xaxis.length > 0 ){
        traceLowerBound.xaxis = axes.xaxis;
    }
    if( typeof axes?.yaxis === "string" && axes.yaxis.length > 0 ){
        traceLowerBound.yaxis = axes.yaxis;
    }
    traceLowerBound.line = {};
    traceLowerBound.line.color = lineColor;
    traceLowerBound.line.width = DEFAULT_SPECTRUM_BAND_LINE_WIDTH;
    traceLowerBound.showlegend = false;
    traceLowerBound.visible = visibility["interval" + quantile] == false ? "legendonly" : true;
    traceLowerBound.meta = {
        ...( traceLowerBound.meta ?? {} ),
        harkanaTraceKind: "band-line",
        harkanaBaseVisible: traceLowerBound.visible,
        harkanaCalibrationSource: String( options?.calibrationSource ?? "" ).trim()
    }
    traceLowerBound.legendgroup = legendGroup;
    traceLowerBound.hovertemplate = "(%{x}, %{y})<extra></extra>"

    var traceUpperBound = {};
    traceUpperBound.x = x;
    traceUpperBound.customdata = sourceX;
    traceUpperBound.y = upperBounds[ quantile ];
    traceUpperBound.mode = "lines";
    traceUpperBound.name = "$" + legend  + "$"
    traceUpperBound.fill = "tonexty";
    traceUpperBound.line = {};
    traceUpperBound.line.color = lineColor;
    traceUpperBound.line.width = DEFAULT_SPECTRUM_BAND_LINE_WIDTH;
    traceUpperBound.fillcolor = color;
    if( typeof axes?.xaxis === "string" && axes.xaxis.length > 0 ){
        traceUpperBound.xaxis = axes.xaxis;
    }
    if( typeof axes?.yaxis === "string" && axes.yaxis.length > 0 ){
        traceUpperBound.yaxis = axes.yaxis;
    }
    traceUpperBound.showlegend = options?.showlegend !== false;
    traceUpperBound.visible = visibility["interval" + quantile] == false ? "legendonly" : true;
    traceUpperBound.meta = {
        ...( traceUpperBound.meta ?? {} ),
        harkanaTraceKind: "band-fill",
        harkanaBaseVisible: traceUpperBound.visible,
        harkanaCalibrationSource: String( options?.calibrationSource ?? "" ).trim()
    }
    traceUpperBound.legendgroup = legendGroup;
    traceUpperBound.hovertemplate = "(%{x}, %{y})<extra></extra>"

    return [ traceLowerBound, traceUpperBound]
}

var setHiddenTraceGroups = async function( graphContainer, hiddenGroups = [] ){
    const traces = Array.isArray( graphContainer?.data ) ? graphContainer.data : []
    if( traces.length === 0 ){
        return
    }

    const normalizedHiddenGroups = new Set(
        ( Array.isArray( hiddenGroups ) ? hiddenGroups : [] )
            .map(( groupKey ) => normalizeLegendGroupKey( groupKey ))
            .filter(( groupKey ) => groupKey.length > 0 )
    )

    const traceIndices = traces.map(( _, index ) => index )
    const nextVisibility = traces.map(( trace ) => {
        const legendGroup = normalizeLegendGroupKey( trace?.legendgroup )
        if( legendGroup.length === 0 ){
            return trace?.visible ?? true
        }

        return normalizedHiddenGroups.has( legendGroup ) ? "legendonly" : true
    })

    await Plotly.restyle( graphContainer, { visible: nextVisibility }, traceIndices )
    normalizeModebarButtonSpacing( graphContainer )
}

function normalizeComparisonEntriesInput( comparisonEntries, comparisonEstimate = null ){
    if( Array.isArray( comparisonEntries ) ){
        return comparisonEntries.filter(( entry ) => {
            return entry !== null &&
                typeof entry === "object" &&
                entry.data !== null &&
                typeof entry.data === "object"
        })
    }

    if( comparisonEntries !== null &&
        typeof comparisonEntries === "object" &&
        Array.isArray( comparisonEntries?.x ) ){
        return [{
            projectID: comparisonEntries?.projectID ?? comparisonEntries?.id ?? "",
            projectName: comparisonEntries?.projectName ?? comparisonEntries?.name ?? "",
            color: comparisonEntries?.color,
            data: comparisonEntries,
            estimate: comparisonEstimate
        }]
    }

    return []
}

function resolveComparisonColorPalette( settings ){
    const storedPalette = Array.isArray( settings?.comparisonColors?.palette )
        ? settings.comparisonColors.palette
        : []
    const normalizedPalette = storedPalette
        .map(( color ) => String( color ?? "" ).trim() )
        .filter(( color ) => color.length > 0 )

    if( normalizedPalette.length > 0 ){
        return normalizedPalette
    }

    const fallbackColor = String(
        settings?.comparisonColors?.data ??
        settings?.colors?.median ??
        "#ff7f0e"
    ).trim()

    return fallbackColor.length > 0 ? [ fallbackColor ] : [ "#ff7f0e" ]
}

function resolveComparisonEntryColor( entry, index, settings ){
    const explicitColor = String( entry?.color ?? "" ).trim()
    if( explicitColor.length > 0 ){
        return explicitColor
    }

    const palette = resolveComparisonColorPalette( settings )
    return palette[ index % palette.length ]
}

function normalizeComparisonOpacity( settings ){
    const numericOpacity = Number( settings?.comparisonColors?.opacity )
    if( Number.isFinite( numericOpacity ) ){
        return Math.min( 1, Math.max( 0, numericOpacity ) )
    }

    return 0.15
}

function normalizeCalibrationPreviewColor( settings ){
    const calibrationColor = String( settings?.colors?.calibration ?? "" ).trim()
    return calibrationColor.length > 0 ? calibrationColor : "#333333"
}

function normalizeCalibrationPreviewOpacity( settings ){
    const numericOpacity = Number( settings?.colors?.opacity )
    if( Number.isFinite( numericOpacity ) ){
        return Math.min( 1, Math.max( 0, numericOpacity ) )
    }

    return 0.15
}

function hasCalibrationPreview( calibrationPreview ){
    if( calibrationPreview === null || typeof calibrationPreview !== "object" ){
        return false
    }

    if( calibrationPreview?.__harkanaForcePreview === true ){
        return true
    }

    const points = Array.isArray( calibrationPreview?.points ) ? calibrationPreview.points : []
    return points.some(( point ) => Number.isFinite( Number( point?.targetX ) ) )
}

function buildCalibrationPreviewMeasurementTrace( data, settings, options = {} ){
    const calibrationPreview = options?.calibrationPreview
    if( hasCalibrationPreview( calibrationPreview ) === false ){
        return []
    }

    const previewData = {
        ...data,
        calibration: calibrationPreview
    }

    return [
        measurementTrace( previewData, settings, {
            color: options?.color ?? normalizeCalibrationPreviewColor( settings ),
            visible: options?.visible,
            showlegend: false,
            legendrank: Number.isFinite( Number( options?.legendrank ) ) ? Number( options.legendrank ) : 100,
            legendGroup: splitSpectrumLegendGroups.calibrationMeasurement
        })
    ]
}

function buildCalibrationPreviewEstimateTraces( data, estimate, settings, options = {} ){
    const calibrationPreview = options?.calibrationPreview
    if( hasCalibrationPreview( calibrationPreview ) === false || hasEstimatePayload( estimate ) === false ){
        return []
    }

    const previewData = {
        ...data,
        calibration: calibrationPreview
    }
    const previewColor = options?.color ?? normalizeCalibrationPreviewColor( settings )

    return estimateTraces( previewData, estimate, settings, {
        visibility: options?.visibility ?? settings.visibility.plot,
        axes: options?.axes ?? { xaxis: "x", yaxis: "y" },
        showlegend: false,
        legendrank: Number.isFinite( Number( options?.legendrank ) ) ? Number( options.legendrank ) : 101,
        medianColor: previewColor,
        areaColor: hexToRgba( previewColor, normalizeCalibrationPreviewOpacity( settings ) ),
        areaLineColor: hexToRgba( previewColor, 0 ),
        legendGroups: {
            median: splitSpectrumLegendGroups.calibrationEstimateMedian,
            q50: splitSpectrumLegendGroups.calibrationEstimateQ50,
            q75: splitSpectrumLegendGroups.calibrationEstimateQ75,
            q90: splitSpectrumLegendGroups.calibrationEstimateQ90,
            q95: splitSpectrumLegendGroups.calibrationEstimateQ95
        }
    })
}

var setHighlightedTraceGroup = async function( graphContainer, highlightedGroup = "" ){
    const traces = Array.isArray( graphContainer?.data ) ? graphContainer.data : []
    if( traces.length === 0 ){
        return
    }

    const normalizedGroup = normalizeHighlightedTraceGroup( highlightedGroup )
    const traceIndices = traces.map(( _, index ) => index )
    const fromState = getCurrentTraceStyleState( graphContainer, traces )
    const restingState = normalizedGroup.length > 0
        ? buildHighlightedTraceStyleState( traces, normalizedGroup, { emphasizeSelected: false } )
        : buildHighlightedTraceStyleState( traces, "" )
    const emphasizedState = normalizedGroup.length > 0
        ? buildHighlightedTraceStyleState( traces, normalizedGroup, { emphasizeSelected: true } )
        : restingState
    graphContainer.__harkanaSpectrumRequestedHighlightedGroup = normalizedGroup

    const animationCompleted = await animateTraceStyleState( graphContainer, traceIndices, fromState, emphasizedState )
    if( animationCompleted !== true ){
        return
    }

    if( graphContainer.__harkanaSpectrumRequestedHighlightedGroup !== normalizedGroup ){
        return
    }

    if( normalizedGroup.length === 0 || traceStyleStatesEqual( restingState, emphasizedState ) ){
        return
    }

    pulseTraceStyleState( graphContainer, traceIndices, restingState, emphasizedState )
}


var comparison = async function( data, estimate,
                                 comparisonEntriesInput,
                                 graphContainer, settings, options = {}) {

    const comparisonEntries = normalizeComparisonEntriesInput( comparisonEntriesInput )
        .filter(( entry ) => hasEstimatePayload( entry?.estimate ) )
    if( hasEstimatePayload( estimate ) === false || comparisonEntries.length === 0 ){
        await initialize( data, estimate, graphContainer, settings )
        return
    }

    const xLabel = settings.labels.horizontal.replace(/\\/g, "\\");

    const tickFontSize = settings.font.sizes.axis;
    const labelFontSize = settings.font.sizes.label;
    const legendFontSize = settings.font.sizes.legend;
    
    const horizontalReverse = settings.layout.reversed == "true" ? "reversed" : true;
    const comparisonVisibility = settings.visibility.comparison ?? {}
    const traces = [
        ...comparisonEntries.flatMap(( entry, index ) => {
            const measurementLegendGroup = buildComparisonProjectLegendGroup( entry.projectID, "measurement" )
            const medianLegendGroup = buildComparisonProjectLegendGroup( entry.projectID, "median" )
            const color = resolveComparisonEntryColor( entry, index, settings )

            return [
                measurementTrace( entry.data, settings, {
                    color,
                    visible: comparisonVisibility.data != false,
                    legendrank: 10 + index,
                    showlegend: false,
                    legendGroup: measurementLegendGroup
                }),
                ...estimateTraces( entry.data, entry.estimate, settings, {
                    visibility: comparisonVisibility,
                    axes: { xaxis: "x2", yaxis: "y2" },
                    medianColor: color,
                    areaColor: hexToRgba( color, normalizeComparisonOpacity( settings ) ),
                    areaLineColor: hexToRgba( color, 0 ),
                    legendFlag: String( index + 2 ),
                    legendrank: 20 + index,
                    showlegend: false,
                    legendGroups: {
                        median: medianLegendGroup,
                        q50: buildComparisonProjectLegendGroup( entry.projectID, "q50" ),
                        q75: buildComparisonProjectLegendGroup( entry.projectID, "q75" ),
                        q90: buildComparisonProjectLegendGroup( entry.projectID, "q90" ),
                        q95: buildComparisonProjectLegendGroup( entry.projectID, "q95" )
                    }
                })
            ]
        }),
        measurementTrace( data, settings, {
            visible: comparisonVisibility.data != false,
            legendrank: 0,
            showlegend: false,
            legendGroup: splitSpectrumLegendGroups.measurement,
            calibrationSource: "measurement"
        }),
        ...estimateTraces( data, estimate, settings, {
            visibility: comparisonVisibility,
            axes: { xaxis: "x2", yaxis: "y2" },
            showlegend: false,
            legendrank: 1,
            calibrationSource: "estimate",
            legendGroups: {
                median: splitSpectrumLegendGroups.estimateMedian,
                q50: splitSpectrumLegendGroups.estimateQ50,
                q75: splitSpectrumLegendGroups.estimateQ75,
                q90: splitSpectrumLegendGroups.estimateQ90,
                q95: splitSpectrumLegendGroups.estimateQ95
            }
        }),
        ...buildCalibrationPreviewMeasurementTrace( data, settings, {
            calibrationPreview: options?.calibrationPreview,
            visible: comparisonVisibility.data != false,
            legendrank: 100
        }),
        ...buildCalibrationPreviewEstimateTraces( data, estimate, settings, {
            calibrationPreview: options?.calibrationPreview,
            visibility: comparisonVisibility,
            axes: { xaxis: "x2", yaxis: "y2" },
            legendrank: 101
        })
    ]

    var tracesAll = structuredClone( traces )

    for( const ii in tracesAll ){
        tracesAll[ii].xaxis = "x";
    };

    var layout = {};

    layout.autosize = true;
    layout.xaxis = {};
    layout.xaxis.tickfont = {};
    layout.xaxis.title = {};
    layout.xaxis.title.font = {};

    layout.xaxis.tickfont.size = tickFontSize;
    layout.xaxis.title.text = "$$\\Large " + xLabel + "$$";
    layout.xaxis.title.font.size = labelFontSize
    layout.xaxis.autorange = horizontalReverse;
    layout.xaxis.showgrid = false;

    layout.showlegend = false;
    layout.legend = {};
    layout.legend.font = {};
    layout.legend.font.size = legendFontSize;
    layout.legend.itemwidth = 20;
    layout.legend.orientation = "v"

    layout.margin = {};
    layout.margin.t = 30;
    layout.margin.l = 10 + 2 * labelFontSize;
    layout.margin.r = 100;

    var layoutVertical = structuredClone( layout );
    layoutVertical.grid = {};
    layoutVertical.grid.rows = 2;
    layoutVertical.grid.columns = 1;
    layoutVertical.grid.pattern = "independent";

    layoutVertical.xaxis2 = {};
    layoutVertical.xaxis2.title = {};
    layoutVertical.xaxis2.title.font = {};
    layoutVertical.xaxis2.tickfont = {};
    layoutVertical.xaxis2.tickfont.size = tickFontSize;
    layoutVertical.xaxis2.title.text = "$$\\Large " + xLabel + "$$";
    layoutVertical.xaxis2.title.font.size = labelFontSize
    layoutVertical.xaxis2.autorange = horizontalReverse;

    layoutVertical.yaxis = {};
    layoutVertical.yaxis2 = {};
    layoutVertical.yaxis2.rangemode = "tozero";
    layoutVertical.yaxis.tickfont = {};
    layoutVertical.yaxis2.tickfont = {};
    layoutVertical.yaxis.tickfont.size = tickFontSize;
    layoutVertical.yaxis2.tickfont.size = tickFontSize;
    layoutVertical.yaxis.showgrid = false;
    layoutVertical.xaxis2.showgrid = false;
    layoutVertical.yaxis2.showgrid = false;

    var layoutHorizontal = structuredClone( layout );
    layoutHorizontal.grid = {};
    layoutHorizontal.grid.rows = 1;
    layoutHorizontal.grid.columns = 2;
    layoutHorizontal.grid.pattern = "independent";
    
    layoutHorizontal.xaxis2 = {};
    layoutHorizontal.xaxis2.title = {};
    layoutHorizontal.xaxis2.title.font = {};
    layoutHorizontal.xaxis2.tickfont = {};
    layoutHorizontal.xaxis2.tickfont.size = tickFontSize;
    layoutHorizontal.xaxis2.title.text = "$$\\Large " + xLabel + "$$";
    layoutHorizontal.xaxis2.title.font.size = labelFontSize
    layoutHorizontal.xaxis2.autorange = horizontalReverse;

    layoutHorizontal.yaxis = {};
    layoutHorizontal.yaxis2 = {};
    layoutHorizontal.rangemode = "tozero";
    layoutHorizontal.yaxis.tickfont = {};
    layoutHorizontal.yaxis2.tickfont = {};
    layoutHorizontal.yaxis.tickfont.size = tickFontSize;
    layoutHorizontal.yaxis2.tickfont.size = tickFontSize;
    layoutHorizontal.yaxis.showgrid = false;
    layoutHorizontal.xaxis2.showgrid = false;
    layoutHorizontal.yaxis2.showgrid = false;

    layout.margin.r = 10 + 2 * labelFontSize;
    layout.yaxis = {};
    layout.yaxis.tickfont = {};
    layout.yaxis.tickfont.size = tickFontSize;
    layout.yaxis.showgrid = false;

    layout.yaxis2 = {};
    layout.rangemode = "tozero";
    layout.yaxis2.overlaying = "y";
    layout.yaxis2.side = "right";
    layout.yaxis2.tickfont = {};
    layout.yaxis2.tickfont.size = tickFontSize;
    layout.yaxis2.showgrid = false;

    applySpectrumGridlinesToLayout( layoutVertical, graphContainer, settings, [ "xaxis", "yaxis", "xaxis2", "yaxis2" ] )
    applySpectrumGridlinesToLayout( layoutHorizontal, graphContainer, settings, [ "xaxis", "yaxis", "xaxis2", "yaxis2" ] )
    applySpectrumGridlinesToLayout( layout, graphContainer, settings, [ "xaxis", "yaxis", "yaxis2" ] )

    const activeAxisKeys = settings.layout.layout === "vertical" || settings.layout.layout === "horizontal"
        ? [ "xaxis", "yaxis", "xaxis2", "yaxis2" ]
        : [ "xaxis", "yaxis", "yaxis2" ]
    const config = buildPlotConfig( graphContainer, activeAxisKeys )

    if( settings.layout.layout === "vertical" )   await plotlyNewPlot( Plotly,  graphContainer, traces, layoutVertical, config)
    if( settings.layout.layout === "horizontal" ) await plotlyNewPlot( Plotly,  graphContainer, traces, layoutHorizontal, config)
    if( settings.layout.layout === "single" )     await plotlyNewPlot( Plotly,  graphContainer, tracesAll, layout, config)
    normalizeModebarButtonSpacing( graphContainer )
};


function buildCalibrationLineShape( line = {}, axisRefs = { xref: "x", yref: "paper" } ){
    const xValue = Number( line?.x )
    if( Number.isFinite( xValue ) === false ){
        return null
    }

    return {
        type: "line",
        x0: xValue,
        x1: xValue,
        y0: 0,
        y1: 1,
        xref: axisRefs.xref,
        yref: axisRefs.yref,
        line: {
            color: typeof line?.color === "string" && line.color.length > 0 ? line.color : "black",
            dash: typeof line?.dash === "string" && line.dash.length > 0 ? line.dash : "dash",
            width: Number.isFinite( Number( line?.width ) ) ? Number( line.width ) : 1
        }
    }
}

var showCalibrationLines = async function( lines, graphContainer, settings ){
    const normalizedLines = Array.isArray( lines ) ? lines : ( lines ? [ lines ] : [] )
    const hasSecondAxis = graphContainer?.layout?.xaxis2 !== undefined && graphContainer?.layout?.yaxis2 !== undefined
    const shapes = []

    for( const line of normalizedLines ){
        const primaryShape = buildCalibrationLineShape( line, { xref: "x", yref: "paper" } )
        if( primaryShape !== null ){
            shapes.push( primaryShape )
        }

        if( settings.layout.layout !== "single" && hasSecondAxis ){
            const secondaryShape = buildCalibrationLineShape( line, { xref: "x2", yref: "paper" } )
            if( secondaryShape !== null ){
                shapes.push( secondaryShape )
            }
        }
    }

    await Plotly.relayout( graphContainer, { shapes })
}

var showMarker = async function( marker, graphContainer, settings){
    await showCalibrationLines( marker, graphContainer, settings )
}

var deleteMarker = async function( graphContainer ){
    try{
        Plotly.relayout( graphContainer, { shapes: []})
    } finally {
        return
    }
}


var resize = async function( graphContainer ){
    if( graphContainer === null || graphContainer === undefined ){
        return
    }

    try{
        await Plotly.Plots.resize( graphContainer )
        normalizeModebarButtonSpacing( graphContainer )
    } catch{
        return
    }
}


function hexToRgba(hex, alpha = 1) {
    if( typeof hex === "string" && /^rgba?\(/i.test( hex.trim() ) ){
        const parsedColor = parseRgbaColor( hex )
        if( parsedColor !== null ){
            return `rgba(${parsedColor.r}, ${parsedColor.g}, ${parsedColor.b}, ${alpha})`
        }
    }

    // Remove '#' if present
    hex = hex.replace(/^#/, '');
  
    // If hex is a 3-digit shorthand, expand it to 6 digits
    if (hex.length === 3) {
      hex = hex.split('').map((char) => char + char).join('');
    }
  
    // Parse the hex to get RGB components
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
  
    // Return RGBA string
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

export default {
    initialize,
    renderMeasurementPane,
    renderMeasurementComparisonPane,
    renderEstimatePane,
    renderEstimateComparisonPane,
    comparison,
    setHiddenTraceGroups,
    setHighlightedTraceGroup,
    showMarker,
    deleteMarker,
    showCalibrationLines,
    resize
}
