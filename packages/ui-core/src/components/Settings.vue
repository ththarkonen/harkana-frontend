<template>
<!-- Outer frame -->
<div class="bg-brand min-h-screen p-[2px] overflow-y:hidden">

    <!-- Mobile overlay -->
    <div v-if="sidebarOpen" @click="sidebarOpen = false" class="fixed inset-0 bg-black/40 z-30 md:hidden"></div>
    
    <!-- App Grid -->
    <div class="grid h-[calc(100vh-4px)] gap-[2px] grid-cols-1 grid-rows-[auto_1fr] md:grid-cols-[16rem_1fr] md:grid-rows-[auto_1fr]">

        <Sidebar :style="sidebarStyle">
            <Logo></Logo>

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
                <MenuDropdown></MenuDropdown>
            </template>
            <template v-slot:right-items>
                <AccountDropdown></AccountDropdown>
            </template>
        </NavigationBar>

        <!-- Main Content -->
        <main class="min-h-0 bg-white rounded-lg shadow-sm p-4"
              :class="selected === 'Compute tokens' ? 'overflow-hidden' : 'overflow-y-auto'">
            <div class="w-full max-w-3xl rounded-lg"
                 :class="selected === 'Compute tokens' ? 'flex h-full min-h-0 flex-col' : ''">

                <component v-for = "section in mountedSections"
                           :key = "section"
                           :is = "sectionComponentFor( section )"
                           v-show = "selected === section"
                           :class = "section === 'Compute tokens' ? 'h-full min-h-0' : ''"></component>
                <!-- JSON -->
                <div v-show="selected === 'JSON'" class="prose prose-gray max-w-none">
                </div>

            </div>
        </main>

    </div>
</div>
</template>

<script setup>
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { navigation } from '@harkana/tools'

import Sidebar from './sidebar/Sidebar.vue'
import Logo from "./sidebar/Logo.vue"

import NavigationBar from './navbar/NavigationBar.vue'
import MenuDropdown from './navbar/MenuDropdown.vue'
import AccountDropdown from './navbar/AccountDropdown.vue'

const dataType = import.meta.env.VITE_DATA_TYPE
const normalizedDataType = String( dataType ?? "" ).trim().toLowerCase()
const isHyperspectrumApp = normalizedDataType === "hypercars" || normalizedDataType === "hyperraman"
const Profile = defineAsyncComponent(() => import('./sections/Profile.vue'))
const Tokens = defineAsyncComponent(() => import('./sections/Tokens.vue'))
const Visualization = defineAsyncComponent(() => isHyperspectrumApp
    ? import('./sections/HyperspectrumVisualization.vue')
    : import('./sections/Visualization.vue')
)
const Calibration = defineAsyncComponent(() => import('./sections/Calibration.vue'))
const CustomIndices = defineAsyncComponent(() => import('./sections/CustomIndices.vue'))
const Metadata = defineAsyncComponent(() => import('./sections/Metadata.vue'))
const Zenodo = defineAsyncComponent(() => import('./sections/Zenodo.vue'))

const route = useRoute()
const router = useRouter()

const emit = defineEmits(['loaded'])

const sidebarOpen = ref(false)
const sidebarStyle = computed(() => {
    return sidebarOpen.value
        ? { left: '2px' }
        : { left: 'calc(-16rem - 2px)' }
})

const sections = isHyperspectrumApp
    ? ["Profile", "Compute tokens", "Visualization", "Calibration", "Custom indices", "Metadata", "Zenodo"]
    : ["Profile", "Compute tokens", "Visualization", "Calibration", "Metadata", "Zenodo"]
const normalizeSectionName = ( value ) => {
    const normalized = String( value ?? "" ).trim()
    return sections.includes( normalized ) ? normalized : "Profile"
}
const selected = ref(normalizeSectionName( route.query.section ))
const mountedSections = ref([ selected.value ])

const sectionComponents = {
    Profile,
    "Compute tokens": Tokens,
    Visualization,
    Calibration,
    "Custom indices": CustomIndices,
    Metadata,
    Zenodo
}

const sectionComponentFor = ( section ) => {
    return sectionComponents[section] ?? Profile
}

const ensureSectionMounted = ( section ) => {
    const normalized = normalizeSectionName( section )
    if( mountedSections.value.includes( normalized ) ){
        return
    }

    mountedSections.value = [ ...mountedSections.value, normalized ]
}

// Function to change section without triggering route navigation
const selectSection = (section) => {
    selected.value = normalizeSectionName( section )
}

// Sync with URL query params when they change externally
watch(
    () => route.query.section,
    (val) => {
        if( val ){
            selected.value = normalizeSectionName( val )
        }
    }
)

// Update URL when section changes, but use replace to avoid navigation event
watch(selected, (val) => {
    ensureSectionMounted( val )
    if (route.query.section !== val) {
        router.replace({ query: { section: val } }).catch(() => {})
    }
}, { immediate: true })

onMounted(() => {

    emit('loaded')
})
</script>
