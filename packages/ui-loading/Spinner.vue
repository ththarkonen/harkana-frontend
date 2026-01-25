<template>
    <div class = "inline-flex items-center justify-center">
        <div
            class = "rounded-full animate-spin"
            :style = "{
                width: size + 'rem',
                height: size + 'rem',
                borderTop: borderThickness + 'px solid ' + color,
                borderRight: borderThickness + 'px solid black/30',
                borderBottom: borderThickness + 'px solid black/30',
                borderLeft: borderThickness + 'px solid black/30'}">
        </div>
    </div>
</template>

<script setup>

const props = defineProps({
    size: { type: Number, default: 4},
    borderThickness: { type: Number, default: 6},
    color: { type: String, default: 'currentColor'}
})

</script>



