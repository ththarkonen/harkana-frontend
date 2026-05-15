import Plotly from "plotly.js-dist"
import { FULL_HEATMAP_AXIS_CONFIG } from "../shared.js"
import { resolveStoredHeatmapOrigin } from "../rendererMode.js"

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

export {
    getHeatmapPaneState,
    relayoutHeatmapViewport,
    resetHeatmapViewport,
    resolveExternalRendererYRange,
    resolveHeatmapAxisConfig,
    resolveHeatmapViewport,
    sanitizeAxisRange
}
