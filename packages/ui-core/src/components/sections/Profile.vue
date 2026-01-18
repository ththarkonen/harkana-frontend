<template>
<div class="prose prose-gray max-w-none">

    <div v-if = "showError" class = "mt-4">
        {{ errorMessage }}
    </div>

    <TextField description = "Given name" placeholder = "" v-model = "givenName">

        <label class="block mt-4">
            <h4 class="mb-2 text-sm font-semibold text-black">
                Family name
            </h4>

            <input
                type="text"
                v-model="familyName"
                placeholder="Dataset description"
                class="w-full rounded border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand">
            </input>
        </label>

        <SettingsButton @click = "updateName" :loading = "updatingName" class = "mt-4">
            Update name
        </SettingsButton>

    </TextField>

    <hr class="h-0.5 bg-gray border-0 my-4">

    <TextField description = "Email address" placeholder = "" v-model = "email">

        <SettingsButton v-if = "!showVerification" @click = "updateEmail" :loading = "updatingEmail" class = "mt-4">
            Update email
        </SettingsButton>

        <div v-if = "showVerification">
            
            <label class="block mt-4">
                <h4 class="mb-2 text-sm font-semibold text-black">
                    You will be automatically signed out upon succesful verification. A verification code has been sent
                    to your new email address. This can take a few minutes to appear in your inbox. Please enter the verification code sent to your new email to verify:
                </h4>

                <input
                    type="text"
                    v-model="emailVerificationCode"
                    placeholder="Verification code"
                    class="w-full rounded border border-gray-300 px-3 py-2 text-sm
                        focus:outline-none focus:ring-2 focus:ring-brand">
                </input>
            </label>
            
            <SettingsButton @click = "verifyEmail" :loading = "verifyingEmail" class = "mt-4">
                Verify email
            </SettingsButton>
        </div>
        

    </TextField>

    <hr class="h-0.5 bg-gray border-0 my-4">

    <div>

        <SettingsButton @click = "setupMFA" :loading = "generatingTOTP" class = "mt-0">
            Enable or update multi-factor authentication (MFA)
        </SettingsButton>

        <div v-if = "qrDataUrl" class = "w-full mt-4">
            <div class = "border-brand rounded-lg border-2 p-4 shadow-black shadow-lg">
                Open your authorized authenticator application and scan the displayed QR code,
                or enter the alphanumeric code provided below directly into your application.
                Your application will generate a 6-digit verification code.
                Enter the code into the input field to complete the authentication process.
                <img :src="qrDataUrl" class = "w-max-50"/>
                <p class="font-mono text-sm w-full">{{ secret }}</p>

                <label class="block mt-4">
                    <h4 class="mb-2 text-sm font-semibold text-black">
                        Enter the 6-digit verification code in your authenticator to finalize MFA.
                    </h4>

                    <input
                        type="text"
                        v-model="emailVerificationCode"
                        placeholder="Verification code"
                        class="w-full rounded border border-gray-300 px-3 py-2 text-sm
                            focus:outline-none focus:ring-2 focus:ring-brand">
                    </input>
                </label>

                <SettingsButton @click = "verifyMFA" :loading = "verifyingTOTP" class = "mt-4">
                    Verify MFA
                </SettingsButton>

            </div>
        </div>

    </div>

</div>
</template>

<script setup>

import { ref, onMounted} from "vue"
import QRCode from "qrcode"

import { Amplify } from 'aws-amplify'
import awsconfig from '@/aws-exports.js'

import { utils } from "@harkana/tools"

Amplify.configure( awsconfig )
const Auth = Amplify.Auth

import TextField from "../settings/TextField.vue"
import SettingsButton from "../settings/SettingsButton.vue"

const givenName = ref("")
const familyName = ref("")

const email = ref("")
const emailVerificationCode = ref("")

const updatingName = ref(false)
const updatingEmail = ref(false)
const verifyingEmail = ref(false)
const showVerification = ref(false)

const totpVerificationCode = ref("")
const generatingTOTP = ref(false)
const verifyingTOTP = ref(false)

const qrDataUrl = ref('')
const secret = ref('')

const showError = ref(false)
const errorMessage = ref("")

const updateName = async () => {
	
	try {
        
        updatingName.value = true

		var newAttributes = {}
		newAttributes.given_name = givenName.value
		newAttributes.family_name = familyName.value

		const user = await Auth.currentAuthenticatedUser();
		const result = await Auth.updateUserAttributes( user, newAttributes);

	} catch (error) {

		console.error(error)
        showError.value = true
        errorMessage.value = error

	} finally {

		await utils.wait( 1000 )
        updatingName.value = false
    }
}

const updateEmail = async () => {
	
	try {

        updatingEmail.value = true

		var newAttributes = {}
		newAttributes.email = email.value;

		var user = await Auth.currentAuthenticatedUser();
		const result = await Auth.updateUserAttributes( user, newAttributes);

		user = await Auth.currentAuthenticatedUser();

		givenName.value = user.attributes.given_name;
		familyName.value = user.attributes.family_name;
		email.value = user.attributes.email;

	} catch (error) {

		console.error(error)
        showError.value = true
        errorMessage.value = error

	} finally {

		await utils.wait( 1000 )
        updatingEmail.value = false
		showVerification.value = true;
    }
}

const verifyEmail = async () => {

	try {

        console.log( emailVerificationCode.value )
		await Auth.verifyCurrentUserAttributeSubmit('email', emailVerificationCode.value);

		Auth.signOut({ global: true })

	} catch (error) {

		console.error(error)
        showError.value = true
        errorMessage.value = error

	} finally {

		await utils.wait( 1000 )
        verifyingEmail.value = false
        showVerification.value = false
    }

	emailVerificationCode.value = "";
}

const setupMFA = async () => {

    generatingTOTP.value = true
    const user = await Auth.currentAuthenticatedUser()
    secret.value = await Auth.setupTOTP( user )

    const issuer = 'HARKANA'
    const username = user.attributes.email
    console.log( user )

    const otpAuthUrl =
        `otpauth://totp/${issuer}:${username}` +
        `?secret=${secret.value}&issuer=${issuer}`

    qrDataUrl.value = await QRCode.toDataURL(otpAuthUrl)
    generatingTOTP.value = false
}

const verifyMFA = async () => {
    try{

        verifyingTOTP.value = true

        const user = await Auth.currentAuthenticatedUser()
        await Auth.verifyTotpToken( user, totpVerificationCode.value)
        await Auth.setPreferredMFA(user, 'TOTP')

        qrDataUrl.value = ""
        secret.value = ""

    } catch(error) {

		console.error(error)
        showError.value = true
        errorMessage.value = error

    } finally {
        verifyingTOTP.value = false
    }
}

onMounted( async () => {

	const user = await Auth.currentAuthenticatedUser();

	givenName.value = user.attributes.given_name;
	familyName.value = user.attributes.family_name;
	email.value = user.attributes.email;
})

</script>