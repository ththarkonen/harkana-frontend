import { computed, ref } from "vue"

function createDefaultTutorialState(){
	return {
		prompted: false,
		completed: false,
		skipped: false,
		lastCompletedAt: ""
	}
}

function tutorialStorageKey( dataType = "" ){
	const normalizedDataType = String( dataType ?? "" ).trim().toLowerCase() || "spectrum"
	return `harkana.spectrumProjectTutorial.${normalizedDataType}.v1`
}

function readTutorialState( dataType = "" ){
	if( typeof window === "undefined" || typeof window.localStorage === "undefined" ){
		return createDefaultTutorialState()
	}

	try{
		const raw = window.localStorage.getItem( tutorialStorageKey( dataType ) )
		if( typeof raw !== "string" || raw.length === 0 ){
			return createDefaultTutorialState()
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
		return createDefaultTutorialState()
	}
}

function waitForDelay( delayMs ){
	return new Promise(( resolve ) => {
		const timerScope = typeof window !== "undefined" ? window : globalThis
		timerScope.setTimeout( resolve, delayMs )
	})
}

export function useSpectrumProjectTutorial( options ){

	const nextTick = options.nextTick
	const project = options.project
	const dataType = String( options.dataType ?? "" ).trim().toLowerCase() || "spectrum"
	const projectMenuDropdown = options.projectMenuDropdown
	const displayOptionsDropdown = options.displayOptionsDropdown
	const startCalibration = typeof options.startCalibration === "function" ? options.startCalibration : async () => {}
	const cancelCalibration = typeof options.cancelCalibration === "function" ? options.cancelCalibration : () => {}
	const calibrating = options.calibrating
	const calibrationPanelOpen = options.calibrationPanelOpen

	const tutorialState = ref( readTutorialState( dataType ) )
	const tutorialPromptVisible = ref( false )
	const tutorialVisible = ref( false )
	const tutorialStepIndex = ref( 0 )
	const tutorialRunToken = ref( 0 )
	const tutorialProjectMenuOpen = ref( false )
	const tutorialDisplayOptionsOpen = ref( false )
	const activeTutorialTargetElement = ref( null )
	const originalCalibrating = ref( false )
	const originalCalibrationPanelOpen = ref( false )

	const persistTutorialState = ( nextState ) => {
		tutorialState.value = {
			...createDefaultTutorialState(),
			...tutorialState.value,
			...nextState
		}

		if( typeof window === "undefined" || typeof window.localStorage === "undefined" ){
			return
		}

		try{
			window.localStorage.setItem(
				tutorialStorageKey( dataType ),
				JSON.stringify( tutorialState.value )
			)
		} catch( error ){
			console.log( error )
		}
	}

	const tutorialTargetElement = ( targetKey ) => {
		if( typeof document === "undefined" ) return null
		const normalizedKey = String( targetKey ?? "" ).trim()
		if( normalizedKey.length === 0 ) return null
		return document.querySelector( `[data-tutorial="${normalizedKey}"]` )
	}

	const projectIsShared = computed(() => project.value?.shared === true )

	const tutorialSteps = computed(() => {
		const steps = [
			{
				id: "layout",
				kind: "highlight",
				title: "Spectrum project layout",
				body: "This viewer keeps the measured spectrum, estimate results, comparison controls, and project actions in one workspace.",
				target: "spectrum-viewer-layout",
				placement: "center"
			},
			{
				id: "display-options",
				kind: "menu",
				title: "Display options",
				body: "Use Display to change the pane layout, toggle project traces, choose uncertainty visibility, and control legend hover emphasis.",
				target: "spectrum-display-options",
				placement: "right"
			},
			{
				id: "comparison",
				kind: "highlight",
				title: "Comparison projects",
				body: "Select any number of related projects here. Comparison traces use their own colors and can include measurement, estimate, and uncertainty traces.",
				target: "spectrum-comparison-section",
				placement: "right"
			},
			{
				id: "spectra",
				kind: "highlight",
				title: "Spectrum panes",
				body: "The plot area shows measured data and, when available, estimate traces. Hover legend chips to emphasize matching traces, or use the Display menu to hide trace families.",
				target: "spectrum-panes",
				placement: "left"
			},
			{
				id: "project-menu",
				kind: "menu",
				title: "Project actions",
				body: "Use the Project menu to rename the project, start calibration, open notes and metadata, download data, share the project, or return to the main menu.",
				target: "spectrum-project-menu",
				placement: "bottom"
			}
		]

		if( projectIsShared.value === false ){
			steps.push(
				{
					id: "calibration-sidebar",
					kind: "highlight",
					title: "Calibration sidebar",
					body: "Calibration is opened from the Project menu. The sidebar lets you preview saved calibration profiles, assign one to the current project, or open the point editor.",
					target: "spectrum-calibration-sidebar-block",
					placement: "right"
				},
				{
				id: "calibration-panel",
				kind: "highlight",
				title: "Calibration point editor",
				body: "Click traces to add source points, enter true horizontal axis locations, choose polynomial terms, preview the correction, then save the profile with a name and description.",
				target: "spectrum-calibration-panel",
				placement: "left"
			}
			)
		}

		steps.push(
			{
				id: "project-sharing-actions",
				kind: "menu",
				title: "Sharing and export",
				body: "The lower Project menu actions handle notes, metadata, download, sharing, Zenodo export, visualization settings, and navigation back to the project list.",
				target: "spectrum-project-menu",
				placement: "bottom"
			},
			{
				id: "finish",
				kind: "centered",
				title: "You are ready to inspect spectra",
				body: "You can reopen this tutorial later from the Project menu.",
				target: "",
				placement: "center"
			}
		)

		return steps
	})

	const activeTutorialStep = computed(() => {
		if( tutorialVisible.value === false ){
			return null
		}

		return tutorialSteps.value[ tutorialStepIndex.value ] ?? null
	})

	const activeTutorialStepId = computed(() => {
		return tutorialVisible.value
			? tutorialSteps.value[ tutorialStepIndex.value ]?.id ?? ""
			: ""
	})

	const tutorialProjectMenuOpenBinding = computed(() => {
		return tutorialVisible.value ? tutorialProjectMenuOpen.value : undefined
	})

	const tutorialDisplayOptionsOpenBinding = computed(() => {
		return tutorialVisible.value ? tutorialDisplayOptionsOpen.value : undefined
	})

	const projectMenuClass = computed(() => {
		if( activeTutorialStepId.value === "project-menu" || activeTutorialStepId.value === "project-sharing-actions" ){
			return "fixed z-[10030] pointer-events-none min-w-[14rem] w-max max-w-[50vw] max-h-[min(32rem,calc(100vh-4rem))] overflow-y-auto origin-top-left rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30"
		}

		return "fixed z-[45] min-w-[14rem] w-max max-w-[50vw] max-h-[min(32rem,calc(100vh-4rem))] overflow-y-auto origin-top-left rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30"
	})

	const displayOptionsMenuClass = computed(() => {
		return activeTutorialStepId.value === "display-options"
			? "fixed z-[10030] pointer-events-none min-w-[16rem] w-max max-w-[50vw] origin-top-left rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30"
			: "fixed z-[45] min-w-[16rem] w-max max-w-[50vw] origin-top-left rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30"
	})

	const handleTutorialProjectMenuOpenUpdate = ( nextOpen ) => {
		if(( activeTutorialStepId.value === "project-menu" || activeTutorialStepId.value === "project-sharing-actions" ) && nextOpen !== true ){
			return
		}

		tutorialProjectMenuOpen.value = nextOpen === true
	}

	const handleTutorialDisplayOptionsOpenUpdate = ( nextOpen ) => {
		if( activeTutorialStepId.value === "display-options" && nextOpen !== true ){
			return
		}

		tutorialDisplayOptionsOpen.value = nextOpen === true
	}

	const refreshActiveTutorialTargetElement = () => {
		const targetKey = activeTutorialStep.value?.target ?? ""
		activeTutorialTargetElement.value = tutorialTargetElement( targetKey )
	}

	const focusTutorialTarget = async ( targetKey ) => {
		const element = tutorialTargetElement( targetKey )
		if( element instanceof HTMLElement ){
			element.scrollIntoView({ block: "nearest", inline: "nearest" })
		}
		await nextTick()
	}

	const closeTutorialTransientUi = () => {
		tutorialProjectMenuOpen.value = false
		tutorialDisplayOptionsOpen.value = false
		projectMenuDropdown.value?.close?.()
		displayOptionsDropdown.value?.close?.()
	}

	const restoreTutorialUiState = async () => {
		closeTutorialTransientUi()

		if( originalCalibrating.value === false && calibrating.value === true ){
			cancelCalibration()
			return
		}

		if( originalCalibrationPanelOpen.value === false ){
			calibrationPanelOpen.value = false
		}
	}

	const ensureCalibrationVisible = async () => {
		if( projectIsShared.value ){
			return
		}

		if( calibrating.value === false ){
			await startCalibration()
		}

		await nextTick()
	}

	const enterTutorialStep = async ( step ) => {
		if( step === null ){
			return
		}

		closeTutorialTransientUi()

		if( step.id === "display-options" ){
			await focusTutorialTarget( step.target )
			tutorialDisplayOptionsOpen.value = true
			displayOptionsDropdown.value?.open?.()
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

		if( step.id === "calibration-sidebar" ){
			await ensureCalibrationVisible()
			calibrationPanelOpen.value = false
			await focusTutorialTarget( step.target )
			return
		}

		if( step.id === "calibration-panel" ){
			await ensureCalibrationVisible()
			calibrationPanelOpen.value = true
			await nextTick()
			await waitForDelay( 24 )
			await focusTutorialTarget( step.target )
			return
		}

		await focusTutorialTarget( step.target )
	}

	const activateTutorialStep = async ( nextIndex ) => {
		if( tutorialVisible.value === false ){
			activeTutorialTargetElement.value = null
			return
		}

		const clampedIndex = Math.max( 0, Math.min( tutorialSteps.value.length - 1, nextIndex ))
		const nextToken = tutorialRunToken.value + 1
		tutorialRunToken.value = nextToken
		tutorialStepIndex.value = clampedIndex
		await nextTick()
		refreshActiveTutorialTargetElement()
		if( nextToken !== tutorialRunToken.value ){
			return
		}

		await enterTutorialStep( activeTutorialStep.value )
		await nextTick()
		refreshActiveTutorialTargetElement()
	}

	const maybeOfferTutorialPrompt = () => {
		if( project.value?.id === "" ) return
		if( tutorialVisible.value || tutorialPromptVisible.value ) return
		if( tutorialState.value.completed === true ) return
		if( tutorialState.value.skipped === true ) return
		if( tutorialState.value.prompted === true ) return

		persistTutorialState({ prompted: true })

		waitForDelay( 0 ).then(() => {
			if( project.value?.id === "" ) return
			tutorialPromptVisible.value = true
		})
	}

	const startTutorial = async () => {
		tutorialPromptVisible.value = false
		originalCalibrating.value = calibrating.value === true
		originalCalibrationPanelOpen.value = calibrationPanelOpen.value === true
		tutorialVisible.value = true
		tutorialStepIndex.value = 0
		await activateTutorialStep( 0 )
	}

	const restartTutorial = async () => {
		tutorialPromptVisible.value = false
		if( tutorialVisible.value ){
			await restoreTutorialUiState()
		}

		originalCalibrating.value = calibrating.value === true
		originalCalibrationPanelOpen.value = calibrationPanelOpen.value === true
		tutorialVisible.value = true
		tutorialStepIndex.value = 0
		await activateTutorialStep( 0 )
	}

	const skipTutorialPrompt = () => {
		tutorialPromptVisible.value = false
		persistTutorialState({ skipped: true })
	}

	const skipActiveTutorial = async () => {
		if( tutorialVisible.value === false ){
			return
		}

		tutorialVisible.value = false
		activeTutorialTargetElement.value = null
		tutorialRunToken.value += 1
		await restoreTutorialUiState()

		if( tutorialState.value.completed !== true ){
			persistTutorialState({ skipped: true })
		}
	}

	const completeTutorial = async () => {
		tutorialVisible.value = false
		activeTutorialTargetElement.value = null
		tutorialRunToken.value += 1
		await restoreTutorialUiState()
		persistTutorialState({
			completed: true,
			skipped: false,
			lastCompletedAt: new Date().toISOString()
		})
	}

	const advanceTutorial = async () => {
		if( tutorialVisible.value === false ){
			return
		}

		if( tutorialStepIndex.value >= tutorialSteps.value.length - 1 ){
			await completeTutorial()
			return
		}

		await activateTutorialStep( tutorialStepIndex.value + 1 )
	}

	const rewindTutorial = async () => {
		if( tutorialVisible.value === false ) return
		if( tutorialStepIndex.value <= 0 ) return

		await activateTutorialStep( tutorialStepIndex.value - 1 )
	}

	const resetTutorialState = () => {
		tutorialPromptVisible.value = false
		tutorialVisible.value = false
		tutorialStepIndex.value = 0
		tutorialRunToken.value += 1
		tutorialProjectMenuOpen.value = false
		tutorialDisplayOptionsOpen.value = false
		activeTutorialTargetElement.value = null
		originalCalibrating.value = false
		originalCalibrationPanelOpen.value = false
		closeTutorialTransientUi()
	}

	return {
		tutorialPromptVisible,
		tutorialVisible,
		tutorialStepIndex,
		activeTutorialTargetElement,
		activeTutorialStep,
		tutorialSteps,
		tutorialProjectMenuOpenBinding,
		tutorialDisplayOptionsOpenBinding,
		projectMenuClass,
		displayOptionsMenuClass,
		handleTutorialProjectMenuOpenUpdate,
		handleTutorialDisplayOptionsOpenUpdate,
		maybeOfferTutorialPrompt,
		startTutorial,
		restartTutorial,
		skipTutorialPrompt,
		skipActiveTutorial,
		advanceTutorial,
		rewindTutorial,
		resetTutorialState
	}
}
