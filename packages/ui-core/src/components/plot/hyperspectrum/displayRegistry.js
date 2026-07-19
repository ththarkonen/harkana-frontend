function createHyperspectrumDisplayRegistry( deps ){

    const {
        graph,
        heatmapRendererMode,
        heatmapUsesEstimatedRaman,
        hyperspectrum,
        mip,
        estimatedMip,
        mipHsv,
        estimatedMipHsv,
        umap,
        estimatedUmap,
        zBlendMeasurementSource,
        zBlendEstimatedSource,
        customIndexMatrix,
        pcaClassificationMip,
        estimatedPcaClassificationMip,
        pcaMip,
        estimatedPcaMip,
        pcaClassification,
        estimatedPcaClassification,
        rpcaClassificationMip,
        estimatedRpcaClassificationMip,
        rpcaMip,
        estimatedRpcaMip,
        rpcaClassification,
        estimatedRpcaClassification,
        mipHeatmapColorscale,
        resolvedUmapChannelColors,
        activePlot,
        settings,
        pcaRgbChannels,
        resolvedPcaLoadings,
        resolvedRpcaLoadings,
        pcaClassificationLoadingComponents,
        pcaMipLoadingComponents
    } = deps

    const prewarmVisualizationTargetPayload = async ( target, loadedData = null ) => {

        if( heatmapRendererMode.value !== "deckgl" ) return
        if( graph.value === null ) return

        if( target === "mip" ){
            const matrix = loadedData ?? ( heatmapUsesEstimatedRaman.value ? estimatedMip.value : mip.value )
            if( matrix === null ) return
            hyperspectrum.prewarmScalarHeatmapRendererPayload( graph.value, matrix, {
                colorscale: mipHeatmapColorscale()
            } )
            return
        }

        if( target === "mip_hsv" ){
            const matrix = loadedData ?? ( heatmapUsesEstimatedRaman.value ? estimatedMipHsv.value : mipHsv.value )
            if( matrix === null ) return
            await hyperspectrum.prewarmRgbHeatmapRendererPayloadAsync( graph.value, matrix )
            return
        }

        if( target === "umap" ){
            const matrix = loadedData ?? ( heatmapUsesEstimatedRaman.value ? estimatedUmap.value : umap.value )
            if( matrix === null ) return
            await hyperspectrum.prewarmUmapHeatmapRendererPayloadAsync( graph.value, matrix, {
                channelColors: resolvedUmapChannelColors()
            } )
            return
        }

        if( target === "z_blend" ){
            const source = loadedData ?? ( heatmapUsesEstimatedRaman.value ? zBlendEstimatedSource.value : zBlendMeasurementSource.value )
            if( source === null ) return
            hyperspectrum.prewarmZBlendHeatmapRendererPayload( graph.value, source )
            return
        }

        if( target === "custom_index" ){
            const matrix = loadedData ?? customIndexMatrix.value
            if( matrix === null ) return
            hyperspectrum.prewarmScalarHeatmapRendererPayload( graph.value, matrix, {
                colorscale: settings.value?.colormaps?.customIndex ?? "Viridis"
            } )
            return
        }

        if( target === "pca" ){
            const matrix = loadedData ?? ( heatmapUsesEstimatedRaman.value ? estimatedPcaClassificationMip.value : pcaClassificationMip.value )
            if( matrix === null ) return
            await hyperspectrum.prewarmPcaClassificationHeatmapRendererPayloadAsync( graph.value, matrix )
            return
        }

        if( target === "pca_mip" ){
            const matrix = loadedData ?? ( heatmapUsesEstimatedRaman.value ? estimatedPcaMip.value : pcaMip.value )
            if( matrix === null ) return
            await hyperspectrum.prewarmPcaMipHeatmapRendererPayloadAsync( graph.value, matrix )
            return
        }

        if( target === "pca_rgb" ){
            const matrix = loadedData ?? ( heatmapUsesEstimatedRaman.value ? estimatedPcaClassification.value : pcaClassification.value )
            if( matrix === null ) return
            await hyperspectrum.prewarmPcaRgbHeatmapRendererPayloadAsync( graph.value, matrix, {
                channels: { ...pcaRgbChannels.value }
            } )
            return
        }

        if( target === "rpca" ){
            const matrix = loadedData ?? ( heatmapUsesEstimatedRaman.value ? estimatedRpcaClassificationMip.value : rpcaClassificationMip.value )
            if( matrix === null ) return
            await hyperspectrum.prewarmPcaClassificationHeatmapRendererPayloadAsync( graph.value, matrix )
            return
        }

        if( target === "rpca_mip" ){
            const matrix = loadedData ?? ( heatmapUsesEstimatedRaman.value ? estimatedRpcaMip.value : rpcaMip.value )
            if( matrix === null ) return
            await hyperspectrum.prewarmPcaMipHeatmapRendererPayloadAsync( graph.value, matrix )
            return
        }

        if( target === "rpca_rgb" ){
            const matrix = loadedData ?? ( heatmapUsesEstimatedRaman.value ? estimatedRpcaClassification.value : rpcaClassification.value )
            if( matrix === null ) return
            await hyperspectrum.prewarmPcaRgbHeatmapRendererPayloadAsync( graph.value, matrix, {
                channels: { ...pcaRgbChannels.value }
            } )
        }
    }

    const resolveCurrentPlotRenderSpec = ( sharedOptions ) => {

        if( activePlot.value === "pca" ){
            return {
                initialize: hyperspectrum.initializePcaClassification,
                update: hyperspectrum.updatePcaClassification,
                options: {
                    ...sharedOptions,
                    loadings: resolvedPcaLoadings(),
                    loadingComponents: pcaClassificationLoadingComponents()
                }
            }
        }

        if( activePlot.value === "rpca" ){
            return {
                initialize: hyperspectrum.initializePcaClassification,
                update: hyperspectrum.updatePcaClassification,
                options: {
                    ...sharedOptions,
                    loadings: resolvedRpcaLoadings(),
                    loadingComponents: pcaClassificationLoadingComponents()
                }
            }
        }

        if( activePlot.value === "pca_mip" ){
            return {
                initialize: hyperspectrum.initializePcaMip,
                update: hyperspectrum.updatePcaMip,
                options: {
                    ...sharedOptions,
                    loadings: resolvedPcaLoadings(),
                    loadingComponents: pcaMipLoadingComponents()
                }
            }
        }

        if( activePlot.value === "rpca_mip" ){
            return {
                initialize: hyperspectrum.initializePcaMip,
                update: hyperspectrum.updatePcaMip,
                options: {
                    ...sharedOptions,
                    loadings: resolvedRpcaLoadings(),
                    loadingComponents: pcaMipLoadingComponents()
                }
            }
        }

        if( activePlot.value === "pca_rgb" || activePlot.value === "rpca_rgb" ){
            const redComponentLabel = String( pcaRgbChannels.value.r ).padStart( 2, "0" )
            const greenComponentLabel = String( pcaRgbChannels.value.g ).padStart( 2, "0" )
            const blueComponentLabel = String( pcaRgbChannels.value.b ).padStart( 2, "0" )

            return {
                initialize: hyperspectrum.initializePcaRgb,
                update: hyperspectrum.updatePcaRgb,
                options: {
                    ...sharedOptions,
                    channels: { ...pcaRgbChannels.value },
                    loadings: activePlot.value === "pca_rgb" ? resolvedPcaLoadings() : resolvedRpcaLoadings(),
                    loadingSeries: [
                        {
                            componentIndex: pcaRgbChannels.value.r,
                            legendKey: `loading-r-${pcaRgbChannels.value.r}`,
                            label: "R - PC" + redComponentLabel,
                            color: "rgb(239, 68, 68)"
                        },
                        {
                            componentIndex: pcaRgbChannels.value.g,
                            legendKey: `loading-g-${pcaRgbChannels.value.g}`,
                            label: "G - PC" + greenComponentLabel,
                            color: "rgb(34, 197, 94)"
                        },
                        {
                            componentIndex: pcaRgbChannels.value.b,
                            legendKey: `loading-b-${pcaRgbChannels.value.b}`,
                            label: "B - PC" + blueComponentLabel,
                            color: "rgb(59, 130, 246)"
                        }
                    ]
                }
            }
        }

        if( activePlot.value === "umap" ){
            return {
                initialize: hyperspectrum.initializeUmap,
                update: hyperspectrum.updateUmap,
                options: {
                    ...sharedOptions,
                    channelColors: resolvedUmapChannelColors()
                }
            }
        }

        if( activePlot.value === "z_blend" ){
            return {
                initialize: hyperspectrum.initializeZBlend,
                update: hyperspectrum.updateZBlend,
                options: sharedOptions
            }
        }

        if( activePlot.value === "mip_hsv" ){
            return {
                initialize: hyperspectrum.initializeRgb,
                update: hyperspectrum.updateRgb,
                options: sharedOptions
            }
        }

        const scalarColorscale = activePlot.value === "layer"
            ? settings.value?.colormaps?.layer
            : (
                activePlot.value === "custom_index"
                    ? settings.value?.colormaps?.customIndex
                    : settings.value?.colormaps?.mip
            )
        const colorscale = typeof scalarColorscale === "string" && scalarColorscale.length > 0
            ? scalarColorscale
            : "Viridis"

        return {
            initialize: hyperspectrum.initialize,
            update: hyperspectrum.update,
            options: {
                ...sharedOptions,
                colorscale
            }
        }
    }

    return {
        prewarmVisualizationTargetPayload,
        resolveCurrentPlotRenderSpec
    }
}

export { createHyperspectrumDisplayRegistry }
