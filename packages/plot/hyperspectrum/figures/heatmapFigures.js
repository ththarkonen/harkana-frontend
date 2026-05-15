import { shouldUseExternalHeatmapRenderer } from "../rendererMode.js"
import {
    COMBINED_SPECTRUM_GRID_AXIS_KEYS,
    normalizeAxisMetadata,
    resolveHeatmapColorscale,
    resolveIntensityAxisTitle,
    resolveSeriesXValues
} from "../shared.js"
import {
    buildBaseLayout,
    buildHeatmapPaneLayout,
    buildSpectrumGridAvailabilityMap,
    buildSpectrumGridDefaultVisibilityMap,
    resolveDefaultHyperspectrumGridlinesForSource
} from "./layoutPrimitives.js"
import {
    buildBottomLeftTraces,
    buildPlaceholderTrace,
    buildTopLeftTraces,
    upperAxisLength
} from "./spectrumTraces.js"

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

export {
    buildFigure,
    buildHeatmapPaneFigure,
    buildPcaFigure,
    buildPcaMipFigure,
    buildPcaRgbFigure,
    buildRgbFigure
}
