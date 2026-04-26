import Plotly from 'plotly.js-dist'

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
    estimateQ95: "estimate-q95"
})

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
    return normalizeLegendGroupKey( legendGroup ).startsWith( "estimate-q" )
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
    return isSpectrumUncertaintyLegendGroup( trace?.legendgroup )
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
    const keepEstimateMedianVisible = isSpectrumUncertaintyLegendGroup( normalizedGroup )
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
            if( traceGroup.length === 0 ){
                return DIMMED_SPECTRUM_TRACE_OPACITY
            }

            if( traceGroup === normalizedGroup ){
                return 1
            }

            if( keepEstimateMedianVisible && traceGroup === splitSpectrumLegendGroups.estimateMedian ){
                return 1
            }

            return isSpectrumUncertaintyLegendGroup( traceGroup )
                ? 1
                : DIMMED_SPECTRUM_TRACE_OPACITY
        }),
        lineWidths: traces.map(( trace ) => {
            const traceGroup = normalizeLegendGroupKey( trace?.legendgroup )
            const isUncertaintyGroup = isSpectrumUncertaintyLegendGroup( traceGroup )

            if( hasMatchingGroup === false ){
                return isUncertaintyGroup
                    ? DEFAULT_SPECTRUM_BAND_LINE_WIDTH
                    : DEFAULT_SPECTRUM_TRACE_LINE_WIDTH
            }

            if( isUncertaintyGroup ){
                return DEFAULT_SPECTRUM_BAND_LINE_WIDTH
            }

            return traceGroup === normalizedGroup
                ? ( emphasizeSelected ? HIGHLIGHTED_SPECTRUM_TRACE_LINE_WIDTH : DEFAULT_SPECTRUM_TRACE_LINE_WIDTH )
                : DEFAULT_SPECTRUM_TRACE_LINE_WIDTH
        }),
        fillAlphas: traces.map(( trace ) => {
            if( isSpectrumFillTrace( trace ) === false ){
                return null
            }

            if( hasMatchingGroup === false ){
                return DEFAULT_SPECTRUM_BAND_FILL_ALPHA
            }

            const traceGroup = normalizeLegendGroupKey( trace?.legendgroup )
            if( traceGroup === normalizedGroup && isSpectrumUncertaintyLegendGroup( traceGroup ) ){
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
    const calibrationOffset = Number( data?.calibration?.x ?? 0 )
    const calibratedDataX = data.x.map(( x ) => x + calibrationOffset )
    const legendLabel = String( options?.legendLabel ?? settings.legends.data ).replace(/\\/g, "\\")
    const color = String( options?.color ?? settings.colors.data )
    const visible = options?.visible === false ? "legendonly" : true

    var trace = {}
    trace.x = calibratedDataX
    trace.y = data.y
    trace.mode = "lines"
    trace.name = "$" + legendLabel + "$"
    trace.line = {
        color: hexToRgba( color, 1 ),
        width: DEFAULT_SPECTRUM_TRACE_LINE_WIDTH
    }
    trace.showlegend = options?.showlegend !== false
    trace.visible = visible
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
    const calibrationOffset = Number( data?.calibration?.x ?? 0 )
    const calibratedEstimateX = estimate.x.map(( x ) => x + calibrationOffset )
    const visibility = options?.visibility ?? settings.visibility.plot
    const medianLabel = String( options?.medianLabel ?? settings.legends.median ).replace(/\\/g, "\\")
    const medianColor = hexToRgba( String( options?.medianColor ?? settings.colors.median ), 1 )
    const areaColor = hexToRgba( String( options?.areaColor ?? settings.colors.area ), 0.10 )
    const areaLineColor = hexToRgba( String( options?.areaLineColor ?? options?.areaColor ?? settings.colors.area ), 0 )
    const legendFlag = String( options?.legendFlag ?? "" )
    const axes = options?.axes ?? { xaxis: "x", yaxis: "y" }
    const legendGroups = options?.legendGroups ?? {}

    var traceEstimate = {}
    traceEstimate.x = calibratedEstimateX
    traceEstimate.y = estimate.median
    traceEstimate.mode = "lines"
    traceEstimate.name = "$" + medianLabel + "$"
    traceEstimate.line = {
        color: medianColor,
        width: DEFAULT_SPECTRUM_TRACE_LINE_WIDTH
    }
    traceEstimate.showlegend = options?.showlegend !== false
    traceEstimate.visible = visibility.median == false ? "legendonly" : true
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
                lineColor: areaLineColor
            }
        )

        traces.push( traceLowerBound, traceUpperBound )
    }

    return traces
}

var renderMeasurementPane = async function( data, graphContainer, settings, options = {} ){
    const showLegend = options?.showlegend === true
    const { layout, config } = singlePaneLayout( graphContainer, settings, { showlegend: showLegend } )
    const traceData = measurementTrace( data, settings, {
        visible: settings.visibility.plot.data != false,
        showlegend: showLegend,
        legendGroup: options?.legendGroup ?? splitSpectrumLegendGroups.measurement
    })

    await Plotly.newPlot( graphContainer, [ traceData ], layout, config )
    normalizeModebarButtonSpacing( graphContainer )
}

var renderMeasurementComparisonPane = async function( data, comparisonData, graphContainer, settings ){
    const { layout, config } = singlePaneLayout( graphContainer, settings )
    const visibility = settings.visibility.comparison ?? {}
    const traces = [
        measurementTrace( data, settings, {
            visible: visibility.data != false,
            legendrank: 0,
            showlegend: false,
            legendGroup: splitSpectrumLegendGroups.measurement
        }),
        measurementTrace( comparisonData, settings, {
            color: settings.comparisonColors.data,
            visible: visibility.data != false,
            legendrank: 1,
            showlegend: false,
            legendGroup: splitSpectrumLegendGroups.measurement
        })
    ]

    await Plotly.newPlot( graphContainer, traces, layout, config )
    normalizeModebarButtonSpacing( graphContainer )
}

var renderEstimatePane = async function( data, estimate, graphContainer, settings ){
    if( hasEstimatePayload( estimate ) === false ){
        Plotly.purge( graphContainer )
        return
    }

    const { layout, config } = singlePaneLayout( graphContainer, settings )
    const traces = estimateTraces( data, estimate, settings, {
        visibility: settings.visibility.plot,
        axes: { xaxis: "x", yaxis: "y" },
        showlegend: false,
        legendGroups: {
            median: splitSpectrumLegendGroups.estimateMedian,
            q50: splitSpectrumLegendGroups.estimateQ50,
            q75: splitSpectrumLegendGroups.estimateQ75,
            q90: splitSpectrumLegendGroups.estimateQ90,
            q95: splitSpectrumLegendGroups.estimateQ95
        }
    })

    await Plotly.newPlot( graphContainer, traces, layout, config )
    normalizeModebarButtonSpacing( graphContainer )
}

var renderEstimateComparisonPane = async function(
    data,
    estimate,
    comparisonData,
    comparisonEstimate,
    graphContainer,
    settings
) {
    if( hasEstimatePayload( estimate ) === false || hasEstimatePayload( comparisonEstimate ) === false ){
        Plotly.purge( graphContainer )
        return
    }

    const { layout, config } = singlePaneLayout( graphContainer, settings )
    const visibility = settings.visibility.comparison ?? {}
    const traces = [
        ...estimateTraces( data, estimate, settings, {
            visibility,
            axes: { xaxis: "x", yaxis: "y" },
            legendFlag: "",
            legendrank: 0,
            showlegend: false,
            legendGroups: {
                median: splitSpectrumLegendGroups.estimateMedian,
                q50: splitSpectrumLegendGroups.estimateQ50,
                q75: splitSpectrumLegendGroups.estimateQ75,
                q90: splitSpectrumLegendGroups.estimateQ90,
                q95: splitSpectrumLegendGroups.estimateQ95
            }
        }),
        ...estimateTraces( comparisonData, comparisonEstimate, settings, {
            visibility,
            axes: { xaxis: "x", yaxis: "y" },
            medianColor: settings.comparisonColors.median,
            areaColor: settings.comparisonColors.area,
            legendFlag: "2",
            legendrank: 10,
            showlegend: false,
            legendGroups: {
                median: splitSpectrumLegendGroups.estimateMedian,
                q50: splitSpectrumLegendGroups.estimateQ50,
                q75: splitSpectrumLegendGroups.estimateQ75,
                q90: splitSpectrumLegendGroups.estimateQ90,
                q95: splitSpectrumLegendGroups.estimateQ95
            }
        })
    ]

    await Plotly.newPlot( graphContainer, traces, layout, config )
    normalizeModebarButtonSpacing( graphContainer )
}

var initializeDataOnly = async function( data, graphContainer, settings ){
    await renderMeasurementPane( data, graphContainer, settings )
}

var initialize = async function( data, estimate, graphContainer, settings) {

    if( hasEstimatePayload( estimate ) === false ){
        await initializeDataOnly( data, graphContainer, settings )
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

    const calibratedDataX = data.x.map( x => x + data.calibration.x);
    const calibratedEstimateX = estimate.x.map( x => x + data.calibration.x);

    var traceData = {};
    traceData.x = calibratedDataX;
    traceData.y = data.y;
    traceData.mode = "lines";
    traceData.name = "$" + dataLegend  + "$";
    traceData.line = {};
    traceData.line.color = dataColorRGBA;
    traceData.line.width = DEFAULT_SPECTRUM_TRACE_LINE_WIDTH;
    traceData.showlegend = false;
    traceData.visible = settings.visibility.plot.data == false ? "legendonly" : true;
    traceData.legendrank = 0;
    traceData.legendgroup = splitSpectrumLegendGroups.measurement;
    traceData.hovertemplate = "(%{x}, %{y})<extra></extra>"

    var traceEstimate = {};
    traceEstimate.x = calibratedEstimateX;
    traceEstimate.y = estimate.median;
    traceEstimate.mode = "lines";
    traceEstimate.name = "$" + medianLabel + "$";
    traceEstimate.line = {};
    traceEstimate.line.color = medianColorRGBA;
    traceEstimate.line.width = DEFAULT_SPECTRUM_TRACE_LINE_WIDTH;
    traceEstimate.showlegend = false;
    traceEstimate.visible = settings.visibility.plot.median == false ? "legendonly" : true;
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
                                                                        lineColor: areaLineColorRGBA
                                                                    });

        traces.push( traceLowerBound, traceUpperBound)
    }

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

    if( settings.layout.layout === "vertical" )   await Plotly.newPlot( graphContainer, traces, layoutVertical, config)
    if( settings.layout.layout === "horizontal" ) await Plotly.newPlot( graphContainer, traces, layoutHorizontal, config)
    if( settings.layout.layout === "single" )     await Plotly.newPlot( graphContainer, tracesAll, layout, config)
    normalizeModebarButtonSpacing( graphContainer )
};

function uncertaintyTraces( x, lowerBounds, upperBounds, quantile, legends, visibility, color, flag = "", axes = { xaxis: "x2", yaxis: "y2" }, options = {} ){

    const legend = legends[ quantile ]
    const legendGroup = normalizeLegendGroupKey( options?.legendGroup ) || "uncertainty" + quantile + flag
    const lineColor = typeof options?.lineColor === "string" && options.lineColor.length > 0
        ? options.lineColor
        : color

    var traceLowerBound = {};
    traceLowerBound.x = x;
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
    traceLowerBound.legendgroup = legendGroup;
    traceLowerBound.hovertemplate = "(%{x}, %{y})<extra></extra>"

    var traceUpperBound = {};
    traceUpperBound.x = x;
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
                                 comparisonData, comparisonEstimate,
                                 graphContainer, settings) {

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

    const dataComparisonColorRGBA = hexToRgba( settings.comparisonColors.data, 1);
    const medianComparisonColorRGBA = hexToRgba( settings.comparisonColors.median, 1);
    const areaComparisonColorRGBA = hexToRgba( settings.comparisonColors.area, 0.10);
    const areaLineColorRGBA = hexToRgba( settings.colors.area, 0);
    const areaComparisonLineColorRGBA = hexToRgba( settings.comparisonColors.area, 0);

    const calibratedDataX = data.x.map( x => x + data.calibration.x);
    const calibratedEstimateX = estimate.x.map( x => x + data.calibration.x);

    const calibrateComparisondDataX = comparisonData.x.map( x => x + comparisonData.calibration.x);
    const calibratedComparisonEstimateX = comparisonEstimate.x.map( x => x + comparisonData.calibration.x);

    var traceData = {};
    traceData.x = calibratedDataX;
    traceData.y = data.y;
    traceData.mode = "lines";
    traceData.name = "$" + dataLegend  + "$";
    traceData.line = {};
    traceData.line.color = dataColorRGBA;
    traceData.line.width = DEFAULT_SPECTRUM_TRACE_LINE_WIDTH;
    traceData.visible = settings.visibility.comparison.data == false ? "legendonly" : true;
    traceData.showlegend = false;
    traceData.legendrank = 0;
    traceData.legendgroup = splitSpectrumLegendGroups.measurement;
    traceData.hovertemplate = "(%{x}, %{y})<extra></extra>"

    var traceEstimate = {};
    traceEstimate.x = calibratedEstimateX;
    traceEstimate.y = estimate.median;
    traceEstimate.mode = "lines";
    traceEstimate.name = "$" + medianLabel + "$";
    traceEstimate.line = {};
    traceEstimate.line.color = medianColorRGBA;
    traceEstimate.line.width = DEFAULT_SPECTRUM_TRACE_LINE_WIDTH;
    traceEstimate.visible = settings.visibility.comparison.median == false ? "legendonly" : true;
    traceEstimate.showlegend = false;
    traceEstimate.legendrank = 1;
    traceEstimate.legendgroup = splitSpectrumLegendGroups.estimateMedian;
    traceEstimate.xaxis = "x2";
    traceEstimate.yaxis = "y2";
    traceEstimate.hovertemplate = "(%{x}, %{y})<extra></extra>"

    var traceDataComparison = {};
    traceDataComparison.x = calibrateComparisondDataX;
    traceDataComparison.y = comparisonData.y;
    traceDataComparison.mode = "lines";
    traceDataComparison.name = "$" + dataLegend  + "$";
    traceDataComparison.line = {};
    traceDataComparison.line.color = dataComparisonColorRGBA;
    traceDataComparison.line.width = DEFAULT_SPECTRUM_TRACE_LINE_WIDTH;
    traceDataComparison.visible = settings.visibility.comparison.data == false ? "legendonly" : true;
    traceDataComparison.showlegend = false;
    traceDataComparison.legendgroup = splitSpectrumLegendGroups.measurement;
    traceDataComparison.hovertemplate = "(%{x}, %{y})<extra></extra>"

    var traceEstimateComparison = {};
    traceEstimateComparison.x = calibratedComparisonEstimateX;
    traceEstimateComparison.y = comparisonEstimate.median;
    traceEstimateComparison.mode = "lines";
    traceEstimateComparison.name = "$" + medianLabel + "$";
    traceEstimateComparison.line = {};
    traceEstimateComparison.line.color = medianComparisonColorRGBA;
    traceEstimateComparison.line.width = DEFAULT_SPECTRUM_TRACE_LINE_WIDTH;
    traceEstimateComparison.visible = settings.visibility.comparison.median == false ? "legendonly" : true;
    traceEstimateComparison.showlegend = false;
    traceEstimateComparison.legendgroup = splitSpectrumLegendGroups.estimateMedian;
    traceEstimateComparison.xaxis = "x2";
    traceEstimateComparison.yaxis = "y2";
    traceEstimateComparison.hovertemplate = "(%{x}, %{y})<extra></extra>"

    const quantiles = [ 50, 75, 90, 95];

    var traces = [];
    traces.push( traceData, traceEstimate);

    for( var ii = 0; ii < quantiles.length; ii++ ){

        var [ traceLowerBound, traceUpperBound] = uncertaintyTraces( estimate.x,
                                                                    estimate.lowerBound,
                                                                    estimate.upperBound,
                                                                    quantiles[ii],
                                                                    legends,
                                                                    settings.visibility.comparison,
                                                                    areaColorRGBA,
                                                                    "",
                                                                    { xaxis: "x2", yaxis: "y2" },
                                                                    {
                                                                        legendGroup: splitSpectrumLegendGroups[`estimateQ${quantiles[ii]}`],
                                                                        showlegend: false,
                                                                        lineColor: areaLineColorRGBA
                                                                    });

        traces.push( traceLowerBound, traceUpperBound)
    }

    traces.push( traceDataComparison, traceEstimateComparison)

    for( var ii = 0; ii < quantiles.length; ii++ ){

        var [ traceLowerBound, traceUpperBound] = uncertaintyTraces( comparisonEstimate.x,
                                                                    comparisonEstimate.lowerBound,
                                                                    comparisonEstimate.upperBound,
                                                                    quantiles[ii],
                                                                    legends,
                                                                    settings.visibility.comparison,
                                                                    areaComparisonColorRGBA,
                                                                    "2",
                                                                    { xaxis: "x2", yaxis: "y2" },
                                                                    {
                                                                        legendGroup: splitSpectrumLegendGroups[`estimateQ${quantiles[ii]}`],
                                                                        showlegend: false,
                                                                        lineColor: areaComparisonLineColorRGBA
                                                                    });

        traces.push( traceLowerBound, traceUpperBound)
    }

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

    if( settings.layout.layout === "vertical" )   await Plotly.newPlot( graphContainer, traces, layoutVertical, config)
    if( settings.layout.layout === "horizontal" ) await Plotly.newPlot( graphContainer, traces, layoutHorizontal, config)
    if( settings.layout.layout === "single" )     await Plotly.newPlot( graphContainer, tracesAll, layout, config)
    normalizeModebarButtonSpacing( graphContainer )
};


var showMarker = async function( marker, graphContainer, settings){
    
    var updatedShape = {}
    updatedShape.type = "line";
    updatedShape.x0 = marker.x;
    updatedShape.x1 = marker.x;

    updatedShape.y0 = 0;
    updatedShape.y1 = 10;

    updatedShape.xref = "x";
    updatedShape.yref = "y";

    updatedShape.line = {};
    updatedShape.line.color = "black";
    updatedShape.line.dash = "dash";

    var updatedShapeSecondAxis = structuredClone( updatedShape );
    updatedShapeSecondAxis.xref = "x2";
    updatedShapeSecondAxis.yref = "y2";

    const updatedShapes = [ updatedShape, updatedShapeSecondAxis]

    const hasSecondAxis = graphContainer?.layout?.xaxis2 !== undefined && graphContainer?.layout?.yaxis2 !== undefined

    if( settings.layout.layout !== "single" && hasSecondAxis ){
        Plotly.relayout( graphContainer, { shapes: updatedShapes });
    } else {
        Plotly.relayout( graphContainer, { shapes: updatedShape })
    };
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
    resize
}
