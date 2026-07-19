<template>
<div class = "prose prose-gray max-w-none">
	<div class = "not-prose max-w-3xl space-y-8">
		<div class = "space-y-3">
			<h3 class = "m-0 text-lg font-bold text-black">Custom index settings</h3>
			<p class = "m-0 text-sm text-black/70">
				Manage reusable hyperspectral layer formula profiles. Owned profiles can be shared with collaborators;
				shared profiles can be used but not edited.
			</p>
		</div>

		<div v-if = "profilesSupported === false"
			 class = "rounded-lg border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-black/70">
			Custom index profile management is not available in this environment yet.
		</div>

		<div v-else class = "space-y-4">
			<div class = "flex flex-wrap items-center justify-between gap-3">
				<div class = "text-xs font-semibold uppercase tracking-wide text-black/70">
					Saved profiles
				</div>

				<button type = "button"
						@click = "refreshProfiles"
						:disabled = "profilesLoading"
						class = "relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-black/10 text-black/70 transition-colors hover:border-brand hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-70"
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

			<div class = "inline-flex max-w-full flex-wrap gap-2 rounded-lg border border-black/10 bg-black/[0.03] p-2"
				 role = "tablist"
				 aria-label = "Custom index profile scopes">
				<button v-for = "tab in profileTabs"
						:key = "tab.id"
						type = "button"
						role = "tab"
						:aria-selected = "activeTab === tab.id ? 'true' : 'false'"
						@click = "activeTab = tab.id"
						class = "inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
						:class = "activeTab === tab.id
							? 'bg-brand text-white'
							: 'bg-transparent text-black/70 hover:bg-black/5 hover:text-black'">
					{{ tab.label }}
				</button>
			</div>

			<p v-if = "profilesError.length > 0"
			   class = "text-sm text-red-600">
				{{ profilesError }}
			</p>

			<div v-if = "profilesLoading && activeProfiles.length === 0"
				 class = "rounded-lg border border-black/10 bg-black/[0.03] px-4 py-6 text-sm text-black/60">
				Loading custom index profiles...
			</div>

			<div v-else-if = "activeProfiles.length === 0"
				 class = "rounded-lg border border-black/10 bg-black/[0.03] px-4 py-6 text-sm text-black/60">
				{{ activeTab === 'owned' ? 'No owned custom index profiles.' : 'No custom index profiles shared with you.' }}
			</div>

			<div v-else class = "space-y-2">
				<div v-for = "profile in activeProfiles"
					 :key = "profile.profileID"
					 class = "flex items-start justify-between gap-4 rounded-lg border border-black/10 bg-black/[0.03] px-4 py-3">
					<div class = "min-w-0 space-y-1">
						<div class = "flex flex-wrap items-center gap-2">
							<div class = "min-w-0 truncate text-sm font-semibold text-slate-900">
								{{ profile.friendlyName }}
							</div>
							<span class = "rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-semibold text-black/55">
								{{ formatCustomIndexDataType( profile.dataType ) }}
							</span>
							<span v-if = "profile.shared === true"
								  class = "rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
								Shared
							</span>
						</div>
						<div v-if = "formatProfileDescription( profile ).length > 0"
							 class = "line-clamp-2 whitespace-pre-wrap text-xs leading-relaxed text-black/60">
							{{ formatProfileDescription( profile ) }}
						</div>
						<div class = "text-xs text-black/60">
							Formula: <span class = "font-mono">{{ formatProfileExpression( profile ) }}</span>
						</div>
						<div class = "text-xs text-black/60">
							Created from: {{ resolveSourceProjectName( profile ) }}
						</div>
						<div class = "text-xs text-black/60">
							{{ formatOperandSummary( profile ) }} • Used by: {{ formatAssignedProjectCount( profile.assignedProjectCount ?? profile.usageCount ) }}
						</div>
						<div v-if = "activeTab === 'owned'"
							 class = "text-xs text-black/60">
							Collaborators: {{ formatCollaboratorCount( profile.collaboratorCount ) }}
						</div>
						<div v-else class = "text-xs text-black/60">
							Owner: {{ formatOwner( profile ) }}
						</div>
					</div>

					<div class = "flex shrink-0 items-center gap-1">
						<button v-if = "activeTab === 'owned'"
								type = "button"
								@click = "openProfileEditModal( profile )"
								:disabled = "editingProfileLoadingID.length > 0 || editingProfileSaving || copyingProfileID.length > 0 || deletingProfileID.length > 0"
								class = "relative inline-flex h-8 w-8 items-center justify-center rounded-md text-black/60 transition-colors hover:bg-black/5 hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
								title = "Edit custom index profile details"
								aria-label = "Edit custom index profile details">
							<span class = "inline-flex h-4 w-4 items-center justify-center"
								  :class = "{ invisible: editingProfileLoadingID === profile.profileID }">
								<i class = "fas fa-pen" aria-hidden = "true"></i>
							</span>
							<span v-if = "editingProfileLoadingID === profile.profileID"
								  class = "absolute inset-0 flex items-center justify-center">
								<Spinner class = "h-4 w-4 text-brand"></Spinner>
							</span>
						</button>

						<button v-if = "activeTab === 'owned'"
								type = "button"
								@click = "openProfileShareModal( profile )"
								class = "inline-flex h-8 w-8 items-center justify-center rounded-md text-black/60 transition-colors hover:bg-black/5 hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand"
								title = "Share custom index profile"
								aria-label = "Share custom index profile">
							<i class = "fas fa-share-alt" aria-hidden = "true"></i>
						</button>

						<button type = "button"
								@click = "copyProfileToOwnedProfiles( profile )"
								:disabled = "copyingProfileID.length > 0 || deletingProfileID.length > 0"
								class = "relative inline-flex h-8 w-8 items-center justify-center rounded-md text-black/60 transition-colors hover:bg-black/5 hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
								:title = "activeTab === 'owned' ? 'Duplicate custom index profile' : 'Copy custom index profile to owned profiles'"
								:aria-label = "activeTab === 'owned' ? 'Duplicate custom index profile' : 'Copy custom index profile to owned profiles'">
							<span class = "inline-flex h-4 w-4 items-center justify-center"
								  :class = "{ invisible: copyingProfileID === profile.profileID }">
								<i class = "fas fa-clone" aria-hidden = "true"></i>
							</span>
							<span v-if = "copyingProfileID === profile.profileID"
								  class = "absolute inset-0 flex items-center justify-center">
								<Spinner class = "h-4 w-4 text-brand"></Spinner>
							</span>
						</button>

						<button v-if = "activeTab === 'owned'"
								type = "button"
								@click = "requestDeleteProfile( profile )"
								:disabled = "deletingProfileID === profile.profileID"
								class = "relative inline-flex h-8 w-8 items-center justify-center rounded-md text-black/60 transition-colors hover:bg-black/5 hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
								title = "Delete custom index profile"
								aria-label = "Delete custom index profile">
							<span class = "inline-flex h-4 w-4 items-center justify-center"
								  :class = "{ invisible: deletingProfileID === profile.profileID }">
								<i class = "fas fa-trash" aria-hidden = "true"></i>
							</span>
							<span v-if = "deletingProfileID === profile.profileID"
								  class = "absolute inset-0 flex items-center justify-center">
								<Spinner class = "h-4 w-4 text-brand"></Spinner>
							</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
	<CustomIndexProfileShareModal ref = "profileShareModal"
								  :data-type = "dataType"
								  @changed = "refreshProfiles"></CustomIndexProfileShareModal>
	<CalibrationProfileSaveModal ref = "profileEditModal"
								 :saving = "editingProfileSaving"
								 :reserved-names = "editingReservedProfileNames"
								 title = "Edit custom index profile"
								 description-text = "Rename the custom index profile or update the description shown to collaborators."
								 action-label = "Save changes"
								 @save = "saveProfileEdits"></CalibrationProfileSaveModal>
	<CustomIndexProfileDeleteModal ref = "profileDeleteModal"
								   :deleting = "deleteConfirmationDeleting"
								   @close = "clearDeleteConfirmationProfile"
								   @confirm = "confirmDeleteProfile"></CustomIndexProfileDeleteModal>
</div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue"
import { hyperspectra, projects as projectlib } from "@harkana/tools"

import Spinner from "../general/Spinner.vue"
import CalibrationProfileSaveModal from "../modals/CalibrationProfileSaveModal.vue"
import CustomIndexProfileDeleteModal from "../modals/CustomIndexProfileDeleteModal.vue"
import CustomIndexProfileShareModal from "../modals/CustomIndexProfileShareModal.vue"
import {
	CUSTOM_INDEX_PROFILE_KIND,
	formatCustomIndexDataType,
	isMissingCustomIndexApiError,
	normalizeCustomIndexFormulaModel,
	normalizeCustomIndexProfileListResponse
} from "../../composables/hyperspectrum/customIndex/formula.js"

const profileTabs = [
	{ id: "owned", label: "Owned" },
	{ id: "shared", label: "Shared with me" }
]

const dataType = String( import.meta.env.VITE_DATA_TYPE ?? "" ).trim().toLowerCase()

const activeTab = ref( "owned" )
const profilesLoading = ref( false )
const profilesSupported = ref( true )
const ownedProfiles = ref( [] )
const sharedProfiles = ref( [] )
const projectNames = ref( {} )
const profilesError = ref( "" )
const deletingProfileID = ref( "" )
const copyingProfileID = ref( "" )
const editingProfileLoadingID = ref( "" )
const editingProfileSaving = ref( false )
const editingProfile = ref( null )
const profileShareModal = ref( null )
const profileEditModal = ref( null )
const profileDeleteModal = ref( null )
const deleteConfirmationProfile = ref( null )

const allProfiles = computed(() => [ ...ownedProfiles.value, ...sharedProfiles.value ])
const activeProfiles = computed(() => activeTab.value === "shared" ? sharedProfiles.value : ownedProfiles.value )

const editingReservedProfileNames = computed(() => {
	const editingProfileID = String( editingProfile.value?.profileID ?? "" ).trim()
	return ownedProfiles.value
		.filter(( profile ) => String( profile?.profileID ?? "" ).trim() !== editingProfileID )
		.map(( profile ) => String( profile?.friendlyName ?? "" ).trim() )
		.filter(( friendlyName ) => friendlyName.length > 0 )
})

const deleteConfirmationDeleting = computed(() => {
	const profileID = String( deleteConfirmationProfile.value?.profileID ?? "" ).trim()
	return profileID.length > 0 && deletingProfileID.value === profileID
})

const buildProjectNameMap = ( projectMap = {} ) => {
	return Object.values( projectMap ?? {} ).reduce(( lookup, project ) => {
		const projectID = String( project?.id ?? "" ).trim()
		if( projectID.length === 0 ){
			return lookup
		}

		lookup[projectID] = String( project?.name ?? projectID ).trim() || projectID
		return lookup
	}, {})
}

const loadProjectNames = async () => {
	try{
		const listedProjects = await projectlib.list()
		projectNames.value = buildProjectNameMap( listedProjects )
	} catch( error ){
		projectNames.value = {}
		console.log( error )
	}
}

const refreshProfiles = async () => {
	profilesLoading.value = true
	profilesError.value = ""

	try{
		const ownedResponse = await hyperspectra.listCustomIndexProfiles({
			dataType,
			scope: "owned"
		})
		const nextOwnedProfiles = normalizeCustomIndexProfileListResponse( ownedResponse )
		let nextSharedProfiles = []

		try{
			const sharedResponse = await hyperspectra.listCustomIndexProfiles({
				dataType,
				scope: "shared"
			})
			nextSharedProfiles = normalizeCustomIndexProfileListResponse( sharedResponse )
				.map(( profile ) => ({ ...profile, shared: true }))
		} catch( error ){
			if( isMissingCustomIndexApiError( error ) === false ){
				console.log( error )
			}
		}

		ownedProfiles.value = nextOwnedProfiles
		sharedProfiles.value = nextSharedProfiles
		profilesSupported.value = true

		if( allProfiles.value.length > 0 ){
			await loadProjectNames()
		} else {
			projectNames.value = {}
		}
	} catch( error ){
		if( isMissingCustomIndexApiError( error ) ){
			profilesSupported.value = false
			ownedProfiles.value = []
			sharedProfiles.value = []
			projectNames.value = {}
			return
		}

		profilesError.value = String( error?.detail ?? error?.message ?? "Failed to load custom index profiles." ).trim()
		console.log( error )
	} finally {
		profilesLoading.value = false
	}
}

const normalizeProfileModel = ( profile = {} ) => {
	return normalizeCustomIndexFormulaModel( profile?.model ?? profile )
}

const buildProfileWritePayload = ( profile, metadata = {} ) => {
	const sourceProjectID = String( profile?.sourceProjectID ?? "" ).trim()
	const friendlyName = String( metadata?.friendlyName ?? profile?.friendlyName ?? "" ).trim()

	return {
		version: "custom-index-profile-write-v1",
		profileKind: CUSTOM_INDEX_PROFILE_KIND,
		dataType,
		friendlyName,
		description: String( metadata?.description ?? profile?.description ?? "" ).trim(),
		sourceProjectID,
		model: normalizeProfileModel( profile )
	}
}

const profileNameExists = ( friendlyName, excludedProfileID = "" ) => {
	const candidateName = String( friendlyName ?? "" ).trim()
	const normalizedExcludedProfileID = String( excludedProfileID ?? "" ).trim()
	if( candidateName.length === 0 ){
		return false
	}

	return ownedProfiles.value.some(( profile ) => {
		const profileID = String( profile?.profileID ?? "" ).trim()
		if( normalizedExcludedProfileID.length > 0 && profileID === normalizedExcludedProfileID ){
			return false
		}

		const ownedName = String( profile?.friendlyName ?? "" ).trim()
		return ownedName.length > 0 &&
			ownedName.localeCompare( candidateName, undefined, { sensitivity: "accent" } ) === 0
	})
}

const uniqueCopiedProfileName = ( friendlyName ) => {
	const sourceName = String( friendlyName ?? "" ).trim() || "Custom index profile"
	const baseName = `Copy of ${sourceName}`
	if( profileNameExists( baseName ) === false ){
		return baseName
	}

	for( let index = 2; index < 1000; index++ ){
		const candidateName = `${baseName} (${index})`
		if( profileNameExists( candidateName ) === false ){
			return candidateName
		}
	}

	return `${baseName} (${Date.now()})`
}

const resolveSourceProjectName = ( profile ) => {
	const sourceProjectID = String( profile?.sourceProjectID ?? "" ).trim()
	if( sourceProjectID.length === 0 ){
		return "Unknown project"
	}

	return projectNames.value[sourceProjectID] ?? sourceProjectID
}

const formatAssignedProjectCount = ( assignedProjectCount ) => {
	const count = Math.max( 0, Number( assignedProjectCount ?? 0 ) || 0 )
	return count === 1 ? "1 project" : `${count} projects`
}

const assignedProjectCountForProfile = ( profile = {} ) => {
	return Math.max( 0, Number( profile?.assignedProjectCount ?? profile?.usageCount ?? 0 ) || 0 )
}

const formatCollaboratorCount = ( collaboratorCount ) => {
	const count = Math.max( 0, Number( collaboratorCount ?? 0 ) || 0 )
	return count === 1 ? "1 collaborator" : `${count} collaborators`
}

const formatOperandSummary = ( profile ) => {
	const operandCount = normalizeProfileModel( profile ).operands.length
	return operandCount === 1 ? "1 operand" : `${operandCount} operands`
}

const formatProfileDescription = ( profile ) => String( profile?.description ?? "" ).trim()

const formatProfileExpression = ( profile ) => {
	const expression = String( normalizeProfileModel( profile ).expression ?? "" ).trim()
	return expression.length > 0 ? expression : "No formula"
}

const formatOwner = ( profile ) => {
	const displayName = String( profile?.ownerDisplayName ?? "" ).trim()
	const email = String( profile?.ownerEmail ?? "" ).trim()
	if( displayName.length > 0 && email.length > 0 ){
		return `${displayName} - ${email}`
	}
	return displayName || email || "Unknown owner"
}

const openProfileShareModal = ( profile ) => {
	profileShareModal.value?.open?.( profile )
}

const openProfileEditModal = async ( profile ) => {
	const profileID = String( profile?.profileID ?? "" ).trim()
	if(
		profileID.length === 0 ||
		activeTab.value !== "owned" ||
		editingProfileLoadingID.value.length > 0 ||
		editingProfileSaving.value ||
		copyingProfileID.value.length > 0 ||
		deletingProfileID.value.length > 0
	){
		return
	}

	editingProfileLoadingID.value = profileID
	profilesError.value = ""

	try{
		const fullProfile = await hyperspectra.getCustomIndexProfile( profileID, dataType )
		editingProfile.value = {
			...profile,
			...fullProfile,
			sourceProjectID: String( fullProfile?.sourceProjectID ?? profile?.sourceProjectID ?? "" ).trim()
		}
		await profileEditModal.value?.open?.({
			name: String( editingProfile.value?.friendlyName ?? "" ).trim(),
			description: String( editingProfile.value?.description ?? "" ).trim()
		})
	} catch( error ){
		if( isMissingCustomIndexApiError( error ) ){
			profilesSupported.value = false
			ownedProfiles.value = []
			sharedProfiles.value = []
			projectNames.value = {}
			return
		}

		profilesError.value = String( error?.detail ?? error?.message ?? "Failed to load custom index profile." ).trim()
		console.log( error )
	} finally {
		editingProfileLoadingID.value = ""
	}
}

const saveProfileEdits = async ( metadata = {} ) => {
	const profile = editingProfile.value
	const profileID = String( profile?.profileID ?? "" ).trim()
	const friendlyName = String( metadata?.friendlyName ?? "" ).trim()
	const description = String( metadata?.description ?? "" ).trim()
	if(
		profileID.length === 0 ||
		friendlyName.length === 0 ||
		editingProfileSaving.value ||
		profileNameExists( friendlyName, profileID )
	){
		return
	}

	editingProfileSaving.value = true
	profilesError.value = ""

	try{
		await hyperspectra.updateCustomIndexProfile(
			profileID,
			buildProfileWritePayload( profile, { friendlyName, description }),
			dataType
		)
		profileEditModal.value?.close?.()
		editingProfile.value = null
		await refreshProfiles()
	} catch( error ){
		if( isMissingCustomIndexApiError( error ) ){
			profilesSupported.value = false
			ownedProfiles.value = []
			sharedProfiles.value = []
			projectNames.value = {}
			return
		}

		profilesError.value = String( error?.detail ?? error?.message ?? "Failed to update custom index profile." ).trim()
		console.log( error )
	} finally {
		editingProfileSaving.value = false
	}
}

const copyProfileToOwnedProfiles = async ( profile ) => {
	const profileID = String( profile?.profileID ?? "" ).trim()
	if( profileID.length === 0 || copyingProfileID.value.length > 0 || deletingProfileID.value.length > 0 ){
		return
	}

	copyingProfileID.value = profileID
	profilesError.value = ""

	try{
		const fullProfile = await hyperspectra.getCustomIndexProfile( profileID, dataType )
		await hyperspectra.createCustomIndexProfile(
			buildProfileWritePayload({
				...profile,
				...fullProfile,
				friendlyName: uniqueCopiedProfileName( profile?.friendlyName ),
				sourceProjectID: String( fullProfile?.sourceProjectID ?? profile?.sourceProjectID ?? "" ).trim()
			}),
			dataType
		)
		activeTab.value = "owned"
		await refreshProfiles()
	} catch( error ){
		if( isMissingCustomIndexApiError( error ) ){
			profilesSupported.value = false
			ownedProfiles.value = []
			sharedProfiles.value = []
			projectNames.value = {}
			return
		}

		profilesError.value = String( error?.detail ?? error?.message ?? "Failed to copy custom index profile." ).trim()
		console.log( error )
	} finally {
		copyingProfileID.value = ""
	}
}

const requestDeleteProfile = async ( profile ) => {
	const profileID = String( profile?.profileID ?? "" ).trim()
	if( profileID.length === 0 ){
		return
	}

	if( assignedProjectCountForProfile( profile ) > 0 ){
		deleteConfirmationProfile.value = profile
		await profileDeleteModal.value?.open?.( profile )
		return
	}

	await deleteProfileByID( profileID )
}

const confirmDeleteProfile = async () => {
	const profileID = String( deleteConfirmationProfile.value?.profileID ?? "" ).trim()
	const deleted = await deleteProfileByID( profileID )
	if( deleted ){
		profileDeleteModal.value?.close?.()
		deleteConfirmationProfile.value = null
	}
}

const clearDeleteConfirmationProfile = () => {
	if( deleteConfirmationDeleting.value ){
		return
	}

	deleteConfirmationProfile.value = null
}

const deleteProfileByID = async ( profileID ) => {
	const normalizedProfileID = String( profileID ?? "" ).trim()
	if( normalizedProfileID.length === 0 || deletingProfileID.value.length > 0 ){
		return false
	}

	deletingProfileID.value = normalizedProfileID
	profilesError.value = ""

	try{
		await hyperspectra.deleteCustomIndexProfile( normalizedProfileID, dataType )
		await refreshProfiles()
		return true
	} catch( error ){
		if( isMissingCustomIndexApiError( error ) ){
			profilesSupported.value = false
			ownedProfiles.value = []
			sharedProfiles.value = []
			projectNames.value = {}
			return false
		}

		profilesError.value = String( error?.detail ?? error?.message ?? "Failed to delete custom index profile." ).trim()
		console.log( error )
		return false
	} finally {
		deletingProfileID.value = ""
	}
}

onMounted(() => {
	void refreshProfiles()
})
</script>
