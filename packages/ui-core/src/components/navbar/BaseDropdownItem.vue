<template>
<li>
    <button @click = "handleSelect"
            @click.middle = "handleSelect"
            :title = "tooltip"
            :aria-disabled = "disabled ? 'true' : 'false'"
            :tabindex = "disabled ? -1 : 0"
            class = "block w-full px-4 py-2 text-left text-sm transition"
            :class = "buttonClass">
        <slot></slot>
    </button>
</li>
</template>

<script setup>

import { computed } from "vue"

const props = defineProps({
    disabled: { type: Boolean, default: false },
    tooltip: { type: String, default: "" },
    dimmed: { type: Boolean, default: false }
})

const emit = defineEmits([ "select" ])

const buttonClass = computed(() => {
    if( props.disabled ){
        return "text-white/45 cursor-not-allowed hover:bg-transparent hover:text-white/45"
    }

    if( props.dimmed ){
        return "text-white/35 hover:bg-transparent hover:text-white/35"
    }

    return "text-white hover:bg-brand hover:text-white"
})

const handleSelect = ( event ) => {
    if( props.disabled ){
        event.preventDefault()
        event.stopPropagation()
        return
    }

    emit( "select", event )
}

</script>
