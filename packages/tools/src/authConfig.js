const DEFAULT_OAUTH_SCOPES = [ "openid", "email", "profile" ]
const DEFAULT_SOCIAL_PROVIDERS = [ "google", "microsoft" ]
const DEFAULT_MICROSOFT_PROVIDER_NAME = "Microsoft"
const DEFAULT_MICROSOFT_WORK_PROVIDER_NAME = "MicrosoftWork"

const SOCIAL_PROVIDER_DEFINITIONS = {
	google: {
		id: "google",
		label: "Google",
		initial: "G",
		signInType: "provider",
		cognitoProviderName: "Google"
	},
	microsoft: {
		id: "microsoft",
		label: "Microsoft",
		initial: "M",
		signInType: "custom"
	},
	"microsoft-personal": {
		id: "microsoft-personal",
		label: "Microsoft personal",
		initial: "M",
		signInType: "custom"
	},
	"microsoft-work": {
		id: "microsoft-work",
		label: "Microsoft work or school",
		initial: "M",
		signInType: "custom"
	}
}

function splitList( value ){
	if( Array.isArray( value ) ){
		return value
	}

	return String( value ?? "" )
		.split( "," )
		.map(( item ) => item.trim())
		.filter(( item ) => item.length > 0 )
}

function uniqueList( values ){
	return [ ...new Set( values ) ]
}

function normalizeSocialProviderKey( provider ){
	const normalized = String( provider ?? "" ).trim().toLowerCase()

	if( normalized === "microsoft-consumer" || normalized === "microsoft-consumers" ){
		return "microsoft-personal"
	}

	if(
		normalized === "microsoft-institutional"
		|| normalized === "microsoft-organization"
		|| normalized === "microsoft-organizations"
		|| normalized === "microsoft-work-school"
	){
		return "microsoft-work"
	}

	return normalized
}

function normalizeOriginUrl( value ){
	const normalized = String( value ?? "" ).trim()
	if( normalized.length > 0 ){
		return normalized
	}

	if( typeof window !== "undefined" && window.location?.origin ){
		return window.location.origin + "/"
	}

	return ""
}

function normalizeRedirectList( value ){
	const configured = splitList( value )
	if( configured.length > 0 ){
		return configured.join( "," )
	}

	return normalizeOriginUrl()
}

function normalizeOauthConfig( awsconfig ){
	const existingOauth = awsconfig?.oauth ?? {}
	const domain = String(
		import.meta.env.VITE_COGNITO_OAUTH_DOMAIN
		?? existingOauth.domain
		?? ""
	).trim()

	if( domain.length === 0 ){
		return existingOauth
	}

	return {
		...existingOauth,
		domain,
		scope: splitList( import.meta.env.VITE_COGNITO_OAUTH_SCOPES ?? existingOauth.scope ).length > 0
			? splitList( import.meta.env.VITE_COGNITO_OAUTH_SCOPES ?? existingOauth.scope )
			: DEFAULT_OAUTH_SCOPES,
		redirectSignIn: normalizeRedirectList( import.meta.env.VITE_COGNITO_REDIRECT_SIGN_IN ?? existingOauth.redirectSignIn ),
		redirectSignOut: normalizeRedirectList( import.meta.env.VITE_COGNITO_REDIRECT_SIGN_OUT ?? existingOauth.redirectSignOut ),
		responseType: String( import.meta.env.VITE_COGNITO_OAUTH_RESPONSE_TYPE ?? existingOauth.responseType ?? "code" ).trim() || "code"
	}
}

function resolveSocialProviders( awsconfig, oauthConfig ){
	const configured = splitList( import.meta.env.VITE_COGNITO_SOCIAL_PROVIDERS )
	if( configured.length > 0 ){
		return uniqueList( configured.map( normalizeSocialProviderKey ))
	}

	const generated = splitList( awsconfig?.aws_cognito_social_providers )
	if( generated.length > 0 ){
		return uniqueList( generated.map( normalizeSocialProviderKey ))
	}

	return String( oauthConfig?.domain ?? "" ).trim().length > 0
		? [ ...DEFAULT_SOCIAL_PROVIDERS ]
		: []
}

function buildAmplifyConfig( awsconfig ){
	const oauth = normalizeOauthConfig( awsconfig )
	const socialProviders = resolveSocialProviders( awsconfig, oauth )

	return {
		...awsconfig,
		oauth,
		aws_cognito_social_providers: socialProviders
	}
}

function configureAmplify( Amplify, awsconfig ){
	return Amplify.configure( buildAmplifyConfig( awsconfig ))
}

function getConfiguredSocialSignInProviders( awsconfig = {} ){
	const oauth = normalizeOauthConfig( awsconfig )
	if( String( oauth?.domain ?? "" ).trim().length === 0 ){
		return []
	}

	return resolveSocialProviders( awsconfig, oauth )
}

function getMicrosoftCognitoProviderName(){
	return String( import.meta.env.VITE_COGNITO_MICROSOFT_PROVIDER_NAME ?? DEFAULT_MICROSOFT_PROVIDER_NAME ).trim()
		|| DEFAULT_MICROSOFT_PROVIDER_NAME
}

function getMicrosoftPersonalCognitoProviderName(){
	return String(
		import.meta.env.VITE_COGNITO_MICROSOFT_PERSONAL_PROVIDER_NAME
		?? import.meta.env.VITE_COGNITO_MICROSOFT_PROVIDER_NAME
		?? DEFAULT_MICROSOFT_PROVIDER_NAME
	).trim() || DEFAULT_MICROSOFT_PROVIDER_NAME
}

function getMicrosoftWorkCognitoProviderName(){
	return String(
		import.meta.env.VITE_COGNITO_MICROSOFT_WORK_PROVIDER_NAME
		?? import.meta.env.VITE_COGNITO_MICROSOFT_INSTITUTIONAL_PROVIDER_NAME
		?? DEFAULT_MICROSOFT_WORK_PROVIDER_NAME
	).trim() || DEFAULT_MICROSOFT_WORK_PROVIDER_NAME
}

function getCognitoProviderNameForSocialProvider( provider ){
	const normalized = normalizeSocialProviderKey( provider )

	if( normalized === "google" ){
		return "Google"
	}

	if( normalized === "microsoft-personal" ){
		return getMicrosoftPersonalCognitoProviderName()
	}

	if( normalized === "microsoft-work" ){
		return getMicrosoftWorkCognitoProviderName()
	}

	if( normalized === "microsoft" ){
		return getMicrosoftCognitoProviderName()
	}

	return String( provider ?? "" ).trim()
}

function getConfiguredSocialSignInProviderOptions( awsconfig = {} ){
	return getConfiguredSocialSignInProviders( awsconfig )
		.map(( provider ) => {
			const normalized = normalizeSocialProviderKey( provider )
			const definition = SOCIAL_PROVIDER_DEFINITIONS[normalized]

			if( !definition ){
				return {
					id: normalized,
					label: provider,
					initial: String( provider ).substring( 0, 1 ).toUpperCase(),
					signInType: "custom",
					cognitoProviderName: getCognitoProviderNameForSocialProvider( provider )
				}
			}

			return {
				...definition,
				cognitoProviderName: getCognitoProviderNameForSocialProvider( normalized )
			}
		})
		.filter(( provider ) => provider.cognitoProviderName.length > 0 )
}

export {
	buildAmplifyConfig,
	configureAmplify,
	getCognitoProviderNameForSocialProvider,
	getConfiguredSocialSignInProviders,
	getConfiguredSocialSignInProviderOptions,
	getMicrosoftCognitoProviderName,
	getMicrosoftPersonalCognitoProviderName,
	getMicrosoftWorkCognitoProviderName,
	normalizeSocialProviderKey
}
