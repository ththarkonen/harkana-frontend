import { computed, ref } from "vue"

function normalizePreparationTargets( targets ){
	return ( Array.isArray( targets ) ? targets : [] ).filter(( target ) => {
		return typeof target === "string" && target.length > 0
	})
}

export function createPreparationState( emitLoaded ){

	const currentPreparationTarget = ref( null )
	const queuedPreparationTargets = ref( [] )
	const completedPreparationTargets = ref( [] )
	const failedPreparationTargets = ref( [] )
	const viewerLoadedEmitted = ref( false )

	const pendingPreparationTargets = computed(() => {
		const completed = new Set( completedPreparationTargets.value )
		const failed = new Set( failedPreparationTargets.value )
		const orderedTargets = []

		if( typeof currentPreparationTarget.value === "string" && currentPreparationTarget.value.length > 0 ){
			orderedTargets.push( currentPreparationTarget.value )
		}

		for( const target of queuedPreparationTargets.value ){
			orderedTargets.push( target )
		}

		return orderedTargets.filter(( target, index ) => {
			return completed.has( target ) === false &&
				failed.has( target ) === false &&
				orderedTargets.indexOf( target ) === index
		})
	})

	const showDisplayInfoIcon = computed(() => pendingPreparationTargets.value.length > 0 )

	const resetPreparationState = () => {
		currentPreparationTarget.value = null
		queuedPreparationTargets.value = []
		completedPreparationTargets.value = []
		failedPreparationTargets.value = []
		viewerLoadedEmitted.value = false
	}

	const setQueuedPreparationTargets = ( targets ) => {
		queuedPreparationTargets.value = normalizePreparationTargets( targets )
	}

	const markPreparationStarted = ( target ) => {
		currentPreparationTarget.value = target
	}

	const markPreparationCompleted = ( target ) => {
		if( typeof target !== "string" || target.length === 0 ) return

		if( completedPreparationTargets.value.includes( target ) === false ){
			completedPreparationTargets.value = [ ...completedPreparationTargets.value, target ]
		}

		queuedPreparationTargets.value = queuedPreparationTargets.value.filter(( entry ) => entry !== target )
		if( currentPreparationTarget.value === target ){
			currentPreparationTarget.value = null
		}
	}

	const markPreparationFailed = ( target ) => {
		if( typeof target !== "string" || target.length === 0 ) return

		if( failedPreparationTargets.value.includes( target ) === false ){
			failedPreparationTargets.value = [ ...failedPreparationTargets.value, target ]
		}

		queuedPreparationTargets.value = queuedPreparationTargets.value.filter(( entry ) => entry !== target )
		if( currentPreparationTarget.value === target ){
			currentPreparationTarget.value = null
		}
	}

	const emitLoadedOnce = () => {
		if( viewerLoadedEmitted.value ) return
		viewerLoadedEmitted.value = true
		if( typeof emitLoaded === "function" ){
			emitLoaded()
		}
	}

	return {
		currentPreparationTarget,
		queuedPreparationTargets,
		completedPreparationTargets,
		failedPreparationTargets,
		viewerLoadedEmitted,
		pendingPreparationTargets,
		showDisplayInfoIcon,
		resetPreparationState,
		setQueuedPreparationTargets,
		markPreparationStarted,
		markPreparationCompleted,
		markPreparationFailed,
		emitLoadedOnce
	}
}
