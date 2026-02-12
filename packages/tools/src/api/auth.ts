import { Amplify } from 'aws-amplify'
const Auth = Amplify.Auth;

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