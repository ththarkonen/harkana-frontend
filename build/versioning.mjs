import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

function normalizeString( value ){
	const normalized = String( value ?? "" ).trim()
	return normalized.length > 0 ? normalized : ""
}

function readPackageVersion( configUrl ){
	const configPath = fileURLToPath( configUrl )
	const packagePath = resolve( dirname( configPath ), "package.json" )

	try{
		const packageJson = JSON.parse( readFileSync( packagePath, "utf8" ))
		return normalizeString( packageJson.version ) || "1.0.0"
	} catch {
		return "1.0.0"
	}
}

function resolveGitSha(){
	const envSha = normalizeString(
		process.env.VITE_APP_BUILD_SHA ??
		process.env.GIT_COMMIT ??
		process.env.AWS_COMMIT_ID ??
		process.env.COMMIT_SHA
	)
	if( envSha.length > 0 ){
		return envSha.substring( 0, 12 )
	}

	try{
		return execFileSync( "git", [ "rev-parse", "--short=12", "HEAD" ], {
			encoding: "utf8",
			stdio: [ "ignore", "pipe", "ignore" ]
		}).trim()
	} catch {
		return ""
	}
}

function resolveFrontendVersion( configUrl ){
	const release = readPackageVersion( configUrl )
	const buildSha = resolveGitSha()
	const buildDate = normalizeString( process.env.VITE_APP_BUILD_DATE ) || new Date().toISOString()
	const display = buildSha.length > 0 ? `${release}+sha${buildSha}` : release

	return {
		release,
		buildSha,
		buildDate,
		display
	}
}

function defineFrontendVersion( versionInfo = {} ){
	return {
		"import.meta.env.VITE_APP_VERSION": JSON.stringify( normalizeString( versionInfo.release ) || "1.0.0" ),
		"import.meta.env.VITE_APP_BUILD_SHA": JSON.stringify( normalizeString( versionInfo.buildSha )),
		"import.meta.env.VITE_APP_BUILD_DATE": JSON.stringify( normalizeString( versionInfo.buildDate )),
		"import.meta.env.VITE_VERSION": JSON.stringify( normalizeString( versionInfo.display ) || "1.0.0" )
	}
}

export {
	defineFrontendVersion,
	resolveFrontendVersion
}
