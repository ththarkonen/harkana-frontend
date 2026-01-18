<template>
<Modal ref = "modal" :title = "'Add or delete folder'" :showClose = "true">
    <!-- Main -->
    <template #main>

        <p class = "text-white mb-2">
            Deleting a folder does not delete the projects associated with the folder.
        </p>

        <input
            type = "text"
            v-model = "inputText"
            placeholder = "Folder name"
            class = "w-full px-3 py-2 rounded text-black
                    focus:outline-none focus:ring-2 focus:ring-brand"/>
    </template>

    <!-- Footer -->
    <template #footer>
        <div class = "flex justify-end gap-2">

            <ModalButton @click = "addFolder" :disabled = "!canAdd">
                Add folder
            </ModalButton>

            <ModalButton @click = "deleteFolder" :disabled = "!canDelete">
                Delete folder
            </ModalButton>

        </div>
    </template>
</Modal>
</template>

<script setup>

import { ref, computed } from 'vue'
import { projects as projectlib } from '@harkana/tools'

import Modal from './Modal.vue'
import ModalButton from './ModalButton.vue'

const folders = defineModel('folders', { required: true })

const modal = ref(null)
const inputText = ref('')

const trimmedName = computed(() => inputText.value.trim())

const canAdd = computed(() => {
    if (!trimmedName.value) return false
    return !(trimmedName.value in folders.value)
})

const canDelete = computed(() => {
    if (!trimmedName.value) return false
    return trimmedName.value in folders.value
})

const addFolder = async () => {
    if (!canAdd.value) return

    folders.value[trimmedName.value] = []
    await projectlib.setFolders(folders.value)

    inputText.value = ''
    close()
}

const deleteFolder = async () => {
    if (!canDelete.value) return

    delete folders.value[trimmedName.value]
    await projectlib.setFolders(folders.value)

    inputText.value = ''
    close()
}

const open = () => modal.value?.open()
const close = () => modal.value?.close()

defineExpose({ open, close })
</script>
