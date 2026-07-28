<template>
	<router-view v-slot = "{ Component, route }">
		<component v-if = "isAccountDeletionRoute( route )"
				   :is = "Component"
				   @loaded = "loading = false"></component>
		<SignIn v-else>
			<component :is = "Component" @loaded = "loading = false"></component>
		</SignIn>
	</router-view>

	<LoadingOverlay :visible = "loading"/>
</template>

<script setup>

import { onMounted, onUnmounted, ref, watch, nextTick} from 'vue'
import { useRouter } from 'vue-router'
import { useAuthenticator } from "@aws-amplify/ui-vue"
import { account } from "@harkana/tools"
import { configureAmplify } from "@harkana/tools/authConfig"

import { Amplify } from 'aws-amplify'
import awsconfig from '@/aws-exports'

configureAmplify( Amplify, awsconfig )

import SignIn from "./SignIn"
import { LoadingOverlay } from "@harkana/ui-loading"

const router = useRouter()
const auth = useAuthenticator()

const loading = ref(true);
const accountDeletionApiStatusEvent = "harkana:account-deletion-http-status"

const isAccountDeletionRoute = ( route ) => {
    return route?.meta?.accountDeletion === true
}

const clearLocalAuthState = async () => {
    try{
        await Amplify.Auth.signOut({ global: true })
    } catch{
        try{
            await Amplify.Auth.signOut()
        } catch{
            // The account may already be disabled or deleted.
        }
    }
}

const routeToAccountDeletion = async ( query = {} ) => {
    if( router.currentRoute.value?.name === "Account deletion" ){
        loading.value = false
        return
    }

    loading.value = true
    await router.replace({ name: "Account deletion", query }).catch(() => {})
    loading.value = false
}

const handleAccountDeletionApiStatus = async ( event ) => {
    const status = Number( event?.detail?.status ?? 0 )

    if( status === 423 ){
        await routeToAccountDeletion()
        return
    }

    if( status === 410 ){
        account.clearAccountDeletionSession()
        await clearLocalAuthState()
        await routeToAccountDeletion({ state: "deleted" })
    }
}

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

onMounted(() => {
    window.addEventListener( accountDeletionApiStatusEvent, handleAccountDeletionApiStatus )
})

onUnmounted(() => {
    window.removeEventListener( accountDeletionApiStatusEvent, handleAccountDeletionApiStatus )
})

</script>
