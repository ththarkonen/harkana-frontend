<template>
	<Modal ref = "modal"
		   title = "Project custom indices"
		   :show-close = "saving === false && dirty === false"
		   panel-class = "w-full max-w-2xl"
		   @close = "emitClose">
		<template #main>
			<div class = "space-y-4 pb-2">
				<p class = "text-sm leading-relaxed text-white/80">
					Choose which saved custom index profiles are available in this project. Changes are saved when Done is clicked.
				</p>

				<div v-if = "supported === false"
					 class = "rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm leading-snug text-white/70">
					Custom index profiles are not available in this environment.
				</div>

				<template v-else>
					<div class = "flex flex-wrap items-center gap-2">
						<BaseDropdown root-class = "relative block min-w-[min(18rem,100%)] flex-1 text-left"
								  :show-chevron = "false"
								  :close-on-select = "true"
								  :teleport-to-body = "true"
								  portal-placement = "bottom-start"
								  trigger-class = "group flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-left text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50"
								  menu-class = "fixed z-[55] w-[min(28rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] origin-top-left rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30"
								  list-class = "max-h-[min(20rem,calc(100vh-12rem))] overflow-y-auto py-1">
							<template v-slot:trigger>
								<span class = "min-w-0 flex-1 truncate">
									{{ profilesLoading ? "Loading profiles..." : "Add saved profile" }}
								</span>
								<i class = "fas fa-plus shrink-0 text-xs text-white/60 transition group-hover:text-white"
								   aria-hidden = "true"></i>
							</template>

							<li v-if = "profilesLoading"
								class = "flex items-center gap-2 px-4 py-2 text-sm text-white/55">
								<Spinner class = "h-3.5 w-3.5 text-brand"></Spinner>
								<span>Loading profiles...</span>
							</li>
							<li v-else-if = "availableProfileOptions.length === 0"
								class = "px-4 py-2 text-sm text-white/55">
								No profiles available.
							</li>
							<BaseDropdownItem v-for = "profile in availableProfileOptions"
										  :key = "'custom-index-project-add-' + profile.value"
										  :tooltip = "profile.label"
										  @select = "$emit( 'add-profile', profile.value )">
								<span class = "block min-w-0 truncate">{{ profile.label }}</span>
							</BaseDropdownItem>
						</BaseDropdown>

						<button type = "button"
								@click = "$emit( 'refresh' )"
								:disabled = "profilesLoading"
								class = "relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-600 text-white transition hover:border-brand hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-40"
								title = "Refresh custom index profiles"
								aria-label = "Refresh custom index profiles">
							<span class = "inline-flex h-4 w-4 items-center justify-center"
								  :class = "{ invisible: profilesLoading }">
								<i class = "fas fa-sync-alt" aria-hidden = "true"></i>
							</span>
							<span v-if = "profilesLoading"
								  class = "absolute inset-0 flex items-center justify-center">
								<Spinner class = "h-4 w-4 text-brand"></Spinner>
							</span>
						</button>
					</div>

					<div v-if = "assignedEntries.length > 0"
						 class = "space-y-2">
						<div class = "flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
							<span>Project profiles</span>
							<span class = "group relative inline-flex normal-case tracking-normal">
								<button type = "button"
										class = "inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-white/20 text-[10px] font-semibold text-white/65 transition hover:border-white/40 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand"
										aria-label = "Project profiles help">
									?
								</button>
								<span class = "pointer-events-none absolute left-0 top-6 z-20 hidden w-72 rounded-md border border-white/10 bg-gray-900 px-3 py-2 text-xs font-normal normal-case leading-snug tracking-normal text-white/75 shadow-lg group-hover:block group-focus-within:block">
									Use the arrow buttons to reorder this project's custom index profiles. Use the trash button to remove the project association. The saved custom index profiles themselves can be deleted from
									<button type = "button"
											class = "pointer-events-auto font-semibold text-brand underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-brand"
											@click = "$emit( 'open-settings' )">
										Settings
									</button>.
								</span>
							</span>
						</div>
						<div v-for = "( entry, index ) in assignedEntries"
							 :key = "entry.profileID"
							 class = "flex min-w-0 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80">
							<button type = "button"
									@click = "$emit( 'update:active-profile-id', entry.profileID )"
									class = "min-w-0 flex-1 truncate text-left transition hover:text-white focus:outline-none focus:text-white"
									:title = "entryLabel( entry )">
								{{ entryLabel( entry ) }}
							</button>
							<button type = "button"
									@click = "$emit( 'move-profile', { profileID: entry.profileID, direction: -1 } )"
									:disabled = "index === 0 || saving"
									class = "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-30">
								<span class = "sr-only">Move up</span>
								<i class = "fas fa-chevron-up" aria-hidden = "true"></i>
							</button>
							<button type = "button"
									@click = "$emit( 'move-profile', { profileID: entry.profileID, direction: 1 } )"
									:disabled = "index >= assignedEntries.length - 1 || saving"
									class = "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-30">
								<span class = "sr-only">Move down</span>
								<i class = "fas fa-chevron-down" aria-hidden = "true"></i>
							</button>
							<button type = "button"
									@click = "$emit( 'remove-profile', entry.profileID )"
									:disabled = "saving"
									class = "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/60 transition hover:bg-white/10 hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-30">
								<span class = "sr-only">Remove</span>
								<i class = "fas fa-trash" aria-hidden = "true"></i>
							</button>
						</div>
					</div>

					<div v-else
						 class = "rounded-md border border-white/10 bg-white/5 px-3 py-4 text-center text-sm leading-snug text-white/60">
						No custom index profiles are assigned to this project.
					</div>

					<p v-if = "dirty"
					   class = "text-xs leading-snug text-amber-200">
						Changes will be saved when Done is clicked.
					</p>
					<p v-if = "normalizedErrorMessage.length > 0"
					   class = "text-xs leading-snug text-red-300">
						{{ normalizedErrorMessage }}
					</p>
				</template>
			</div>
		</template>

		<template #footer>
			<div class = "border-t border-gray pt-3 pb-4">
				<button type = "button"
						@click = "emitDone"
						:disabled = "saving"
						class = "relative inline-flex min-h-10 w-full items-center justify-center rounded bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50">
					<span :class = "{ invisible: saving }">Done</span>
					<span v-if = "saving" class = "absolute inset-0 flex items-center justify-center">
						<Spinner class = "h-5 w-5 text-white"></Spinner>
					</span>
				</button>
			</div>
		</template>
	</Modal>
</template>

<script setup>
import { computed, ref } from "vue"

import Modal from "./Modal.vue"
import Spinner from "../general/Spinner.vue"
import BaseDropdown from "../navbar/BaseDropdown.vue"
import BaseDropdownItem from "../navbar/BaseDropdownItem.vue"
import { formatCustomIndexProfileLabel } from "../../composables/hyperspectrum/customIndex/formula.js"

const props = defineProps({
	supported: { type: Boolean, default: true },
	profilesLoading: { type: Boolean, default: false },
	saving: { type: Boolean, default: false },
	dirty: { type: Boolean, default: false },
	errorMessage: { type: String, default: "" },
	profileOptions: { type: Array, default: () => [] },
	assignedEntries: { type: Array, default: () => [] }
})

const emit = defineEmits([
	"add-profile",
	"close",
	"done",
	"move-profile",
	"open-settings",
	"refresh",
	"remove-profile",
	"update:active-profile-id"
])

const modal = ref(null)

const normalizedErrorMessage = computed(() => String( props.errorMessage ?? "" ).trim())

const entryLabel = ( entry = {} ) => {
	const profile = entry?.profile ?? entry
	return formatCustomIndexProfileLabel( profile )
}

const assignedProfileIDs = computed(() => new Set(
	props.assignedEntries
		.map(( entry ) => String( entry?.profileID ?? "" ).trim() )
		.filter(( profileID ) => profileID.length > 0 )
))

const availableProfileOptions = computed(() => {
	return props.profileOptions.filter(( profile ) => {
		const profileID = String( profile?.value ?? "" ).trim()
		return profileID.length > 0 && assignedProfileIDs.value.has( profileID ) === false
	})
})

const open = () => {
	modal.value?.open?.()
}

const close = () => {
	modal.value?.close?.()
}

const emitClose = () => {
	emit( "close" )
}

const emitDone = () => {
	emit( "done" )
}

defineExpose({ open, close })
</script>
