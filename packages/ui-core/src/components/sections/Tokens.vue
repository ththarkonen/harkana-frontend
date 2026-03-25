<template>
<div class = "prose prose-gray flex h-full min-h-0 max-w-none flex-col">
    <div class = "mb-6 flex w-full max-w-2xl flex-none flex-wrap gap-2 rounded-lg border border-black/10 bg-black/[0.03] p-2 not-prose"
         role = "tablist"
         aria-label = "Compute token sections">
        <button v-for = "tab in tokenTabs"
                :key = "tab.id"
                type = "button"
                role = "tab"
                :aria-selected = "activeTokenTab === tab.id ? 'true' : 'false'"
                :tabindex = "activeTokenTab === tab.id ? 0 : -1"
                @click = "activeTokenTab = tab.id"
                class = "inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                :class = "activeTokenTab === tab.id
                    ? 'bg-brand text-white'
                    : 'bg-transparent text-black/70 hover:bg-black/5 hover:text-black'">
            {{ tab.label }}
        </button>
    </div>

    <div v-show = "activeTokenTab === 'overview'" role = "tabpanel" class = "max-w-2xl space-y-10">
        <div class = "space-y-4">
            <p>
                <strong>Compute tokens</strong> allow you to manage usage and collaboration within the platform.
                Tokens are the internal currency used to perform analyses and computations.
                Each user begins with a free balance, and tokens are deducted automatically
                whenever an analysis completes successfully. After a purchase, please refresh
                the page or navigate back to the project menu from the left. It can take a few
                seconds for the purchased tokens to get processed and get updated upon page refresh.
            </p>

            <p>
                <strong>Billing source:</strong>
                Choose whether analyses are billed from your <em>personal balance</em> or from a
                <em>token group</em>. Token groups allow multiple users to share a common pool
                of tokens for collaborative work.
            </p>

            <p>
                <strong>Token groups:</strong>
                View and manage your owned token groups. Each group lists its owner or members along with their
                <em>names</em> and <em>email addresses</em>.
                As a group owner, you can invite or remove members as needed.
            </p>

            <p>
                <strong>Create new token group:</strong>
                Create a new shared token group by specifying a unique name.
                As the owner, you control group membership and manage the shared token balance.
            </p>
            <p>
                Token groups make it easy to share resources and collaborate with your team while maintaining
                clear ownership and spending control.
            </p>
        </div>

        <div class = "border-4 border-brand rounded-lg p-4 space-y-2">
            <div class = "text-xs font-semibold uppercase tracking-wide text-black/70">Active compute token source</div>

            <select
                v-model = "billingSettings.groupID"
                id = "projectSelect"
                class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand">

                <option value = "">Personal balance</option>
                <option v-for  = "group in tokenGroups"
                        :key   = "group.groupId"
                        :value = "group.groupId">
                    {{ group.groupName || group.groupId }}
                </option>

            </select>

            <SettingsButton @click = "updateTokenSource" :loading = "updatingTokenSource" class = "!mt-3" >
                Update active token source
            </SettingsButton>
        </div>

        <div class = "border-4 border-brand rounded-lg p-4 mb-4 space-y-2">
            <div class = "text-xs font-semibold uppercase tracking-wide text-black/70">Personal token balance</div>

            <p class = "m-0 text-sm text-black/75">
                Balance: <span class = "font-bold text-black">{{ balance }}</span> compute tokens
            </p>

            <SettingsButton @click = "buy('')" class = "mt-3">
                Purchase tokens
            </SettingsButton>
        </div>
    </div>

    <div v-show = "activeTokenTab === 'history'"
         role = "tabpanel"
         class = "flex min-h-0 flex-1 flex-col gap-8 max-w-2xl">
        <div class = "flex-none space-y-6">

            <div class = "space-y-5">
                <label class = "block">
                    <div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Token source</div>
                    <select v-model = "historySourceID"
                            class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand">
                        <option value = "">Personal token balance</option>
                        <option v-for = "group in availableHistoryGroups"
                                :key = "'history-source-' + group.groupId"
                                :value = "group.groupId">
                            {{ group.groupName }}
                        </option>
                    </select>
                </label>

                <div class = "grid grid-cols-2 gap-4">
                    <label class = "block">
                        <div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">From</div>
                        <input v-model = "historyFrom"
                               type = "datetime-local"
                               class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand"/>
                    </label>

                    <label class = "block">
                        <div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">To</div>
                        <input v-model = "historyTo"
                               type = "datetime-local"
                               class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 focus:border-brand focus:outline-none focus-visible:border-brand"/>
                    </label>
                </div>
            </div>

            <p v-if = "ownedHistoryGroupsError.length > 0"
               class = "text-xs text-red-600">
                {{ ownedHistoryGroupsError }}
            </p>

            <p v-if = "historyDateRangeError.length > 0"
               class = "text-xs text-red-600">
                {{ historyDateRangeError }}
            </p>

            <div class = "flex flex-wrap gap-3">
                <SettingsButton @click = "loadHistory( true )"
                                :disabled = "historyLoading || historyDateRangeError.length > 0">
                    Load history
                </SettingsButton>
                <SettingsButton @click = "resetHistoryFilters">
                    Reset filters
                </SettingsButton>
            </div>

            <div v-if = "selectedHistoryGroupSummary !== null" class = "space-y-1 text-sm text-black/75">
                <div>Group balance: <span class = "font-bold text-black">{{ selectedHistoryGroupSummary.tokenBalance }}</span> compute tokens</div>
                <div>Last event: <span class = "font-bold text-black">{{ selectedHistoryGroupSummary.lastEvent ? formatHistoryTimestamp( selectedHistoryGroupSummary.lastEvent.createdAt ) : "No events yet" }}</span></div>
            </div>

            <p v-if = "historyError.length > 0"
               class = "text-sm text-red-600">
                {{ historyError }}
            </p>

            <div v-if = "historyLoading"
                 class = "text-sm text-black/70">
                Loading token history...
            </div>

            <div v-if = "historyLoading === false && historyItems.length === 0 && historyError.length === 0"
                 class = "text-sm text-black/70">
                No token history events for the selected filters.
            </div>
        </div>

        <div v-if = "historyItems.length > 0"
             class = "min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            <div v-for = "event in historyItems"
                 :key = "event.eventId"
                 class = "rounded-lg border border-black/10 bg-white/70 p-3 text-sm text-black">
                <div class = "flex flex-wrap items-center justify-between gap-2">
                    <div class = "font-semibold">{{ formatHistoryTimestamp( event.createdAt ) }}</div>
                    <div class = "font-bold"
                         :class = "event.direction === 'DEBIT' ? 'text-red-600' : 'text-green-700'">
                        {{ formatTokenDelta( event.deltaTokens ) }}
                    </div>
                </div>

                <div class = "mt-1 flex items-center justify-between gap-3">
                    <div class = "min-w-0">
                        {{ formatHistorySummaryLine( event ) }}
                    </div>
                    <button type = "button"
                            @click = "toggleHistoryEventExpanded( event.eventId )"
                            class = "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-black/55 transition hover:bg-black/5 hover:text-black"
                            :aria-expanded = "isHistoryEventExpanded( event.eventId ) ? 'true' : 'false'"
                            :aria-label = "isHistoryEventExpanded( event.eventId ) ? 'Collapse token history details' : 'Expand token history details'">
                        <i class = "fas"
                           :class = "isHistoryEventExpanded( event.eventId ) ? 'fa-chevron-up' : 'fa-chevron-down'"
                           aria-hidden = "true"></i>
                    </button>
                </div>

                <div v-if = "isHistoryEventExpanded( event.eventId )"
                     class = "mt-2 space-y-1 text-black/70">
                    <div>{{ formatHistoryBillingLabel( event ) }}</div>

                    <div v-if = "formatHistoryActor( event ).length > 0">
                        {{ formatHistoryActor( event ) }}
                    </div>

                    <div v-if = "event.projectName">
                        Project: {{ event.projectName }}
                    </div>

                    <div v-if = "event.fileName">
                        File: {{ event.fileName }}
                    </div>
                </div>
            </div>
        </div>

        <div v-if = "historyNextToken && historyItems.length > 0" class = "flex-none">
            <SettingsButton @click = "loadMoreHistory"
                            :disabled = "historyLoadingMore">
                {{ historyLoadingMore ? "Loading..." : "Load more" }}
            </SettingsButton>
        </div>
    </div>

    <div v-show = "activeTokenTab === 'owned'" role = "tabpanel" class = "space-y-8">
        <div>
            <div>

                <div v-if = "ownedGroups.length === 0">
                    You do not own any token groups yet.
                </div>

                <ul v-else>
                    <div v-for = "group in ownedGroups" class = "border-4 border-brand rounded-lg p-4 mb-4 shadow-black">

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
        </div>

        <div class = "max-w-2xl space-y-4 pt-2">
            <div class = "text-xs font-semibold uppercase tracking-wide text-black/70">Create a new token group</div>

            <label class = "block">
                <div class = "mb-1 text-xs font-semibold uppercase tracking-wide text-black/70">Token group name</div>
                <input type = "text"
                       v-model = "newTokenGroupName"
                       placeholder = "Token group name"
                       class = "w-full border-0 border-b border-black/35 bg-transparent px-0 py-1 text-sm font-medium text-slate-900 caret-brand transition-[border-color,color] duration-150 ease-out placeholder:text-black/40 focus:border-brand focus:outline-none focus-visible:border-brand focus-visible:outline-none" />
            </label>

            <SettingsButton @click = "createTokenGroup" :loading = "creatingTokenGroup" class = "mt-3" >
                Create compute token group
            </SettingsButton>

            <div v-show = 'groupCreationErrorMessage !== ""' class = "text-red-600 mt-4">
                <i class="fa fa-exclamation-triangle fa-lg mt-1"></i>
                {{ groupCreationErrorMessage }}
            </div>
        </div>
    </div>

    <div v-show = "activeTokenTab === 'shared'" role = "tabpanel">
        <h3 class = "text-lg font-bold ml-0 mb-4">Compute token groups shared with you</h3>
        <div>

            <div v-if="sharedGroups.length === 0">You do not have any shared token groups yet.</div>

            <ul v-else>
                <div v-for = "group in sharedGroups" class = "border-2 border-brand rounded-lg p-4 mb-4">

                    <div>Owner: <span class = "font-bold">{{ group.owner.given_name }} {{ group.owner.family_name }} - {{ group.owner.email }}</span></div>
                    <div>Group name: <span class = "font-bold">{{ group.groupName }}</span></div>
                    <div>Balance: <span class = "font-bold">{{ group.tokenBalance }}</span> compute tokens</div>
                </div>
            </ul>
        </div>
    </div>

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

import SettingsButton from "../settings/SettingsButton.vue"

import TokenGroupMemberModal from "../modals/TokenGroupMemberModal.vue"
import DeleteTokenGroupModal from "../modals/DeleteTokenGroupModal.vue"

const memberModal = ref(null)
const deleteGroupModal = ref(null)

const balance = ref(0)
const activeGroup = ref({})
const tokenGroups = ref([])
const newTokenGroupName = ref("")
const activeTokenTab = ref("overview")
const tokenTabs = [
    { id: "overview", label: "Overview" },
    { id: "owned", label: "Owned token groups" },
    { id: "shared", label: "Shared token groups" },
    { id: "history", label: "Token history" }
]

const paddle = ref(null)
const billingSettings = ref({})
const updatingTokenSource = ref(false)

const creatingTokenGroup = ref(false)
const groupCreationErrorMessage = ref("")
const historySourceID = ref("")
const historyFrom = ref("")
const historyTo = ref("")
const historyItems = ref([])
const historyNextToken = ref(null)
const historyLoading = ref(false)
const historyLoadingMore = ref(false)
const historyError = ref("")
const expandedHistoryEventIDs = ref(new Set())
const ownedHistoryGroups = ref([])
const ownedHistoryGroupsLoading = ref(false)
const ownedHistoryGroupsError = ref("")
const HISTORY_PAGE_SIZE = 50

const ownedGroups = computed(() => {
	return tokenGroups.value.filter( group => { return group.owned })
})

const sharedGroups = computed(() => {
	return tokenGroups.value.filter( group => {return !group.owned })
})

const tokenGroupNameByID = computed(() => {
    const entries = tokenGroups.value.map(( group ) => {
        return [
            String( group.groupId ?? "" ),
            String( group.groupName ?? group.groupId ?? "" )
        ]
    }).filter(( entry ) => entry[0].length > 0 )

    return new Map( entries )
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
    const groupID = String( historySourceID.value ?? "" ).trim()
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

    return new Date( parsed ).toLocaleString( undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    })
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

const formatHistoryActor = ( event ) => {

    const actor = event?.actor ?? null
    const givenName = String( actor?.givenName ?? "" ).trim()
    const familyName = String( actor?.familyName ?? "" ).trim()
    const email = String( actor?.email ?? "" ).trim()
    const sub = String( actor?.sub ?? "" ).trim()
    const fallbackSub = String( event?.actorUserSub ?? "" ).trim()

    const fullName = [ givenName, familyName ].filter(( value ) => value.length > 0 ).join( " " )
    if( fullName.length > 0 && email.length > 0 ){
        return `${fullName} - ${email}`
    }

    if( fullName.length > 0 ){
        return fullName
    }

    if( email.length > 0 ){
        return email
    }

    if( sub.length > 0 ){
        return sub
    }

    return fallbackSub
}

const formatHistoryDataType = ( event ) => {
    return String( event?.dataType ?? "" ).trim().toUpperCase()
}

const formatHistoryActionLabel = ( event ) => {

    const source = String( event?.source ?? "" ).trim()
    const reason = String( event?.reason ?? "" ).trim()

    if( source === "hyperspectrum.parse" ){
        return "Project creation"
    }

    if( source === "hyperspectrum.estimate" ){
        return "Raman inference"
    }

    if( reason.length > 0 ){
        return reason
    }

    if( source.length > 0 ){
        return source
    }

    return "Unknown source"
}

const formatHistorySummaryLine = ( event ) => {

    const parts = [
        String( event?.eventType ?? "" ).trim(),
        formatHistoryActionLabel( event ),
        formatHistoryDataType( event )
    ].filter(( value ) => value.length > 0 )

    return parts.join( " | " )
}

const formatHistoryBillingLabel = ( event ) => {

    const groupID = String( event?.groupId ?? "" ).trim()
    if( groupID.length === 0 ){
        return "Personal token balance"
    }

    return tokenGroupNameByID.value.get( groupID ) ?? "DELETED TOKEN GROUP"
}

const isHistoryEventExpanded = ( eventId ) => {
    return expandedHistoryEventIDs.value.has( String( eventId ?? "" ))
}

const toggleHistoryEventExpanded = ( eventId ) => {
    const next = new Set( expandedHistoryEventIDs.value )
    const normalizedID = String( eventId ?? "" )

    if( next.has( normalizedID ) ){
        next.delete( normalizedID )
    } else {
        next.add( normalizedID )
    }

    expandedHistoryEventIDs.value = next
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
        limit: HISTORY_PAGE_SIZE,
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

    const nextToken = reset ? "" : String( historyNextToken.value ?? "" )
    historyError.value = ""

    if( reset ){
        historyLoading.value = true
        historyItems.value = []
        historyNextToken.value = null
        expandedHistoryEventIDs.value = new Set()
    } else {
        historyLoadingMore.value = true
    }

    try{
        const query = buildHistoryQuery( nextToken )
        const scope = String( historySourceID.value ?? "" ).trim().length > 0 ? "group" : "personal"
        const response = scope === "group"
            ? await tokens.getGroupHistory({
                groupID: String( historySourceID.value ?? "" ).trim(),
                ...query
            })
            : await tokens.getPersonalHistory( query )

        const fetchedItems = Array.isArray( response?.items ) ? response.items : []

        if( reset ){
            historyItems.value = fetchedItems
            console.log( historyItems.value )
        } else {
            historyItems.value = [ ...historyItems.value, ...fetchedItems ]
        }

        historyNextToken.value = response?.nextToken ?? null
    } catch( error ){
        const scope = String( historySourceID.value ?? "" ).trim().length > 0 ? "group" : "personal"
        historyError.value = mapHistoryError( error, scope )
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
    historyError.value = ""
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

    await loadHistory( true )

    console.log( newTokenGroupName.value )

    await nextTick()
    await utils.wait( 100 )
})

</script>
