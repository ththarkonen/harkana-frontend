<template>
<authenticator
  :form-fields="{
    confirmSignIn: {
      confirmation_code: {
        label: 'Authentication Code',
        placeholder: 'Enter your 6-digit code',
        isRequired: true
      }
    },
    setupTOTP: {
      confirmation_code: {
        label: 'Authentication Code',
        placeholder: 'Enter the code from your authenticator',
        isRequired: true
      },
	  QR:{
		totpIssuer: 'HARKANA',
	  }
    }
  }"
>
	<template v-slot:header>
		<div class = "bg-white my-2">
			<h2 class="text-7xl mt-0 pt-0 text-brand font-harkana">HARKANA</h2>
			<h2 class="text-4xl mt-0 pt-0 text-brand font-extrabold">{{ appName }}</h2>
		</div>
		</template>
		<template v-slot:setup-totp-header style="overflow: scroll; max-height: 400px;">
		<h3
			class = "sign-in-h3"
			style="padding: var(--amplify-space-xl) 0 0 var(--amplify-space-xl)"
		>
			Setup two-factor authentication:
		</h3>
		<p class = "sign-in-text">
			Step 1: Open your authenticator application.<br><br>
			Step 2: Scan the QR code below. Alternatively, copy or type in the alphanumeric code below the QR code.<br><br>
			Step 3: Input the code visible in your authenticator in the field above confirm.<br><br>
			Step 4: Confirm.<br><br>
		</p>
	</template>

	<template v-slot:confirm-sign-in-header>
		<h3 class="font-semibold">
		Two-factor authentication verification
		</h3>
		<p>
		Enter the six-digit code from your authenticator application to finish signing in.
		</p>
	</template>

	<template v-slot = "user">
		<router-view v-slot="{ Component }">
			<component :is="Component" @loaded = "onLoaded"></component>
		</router-view>
	</template>
</authenticator>

<LoadingOverlay :visible="loading" />

</template>

<script setup>

import { Authenticator, useAuthenticator} from "@aws-amplify/ui-vue";
import "@aws-amplify/ui-vue/styles.css";

import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports';

Amplify.configure(awsconfig);

import { ref, watch, nextTick, onMounted} from 'vue';
import { useRoute, useRouter} from 'vue-router';

import { LoadingOverlay } from "@harkana/ui-loading"

const route = useRoute();
const router = useRouter()
const loadingOverlay = ref(null)

const auth = useAuthenticator()

const loading = ref(true);
const appName = import.meta.env.VITE_APP_NAME

const onLoaded = () => {
	loading.value = false
}

// Show overlay on route change
router.beforeEach(async (to, from, next) => {
    // Only show loading if the actual route path changes, not just query params
    if (to.path !== from.path) {
        loading.value = true
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 100))
    }
    next()
})

watch(() => auth.route, (newRoute) => {
    // If user is on sign-in/sign-up screens, hide loading
    if (newRoute === 'signIn' || newRoute === 'signUp' || newRoute === 'confirmSignIn' || newRoute === 'setupTOTP') {
        loading.value = false
    }
}, { immediate: true })

</script>

<style scoped>
.auth-wrapper {
  height: 100vh;
  overflow-y: auto;

  ::v-deep(amplify-authenticator) {
  height: 100vh;
  overflow-y: auto;
  display: block;
}
}
</style>
