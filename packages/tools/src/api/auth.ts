import { Amplify } from 'aws-amplify'
const Auth = Amplify.Auth;

type CurrentUserProfile = {
	user: any | null
	username: string
	sub: string
	email: string
	given_name: string
	family_name: string
	attributes: Record<string, string>
}

const normalizeString = ( value: unknown ): string => {
	return typeof value === "string" ? value.trim() : ""
}

const readIdTokenPayload = async (): Promise<Record<string, unknown>> => {
	try {
		const session = await Auth.currentSession()
		const idToken = session.getIdToken()
		const payload = typeof idToken.decodePayload === "function"
			? idToken.decodePayload()
			: {}

		return payload && typeof payload === "object" ? payload : {}
	} catch {
		return {}
	}
}

const readCurrentUser = async ( options: Record<string, unknown> = {} ): Promise<any | null> => {
	try {
		return await Auth.currentAuthenticatedUser( options )
	} catch {
		return null
	}
}

const mergeUserAttributes = (
	userAttributes: Record<string, unknown>,
	payload: Record<string, unknown>
): Record<string, string> => {
	const merged: Record<string, string> = {}
	const keys = [
		"sub",
		"email",
		"given_name",
		"family_name"
	]

	for( const key of keys ){
		merged[key] = normalizeString( userAttributes[key] ?? payload[key] )
	}

	return merged
}

export async function getIdToken(): Promise<string | null> {
	try {
		const session = await Auth.currentSession()
		return session.getIdToken().getJwtToken()
	} catch {
		return null
	}
}

export async function getAccessToken(): Promise<string | null> {
	try {
		const session = await Auth.currentSession()
		return session.getAccessToken().getJwtToken()
	} catch {
		return null
	}
}

export async function getCurrentUserProfile(
	options: Record<string, unknown> = {}
): Promise<CurrentUserProfile> {

	const user = await readCurrentUser( options )
	const payload = await readIdTokenPayload()
	const userAttributes = user?.attributes && typeof user.attributes === "object"
		? user.attributes
		: {}
	const attributes = mergeUserAttributes( userAttributes, payload )

	return {
		user,
		username: normalizeString(
			user?.username
			?? user?.getUsername?.()
			?? payload["cognito:username"]
			?? payload["username"]
		),
		sub: attributes.sub,
		email: attributes.email,
		given_name: attributes.given_name,
		family_name: attributes.family_name,
		attributes
	}
}
