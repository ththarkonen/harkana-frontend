import Plotly from "plotly.js-dist"
import {
    TOP_LEFT_INSTRUCTION_TEXT,
    formatAxisTitle,
    normalizeAxisMetadata,
    resolveIntensityAxisTitle,
    sanitizeLatexLabel,
    valueLatexTicks
} from "./shared.js"
import {
    buildSidePanelInstructionAnnotations
} from "./figures/layoutPrimitives.js"
import {
    buildBottomLeftTraces
} from "./figures/spectrumTraces.js"
import {
    buildFigure,
    buildHeatmapPaneFigure,
    buildPcaFigure,
    buildPcaMipFigure,
    buildPcaRgbFigure,
    buildRgbFigure
} from "./figures/heatmapFigures.js"
import {
    buildLowerPanelFigure,
    buildUpperPanelFigure
} from "./figures/panelFigures.js"
import {
    getHeatmapPaneState,
    relayoutHeatmapViewport,
    resetHeatmapViewport,
    resolveExternalRendererYRange,
    resolveHeatmapAxisConfig,
    resolveHeatmapViewport,
    sanitizeAxisRange
} from "./figures/viewport.js"

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

async function updateLowerSpectrum( graphContainer, spectrum, options = {} ){

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

export {
    buildFigure,
    buildHeatmapPaneFigure,
    buildLowerPanelFigure,
    buildPcaFigure,
    buildPcaMipFigure,
    buildPcaRgbFigure,
    buildRgbFigure,
    buildUpperPanelFigure,
    findLowerSpectrumTraceIndices,
    findTraceIndicesForAxes,
    getHeatmapPaneState,
    relayoutHeatmapViewport,
    resetHeatmapViewport,
    resolveExternalRendererYRange,
    resolveHeatmapAxisConfig,
    resolveHeatmapViewport,
    sanitizeAxisRange,
    updateLowerSpectrum
}
