import { onMounted, watch } from "vue"

export function useProjectViewLifecycle( options ){

	const route = options.route
	const project = options.project
	const projects = options.projects
	const settings = options.settings
	const billingSettings = options.billingSettings
	const activeProjectLoadRequestID = options.activeProjectLoadRequestID
	const activePlot = options.activePlot
	const layerInput = options.layerInput
	const mip = options.mip
	const maxLayerIndex = options.maxLayerIndex
	const cacheOptions = options.cacheOptions
	const projectlib = options.projectlib
	const settingslib = options.settingslib
	const hyperspectrumCache = options.hyperspectrumCache
	const navigation = options.navigation
	const resetViewerState = options.resetViewerState
	const restoreGpuInferenceState = options.restoreGpuInferenceState
	const loadRoiList = options.loadRoiList
	const loadXyz = options.loadXyz
	const loadSpectralCalibrationState = options.loadSpectralCalibrationState
	const layerCacheOptions = options.layerCacheOptions
	const ensureDefaultZBlendState = options.ensureDefaultZBlendState
	const loadProjectSpectrumGridlinePreset = options.loadProjectSpectrumGridlinePreset
	const loadZBlendPreset = options.loadZBlendPreset
	const blockingPreparationTargetForDisplayMode = options.blockingPreparationTargetForDisplayMode
	const markPreparationStarted = options.markPreparationStarted
	const markPreparationFailed = options.markPreparationFailed
	const markPreparationCompleted = options.markPreparationCompleted
	const loadVisualizationTargetData = options.loadVisualizationTargetData
	const nextTick = options.nextTick
	const renderCurrentMatrix = options.renderCurrentMatrix
	const emitLoadedOnce = options.emitLoadedOnce
	const maybeOfferViewerTutorialPrompt = options.maybeOfferViewerTutorialPrompt
	const queueProjectBackgroundHydration = options.queueProjectBackgroundHydration
	const ensureResizeObserver = options.ensureResizeObserver
	const installProjectBackgroundInteractionListeners = options.installProjectBackgroundInteractionListeners
	const currentProjectID = options.currentProjectID

	const initializeProjectView = async () => {

		const nextProjectID = currentProjectID()
		if( nextProjectID.length === 0 ) return

		const requestID = activeProjectLoadRequestID.value + 1
		activeProjectLoadRequestID.value = requestID

		resetViewerState()

		try{
			projects.value = await projectlib.list()
			if( requestID !== activeProjectLoadRequestID.value ) return

			const nextProject = projects.value[nextProjectID]
			if( nextProject === undefined ){
				throw new Error( "Project not found: " + nextProjectID )
			}

			project.value = nextProject
			await restoreGpuInferenceState( requestID )
			if( requestID !== activeProjectLoadRequestID.value ) return

			await hyperspectrumCache.initProjectCache( project.value, cacheOptions )
			if( requestID !== activeProjectLoadRequestID.value ) return

			hyperspectrumCache.setActiveLayer( project.value, 0, cacheOptions )
			hyperspectrumCache.setActivePca( project.value, 5, cacheOptions )
			hyperspectrumCache.setActiveRpca( project.value, 5, cacheOptions )
			await loadRoiList()
			if( requestID !== activeProjectLoadRequestID.value ) return

			try{
				await loadXyz( "high" )
			} catch( xyzError ){
				console.log( xyzError )
			}

			if( requestID !== activeProjectLoadRequestID.value ) return

			if( typeof loadSpectralCalibrationState === "function" ){
				await loadSpectralCalibrationState()
			}

			if( requestID !== activeProjectLoadRequestID.value ) return

			const initialLayerIndex = Math.floor( maxLayerIndex.value / 2 )
			layerInput.value = initialLayerIndex
			hyperspectrumCache.setActiveLayer( project.value, initialLayerIndex, layerCacheOptions() )
			hyperspectrumCache.setInitialLayerWindow( project.value, initialLayerIndex, layerCacheOptions() )
			ensureDefaultZBlendState()
			await loadProjectSpectrumGridlinePreset( requestID )
			void loadZBlendPreset( requestID )
			const startingDisplayMode = activePlot.value
			const blockingPreparationTarget = blockingPreparationTargetForDisplayMode( startingDisplayMode )
			markPreparationStarted( blockingPreparationTarget )

			const loadedMip = await hyperspectrumCache.getMip( project.value, cacheOptions )
			if( requestID !== activeProjectLoadRequestID.value ) return
			mip.value = loadedMip

			try{
				await loadVisualizationTargetData( blockingPreparationTarget, initialLayerIndex, "high" )
			} catch( blockingError ){
				console.log( blockingError )

				if( startingDisplayMode !== "mip" ){
					markPreparationFailed( blockingPreparationTarget )
					activePlot.value = "mip"
					markPreparationStarted( "mip" )
					await loadVisualizationTargetData( "mip", initialLayerIndex, "high" )
				} else {
					throw blockingError
				}
			}

			if( requestID !== activeProjectLoadRequestID.value ) return

			await nextTick()
			if( requestID !== activeProjectLoadRequestID.value ) return

			await renderCurrentMatrix( true )
			markPreparationCompleted( blockingPreparationTargetForDisplayMode( activePlot.value ) )
			emitLoadedOnce()
			maybeOfferViewerTutorialPrompt( requestID )
			queueProjectBackgroundHydration( requestID, initialLayerIndex, activePlot.value )
			ensureResizeObserver()
		} catch( error ){
			if( requestID !== activeProjectLoadRequestID.value ) return
			console.log( error )
			navigation.route( "Main menu", {} )
		}
	}

	const initializeViewerOnMount = async () => {

		try{
			installProjectBackgroundInteractionListeners()

			const savedSettings = await settingslib.get()
			const savedBilling = await settingslib.getBilling()

			settings.value = savedSettings
			if( savedBilling && typeof savedBilling === "object" ){
				billingSettings.value = {
					groupID: typeof savedBilling.groupID === "string" ? savedBilling.groupID : ""
				}
			}
			await initializeProjectView()
		} catch( error ){
			console.log( error )
			navigation.route( "Main menu", {} )
		}
	}

	onMounted(() => {
		void initializeViewerOnMount()
	})

	watch( () => route.params.id, async ( nextProjectID, previousProjectID ) => {

		if( typeof nextProjectID !== "string" || nextProjectID.length === 0 ) return
		if( nextProjectID === previousProjectID ) return

		await initializeProjectView()
	})

	return {
		initializeProjectView,
		initializeViewerOnMount
	}
}
