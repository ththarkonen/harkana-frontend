<template>
	<SignIn>
		<router-view v-slot = "{ Component }">
			<component :is = "Component" @loaded = "loading = false"></component>
		</router-view>
	</SignIn>

	<LoadingOverlay :visible = "loading"/>
</template>

<script setup>

import { ref, watch, nextTick} from 'vue'
import { useRouter } from 'vue-router'
import { useAuthenticator } from "@aws-amplify/ui-vue"

import { Amplify } from 'aws-amplify'
import awsconfig from '@/aws-exports'

Amplify.configure(awsconfig)

import SignIn from "./SignIn"
import { LoadingOverlay } from "@harkana/ui-loading"

const router = useRouter()
const auth = useAuthenticator()

const loading = ref(true);

// Show overlay on route change
router.beforeEach( async ( to, from, next) => {
    // Only show loading if the actual route path changes, not just query params
    if( to.path !== from.path ){
        loading.value = true
        await nextTick()
        await new Promise( resolve => setTimeout( resolve, 100))
    }
    next()
})

watch(() => auth.route, ( newRoute ) => {
    // If user is on sign-in/sign-up screens, hide loading
	var ignoredRoute = newRoute === "signIn"
					|| newRoute === "signUp"
					|| newRoute === "confirmSignIn"
					|| newRoute === "setupTOTP"

    if( ignoredRoute ) loading.value = false
}, { immediate: true })

</script>