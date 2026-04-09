<template>
<div class="prose prose-gray max-w-none">
    <div class = "not-prose max-w-2xl space-y-8">
        <div class = "space-y-4">
            <h3 class = "m-0 text-lg font-bold text-black">Zenodo settings</h3>

            <p class = "m-0 text-sm text-black/70">
                <strong>Zenodo</strong> is a research data repository where you can publish and share datasets with a
                <em>DOI (Digital Object Identifier)</em>. Connecting your personal Zenodo account allows this platform
                to upload your analysis results and datasets directly to your Zenodo workspace as drafts.
            </p>

            <ul class = "m-0 list-disc space-y-3 pl-5 text-sm text-black/70">
                <li>
                    <strong>Draft defaults:</strong> In addition to the required token, you can set a default
                    <em>title</em>, <em>description</em>, and <em>keywords</em> for convenience. These values are
                    automatically pre-filled each time you create a Zenodo draft.
                </li>
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

        <div v-if = "errorMessage.length > 0" class = "rounded border border-red-500/70 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {{ errorMessage }}
        </div>

        <div v-if = "successMessage.length > 0" class = "rounded border border-emerald-500/70 bg-emerald-500/10 px-3 py-2 text-sm text-black">
            {{ successMessage }}
        </div>

        <div class = "space-y-5">
            <label class = "block">
                <div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Dataset title</div>
                <input
                    type="text"
                    v-model="zenodoSettings.title"
                    placeholder="Dataset title"
                    class="w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 caret-brand transition-[border-color,color] duration-150 ease-out placeholder:text-black/40 focus:border-brand focus:outline-none focus-visible:border-brand focus-visible:outline-none"
                />
            </label>

            <label class="block">
                <div class="mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">
                    Dataset description
                </div>

                <textarea
                    v-model="zenodoSettings.description"
                    placeholder="Dataset description"
                    class="min-h-[7rem] w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-slate-900 transition-[border-color,color] duration-150 ease-out placeholder:text-black/40 focus:border-brand focus:outline-none focus-visible:border-brand focus-visible:outline-none"
                ></textarea>
            </label>

            <label class="block">
                <div class="mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">
                    Keywords
                </div>

                <textarea
                    v-model="zenodoSettings.keywords"
                    placeholder="Keywords"
                    class="min-h-[5.5rem] w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-slate-900 transition-[border-color,color] duration-150 ease-out placeholder:text-black/40 focus:border-brand focus:outline-none focus-visible:border-brand focus-visible:outline-none"
                ></textarea>
            </label>

            <label class="block">
                <div class="mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">
                    Personal access token
                </div>

                <input
                    type="password"
                    v-model="zenodoSettings.token"
                    class="w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 caret-brand transition-[border-color,color] duration-150 ease-out focus:border-brand focus:outline-none focus-visible:border-brand focus-visible:outline-none"
                />
            </label>

            <SettingsButton @click = "updateZenodoSettings" :loading = "updating">
                Update Zenodo settings
            </SettingsButton>
        </div>
    </div>

</div>
</template>

<script setup>

import { ref, onMounted} from "vue"
import { settings as settingslib, utils, zenodo } from "@harkana/tools"

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
