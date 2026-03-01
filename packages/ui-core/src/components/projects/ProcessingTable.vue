<template>
<div class="relative w-full">

	<!-- Table Wrapper -->
	<div class="overflow-x-auto rounded-lg border border-gray-700 bg-gray ">
	<table class="w-full border-collapse table-fixed">

		<!-- Sticky Header -->
		<thead class="sticky top-0 z-20">
			<tr class="border-b border-gray-700 text-left text-gray-300">

				<th class="w-10 px-3 py-2 text-center align-middle">
                </th>

				<th class="cursor-pointer px-0 py-2 w-[40%] text-white"
				    @click="sortBy('name')">
					<div class="flex items-center gap-1">
						Project name
						<ProjectTableSortIcon :active="sortKey === 'name'" :dir="sortDir" />
					</div>
				</th>

				<th class="cursor-pointer px-3 py-2 w-[20%] text-white">
					<div class="flex items-center gap-1">
					</div>
				</th>

				<th class="cursor-pointer px-3 py-2 w-[20%] text-white"
				    @click="sortBy('lastModified')">
					<div class="flex items-center gap-1">
						Started
						<ProjectTableSortIcon :active="sortKey === 'lastModified'" :dir="sortDir" />
					</div>
				</th>

				<th class="px-3 py-2 text-right w-[20%] text-white">
				</th>
			</tr>
		</thead>

		<tbody>
			<tr v-for="(project, index) in sortedProjects"
			    :key="project.id"
                @click="navigation.showProject( project, $event)"
                @click.middle="navigation.showProject( project, $event)"
			    class = "border-b border-gray-700">

				<td class="w-10 px-3 py-1 text-center align-middle">
					<i class = "fa fa-cog fa-spin text-white"></i>
                </td>


				<td class="w-[40%] px-0 py-1 text-white">
                    <div class="truncate" :title="project.name">
                        {{ project.name }}
                    </div>
                </td>

				<td class="px-3 py-1  text-white">
				</td>

				<td class="px-3 py-1  text-white">
					{{ format.lastModified( project ) }}
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

/* ───────────── Methods ───────────── */

const sortBy = (key: 'name' | 'owner' | 'modified') => {
	if (sortKey.value === key) {
		sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
	} else {
		sortKey.value = key
		sortDir.value = 'asc'
	}
}

</script>





