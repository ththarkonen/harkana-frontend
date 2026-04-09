<template>
<BaseDropdown>
    <template v-slot:trigger>
        <span class = "font-medium">Account</span>
    </template>

    <BaseDropdownItem @select = 'navigation.redirect("Settings", "Profile")'>
        Profile
    </BaseDropdownItem>

    <BaseDropdownItem @select = 'navigation.redirect("Settings", "Compute tokens")'>
        Compute tokens
    </BaseDropdownItem>

    <BaseDropdownItem @select = 'navigation.redirect("Settings", "Visualization")'>
        Visualization settings
    </BaseDropdownItem>

    <BaseDropdownItem @select = 'navigation.redirect("Settings", "Metadata")'>
        Metadata settings
    </BaseDropdownItem>

    <BaseDropdownItem @select = 'navigation.redirect("Settings", "Zenodo")'>
        Zenodo settings
    </BaseDropdownItem>

    <hr class = "h-0.5 bg-gray border-0 my-1">

    <BaseDropdownItem @select = 'navigation.redirect("Sign out")'>
        Sign out
    </BaseDropdownItem>
</BaseDropdown>
</template>

<script setup>

import { navigation } from "@harkana/tools"

import BaseDropdown from './BaseDropdown.vue'
import BaseDropdownItem from './BaseDropdownItem.vue'

</script>
