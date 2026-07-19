<template>
<Modal ref = "modal"
	   title = "Custom index profile sharing"
	   :show-close = "sharing === false"
	   panel-class = "w-full max-w-2xl">
	<template #main>
		<div v-if = "loading"
			 class = "flex min-h-[10rem] items-center justify-center">
			<Spinner class = "h-8 w-8 text-brand"></Spinner>
		</div>

		<div v-else class = "space-y-4">
			<p class = "text-sm leading-relaxed text-white/85">
				Share <strong>{{ activeProfileName }}</strong> with collaborators. Shared users can use the profile but cannot edit or reshare it.
			</p>

			<div v-if = "collaborators.length > 0"
				 class = "space-y-2">
				<div class = "text-xs font-semibold uppercase tracking-wide text-white/70">
					Collaborators
				</div>
				<div v-for = "collaborator in collaborators"
					 :key = "collaboratorKey( collaborator )"
					 class = "flex items-center justify-between gap-3 rounded-md bg-gray-700 px-3 py-2 text-sm text-white">
					<span class = "min-w-0 flex-1 truncate">
						{{ collaboratorLabel( collaborator ) }}
					</span>
					<button type = "button"
							@click = "removeCollaborator( collaborator )"
							:disabled = "sharing"
							class = "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/70 transition hover:bg-white/10 hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-40">
						<span class = "sr-only">Remove collaborator</span>
						<i class = "fas fa-trash" aria-hidden = "true"></i>
					</button>
				</div>
			</div>

			<div v-else class = "rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/65">
				This profile is not shared with any collaborators yet.
			</div>

			<div class = "space-y-2">
				<label for = "custom-index-profile-share-email"
					   class = "block text-xs font-semibold uppercase tracking-wide text-white/70">
					Add collaborator
				</label>
				<input id = "custom-index-profile-share-email"
					   v-model = "email"
					   type = "email"
					   placeholder = "Collaborator email address"
					   class = "w-full rounded-md border border-white/10 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/60"
					   @keydown.enter.prevent = "addCollaborator"/>
			</div>

			<p v-if = "errorMessage.length > 0"
			   class = "text-sm text-red-300">
				{{ errorMessage }}
			</p>
		</div>
	</template>

	<template #footer>
		<hr class = "h-0.5 mt-4 bg-gray border-0">
		<ModalButton @click = "addCollaborator"
					 :loading = "sharing"
					 :disabled = "canShare === false">
			Share
		</ModalButton>
	</template>
</Modal>
</template>

<script setup>
import { computed, ref } from "vue"
import { Amplify } from "aws-amplify"
import { hyperspectra } from "@harkana/tools"

import Modal from "./Modal.vue"
import ModalButton from "./ModalButton.vue"
import Spinner from "../general/Spinner.vue"

const Auth = Amplify.Auth

const props = defineProps({
	dataType: { type: String, default: "" }
})

const emit = defineEmits([ "changed" ])

const modal = ref(null)
const profile = ref(null)
const collaborators = ref([])
const email = ref("")
const loading = ref(false)
const sharing = ref(false)
const errorMessage = ref("")

const activeProfileID = computed(() => String( profile.value?.profileID ?? "" ).trim())
const activeProfileName = computed(() => {
	const friendlyName = String( profile.value?.friendlyName ?? "" ).trim()
	return friendlyName.length > 0 ? friendlyName : activeProfileID.value
})

const canShare = computed(() => {
	return sharing.value === false &&
		loading.value === false &&
		activeProfileID.value.length > 0 &&
		String( email.value ?? "" ).trim().length > 0
})

const collaboratorKey = ( collaborator ) => {
	return String( collaborator?.sub ?? collaborator?.email ?? "" ).trim()
}

const collaboratorLabel = ( collaborator ) => {
	const firstName = String( collaborator?.given_name ?? collaborator?.givenName ?? "" ).trim()
	const familyName = String( collaborator?.family_name ?? collaborator?.familyName ?? "" ).trim()
	const emailAddress = String( collaborator?.email ?? "" ).trim()
	const name = [ firstName, familyName ].filter(( part ) => part.length > 0 ).join( " " )
	return name.length > 0 && emailAddress.length > 0 ? `${name} - ${emailAddress}` : ( emailAddress || name || "Collaborator" )
}

const refreshCollaborators = async () => {
	if( activeProfileID.value.length === 0 ){
		collaborators.value = []
		return
	}

	const response = await hyperspectra.listCustomIndexProfileCollaborators(
		activeProfileID.value,
		props.dataType
	)
	collaborators.value = Array.isArray( response )
		? response
		: ( Array.isArray( response?.items ) ? response.items : [] )
}

const open = async ( nextProfile ) => {
	profile.value = nextProfile ?? null
	email.value = ""
	errorMessage.value = ""
	loading.value = true
	await modal.value?.open()

	try{
		await refreshCollaborators()
	} catch( error ){
		errorMessage.value = String( error?.detail ?? error?.message ?? "Failed to load collaborators." ).trim()
		console.log( error )
	} finally {
		loading.value = false
	}
}

const close = () => {
	modal.value?.close()
}

const addCollaborator = async () => {
	if( canShare.value === false ){
		return
	}

	try{
		errorMessage.value = ""
		sharing.value = true
		const normalizedEmail = String( email.value ?? "" ).trim()
		const currentEmail = String( Auth?.user?.attributes?.email ?? "" ).trim()
		if( currentEmail.length > 0 && currentEmail.toLowerCase() === normalizedEmail.toLowerCase() ){
			throw new Error( "Cannot share the profile with yourself." )
		}

		await hyperspectra.addCustomIndexProfileCollaborator(
			activeProfileID.value,
			normalizedEmail,
			props.dataType
		)
		email.value = ""
		await refreshCollaborators()
		emit( "changed" )
	} catch( error ){
		errorMessage.value = String( error?.detail ?? error?.message ?? "Failed to share custom index profile." ).trim()
		console.log( error )
	} finally {
		sharing.value = false
	}
}

const removeCollaborator = async ( collaborator ) => {
	const collaboratorID = String( collaborator?.sub ?? "" ).trim()
	if( collaboratorID.length === 0 || activeProfileID.value.length === 0 ){
		return
	}

	try{
		errorMessage.value = ""
		sharing.value = true
		await hyperspectra.removeCustomIndexProfileCollaborator(
			activeProfileID.value,
			collaboratorID,
			props.dataType
		)
		await refreshCollaborators()
		emit( "changed" )
	} catch( error ){
		errorMessage.value = String( error?.detail ?? error?.message ?? "Failed to remove collaborator." ).trim()
		console.log( error )
	} finally {
		sharing.value = false
	}
}

defineExpose({ open, close })
</script>
