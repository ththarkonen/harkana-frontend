import { onMounted, watch } from "vue"
import { markViewerLoad, measureViewerLoad } from "../../utils/viewerPerformance.js"

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
	const loadCustomIndexState = options.loadCustomIndexState
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
	const enqueueProjectBackgroundTask = options.enqueueProjectBackgroundTask
	const queueProjectBackgroundHydration = options.queueProjectBackgroundHydration
	const ensureResizeObserver = options.ensureResizeObserver
	const installProjectBackgroundInteractionListeners = options.installProjectBackgroundInteractionListeners
	const currentProjectID = options.currentProjectID

	const isActiveRequest = ( requestID ) => {
		return requestID === activeProjectLoadRequestID.value
	}

	const runDeferredProjectStateHydration = async ( requestID, startingDisplayMode ) => {
		const blockingTarget = blockingPreparationTargetForDisplayMode( startingDisplayMode )

		const runDeferredStep = async ( callback ) => {
			if( isActiveRequest( requestID ) === false ) return
			if( typeof callback !== "function" ) return

			try{
				await callback()
			} catch( error ){
				console.log( error )
			}
		}

		await runDeferredStep( loadRoiList )
		await runDeferredStep( () => loadProjectSpectrumGridlinePreset( requestID ) )

		if( blockingTarget !== "z_blend" ){
			await runDeferredStep( () => loadZBlendPreset( requestID ) )
		}

		if( typeof loadSpectralCalibrationState === "function" ){
			await runDeferredStep( () => loadSpectralCalibrationState() )
		}

		if( blockingTarget !== "custom_index" && typeof loadCustomIndexState === "function" ){
			await runDeferredStep( () => loadCustomIndexState() )
		}

		if( isActiveRequest( requestID ) ){
			markViewerLoad( "hyperspectrum:deferred-ready", { projectID: nextProjectIDFromProject() })
		}
	}

	const queueDeferredProjectStateHydration = ( requestID, startingDisplayMode ) => {
		const task = async () => {
			await runDeferredProjectStateHydration( requestID, startingDisplayMode )
		}

		if( typeof enqueueProjectBackgroundTask === "function" ){
			enqueueProjectBackgroundTask( task )
			return
		}

		void task()
	}

	const nextProjectIDFromProject = () => {
		return String( project.value?.id ?? "" ).trim()
	}

	const initializeProjectView = async () => {

		const nextProjectID = currentProjectID()
		if( nextProjectID.length === 0 ) return

		const requestID = activeProjectLoadRequestID.value + 1
		activeProjectLoadRequestID.value = requestID

		resetViewerState()
		markViewerLoad( "hyperspectrum:route-mounted", { projectID: nextProjectID })

		try{
			projects.value = await projectlib.list()
			if( isActiveRequest( requestID ) === false ) return

			const nextProject = projects.value[nextProjectID]
			if( nextProject === undefined ){
				throw new Error( "Project not found: " + nextProjectID )
			}

			project.value = nextProject
			markViewerLoad( "hyperspectrum:project-metadata-ready", { projectID: nextProjectID })

			await restoreGpuInferenceState( requestID )
			if( isActiveRequest( requestID ) === false ) return

			await hyperspectrumCache.initProjectCache( project.value, cacheOptions )
			if( isActiveRequest( requestID ) === false ) return

			hyperspectrumCache.setActiveLayer( project.value, 0, cacheOptions )
			hyperspectrumCache.setActivePca( project.value, 5, cacheOptions )
			hyperspectrumCache.setActiveRpca( project.value, 5, cacheOptions )

			try{
				await loadXyz( "high" )
			} catch( xyzError ){
				console.log( xyzError )
			}

			if( isActiveRequest( requestID ) === false ) return

			const startingDisplayMode = activePlot.value
			const blockingPreparationTarget = blockingPreparationTargetForDisplayMode( startingDisplayMode )
			if( blockingPreparationTarget === "custom_index" && typeof loadCustomIndexState === "function" ){
				await loadCustomIndexState()
				if( isActiveRequest( requestID ) === false ) return
			}

			const initialLayerIndex = Math.floor( maxLayerIndex.value / 2 )
			layerInput.value = initialLayerIndex
			hyperspectrumCache.setActiveLayer( project.value, initialLayerIndex, layerCacheOptions() )
			hyperspectrumCache.setInitialLayerWindow( project.value, initialLayerIndex, layerCacheOptions() )
			ensureDefaultZBlendState()
			if( blockingPreparationTarget === "z_blend" ){
				await loadZBlendPreset( requestID )
				if( isActiveRequest( requestID ) === false ) return
			}
			markPreparationStarted( blockingPreparationTarget )

			try{
				await loadVisualizationTargetData( blockingPreparationTarget, initialLayerIndex, "high" )
				markViewerLoad( "hyperspectrum:first-data-ready", {
					projectID: nextProjectID,
					displayMode: activePlot.value
				})
			} catch( blockingError ){
				console.log( blockingError )

				if( startingDisplayMode !== "mip" ){
					markPreparationFailed( blockingPreparationTarget )
					activePlot.value = "mip"
					markPreparationStarted( "mip" )
					await loadVisualizationTargetData( "mip", initialLayerIndex, "high" )
					markViewerLoad( "hyperspectrum:first-data-ready", {
						projectID: nextProjectID,
						displayMode: activePlot.value
					})
				} else {
					throw blockingError
				}
			}

			if( isActiveRequest( requestID ) === false ) return

			await nextTick()
			if( isActiveRequest( requestID ) === false ) return

			markViewerLoad( "hyperspectrum:first-plot-render-start", {
				projectID: nextProjectID,
				displayMode: activePlot.value
			})
			await renderCurrentMatrix( true )
			markViewerLoad( "hyperspectrum:first-plot-render-end", {
				projectID: nextProjectID,
				displayMode: activePlot.value
			})
			measureViewerLoad(
				"hyperspectrum:first-plot-render",
				"hyperspectrum:first-plot-render-start",
				"hyperspectrum:first-plot-render-end"
			)
			markPreparationCompleted( blockingPreparationTargetForDisplayMode( activePlot.value ) )
			emitLoadedOnce()
			queueDeferredProjectStateHydration( requestID, startingDisplayMode )
			queueProjectBackgroundHydration( requestID, initialLayerIndex, activePlot.value )
			maybeOfferViewerTutorialPrompt( requestID )
			ensureResizeObserver()
		} catch( error ){
			if( isActiveRequest( requestID ) === false ) return
			console.log( error )
			navigation.route( "Main menu", {} )
		}
	}

	const initializeViewerOnMount = async () => {

		try{
			installProjectBackgroundInteractionListeners()

			const [ savedSettings, savedBilling ] = await Promise.all([
				settingslib.get(),
				settingslib.getBilling()
			])

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
