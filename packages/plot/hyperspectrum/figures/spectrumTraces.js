import { componentColor } from "../pcaColors.js"
import {
    LOWER_LEFT_INSTRUCTION_TEXT,
    TOP_LEFT_INSTRUCTION_TEXT,
    colorWithAlpha,
    normalizeAxisMetadata,
    resolveColorString,
    resolveIntensityAxisTitle,
    resolveSeriesXValues
} from "../shared.js"
import { rgbArrayToString } from "./layoutPrimitives.js"

function buildMeanTrace( x, y, xaxis, yaxis, color, label = "", showLegend = false, legendGroup = "" ){

    var trace = {}
    trace.type = "scatter"
    trace.mode = "lines"
    trace.x = x
    trace.y = y
    trace.xaxis = xaxis
    trace.yaxis = yaxis
    trace.line = { color, width: 2 }
    trace.showlegend = showLegend === true
    if( typeof legendGroup === "string" && legendGroup.length > 0 ){
        trace.legendgroup = legendGroup
    }
    trace.hovertemplate = typeof label === "string" && label.length > 0
        ? label + ": (%{x}, %{y})<extra></extra>"
        : "(%{x}, %{y})<extra></extra>"
    if( typeof label === "string" && label.length > 0 ){
        trace.name = label
    }

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
        intervalOpacity,
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
        intervalOpacity,
        showInterval,
        lineWidth: 2
    }
}

function buildUncertaintyLowerTrace( x, y, xaxis, yaxis, color, legendGroup = "" ){

    var trace = {}
    trace.type = "scatter"
    trace.mode = "lines"
    trace.x = x
    trace.y = y
    trace.xaxis = xaxis
    trace.yaxis = yaxis
    trace.line = { color, width: 0 }
    trace.showlegend = false
    if( typeof legendGroup === "string" && legendGroup.length > 0 ){
        trace.legendgroup = legendGroup
    }
    trace.hovertemplate = "(%{x}, %{y})<extra></extra>"

    return trace
}

function buildUncertaintyUpperTrace( x, y, xaxis, yaxis, color, fillcolor, legendGroup = "" ){

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
    if( typeof legendGroup === "string" && legendGroup.length > 0 ){
        trace.legendgroup = legendGroup
    }
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
    const traceLabel = typeof style?.traceLabel === "string" && style.traceLabel.length > 0
        ? style.traceLabel
        : ( typeof spectrumPayload?.name === "string" ? spectrumPayload.name : "" )
    const traceGroupKey = typeof style?.traceKey === "string" && style.traceKey.length > 0
        ? style.traceKey
        : ( typeof spectrumPayload?.traceGroupKey === "string" ? spectrumPayload.traceGroupKey : traceLabel )

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
                                          style.intervalColor,
                                          traceGroupKey )
            : buildPlaceholderTrace( xValues, xaxis, yaxis )
        const upperTrace = hasBounds
            ? buildUncertaintyUpperTrace( xValues,
                                          normalizedSpectrum.upperBound,
                                          xaxis,
                                          yaxis,
                                          style.intervalColor,
                                          style.intervalFillColor,
                                          traceGroupKey )
            : buildPlaceholderTrace( xValues, xaxis, yaxis )
        const meanTrace = buildMeanTrace( xValues,
                                          normalizedSpectrum.y,
                                          xaxis,
                                          yaxis,
                                          style.lineColor,
                                          traceLabel,
                                          style?.showLegend === true,
                                          traceGroupKey )
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

function normalizeSpectrumPayloadList( payload ){

    if( Array.isArray( payload ) ){
        return payload.filter(( entry ) => entry !== null && entry !== undefined )
    }

    if( payload === null || payload === undefined ){
        return []
    }

    return [ payload ]
}

function buildRoiSpectrumTraceGroups( settings, roiPayloads, spectralAxisValues = [], xaxis = "x2", yaxis = "y2" ){

    const baseStyle = resolveRoiSpectrumStyle( settings )
    const payloads = normalizeSpectrumPayloadList( roiPayloads )
    const fallbackAxisLength = Array.isArray( spectralAxisValues ) && spectralAxisValues.length > 0 ? spectralAxisValues.length : 1
    var traces = []
    var axisValues = resolveSeriesXValues( spectralAxisValues, fallbackAxisLength )
    var usingSpectrum = false

    for( const payload of payloads ){
        const resolvedLineColor = resolveColorString( payload?.lineColor, baseStyle.lineColor )
        const intervalFallback = typeof payload?.lineColor === "string" && payload.lineColor.length > 0
            ? payload.lineColor
            : resolvedLineColor
        const resolvedIntervalColor = resolveColorString( payload?.intervalColor, intervalFallback )
        const group = buildSpectrumTraceGroup(
            {
                ...baseStyle,
                lineColor: resolvedLineColor,
                intervalColor: resolvedIntervalColor,
                intervalFillColor: colorWithAlpha( resolvedIntervalColor, baseStyle.intervalOpacity ),
                traceLabel: typeof payload?.name === "string" ? payload.name : "",
                traceKey: typeof payload?.traceGroupKey === "string" ? payload.traceGroupKey : "",
                showLegend: true
            },
            payload,
            spectralAxisValues,
            xaxis,
            yaxis
        )

        traces.push( ...group.traces )

        if( group.usingSpectrum ){
            axisValues = group.axisValues
            usingSpectrum = true
        }
    }

    return {
        traces,
        axisValues,
        usingSpectrum
    }
}

function buildLowerSpectrumTraces( settings, selectedSpectrum, spectralAxisValues = [], xaxis = "x2", yaxis = "y2" ){
    const group = buildSpectrumTraceGroup(
        {
            ...resolveQueriedSpectrumStyle( settings ),
            showLegend: true
        },
        selectedSpectrum,
        spectralAxisValues,
        xaxis,
        yaxis
    )
    return {
        ...group,
        message: group.usingSpectrum ? "" : LOWER_LEFT_INSTRUCTION_TEXT
    }
}

function buildBottomLeftTraces( settings, bottomLeftSpectrum, selectedSpectrum, spectralAxisValues = [], xaxis = "x2", yaxis = "y2" ){

    const roiPayloads = normalizeSpectrumPayloadList( bottomLeftSpectrum?.rois ?? bottomLeftSpectrum?.roi ?? null )
    const currentPayload = bottomLeftSpectrum?.current ?? null
    const hasCompositePayload = roiPayloads.length > 0 || currentPayload !== null

    if( hasCompositePayload ){
        const roiGroup = buildRoiSpectrumTraceGroups(
            settings,
            roiPayloads,
            spectralAxisValues,
            xaxis,
            yaxis
        )
        const currentGroup = buildSpectrumTraceGroup(
            {
                ...resolveQueriedSpectrumStyle( settings ),
                showLegend: true
            },
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

    const roiPayloads = normalizeSpectrumPayloadList( topLeftSpectrum?.rois ?? topLeftSpectrum?.roi ?? null )
    const currentPayload = topLeftSpectrum?.current ?? null
    const hasCompositePayload = roiPayloads.length > 0 || currentPayload !== null

    if( hasCompositePayload ){
        const roiGroup = buildRoiSpectrumTraceGroups(
            settings,
            roiPayloads,
            spectralAxisValues,
            "x",
            "y"
        )
        const currentGroup = buildSpectrumTraceGroup(
            {
                ...resolveQueriedSpectrumStyle( settings ),
                showLegend: true
            },
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
        const traceGroupKey = typeof selected === "object" && typeof selected.legendKey === "string" && selected.legendKey.length > 0
            ? selected.legendKey
            : `loading-${componentIndex}`

        var trace = {}
        trace.type = "scatter"
        trace.mode = "lines"
        trace.x = x
        trace.y = vector
        trace.xaxis = xaxis
        trace.yaxis = yaxis
        trace.line = { color, width: 2 }
        trace.name = traceLabel
        trace.showlegend = true
        trace.legendgroup = traceGroupKey
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
            color: typeof seriesEntry?.color === "string" ? seriesEntry.color : "",
            legendKey: typeof seriesEntry?.legendKey === "string" ? seriesEntry.legendKey : ""
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

function upperAxisLength( traces ){

    if( Array.isArray( traces ) === false || traces.length === 0 ) return 1

    var maximum = 1

    for( const trace of traces ){
        if( Array.isArray( trace?.x ) === false ) continue
        maximum = Math.max( maximum, trace.x.length )
    }

    return maximum
}

export {
    buildBottomLeftTraces,
    buildLoadingTraces,
    buildPlaceholderTrace,
    buildTopLeftTraces,
    upperAxisLength
}
