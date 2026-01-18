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
                <strong>Templates:</strong> Define a default <em>title</em>, <em>description</em>, and <em>keywords</em> 
                for your uploaded datasets. These fields are automatically pre-filled each time you create a Zenodo draft.
            </li>
            <br></br>
            <li>
                <strong>Personal access token:</strong> Provide your Zenodo API token here to authorize uploads. 
                You can create or manage tokens in your 
                <a href="https://zenodo.org/account/settings/applications/" class = "underline text-brand" target="_blank" rel="noopener noreferrer">
                    Zenodo account settings
                </a>.
                <strong>Important:</strong> The token must be created with the 
                <code>deposit:write</code> permissions enabled.
            </li>
        </ul>
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
import { settings as settingslib, utils} from "@harkana/tools"

import TextField from "../settings/TextField.vue"
import SettingsButton from "../settings/SettingsButton.vue"

const updating = ref(false)
const zenodoSettings = ref({})

const updateZenodoSettings = async () => {

    updating.value = true
    await settingslib.setZenodo( zenodoSettings.value )

    await utils.wait( 1000 )
    updating.value = false
}

onMounted( async () => {

	zenodoSettings.value = await settingslib.getZenodo();
})

</script>