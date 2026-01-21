<template>
<Authenticator :form-fields = "formFields">

	<template v-slot:header>
		<div class = "bg-white my-2">
			<h2 class="text-7xl mt-0 pt-0 text-brand font-harkana">HARKANA</h2>
			<h2 class="text-4xl mt-0 pt-0 text-brand font-extrabold">{{ appName }}</h2>
		</div>
    </template>

    <template v-slot:setup-totp-header style="overflow: scroll; max-height: 400px;">

		<h3 class = "sign-in-h3" style = "padding: var(--amplify-space-xl) 0 0 var(--amplify-space-xl)">
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

		<h3 class = "font-semibold">
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

import { Authenticator } from "@aws-amplify/ui-vue";

const appName = import.meta.env.VITE_APP_NAME

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

	::v-deep(amplify-authenticator) {
	height: 100vh;
	overflow-y: auto;
	display: block;
}
}
</style>