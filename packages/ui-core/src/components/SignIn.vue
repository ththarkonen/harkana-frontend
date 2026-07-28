<template>
<Authenticator
	:form-fields = "formFields"
	:social-providers = "[]">

	<template v-slot:header>
		<div class="bg-white my-2">
			<h2 class="text-7xl mt-0 pt-0 text-brand font-harkana">HARKANA</h2>
			<h2 class="text-4xl mt-0 pt-0 text-brand font-extrabold">{{ appName }}</h2>
		</div>
	</template>

	<template v-slot:sign-in-header>
		<div v-if = "socialSignInProviders.length > 0" class = "social-sign-in">
			<button v-for = "provider in socialSignInProviders"
					:key = "'sign-in-' + provider.id"
					type = "button"
					class = "social-sign-in-button"
					@click = "startSocialSignIn( provider )">
				<span class = "social-sign-in-mark">{{ providerInitial( provider ) }}</span>
				<span>{{ socialSignInLabel( provider, 'sign in' ) }}</span>
			</button>
			<div class = "social-sign-in-divider">
				<span></span>
				<p>or continue with email</p>
				<span></span>
			</div>
			<p v-if = "socialSignInError.length > 0" class = "social-sign-in-error">
				{{ socialSignInError }}
			</p>
		</div>
	</template>

	<template v-slot:sign-up-header>
		<div v-if = "socialSignInProviders.length > 0" class = "social-sign-in">
			<button v-for = "provider in socialSignInProviders"
					:key = "'sign-up-' + provider.id"
					type = "button"
					class = "social-sign-in-button"
					@click = "startSocialSignIn( provider )">
				<span class = "social-sign-in-mark">{{ providerInitial( provider ) }}</span>
				<span>{{ socialSignInLabel( provider, 'continue' ) }}</span>
			</button>
			<div class = "social-sign-in-divider">
				<span></span>
				<p>or use email</p>
				<span></span>
			</div>
			<p v-if = "socialSignInError.length > 0" class = "social-sign-in-error">
				{{ socialSignInError }}
			</p>
		</div>
	</template>

	<template v-slot:setup-totp-header style="overflow: scroll; max-height: 400px;">
		<h3 class="sign-in-h3" style="padding: var(--amplify-space-xl) 0 0 var(--amplify-space-xl)">
			Setup two-factor authentication:
		</h3>

		<p class="sign-in-text">
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

	<template #default>
		<slot></slot>
	</template>

</Authenticator>
</template>

<script setup>
import { Authenticator } from "@aws-amplify/ui-vue"
import { Amplify } from 'aws-amplify'
import awsconfig from '@/aws-exports.js'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
	getConfiguredSocialSignInProviderOptions
} from "@harkana/tools/authConfig"

const Auth = Amplify.Auth;
const appName = import.meta.env.VITE_APP_NAME
const socialSignInError = ref("")

const socialSignInProviders = computed(() => {
	return getConfiguredSocialSignInProviderOptions( awsconfig )
})

const providerInitial = ( provider ) => {
	return provider.initial
		?? String( provider.label ?? provider.id ?? "" ).substring( 0, 1 ).toUpperCase()
}

const socialSignInLabel = ( provider, action ) => {
	return `${action.charAt( 0 ).toUpperCase()}${action.substring( 1 )} with ${provider.label ?? provider.id}`
}

const startSocialSignIn = async ( provider ) => {
	socialSignInError.value = ""

	try{
		if( provider.signInType === "provider" ){
			await Auth.federatedSignIn({ provider: provider.cognitoProviderName })
			return
		}

		await Auth.federatedSignIn({ customProvider: provider.cognitoProviderName })
	} catch ( error ){
		socialSignInError.value = error?.message ?? "Could not start social sign-in."
	}
}

let observer = null;

const hideNameFields = () => {
	const inputs = document.querySelectorAll('input[name="given_name"], input[name="family_name"]');
	
	inputs.forEach(input => {
		// Get the email value
		const emailInput = document.querySelector('input[name="email"]');
		const emailValue = emailInput ? emailInput.value : '';
		
		// Split email into prefix and domain
		const [prefix, domain] = emailValue.split('@');
		
		// Set the appropriate value based on field name
		if (input.name === 'given_name') {
			input.value = prefix || 'User';
		} else if (input.name === 'family_name') {
			input.value = domain || 'Name';
		}
		
		input.removeAttribute('required');
		
		// Update value whenever email changes
		if (emailInput) {
			emailInput.addEventListener('input', (e) => {
				const [newPrefix, newDomain] = e.target.value.split('@');
				if (input.name === 'given_name') {
					input.value = newPrefix || '';
				} else if (input.name === 'family_name') {
					input.value = newDomain || '';
				}
			});
		}
		
		// Hide the field
		let element = input;
		for (let i = 0; i < 10; i++) {
			element = element.parentElement;
			if (!element) break;
			
			if (element.classList.contains('amplify-field')) {
				element.style.visibility = 'hidden';
				element.style.position = 'absolute';
				element.style.height = '0';
				element.style.overflow = 'hidden';
				element.style.pointerEvents = 'none';
				break;
			}
		}
	});
};

onMounted(() => {
	// Initial hide attempt
	hideNameFields();
	
	// Set up a MutationObserver to watch for DOM changes
	observer = new MutationObserver((mutations) => {
		hideNameFields();
	});
	
	// Start observing the document body for changes
	observer.observe(document.body, {
		childList: true,
		subtree: true
	});
	
	// Also try with timeouts as backup
	setTimeout(hideNameFields, 100);
	setTimeout(hideNameFields, 300);
	setTimeout(hideNameFields, 500);
	setTimeout(hideNameFields, 1000);
});

onUnmounted(() => {
	if (observer) {
		observer.disconnect();
	}
});

const formFields = {
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
		QR: {
			totpIssuer: 'HARKANA'
		}
	}
}
</script>

<style scoped>
.auth-wrapper {
	height: 100vh;
	overflow-y: auto;
}

:deep(amplify-authenticator) {
	height: 100vh;
	overflow-y: auto;
	display: block;
}

.social-sign-in {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	padding: 0 var(--amplify-space-xl) var(--amplify-space-medium);
}

.social-sign-in-button {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.65rem;
	width: 100%;
	min-height: 2.75rem;
	border: 1px solid rgba( 0, 0, 0, 0.14 );
	border-radius: 0.75rem;
	background: #ffffff;
	color: rgba( 0, 0, 0, 0.82 );
	font-weight: 650;
	transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.social-sign-in-button:hover {
	border-color: rgba( 211, 52, 121, 0.48 );
	background: rgba( 211, 52, 121, 0.05 );
}

.social-sign-in-button:active {
	transform: translateY( 1px );
}

.social-sign-in-button:focus-visible {
	outline: 2px solid rgba( 211, 52, 121, 0.42 );
	outline-offset: 2px;
}

.social-sign-in-mark {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1.45rem;
	height: 1.45rem;
	border-radius: 999px;
	background: rgba( 0, 0, 0, 0.06 );
	color: rgba( 0, 0, 0, 0.72 );
	font-size: 0.78rem;
	font-weight: 800;
}

.social-sign-in-divider {
	display: grid;
	grid-template-columns: 1fr auto 1fr;
	align-items: center;
	gap: 0.75rem;
	color: rgba( 0, 0, 0, 0.48 );
	font-size: 0.78rem;
	font-weight: 600;
}

.social-sign-in-divider span {
	height: 1px;
	background: rgba( 0, 0, 0, 0.12 );
}

.social-sign-in-divider p {
	margin: 0;
}

.social-sign-in-error {
	margin: 0;
	border-radius: 0.6rem;
	background: rgba( 220, 38, 38, 0.08 );
	padding: 0.65rem 0.75rem;
	color: rgb( 153, 27, 27 );
	font-size: 0.82rem;
}
</style>
