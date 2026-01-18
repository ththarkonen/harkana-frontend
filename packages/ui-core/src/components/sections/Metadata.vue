<template>
<div class="prose prose-gray max-w-none">

    <div class = "border-2 border-brand rounded-lg p-4 mb-8
                  shadow-black shadow-lg">
        <p>
            <strong>Metadata template</strong> allows you to define a default metadata structure 
            that will be automatically applied when new projects are uploaded. 
            This ensures consistency and saves time by pre-filling important descriptive fields for your datasets.
        </p>
        <br></br>
        <ul>
            <li>
            <strong>Default metadata template:</strong>  
            Set a reusable metadata template that contains predefined fields such as title, 
            authors, description, keywords, and other project-related information. 
            This template is applied automatically to new uploads.
            </li>
            <br></br>
            <li>
            <strong>Editable format:</strong>  
            The metadata is stored in a human-readable <code>JSON</code> format, 
            making it easy to view, understand, and modify directly if needed.
            </li>
            <br></br>
            <li>
            <strong>Consistency across projects:</strong>  
            By defining a standard metadata template, you ensure uniform structure and terminology 
            across all uploaded projects.
            </li>
        </ul>

        <p>
            Defining a default metadata template provides a reliable foundation for 
            dataset organization and documentation, ensuring that every new project upload 
            begins with complete, standardized information.
        </p>
    </div>

    <div class = "border-2 border-brand rounded-lg p-4 mb-8
                  shadow-black shadow-lg">
        
        <JsonEditorVue v-model="metadataTemplate" mode="tree"></JsonEditorVue>

        <SettingsButton @click = "updateTemplate" :loading = "updating" class = "mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
            Update metadata template
        </SettingsButton>

    </div>

</div>
</template>

<script setup>

import { ref, onMounted} from "vue"
import { settings as settingslib, utils} from "@harkana/tools"

import SettingsButton from "../settings/SettingsButton.vue"
import Spinner from "../general/Spinner.vue"

import JsonEditorVue from 'json-editor-vue'

const updating = ref(false)
const metadataTemplate = ref({})

const updateTemplate = async () => {

    updating.value = true

    var settings = await settingslib.get();
    settings.defaultMetadata = metadataTemplate.value
    await settingslib.set( settings )

    await utils.wait( 1000 )
    updating.value = false
}

onMounted( async () => {

	var settings = await settingslib.get();
    metadataTemplate.value = settings.defaultMetadata
})

</script>