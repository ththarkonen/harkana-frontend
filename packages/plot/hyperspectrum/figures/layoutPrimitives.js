import {
    clampUnit,
    colorWithAlpha,
    defaultSpectrumLegendLayout,
    formatAxisTitle,
    indexedLatexTicks,
    latexTicks,
    normalizeAxisMetadata,
    resolveColorString,
    resolveIntensityAxisTitle,
    sanitizeLatexLabel,
    squareDomains,
    valueLatexTicks,
    STANDALONE_HEATMAP_AXIS_CONFIG
} from "../shared.js"
import { resolveHeatmapViewport } from "./viewport.js"

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
    layout.legend = defaultSpectrumLegendLayout()
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
    layout.legend = defaultSpectrumLegendLayout()
    layout.margin = {
        t: 20,
        r: 32,
        b: 40 + labelFontSize,
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
            font: { size: labelFontSize },
            standoff: 2
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
    layout.legend = defaultSpectrumLegendLayout()

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

function normalizeSpectrumGridlineVisibility( value, fallback = false ){
    if( typeof value === "boolean" ) return value
    if( typeof value === "string" ){
        if( value === "true" ) return true
        if( value === "false" ) return false
    }
    return fallback
}

function buildSpectrumGridDefaultVisibilityMap( axisKeys, visible ){

    const normalizedVisible = normalizeSpectrumGridlineVisibility( visible, false )
    var visibilityMap = {}

    for( const axisKey of axisKeys ){
        visibilityMap[axisKey] = normalizedVisible
    }

    return visibilityMap
}

function buildSpectrumGridAvailabilityMap( axisKeys, available ){

    const normalizedAvailable = available !== false
    var availabilityMap = {}

    for( const axisKey of axisKeys ){
        availabilityMap[axisKey] = normalizedAvailable
    }

    return availabilityMap
}

function rgbArrayToString( rgb ){

    if( Array.isArray( rgb ) === false || rgb.length < 3 ) return "rgb(51, 51, 51)"

    const red = Math.max( 0, Math.min( 255, Number.parseInt( rgb[0], 10 ) || 0 ))
    const green = Math.max( 0, Math.min( 255, Number.parseInt( rgb[1], 10 ) || 0 ))
    const blue = Math.max( 0, Math.min( 255, Number.parseInt( rgb[2], 10 ) || 0 ))

    return "rgb(" + red + ", " + green + ", " + blue + ")"
}

export {
    buildBaseLayout,
    buildHeatmapPaneLayout,
    buildSidePanelInstructionAnnotations,
    buildSpectrumGridAvailabilityMap,
    buildSpectrumGridDefaultVisibilityMap,
    buildStandaloneLowerPanelLayout,
    buildStandaloneUpperPanelLayout,
    resolveDefaultHyperspectrumGridlinesForSource,
    rgbArrayToString
}
