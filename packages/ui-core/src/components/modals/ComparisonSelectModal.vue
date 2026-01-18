<template>
    <Modal ref = "modal" :title = "'Project comparison'">
        <template v-slot:main>
            <p class = "text-white mb-4">
                You can filter the project list through the search input.
            </p>
            
            <ProjectSearchBar v-model = "searchPattern"></ProjectSearchBar>
            
            <hr class = "border-gray-600 my-4">
            
            <!-- Integrated Project Select -->
            <div class = "mb-4">
                <select
                    id = "projectSelect"
                    v-model = "selectedProjectID"
                    class = "w-full border border-gray-600 rounded px-3 py-2 bg-gray-700
                    text-black focus:outline-none focus:ring-2 focus:brand">

                    <option :value="currentID">-- Choose a project --</option>
                    <option
                        v-for = "(project, key) in filteredProjects"
                        :key = "key"
                        :value = "project.id">
                        {{ project.name }}
                    </option>

                </select>
            </div>
        </template>
    </Modal>
</template>

<script setup>

import { ref, computed } from 'vue'
import Modal from "./Modal.vue"
import ProjectSearchBar from '../projects/ProjectSearchBar.vue'

const props = defineProps({
    currentID: { type: String, required: true },
    projects: { type: Object, required: true }
})

const selectedProjectID = defineModel({ type: String, required: true })

const modal = ref(null)
const searchPattern = ref("")

const filteredProjects = computed(() => {
    const pattern = searchPattern.value.toLowerCase()
    const projectList = Object.values( props.projects )

    return projectList.filter(project => {

        const notSameProject = project.id !== props.currentID
        const ownerName = `${project.owner.familyName} ${project.owner.firstName}`
        const ownerNameReversed = `${project.owner.firstName} ${project.owner.familyName}`

        const noSearchPattern = !pattern

        const inProjectName = project.name.toLowerCase().includes(pattern)
        const inOwnerFirstName = project.owner.firstName.toLowerCase().includes(pattern)
        const inOwnerFamilyName = project.owner.familyName.toLowerCase().includes(pattern)
        const inOwnerName = ownerName.toLowerCase().includes(pattern)
        const inOwnerNameReversed = ownerNameReversed.toLowerCase().includes(pattern)

        let condition = noSearchPattern || inProjectName || inOwnerFirstName || inOwnerFamilyName || inOwnerName || inOwnerNameReversed
        return condition && notSameProject
    })
})

const open = async () => modal.value.open()
const close = () => modal.value.close()

defineExpose({
    open,
    close
})
</script>