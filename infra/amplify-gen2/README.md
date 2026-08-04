# Amplify Gen 2 migration scaffold

This directory contains the staged Amplify Gen 2 backend definitions for the existing Harkana frontend apps.
It intentionally does not replace the checked-in Gen 1 `apps/*/amplify` folders yet.

## Current strategy

- Reference the existing Cognito resources instead of creating replacement auth resources.
- Reference the existing S3 storage buckets instead of moving project data.
- Keep Cognito social-provider client secrets outside the repository.
- Use the named AWS profile `default`; the Gen 1 CLI did not reliably resolve unnamed default credentials on this machine.

## Existing resources

The non-secret defaults in `shared/harkanaResources.ts` match the current AWS resources:

- User Pool: `eu-north-1_Os62O0UGx`
- Web client: `4opac47ju2kt7hhhdsfj1b19e7`
- Identity Pool: `eu-north-1:08931541-0ac6-4b6d-8bc5-c6610c377225`
- Hosted UI domain: `harkana.auth.eu-north-1.amazoncognito.com`
- Enabled social providers: Google and Microsoft personal through Cognito provider names `Google` and `Microsoft`

Override any value with environment variables before running sandbox/deploy commands:

```bash
export HARKANA_COGNITO_USER_POOL_ID=
export HARKANA_COGNITO_USER_POOL_CLIENT_ID=
export HARKANA_COGNITO_IDENTITY_POOL_ID=
export HARKANA_COGNITO_AUTH_ROLE_ARN=
export HARKANA_COGNITO_UNAUTH_ROLE_ARN=
export HARKANA_COGNITO_GROUP_PREMIUM_ROLE_ARN=
export HARKANA_COGNITO_GROUP_STANDARD_ROLE_ARN=
export HARKANA_CARS_STORAGE_BUCKET_NAME=
export HARKANA_HCARS_STORAGE_BUCKET_NAME=
export HARKANA_RAMAN_STORAGE_BUCKET_NAME=
```

## Commands

From the repository root:

```bash
pnpm run gen2:typecheck
pnpm run gen2:cars:sandbox
pnpm run gen2:hcars:sandbox
pnpm run gen2:raman:sandbox
```

Do not deploy these Gen 2 backends to production until the sandbox output has been reviewed and provider callback/logout URLs for any new test domains have been added in Google, Microsoft, and Cognito.

## Notes

- The frontend still uses Amplify JS v5 and the existing `aws-exports.js` shape.
- Runtime OAuth defaults are maintained in `packages/tools/src/cognitoSocialSignInConfig.js`.
- Generated `amplify_outputs.json` files should not be treated as the frontend runtime source of truth until the client library migration is planned separately.
