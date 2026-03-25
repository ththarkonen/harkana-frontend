<template>
<div class="prose prose-gray max-w-none">

    <div v-if = "showError" class = "mt-4 rounded-lg border border-red-500/50 bg-red-100/70 px-3 py-2 text-sm text-red-800">
        {{ errorMessage }}
    </div>

    <h3 class = "m-0 text-lg font-bold text-black">Name and email settings</h3>

    <div class = "mt-5 max-w-2xl space-y-8">
        <section class = "space-y-4">
            <div class = "space-y-4">
                <label class = "block">
                    <div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Given name</div>
                    <input type = "text"
                           v-model = "givenName"
                           class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 caret-brand transition-[border-color,color] duration-150 ease-out placeholder:text-black/40 focus:border-brand focus:outline-none focus-visible:border-brand focus-visible:outline-none" />
                </label>
                <label class = "block">
                    <div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Family name</div>
                    <input type = "text"
                           v-model = "familyName"
                           class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 caret-brand transition-[border-color,color] duration-150 ease-out placeholder:text-black/40 focus:border-brand focus:outline-none focus-visible:border-brand focus-visible:outline-none" />
                </label>

                <SettingsButton @click = "updateName"
                                :loading = "updatingName"
                                class = "!mt-3 !rounded-full !border !border-black/10 !bg-black/[0.03] !px-3 !py-1.5 !text-xs !font-semibold !text-black/75 !shadow-none hover:!bg-brand hover:!text-white">
                    Update name
                </SettingsButton>
            </div>
        </section>

        <section class = "space-y-4">
            <label class = "block">
                <div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Email address</div>
                <input type = "text"
                       v-model = "email"
                       class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 caret-brand transition-[border-color,color] duration-150 ease-out placeholder:text-black/40 focus:border-brand focus:outline-none focus-visible:border-brand focus-visible:outline-none" />
            </label>

            <SettingsButton v-if = "!showVerification"
                            @click = "updateEmail"
                            :loading = "updatingEmail"
                            class = "!mt-3 !rounded-full !border !border-black/10 !bg-black/[0.03] !px-3 !py-1.5 !text-xs !font-semibold !text-black/75 !shadow-none hover:!bg-black/[0.06]">
                Update email
            </SettingsButton>
        </section>

        <div v-if = "showVerification" class = "space-y-3">
            <label class = "block">
                <div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Verification code</div>
                <input type = "text"
                       v-model = "emailVerificationCode"
                       placeholder = "Verification code"
                       class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 caret-brand transition-[border-color,color] duration-150 ease-out placeholder:text-black/40 focus:border-brand focus:outline-none focus-visible:border-brand focus-visible:outline-none" />
            </label>
            <SettingsButton @click = "verifyEmail"
                            :loading = "verifyingEmail"
                            class = "!rounded-full !border !border-black/10 !bg-black/[0.03] !px-3 !py-1.5 !text-xs !font-semibold !text-black/75 !shadow-none hover:!bg-black/[0.06]">
                Verify email
            </SettingsButton>
        </div>
    </div>

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

	if ( givenName.value === "" ) givenName.value = user.attributes.given_name ?? "";
	if ( familyName.value === "" ) familyName.value = user.attributes.family_name ?? "";
	if ( email.value === "" ) email.value = user.attributes.email ?? "";
})

</script>
