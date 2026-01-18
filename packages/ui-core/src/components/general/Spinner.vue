<template>
    <div class="inline-flex items-center justify-center">
        <!-- Circular spinner -->
        <div
            v-if="mode === 'loading'"
            class="
                animate-spin
                rounded-full
                border-2
                border-white/30
                border-t-current
                w-full h-full
            "
        ></div>

        <!-- Upload loader -->
        <div
            v-if="mode === 'upload'"
            class="
                flex items-end gap-1
                w-full h-full
            "
        >
            <span
                v-for="i in 4"
                :key="i"
                class="
                    block
                    w-1
                    bg-current
                    rounded-sm
                    animate-pulse
                "
                :class="barClass(i)"
            ></span>
        </div>
    </div>
</template>

<script setup>

const props = defineProps({
    mode: { type: String, default: 'loading'}
})

const barClass = (index) => {
    return [
        'h-1/3',
        'animation-delay-[0ms]',
        index === 2 && 'h-2/3 animation-delay-[150ms]',
        index === 3 && 'h-full animation-delay-[300ms]',
        index === 4 && 'h-2/3 animation-delay-[450ms]'
    ]
}
</script>