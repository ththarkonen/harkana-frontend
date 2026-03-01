import Plotly from "plotly.js-dist"

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
const TOP_LEFT_INSTRUCTION_TEXT = "Select a region of interest (ROI) from the sidebar to view its stored spectrum here.<br>Save a heatmap selection to create a new region of interest (ROI)."
const LOWER_LEFT_INSTRUCTION_TEXT = "Enable Select spectra in the sidebar, then drag a region or click a pixel to view a spectrum here."
var pcaComponentColors = DEFAULT_PCA_COMPONENT_COLOR_STRINGS
    .map(( color ) => parseColorValue( color ))
    .filter(( color ) => color !== null )

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

var updateLowerSpectrum = async function( graphContainer, spectrum, options = {} ){

    if( !graphContainer ) return

    const axes = normalizeAxisMetadata( options?.axes )
    const traces = Array.isArray( graphContainer.data ) ? graphContainer.data : []
    const traceIndices = findLowerSpectrumTraceIndices( traces )
    if( traceIndices.length === 0 ) return

    const lowerPlot = buildLowerSpectrumTraces( options?.settings ?? {},
                                                spectrum,
                                                axes.zValues )
    const lowerTraceCount = Math.min( traceIndices.length, lowerPlot.traces.length )
    if( lowerTraceCount <= 0 ) return

    const lowerAxisTicks = valueLatexTicks( lowerPlot.axisValues )
    const settings = options?.settings ?? {}
    const spectralLabel = sanitizeLatexLabel( settings?.labels?.spectral, "\\nu" )
    const spectralTitle = formatAxisTitle( spectralLabel, axes.zUnit, settings?.labels?.showUnits !== false && settings?.labels?.showUnits !== "false" )
    const annotations = buildSidePanelInstructionAnnotations(
        graphContainer?.layout ?? {},
        TOP_LEFT_INSTRUCTION_TEXT,
        lowerPlot.usingSpectrum ? "" : LOWER_LEFT_INSTRUCTION_TEXT
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
                               "yaxis2.title.text": lowerPlot.usingSpectrum ? "$$\\Large I$$" : ""
                           } )
}

var configureHeatmapInteraction = async function( graphContainer, options = {} ){

    if( !graphContainer ) return

    const mode = normalizeHeatmapInteractionMode( options.mode )
    const width = Number.isInteger( Number( options.width )) ? Math.max( 1, Number( options.width )) : inferHeatmapWidth( graphContainer )
    const height = Number.isInteger( Number( options.height )) ? Math.max( 1, Number( options.height )) : inferHeatmapHeight( graphContainer )
    graphContainer.__harkanaHeatmapInteractionMode = mode

    detachHeatmapPointerSelection( graphContainer )

    if( typeof graphContainer.removeAllListeners === "function" ){
        graphContainer.removeAllListeners( "plotly_click" )
        graphContainer.removeAllListeners( "plotly_relayout" )
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

async function renderMatrix( mip, graphContainer, settings, options, preferReact ){

    if( !graphContainer ) return

    const matrix = normalizeMip( mip )
    const figure = buildFigure( matrix, graphContainer, settings, options )

    await renderFigure( graphContainer, figure, preferReact )
}

async function renderRgbMatrix( mipRgb, graphContainer, settings, options, preferReact ){

    if( !graphContainer ) return

    const rgbMatrix = normalizeRgbMip( mipRgb )
    const rgbComposite = buildRgbMipImage( rgbMatrix )
    const figure = buildRgbFigure( rgbComposite, graphContainer, settings, options )

    await renderFigure( graphContainer, figure, preferReact )
}

async function renderPcaClassification( scoresByComponent, graphContainer, settings, options, preferReact ){

    if( !graphContainer ) return

    const componentScores = normalizePcaScores( scoresByComponent )
    const classification = buildPcaClassificationImage( componentScores )
    const figure = buildPcaFigure( classification, graphContainer, settings, options )

    await renderFigure( graphContainer, figure, preferReact )
}

async function renderPcaRgb( scoresByComponent, graphContainer, settings, options, preferReact ){

    if( !graphContainer ) return

    const componentScores = normalizePcaScores( scoresByComponent )
    const rgbComposite = buildPcaRgbImage( componentScores, options )
    const figure = buildPcaRgbFigure( rgbComposite, graphContainer, settings, options )

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
    const xaxis = fullLayout?.xaxis3
    const yaxis = fullLayout?.yaxis3

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
    const yAxisAutoRange = yaxis?.autorange ?? fullLayout?.yaxis3?.autorange
    const isTopLeftOrigin = yAxisAutoRange === "reversed"

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

    const xDomain = Array.isArray( fullLayout?.xaxis3?.domain ) ? fullLayout.xaxis3.domain : null
    const yDomain = Array.isArray( fullLayout?.yaxis3?.domain ) ? fullLayout.yaxis3.domain : null

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

    const range = graphContainer?.layout?.xaxis3?.range
    if( Array.isArray( range ) && range.length === 2 ){
        const width = Math.round( Number( range[1] ) - Number( range[0] ))
        if( Number.isFinite( width ) && width > 0 ){
            return width
        }
    }

    return 1
}

function inferHeatmapHeight( graphContainer ){

    const range = graphContainer?.layout?.yaxis3?.range
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

    return xaxisID === "x3" && yaxisID === "y3"
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

    var points = []
    for( const y of yIndices ){
        for( const x of xIndices ){
            points.push([ x, y ])
        }
    }

    return {
        xIndices,
        yIndices,
        points
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
        displaylogo: false
    }

    const hasExistingFigure = Array.isArray( graphContainer.data ) && graphContainer.data.length > 0

    if( preferReact || hasExistingFigure ){
        await Plotly.react( graphContainer, figure.traces, figure.layout, config )
        return
    }

    await Plotly.newPlot( graphContainer, figure.traces, figure.layout, config )
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
    return buildSpectrumTraceGroup( resolveQueriedSpectrumStyle( settings ), selectedSpectrum, spectralAxisValues, xaxis, yaxis )
}

function buildTopLeftTraces( settings, topLeftSpectrum, spectralAxisValues = [], fallbackTraces = [], fallbackLabel = "" ){

    const roiPayload = topLeftSpectrum?.roi ?? null
    if( roiPayload !== null ){
        const roiGroup = buildSpectrumTraceGroup(
            resolveRoiSpectrumStyle( settings ),
            roiPayload,
            spectralAxisValues,
            "x",
            "y"
        )
        const currentGroup = buildSpectrumTraceGroup(
            resolveQueriedSpectrumStyle( settings ),
            topLeftSpectrum?.current ?? null,
            spectralAxisValues,
            "x",
            "y"
        )

        return {
            traces: [ ...roiGroup.traces, ...currentGroup.traces ],
            axisValues: roiGroup.axisValues,
            label: "$$\\Large I$$"
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
        message: TOP_LEFT_INSTRUCTION_TEXT
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

function buildFigure( matrix, graphContainer, settings, options = {} ){

    const height = matrix.length
    const width = matrix[0].length
    const axes = normalizeAxisMetadata( options?.axes )
    const x = Array.from({ length: width }, (_, index ) => index )
    const y = Array.from({ length: height }, (_, index ) => index )

    const defaultUpperAxisValues = resolveSeriesXValues( axes.zValues,
                                                         Array.isArray( axes.zValues ) && axes.zValues.length > 0 ? axes.zValues.length : 1 )
    const topLeftPlot = buildTopLeftTraces(
        settings,
        options.topLeftSpectrum,
        axes.zValues,
        [ buildPlaceholderTrace( defaultUpperAxisValues, "x", "y" ) ],
        ""
    )
    const lowerPlot = buildLowerSpectrumTraces( settings,
                                                options.selectedSpectrum,
                                                axes.zValues )

    var heatmapTrace = {}
    heatmapTrace.type = "heatmap"
    heatmapTrace.z = matrix
    heatmapTrace.x = x
    heatmapTrace.y = y
    heatmapTrace.xaxis = "x3"
    heatmapTrace.yaxis = "y3"
    heatmapTrace.colorscale = resolveHeatmapColorscale( options.colorscale )
    heatmapTrace.xgap = 0
    heatmapTrace.ygap = 0
    heatmapTrace.zsmooth = false
    heatmapTrace.showscale = false
    heatmapTrace.hovertemplate = "(%{x}, %{y})<br>Intensity: %{z}<extra></extra>"

    const layout = buildBaseLayout( width,
                                    height,
                                    graphContainer,
                                    settings,
                                    topLeftPlot.label,
                                    "$$\\Large I$$",
                                    {
                                        axes,
                                        upperAxisValues: topLeftPlot.axisValues,
                                        lowerAxisValues: lowerPlot.axisValues,
                                        upperPanelMessage: topLeftPlot.message,
                                        lowerPanelMessage: lowerPlot.usingSpectrum ? "" : LOWER_LEFT_INSTRUCTION_TEXT,
                                        heatmapXValues: axes.xValues,
                                        heatmapYValues: axes.yValues,
                                        roiOverlays: options.roiOverlays
                                    } )

    return {
        traces: [ ...topLeftPlot.traces, ...lowerPlot.traces, heatmapTrace ],
        layout
    }
}

function buildRgbFigure( rgbComposite, graphContainer, settings, options = {} ){

    const width = rgbComposite.width
    const height = rgbComposite.height
    const axes = normalizeAxisMetadata( options?.axes )

    const x = Array.from({ length: width }, (_, index ) => index )
    const y = Array.from({ length: height }, (_, index ) => index )

    const defaultUpperAxisValues = resolveSeriesXValues( axes.zValues,
                                                         Array.isArray( axes.zValues ) && axes.zValues.length > 0 ? axes.zValues.length : 1 )
    const topLeftPlot = buildTopLeftTraces(
        settings,
        options.topLeftSpectrum,
        axes.zValues,
        [ buildPlaceholderTrace( defaultUpperAxisValues, "x", "y" ) ],
        ""
    )
    const lowerPlot = buildLowerSpectrumTraces( settings,
                                                options.selectedSpectrum,
                                                axes.zValues )

    var rgbTrace = {}
    rgbTrace.type = "image"
    rgbTrace.source = rgbComposite.source
    rgbTrace.x0 = -0.5
    rgbTrace.y0 = -0.5
    rgbTrace.dx = 1
    rgbTrace.dy = 1
    rgbTrace.xaxis = "x3"
    rgbTrace.yaxis = "y3"
    rgbTrace.hovertemplate = "(%{x}, %{y})<extra></extra>"

    const layout = buildBaseLayout( width,
                                    height,
                                    graphContainer,
                                    settings,
                                    topLeftPlot.label,
                                    "$$\\Large I$$",
                                    {
                                        axes,
                                        upperAxisValues: topLeftPlot.axisValues,
                                        lowerAxisValues: lowerPlot.axisValues,
                                        upperPanelMessage: topLeftPlot.message,
                                        lowerPanelMessage: lowerPlot.usingSpectrum ? "" : LOWER_LEFT_INSTRUCTION_TEXT,
                                        heatmapXValues: axes.xValues,
                                        heatmapYValues: axes.yValues,
                                        roiOverlays: options.roiOverlays
                                    } )

    return {
        traces: [ ...topLeftPlot.traces, ...lowerPlot.traces, rgbTrace ],
        layout
    }
}

function buildPcaFigure( classification, graphContainer, settings, options = {} ){

    const width = classification.width
    const height = classification.height
    const axes = normalizeAxisMetadata( options?.axes )

    const x = Array.from({ length: width }, (_, index ) => index )
    const y = Array.from({ length: height }, (_, index ) => index )

    const loadingTraces = buildLoadingTraces( options.loadings, options, "x", "y" )

    const defaultUpperAxisValues = resolveSeriesXValues( axes.zValues,
                                                         Array.isArray( axes.zValues ) && axes.zValues.length > 0 ? axes.zValues.length : 1 )
    const defaultUpperTrace = buildPlaceholderTrace( defaultUpperAxisValues, "x", "y" )
    const fallbackUpperTraces = loadingTraces.length > 0 ? loadingTraces : [ defaultUpperTrace ]
    const topLeftPlot = buildTopLeftTraces(
        settings,
        options.topLeftSpectrum,
        axes.zValues,
        fallbackUpperTraces,
        loadingTraces.length > 0 ? "$$\\Large p_{k}$$" : ""
    )

    const lowerPlot = buildLowerSpectrumTraces( settings,
                                                options.selectedSpectrum,
                                                axes.zValues )

    var classificationTrace = {}
    classificationTrace.type = "image"
    classificationTrace.source = classification.source
    classificationTrace.x0 = -0.5
    classificationTrace.y0 = -0.5
    classificationTrace.dx = 1
    classificationTrace.dy = 1
    classificationTrace.xaxis = "x3"
    classificationTrace.yaxis = "y3"
    classificationTrace.hovertemplate = "(%{x}, %{y})<extra></extra>"

    const layout = buildBaseLayout( width,
                                    height,
                                    graphContainer,
                                    settings,
                                    topLeftPlot.label,
                                    "$$\\Large I$$",
                                    {
                                        axes,
                                        upperAxisValues: topLeftPlot.axisValues,
                                        lowerAxisValues: lowerPlot.axisValues,
                                        upperPanelMessage: topLeftPlot.message,
                                        lowerPanelMessage: lowerPlot.usingSpectrum ? "" : LOWER_LEFT_INSTRUCTION_TEXT,
                                        heatmapXValues: axes.xValues,
                                        heatmapYValues: axes.yValues,
                                        roiOverlays: options.roiOverlays
                                    } )

    return {
        traces: [ ...topLeftPlot.traces, ...lowerPlot.traces, classificationTrace ],
        layout
    }
}

function buildPcaRgbFigure( rgbComposite, graphContainer, settings, options = {} ){

    const width = rgbComposite.width
    const height = rgbComposite.height
    const axes = normalizeAxisMetadata( options?.axes )

    const x = Array.from({ length: width }, (_, index ) => index )
    const y = Array.from({ length: height }, (_, index ) => index )

    const loadingTraces = buildLoadingTraces( options.loadings, options, "x", "y" )

    const defaultUpperAxisValues = resolveSeriesXValues( axes.zValues,
                                                         Array.isArray( axes.zValues ) && axes.zValues.length > 0 ? axes.zValues.length : 1 )
    const defaultUpperTrace = buildPlaceholderTrace( defaultUpperAxisValues, "x", "y" )
    const fallbackUpperTraces = loadingTraces.length > 0 ? loadingTraces : [ defaultUpperTrace ]
    const topLeftPlot = buildTopLeftTraces(
        settings,
        options.topLeftSpectrum,
        axes.zValues,
        fallbackUpperTraces,
        loadingTraces.length > 0 ? "$$\\Large p_{k}$$" : ""
    )

    const lowerPlot = buildLowerSpectrumTraces( settings,
                                                options.selectedSpectrum,
                                                axes.zValues )

    var rgbTrace = {}
    rgbTrace.type = "image"
    rgbTrace.source = rgbComposite.source
    rgbTrace.x0 = -0.5
    rgbTrace.y0 = -0.5
    rgbTrace.dx = 1
    rgbTrace.dy = 1
    rgbTrace.xaxis = "x3"
    rgbTrace.yaxis = "y3"
    rgbTrace.hovertemplate = "(%{x}, %{y})<extra></extra>"

    const layout = buildBaseLayout( width,
                                    height,
                                    graphContainer,
                                    settings,
                                    topLeftPlot.label,
                                    "$$\\Large I$$",
                                    {
                                        axes,
                                        upperAxisValues: topLeftPlot.axisValues,
                                        lowerAxisValues: lowerPlot.axisValues,
                                        upperPanelMessage: topLeftPlot.message,
                                        lowerPanelMessage: lowerPlot.usingSpectrum ? "" : LOWER_LEFT_INSTRUCTION_TEXT,
                                        heatmapXValues: axes.xValues,
                                        heatmapYValues: axes.yValues,
                                        roiOverlays: options.roiOverlays
                                    } )

    return {
        traces: [ ...topLeftPlot.traces, ...lowerPlot.traces, rgbTrace ],
        layout
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
    layout.xaxis3.range = [ -0.5, width - 0.5 ]
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
    layout.yaxis3.range = [ -0.5, height - 0.5 ]
    layout.yaxis3.autorange = heatmapOrigin === "top-left" ? "reversed" : true
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

function resolveHeatmapColorscale( colorscale ){

    if( typeof colorscale === "string" && SUPPORTED_HEATMAP_COLOR_SCALES.has( colorscale ) ){
        return colorscale
    }

    return "Viridis"
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
    } else if([ "cm^-1", "cm-1", "cm^{-1}", "1/cm" ].includes( canonical )){
        latexUnit = "cm^{-1}"
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

function normalizePcaScores( scoresByComponent ){

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

    return entries
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

function buildRgbMipImage( rgbMatrix ){

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
    var intensityMatrix = Array.from({ length: height }, () => Array( width ).fill( 0 ))

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

            intensityMatrix[row][col] = ( red + green + blue ) / ( 3 * 255 )
        }
    }

    context.putImageData( imageData, 0, 0 )

    return {
        source: canvas.toDataURL( "image/png" ),
        width,
        height,
        intensityMatrix
    }
}

function buildPcaClassificationImage( componentScores ){

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
    var magnitudeMatrix = Array.from({ length: height }, () => Array( width ).fill( 0 ))

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

            magnitudeMatrix[row][col] = normalizedMagnitude
        }
    }

    context.putImageData( imageData, 0, 0 )

    return {
        source: canvas.toDataURL( "image/png" ),
        width,
        height,
        magnitudeMatrix
    }
}

function buildPcaRgbImage( componentScores, options = {} ){

    const width = componentScores[0].matrix[0].length
    const height = componentScores[0].matrix.length

    if( typeof document === "undefined" ){
        throw new Error( "PCA RGB rendering requires a browser environment." )
    }

    const selectedChannels = resolveRgbChannels( componentScores, options.channels )

    const matrixByComponent = new Map()
    for( const entry of componentScores ){
        matrixByComponent.set( entry.componentIndex, entry.matrix )
    }

    const redMatrix = matrixByComponent.get( selectedChannels.r )
    const greenMatrix = matrixByComponent.get( selectedChannels.g )
    const blueMatrix = matrixByComponent.get( selectedChannels.b )

    const redScale = buildRobustScale( redMatrix )
    const greenScale = buildRobustScale( greenMatrix )
    const blueScale = buildRobustScale( blueMatrix )

    const canvas = document.createElement( "canvas" )
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext( "2d" )
    if( context === null ){
        throw new Error( "Unable to create canvas context for PCA RGB rendering." )
    }

    const imageData = context.createImageData( width, height )
    var magnitudeMatrix = Array.from({ length: height }, () => Array( width ).fill( 0 ))

    var offset = 0
    for( var row = 0; row < height; row++ ){
        for( var col = 0; col < width; col++ ){

            const red = normalizeByScale( redMatrix[row][col], redScale )
            const green = normalizeByScale( greenMatrix[row][col], greenScale )
            const blue = normalizeByScale( blueMatrix[row][col], blueScale )

            imageData.data[offset++] = Math.round( 255 * red )
            imageData.data[offset++] = Math.round( 255 * green )
            imageData.data[offset++] = Math.round( 255 * blue )
            imageData.data[offset++] = 255

            magnitudeMatrix[row][col] = ( red + green + blue ) / 3
        }
    }

    context.putImageData( imageData, 0, 0 )

    return {
        source: canvas.toDataURL( "image/png" ),
        width,
        height,
        magnitudeMatrix
    }
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

    const values = sampleFiniteValues( matrix )
    if( values.length === 0 ){
        return { low: 0, high: 1 }
    }

    values.sort(( left, right ) => left - right )

    const quantileLow = quantileFromSorted( values, lowerQuantile )
    const quantileHigh = quantileFromSorted( values, upperQuantile )

    if( Number.isFinite( quantileLow ) && Number.isFinite( quantileHigh ) && quantileHigh > quantileLow ){
        return { low: quantileLow, high: quantileHigh }
    }

    const minimum = values[0]
    const maximum = values[values.length - 1]

    if( maximum > minimum ){
        return { low: minimum, high: maximum }
    }

    return { low: minimum, high: minimum + 1 }
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
    initializePcaClassification,
    updatePcaClassification,
    initializePcaRgb,
    updatePcaRgb,
    updateLowerSpectrum,
    configureHeatmapInteraction
}
