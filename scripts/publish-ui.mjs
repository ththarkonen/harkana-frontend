#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = resolve( dirname( fileURLToPath( import.meta.url )), ".." )

const APPS = {
	cars: {
		label: "CARS",
		packageName: "cars-platform",
		appDir: "apps/cars",
		bucket: "carsplatform-20251105230922-hostingbucket-cars",
		distributionId: "E2FYUCN6VIY7ZO"
	},
	raman: {
		label: "Raman",
		packageName: "raman-platform",
		appDir: "apps/raman",
		bucket: "raman-20251220113958-hostingbucket-dev",
		distributionId: "E3G8K8ZWWVGQBI"
	},
	hcars: {
		label: "H-CARS",
		packageName: "hypercars-platform",
		appDir: "apps/hcars",
		bucket: "hcars-20260226195713-hostingbucket-dev",
		distributionId: "EFGM8YEBLYQCX"
	},
	landing: {
		label: "Landing",
		packageName: "harkana-landing-page",
		appDir: "apps/landing",
		bucket: "landing-20251114192407-hostingbucket-dev",
		distributionId: "E2C7IZALJ62PPO"
	}
}

const APP_ALIASES = {
	all: Object.keys( APPS ),
	uis: [ "cars", "raman", "hcars" ]
}

function usage(){
	console.log( `Usage: node scripts/publish-ui.mjs <cars|raman|hcars|landing|uis|all> [...targets] [options]

Publishes static frontend artifacts to the existing S3 hosting buckets and creates CloudFront invalidations.
This intentionally does not run amplify publish, because that would also push backend resources.

Options:
  --dry-run              Print commands without executing them.
  --skip-build           Reuse existing dist folders.
  --allow-dirty          Allow publishing from a dirty git worktree.
  --no-invalidate        Skip CloudFront invalidation.
  --profile <name>       AWS profile to pass to aws CLI.
  --region <region>      AWS region for S3 sync. Defaults to eu-north-1.
  --build-sha <sha>      Build SHA injected into Vite env. Defaults to current git HEAD.
  --build-date <iso>     Build timestamp injected into Vite env. Defaults to current time.
  -h, --help             Show this help.

Examples:
  pnpm run publish:cars -- --profile default
  pnpm run publish:uis -- --profile default
  pnpm run publish:all -- --profile default --allow-dirty
  pnpm run publish:dry-run
` )
}

function fail( message ){
	console.error( `\n${message}` )
	process.exit( 1 )
}

function readOptionValue( args, index, optionName ){
	const value = args[ index + 1 ]
	if( !value || value.startsWith( "--" )){
		fail( `${optionName} requires a value.` )
	}
	return value
}

function parseArgs( argv ){
	const options = {
		dryRun: false,
		skipBuild: false,
		allowDirty: false,
		invalidate: true,
		profile: "",
		region: "eu-north-1",
		buildSha: "",
		buildDate: ""
	}
	const targetArgs = []

	for( let index = 0; index < argv.length; index += 1 ){
		const arg = argv[ index ]
		if( arg === "-h" || arg === "--help" ){
			usage()
			process.exit( 0 )
		}
		if( arg === "--dry-run" ){
			options.dryRun = true
			continue
		}
		if( arg === "--skip-build" ){
			options.skipBuild = true
			continue
		}
		if( arg === "--allow-dirty" ){
			options.allowDirty = true
			continue
		}
		if( arg === "--no-invalidate" ){
			options.invalidate = false
			continue
		}
		if( arg === "--profile" ){
			options.profile = readOptionValue( argv, index, arg )
			index += 1
			continue
		}
		if( arg === "--region" ){
			options.region = readOptionValue( argv, index, arg )
			index += 1
			continue
		}
		if( arg === "--build-sha" ){
			options.buildSha = readOptionValue( argv, index, arg ).substring( 0, 12 )
			index += 1
			continue
		}
		if( arg === "--build-date" ){
			options.buildDate = readOptionValue( argv, index, arg )
			index += 1
			continue
		}
		if( arg.startsWith( "--" )){
			fail( `Unknown option: ${arg}` )
		}
		targetArgs.push( arg )
	}

	if( targetArgs.length === 0 ){
		usage()
		fail( "At least one publish target is required." )
	}

	return {
		options,
		targets: expandTargets( targetArgs )
	}
}

function expandTargets( targetArgs ){
	const targets = []
	const seen = new Set()

	for( const arg of targetArgs ){
		const expanded = APP_ALIASES[ arg ] ?? [ arg ]
		for( const target of expanded ){
			if( !APPS[ target ] ){
				fail( `Unknown publish target: ${target}` )
			}
			if( !seen.has( target )){
				seen.add( target )
				targets.push( target )
			}
		}
	}

	return targets
}

function gitOutput( args ){
	return execFileSync( "git", args, {
		cwd: repoRoot,
		encoding: "utf8",
		stdio: [ "ignore", "pipe", "ignore" ]
	}).trim()
}

function resolveBuildSha( explicitSha ){
	if( explicitSha ){
		return explicitSha.substring( 0, 12 )
	}
	try{
		return gitOutput([ "rev-parse", "--short=12", "HEAD" ])
	} catch {
		return ""
	}
}

function gitHasChanges(){
	try{
		return gitOutput([ "status", "--porcelain" ]).length > 0
	} catch {
		return false
	}
}

function commandText( command, args ){
	return [ command, ...args ].map(( part ) => {
		if( /^[A-Za-z0-9_./:@=+-]+$/.test( part )){
			return part
		}
		return JSON.stringify( part )
	}).join( " " )
}

function runCommand( command, args, { dryRun, env = process.env } = {} ){
	console.log( `$ ${commandText( command, args )}` )
	if( dryRun ){
		return
	}

	const result = spawnSync( command, args, {
		cwd: repoRoot,
		env,
		stdio: "inherit"
	})

	if( result.error ){
		fail( `Command failed to start: ${result.error.message}` )
	}
	if( result.status !== 0 ){
		process.exit( result.status ?? 1 )
	}
}

function awsArgs( args, options, { includeRegion = false } = {} ){
	const nextArgs = [ ...args ]
	if( includeRegion && options.region ){
		nextArgs.push( "--region", options.region )
	}
	if( options.profile ){
		nextArgs.push( "--profile", options.profile )
	}
	return nextArgs
}

function assertDistExists( app ){
	const distPath = resolve( repoRoot, app.appDir, "dist" )
	if( !existsSync( distPath )){
		fail( `${distPath} does not exist. Run without --skip-build, or build ${app.label} first.` )
	}
	return distPath
}

function publishApp( target, options, versionEnv ){
	const app = APPS[ target ]
	console.log( `\n== ${app.label} ==` )

	if( !options.skipBuild ){
		runCommand( "pnpm", [ "--filter", app.packageName, "build" ], {
			dryRun: options.dryRun,
			env: {
				...process.env,
				...versionEnv
			}
		})
	}

	const distPath = resolve( repoRoot, app.appDir, "dist" )
	if( !options.dryRun ){
		assertDistExists( app )
	}

	runCommand(
		"aws",
		awsArgs([ "s3", "sync", distPath, `s3://${app.bucket}`, "--delete" ], options, { includeRegion: true }),
		{ dryRun: options.dryRun }
	)

	if( options.invalidate ){
		runCommand(
			"aws",
			awsArgs([ "cloudfront", "create-invalidation", "--distribution-id", app.distributionId, "--paths", "/*" ], options),
			{ dryRun: options.dryRun }
		)
	}
}

const { options, targets } = parseArgs( process.argv.slice( 2 ))
const buildSha = resolveBuildSha( options.buildSha )
const buildDate = options.buildDate || new Date().toISOString()
const versionEnv = {
	VITE_APP_BUILD_SHA: buildSha,
	VITE_APP_BUILD_DATE: buildDate
}

if( gitHasChanges() && !options.allowDirty && !options.dryRun ){
	fail( "Refusing to publish from a dirty git worktree. Commit changes first or pass --allow-dirty." )
}

console.log( `Publishing targets: ${targets.join( ", " )}` )
console.log( `Version metadata: sha=${buildSha || "unknown"}, date=${buildDate}` )
if( options.dryRun ){
	console.log( "Dry run: no commands will be executed." )
}

for( const target of targets ){
	publishApp( target, options, versionEnv )
}

console.log( "\nPublish workflow completed." )
