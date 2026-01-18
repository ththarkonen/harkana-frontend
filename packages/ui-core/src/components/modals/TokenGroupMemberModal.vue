<template>
<Modal ref="modal" :title="'Add token group members'">
    <template v-slot:main>
        <p class="text-white mb-4">
            Token group members can access and use the token group balance.
            You can add members by typing their email address and pressing "Add member".
        </p>

        <p v-if = "errorMessage !== ''" class="text-red-600 flex items-start gap-2 mb-4">
            <i class="fa fa-exclamation-triangle fa-lg mt-1"></i>
            <span>{{ errorMessage }}</span>
        </p>

        
        <p class="text-white mb-4">
            Token group:<br></br>
            <span class = "font-semibold">{{ group.groupName }}</span>
        </p>
        
        <input 
            type="text" 
            class="w-full border border-gray-600 rounded px-3 py-2 mb-0 bg-gray-700 text-black
            placeholder-gray focus:outline-none focus:ring-2 focus:ring-brand"
            v-model="inputText" 
            placeholder="Email address"
            @keydown.enter="addMember"
        />
    </template>
    
    <template v-slot:footer>
        <ModalButton @click = "addMember" :loading = "addingMember">
            Add member
        </ModalButton>
    </template>
</Modal>
</template>

<script setup>

import { ref } from 'vue'

import Modal from "./Modal.vue"
import ModalButton from "./ModalButton.vue"
import tokens from "@harkana/tokens"
import { utils } from "@harkana/tools"

const props = defineProps({
    group: { type: Object, required: true }
})

const emit = defineEmits(['updateTokenGroups'])

const modal = ref(null)
const inputText = ref("")

const addingMember = ref(false)
const errorMessage = ref("")

const addMember = async () => {
    try {

        addingMember.value = true
        errorMessage.value = ""

        await tokens.addGroupMember( props.group.groupId, inputText.value)
        inputText.value = ""
        emit("updateTokenGroups")

        addingMember.value = false
        utils.wait(1000)
        close()
    } catch (error) {
        console.error(error)
        errorMessage.value = error.message
    } finally {
        addingMember.value = false
    }
}

const open = async () => modal.value.open()
const close = () => modal.value.close() 

defineExpose({
    open,
    close
})
</script>