<template>
<BaseDropdown>
    <template v-slot:trigger>
        <span class = "font-medium">
            <i class = "fa fa-microchip"></i> Token balance: {{balance}}
        </span>
    </template>

    <li>
        <div class = "block w-full px-4 py-2 text-left text-sm text-white">
            <strong>Active token source:</strong><br>
            {{ billingSettings.groupName }}
        </div>
        <hr>
    </li>

    <BaseDropdownItem @select = "goSettings">
        Compute token settings
    </BaseDropdownItem>
</BaseDropdown>
</template>

<script setup>

import { ref, onMounted} from "vue"

import tokens from "@harkana/tokens"
import { settings, navigation} from "@harkana/tools"

import BaseDropdown from './BaseDropdown.vue'
import BaseDropdownItem from './BaseDropdownItem.vue'

const balance = ref(0)
const billingSettings = ref({})

const goSettings = () => {
	navigation.redirect("Settings", "Compute tokens")
}

const updateBalance = async () => {
    billingSettings.value = await settings.getBilling()
    balance.value = await tokens.balance( billingSettings.value.groupID )
}

onMounted( async () => {
    await updateBalance()
})

defineExpose({ updateBalance })

</script>
