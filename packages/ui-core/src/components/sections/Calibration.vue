<template>
<div class = "prose prose-gray max-w-none">
	<div class = "not-prose max-w-3xl space-y-8">
		<div class = "space-y-3">
			<h3 class = "m-0 text-lg font-bold text-black">Calibration settings</h3>
			<p class = "m-0 text-sm text-black/70">
				Manage reusable axis calibration profiles. Owned profiles can be shared with collaborators;
				shared profiles can be used but not edited.
			</p>
		</div>

		<div v-if = "calibrationProfilesSupported === false"
			 class = "rounded-lg border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-black/70">
			Calibration profile management is not available in this environment yet.
		</div>

		<div v-else class = "space-y-4">
			<div class = "flex flex-wrap items-center justify-between gap-3">
				<div class = "text-xs font-semibold uppercase tracking-wide text-black/70">
					Saved profiles
				</div>

				<button type = "button"
						@click = "refreshCalibrationProfiles"
						:disabled = "calibrationProfilesLoading"
						class = "relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-black/10 text-black/70 transition-colors hover:border-brand hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-70"
						title = "Refresh calibration profiles"
						aria-label = "Refresh calibration profiles">
					<span class = "inline-flex h-4 w-4 items-center justify-center"
						  :class = "{ invisible: calibrationProfilesLoading }">
						<i class = "fas fa-sync-alt" aria-hidden = "true"></i>
					</span>
					<span v-if = "calibrationProfilesLoading"
						  class = "absolute inset-0 flex items-center justify-center">
						<Spinner class = "h-4 w-4 text-brand"></Spinner>
					</span>
				</button>
			</div>

			<div class = "inline-flex max-w-full flex-wrap gap-2 rounded-lg border border-black/10 bg-black/[0.03] p-2"
				 role = "tablist"
				 aria-label = "Calibration profile scopes">
				<button v-for = "tab in calibrationProfileTabs"
						:key = "tab.id"
						type = "button"
						role = "tab"
						:aria-selected = "activeCalibrationProfileTab === tab.id ? 'true' : 'false'"
						@click = "activeCalibrationProfileTab = tab.id"
						class = "inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
						:class = "activeCalibrationProfileTab === tab.id
							? 'bg-brand text-white'
							: 'bg-transparent text-black/70 hover:bg-black/5 hover:text-black'">
					{{ tab.label }}
				</button>
			</div>

			<p v-if = "calibrationProfilesError.length > 0"
			   class = "text-sm text-red-600">
				{{ calibrationProfilesError }}
			</p>

			<div v-if = "calibrationProfilesLoading && activeCalibrationProfiles.length === 0"
				 class = "rounded-lg border border-black/10 bg-black/[0.03] px-4 py-6 text-sm text-black/60">
				Loading calibration profiles...
			</div>

			<div v-else-if = "activeCalibrationProfiles.length === 0"
				 class = "rounded-lg border border-black/10 bg-black/[0.03] px-4 py-6 text-sm text-black/60">
				{{ activeCalibrationProfileTab === 'owned' ? 'No owned calibration profiles.' : 'No calibration profiles shared with you.' }}
			</div>

			<div v-else class = "space-y-2">
				<div v-for = "profile in activeCalibrationProfiles"
					 :key = "profile.profileID"
					 class = "flex items-start justify-between gap-4 rounded-lg border border-black/10 bg-black/[0.03] px-4 py-3">
					<div class = "min-w-0 space-y-1">
						<div class = "flex flex-wrap items-center gap-2">
							<div class = "min-w-0 truncate text-sm font-semibold text-slate-900">
								{{ profile.friendlyName }}
							</div>
							<span class = "rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-semibold text-black/55">
								{{ formatCalibrationDataType( profile.dataType ) }}
							</span>
							<span class = "rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-semibold text-black/55">
								{{ formatCalibrationAxisRole( profile.axisRole ) }}
							</span>
							<span v-if = "profile.shared === true"
								  class = "rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
								Shared
							</span>
						</div>
						<div v-if = "formatCalibrationDescription( profile ).length > 0"
							 class = "line-clamp-2 whitespace-pre-wrap text-xs leading-relaxed text-black/60">
							{{ formatCalibrationDescription( profile ) }}
						</div>
						<div class = "text-xs text-black/60">
							Created from: {{ resolveCalibrationSourceProjectName( profile ) }}
						</div>
						<div class = "text-xs text-black/60">
							{{ formatCalibrationPointSummary( profile ) }} • Used by: {{ formatCalibrationAssignedProjectCount( profile.assignedProjectCount ) }}
						</div>
						<div v-if = "activeCalibrationProfileTab === 'owned'"
							 class = "text-xs text-black/60">
							Collaborators: {{ formatCalibrationCollaboratorCount( profile.collaboratorCount ) }}
						</div>
						<div v-else class = "text-xs text-black/60">
							Owner: {{ formatCalibrationOwner( profile ) }}
						</div>
					</div>

					<div class = "flex shrink-0 items-center gap-1">
						<button v-if = "activeCalibrationProfileTab === 'owned'"
								type = "button"
								@click = "openCalibrationProfileEditModal( profile )"
								:disabled = "editingCalibrationProfileLoadingID.length > 0 || editingCalibrationProfileSaving || copyingCalibrationProfileID.length > 0 || deletingCalibrationProfileID.length > 0"
								class = "relative inline-flex h-8 w-8 items-center justify-center rounded-md text-black/60 transition-colors hover:bg-black/5 hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
								title = "Edit calibration profile details"
								aria-label = "Edit calibration profile details">
							<span class = "inline-flex h-4 w-4 items-center justify-center"
								  :class = "{ invisible: editingCalibrationProfileLoadingID === profile.profileID }">
								<i class = "fas fa-pen" aria-hidden = "true"></i>
							</span>
							<span v-if = "editingCalibrationProfileLoadingID === profile.profileID"
								  class = "absolute inset-0 flex items-center justify-center">
								<Spinner class = "h-4 w-4 text-brand"></Spinner>
							</span>
						</button>

						<button v-if = "activeCalibrationProfileTab === 'owned'"
								type = "button"
								@click = "openCalibrationProfileShareModal( profile )"
								class = "inline-flex h-8 w-8 items-center justify-center rounded-md text-black/60 transition-colors hover:bg-black/5 hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand"
								title = "Share calibration profile"
								aria-label = "Share calibration profile">
							<i class = "fas fa-share-alt" aria-hidden = "true"></i>
						</button>

						<button type = "button"
								@click = "copyCalibrationProfileToOwnedProfiles( profile )"
								:disabled = "copyingCalibrationProfileID.length > 0 || deletingCalibrationProfileID.length > 0"
								class = "relative inline-flex h-8 w-8 items-center justify-center rounded-md text-black/60 transition-colors hover:bg-black/5 hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
								:title = "activeCalibrationProfileTab === 'owned' ? 'Duplicate calibration profile' : 'Copy calibration profile to owned profiles'"
								:aria-label = "activeCalibrationProfileTab === 'owned' ? 'Duplicate calibration profile' : 'Copy calibration profile to owned profiles'">
							<span class = "inline-flex h-4 w-4 items-center justify-center"
								  :class = "{ invisible: copyingCalibrationProfileID === profile.profileID }">
								<i class = "fas fa-clone" aria-hidden = "true"></i>
							</span>
							<span v-if = "copyingCalibrationProfileID === profile.profileID"
								  class = "absolute inset-0 flex items-center justify-center">
								<Spinner class = "h-4 w-4 text-brand"></Spinner>
							</span>
						</button>

						<button v-if = "activeCalibrationProfileTab === 'owned'"
								type = "button"
								@click = "deleteCalibrationProfile( profile.profileID )"
								:disabled = "deletingCalibrationProfileID === profile.profileID"
								class = "relative inline-flex h-8 w-8 items-center justify-center rounded-md text-black/60 transition-colors hover:bg-black/5 hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
								title = "Delete calibration profile"
								aria-label = "Delete calibration profile">
							<span class = "inline-flex h-4 w-4 items-center justify-center"
								  :class = "{ invisible: deletingCalibrationProfileID === profile.profileID }">
								<i class = "fas fa-trash" aria-hidden = "true"></i>
							</span>
							<span v-if = "deletingCalibrationProfileID === profile.profileID"
								  class = "absolute inset-0 flex items-center justify-center">
								<Spinner class = "h-4 w-4 text-brand"></Spinner>
							</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
	<CalibrationProfileShareModal ref = "calibrationProfileShareModal"
								  :data-type = "dataType"
								  :axis-role = "calibrationAxisRole"
								  @changed = "refreshCalibrationProfiles"></CalibrationProfileShareModal>
	<CalibrationProfileSaveModal ref = "calibrationProfileEditModal"
								 :saving = "editingCalibrationProfileSaving"
								 :reserved-names = "editingReservedCalibrationProfileNames"
								 title = "Edit calibration profile"
								 description-text = "Rename the calibration profile or update the description shown to collaborators."
								 action-label = "Save changes"
								 @save = "saveCalibrationProfileEdits"></CalibrationProfileSaveModal>
</div>
</template>

<script setup>
import { computed, ref, onMounted } from "vue"
import { data as datalib, projects as projectlib } from "@harkana/tools"

import Spinner from "../general/Spinner.vue"
import CalibrationProfileSaveModal from "../modals/CalibrationProfileSaveModal.vue"
import CalibrationProfileShareModal from "../modals/CalibrationProfileShareModal.vue"

const calibrationProfileTabs = [
	{ id: "owned", label: "Owned" },
	{ id: "shared", label: "Shared with me" }
]

const dataType = String( import.meta.env.VITE_DATA_TYPE ?? "" ).trim().toLowerCase()
const calibrationAxisRole = [ "hypercars", "hyperraman" ].includes( dataType )
	? "hyperspectral-spectral"
	: "spectrum-x"

const activeCalibrationProfileTab = ref( "owned" )
const calibrationProfilesLoading = ref( false )
const calibrationProfilesSupported = ref( true )
const calibrationProfiles = ref( [] )
const ownedCalibrationProfiles = ref( [] )
const sharedCalibrationProfiles = ref( [] )
const calibrationProjectNames = ref( {} )
const calibrationProfilesError = ref( "" )
const deletingCalibrationProfileID = ref( "" )
const copyingCalibrationProfileID = ref( "" )
const editingCalibrationProfileLoadingID = ref( "" )
const editingCalibrationProfileSaving = ref( false )
const editingCalibrationProfile = ref( null )
const calibrationProfileShareModal = ref( null )
const calibrationProfileEditModal = ref( null )

const activeCalibrationProfiles = computed(() => {
	return activeCalibrationProfileTab.value === "shared"
		? sharedCalibrationProfiles.value
		: ownedCalibrationProfiles.value
})

const calibrationAxisRoleLabel = computed(() => formatCalibrationAxisRole( calibrationAxisRole ))

const editingReservedCalibrationProfileNames = computed(() => {
	const editingProfileID = String( editingCalibrationProfile.value?.profileID ?? "" ).trim()
	return ownedCalibrationProfiles.value
		.filter(( profile ) => String( profile?.profileID ?? "" ).trim() !== editingProfileID )
		.map(( profile ) => String( profile?.friendlyName ?? "" ).trim() )
		.filter(( friendlyName ) => friendlyName.length > 0 )
})

const isMissingCalibrationProfileApiError = ( error ) => {
	const status = Number( error?.status )
	return status === 404 || status === 501
}

const buildCalibrationProjectNameMap = ( projectMap = {} ) => {
	return Object.values( projectMap ?? {} ).reduce(( lookup, project ) => {
		const projectID = String( project?.id ?? "" ).trim()
		if( projectID.length === 0 ){
			return lookup
		}

		lookup[ projectID ] = String( project?.name ?? projectID ).trim() || projectID
		return lookup
	}, {})
}

const loadCalibrationProjectNames = async () => {
	try{
		const listedProjects = await projectlib.list()
		calibrationProjectNames.value = buildCalibrationProjectNameMap( listedProjects )
	} catch( error ){
		calibrationProjectNames.value = {}
		console.log( error )
	}
}

const refreshCalibrationProfiles = async () => {
	calibrationProfilesLoading.value = true
	calibrationProfilesError.value = ""

	try{
		const ownedResponse = await datalib.listCalibrationProfiles({
			dataType,
			axisRole: calibrationAxisRole,
			scope: "owned"
		})
		const ownedProfiles = Array.isArray( ownedResponse?.items ) ? ownedResponse.items : []
		let sharedProfiles = []

		try{
			const sharedResponse = await datalib.listCalibrationProfiles({
				dataType,
				axisRole: calibrationAxisRole,
				scope: "shared"
			})
			sharedProfiles = Array.isArray( sharedResponse?.items )
				? sharedResponse.items.map(( profile ) => ({ ...profile, shared: true }))
				: []
		} catch( error ){
			if( isMissingCalibrationProfileApiError( error ) === false ){
				console.log( error )
			}
		}

		ownedCalibrationProfiles.value = ownedProfiles
		sharedCalibrationProfiles.value = sharedProfiles
		calibrationProfiles.value = [ ...ownedProfiles, ...sharedProfiles ]
		calibrationProfilesSupported.value = true

		if( calibrationProfiles.value.length > 0 ){
			await loadCalibrationProjectNames()
		} else {
			calibrationProjectNames.value = {}
		}
	} catch( error ){
		if( isMissingCalibrationProfileApiError( error ) ){
			calibrationProfilesSupported.value = false
			calibrationProfiles.value = []
			ownedCalibrationProfiles.value = []
			sharedCalibrationProfiles.value = []
			calibrationProjectNames.value = {}
			return
		}

		calibrationProfilesError.value = String( error?.detail ?? error?.message ?? "Failed to load calibration profiles." ).trim()
		console.log( error )
	} finally {
		calibrationProfilesLoading.value = false
	}
}

const resolveCalibrationSourceProjectName = ( profile ) => {
	const sourceProjectID = String( profile?.sourceProjectID ?? "" ).trim()
	if( sourceProjectID.length === 0 ){
		return "Unknown project"
	}

	return calibrationProjectNames.value[ sourceProjectID ] ?? sourceProjectID
}

const formatCalibrationAssignedProjectCount = ( assignedProjectCount ) => {
	const count = Math.max( 0, Number( assignedProjectCount ?? 0 ) || 0 )
	return count === 1 ? "1 project" : `${count} projects`
}

const formatCalibrationCollaboratorCount = ( collaboratorCount ) => {
	const count = Math.max( 0, Number( collaboratorCount ?? 0 ) || 0 )
	return count === 1 ? "1 collaborator" : `${count} collaborators`
}

const formatCalibrationPointSummary = ( profile ) => {
	const count = Math.max( 0, Number( profile?.pointCount ?? profile?.points?.length ?? 0 ) || 0 )
	return count === 1 ? "1 point" : `${count} points`
}

const formatCalibrationDataType = ( value ) => {
	const normalized = String( value ?? "" ).trim().toLowerCase()
	if( normalized === "cars" ) return "CARS"
	if( normalized === "raman" ) return "Raman"
	if( normalized === "hypercars" ) return "HyperCARS"
	if( normalized === "hyperraman" ) return "HyperRaman"
	return normalized.length > 0 ? normalized : "Unknown data type"
}

function formatCalibrationAxisRole( value ){
	const normalized = String( value ?? "" ).trim()
	if( normalized === "hyperspectral-spectral" ){
		return "Hyperspectral spectral axis"
	}
	return "Spectrum x-axis"
}

const formatCalibrationDescription = ( profile ) => {
	return String( profile?.description ?? "" ).trim()
}

const formatCalibrationOwner = ( profile ) => {
	const displayName = String( profile?.ownerDisplayName ?? "" ).trim()
	const email = String( profile?.ownerEmail ?? "" ).trim()
	if( displayName.length > 0 && email.length > 0 ){
		return `${displayName} - ${email}`
	}
	return displayName || email || "Unknown owner"
}

const ownedCalibrationProfileNameExists = ( friendlyName, excludedProfileID = "" ) => {
	const candidateName = String( friendlyName ?? "" ).trim()
	const normalizedExcludedProfileID = String( excludedProfileID ?? "" ).trim()
	if( candidateName.length === 0 ){
		return false
	}

	return ownedCalibrationProfiles.value.some(( profile ) => {
		const profileID = String( profile?.profileID ?? "" ).trim()
		if( normalizedExcludedProfileID.length > 0 && profileID === normalizedExcludedProfileID ){
			return false
		}

		const ownedName = String( profile?.friendlyName ?? "" ).trim()
		return ownedName.length > 0 &&
			ownedName.localeCompare( candidateName, undefined, { sensitivity: "accent" } ) === 0
	})
}

const uniqueCopiedCalibrationProfileName = ( friendlyName ) => {
	const sourceName = String( friendlyName ?? "" ).trim() || "Calibration profile"
	const baseName = `Copy of ${sourceName}`
	if( ownedCalibrationProfileNameExists( baseName ) === false ){
		return baseName
	}

	for( let index = 2; index < 1000; index++ ){
		const candidateName = `${baseName} (${index})`
		if( ownedCalibrationProfileNameExists( candidateName ) === false ){
			return candidateName
		}
	}

	return `${baseName} (${Date.now()})`
}

const normalizeCalibrationProfileModel = ( profile = {} ) => {
	const candidateModel = profile?.model?.type === "polynomial"
		? profile.model
		: profile
	const polynomialOrder = Math.max( 0, Math.trunc( Number( candidateModel?.polynomialOrder ?? 0 ) ) )
	const includedOrders = Array.isArray( candidateModel?.includedOrders )
		? candidateModel.includedOrders
			.map(( order ) => Math.trunc( Number( order ) ) )
			.filter(( order ) => Number.isInteger( order ) && order >= 0 && order <= polynomialOrder )
		: []
	const normalizedIncludedOrders = Array.from( new Set([
		...includedOrders,
		polynomialOrder
	])).sort(( left, right ) => left - right )
	const points = Array.isArray( candidateModel?.points )
		? candidateModel.points.map(( point, index ) => ({
			id: String( point?.id ?? `calibration-point-${index + 1}` ),
			sourceX: Number( point?.sourceX ?? 0 ),
			targetX: Number( point?.targetX ?? 0 )
		})).filter(( point ) => Number.isFinite( point.sourceX ) && Number.isFinite( point.targetX ))
		: []

	return {
		type: "polynomial",
		polynomialOrder,
		includedOrders: normalizedIncludedOrders,
		points
	}
}

const buildCalibrationProfileWritePayload = ( profile, metadata = {} ) => {
	const model = normalizeCalibrationProfileModel( profile )
	const friendlyName = String( metadata?.friendlyName ?? profile?.friendlyName ?? "" ).trim()
	const sourceProjectID = String( profile?.sourceProjectID ?? "" ).trim()

	return {
		version: "calibration-profile-write-v2",
		profileKind: "axis-calibration",
		axisRole: calibrationAxisRole,
		sourceProjectID,
		dataType,
		friendlyName,
		description: String( metadata?.description ?? profile?.description ?? "" ).trim(),
		polynomialOrder: model.polynomialOrder,
		includedOrders: model.includedOrders,
		points: model.points,
		model
	}
}

const buildCalibrationProfileCopyPayload = ( profile ) => {
	return buildCalibrationProfileWritePayload( profile, {
		friendlyName: uniqueCopiedCalibrationProfileName( profile?.friendlyName ),
		description: String( profile?.description ?? "" ).trim()
	})
}

const openCalibrationProfileShareModal = ( profile ) => {
	calibrationProfileShareModal.value?.open?.( profile )
}

const openCalibrationProfileEditModal = async ( profile ) => {
	const profileID = String( profile?.profileID ?? "" ).trim()
	if(
		profileID.length === 0 ||
		activeCalibrationProfileTab.value !== "owned" ||
		editingCalibrationProfileLoadingID.value.length > 0 ||
		editingCalibrationProfileSaving.value ||
		copyingCalibrationProfileID.value.length > 0 ||
		deletingCalibrationProfileID.value.length > 0
	){
		return
	}

	editingCalibrationProfileLoadingID.value = profileID
	calibrationProfilesError.value = ""

	try{
		const fullProfile = await datalib.getCalibrationProfile( profileID, dataType, calibrationAxisRole )
		editingCalibrationProfile.value = {
			...profile,
			...fullProfile,
			sourceProjectID: String( fullProfile?.sourceProjectID ?? profile?.sourceProjectID ?? "" ).trim()
		}
		await calibrationProfileEditModal.value?.open?.({
			name: String( editingCalibrationProfile.value?.friendlyName ?? "" ).trim(),
			description: String( editingCalibrationProfile.value?.description ?? "" ).trim()
		})
	} catch( error ){
		if( isMissingCalibrationProfileApiError( error ) ){
			calibrationProfilesSupported.value = false
			calibrationProfiles.value = []
			ownedCalibrationProfiles.value = []
			sharedCalibrationProfiles.value = []
			calibrationProjectNames.value = {}
			return
		}

		calibrationProfilesError.value = String( error?.detail ?? error?.message ?? "Failed to load calibration profile." ).trim()
		console.log( error )
	} finally {
		editingCalibrationProfileLoadingID.value = ""
	}
}

const saveCalibrationProfileEdits = async ( metadata = {} ) => {
	const profile = editingCalibrationProfile.value
	const profileID = String( profile?.profileID ?? "" ).trim()
	const friendlyName = String( metadata?.friendlyName ?? "" ).trim()
	const description = String( metadata?.description ?? "" ).trim()
	if(
		profileID.length === 0 ||
		friendlyName.length === 0 ||
		editingCalibrationProfileSaving.value ||
		ownedCalibrationProfileNameExists( friendlyName, profileID )
	){
		return
	}

	editingCalibrationProfileSaving.value = true
	calibrationProfilesError.value = ""

	try{
		await datalib.updateCalibrationProfile(
			profileID,
			buildCalibrationProfileWritePayload( profile, { friendlyName, description }),
			dataType,
			calibrationAxisRole
		)
		calibrationProfileEditModal.value?.close?.()
		editingCalibrationProfile.value = null
		await refreshCalibrationProfiles()
	} catch( error ){
		if( isMissingCalibrationProfileApiError( error ) ){
			calibrationProfilesSupported.value = false
			calibrationProfiles.value = []
			ownedCalibrationProfiles.value = []
			sharedCalibrationProfiles.value = []
			calibrationProjectNames.value = {}
			return
		}

		calibrationProfilesError.value = String( error?.detail ?? error?.message ?? "Failed to update calibration profile." ).trim()
		console.log( error )
	} finally {
		editingCalibrationProfileSaving.value = false
	}
}

const copyCalibrationProfileToOwnedProfiles = async ( profile ) => {
	const profileID = String( profile?.profileID ?? "" ).trim()
	if( profileID.length === 0 || copyingCalibrationProfileID.value.length > 0 || deletingCalibrationProfileID.value.length > 0 ){
		return
	}

	copyingCalibrationProfileID.value = profileID
	calibrationProfilesError.value = ""

	try{
		const fullProfile = await datalib.getCalibrationProfile( profileID, dataType, calibrationAxisRole )
		await datalib.createCalibrationProfile(
			buildCalibrationProfileCopyPayload({
				...profile,
				...fullProfile,
				sourceProjectID: String( fullProfile?.sourceProjectID ?? profile?.sourceProjectID ?? "" ).trim()
			}),
			dataType,
			calibrationAxisRole
		)
		activeCalibrationProfileTab.value = "owned"
		await refreshCalibrationProfiles()
	} catch( error ){
		if( isMissingCalibrationProfileApiError( error ) ){
			calibrationProfilesSupported.value = false
			calibrationProfiles.value = []
			ownedCalibrationProfiles.value = []
			sharedCalibrationProfiles.value = []
			calibrationProjectNames.value = {}
			return
		}

		calibrationProfilesError.value = String( error?.detail ?? error?.message ?? "Failed to copy calibration profile." ).trim()
		console.log( error )
	} finally {
		copyingCalibrationProfileID.value = ""
	}
}

const deleteCalibrationProfile = async ( profileID ) => {
	const normalizedProfileID = String( profileID ?? "" ).trim()
	if( normalizedProfileID.length === 0 || deletingCalibrationProfileID.value.length > 0 ){
		return
	}

	deletingCalibrationProfileID.value = normalizedProfileID
	calibrationProfilesError.value = ""

	try{
		await datalib.deleteCalibrationProfile( normalizedProfileID, dataType, calibrationAxisRole )
		await refreshCalibrationProfiles()
	} catch( error ){
		if( isMissingCalibrationProfileApiError( error ) ){
			calibrationProfilesSupported.value = false
			calibrationProfiles.value = []
			ownedCalibrationProfiles.value = []
			sharedCalibrationProfiles.value = []
			calibrationProjectNames.value = {}
			return
		}

		calibrationProfilesError.value = String( error?.detail ?? error?.message ?? "Failed to delete calibration profile." ).trim()
		console.log( error )
	} finally {
		deletingCalibrationProfileID.value = ""
	}
}

onMounted(() => {
	void refreshCalibrationProfiles()
})
</script>
