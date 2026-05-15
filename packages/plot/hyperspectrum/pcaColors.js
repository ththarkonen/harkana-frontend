import {
    DEFAULT_PCA_COMPONENT_COLOR_STRINGS,
    parseColorValue
} from "./shared.js"

let pcaComponentColors = defaultPcaComponentColors()

function defaultPcaComponentColors(){
    return DEFAULT_PCA_COMPONENT_COLOR_STRINGS
        .map(( color ) => parseColorValue( color ))
        .filter(( color ) => color !== null )
}

function setPcaComponentColors( pcaLegend = [] ){

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

function componentColor( componentIndex ){

    const normalized = Math.max( 1, Number.parseInt( componentIndex, 10 ) || 1 )
    const availableColors = Array.isArray( pcaComponentColors ) && pcaComponentColors.length > 0
        ? pcaComponentColors
        : defaultPcaComponentColors()

    const colorIndex = ( normalized - 1 ) % availableColors.length
    return availableColors[ colorIndex ]
}

function getPcaComponentColors(){
    return Array.isArray( pcaComponentColors ) ? [ ...pcaComponentColors ] : defaultPcaComponentColors()
}

export {
    componentColor,
    defaultPcaComponentColors,
    getPcaComponentColors,
    setPcaComponentColors
}
