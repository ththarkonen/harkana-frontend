import { defineBackend } from "@aws-amplify/backend"
import { Bucket } from "aws-cdk-lib/aws-s3"
import { auth } from "./auth/resource.js"
import { harkanaExistingResources, resourceValue } from "../../shared/harkanaResources.js"

const backend = defineBackend({
  auth
})

const storageStack = backend.createStack( "existing-raman-storage" )
const storageBucket = Bucket.fromBucketName(
  storageStack,
  "ExistingRamanStorageBucket",
  resourceValue(
    "HARKANA_RAMAN_STORAGE_BUCKET_NAME",
    harkanaExistingResources.storage.ramanBucketName
  )
)

storageBucket.grantReadWrite( backend.auth.resources.authenticatedUserIamRole )
