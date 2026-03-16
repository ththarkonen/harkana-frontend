<template>
<div class="prose prose-gray max-w-none">

    <div class = "border-2 border-brand rounded-lg p-4 mb-8 shadow-black shadow-lg">
        <p>
            <strong>Zenodo</strong> is a research data repository where you can publish and share datasets with a 
            <em>DOI (Digital Object Identifier)</em>. Connecting your personal Zenodo account allows this platform 
            to upload your analysis results and datasets directly to your Zenodo workspace as drafts.
        </p>
        <br></br>
        <ul>
            <li>
                <strong>Draft defaults:</strong> In addition to the required token, you can set a default
                <em>title</em>, <em>description</em>, and <em>keywords</em> for convenience. These values are
                automatically pre-filled each time you create a Zenodo draft.
            </li>
            <br></br>
            <li>
                <strong>Personal access token:</strong> Set your Zenodo API token here to authorize uploads.
                This token is required for Zenodo exports.
                You can create or manage tokens in your 
                <a href="https://zenodo.org/account/settings/applications/" class = "underline text-brand" target="_blank" rel="noopener noreferrer">
                    Zenodo account settings
                </a>.
                <strong>Important:</strong> The token must be created with the 
                <code>deposit:write</code> permissions enabled.
            </li>
        </ul>
    </div>

    <div v-if = "errorMessage.length > 0" class = "mb-4 rounded border border-red-500/70 bg-red-500/10 px-3 py-2 text-sm text-red-200">
        {{ errorMessage }}
    </div>

    <div v-if = "successMessage.length > 0" class = "mb-4 rounded border border-emerald-500/70 bg-emerald-500/10 px-3 py-2 text-sm text-black">
        {{ successMessage }}
    </div>

    <TextField description = "Dataset title" placeholder = "Dataset title" v-model = "zenodoSettings.title">

        <label class="block mt-4">
            <h4 class="mb-2 text-sm font-semibold text-black">
                Dataset description
            </h4>

            <textarea
                type="text"
                v-model="zenodoSettings.description"
                placeholder="Dataset description"
                class="w-full rounded border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand">
            </textarea>
        </label>

        <label class="block mt-4">
            <h4 class="mb-2 text-sm font-semibold text-black">
                Keywords
            </h4>

            <textarea
                type="text"
                v-model="zenodoSettings.keywords"
                placeholder="Dataset description"
                class="w-full rounded border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand">
            </textarea>
        </label>

        <label class="block mt-4">
            <h4 class="mb-2 text-sm font-semibold text-black">
                Personal access token
            </h4>

            <input
                type="password"
                v-model="zenodoSettings.token"
                placeholder=""
                class="w-full rounded border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand">
            </input>
        </label>

        <SettingsButton @click = "updateZenodoSettings" :loading = "updating" class = "mt-4">
            Update Zenodo settings
        </SettingsButton>

    </TextField>

</div>
</template>

<script setup>

import { ref, onMounted} from "vue"
import { settings as settingslib, utils, zenodo } from "@harkana/tools"

import TextField from "../settings/TextField.vue"
import SettingsButton from "../settings/SettingsButton.vue"

const updating = ref(false)
const zenodoSettings = ref({})
const errorMessage = ref("")
const successMessage = ref("")

const keywordsToText = ( keywords ) => {

    if( Array.isArray( keywords ) === false ){
        return ""
    }

    return keywords
        .map(( keyword ) => String( keyword ?? "" ).trim())
        .filter(( keyword ) => keyword.length > 0 )
        .join( ", " )
}

const parseKeywordsInput = ( value ) => {

    const input = String( value ?? "" )
    if( input.length === 0 ) return []

    return [ ...new Set(
        input
            .split( "," )
            .map(( keyword ) => keyword.trim() )
            .filter(( keyword ) => keyword.length > 0 )
    )]
}

const updateZenodoSettings = async () => {

    errorMessage.value = ""
    successMessage.value = ""
    updating.value = true

    try{
        const response = await zenodo.saveSettings({
            token: String( zenodoSettings.value?.token ?? "" ),
            title: String( zenodoSettings.value?.title ?? "" ),
            description: String( zenodoSettings.value?.description ?? "" ),
            keywords: parseKeywordsInput( zenodoSettings.value?.keywords )
        })

        const hasToken = response?.hasToken === true
        successMessage.value = hasToken
            ? "Zenodo settings saved."
            : "Zenodo settings saved. No API token is currently set."

    } catch( error ){
        errorMessage.value = error?.message ?? "Failed to save Zenodo settings."
    } finally {
        await utils.wait( 500 )
        updating.value = false
    }
}

onMounted( async () => {

    const defaults = await settingslib.getDefaultZenodo()
	zenodoSettings.value = {
        token: String( defaults?.token ?? "" ),
        title: String( defaults?.title ?? "" ),
        description: String( defaults?.description ?? "" ),
        keywords: keywordsToText( defaults?.keywords )
    }
})

</script>
