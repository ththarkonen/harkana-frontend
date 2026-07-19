import { computed, nextTick, onBeforeUnmount, onMounted, ref, unref, watch } from "vue"

const DEFAULT_WINDOW_MARGIN = 8

function resolveElement( value ){
	const resolved = unref( value )
	if( resolved !== null && typeof resolved === "object" && "value" in resolved ){
		return unref( resolved.value )
	}
	return resolved
}

function useFloatingPanel({
	panel,
	isOpen,
	anchorElement = null,
	placement = "bottom-right",
	windowMargin = DEFAULT_WINDOW_MARGIN,
	defaultWidth = 420,
	defaultHeight = 560,
	resetPositionOnClose = false
} = {}){
	const panelPosition = ref({ left: windowMargin, top: windowMargin })
	const hasInitializedPosition = ref(false)
	const isDragging = ref(false)
	const dragOffset = ref({ x: 0, y: 0 })

	const panelStyles = computed(() => ({
		left: `${panelPosition.value.left}px`,
		top: `${panelPosition.value.top}px`
	}))

	const clampPanelPosition = ( left, top ) => {
		const panelElement = resolveElement( panel )
		const width = panelElement?.offsetWidth ?? defaultWidth
		const height = panelElement?.offsetHeight ?? defaultHeight
		const viewportWidth = typeof window !== "undefined" ? window.innerWidth : width + ( windowMargin * 2 )
		const viewportHeight = typeof window !== "undefined" ? window.innerHeight : height + ( windowMargin * 2 )
		const maxLeft = Math.max( windowMargin, viewportWidth - width - windowMargin )
		const maxTop = Math.max( windowMargin, viewportHeight - height - windowMargin )

		return {
			left: Math.min( Math.max( windowMargin, left ), maxLeft ),
			top: Math.min( Math.max( windowMargin, top ), maxTop )
		}
	}

	const preferredAnchorPosition = () => {
		const anchor = resolveElement( anchorElement )
		const anchorRect = typeof anchor?.getBoundingClientRect === "function"
			? anchor.getBoundingClientRect()
			: null
		if( anchorRect === null ){
			return null
		}

		if( placement === "anchor-top-left" ){
			return {
				left: anchorRect.left + windowMargin,
				top: anchorRect.top + windowMargin
			}
		}

		if( placement === "anchor-right" ){
			const sidebarRect = typeof anchor?.closest === "function"
				? anchor.closest( "aside" )?.getBoundingClientRect?.() ?? null
				: null
			const leftAnchor = sidebarRect?.right ?? anchorRect.right
			const gap = Math.max( windowMargin, Math.min( 24, Math.abs( leftAnchor - anchorRect.right ) || windowMargin ))

			return {
				left: leftAnchor + gap,
				top: anchorRect.top
			}
		}

		return null
	}

	const preferredPosition = () => {
		if( placement === "anchor-right" || placement === "anchor-top-left" ){
			const anchoredPosition = preferredAnchorPosition()
			if( anchoredPosition !== null ){
				return anchoredPosition
			}
		}

		const panelElement = resolveElement( panel )
		const width = panelElement?.offsetWidth ?? defaultWidth
		const height = panelElement?.offsetHeight ?? defaultHeight
		const viewportWidth = typeof window !== "undefined" ? window.innerWidth : width + ( windowMargin * 2 )
		const viewportHeight = typeof window !== "undefined" ? window.innerHeight : height + ( windowMargin * 2 )

		return {
			left: viewportWidth - width - windowMargin,
			top: viewportHeight - height - windowMargin
		}
	}

	const initializePanelPosition = async () => {
		await nextTick()
		const preferred = preferredPosition()
		panelPosition.value = clampPanelPosition( preferred.left, preferred.top )
		hasInitializedPosition.value = true
	}

	const startDragging = ( event ) => {
		if( event.button !== 0 ) return

		isDragging.value = true
		dragOffset.value = {
			x: event.clientX - panelPosition.value.left,
			y: event.clientY - panelPosition.value.top
		}

		event.preventDefault()
	}

	const onMouseMove = ( event ) => {
		if( isDragging.value === false ) return

		panelPosition.value = clampPanelPosition(
			event.clientX - dragOffset.value.x,
			event.clientY - dragOffset.value.y
		)
	}

	const onMouseUp = () => {
		isDragging.value = false
	}

	const onWindowResize = () => {
		panelPosition.value = clampPanelPosition( panelPosition.value.left, panelPosition.value.top )
	}

	watch(
		() => unref( isOpen ) === true,
		async ( nextOpen ) => {
			if( nextOpen ){
				if( hasInitializedPosition.value === false ){
					await initializePanelPosition()
				}else{
					panelPosition.value = clampPanelPosition( panelPosition.value.left, panelPosition.value.top )
				}
				return
			}

			isDragging.value = false
			if( resetPositionOnClose ){
				hasInitializedPosition.value = false
			}
		},
		{ immediate: true }
	)

	onMounted(() => {
		window.addEventListener( "mousemove", onMouseMove )
		window.addEventListener( "mouseup", onMouseUp )
		window.addEventListener( "resize", onWindowResize )
	})

	onBeforeUnmount(() => {
		window.removeEventListener( "mousemove", onMouseMove )
		window.removeEventListener( "mouseup", onMouseUp )
		window.removeEventListener( "resize", onWindowResize )
	})

	return {
		panelPosition,
		panelStyles,
		startDragging,
		initializePanelPosition,
		clampPanelPosition
	}
}

export { useFloatingPanel }
