const viewerLoadMarksEnabled = String( import.meta.env.VITE_ENABLE_VIEWER_LOAD_MARKS ?? "" ).toLowerCase() === "true"

const hasPerformanceApi = () => {
	return typeof performance !== "undefined" &&
		typeof performance.mark === "function" &&
		typeof performance.measure === "function"
}

export function markViewerLoad( name, detail = undefined ){
	if( viewerLoadMarksEnabled === false || hasPerformanceApi() === false ) return
	if( typeof name !== "string" || name.length === 0 ) return

	const markName = `harkana:${name}`
	try{
		performance.mark( markName, detail === undefined ? undefined : { detail })
	} catch( error ){
		performance.mark( markName )
	}
}

export function measureViewerLoad( name, startMark, endMark ){
	if( viewerLoadMarksEnabled === false || hasPerformanceApi() === false ) return
	if( typeof name !== "string" || name.length === 0 ) return
	if( typeof startMark !== "string" || startMark.length === 0 ) return
	if( typeof endMark !== "string" || endMark.length === 0 ) return

	try{
		performance.measure(
			`harkana:${name}`,
			`harkana:${startMark}`,
			`harkana:${endMark}`
		)
	} catch( error ){
		// Missing marks should not affect viewer behavior.
	}
}
