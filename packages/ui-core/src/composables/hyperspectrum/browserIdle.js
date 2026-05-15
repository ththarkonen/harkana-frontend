export function runWhenBrowserIdle( callback, options = {} ){

	const delayMs = Math.max( 0, Number( options?.delayMs ) || 0 )
	const timeoutMs = Number( options?.timeoutMs )
	const hasTimeout = Number.isFinite( timeoutMs ) && timeoutMs >= 0
	let cancelled = false
	let idleHandle = null
	let delayHandle = null

	const invokeCallback = () => {
		if( cancelled ) return
		void callback()
	}

	const scheduleIdleCallback = () => {
		if( cancelled ) return

		if( typeof window !== "undefined" && typeof window.requestIdleCallback === "function" ){
			idleHandle = hasTimeout
				? window.requestIdleCallback( invokeCallback, { timeout: timeoutMs })
				: window.requestIdleCallback( invokeCallback )
			return
		}

		const timerScope = typeof window !== "undefined" ? window : globalThis
		idleHandle = timerScope.setTimeout( invokeCallback, 32 )
	}

	if( delayMs > 0 ){
		const timerScope = typeof window !== "undefined" ? window : globalThis
		delayHandle = timerScope.setTimeout( scheduleIdleCallback, delayMs )
	} else {
		scheduleIdleCallback()
	}

	return () => {
		cancelled = true

		if( delayHandle !== null ){
			const timerScope = typeof window !== "undefined" ? window : globalThis
			timerScope.clearTimeout( delayHandle )
		}

		if( idleHandle !== null ){
			if( typeof window !== "undefined" && typeof window.cancelIdleCallback === "function" ){
				window.cancelIdleCallback( idleHandle )
			} else {
				const timerScope = typeof window !== "undefined" ? window : globalThis
				timerScope.clearTimeout( idleHandle )
			}
		}
	}
}

export async function yieldToBrowser(){
	await new Promise(( resolve ) => {
		if( typeof window !== "undefined" && typeof window.requestAnimationFrame === "function" ){
			window.requestAnimationFrame(() => resolve() )
			return
		}

		const timerScope = typeof window !== "undefined" ? window : globalThis
		timerScope.setTimeout( resolve, 0 )
	})
}

export function normalizedLoadPriority( priority ){
	return priority === "low" ? "low" : "high"
}

export function shouldChunkBackgroundLoad( priority ){
	return normalizedLoadPriority( priority ) === "low"
}
