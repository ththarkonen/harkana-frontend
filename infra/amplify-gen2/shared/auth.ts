import { referenceAuth } from "@aws-amplify/backend"
import { harkanaExistingResources, resourceMapValue, resourceValue } from "./harkanaResources.js"

export const auth = referenceAuth({
  userPoolId: resourceValue(
    "HARKANA_COGNITO_USER_POOL_ID",
    harkanaExistingResources.auth.userPoolId
  ),
  identityPoolId: resourceValue(
    "HARKANA_COGNITO_IDENTITY_POOL_ID",
    harkanaExistingResources.auth.identityPoolId
  ),
  userPoolClientId: resourceValue(
    "HARKANA_COGNITO_USER_POOL_CLIENT_ID",
    harkanaExistingResources.auth.userPoolClientId
  ),
  authRoleArn: resourceValue(
    "HARKANA_COGNITO_AUTH_ROLE_ARN",
    harkanaExistingResources.auth.authRoleArn
  ),
  unauthRoleArn: resourceValue(
    "HARKANA_COGNITO_UNAUTH_ROLE_ARN",
    harkanaExistingResources.auth.unauthRoleArn
  ),
  groups: resourceMapValue(
    "HARKANA_COGNITO_GROUP",
    harkanaExistingResources.auth.groups
  )
})
