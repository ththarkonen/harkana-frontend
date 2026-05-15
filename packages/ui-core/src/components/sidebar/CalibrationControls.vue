<template>
	<div class = "space-y-3">
		<p class = "text-xs leading-snug text-white/70">
			{{ description }}
		</p>

		<div class = "grid gap-3">
			<div class = "min-w-0">
				<div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-white/70">
					Saved profiles
				</div>
				<BaseDropdown root-class = "relative block w-full min-w-0 text-left"
							  :show-chevron = "false"
							  :close-on-select = "true"
							  :teleport-to-body = "true"
							  portal-placement = "bottom-start"
							  trigger-class = "group flex h-9 w-full min-w-0 items-center justify-between gap-2 border-0 border-b border-white/20 bg-transparent px-0 py-1 text-left text-sm font-medium text-white transition focus:border-brand focus:outline-none focus-visible:border-brand"
							  menu-class = "fixed z-[45] w-[min(22rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] origin-top-left rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30"
							  list-class = "max-h-[min(18rem,calc(100vh-12rem))] overflow-y-auto py-1">
					<template v-slot:trigger>
						<span class = "min-w-0 flex-1 truncate"
							  :title = "selectedProfileLabel">
							{{ selectedProfileLabel }}
						</span>
						<i class = "fas fa-chevron-down shrink-0 text-xs text-white/60 transition group-hover:text-white"
						   aria-hidden = "true"></i>
					</template>

					<BaseDropdownItem tooltip = "No calibration"
									  @select = "selectProfile( '' )">
						<div class = "flex min-w-0 items-center justify-between gap-3">
							<span class = "min-w-0 flex-1 truncate">No calibration</span>
							<i :class = "selectedProfileValue.length === 0 ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
							   aria-hidden = "true"></i>
						</div>
					</BaseDropdownItem>

					<BaseDropdownItem v-for = "profile in profileOptions"
									  :key = "profile.value"
									  :tooltip = "profile.label"
									  @select = "selectProfile( profile.value )">
						<div class = "flex min-w-0 items-center justify-between gap-3">
							<span class = "min-w-0 flex-1 truncate">{{ profile.label }}</span>
							<i :class = "selectedProfileValue === String( profile.value ?? '' ) ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
							   aria-hidden = "true"></i>
						</div>
					</BaseDropdownItem>
				</BaseDropdown>
			</div>
		</div>

		<div class = "flex flex-wrap items-center gap-1.5">
			<button type = "button"
					v-if = "showPanelButton"
					@click = "$emit( 'show-panel' )"
					class = "inline-flex h-8 w-8 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand"
					title = "Show calibration panel"
					aria-label = "Show calibration panel">
				<i class = "fas fa-list" aria-hidden = "true"></i>
			</button>

			<button type = "button"
					@click = "$emit( 'save' )"
					:disabled = "saving || canSaveSelection === false"
					class = "relative inline-flex h-8 w-8 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
					title = "Apply the selected calibration profile to this project"
					aria-label = "Apply the selected calibration profile to this project">
				<span class = "inline-flex h-4 w-4 items-center justify-center"
					  :class = "{ invisible: saving }">
					<i class = "fas fa-save" aria-hidden = "true"></i>
				</span>
				<span v-if = "saving"
					  class = "absolute inset-0 flex items-center justify-center">
					<Spinner class = "h-4 w-4 text-brand"></Spinner>
				</span>
			</button>
		</div>
	</div>
</template>

<script setup>
import { computed } from "vue"
import Spinner from '../general/Spinner.vue'
import BaseDropdown from "../navbar/BaseDropdown.vue"
import BaseDropdownItem from "../navbar/BaseDropdownItem.vue"

const props = defineProps({
	profileOptions: { type: Array, default: () => [] },
	selectedProfileId: { type: String, default: "" },
	profilesLoading: { type: Boolean, default: false },
	saving: { type: Boolean, default: false },
	canSaveSelection: { type: Boolean, default: false },
	showPanelButton: { type: Boolean, default: true },
	description: {
		type: String,
		default: "Selecting a saved profile previews it immediately. Save assigns the selected calibration profile to this project."
	}
})

const emit = defineEmits([ "show-panel", "save", "update:selected-profile-id" ])

const selectedProfileValue = computed({
	get(){
		return String( props.selectedProfileId ?? "" )
	},
	set( value ){
		emit( "update:selected-profile-id", String( value ?? "" ) )
	}
})

const selectedProfileLabel = computed(() => {
	const selectedValue = selectedProfileValue.value
	if( selectedValue.length === 0 ){
		return "No calibration"
	}

	const selectedProfile = props.profileOptions.find(( profile ) => {
		return String( profile?.value ?? "" ) === selectedValue
	})

	return String( selectedProfile?.label ?? selectedValue )
})

const selectProfile = ( value ) => {
	selectedProfileValue.value = String( value ?? "" )
}
</script>
