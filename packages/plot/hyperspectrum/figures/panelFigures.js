import {
    STANDALONE_SPECTRUM_GRID_AXIS_KEYS,
    normalizeAxisMetadata,
    resolveSeriesXValues
} from "../shared.js"
import {
    buildSpectrumGridAvailabilityMap,
    buildStandaloneLowerPanelLayout,
    buildStandaloneUpperPanelLayout,
    resolveDefaultHyperspectrumGridlinesForSource
} from "./layoutPrimitives.js"
import {
    buildBottomLeftTraces,
    buildLoadingTraces,
    buildPlaceholderTrace,
    buildTopLeftTraces
} from "./spectrumTraces.js"

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
        externalLegendToggle: true,
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

export {
    buildLowerPanelFigure,
    buildUpperPanelFigure
}
