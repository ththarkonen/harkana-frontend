<template>
<div class="prose prose-gray max-w-none">
    <div class = "not-prose max-w-2xl space-y-8">
        <div class = "space-y-4">
            <h3 class = "m-0 text-lg font-bold text-black">Default metadata template</h3>

            <p class = "m-0 text-sm text-black/70">
                <strong>Metadata template</strong> allows you to define a default metadata structure
                that will be automatically applied when new projects are uploaded.
                This ensures consistency and saves time by pre-filling important descriptive fields for your datasets.
            </p>

            <ul class = "m-0 list-disc space-y-3 pl-5 text-sm text-black/70">
                <li>
                    <strong>Default metadata template:</strong>
                    Set a reusable metadata template that contains predefined fields such as title,
                    authors, description, keywords, and other project-related information.
                    This template is applied automatically to new uploads.
                </li>
                <li>
                    <strong>Editable format:</strong>
                    The metadata is stored in a human-readable <code>JSON</code> format,
                    making it easy to view, understand, and modify directly if needed.
                </li>
                <li>
                    <strong>Consistency across projects:</strong>
                    By defining a standard metadata template, you ensure uniform structure and terminology
                    across all uploaded projects.
                </li>
            </ul>

            <p class = "m-0 text-sm text-black/70">
                Defining a default metadata template provides a reliable foundation for
                dataset organization and documentation, ensuring that every new project upload
                begins with complete, standardized information.
            </p>
        </div>

        <div class = "space-y-4">
            <div class = "text-xs font-semibold uppercase tracking-wide text-black/70">Metadata template</div>

            <div class = "overflow-hidden rounded-lg border border-black/10 bg-white">
                <JsonEditorVue v-model="metadataTemplate" mode="tree"></JsonEditorVue>
            </div>

            <SettingsButton @click = "updateTemplate" :loading = "updating" class = "disabled:cursor-not-allowed disabled:opacity-50">
                Update metadata template
            </SettingsButton>
        </div>
    </div>

</div>
</template>

<script setup>

import { defineAsyncComponent, ref, onMounted} from "vue"
import { settings as settingslib, utils} from "@harkana/tools"

import SettingsButton from "../settings/SettingsButton.vue"

const JsonEditorVue = defineAsyncComponent(() => import('json-editor-vue'))

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
