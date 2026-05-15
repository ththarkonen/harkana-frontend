import { runWhenBrowserIdle, yieldToBrowser } from "../browserIdle.js"
import {
	PROJECT_BACKGROUND_BETWEEN_TASK_DELAY_MS,
	PROJECT_BACKGROUND_HYDRATION_GRACE_MS,
	PROJECT_BACKGROUND_INTERACTION_COOLDOWN_MS,
	PROJECT_BACKGROUND_POINTERMOVE_THROTTLE_MS
} from "./constants.js"

function waitForDelay( delayMs ){
	return new Promise(( resolve ) => {
		const timerScope = typeof window !== "undefined" ? window : globalThis
		timerScope.setTimeout( resolve, delayMs )
	})
}

export function createProjectBackgroundWork( options ){

	const activeProjectLoadRequestID = options.activeProjectLoadRequestID

	let cancelScheduledProjectBackgroundWork = null
	const projectBackgroundTasks = []
	let projectBackgroundWorkRequestID = 0
	let projectBackgroundGraceUntil = 0
	let projectBackgroundNextAllowedAt = 0
	let lastProjectBackgroundInteractionAt = 0
	let removeProjectBackgroundInteractionListeners = null

	const recordProjectBackgroundInteraction = ( eventType = "" ) => {
		const now = Date.now()
		if( eventType === "pointermove" && ( now - lastProjectBackgroundInteractionAt ) < PROJECT_BACKGROUND_POINTERMOVE_THROTTLE_MS ){
			return
		}

		lastProjectBackgroundInteractionAt = now
	}

	const projectBackgroundBlockedUntil = () => {
		let blockedUntil = projectBackgroundGraceUntil
		blockedUntil = Math.max( blockedUntil, projectBackgroundNextAllowedAt )

		if( lastProjectBackgroundInteractionAt > 0 ){
			blockedUntil = Math.max(
				blockedUntil,
				lastProjectBackgroundInteractionAt + PROJECT_BACKGROUND_INTERACTION_COOLDOWN_MS
			)
		}

		return blockedUntil
	}

	const waitForProjectBackgroundIdleWindow = async ( requestID = null ) => {
		while( true ){
			if( requestID !== null && requestID !== activeProjectLoadRequestID.value ){
				return false
			}

			const blockedUntil = projectBackgroundBlockedUntil()
			const remainingMs = blockedUntil - Date.now()
			if( remainingMs <= 0 ){
				await yieldToBrowser()
				if( requestID !== null && requestID !== activeProjectLoadRequestID.value ){
					return false
				}
				return true
			}

			await waitForDelay( Math.max( 32, Math.min( remainingMs, 200 )) )
		}
	}

	const installProjectBackgroundInteractionListeners = () => {
		if( typeof window === "undefined" ) return
		if( typeof removeProjectBackgroundInteractionListeners === "function" ) return

		const onPointerDown = () => {
			recordProjectBackgroundInteraction()
		}
		const onPointerMove = () => {
			recordProjectBackgroundInteraction( "pointermove" )
		}
		const onKeyDown = () => {
			recordProjectBackgroundInteraction()
		}
		const onWheel = () => {
			recordProjectBackgroundInteraction()
		}
		const onTouchStart = () => {
			recordProjectBackgroundInteraction()
		}

		window.addEventListener( "pointerdown", onPointerDown, { passive: true })
		window.addEventListener( "pointermove", onPointerMove, { passive: true })
		window.addEventListener( "keydown", onKeyDown, { passive: true })
		window.addEventListener( "wheel", onWheel, { passive: true })
		window.addEventListener( "touchstart", onTouchStart, { passive: true })

		removeProjectBackgroundInteractionListeners = () => {
			window.removeEventListener( "pointerdown", onPointerDown )
			window.removeEventListener( "pointermove", onPointerMove )
			window.removeEventListener( "keydown", onKeyDown )
			window.removeEventListener( "wheel", onWheel )
			window.removeEventListener( "touchstart", onTouchStart )
			removeProjectBackgroundInteractionListeners = null
		}
	}

	const removeBackgroundInteractionListeners = () => {
		if( typeof removeProjectBackgroundInteractionListeners === "function" ){
			removeProjectBackgroundInteractionListeners()
		}
	}

	const clearProjectBackgroundWork = () => {
		projectBackgroundTasks.length = 0
		projectBackgroundWorkRequestID += 1
		projectBackgroundGraceUntil = 0
		projectBackgroundNextAllowedAt = 0

		if( typeof cancelScheduledProjectBackgroundWork === "function" ){
			cancelScheduledProjectBackgroundWork()
			cancelScheduledProjectBackgroundWork = null
		}
	}

	const scheduleProjectBackgroundWork = () => {
		if( projectBackgroundTasks.length === 0 ) return
		if( typeof cancelScheduledProjectBackgroundWork === "function" ) return

		const requestID = projectBackgroundWorkRequestID
		const delayMs = Math.max( 0, projectBackgroundBlockedUntil() - Date.now() )

		cancelScheduledProjectBackgroundWork = runWhenBrowserIdle( async () => {
			cancelScheduledProjectBackgroundWork = null
			if( requestID !== projectBackgroundWorkRequestID ) return
			if( projectBackgroundTasks.length === 0 ) return

			if( projectBackgroundBlockedUntil() > Date.now() ){
				scheduleProjectBackgroundWork()
				return
			}

			const task = projectBackgroundTasks.shift()
			if( typeof task === "function" ){
				try{
					await task()
				} catch( error ){
					console.log( error )
				}
			}

			if( requestID !== projectBackgroundWorkRequestID ) return
			projectBackgroundNextAllowedAt = Date.now() + PROJECT_BACKGROUND_BETWEEN_TASK_DELAY_MS
			if( projectBackgroundTasks.length > 0 ){
				scheduleProjectBackgroundWork()
			}
		}, { delayMs } )
	}

	const enqueueProjectBackgroundTask = ( task ) => {
		if( typeof task !== "function" ) return
		projectBackgroundTasks.push( task )
		scheduleProjectBackgroundWork()
	}

	const beginProjectBackgroundHydrationGraceWindow = () => {
		projectBackgroundGraceUntil = Date.now() + PROJECT_BACKGROUND_HYDRATION_GRACE_MS
	}

	return {
		waitForProjectBackgroundIdleWindow,
		installProjectBackgroundInteractionListeners,
		removeBackgroundInteractionListeners,
		clearProjectBackgroundWork,
		enqueueProjectBackgroundTask,
		beginProjectBackgroundHydrationGraceWindow
	}
}
