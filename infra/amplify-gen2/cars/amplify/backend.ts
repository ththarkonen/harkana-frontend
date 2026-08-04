import { defineBackend } from "@aws-amplify/backend"
import { Bucket } from "aws-cdk-lib/aws-s3"
import { auth } from "./auth/resource.js"
import { harkanaExistingResources, resourceValue } from "../../shared/harkanaResources.js"

const backend = defineBackend({
  auth
})

const storageStack = backend.createStack( "existing-cars-storage" )
const storageBucket = Bucket.fromBucketName(
  storageStack,
  "ExistingCarsStorageBucket",
  resourceValue(
    "HARKANA_CARS_STORAGE_BUCKET_NAME",
    harkanaExistingResources.storage.carsBucketName
  )
)

storageBucket.grantReadWrite( backend.auth.resources.authenticatedUserIamRole )
