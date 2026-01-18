<template>
<div class="relative w-full">

	<!-- Table Wrapper -->
	<div class="overflow-x-auto rounded-lg border border-gray-700 bg-gray ">
	<table class="w-full border-collapse table-fixed">

		<!-- Sticky Header -->
		<thead class="sticky top-0 z-20">
			<tr class="border-b border-gray-700 text-left text-gray-300">

				<th class="w-10 px-3 py-2 text-center align-middle">
                    <input
                        ref="selectAllRef"
                        type="checkbox"
                        class="h-4 w-4 align-middle accent-brand"
                        :checked="allSelected"
                        @change="toggleAll"
                    />
                </th>

				<th class="cursor-pointer px-0 py-2 w-[40%] text-white"
				    @click="sortBy('name')">
					<div class="flex items-center gap-1">
						Project name
						<ProjectTableSortIcon :active="sortKey === 'name'" :dir="sortDir" />
					</div>
				</th>

				<th class="cursor-pointer px-3 py-2 w-[20%] text-white"
				    @click="sortBy('owner')">
					<div class="flex items-center gap-1">
						Owner
						<ProjectTableSortIcon :active="sortKey === 'owner'" :dir="sortDir" />
					</div>
				</th>

				<th class="cursor-pointer px-3 py-2 w-[20%] text-white"
				    @click="sortBy('lastModified')">
					<div class="flex items-center gap-1">
						Last modified
						<ProjectTableSortIcon :active="sortKey === 'lastModified'" :dir="sortDir" />
					</div>
				</th>

				<th class="px-3 py-2 text-right w-[20%] text-white">
					Actions
				</th>
			</tr>
		</thead>

		<tbody>
			<tr v-for="(project, index) in sortedProjects"
			    :key="project.id"
                @click="navigation.showProject( project, $event)"
                @click.middle="navigation.showProject( project, $event)"
			    class = "border-b border-gray-700
                        hover:bg-brand
                        cursor-pointer
                        transition-colors duration-200 ease-out">

				<td class="w-10 px-3 py-1 text-center align-middle">
                    <input
                        type="checkbox"
                        class="h-4 w-4 align-middle accent-brand"
                        :checked="selectedIds.has(project.id)"
                        @click.stop
                        @click="toggleRow(project.id, index, $event)"
                    />
                </td>


				<td class="w-[40%] px-0 py-1 text-white">
                    <div class="truncate" :title="project.name">
                        {{ project.name }}
                    </div>
                </td>

				<td class="px-3 py-1  text-white">
					{{ format.owner( project ) }}
				</td>

				<td class="px-3 py-1  text-white">
					{{ format.lastModified( project ) }}
				</td>

				<td @click.stop class="px-3 py-1 text-right text-white" >
					<slot name="actions" :project="project"></slot>
				</td>
			</tr>
		</tbody>

	</table>
	</div>
</div>
</template>

<script setup lang="ts">

import { ref, computed, watchEffect} from 'vue'
import { format, navigation} from '@harkana/tools';

import ProjectTableSortIcon from './ProjectTableSortIcon.vue';

const props = defineProps<{
	projects: Record<string, any>
}>()

const selectedIds = defineModel("selectedProjectIDs", { type: Set})
const lastSelectedIndex = ref(null)

const sortKey = ref<'name' | 'owner' | 'modified'>('modified')
const sortDir = ref<'asc' | 'desc'>('desc')

const selectAllRef = ref<HTMLInputElement | null>(null)

/* ───────────── Computed ───────────── */

const projectsArray = computed(() =>
	Object.values(props.projects)
)

const sortedProjects = computed(() => {
	const arr = [...projectsArray.value]

	arr.sort((a, b) => {
		let v1: string | number = ''
		let v2: string | number = ''

		if (sortKey.value === 'owner') {
			v1 = `${a.owner.familyName} ${a.owner.firstName}`.toLowerCase()
			v2 = `${b.owner.familyName} ${b.owner.firstName}`.toLowerCase()
		}
		else if (sortKey.value === 'modified') {
			v1 = new Date(a.lastModified).getTime()
			v2 = new Date(b.lastModified).getTime()
		}
		else {
			v1 = a[sortKey.value]?.toString().toLowerCase()
			v2 = b[sortKey.value]?.toString().toLowerCase()
		}

		if (v1 < v2) return sortDir.value === 'asc' ? -1 : 1
		if (v1 > v2) return sortDir.value === 'asc' ? 1 : -1
		return 0
	})

	return arr
})

const allSelected = computed(() =>
	sortedProjects.value.length > 0 &&
	sortedProjects.value.every(p => selectedIds.value.has(p.id))
)

/* ───────────── Watchers ───────────── */

watchEffect(() => {
	if (!selectAllRef.value) return

	selectAllRef.value.indeterminate =
		selectedIds.value.size > 0 &&
		selectedIds.value.size < sortedProjects.value.length
})

/* ───────────── Methods ───────────── */

const sortBy = (key: 'name' | 'owner' | 'modified') => {
	if (sortKey.value === key) {
		sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
	} else {
		sortKey.value = key
		sortDir.value = 'asc'
	}
}

const toggleAll = (e: Event) => {
	const checked = (e.target as HTMLInputElement).checked
	selectedIds.value.clear()

	if (checked) {
		sortedProjects.value.forEach(p =>
			selectedIds.value.add(p.id)
		)
	}
}

const toggleRow = (id: string, index: number, e: MouseEvent) => {
    
    const checkbox = e.target as HTMLInputElement
    const checked = checkbox.checked

    if (e.shiftKey && lastSelectedIndex.value !== null) {

        const start = Math.min(lastSelectedIndex.value, index)
        const end = Math.max(lastSelectedIndex.value, index)

    for (let i = start; i <= end; i++) {

        const pid = sortedProjects.value[i].id
        if (checked) selectedIds.value.add(pid)
        else selectedIds.value.delete(pid)
    }
    } else {

        if (checked) selectedIds.value.add(id)
        else selectedIds.value.delete(id)
    }

    lastSelectedIndex.value = index
}

</script>





