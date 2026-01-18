<template>
<!-- Outer frame -->
<div class="bg-brand min-h-screen p-[2px] overflow-y:hidden">

    <!-- Mobile overlay -->
    <div v-if="sidebarOpen" @click="sidebarOpen = false" class="fixed inset-0 bg-black/40 z-30 md:hidden"></div>
    
    <!-- App Grid -->
    <div class="grid h-[calc(100vh-4px)] gap-[2px] grid-cols-1 grid-rows-[auto_1fr] md:grid-cols-[16rem_1fr] md:grid-rows-[auto_1fr]">

        <Sidebar :style="sidebarStyle">
            <Logo></Logo>

            <SidebarButton @click="navigation.route('Main menu', {})" class="my-2">
                Project menu
            </SidebarButton>
            

            
            <hr class="h-0.5 bg-gray border-0 my-4">

            <div
                v-for="section in sections"
                :key="section"
                @click="selectSection(section)"
                class="px-4 py-2 my-2 rounded font-semibold text-white cursor-pointer transition-colors"
                :class="selected === section
                    ? 'bg-brand'
                    : 'text-gray-700 hover:bg-gray'"
            >
                {{ section }}
            </div>

        </Sidebar>

        <NavigationBar>
            <template v-slot:left-items>
                <button @click="sidebarOpen = true" class="md:hidden px-3 py-2 rounded bg-slate-100">☰</button>
            </template>
            <template v-slot:right-items>
                <AccountDropdown></AccountDropdown>
            </template>
        </NavigationBar>

        <!-- Main Content -->
        <main class="bg-white rounded-lg shadow-sm p-4 overflow-y-auto">
            <div class="w-full max-w-3xl rounded-lg">

                <!-- Plain text -->
                <Profile v-show = "selected === 'Profile'"></Profile>
                <Tokens  v-show = "selected === 'Compute tokens'"></Tokens>
                <Visualization v-show = "selected === 'Visualization'"></Visualization>
                <Metadata v-show = "selected === 'Metadata'"></Metadata>
                <Zenodo v-show = "selected === 'Zenodo'"></Zenodo>
                <!-- JSON -->
                <div v-show="selected === 'JSON'" class="prose prose-gray max-w-none">
                </div>

            </div>
        </main>

    </div>
</div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { navigation } from '@harkana/tools'

import Sidebar from './sidebar/Sidebar.vue'
import Logo from "./sidebar/Logo.vue"
import SidebarButton from './sidebar/SidebarButton.vue'

import NavigationBar from './navbar/NavigationBar.vue'
import AccountDropdown from './navbar/AccountDropdown.vue'

import Profile from './sections/Profile.vue'
import Tokens from './sections/Tokens.vue'
import Visualization from './sections/Visualization.vue'
import Metadata from './sections/Metadata.vue'
import Zenodo from './sections/Zenodo.vue'

const route = useRoute()
const router = useRouter()

const emit = defineEmits(['loaded'])

const sidebarOpen = ref(false)
const sidebarStyle = computed(() => {
    return sidebarOpen.value
        ? { left: '2px' }
        : { left: 'calc(-16rem - 2px)' }
})

const sections = ["Profile", "Compute tokens", "Visualization", "Metadata", "Zenodo"]
const selected = ref(route.query.section || 'Plain text')

// Function to change section without triggering route navigation
const selectSection = (section) => {
    selected.value = section
}

// Sync with URL query params when they change externally
watch(
    () => route.query.section,
    (val) => {
        if (val && (sections.includes(val) || val === 'Output')) {
            selected.value = val
        }
    }
)

// Update URL when section changes, but use replace to avoid navigation event
watch(selected, (val) => {
    if (route.query.section !== val) {
        router.replace({ query: { section: val } }).catch(() => {})
    }
})

onMounted(() => {

    emit('loaded')
})
</script>