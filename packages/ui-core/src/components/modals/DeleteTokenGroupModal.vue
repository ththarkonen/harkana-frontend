<template>
<Modal ref="modal" :title="'Delete token group'">
    <template v-slot:main>
        <p class="text-white mb-4">
            Deleting a token group will remove access to the token balance for all members.
            The token balance associated with the token group is erased and the tokens are not refunded.
            This operation is permanent and cannot be reversed.
            <br><br>
            Delete the token group:<br></br>
            <span class = "font-bold">{{ group.groupName }}</span><br></br>
            by typing <i>Permanently delete</i> below and by pressing "Delete token group".
        </p>

        <p v-if = "errorMessage !== ''" class="text-red-600 flex items-start gap-2 mb-4">
            <i class="fa fa-exclamation-triangle fa-lg mt-1"></i>
            <span>{{ errorMessage }}</span>
        </p>
        
        <input 
            type="text" 
            class="w-full border border-gray-600 rounded px-3 py-2 mb-1 bg-gray-700 text-black
                    placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand"
            v-model="inputText" 
            placeholder="Permanently delete"
        />
    </template>
    
    <template v-slot:footer>
        <ModalButton @click = "deleteTokenGroup" :loading = "deletingGroup" :disabled = "inputText !== 'Permanently delete'">
            Delete token group
        </ModalButton>
    </template>
</Modal>
</template>

<script setup>

import { ref } from 'vue'

import Modal from "./Modal.vue"
import ModalButton from './ModalButton.vue'

import tokens from "@harkana/tokens"
import { utils } from "@harkana/tools"

const props = defineProps({
    group: { type: Object, required: true}
})

const emit = defineEmits(['updateTokenGroups'])

const modal = ref(null)
const inputText = ref("")

const deletingGroup = ref(false)
const errorMessage = ref("")

const deleteTokenGroup = async () => {
    try {

        deletingGroup.value = true
        errorMessage.value = ""

        await tokens.removeGroup( props.group.groupName )
        inputText.value = ""
        emit("updateTokenGroups")

        await utils.wait(1000)
        close()
        
    } catch (error) {
        console.error(error)
        errorMessage.value = error.message
    } finally {
        deletingGroup.value = false
    }
}

const open = async () => {
    inputText.value = ""
    modal.value.open()
}

const close = () => modal.value.close()

defineExpose({
    open,
    close
})
</script>