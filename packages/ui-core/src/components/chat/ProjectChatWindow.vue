<template>
	<div v-if = "modelValue"
		 ref = "panel"
		 class = "fixed z-[140] w-[min(26rem,calc(100vw-1rem))] h-[min(36rem,calc(100vh-1rem))] rounded-lg border border-gray bg-dark-gray shadow-2xl overflow-hidden flex flex-col"
		 :style = "panelStyles"
		 @keydown.esc.stop.prevent = "close">

		<header class = "px-4 py-3 border-b border-gray bg-gray-800/80 cursor-move select-none flex items-start justify-between gap-3"
				@mousedown = "startDragging">
			<div class = "min-w-0">
				<h3 class = "text-sm font-semibold text-white truncate">Project notes</h3>
				<p class = "text-xs text-white/70 truncate">{{ chatContextLine }}</p>
			</div>

			<button class = "h-8 w-8 inline-flex items-center justify-center rounded-md text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand"
					title = "Close notes"
					aria-label = "Close notes"
					@mousedown.stop
					@click = "close">
				<i class = "fas fa-times" aria-hidden = "true"></i>
			</button>
		</header>

		<div class = "flex-1 min-h-0 flex flex-col">
			<div ref = "messageList"
				 class = "flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2 bg-gray-800/40">
				<button v-if = "nextCursor"
						class = "w-full rounded border border-gray-600 px-3 py-1 text-xs font-medium text-white transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60 mb-2"
						:disabled = "loadingOlder"
						@click = "loadOlderMessages">
					{{ loadingOlder ? "Loading older messages..." : "Load older messages" }}
				</button>

				<div v-if = "loadingInitial"
					 class = "h-full flex items-center justify-center text-sm text-white/70">
					Loading notes...
				</div>

				<div v-else-if = "messages.length === 0"
					 class = "h-full flex items-center justify-center text-sm text-white/70 text-center px-4">
					No notes yet.
				</div>

				<div v-for = "message in messages"
					 :key = "message.messageId"
					 class = "flex flex-col"
					 :class = "isOwnMessage( message ) ? 'items-end' : 'items-start'">
					<p v-if = "!isOwnMessage( message )"
					   class = "text-[11px] text-white/70 px-1 mb-1">
						{{ authorDisplayName( message.author ) }}
					</p>

					<div class = "max-w-[88%] rounded-lg px-3 py-2 text-sm break-words whitespace-pre-wrap"
						 :class = "messageBubbleClasses( message )">
						<p v-if = "message.deleted" class = "italic">This message was deleted.</p>
						<div v-else>
							<template v-for = "(segment, segmentIndex) in messageBodySegments( message )"
									  :key = "`${message.messageId}-segment-${segmentIndex}`">
								<span v-if = "segment.type === 'text'">{{ segment.content }}</span>
								<a v-else-if = "segment.type === 'link'"
								   :href = "segment.href"
								   target = "_blank"
								   rel = "noopener noreferrer"
								   class = "underline decoration-brand/80 underline-offset-2 text-brand hover:text-brand/80 break-all">{{ segment.content }}</a>
								<span v-else-if = "segment.type === 'inline'" v-html = "segment.html"></span>
								<div v-else class = "overflow-x-auto" v-html = "segment.html"></div>
							</template>
						</div>
					</div>

					<div class = "mt-1 px-1 flex items-center gap-2 text-[10px] text-white/60">
						<span>{{ formatTimestamp( message.createdAt ) }}</span>
						<span v-if = "message.deleted && message.deletedAt">
							Deleted {{ formatTimestamp( message.deletedAt ) }}
						</span>
						<button v-if = "canDeleteMessage( message ) && !message.deleted"
								class = "text-white/70 transition hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
								:disabled = "isDeletingMessage( message.messageId )"
								@click = "removeMessage( message )">
							{{ isDeletingMessage( message.messageId ) ? "Deleting..." : "Delete" }}
						</button>
					</div>
				</div>
			</div>

			<div class = "border-t border-gray p-3 bg-gray-800/80">
				<p v-if = "errorMessage.length > 0" class = "text-xs text-red-400 mb-2">
					{{ errorMessage }}
				</p>

				<div v-if = "hasDraftLatexPreview"
					 class = "mb-2 rounded border border-gray-600 bg-gray-700/40 p-2">
					<p class = "text-[11px] font-semibold uppercase tracking-wide text-white/70 mb-1">
						Preview
					</p>
					<div class = "text-sm text-white break-words whitespace-pre-wrap">
						<template v-for = "(segment, segmentIndex) in draftPreviewSegments"
								  :key = "`draft-preview-segment-${segmentIndex}`">
							<span v-if = "segment.type === 'text'">{{ segment.content }}</span>
							<a v-else-if = "segment.type === 'link'"
							   :href = "segment.href"
							   target = "_blank"
							   rel = "noopener noreferrer"
							   class = "underline decoration-brand/80 underline-offset-2 text-brand hover:text-brand/80 break-all">{{ segment.content }}</a>
							<span v-else-if = "segment.type === 'inline'" v-html = "segment.html"></span>
							<div v-else class = "overflow-x-auto" v-html = "segment.html"></div>
						</template>
					</div>
				</div>

				<div class = "flex items-end gap-2">
					<textarea v-model = "draft"
							  rows = "2"
							  maxlength = "4000"
							  class = "flex-1 resize-none rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand"
							  placeholder = "Write a note..."
							  @keydown = "handleComposerKeydown"></textarea>

					<button class = "h-10 px-4 rounded bg-brand text-white text-sm font-medium transition hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-60"
							:disabled = "sending || draftTrimmed.length === 0 || draftTrimmed.length > 4000"
							@click = "sendMessage">
						{{ sending ? "Sending..." : "Send" }}
					</button>
				</div>

				<div class = "mt-1 text-[10px] text-white/60 text-right">
					{{ draftTrimmed.length }}/4000
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>

import { ref, computed, watch, nextTick, onBeforeUnmount } from "vue"
import { Amplify } from "aws-amplify"
import { chat } from "@harkana/tools"
import katex from "katex"
import { useFloatingPanel } from "../../composables/useFloatingPanel.js"

const Auth = Amplify.Auth
const PAGE_LIMIT = 50
const messageBodySegmentCache = new Map()

const props = defineProps({
	modelValue: { type: Boolean, default: false },
	project: { type: Object, required: true },
	dataType: { type: String, default: "" },
	pollIntervalMs: { type: Number, default: 10000 }
})

const emit = defineEmits([ "update:modelValue" ])

const panel = ref(null)
const messageList = ref(null)

const {
	panelStyles,
	startDragging
} = useFloatingPanel({
	panel,
	isOpen: computed(() => props.modelValue),
	defaultWidth: 420,
	defaultHeight: 560,
	placement: "bottom-right"
})

const currentUserSub = ref("")
const messages = ref([])
const nextCursor = ref(null)
const loadingInitial = ref(false)
const loadingOlder = ref(false)
const sending = ref(false)
const deletingMessageIDs = ref(new Set())
const draft = ref("")
const errorMessage = ref("")
const hasLoadedOlderHistory = ref(false)
const pollingInFlight = ref(false)
const activeOpenRequestID = ref(0)
const pollTimerID = ref(null)

const resolvedDataType = computed(() => {
	const explicitDataType = String( props.dataType ?? "" ).trim()
	if( explicitDataType.length > 0 ){
		return explicitDataType
	}

	return String( import.meta.env.VITE_DATA_TYPE ?? "" ).trim()
})

const draftTrimmed = computed(() => {
	return String( draft.value ?? "" ).trim()
})

const chatContextLine = computed(() => {
	const projectName = String( props.project?.name ?? props.project?.id ?? "" ).trim()
	const dataType = resolvedDataType.value.toUpperCase()

	if( projectName.length > 0 && dataType.length > 0 ){
		return `${projectName} • ${dataType}`
	}

	return projectName.length > 0 ? projectName : dataType
})

const projectOwnerSub = computed(() => {
	const explicitOwnerSub = String( props.project?.owner?.sub ?? "" ).trim()
	if( explicitOwnerSub.length > 0 ){
		return explicitOwnerSub
	}

	const sharedProjectKey = String( props.project?.shareInfo?.projectKey ?? props.project?.id ?? "" ).trim()
	const delimiterIndex = sharedProjectKey.indexOf( "#" )
	if( delimiterIndex > 0 ){
		return sharedProjectKey.slice( 0, delimiterIndex )
	}

	return ""
})

const close = () => {
	emit( "update:modelValue", false )
}

const parseStatusCode = ( error ) => {
	const message = String( error?.message ?? "" )
	const matches = message.match( /API error\s+(\d{3})/ )
	if( matches === null ) return null

	const parsedStatus = Number.parseInt( matches[1], 10 )
	return Number.isFinite( parsedStatus ) ? parsedStatus : null
}

const resolveErrorMessage = ( error, fallbackMessage ) => {
	const statusCode = parseStatusCode( error )

	if( statusCode === 400 ) return "The request was invalid. Please refresh and try again."
	if( statusCode === 401 ) return "Your session expired. Please sign in again."
	if( statusCode === 403 ) return "You do not have permission for these notes."
	if( statusCode === 404 ) return "The requested message was not found."
	if( statusCode === 500 ) return "Server error while processing notes. Please try again."

	const message = String( error?.message ?? "" ).trim()
	return message.length > 0 ? message : fallbackMessage
}

const parseIsoTimestamp = ( timestamp ) => {
	const rawTimestamp = String( timestamp ?? "" ).trim()
	if( rawTimestamp.length === 0 ){
		return Number.NaN
	}

	const microsecondNormalized = rawTimestamp.replace( /(\.\d{3})\d+/, "$1" )
	const parsedMicrosecond = Date.parse( microsecondNormalized )
	if( Number.isFinite( parsedMicrosecond ) ){
		return parsedMicrosecond
	}

	const secondNormalized = rawTimestamp.replace( /\.\d+(?=[+-]\d{2}:\d{2}|Z$)/, "" )
	return Date.parse( secondNormalized )
}

const normalizeMessages = ( incomingMessages ) => {
	if( Array.isArray( incomingMessages ) === false ) return []

	return incomingMessages.filter(( message ) => {
		return String( message?.messageId ?? "" ).trim().length > 0
	})
}

const sortMessages = ( unsortedMessages ) => {
	const safeMessages = Array.isArray( unsortedMessages ) ? unsortedMessages.slice() : []

	return safeMessages.sort(( leftMessage, rightMessage ) => {
		const leftTimestamp = parseIsoTimestamp( leftMessage?.createdAt )
		const rightTimestamp = parseIsoTimestamp( rightMessage?.createdAt )

		if( Number.isFinite( leftTimestamp ) && Number.isFinite( rightTimestamp ) && leftTimestamp !== rightTimestamp ){
			return leftTimestamp - rightTimestamp
		}

		const leftMessageID = String( leftMessage?.messageId ?? "" )
		const rightMessageID = String( rightMessage?.messageId ?? "" )
		return leftMessageID.localeCompare( rightMessageID )
	})
}

const setMessages = ( incomingMessages ) => {
	const deduplicatedMessages = new Map()

	for( const message of normalizeMessages( incomingMessages )){
		const messageID = String( message.messageId )
		deduplicatedMessages.set( messageID, message )
	}

	messages.value = sortMessages( Array.from( deduplicatedMessages.values() ))
}

const mergeMessages = ( incomingMessages ) => {
	const mergedMessages = new Map()

	for( const currentMessage of messages.value ){
		const messageID = String( currentMessage?.messageId ?? "" )
		if( messageID.length === 0 ) continue
		mergedMessages.set( messageID, currentMessage )
	}

	for( const incomingMessage of normalizeMessages( incomingMessages )){
		const messageID = String( incomingMessage.messageId )
		const previousMessage = mergedMessages.get( messageID ) ?? {}
		mergedMessages.set( messageID, {
			...previousMessage,
			...incomingMessage
		})
	}

	messages.value = sortMessages( Array.from( mergedMessages.values() ))
}

const authorDisplayName = ( author ) => {
	const givenName = String( author?.givenName ?? "" ).trim()
	const familyName = String( author?.familyName ?? "" ).trim()
	const fullName = `${givenName} ${familyName}`.trim()

	if( fullName.length > 0 ){
		return fullName
	}

	const email = String( author?.email ?? "" ).trim()
	if( email.length > 0 ){
		return email
	}

	return String( author?.sub ?? "Unknown user" )
}

const formatTimestamp = ( timestamp ) => {
	const parsedTimestamp = parseIsoTimestamp( timestamp )
	if( Number.isNaN( parsedTimestamp ) ){
		return String( timestamp ?? "" )
	}

	const date = new Date( parsedTimestamp )
	const month = date.toLocaleString( "en-US", { month: "long" })
	const day = String( date.getDate() )
	const year = String( date.getFullYear() )
	const time = date.toLocaleTimeString()

	return `${month}/${day}/${year} ${time}`
}

const isOwnMessage = ( message ) => {
	const authorSub = String( message?.author?.sub ?? "" ).trim()
	const userSub = String( currentUserSub.value ?? "" ).trim()
	if( authorSub.length === 0 || userSub.length === 0 ){
		return false
	}

	return authorSub === userSub
}

const canDeleteMessage = ( message ) => {
	if( message?.deleted === true ){
		return false
	}

	const authorSub = String( message?.author?.sub ?? "" ).trim()
	const userSub = String( currentUserSub.value ?? "" ).trim()
	if( authorSub.length > 0 && authorSub === userSub ){
		return true
	}

	const ownerSub = String( projectOwnerSub.value ?? "" ).trim()
	return ownerSub.length > 0 && ownerSub === userSub
}

const isDeletingMessage = ( messageID ) => {
	return deletingMessageIDs.value.has( String( messageID ?? "" ))
}

const setDeletingMessage = ( messageID, deleting ) => {
	const normalizedMessageID = String( messageID ?? "" ).trim()
	if( normalizedMessageID.length === 0 ) return

	const nextDeletingIDs = new Set( deletingMessageIDs.value )
	if( deleting ){
		nextDeletingIDs.add( normalizedMessageID )
	} else {
		nextDeletingIDs.delete( normalizedMessageID )
	}

	deletingMessageIDs.value = nextDeletingIDs
}

const messageBubbleClasses = ( message ) => {
	if( message?.deleted === true ){
		return "bg-gray-700 text-white/70"
	}

	if( isOwnMessage( message )){
		return "bg-transparent border border-brand text-white"
	}

	return "bg-gray-700 text-white"
}

const renderLatex = ( expression, displayMode ) => {
	try{
		return katex.renderToString( String( expression ?? "" ), {
			displayMode,
			throwOnError: false
		})
	} catch( error ){
		console.log( error )
		return String( expression ?? "" )
	}
}

const findInlineLatexCloseIndex = ( input, startIndex ) => {
	for( let index = startIndex; index < input.length; index++ ){
		if( input[index] !== "$" ) continue
		if( input[index - 1] === "\\" ) continue
		if( input[index + 1] === "$" ) continue
		return index
	}

	return -1
}

const parseMessageBodySegments = ( body ) => {
	const input = String( body ?? "" )
	const segments = []

	const appendTextPiece = ( content ) => {
		const text = String( content ?? "" )
		if( text.length === 0 ) return

		const previousSegment = segments[ segments.length - 1 ]
		if( previousSegment?.type === "text" ){
			previousSegment.content += text
			return
		}

		segments.push({
			type: "text",
			content: text
		})
	}

	const appendLink = ( href ) => {
		const url = String( href ?? "" )
		if( url.length === 0 ) return

		segments.push({
			type: "link",
			content: url,
			href: url
		})
	}

	const appendText = ( text ) => {
		const content = String( text ?? "" )
		if( content.length === 0 ) return

		const splitParts = content.split( /(\s+)/ )
		for( const part of splitParts ){
			if( part.length === 0 ) continue
			if( /\s+/.test( part )){
				appendTextPiece( part )
				continue
			}

			if( part.startsWith( "https://" )){
				appendLink( part )
				continue
			}

			appendTextPiece( part )
		}
	}

	let index = 0
	while( index < input.length ){
		if( input.startsWith( "$$", index )){
			const closeIndex = input.indexOf( "$$", index + 2 )
			if( closeIndex === -1 ){
				appendText( "$$" )
				index += 2
				continue
			}

			const expression = input.slice( index + 2, closeIndex ).trim()
			if( expression.length === 0 ){
				appendText( "$$$$" )
				index = closeIndex + 2
				continue
			}

			segments.push({
				type: "display",
				html: renderLatex( expression, true )
			})
			index = closeIndex + 2
			continue
		}

		if( input[index] === "$" ){
			const closeIndex = findInlineLatexCloseIndex( input, index + 1 )
			if( closeIndex === -1 ){
				appendText( "$" )
				index += 1
				continue
			}

			const expression = input.slice( index + 1, closeIndex ).trim()
			if( expression.length === 0 ){
				appendText( "$$" )
				index = closeIndex + 1
				continue
			}

			segments.push({
				type: "inline",
				html: renderLatex( expression, false )
			})
			index = closeIndex + 1
			continue
		}

		const nextLatexStart = input.indexOf( "$", index )
		if( nextLatexStart === -1 ){
			appendText( input.slice( index ))
			break
		}

		appendText( input.slice( index, nextLatexStart ))
		index = nextLatexStart
	}

	if( segments.length === 0 ){
		return [{
			type: "text",
			content: input
		}]
	}

	return segments
}

const messageBodySegments = ( message ) => {
	const messageID = String( message?.messageId ?? "" )
	const body = String( message?.body ?? "" )
	const cacheKey = `${messageID}:${body}`
	const cachedSegments = messageBodySegmentCache.get( cacheKey )
	if( cachedSegments !== undefined ){
		return cachedSegments
	}

	const parsedSegments = parseMessageBodySegments( body )
	messageBodySegmentCache.set( cacheKey, parsedSegments )
	return parsedSegments
}

const draftPreviewSegments = computed(() => {
	return parseMessageBodySegments( draft.value )
})

const hasDraftLatexPreview = computed(() => {
	if( String( draft.value ?? "" ).length === 0 ){
		return false
	}

	return draftPreviewSegments.value.some(( segment ) => {
		return segment.type === "inline" || segment.type === "display" || segment.type === "link"
	})
})

const isNearBottom = () => {
	const listElement = messageList.value
	if( listElement === null ) return true

	const distanceFromBottom = listElement.scrollHeight - listElement.scrollTop - listElement.clientHeight
	return distanceFromBottom < 80
}

const scrollToBottom = () => {
	const listElement = messageList.value
	if( listElement === null ) return

	listElement.scrollTop = listElement.scrollHeight
}

const loadCurrentUserSub = async () => {
	try{
		const user = await Auth.currentAuthenticatedUser()
		currentUserSub.value = String( user?.attributes?.sub ?? "" ).trim()
	} catch{
		currentUserSub.value = ""
	}
}

const loadInitialMessages = async () => {
	const openRequestID = activeOpenRequestID.value + 1
	activeOpenRequestID.value = openRequestID

	loadingInitial.value = true
	errorMessage.value = ""
	hasLoadedOlderHistory.value = false
	nextCursor.value = null

	try{
		await loadCurrentUserSub()

		const response = await chat.listMessages( props.project, {
			dataType: resolvedDataType.value,
			limit: PAGE_LIMIT
		})

		if( openRequestID !== activeOpenRequestID.value ) return

		setMessages( response?.messages ?? [] )
		nextCursor.value = response?.nextCursor ?? null

		await nextTick()
		scrollToBottom()
	} catch( error ){
		if( openRequestID !== activeOpenRequestID.value ) return
		errorMessage.value = resolveErrorMessage( error, "Failed to load notes." )
	} finally {
		if( openRequestID === activeOpenRequestID.value ){
			loadingInitial.value = false
		}
	}
}

const pollLatestMessages = async () => {
	if( props.modelValue === false ) return
	if( pollingInFlight.value ) return
	if( loadingInitial.value ) return

	pollingInFlight.value = true
	const shouldStickToBottom = isNearBottom()

	try{
		const response = await chat.listMessages( props.project, {
			dataType: resolvedDataType.value,
			limit: PAGE_LIMIT
		})

		mergeMessages( response?.messages ?? [] )
		if( hasLoadedOlderHistory.value === false ){
			nextCursor.value = response?.nextCursor ?? null
		}

		if( shouldStickToBottom ){
			await nextTick()
			scrollToBottom()
		}
	} catch( error ){
		console.log( error )
	} finally {
		pollingInFlight.value = false
	}
}

const startPolling = () => {
	if( pollTimerID.value !== null ){
		clearInterval( pollTimerID.value )
	}

	if( props.modelValue === false ) return

	pollTimerID.value = setInterval(() => {
		void pollLatestMessages()
	}, Number( props.pollIntervalMs ?? 10000 ))
}

const stopPolling = () => {
	if( pollTimerID.value === null ) return

	clearInterval( pollTimerID.value )
	pollTimerID.value = null
}

const loadOlderMessages = async () => {
	if( loadingOlder.value ) return
	if( nextCursor.value === null ) return

	loadingOlder.value = true
	errorMessage.value = ""
	hasLoadedOlderHistory.value = true

	const listElement = messageList.value
	const previousScrollHeight = listElement?.scrollHeight ?? 0
	const previousScrollTop = listElement?.scrollTop ?? 0

	try{
		const response = await chat.listMessages( props.project, {
			dataType: resolvedDataType.value,
			limit: PAGE_LIMIT,
			cursor: nextCursor.value
		})

		mergeMessages( response?.messages ?? [] )
		nextCursor.value = response?.nextCursor ?? null

		await nextTick()

		if( listElement !== null ){
			const nextScrollHeight = listElement.scrollHeight
			listElement.scrollTop = Math.max( 0, nextScrollHeight - previousScrollHeight + previousScrollTop )
		}
	} catch( error ){
		errorMessage.value = resolveErrorMessage( error, "Failed to load older notes." )
	} finally {
		loadingOlder.value = false
	}
}

const sendMessage = async () => {
	if( sending.value ) return

	const body = draftTrimmed.value
	if( body.length === 0 ) return
	if( body.length > 4000 ){
		errorMessage.value = "Message body must be at most 4000 characters."
		return
	}

	sending.value = true
	errorMessage.value = ""

	try{
		const createdMessage = await chat.createMessage( props.project, { body }, resolvedDataType.value )
		draft.value = ""
		mergeMessages([ createdMessage ])

		await nextTick()
		scrollToBottom()
	} catch( error ){
		errorMessage.value = resolveErrorMessage( error, "Failed to send message." )
	} finally {
		sending.value = false
	}
}

const removeMessage = async ( message ) => {
	const messageID = String( message?.messageId ?? "" ).trim()
	if( messageID.length === 0 ) return
	if( canDeleteMessage( message ) === false ) return
	if( isDeletingMessage( messageID )) return

	setDeletingMessage( messageID, true )
	errorMessage.value = ""

	try{
		await chat.deleteMessage( props.project, messageID, resolvedDataType.value )
		mergeMessages([{
			...message,
			body: null,
			deleted: true,
			deletedAt: new Date().toISOString()
		}])
	} catch( error ){
		errorMessage.value = resolveErrorMessage( error, "Failed to delete message." )
	} finally {
		setDeletingMessage( messageID, false )
	}
}

const handleComposerKeydown = ( event ) => {
	if( event.key !== "Enter" ) return
	if( event.shiftKey ) return

	event.preventDefault()
	void sendMessage()
}

watch( () => props.modelValue, async ( nextOpen ) => {
	if( nextOpen ){
		await loadInitialMessages()
		startPolling()
		return
	}

	activeOpenRequestID.value += 1
	stopPolling()
}, { immediate: true })

watch(
	[ () => props.project?.id, resolvedDataType ],
	async () => {
		if( props.modelValue === false ) return

		await loadInitialMessages()
		startPolling()
	}
)

onBeforeUnmount(() => {
	stopPolling()
})
</script>
