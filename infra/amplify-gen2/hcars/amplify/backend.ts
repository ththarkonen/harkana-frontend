import { defineBackend } from "@aws-amplify/backend"
import { Bucket } from "aws-cdk-lib/aws-s3"
import { auth } from "./auth/resource.js"
import { harkanaExistingResources, resourceValue } from "../../shared/harkanaResources.js"

const backend = defineBackend({
  auth
})

const storageStack = backend.createStack( "existing-hcars-storage" )
const storageBucket = Bucket.fromBucketName(
  storageStack,
  "ExistingHCarsStorageBucket",
  resourceValue(
    "HARKANA_HCARS_STORAGE_BUCKET_NAME",
    harkanaExistingResources.storage.hcarsBucketName
  )
)

storageBucket.grantReadWrite( backend.auth.resources.authenticatedUserIamRole )
