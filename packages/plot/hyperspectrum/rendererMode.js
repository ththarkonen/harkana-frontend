function normalizeExternalHeatmapRendererMode( renderer ){
    return renderer === "deckgl" ? "deckgl" : "plotly"
}

function shouldUseExternalHeatmapRenderer( options ){
    return normalizeExternalHeatmapRendererMode( options?.heatmapRenderer ) === "deckgl"
}

function normalizeHeatmapOrigin( origin ){
    return origin === "bottom-left" ? "bottom-left" : "top-left"
}

function resolveStoredHeatmapOrigin( graphContainer, fallback = "top-left" ){

    const storedOrigin = graphContainer?.__harkanaHeatmapOrigin
    if( storedOrigin === "bottom-left" || storedOrigin === "top-left" ){
        return storedOrigin
    }

    return normalizeHeatmapOrigin( fallback )
}

function cacheHeatmapOrigin( graphContainer, settings ){

    if( !graphContainer ) return
    graphContainer.__harkanaHeatmapOrigin = normalizeHeatmapOrigin( settings?.layout?.heatmapOrigin )
}

function cacheHeatmapRendererPayload( graphContainer, payload, mode ){

    if( !graphContainer ) return

    graphContainer.__harkanaHeatmapRendererPayload = payload ?? null
    graphContainer.__harkanaHeatmapRendererMode = mode
}

export {
    cacheHeatmapOrigin,
    cacheHeatmapRendererPayload,
    normalizeExternalHeatmapRendererMode,
    normalizeHeatmapOrigin,
    resolveStoredHeatmapOrigin,
    shouldUseExternalHeatmapRenderer
}
