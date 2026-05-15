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
const SCALAR_COLOR_MAP_TEXTURE_SIZE = 1024

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

function clampUnit( value ){

    if( Number.isFinite( value ) === false ) return 0
    if( value <= 0 ) return 0
    if( value >= 1 ) return 1
    return value
}

function defaultSpectrumLegendLayout(){

    return {
        orientation: "h",
        x: 0.02,
        xanchor: "left",
        y: 0.98,
        yanchor: "top",
        bgcolor: "rgba(255, 255, 255, 0.82)",
        bordercolor: "rgba(148, 163, 184, 0.35)",
        borderwidth: 1,
        font: {
            size: 11,
            color: "#111827"
        },
        itemclick: false,
        itemdoubleclick: false
    }
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
        ticktext: indices.map(( index ) => "$$" + formatLatexNumber( axisValues[index] ) + "$$" )
    }
}

function valueLatexTicks( axisValues = [], maxTicks = 6 ){

    if( Array.isArray( axisValues ) === false || axisValues.length === 0 ){
        return latexTicks( 1, maxTicks )
    }

    const indices = tickIndices( axisValues.length, maxTicks )

    return {
        tickvals: indices.map(( index ) => axisValues[index] ),
        ticktext: indices.map(( index ) => "$$" + formatLatexNumber( axisValues[index] ) + "$$" )
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

function sanitizeLatexLabel( label, fallback ){

    if( typeof label !== "string" || label.length === 0 ) return fallback
    return label.replace(/\\/g, "\\" )
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

function buildRobustScale( matrix, lowerQuantile = 0.02, upperQuantile = 0.98, cache = null ){

    const useCache = lowerQuantile === 0.02 &&
        upperQuantile === 0.98 &&
        matrix !== null &&
        typeof matrix === "object" &&
        cache instanceof WeakMap
    if( useCache && cache.has( matrix ) ){
        return cache.get( matrix )
    }

    const values = sampleFiniteValues( matrix )
    if( values.length === 0 ){
        const fallbackScale = { low: 0, high: 1 }
        if( useCache ){
            cache.set( matrix, fallbackScale )
        }
        return fallbackScale
    }

    values.sort(( left, right ) => left - right )

    const quantileLow = quantileFromSorted( values, lowerQuantile )
    const quantileHigh = quantileFromSorted( values, upperQuantile )

    if( Number.isFinite( quantileLow ) && Number.isFinite( quantileHigh ) && quantileHigh > quantileLow ){
        const quantileScale = { low: quantileLow, high: quantileHigh }
        if( useCache ){
            cache.set( matrix, quantileScale )
        }
        return quantileScale
    }

    const minimum = values[0]
    const maximum = values[values.length - 1]

    if( maximum > minimum ){
        const minMaxScale = { low: minimum, high: maximum }
        if( useCache ){
            cache.set( matrix, minMaxScale )
        }
        return minMaxScale
    }

    const fallbackScale = { low: minimum, high: minimum + 1 }
    if( useCache ){
        cache.set( matrix, fallbackScale )
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
        ticktext: tickvals.map(( value ) => "$$" + value + "$$" )
    }
}

export {
    COMBINED_SPECTRUM_GRID_AXIS_KEYS,
    DEFAULT_PCA_COMPONENT_COLOR_STRINGS,
    DEFAULT_UMAP_CHANNEL_COLOR_STRINGS,
    DEFAULT_Z_BLEND_PALETTE_COLOR_STRINGS,
    EXTERNAL_HEATMAP_COLOR_SCALES,
    FULL_HEATMAP_AXIS_CONFIG,
    LOWER_LEFT_INSTRUCTION_TEXT,
    SCALAR_COLOR_MAP_TEXTURE_SIZE,
    STANDALONE_HEATMAP_AXIS_CONFIG,
    STANDALONE_SPECTRUM_GRID_AXIS_KEYS,
    SUPPORTED_HEATMAP_COLOR_SCALES,
    TOP_LEFT_INSTRUCTION_TEXT,
    buildColumnMean,
    buildRobustScale,
    buildRowMean,
    clampUnit,
    colorFromScale,
    colorWithAlpha,
    defaultSpectrumLegendLayout,
    formatAxisTitle,
    formatAxisUnitSuffix,
    formatLatexNumber,
    indexedLatexTicks,
    interpolateColorStop,
    latexTicks,
    matrixFiniteRange,
    normalizeAxisArray,
    normalizeAxisMetadata,
    normalizeByScale,
    parseColorValue,
    quantileFromSorted,
    resolveColorString,
    resolveExternalHeatmapColorscale,
    resolveHeatmapColorscale,
    resolveIntensityAxisTitle,
    resolveSeriesXValues,
    sampleFiniteValues,
    sanitizeLatexLabel,
    squareDomains,
    tickIndices,
    valueLatexTicks
}
