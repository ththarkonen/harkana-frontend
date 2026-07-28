<template>
<div class = "prose prose-gray h-full min-h-0 max-w-none overflow-hidden">
<div class = "not-prose flex h-full min-h-0 max-w-none flex-col overflow-hidden font-sans">
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

    <div v-show = "activeTokenTab === 'overview'"
         role = "tabpanel"
         class = "min-h-0 flex-1 max-w-2xl space-y-10 overflow-y-auto overscroll-contain pb-6 pr-1">
        <div class = "space-y-4 text-sm text-black/70">
            <p class = "m-0">
                <strong>Compute tokens</strong> allow you to manage usage and collaboration within the platform.
                Tokens are the internal currency used to perform analyses and computations.
                Each user begins with a free balance, and tokens are deducted automatically
                whenever an analysis completes successfully. After a purchase, please refresh
                the page or navigate back to the project menu from the left. It can take a few
                seconds for the purchased tokens to get processed and get updated upon page refresh.
            </p>

            <p class = "m-0">
                <strong>Billing source:</strong>
                Choose whether analyses are billed from your <em>personal balance</em> or from a
                <em>token group</em>. Token groups allow multiple users to share a common pool
                of tokens for collaborative work.
            </p>

            <p class = "m-0">
                <strong>Token groups:</strong>
                View and manage your owned token groups. Each group lists its owner or members along with their
                <em>names</em> and <em>email addresses</em>.
                As a group owner, you can invite or remove members as needed.
            </p>

            <p class = "m-0">
                <strong>Create new token group:</strong>
                Create a new shared token group by specifying a unique name.
                As the owner, you control group membership and manage the shared token balance.
            </p>
            <p class = "m-0">
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

        <div class = "border-4 border-brand rounded-lg p-4 mb-4 space-y-3">
            <div class = "flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div class = "text-xs font-semibold uppercase tracking-wide text-black/70">Upcoming monthly billing estimate</div>
                    <p class = "m-0 mt-1 text-sm text-black/75">
                        Estimated total for {{ billingPreviewMonthLabel }}:
                        <span class = "font-bold text-black">{{ formatTokenAmount( totalBillingDueTokens ) }}</span>
                        compute tokens
                    </p>
                </div>

                <button type = "button"
                        @click = "billingPreviewExpanded = !billingPreviewExpanded"
                        class = "inline-flex items-center gap-2 rounded-full border border-brand/70 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white"
                        :aria-expanded = "billingPreviewExpanded ? 'true' : 'false'">
                    <span>{{ billingPreviewExpanded ? "Hide details" : "Billing details" }}</span>
                    <i class = "fas"
                       :class = "billingPreviewExpanded ? 'fa-chevron-up' : 'fa-chevron-down'"
                       aria-hidden = "true"></i>
                </button>
            </div>

            <p v-if = "billingPreviewLoading" class = "m-0 text-sm text-black/65">
                Loading billing preview...
            </p>
            <p v-if = "billingPreviewError.length > 0" class = "m-0 text-sm text-red-600">
                {{ billingPreviewError }}
            </p>
            <p v-if = "billingPreviewLoading === false && billingPreviewError.length === 0 && hasBillingPreviewLineItems === false"
               class = "m-0 text-sm text-black/65">
                No personal or owned token group billing is currently projected for the coming month.
            </p>

            <div v-if = "missedMonthsPreview !== null"
                 class = "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
                 :class = "missedMonthsPreview.wouldDeleteOnNextMiss ? 'border-red-500/70 bg-red-50 text-red-700' : 'border-black/10 bg-black/[0.03] text-black/65'">
                <i class = "fas fa-exclamation-triangle" aria-hidden = "true"></i>
                <span>
                    Your missed billing months: {{ missedMonthsPreview.missedMonths }}
                </span>
            </div>
            <p v-if = "missedMonthsError.length > 0" class = "m-0 text-xs text-red-600">
                {{ missedMonthsError }}
            </p>

            <div v-if = "billingPreviewExpanded"
                 class = "space-y-3 pt-1">
                <div class = "rounded-lg border border-black/10 bg-white/70 p-3 text-sm text-black">
                    <div class = "flex flex-wrap items-center justify-between gap-2">
                        <div class = "font-semibold">Personal token balance</div>
                        <div class = "font-bold">{{ formatTokenAmount( personalBillingPreview.dueTokens ) }} tokens</div>
                    </div>
                    <div v-if = "personalBillingPreview.billedToPersonal"
                         class = "mt-1 text-black/65">
                        {{ personalBillingPreview.projectCount }} projects billed to personal balance, balance {{ formatTokenAmount( personalBillingPreview.tokenBalance ) }} tokens
                    </div>
                    <div v-if = "activeBillingGroupLabels.length > 0"
                         class = "mt-1 text-black/65">
                        Project buckets billed to token groups: {{ activeBillingGroupSummary }}.
                    </div>
                    <div v-if = "personalBillingPreview.billedToPersonal === false && activeBillingGroupLabels.length === 0"
                         class = "mt-1 text-black/65">
                        No project buckets are currently billed to personal tokens.
                    </div>
                    <div v-if = "personalBillingPreview.wouldDeleteOnNextMiss"
                         class = "mt-1 text-red-600">
                        Personal billing is at risk on the next missed month.
                    </div>
                    <div v-if = "personalBillingPreview.bucketUsage.length > 0"
                         class = "mt-2 flex flex-wrap gap-1">
                        <span v-for = "bucket in personalBillingPreview.bucketUsage"
                              :key = "'personal-billing-bucket-' + bucket.bucket"
                              class = "inline-flex rounded-full border border-black/10 bg-white px-2 py-0.5 text-[11px] text-black/65">
                            {{ formatBillingBucketUsage( bucket ) }}
                        </span>
                    </div>
                </div>

                <div v-for = "group in billingPreviewGroups"
                     :key = "'overview-billing-preview-' + group.groupID"
                     class = "rounded-lg border border-black/10 bg-white/70 p-3 text-sm text-black">
                    <div class = "flex flex-wrap items-center justify-between gap-2">
                        <button type = "button"
                                @click = "togglePreviewBillingGroupExpanded( group.groupID )"
                                class = "inline-flex items-center gap-2 rounded-full px-0 py-1 text-left font-semibold text-black transition hover:text-brand"
                                :aria-expanded = "isPreviewBillingGroupExpanded( group.groupID ) ? 'true' : 'false'">
                            <span>{{ group.groupName || group.groupID }}</span>
                            <i class = "fas text-xs text-brand"
                               :class = "isPreviewBillingGroupExpanded( group.groupID ) ? 'fa-chevron-up' : 'fa-chevron-down'"
                               aria-hidden = "true"></i>
                        </button>
                        <div class = "font-bold">{{ formatTokenAmount( group.dueTokens ) }} tokens</div>
                    </div>
                    <div class = "mt-1 text-black/65">
                        {{ group.userCount }} users, {{ group.projectCount }} projects, balance {{ formatTokenAmount( group.tokenBalance ) }} tokens
                    </div>
                    <div v-if = "group.usersAtRiskCount > 0" class = "mt-1 text-red-600">
                        {{ group.usersAtRiskCount }} users at risk on next missed month.
                    </div>
                    <div v-if = "isPreviewBillingGroupExpanded( group.groupID )"
                         class = "mt-3 space-y-2">
                        <div v-if = "group.users.length === 0"
                             class = "rounded-md border border-black/10 bg-black/[0.02] p-2 text-xs text-black/65">
                            No user-level billing details are available for this group.
                        </div>
                        <div v-for = "user in group.users"
                             :key = "'overview-billing-user-' + group.groupID + '-' + user.identityID + '-' + user.userSub"
                             class = "rounded-md border border-black/10 bg-black/[0.02] p-2">
                            <div class = "flex flex-wrap items-center justify-between gap-2">
                                <div class = "font-semibold">{{ formatBillingPreviewUser( user ) }}</div>
                                <div class = "font-bold">{{ formatTokenAmount( user.dueTokens ) }} tokens</div>
                            </div>
                            <div class = "mt-1 text-xs text-black/60">
                                {{ user.projectCount }} projects billed to this group
                                <span v-if = "user.wouldDeleteOnNextMiss" class = "font-semibold text-red-600">
                                    | would be deleted on next miss
                                </span>
                            </div>
                            <div v-if = "user.bucketUsage.length > 0"
                                 class = "mt-2 flex flex-wrap gap-1">
                                <span v-for = "bucket in user.bucketUsage"
                                      :key = "'overview-billing-bucket-' + group.groupID + '-' + user.identityID + '-' + bucket.bucket"
                                      class = "inline-flex rounded-full border border-black/10 bg-white px-2 py-0.5 text-[11px] text-black/65">
                                    {{ formatBillingBucketUsage( bucket ) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if = "billingPreviewWarnings.length > 0"
                 class = "space-y-1 rounded-md border border-amber-500/60 bg-amber-50 p-2 text-xs text-amber-800">
                <div v-for = "warning in billingPreviewWarnings"
                     :key = "'billing-preview-warning-' + warning">
                    {{ warning }}
                </div>
            </div>
        </div>
    </div>

    <div v-show = "activeTokenTab === 'history'"
         role = "tabpanel"
         class = "flex min-h-0 flex-1 max-w-2xl flex-col gap-8 overflow-hidden pb-6">
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

    <div v-show = "activeTokenTab === 'owned'"
         role = "tabpanel"
         class = "min-h-0 flex-1 space-y-8 overflow-y-auto overscroll-contain pb-6 pr-1">
        <div>
            <div>

                <div v-if = "ownedGroups.length === 0">
                    You do not own any token groups yet.
                </div>

                <ul v-else>
                    <div v-for = "group in ownedGroups"
                         :key = "'owned-token-group-' + group.groupId"
                         class = "border-4 border-brand rounded-lg p-4 mb-4 shadow-black">

                        <div>Group name: <span class = "font-bold">{{ group.groupName }}</span></div>
                        <div>Balance: <span class = "font-bold">{{ group.tokenBalance }}</span> compute tokens</div>
                        <div class = "mt-2 flex flex-wrap items-center gap-2">
                            <button type = "button"
                                    @click = "toggleBillingGroupExpanded( group.groupId )"
                                    class = "inline-flex items-center gap-2 rounded-full border border-brand/70 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white"
                                    :aria-expanded = "isBillingGroupExpanded( group.groupId ) ? 'true' : 'false'">
                                <span>
                                    Upcoming monthly: {{ formatTokenAmount( billingPreviewForGroup( group )?.dueTokens ?? 0 ) }} tokens
                                </span>
                                <i class = "fas"
                                   :class = "isBillingGroupExpanded( group.groupId ) ? 'fa-chevron-up' : 'fa-chevron-down'"
                                   aria-hidden = "true"></i>
                            </button>
                            <span v-if = "billingPreviewForGroup( group )?.usersAtRiskCount > 0"
                                  class = "inline-flex rounded-full border border-red-500/70 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                                {{ billingPreviewForGroup( group ).usersAtRiskCount }} users at risk
                            </span>
                        </div>

                        <div v-if = "isBillingGroupExpanded( group.groupId )"
                             class = "mt-3 rounded-lg border border-black/10 bg-white/70 p-3 text-sm text-black">
                            <template v-if = "billingPreviewForGroup( group )">
                                <div class = "grid gap-2 sm:grid-cols-2">
                                    <div>Projected projects: <span class = "font-bold">{{ billingPreviewForGroup( group ).projectCount }}</span></div>
                                    <div>Projected users: <span class = "font-bold">{{ billingPreviewForGroup( group ).userCount }}</span></div>
                                    <div>Max missed months: <span class = "font-bold">{{ billingPreviewForGroup( group ).maxMissedMonths }}</span></div>
                                    <div>Projected due: <span class = "font-bold">{{ formatTokenAmount( billingPreviewForGroup( group ).dueTokens ) }}</span> tokens</div>
                                </div>

                                <div v-if = "billingPreviewForGroup( group ).users.length > 0"
                                     class = "mt-3 space-y-2">
                                    <div v-for = "user in billingPreviewForGroup( group ).users"
                                         :key = "'billing-user-' + group.groupId + '-' + user.userSub"
                                         class = "rounded-md border border-black/10 bg-black/[0.02] p-2">
                                        <div class = "flex flex-wrap items-center justify-between gap-2">
                                            <div class = "font-semibold">{{ formatBillingPreviewUser( user ) }}</div>
                                            <div class = "font-bold">{{ formatTokenAmount( user.dueTokens ) }} tokens</div>
                                        </div>
                                        <div class = "mt-1 text-xs text-black/60">
                                            {{ user.projectCount }} projects, {{ user.missedMonths }} missed months
                                            <span v-if = "user.wouldDeleteOnNextMiss" class = "font-semibold text-red-600">
                                                | would be deleted on next miss
                                            </span>
                                        </div>
                                        <div v-if = "user.bucketUsage.length > 0"
                                             class = "mt-2 flex flex-wrap gap-1">
                                            <span v-for = "bucket in user.bucketUsage"
                                                  :key = "'billing-bucket-' + group.groupId + '-' + user.userSub + '-' + bucket.bucket"
                                                  class = "inline-flex rounded-full border border-black/10 bg-white px-2 py-0.5 text-[11px] text-black/65">
                                                {{ formatBillingBucketUsage( bucket ) }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </template>
                            <div v-else class = "text-black/65">
                                No billing preview is available for this group.
                            </div>
                        </div>
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

    <div v-show = "activeTokenTab === 'shared'"
         role = "tabpanel"
         class = "min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6 pr-1">
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
</div>
</template>

<script setup>

import { ref, computed, nextTick, onMounted} from "vue"
import { initializePaddle } from '@paddle/paddle-js';
import { auth as authlib, settings as settingslib, tokens, utils} from "@harkana/tools"

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

const createEmptyPersonalBillingPreview = () => {
    return {
        userSub: "",
        identityID: "",
        tokenBalance: 0,
        activeBillingGroupID: null,
        activeBillingGroupIDs: [],
        billedToPersonal: false,
        projectCount: 0,
        dueTokens: 0,
        missedMonths: 0,
        wouldDeleteOnNextMiss: false,
        bucketUsage: []
    }
}

const billingPreview = ref({
    version: "owned-token-group-billing-preview-v1",
    monthKey: "",
    personal: createEmptyPersonalBillingPreview(),
    groups: [],
    warnings: []
})
const billingPreviewLoading = ref(false)
const billingPreviewError = ref("")
const billingPreviewExpanded = ref(false)
const expandedPreviewBillingGroupIDs = ref(new Set())
const expandedBillingGroupIDs = ref(new Set())
const missedMonthsPreview = ref(null)
const missedMonthsLoading = ref(false)
const missedMonthsError = ref("")
const HISTORY_PAGE_SIZE = 50

const billingPreviewGroups = computed(() => {
    return Array.isArray( billingPreview.value?.groups ) ? billingPreview.value.groups : []
})

const personalBillingPreview = computed(() => {
    return billingPreview.value?.personal ?? createEmptyPersonalBillingPreview()
})

const billingPreviewWarnings = computed(() => {
    return Array.isArray( billingPreview.value?.warnings ) ? billingPreview.value.warnings : []
})

const billingPreviewGroupByID = computed(() => {
    const entries = billingPreviewGroups.value
        .map(( group ) => [
            String( group?.groupID ?? "" ).trim(),
            group
        ])
        .filter(( entry ) => entry[0].length > 0 )

    return new Map( entries )
})

const totalGroupBillingDueTokens = computed(() => {
    return billingPreviewGroups.value.reduce(( total, group ) => {
        return total + ( Number( group?.dueTokens ?? 0 ) || 0 )
    }, 0 )
})

const totalBillingDueTokens = computed(() => {
    return totalGroupBillingDueTokens.value + ( Number( personalBillingPreview.value?.dueTokens ?? 0 ) || 0 )
})

const hasBillingPreviewLineItems = computed(() => {
    const personal = personalBillingPreview.value
    return billingPreviewGroups.value.length > 0 ||
        ( Number( personal?.projectCount ?? 0 ) || 0 ) > 0 ||
        ( Number( personal?.dueTokens ?? 0 ) || 0 ) > 0
})

const billingPreviewMonthLabel = computed(() => {
    const monthKey = String( billingPreview.value?.monthKey ?? "" ).trim()
    const match = monthKey.match(/^(\d{4})-(\d{2})$/)
    if( match === null ){
        return "the coming month"
    }

    const parsed = new Date( Number( match[1] ), Number( match[2] ) - 1, 1 )
    if( Number.isFinite( parsed.getTime() ) === false ){
        return monthKey
    }

    return parsed.toLocaleDateString( undefined, {
        year: "numeric",
        month: "long"
    })
})

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

const activeBillingGroupLabels = computed(() => {
    const activeGroupIDs = Array.isArray( personalBillingPreview.value?.activeBillingGroupIDs )
        ? personalBillingPreview.value.activeBillingGroupIDs
        : []
    const legacyGroupID = String( personalBillingPreview.value?.activeBillingGroupID ?? "" ).trim()
    const groupIDs = [ ...activeGroupIDs, legacyGroupID ]
        .map(( groupID ) => String( groupID ?? "" ).trim() )
        .filter(( groupID ) => groupID.length > 0 )

    return [ ...new Set( groupIDs ) ].map(( groupID ) => {
        return tokenGroupNameByID.value.get( groupID ) ?? groupID
    })
})

const activeBillingGroupSummary = computed(() => {
    const labels = activeBillingGroupLabels.value
    if( labels.length === 0 ){
        return ""
    }

    if( labels.length === 1 ){
        return labels[0]
    }

    if( labels.length === 2 ){
        return `${labels[0]} and ${labels[1]}`
    }

    return `${labels.slice( 0, -1 ).join( ", " )}, and ${labels[labels.length - 1]}`
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

const formatTokenAmount = ( value ) => {
    const numeric = Number( value )
    if( Number.isFinite( numeric ) === false ){
        return "0"
    }

    return Number.isInteger( numeric )
        ? String( numeric )
        : numeric.toFixed( 2 ).replace(/\.?0+$/, "" )
}

const formatBillingPreviewUser = ( user ) => {
    const givenName = String( user?.given_name ?? "" ).trim()
    const familyName = String( user?.family_name ?? "" ).trim()
    const email = String( user?.email ?? "" ).trim()
    const identityID = String( user?.identityID ?? "" ).trim()
    const userSub = String( user?.userSub ?? "" ).trim()
    const name = [ givenName, familyName ].filter(( value ) => value.length > 0 ).join( " " )

    if( name.length > 0 && email.length > 0 ){
        return `${name} - ${email}`
    }

    return name || email || identityID || userSub || "Unknown user"
}

const formatBillingBucketUsage = ( bucket ) => {
    const name = String( bucket?.name ?? bucket?.bucket ?? "" ).trim() || "unknown"
    const projectCount = Number( bucket?.projectCount ?? 0 ) || 0
    const monthlyProjectTokenCost = Number( bucket?.monthlyProjectTokenCost ?? 0 ) || 0
    const tokensDue = Number( bucket?.tokensDue ?? 0 ) || 0
    const monthlyCostText = monthlyProjectTokenCost > 0
        ? ` at ${formatTokenAmount( monthlyProjectTokenCost )} tokens/project`
        : ""

    return `${name}: ${projectCount} projects${monthlyCostText}, ${formatTokenAmount( tokensDue )} tokens`
}

const billingPreviewForGroup = ( group ) => {
    const groupID = String( group?.groupId ?? group?.groupID ?? "" ).trim()
    if( groupID.length === 0 ){
        return null
    }

    return billingPreviewGroupByID.value.get( groupID ) ?? null
}

const isPreviewBillingGroupExpanded = ( groupID ) => {
    return expandedPreviewBillingGroupIDs.value.has( String( groupID ?? "" ).trim() )
}

const togglePreviewBillingGroupExpanded = ( groupID ) => {
    const normalizedGroupID = String( groupID ?? "" ).trim()
    if( normalizedGroupID.length === 0 ){
        return
    }

    const next = new Set( expandedPreviewBillingGroupIDs.value )
    if( next.has( normalizedGroupID ) ){
        next.delete( normalizedGroupID )
    } else {
        next.add( normalizedGroupID )
    }
    expandedPreviewBillingGroupIDs.value = next
}

const isBillingGroupExpanded = ( groupID ) => {
    return expandedBillingGroupIDs.value.has( String( groupID ?? "" ).trim() )
}

const toggleBillingGroupExpanded = ( groupID ) => {
    const normalizedGroupID = String( groupID ?? "" ).trim()
    if( normalizedGroupID.length === 0 ){
        return
    }

    const next = new Set( expandedBillingGroupIDs.value )
    if( next.has( normalizedGroupID ) ){
        next.delete( normalizedGroupID )
    } else {
        next.add( normalizedGroupID )
    }
    expandedBillingGroupIDs.value = next
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

const mapBillingPreviewError = ( error, fallbackMessage = "Failed to load billing preview." ) => {

    const status = Number.parseInt( String( error?.status ?? "" ), 10 )
    const detail = String( error?.detail ?? error?.message ?? "" ).trim()

    if( status === 400 ){
        return detail.length > 0 ? detail : "Invalid billing preview request."
    }

    if( status === 401 ){
        return "You are not authenticated. Please sign in again."
    }

    if( detail.length > 0 ){
        return detail
    }

    return fallbackMessage
}

const loadBillingPreview = async () => {

    billingPreviewLoading.value = true
    billingPreviewError.value = ""
    missedMonthsError.value = ""

    try{
        const response = await tokens.getOwnedGroupsBillingPreview()
        if( import.meta.env.DEV ){
            console.log( "Owned token group billing estimate response:", response )
        }
        billingPreview.value = {
            version: "owned-token-group-billing-preview-v1",
            monthKey: String( response?.monthKey ?? "" ),
            personal: response?.personal ?? createEmptyPersonalBillingPreview(),
            groups: Array.isArray( response?.groups ) ? response.groups : [],
            warnings: Array.isArray( response?.warnings ) ? response.warnings : []
        }
    } catch( error ){
        billingPreview.value = {
            version: "owned-token-group-billing-preview-v1",
            monthKey: "",
            personal: createEmptyPersonalBillingPreview(),
            groups: [],
            warnings: []
        }
        billingPreviewError.value = mapBillingPreviewError( error )
    } finally {
        billingPreviewLoading.value = false
    }

    missedMonthsLoading.value = true
    try{
        missedMonthsPreview.value = await tokens.getBillingMissedMonths()
    } catch( error ){
        missedMonthsPreview.value = null
        missedMonthsError.value = mapBillingPreviewError( error, "Failed to load missed billing month status." )
    } finally {
        missedMonthsLoading.value = false
    }
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
    await loadBillingPreview()
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
    await loadBillingPreview()
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
    const profile = await authlib.getCurrentUserProfile()
    if( profile.sub.length === 0 ){
        throw new Error( "Could not resolve the authenticated user." )
    }
    const custom = { userID: profile.sub, groupID: groupID}
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
    await loadBillingPreview()
    await loadOwnedHistoryGroupsSummary()

    await loadHistory( true )

    console.log( newTokenGroupName.value )

    await nextTick()
    await utils.wait( 100 )
})

</script>
