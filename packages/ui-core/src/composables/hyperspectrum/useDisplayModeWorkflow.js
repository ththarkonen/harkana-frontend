import { watch } from "vue"

export function useDisplayModeWorkflow( options ){

	const activePlot = options.activePlot
	const project = options.project
	const heatmapUsesEstimatedRaman = options.heatmapUsesEstimatedRaman
	const showPcaLoadings = options.showPcaLoadings
	const pcaMipComponentCount = options.pcaMipComponentCount
	const pcaClassificationComponentCount = options.pcaClassificationComponentCount
	const renderCurrentMatrix = options.renderCurrentMatrix
	const loadMipHsv = options.loadMipHsv
	const loadUmap = options.loadUmap
	const ensureZBlendVisualizationMatrix = options.ensureZBlendVisualizationMatrix
	const renderZBlendHeatmapOnly = options.renderZBlendHeatmapOnly
	const applyLayerInput = options.applyLayerInput
	const resetActivePcaComponents = options.resetActivePcaComponents
	const loadPcaMip = options.loadPcaMip
	const loadPcaClassificationMip = options.loadPcaClassificationMip
	const loadPcaClassification = options.loadPcaClassification
	const loadPcaLoadings = options.loadPcaLoadings
	const loadRpcaMip = options.loadRpcaMip
	const loadRpcaClassificationMip = options.loadRpcaClassificationMip
	const loadRpcaClassification = options.loadRpcaClassification
	const loadRpcaLoadings = options.loadRpcaLoadings

	const handleDisplayModeChange = async ( plotMode ) => {

		if( project.value.id === "" ) return

		try{
			if( plotMode === "mip" ){
				await renderCurrentMatrix()
				return
			}

			if( plotMode === "mip_hsv" ){
				if( heatmapUsesEstimatedRaman.value === false ){
					await loadMipHsv( "high" )
				}
				await renderCurrentMatrix()
				return
			}

			if( plotMode === "umap" ){
				if( heatmapUsesEstimatedRaman.value === false ){
					await loadUmap( "high" )
				}
				await renderCurrentMatrix()
				return
			}

			if( plotMode === "z_blend" ){
				await ensureZBlendVisualizationMatrix( "high" )
				await renderCurrentMatrix()
				await renderZBlendHeatmapOnly()
				return
			}

			if( plotMode === "layer" ){
				await applyLayerInput()
				return
			}

			if( plotMode === "pca_mip" ){
				resetActivePcaComponents( pcaMipComponentCount.value )
				await loadPcaMip( pcaMipComponentCount.value )
				await renderCurrentMatrix()
				if( showPcaLoadings.value ){
					void loadPcaLoadings().catch(( loadingsError ) => {
						console.log( loadingsError )
					})
				}
				return
			}

			if( plotMode === "pca" ){
				resetActivePcaComponents( pcaClassificationComponentCount.value )
				await loadPcaClassificationMip()
				await renderCurrentMatrix()
				if( showPcaLoadings.value ){
					void loadPcaLoadings().catch(( loadingsError ) => {
						console.log( loadingsError )
					})
				}
				return
			}

			if( plotMode === "pca_rgb" ){
				await loadPcaClassification()
				await renderCurrentMatrix()
				if( showPcaLoadings.value ){
					void loadPcaLoadings().catch(( loadingsError ) => {
						console.log( loadingsError )
					})
				}
				return
			}

			if( plotMode === "rpca_mip" ){
				resetActivePcaComponents( pcaMipComponentCount.value )
				await loadRpcaMip( pcaMipComponentCount.value )
				if( showPcaLoadings.value ){
					await loadRpcaLoadings()
				}
				await renderCurrentMatrix()
				return
			}

			if( plotMode === "rpca" ){
				resetActivePcaComponents( pcaClassificationComponentCount.value )
				await loadRpcaClassificationMip()
				if( showPcaLoadings.value ){
					await loadRpcaLoadings()
				}
				await renderCurrentMatrix()
				return
			}

			if( plotMode === "rpca_rgb" ){
				await loadRpcaClassification()
				if( showPcaLoadings.value ){
					await loadRpcaLoadings()
				}
				await renderCurrentMatrix()
			}
		} catch( error ){
			console.log( error )
		}
	}

	watch( activePlot, async ( plotMode ) => {
		await handleDisplayModeChange( plotMode )
	})

	return {
		handleDisplayModeChange
	}
}
