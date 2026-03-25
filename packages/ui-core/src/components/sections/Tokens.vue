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

    <h3 class = "text-lg font-bold ml-0 mb-4">Compute token usage history</h3>
    <div class = "border-2 border-brand rounded-lg p-4 mb-8 shadow-black shadow-lg bg-black/5">

        <div class = "grid grid-cols-1 gap-4 md:grid-cols-2">
            <div class = "flex flex-col gap-2">
                <label class = "font-semibold text-black">History scope</label>
                <select v-model = "historyScope"
                        class = "w-full border border-gray-600 rounded px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-brand">
                    <option value = "personal">Personal</option>
                    <option value = "group">Owned group</option>
                </select>
            </div>

            <div v-if = "historyScope === 'group'" class = "flex flex-col gap-2">
                <label class = "font-semibold text-black">Owned group</label>
                <select v-model = "historyGroupID"
                        class = "w-full border border-gray-600 rounded px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-brand">
                    <option value = "">Select an owned group</option>
                    <option v-for = "group in availableHistoryGroups"
                            :key = "'history-group-' + group.groupId"
                            :value = "group.groupId">
                        {{ group.groupName }}
                    </option>
                </select>
            </div>

            <div class = "flex flex-col gap-2">
                <label class = "font-semibold text-black">From</label>
                <input v-model = "historyFrom"
                       type = "datetime-local"
                       class = "w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"/>
            </div>

            <div class = "flex flex-col gap-2">
                <label class = "font-semibold text-black">To</label>
                <input v-model = "historyTo"
                       type = "datetime-local"
                       class = "w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"/>
            </div>

            <div class = "flex flex-col gap-2">
                <label class = "font-semibold text-black">Page size</label>
                <select v-model.number = "historyLimit"
                        class = "w-full border border-gray-600 rounded px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-brand">
                    <option :value = "25">25</option>
                    <option :value = "50">50</option>
                    <option :value = "100">100</option>
                    <option :value = "200">200</option>
                </select>
            </div>
        </div>

        <p v-if = "ownedHistoryGroupsError.length > 0"
           class = "text-xs text-red-600 mt-3">
            {{ ownedHistoryGroupsError }}
        </p>

        <p v-if = "historyDateRangeError.length > 0"
           class = "text-xs text-red-600 mt-3">
            {{ historyDateRangeError }}
        </p>

        <div class = "flex flex-wrap gap-3 mt-4">
            <button @click = "loadHistory( true )"
                    :disabled = "historyLoading || historyDateRangeError.length > 0"
                    class = "inline-flex items-center justify-center px-4 py-2 rounded-full bg-brand text-white font-semibold transition shadow-md shadow-black hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed">
                Load history
            </button>
            <button @click = "resetHistoryFilters"
                    class = "inline-flex items-center justify-center px-4 py-2 rounded-full bg-gray-700 text-white font-semibold transition shadow-md shadow-black hover:bg-gray-800">
                Reset filters
            </button>
        </div>

        <div v-if = "selectedHistoryGroupSummary !== null"
             class = "mt-4 rounded border border-brand/40 bg-white/70 p-3 text-sm">
            <div>Group balance: <span class = "font-bold">{{ selectedHistoryGroupSummary.tokenBalance }}</span> compute tokens</div>
            <div>Last event: <span class = "font-bold">{{ selectedHistoryGroupSummary.lastEvent ? formatHistoryTimestamp( selectedHistoryGroupSummary.lastEvent.createdAt ) : "No events yet" }}</span></div>
        </div>

        <p v-if = "historyError.length > 0"
           class = "text-sm text-red-600 mt-4">
            {{ historyError }}
        </p>

        <div v-if = "historyLoading"
             class = "mt-4 text-sm text-black/70">
            Loading token history...
        </div>

        <div v-if = "historyLoading === false && historyItems.length === 0 && historyError.length === 0"
             class = "mt-4 text-sm text-black/70">
            No token history events for the selected filters.
        </div>

        <div v-if = "historyItems.length > 0" class = "mt-4 space-y-3">
            <div v-for = "event in historyItems"
                 :key = "event.eventId"
                 class = "rounded border border-brand/40 bg-white/80 p-3 text-sm text-black">
                <div class = "flex flex-wrap items-center justify-between gap-2">
                    <div class = "font-semibold">{{ formatHistoryTimestamp( event.createdAt ) }}</div>
                    <div class = "font-bold"
                         :class = "event.direction === 'DEBIT' ? 'text-red-600' : 'text-green-700'">
                        {{ formatTokenDelta( event.deltaTokens ) }}
                    </div>
                </div>

                <div class = "mt-1">
                    <span class = "font-semibold">{{ event.eventType }}</span>
                    <span class = "mx-1 text-black/50">|</span>
                    <span>{{ event.source || "Unknown source" }}</span>
                    <span v-if = "event.reason" class = "mx-1 text-black/50">|</span>
                    <span v-if = "event.reason">{{ event.reason }}</span>
                </div>

                <div class = "mt-1 text-black/70">
                    Scope: {{ event.scopeType }}<span v-if = "event.groupId"> ({{ event.groupId }})</span>
                </div>

                <div v-if = "event.projectName || event.fileName || event.jobId"
                     class = "mt-1 text-black/70">
                    <span v-if = "event.projectName">Project: {{ event.projectName }}</span>
                    <span v-if = "event.fileName" class = "ml-2">File: {{ event.fileName }}</span>
                    <span v-if = "event.jobId" class = "ml-2">Job: {{ event.jobId }}</span>
                </div>
            </div>
        </div>

        <div v-if = "historyNextToken && historyItems.length > 0"
             class = "mt-4">
            <button @click = "loadMoreHistory"
                    :disabled = "historyLoadingMore"
                    class = "inline-flex items-center justify-center px-4 py-2 rounded-full bg-gray-700 text-white font-semibold transition shadow-md shadow-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ historyLoadingMore ? "Loading..." : "Load more" }}
            </button>
        </div>
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
const Auth = Amplify.Auth;

import { ref, computed, nextTick, onMounted} from "vue"
import { initializePaddle } from '@paddle/paddle-js';
import { settings as settingslib, tokens, utils} from "@harkana/tools"

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
const historyScope = ref("personal")
const historyGroupID = ref("")
const historyLimit = ref(50)
const historyFrom = ref("")
const historyTo = ref("")
const historyItems = ref([])
const historyNextToken = ref(null)
const historyLoading = ref(false)
const historyLoadingMore = ref(false)
const historyError = ref("")
const ownedHistoryGroups = ref([])
const ownedHistoryGroupsLoading = ref(false)
const ownedHistoryGroupsError = ref("")

const ownedGroups = computed(() => {
	return tokenGroups.value.filter( group => { return group.owned })
})

const sharedGroups = computed(() => {
	return tokenGroups.value.filter( group => {return !group.owned })
})

const availableHistoryGroups = computed(() => {

    if( ownedHistoryGroups.value.length > 0 ){
        return ownedHistoryGroups.value.map(( group ) => {
            return {
                groupId: String( group.groupId ?? "" ),
                groupName: String( group.groupName ?? group.groupId ?? "" )
            }
        }).filter(( group ) => group.groupId.length > 0 )
    }

    return ownedGroups.value.map(( group ) => {
        return {
            groupId: String( group.groupId ?? "" ),
            groupName: String( group.groupName ?? group.groupId ?? "" )
        }
    }).filter(( group ) => group.groupId.length > 0 )
})

const selectedHistoryGroupSummary = computed(() => {
    const groupID = String( historyGroupID.value ?? "" ).trim()
    if( groupID.length === 0 ) return null

    const match = ownedHistoryGroups.value.find(( group ) => String( group.groupId ?? "" ) === groupID )
    return match ?? null
})

const historyDateRangeError = computed(() => {

    const fromIso = localDateTimeToIso( historyFrom.value )
    const toIso = localDateTimeToIso( historyTo.value )

    if( fromIso.length === 0 || toIso.length === 0 ){
        return ""
    }

    if( Date.parse( fromIso ) > Date.parse( toIso ) ){
        return "The 'From' timestamp must be earlier than or equal to 'To'."
    }

    return ""
})

const localDateTimeToIso = ( value ) => {

    const trimmed = String( value ?? "" ).trim()
    if( trimmed.length === 0 ){
        return ""
    }

    const parsed = Date.parse( trimmed )
    if( Number.isFinite( parsed ) === false ){
        return ""
    }

    return new Date( parsed ).toISOString()
}

const formatHistoryTimestamp = ( value ) => {

    const parsed = Date.parse( String( value ?? "" ))
    if( Number.isFinite( parsed ) === false ){
        return "Unknown timestamp"
    }

    return new Date( parsed ).toLocaleString()
}

const formatTokenDelta = ( value ) => {
    const numeric = Number( value )
    if( Number.isFinite( numeric ) === false ){
        return String( value ?? "" )
    }

    if( numeric > 0 ){
        return `+${numeric}`
    }

    return String( numeric )
}

const mapHistoryError = ( error, scope ) => {

    const status = Number.parseInt( String( error?.status ?? "" ), 10 )
    const detail = String( error?.detail ?? error?.message ?? "" ).trim()

    if( status === 400 ){
        return detail.length > 0 ? detail : "Invalid history query parameters."
    }

    if( status === 401 ){
        return "You are not authenticated. Please sign in again."
    }

    if( status === 403 && scope === "group" ){
        return "You are not allowed to view history for this token group."
    }

    if( status === 404 && scope === "group" ){
        return "The selected token group was not found."
    }

    if( detail.length > 0 ){
        return detail
    }

    return "Failed to load token history."
}

const loadOwnedHistoryGroupsSummary = async () => {

    ownedHistoryGroupsLoading.value = true
    ownedHistoryGroupsError.value = ""

    try{
        const response = await tokens.getOwnedGroupsHistorySummary({ includeRecent: false })
        ownedHistoryGroups.value = Array.isArray( response?.groups ) ? response.groups : []
    } catch( error ){
        ownedHistoryGroups.value = []
        ownedHistoryGroupsError.value = mapHistoryError( error, "group" )
    } finally {
        ownedHistoryGroupsLoading.value = false
    }
}

const buildHistoryQuery = ( nextToken = "" ) => {

    const query = {
        limit: Number( historyLimit.value ) || 50,
        nextToken: String( nextToken ?? "" ).trim(),
        from: localDateTimeToIso( historyFrom.value ),
        to: localDateTimeToIso( historyTo.value )
    }

    if( query.nextToken.length === 0 ){
        delete query.nextToken
    }

    if( query.from.length === 0 ){
        delete query.from
    }

    if( query.to.length === 0 ){
        delete query.to
    }

    return query
}

const loadHistory = async ( reset = true ) => {

    if( historyDateRangeError.value.length > 0 ){
        historyError.value = historyDateRangeError.value
        return
    }

    if( historyScope.value === "group" && String( historyGroupID.value ?? "" ).trim().length === 0 ){
        historyError.value = "Select an owned group to load group history."
        return
    }

    const nextToken = reset ? "" : String( historyNextToken.value ?? "" )
    historyError.value = ""

    if( reset ){
        historyLoading.value = true
        historyItems.value = []
        historyNextToken.value = null
    } else {
        historyLoadingMore.value = true
    }

    try{
        const query = buildHistoryQuery( nextToken )
        const response = historyScope.value === "group"
            ? await tokens.getGroupHistory({
                groupID: String( historyGroupID.value ?? "" ).trim(),
                ...query
            })
            : await tokens.getPersonalHistory( query )

        const fetchedItems = Array.isArray( response?.items ) ? response.items : []

        if( reset ){
            historyItems.value = fetchedItems
        } else {
            historyItems.value = [ ...historyItems.value, ...fetchedItems ]
        }

        historyNextToken.value = response?.nextToken ?? null
    } catch( error ){
        historyError.value = mapHistoryError( error, historyScope.value )
    } finally {
        historyLoading.value = false
        historyLoadingMore.value = false
    }
}

const loadMoreHistory = async () => {
    if( historyNextToken.value === null ){
        return
    }

    await loadHistory( false )
}

const resetHistoryFilters = () => {

    historyFrom.value = ""
    historyTo.value = ""
    historyLimit.value = 50
    historyError.value = ""

    if( historyScope.value === "group" && String( historyGroupID.value ?? "" ).trim().length === 0 ){
        const defaultGroupID = String( availableHistoryGroups.value[0]?.groupId ?? "" )
        historyGroupID.value = defaultGroupID
    }
}

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
    await loadOwnedHistoryGroupsSummary()
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
    const successUrl = window.location.origin + "/checkout-success"
    const settings = {
        locale: "en",
        variant: "one-page",
        successUrl: successUrl
    }

    await paddle.value.Checkout.open({
        items: items,
        customData: custom,
        settings: settings,
    })
}

onMounted( async () => {

    const paddleToken = import.meta.env.VITE_PADDLE_CLIENT_SIDE_TOKEN
    const paddleEnvironment = import.meta.env.DEV && typeof paddleToken === "string" && paddleToken.startsWith("test_")
        ? "sandbox"
        : "production"

    paddle.value = await initializePaddle({
        token: paddleToken,
        environment: paddleEnvironment
    });

    console.log( paddleToken )

	billingSettings.value = await settingslib.getBilling();

    balance.value = await tokens.balance("")
	tokenGroups.value = await tokens.listGroupsAndMembers();
	tokenGroups.value = tokenGroups.value.filter( g => g.owner != null);
    await loadOwnedHistoryGroupsSummary()

    if( availableHistoryGroups.value.length > 0 ){
        historyGroupID.value = availableHistoryGroups.value[0].groupId
    }

    await loadHistory( true )

    console.log( newTokenGroupName.value )

    await nextTick()
    await utils.wait( 100 )
})

</script>
