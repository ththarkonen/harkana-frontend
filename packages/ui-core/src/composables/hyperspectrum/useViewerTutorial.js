import { computed, ref } from "vue"

const VIEWER_TUTORIAL_STORAGE_KEY = "harkana.viewerTutorial.v1"

function createDefaultViewerTutorialState(){
	return {
		prompted: false,
		completed: false,
		skipped: false,
		lastCompletedAt: ""
	}
}

function readViewerTutorialState(){
	if( typeof window === "undefined" || typeof window.localStorage === "undefined" ){
		return createDefaultViewerTutorialState()
	}

	try{
		const raw = window.localStorage.getItem( VIEWER_TUTORIAL_STORAGE_KEY )
		if( typeof raw !== "string" || raw.length === 0 ){
			return createDefaultViewerTutorialState()
		}

		const parsed = JSON.parse( raw )
		return {
			prompted: parsed?.prompted === true,
			completed: parsed?.completed === true,
			skipped: parsed?.skipped === true,
			lastCompletedAt: typeof parsed?.lastCompletedAt === "string" ? parsed.lastCompletedAt : ""
		}
	} catch( error ){
		console.log( error )
		return createDefaultViewerTutorialState()
	}
}

function waitForDelay( delayMs ){
	return new Promise(( resolve ) => {
		const timerScope = typeof window !== "undefined" ? window : globalThis
		timerScope.setTimeout( resolve, delayMs )
	})
}

export function useViewerTutorial( options ){

	const nextTick = options.nextTick
	const project = options.project
	const activeProjectLoadRequestID = options.activeProjectLoadRequestID
	const activePlot = options.activePlot
	const heatmapInteractionMode = options.heatmapInteractionMode
	const hasEstimatedRamanSpectraReady = options.hasEstimatedRamanSpectraReady
	const displaySelectDropdown = options.displaySelectDropdown
	const projectMenuDropdown = options.projectMenuDropdown
	const setHeatmapInteractionMode = options.setHeatmapInteractionMode
	const renderCurrentMatrix = options.renderCurrentMatrix
	const openSpectralCalibrationSidebar = typeof options.openSpectralCalibrationSidebar === "function"
		? options.openSpectralCalibrationSidebar
		: async () => {}
	const spectralCalibrationPanelOpen = options.spectralCalibrationPanelOpen ?? { value: false }
	const spectralCalibrationSidebarOpen = options.spectralCalibrationSidebarOpen ?? { value: false }
	const isKnownDisplayMode = typeof options.isKnownDisplayMode === "function"
		? options.isKnownDisplayMode
		: () => false

	const viewerTutorialState = ref( readViewerTutorialState() )
	const viewerTutorialPromptVisible = ref(false)
	const viewerTutorialVisible = ref(false)
	const viewerTutorialStepIndex = ref(0)
	const viewerTutorialRunToken = ref(0)
	const viewerTutorialOriginalDisplayMode = ref("")
	const viewerTutorialOriginalInteractionMode = ref("")
	const viewerTutorialOriginalSpectralCalibrationPanelOpen = ref(false)
	const viewerTutorialOriginalSpectralCalibrationSidebarOpen = ref(false)
	const tutorialDisplaySelectOpen = ref(false)
	const tutorialDisplayOptionsOpen = ref(false)
	const tutorialProjectMenuOpen = ref(false)
	const activeViewerTutorialTargetElement = ref(null)

	const persistViewerTutorialState = ( nextState ) => {
		viewerTutorialState.value = {
			...createDefaultViewerTutorialState(),
			...viewerTutorialState.value,
			...nextState
		}

		if( typeof window === "undefined" || typeof window.localStorage === "undefined" ){
			return
		}

		try{
			window.localStorage.setItem(
				VIEWER_TUTORIAL_STORAGE_KEY,
				JSON.stringify( viewerTutorialState.value )
			)
		} catch( error ){
			console.log( error )
		}
	}

	const tutorialTargetElement = ( targetKey ) => {
		if( typeof document === "undefined" ) return null
		const normalizedKey = String( targetKey ?? "" ).trim()
		if( normalizedKey.length === 0 ) return null
		return document.querySelector(`[data-tutorial="${normalizedKey}"]`)
	}

	const viewerTutorialSteps = computed(() => {
		const steps = [
			{
				id: "viewer-layout",
				kind: "highlight",
				title: "Viewer layout",
				body: "The viewer combines spatial false-color views, spectra panels, and analysis controls in one workspace.",
				target: "viewer-layout",
				placement: "center"
			},
			{
				id: "display-select",
				kind: "menu",
				title: "Display selector",
				body: "Use this menu to switch between false-color visualizations. Colormaps for the false-color images can be changed in Visualization settings from the Project menu.",
				target: "display-select",
				placement: "right"
			},
			{
				id: "display-options",
				kind: "menu",
				title: "Display options",
				body: "This menu controls spectrum display options, including whether selected spectra and uncertainty are shown.",
				target: "display-options",
				placement: "right"
			},
			{
				id: "heatmap",
				kind: "highlight",
				title: "Heatmap interaction",
				body: "Use the toolbar above the image to switch between selecting spectra, square zoom, free zoom, and reset zoom. Clicking or selecting a region updates the spectra panels to show the spectral signals at that pixel or region. Hovering shows pixel indices.",
				target: "heatmap-pane",
				placement: "left"
			},
			{
				id: "spectra",
				kind: "highlight",
				title: "Spectra panels",
				body: "These panels update from the current pixel or region selection and are used to visualize the spectral signals.",
				target: "spectra-panels",
				placement: "right"
			},
			{
				id: "roi-controls",
				kind: "highlight",
				title: "Regions of interest",
				body: "Save, inspect, refresh, and download regions of interest here so you can revisit the same spatial selections later.",
				target: "roi-controls",
				placement: "right"
			},
			{
				id: "project-menu",
				kind: "menu",
				title: "Project menu",
				body: "Use these actions to rename the project, edit raw axis values, and run Raman spectrum inference.\n\nYou can also rename the project by clicking the current project name, typing a new name, and pressing Enter.\n\nThe platform attempts to parse axis values from available metadata automatically. Raw spatial and spectral axis values can be edited here, while spectral calibration profiles are applied as a separate layer.",
				target: "project-menu",
				placement: "bottom"
			},
			{
				id: "spectral-calibration-sidebar",
				kind: "highlight",
				title: "Spectral calibration",
				body: "Open Calibration from the Project menu to inspect or apply spectral-axis calibration profiles. Saved profiles are previewed immediately, and owned projects can save the selected profile as the project-specific calibration.",
				target: "spectral-calibration-sidebar-block",
				placement: "right"
			}
		]

		if( project.value?.shared !== true ){
			steps.push({
				id: "spectral-calibration-panel",
				kind: "highlight",
				title: "Calibration point editor",
				body: "Use the editor to click spectrum traces or loadings, enter true spectral-axis locations, choose polynomial order terms, preview the correction, and save the calibration profile with a name and description.",
				target: "spectral-calibration-panel",
				placement: "left"
			})
		}

		steps.push(
			{
				id: "raman-inference-sidebar",
				kind: "highlight",
				title: "Raman inference controls",
				body: "After inference is available, this block is where you switch to estimated Raman-based views and related spectra controls. The extra false-color options become available from there.",
				target: "raman-inference-sidebar-block",
				placement: "right"
			},
			{
				id: "project-sharing-actions",
				kind: "menu",
				title: "Sharing and export",
				body: "This part of the Project menu is used for sharing, project notes, metadata, downloads, and Zenodo export.\n\nUse Share to collaborate, Notes to keep project context, Metadata to inspect project information, Download to export the project data, and Zenodo export when you want to prepare a publication-oriented archive.",
				target: "project-menu",
				placement: "bottom"
			},
			{
				id: "finish",
				kind: "centered",
				title: "You are ready to explore",
				body: "You can reopen this tutorial later from the Project menu.",
				target: "",
				placement: "center"
			}
		)

		return steps
	})

	const activeViewerTutorialStep = computed(() => {
		if( viewerTutorialVisible.value === false ){
			return null
		}

		return viewerTutorialSteps.value[ viewerTutorialStepIndex.value ] ?? null
	})

	const activeViewerTutorialStepId = computed(() => {
		return viewerTutorialVisible.value
			? viewerTutorialSteps.value[ viewerTutorialStepIndex.value ]?.id ?? ""
			: ""
	})

	const isDisplayOptionsTutorialStepActive = computed(() => {
		return activeViewerTutorialStepId.value === "display-options"
	})

	const isHeatmapTutorialStepActive = computed(() => {
		return activeViewerTutorialStepId.value === "heatmap"
	})

	const isProjectMenuTutorialStepActive = computed(() => {
		return activeViewerTutorialStepId.value === "project-menu" ||
			activeViewerTutorialStepId.value === "project-sharing-actions"
	})

	const isDisplaySelectTutorialStepActive = computed(() => {
		return activeViewerTutorialStepId.value === "display-select"
	})

	const activeProjectMenuTutorialSection = computed(() => {
		if( activeViewerTutorialStepId.value === "project-menu" ){
			return "core"
		}

		if( activeViewerTutorialStepId.value === "project-sharing-actions" ){
			return "sharing"
		}

		return ""
	})

	const isProjectMenuItemDimmed = ( section ) => {
		const activeSection = activeProjectMenuTutorialSection.value
		if( activeSection.length === 0 ){
			return false
		}

		return String( section ?? "" ) !== activeSection
	}

	const projectMenuDividerClass = ( section ) => {
		return isProjectMenuItemDimmed( section )
			? "h-0.5 bg-gray border-0 opacity-30"
			: "h-0.5 bg-gray border-0"
	}

	const showTutorialRamanSidebarPlaceholder = computed(() => {
		return viewerTutorialVisible.value === true &&
			activeViewerTutorialStepId.value === "raman-inference-sidebar" &&
			project.value?.shared !== true &&
			hasEstimatedRamanSpectraReady.value === false
	})

	const showRamanInferenceTutorialBlock = computed(() => {
		return project.value?.shared === true ||
			hasEstimatedRamanSpectraReady.value === true ||
			showTutorialRamanSidebarPlaceholder.value === true
	})

	const displayOptionsMenuClass = computed(() => {
		return isDisplayOptionsTutorialStepActive.value
			? "fixed z-[10030] pointer-events-none min-w-[18rem] w-max max-w-[50vw] origin-top-left rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30"
			: "fixed z-[45] min-w-[18rem] w-max max-w-[50vw] origin-top-left rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30"
	})

	const projectMenuClass = computed(() => {
		if( isProjectMenuTutorialStepActive.value ){
			return "fixed z-[10030] pointer-events-none min-w-[14rem] w-max max-w-[50vw] max-h-[min(32rem,calc(100vh-4rem))] overflow-y-auto origin-top-left rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30"
		}

		return "fixed z-[50] min-w-[14rem] w-max max-w-[50vw] max-h-[min(32rem,calc(100vh-4rem))] overflow-y-auto origin-top-left rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30"
	})

	const displaySelectMenuClass = computed(() => {
		return isDisplaySelectTutorialStepActive.value
			? "fixed z-[10030] pointer-events-none min-w-[16rem] w-max max-w-[50vw] origin-top-left rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30"
			: "fixed z-[45] min-w-[16rem] w-max max-w-[50vw] origin-top-left rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30"
	})

	const tutorialDisplaySelectOpenBinding = computed(() => {
		return viewerTutorialVisible.value ? tutorialDisplaySelectOpen.value : undefined
	})

	const tutorialDisplayOptionsOpenBinding = computed(() => {
		return viewerTutorialVisible.value ? tutorialDisplayOptionsOpen.value : undefined
	})

	const tutorialProjectMenuOpenBinding = computed(() => {
		return viewerTutorialVisible.value ? tutorialProjectMenuOpen.value : undefined
	})

	const handleTutorialDisplaySelectOpenUpdate = ( nextOpen ) => {
		if( isDisplaySelectTutorialStepActive.value && nextOpen !== true ){
			return
		}
		tutorialDisplaySelectOpen.value = nextOpen === true
	}

	const handleTutorialDisplayOptionsOpenUpdate = ( nextOpen ) => {
		if( isDisplayOptionsTutorialStepActive.value && nextOpen !== true ){
			return
		}
		tutorialDisplayOptionsOpen.value = nextOpen === true
	}

	const handleTutorialProjectMenuOpenUpdate = ( nextOpen ) => {
		if( isProjectMenuTutorialStepActive.value && nextOpen !== true ){
			return
		}
		tutorialProjectMenuOpen.value = nextOpen === true
	}

	const refreshActiveViewerTutorialTargetElement = () => {
		const targetKey = activeViewerTutorialStep.value?.target ?? ""
		activeViewerTutorialTargetElement.value = tutorialTargetElement( targetKey )
	}

	const focusTutorialTarget = async ( targetKey ) => {
		const element = tutorialTargetElement( targetKey )
		if( element instanceof HTMLElement ){
			element.scrollIntoView({ block: "nearest", inline: "nearest" })
		}
		await nextTick()
	}

	const openTutorialSelectMenu = async () => {
		tutorialDisplaySelectOpen.value = false
		displaySelectDropdown.value?.close?.()
		await nextTick()
		await waitForDelay( 24 )
		tutorialDisplaySelectOpen.value = true
		displaySelectDropdown.value?.open?.()
	}

	const closeTutorialTransientUi = () => {
		tutorialDisplaySelectOpen.value = false
		displaySelectDropdown.value?.close?.()
		tutorialDisplayOptionsOpen.value = false
		tutorialProjectMenuOpen.value = false
		projectMenuDropdown.value?.close?.()
	}

	const restoreViewerTutorialUiState = async () => {
		closeTutorialTransientUi()

		if( viewerTutorialOriginalDisplayMode.value.length > 0 &&
			isKnownDisplayMode( viewerTutorialOriginalDisplayMode.value ) &&
			activePlot.value !== viewerTutorialOriginalDisplayMode.value ){
			activePlot.value = viewerTutorialOriginalDisplayMode.value
			await nextTick()
			await renderCurrentMatrix()
		}

		if( viewerTutorialOriginalInteractionMode.value.length > 0 ){
			setHeatmapInteractionMode( viewerTutorialOriginalInteractionMode.value )
		}

		if( viewerTutorialOriginalSpectralCalibrationPanelOpen.value === false ){
			spectralCalibrationPanelOpen.value = false
		}

		if( viewerTutorialOriginalSpectralCalibrationSidebarOpen.value === false ){
			spectralCalibrationSidebarOpen.value = false
		}
	}

	const enterViewerTutorialStep = async ( step ) => {
		if( step === null ){
			return
		}

		closeTutorialTransientUi()

		if( step.id === "display-select" ){
			await focusTutorialTarget( step.target )
			await openTutorialSelectMenu()
			return
		}

		if( step.id === "display-options" ){
			await focusTutorialTarget( step.target )
			tutorialDisplayOptionsOpen.value = true
			return
		}

		if( step.id === "heatmap" ){
			setHeatmapInteractionMode( "select" )
			await focusTutorialTarget( step.target )
			return
		}

		if( step.id === "project-menu" || step.id === "project-sharing-actions" ){
			await focusTutorialTarget( step.target )
			tutorialProjectMenuOpen.value = false
			projectMenuDropdown.value?.close?.()
			await nextTick()
			await waitForDelay( 24 )
			tutorialProjectMenuOpen.value = true
			projectMenuDropdown.value?.open?.()
			return
		}

		if( step.id === "spectral-calibration-sidebar" ){
			await openSpectralCalibrationSidebar()
			spectralCalibrationPanelOpen.value = false
			await nextTick()
			await waitForDelay( 24 )
			await focusTutorialTarget( step.target )
			return
		}

		if( step.id === "spectral-calibration-panel" ){
			await openSpectralCalibrationSidebar()
			spectralCalibrationPanelOpen.value = true
			await nextTick()
			await waitForDelay( 24 )
			await focusTutorialTarget( step.target )
			return
		}

		await focusTutorialTarget( step.target )
	}

	const activateViewerTutorialStep = async ( nextIndex ) => {
		if( viewerTutorialVisible.value === false ){
			activeViewerTutorialTargetElement.value = null
			return
		}

		const clampedIndex = Math.max( 0, Math.min( viewerTutorialSteps.value.length - 1, nextIndex ))
		const nextToken = viewerTutorialRunToken.value + 1
		viewerTutorialRunToken.value = nextToken
		viewerTutorialStepIndex.value = clampedIndex
		await nextTick()
		refreshActiveViewerTutorialTargetElement()
		if( nextToken !== viewerTutorialRunToken.value ){
			return
		}

		await enterViewerTutorialStep( activeViewerTutorialStep.value )
		await nextTick()
		refreshActiveViewerTutorialTargetElement()
	}

	const maybeOfferViewerTutorialPrompt = ( requestID = null ) => {
		if( project.value?.id === "" ) return
		if( viewerTutorialVisible.value || viewerTutorialPromptVisible.value ) return
		if( viewerTutorialState.value.completed === true ) return
		if( viewerTutorialState.value.skipped === true ) return
		if( viewerTutorialState.value.prompted === true ) return

		persistViewerTutorialState({ prompted: true })

		waitForDelay( 0 ).then(() => {
			if( requestID !== null && requestID !== activeProjectLoadRequestID.value ) return
			if( project.value?.id === "" ) return
			viewerTutorialPromptVisible.value = true
		})
	}

	const startViewerTutorial = async () => {
		viewerTutorialPromptVisible.value = false
		viewerTutorialOriginalDisplayMode.value = activePlot.value
		viewerTutorialOriginalInteractionMode.value = heatmapInteractionMode.value
		viewerTutorialOriginalSpectralCalibrationPanelOpen.value = spectralCalibrationPanelOpen.value === true
		viewerTutorialOriginalSpectralCalibrationSidebarOpen.value = spectralCalibrationSidebarOpen.value === true
		viewerTutorialVisible.value = true
		viewerTutorialStepIndex.value = 0
		await activateViewerTutorialStep( 0 )
	}

	const restartViewerTutorial = async () => {
		viewerTutorialPromptVisible.value = false
		if( viewerTutorialVisible.value ){
			await restoreViewerTutorialUiState()
		}

		viewerTutorialOriginalDisplayMode.value = activePlot.value
		viewerTutorialOriginalInteractionMode.value = heatmapInteractionMode.value
		viewerTutorialOriginalSpectralCalibrationPanelOpen.value = spectralCalibrationPanelOpen.value === true
		viewerTutorialOriginalSpectralCalibrationSidebarOpen.value = spectralCalibrationSidebarOpen.value === true
		viewerTutorialVisible.value = true
		viewerTutorialStepIndex.value = 0
		await activateViewerTutorialStep( 0 )
	}

	const skipViewerTutorialPrompt = () => {
		viewerTutorialPromptVisible.value = false
		persistViewerTutorialState({ skipped: true })
	}

	const skipActiveViewerTutorial = async () => {
		if( viewerTutorialVisible.value === false ){
			return
		}

		viewerTutorialVisible.value = false
		activeViewerTutorialTargetElement.value = null
		viewerTutorialRunToken.value += 1
		await restoreViewerTutorialUiState()

		if( viewerTutorialState.value.completed !== true ){
			persistViewerTutorialState({ skipped: true })
		}
	}

	const completeViewerTutorial = async () => {
		viewerTutorialVisible.value = false
		activeViewerTutorialTargetElement.value = null
		viewerTutorialRunToken.value += 1
		await restoreViewerTutorialUiState()
		persistViewerTutorialState({
			completed: true,
			skipped: false,
			lastCompletedAt: new Date().toISOString()
		})
	}

	const advanceViewerTutorial = async () => {
		if( viewerTutorialVisible.value === false ){
			return
		}

		if( viewerTutorialStepIndex.value >= viewerTutorialSteps.value.length - 1 ){
			await completeViewerTutorial()
			return
		}

		await activateViewerTutorialStep( viewerTutorialStepIndex.value + 1 )
	}

	const rewindViewerTutorial = async () => {
		if( viewerTutorialVisible.value === false ) return
		if( viewerTutorialStepIndex.value <= 0 ) return

		await activateViewerTutorialStep( viewerTutorialStepIndex.value - 1 )
	}

	const resetViewerTutorialState = () => {
		viewerTutorialPromptVisible.value = false
		viewerTutorialVisible.value = false
		viewerTutorialStepIndex.value = 0
		viewerTutorialRunToken.value += 1
		tutorialDisplaySelectOpen.value = false
		tutorialDisplayOptionsOpen.value = false
		tutorialProjectMenuOpen.value = false
		activeViewerTutorialTargetElement.value = null
		viewerTutorialOriginalDisplayMode.value = ""
		viewerTutorialOriginalInteractionMode.value = ""
		viewerTutorialOriginalSpectralCalibrationPanelOpen.value = false
		viewerTutorialOriginalSpectralCalibrationSidebarOpen.value = false
		closeTutorialTransientUi()
	}

	return {
		viewerTutorialPromptVisible,
		viewerTutorialVisible,
		viewerTutorialStepIndex,
		activeViewerTutorialTargetElement,
		activeViewerTutorialStep,
		viewerTutorialSteps,
		isHeatmapTutorialStepActive,
		isProjectMenuItemDimmed,
		projectMenuDividerClass,
		showTutorialRamanSidebarPlaceholder,
		showRamanInferenceTutorialBlock,
		displayOptionsMenuClass,
		projectMenuClass,
		displaySelectMenuClass,
		tutorialDisplaySelectOpenBinding,
		tutorialDisplayOptionsOpenBinding,
		tutorialProjectMenuOpenBinding,
		handleTutorialDisplaySelectOpenUpdate,
		handleTutorialDisplayOptionsOpenUpdate,
		handleTutorialProjectMenuOpenUpdate,
		maybeOfferViewerTutorialPrompt,
		startViewerTutorial,
		restartViewerTutorial,
		skipViewerTutorialPrompt,
		skipActiveViewerTutorial,
		advanceViewerTutorial,
		rewindViewerTutorial,
		resetViewerTutorialState
	}
}
