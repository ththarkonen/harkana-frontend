<template>
<BaseDropdown :close-on-select = "true"
              :teleport-to-body = "true"
              portal-placement = "bottom-start"
              :portal-offset-x = "0"
              :portal-offset-y = "8"
              menu-class = "fixed z-[45] min-w-[12rem] origin-top-left rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30">
    <template v-slot:trigger>
        <span class = "font-medium">Menu</span>
    </template>

    <BaseDropdownItem @select = 'navigation.redirect("Main menu")'>
        Main menu
    </BaseDropdownItem>

    <BaseDropdownItem @select = 'navigation.redirect("Data formats", "Plain text")'>
        Data formats
    </BaseDropdownItem>

    <li v-if = "frontendVersionDisplay.length > 0"
        class = "px-4 py-2 text-left text-sm text-white/45"
        :title = "'Release ' + version.release + ( version.buildSha.length > 0 ? '\nCommit ' + version.buildSha : '' )">
        Version {{ frontendVersionDisplay }}
    </li>
</BaseDropdown>
</template>

<script setup>

import { navigation, version } from "@harkana/tools"

import BaseDropdown from "./BaseDropdown.vue"
import BaseDropdownItem from "./BaseDropdownItem.vue"

const frontendVersionDisplay = String( version.display ?? "" ).trim()

</script>
