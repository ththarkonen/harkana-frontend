<template>
<div class = "prose prose-gray max-w-none">
    <div class = "border-2 border-brand rounded-lg p-4 mb-8 shadow-black shadow-lg">
        <p>
            <strong>Compute tokens</strong> allow you to manage usage and collaboration within the platform. 
            Tokens are the internal currency used to perform analyses and computations. 
            Each user begins with a free balance, and tokens are deducted automatically 
            whenever an analysis completes successfully. After a purchase, please refresh
            the page or navigate back to the project menu from the left. It can take a few
            seconds for the purchased tokens to get processed and get updated upon page refresh.
        </p>
        <br></br>
        <ul>
            <li>
            <strong>Billing source:</strong>  
            Choose whether analyses are billed from your <em>personal balance</em> or from a 
            <em>token group</em>. Token groups allow multiple users to share a common pool 
            of tokens for collaborative work.
            </li>
            <br></br>
            <li>
            <strong>Token groups:</strong>  
            View and manage your owned token groups. Each group lists its owner or members along with their 
            <em>names</em> and <em>email addresses</em>.  
            As a group owner, you can invite or remove members as needed.
            </li>
            <br></br>
            <li>
            <strong>Create new token group:</strong>  
            Create a new shared token group by specifying a unique name.  
            As the owner, you control group membership and manage the shared token balance.
            </li>
        </ul>

        <p>
            Token groups make it easy to share resources and collaborate with your team while maintaining 
            clear ownership and spending control.
        </p>
    </div>

    <hr class="h-0.5 bg-gray border-0 my-4">

    <h3 class = "text-lg font-bold ml-0 mb-4">Active compute token source</h3>
    <div class = "border-2 border-brand rounded-lg p-4 mb-8 shadow-black shadow-lg bg-black/5">

        <select
            v-model = "billingSettings.groupID"
            id = "projectSelect"
            class = "w-full border border-gray-600 rounded px-3 py-2 bg-white
                    text-black focus:outline-none focus:ring-2 focus:ring-brand">

            <option value = "">Personal balance</option>
            <option v-for  = "group in tokenGroups"
                    :key   = "group.groupId"
                    :value = "group.groupId">
                {{ group.groupName || group.groupId }}
            </option>

        </select>

        <SettingsButton @click = "updateTokenSource" :loading = "updatingTokenSource" class = "mt-4" >
            Update active token source
        </SettingsButton>

    </div>

    <hr class = "h-0.5 bg-gray border-0 my-4">

    <h3 class = "text-lg font-bold ml-0 mb-4">Personal token balance</h3>
    <div class = "border-2 border-brand rounded-lg p-4 mb-8 shadow-black shadow-lg">

        Balance: <span class = "font-bold">{{ balance }}</span> compute tokens
        <hr class="h-0.5 bg-gray border-0 my-4"></hr>
        <SettingsButton @click = "buy('')">
            Purchase tokens
        </SettingsButton>

    </div>
    
    <hr class="h-0.5 bg-gray border-0 my-4">

    <h3 class = "text-lg font-bold ml-0 mb-4">Your owned compute token groups</h3>
    <div>

        <div v-if = "ownedGroups.length === 0">
            You do not own any token groups yet.
        </div>

        <ul v-else>
            <div v-for = "group in ownedGroups" class = "border-2 border-brand rounded-lg p-4 mb-4 shadow-black shadow-lg">

                <div>Group name: <span class = "font-bold">{{ group.groupName }}</span></div>
                <div>Balance: <span class = "font-bold">{{ group.tokenBalance }}</span> compute tokens</div>
                <div>Members:</div>

                <ul class = "ml-8">
                    <li v-for = "member in group.members" class="flex items-center justify-between text-black">

                        <div v-if = "group.owner.sub == member.sub">
                            You
                        </div>

                        <span v-if = "group.owner.sub != member.sub">
                            {{ member.given_name }} {{ member.family_name }} - {{ member.email }}
                        </span>

                        <button v-if = "group.owner.sub != member.sub"
                            @click = "removeGroupMember( group, member)"
                            :title="'Remove ' + member.given_name + ' ' + member.family_name + ' - ' + member.email"
                            class="ml-2 text-black transition-colors hover:text-brand">
                            <i class="fas fa-trash"></i>
                        </button>

                    </li>
                </ul>

                <hr class="h-0.5 bg-gray border-0 my-4"></hr>
                <SettingsButton @click = "open( memberModal, group)">Add member</SettingsButton>
                <SettingsButton @click = "buy( group.groupId )" class = "mx-2">Purchase tokens</SettingsButton>
                <SettingsButton @click = "open( deleteGroupModal, group)" class = "float-right">Delete group</SettingsButton>
            </div>
        </ul>

    </div>

    <hr class="h-0.5 bg-gray border-0 my-4">

    <h3 class = "text-lg font-bold ml-0 mb-4">Compute token groups shared with you</h3>
    <div>

        <div v-if="sharedGroups.length === 0">You do not have any shared token groups yet.</div>

        <ul v-else>
            <div v-for = "group in sharedGroups" class = "border-2 border-brand rounded-lg p-4 mb-4
                  shadow-black shadow-lg">

                <div>Owner: <span class = "font-bold">{{ group.owner.given_name }} {{ group.owner.family_name }} - {{ group.owner.email }}</span></div>
                <div>Group name: <span class = "font-bold">{{ group.groupName }}</span></div>
                <div>Balance: <span class = "font-bold">{{ group.tokenBalance }}</span> compute tokens</div>
            </div>
        </ul>

    </div>

    <hr class="h-0.5 bg-gray border-0 my-4">

    <h3 class = "text-lg font-bold ml-0 mb-4">Create a new token group</h3>

    
    <TextField description = "Please enter a token group name:" placeholder = "Token group name" v-model = "newTokenGroupName">
        <SettingsButton @click = "createTokenGroup" :loading = "creatingTokenGroup" class = "mt-4" >
            Create compute token group
        </SettingsButton>
        <div v-show = 'groupCreationErrorMessage !== ""' class = "text-red-600 mt-4">
            <i class="fa fa-exclamation-triangle fa-lg mt-1"></i>
            {{ groupCreationErrorMessage }}
        </div>
    </TextField>

    <TokenGroupMemberModal ref = "memberModal" :group = "activeGroup" @updateTokenGroups = "updateGroups"></TokenGroupMemberModal>
    <DeleteTokenGroupModal ref = "deleteGroupModal" :group = "activeGroup" @updateTokenGroups = "updateGroups"></DeleteTokenGroupModal>
</div>
</template>

<script setup>

import { Amplify } from 'aws-amplify'
import awsconfig from '@/aws-exports.js'
Amplify.configure( awsconfig )
const Auth = Amplify.Auth;

import { ref, computed, nextTick, onMounted} from "vue"
import { initializePaddle } from '@paddle/paddle-js';

import { settings as settingslib, utils} from "@harkana/tools"
import tokens from "@harkana/tokens"

import TextField from "../settings/TextField.vue"
import SettingsButton from "../settings/SettingsButton.vue"

import TokenGroupMemberModal from "../modals/TokenGroupMemberModal.vue"
import DeleteTokenGroupModal from "../modals/DeleteTokenGroupModal.vue"

const memberModal = ref(null)
const deleteGroupModal = ref(null)

const balance = ref(0)
const activeGroup = ref({})
const tokenGroups = ref([])
const newTokenGroupName = ref("")

const paddle = ref(null)
const billingSettings = ref({})
const updatingTokenSource = ref(false)

const creatingTokenGroup = ref(false)
const groupCreationErrorMessage = ref("")

const ownedGroups = computed(() => {
	return tokenGroups.value.filter( group => { return group.owned })
})

const sharedGroups = computed(() => {
	return tokenGroups.value.filter( group => {return !group.owned })
})

const open = async ( modal, group) => {
    activeGroup.value = group
    modal.open()
}

const updateTokenSource = async () => {
    
    updatingTokenSource.value = true
    const currentGroupID = billingSettings.value.groupID

    var newBillingSettings = {}
    newBillingSettings.groupID = currentGroupID

    if( currentGroupID === "" ){
        newBillingSettings.groupName = "Personal token balance"
    } else {

        const selectedGroup = tokenGroups.value.find( group => group.groupId === currentGroupID )
        newBillingSettings.groupName = selectedGroup.groupName
    }

    await settingslib.setBilling( newBillingSettings )
    console.log("Token source updated.")

    await utils.wait( 1000 )
    updatingTokenSource.value = false
}

const removeGroupMember = async ( group, member) => {
    await tokens.removeGroupMember( group.groupId, member.sub)
    await updateGroups()
}

const updateGroups = async () => {

	tokenGroups.value = await tokens.listGroupsAndMembers();
	tokenGroups.value = tokenGroups.value.filter( g => g.owner != null);
}

const createTokenGroup = async() => {

    creatingTokenGroup.value = true
    groupCreationErrorMessage.value = ""

    try {
	    await tokens.createGroup( newTokenGroupName.value )
	    await updateGroups()
    } catch (e) {
        console.log(e)
        groupCreationErrorMessage.value = e.message
    } finally {
        creatingTokenGroup.value = false
    }
}

const buy = async( groupID ) => {

    const items = [{ priceId: import.meta.env.VITE_PADDLE_PRICE_ID, quantity: 1}]
    const custom = { userID: Auth.user.attributes.sub, groupID: groupID}
    const settings = { locale: "en", variant: "one-page"}

    await paddle.value.Checkout.open({
        items: items,
        customData: custom,
        settings: settings,
    })
}

onMounted( async () => {

    paddle.value = await initializePaddle({
        token: import.meta.env.VITE_PADDLE_CLIENT_SIDE_TOKEN
    });

	billingSettings.value = await settingslib.getBilling();

    balance.value = await tokens.balance("")
	tokenGroups.value = await tokens.listGroupsAndMembers();
	tokenGroups.value = tokenGroups.value.filter( g => g.owner != null);

    await nextTick()
    await utils.wait( 100 )
})

</script>