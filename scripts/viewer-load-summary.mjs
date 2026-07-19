import { readdir, readFile } from "node:fs/promises"
import { gzipSync } from "node:zlib"
import path from "node:path"

const root = process.cwd()

const apps = [
	{
		name: "hcars",
		viewerPattern: /^HyperspectrumViewer-.*\.js$/
	},
	{
		name: "cars",
		viewerPattern: /^ProjectViewer-.*\.js$/
	},
	{
		name: "raman",
		viewerPattern: /^ProjectViewer-.*\.js$/
	}
]

const lazyViewerChunkPattern = /(?:Modal|ProjectChatWindow|ViewerTutorial|CalibrationPanel|Roi|GpuInference|XyzSettings|SpectralAxisOverwrite|CustomIndex).*\.js$/

function formatKib( bytes ){
	return `${( bytes / 1024 ).toFixed( 1 )} KiB`
}

async function fileSizeSummary( filePath ){
	const source = await readFile( filePath )
	return {
		rawBytes: source.length,
		gzipBytes: gzipSync( source ).length
	}
}

async function summarizeApp( app ){
	const assetsDir = path.join( root, "apps", app.name, "dist", "assets" )
	const files = await readdir( assetsDir )
	const viewerFile = files.find(( file ) => app.viewerPattern.test( file ))
	const lazyViewerFiles = files
		.filter(( file ) => lazyViewerChunkPattern.test( file ))
		.sort()

	if( viewerFile === undefined ){
		throw new Error( `No built viewer chunk found for ${app.name}. Run npm run build in apps/${app.name} first.` )
	}

	const viewerSummary = await fileSizeSummary( path.join( assetsDir, viewerFile ))
	const lazySummaries = await Promise.all(
		lazyViewerFiles.map( async ( file ) => ({
			file,
			...( await fileSizeSummary( path.join( assetsDir, file )))
		}))
	)
	const lazyTotals = lazySummaries.reduce(( totals, summary ) => {
		totals.rawBytes += summary.rawBytes
		totals.gzipBytes += summary.gzipBytes
		return totals
	}, { rawBytes: 0, gzipBytes: 0 })

	return {
		app: app.name,
		viewerFile,
		viewerSummary,
		lazySummaries,
		lazyTotals
	}
}

for( const app of apps ){
	const summary = await summarizeApp( app )
	console.log( `\n${summary.app}` )
	console.log( `  viewer: ${summary.viewerFile}` )
	console.log( `  viewer size: ${formatKib( summary.viewerSummary.rawBytes )} raw, ${formatKib( summary.viewerSummary.gzipBytes )} gzip` )
	console.log( `  lazy viewer chunks: ${summary.lazySummaries.length}` )
	console.log( `  lazy viewer total: ${formatKib( summary.lazyTotals.rawBytes )} raw, ${formatKib( summary.lazyTotals.gzipBytes )} gzip` )
}
