<template>
<Authenticator
	:form-fields = "formFields">

	<template v-slot:header>
		<div class="bg-white my-2">
			<h2 class="text-7xl mt-0 pt-0 text-brand font-harkana">HARKANA</h2>
			<h2 class="text-4xl mt-0 pt-0 text-brand font-extrabold">{{ appName }}</h2>
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
import { onMounted, onUnmounted } from 'vue'

const Auth = Amplify.Auth;
const appName = import.meta.env.VITE_APP_NAME

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
</style>