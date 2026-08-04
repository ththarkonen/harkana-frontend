type ExistingAuthResources = {
  region: string
  userPoolId: string
  userPoolClientId: string
  identityPoolId: string
  authRoleArn: string
  unauthRoleArn: string
  groups: Record<string, string>
}

type ExistingStorageResources = {
  carsBucketName: string
  hcarsBucketName: string
  ramanBucketName: string
}

type ExistingOauthResources = {
  domain: string
  scopes: string[]
  socialProviders: string[]
  callbackUrls: string[]
  logoutUrls: string[]
}

type HarkanaExistingResources = {
  auth: ExistingAuthResources
  oauth: ExistingOauthResources
  storage: ExistingStorageResources
}

export const harkanaExistingResources: HarkanaExistingResources = {
  auth: {
    region: "eu-north-1",
    userPoolId: "eu-north-1_Os62O0UGx",
    userPoolClientId: "4opac47ju2kt7hhhdsfj1b19e7",
    identityPoolId: "eu-north-1:08931541-0ac6-4b6d-8bc5-c6610c377225",
    authRoleArn: "arn:aws:iam::461544334788:role/amplify-carsplatform-cars-6ab18-authRole",
    unauthRoleArn: "arn:aws:iam::461544334788:role/amplify-carsplatform-cars-6ab18-unauthRole",
    groups: {
      PREMIUM: "arn:aws:iam::461544334788:role/eu-north-1_Os62O0UGx-PREMIUMGroupRole",
      STANDARD: "arn:aws:iam::461544334788:role/eu-north-1_Os62O0UGx-STANDARDGroupRole"
    }
  },
  oauth: {
    domain: "harkana.auth.eu-north-1.amazoncognito.com",
    scopes: [ "openid", "email", "profile" ],
    socialProviders: [ "google", "microsoft-personal" ],
    callbackUrls: [
      "http://localhost:5173/",
      "https://cars.harkana.com/",
      "https://hcars.harkana.com/",
      "https://raman.harkana.com/"
    ],
    logoutUrls: [
      "http://localhost:5173/",
      "https://cars.harkana.com/",
      "https://hcars.harkana.com/",
      "https://raman.harkana.com/"
    ]
  },
  storage: {
    carsBucketName: "carsplatformca39913174164c5eb99a0d8091478cf96ab18-cars",
    hcarsBucketName: "hcars2e2729fcfbda41d5a8ed6192058079fed9645-dev",
    ramanBucketName: "ramane9c7cdb459484b28a281f2ecd703f7b18ee4c-dev"
  }
}

export function resourceValue( envName: string, fallback: string ): string {
  const value = process.env[ envName ]?.trim()
  return value && value.length > 0 ? value : fallback
}

export function resourceMapValue(
  envPrefix: string,
  fallbacks: Record<string, string>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries( fallbacks ).map(([ key, fallback ]) => [
      key,
      resourceValue( `${ envPrefix }_${ key }_ROLE_ARN`, fallback )
    ])
  )
}
