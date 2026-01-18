<template>
    <div v-show="visible"
         class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
        <transition
            enter-active-class="transition ease-out duration-300"
            enter-from-class="opacity-0 scale-25"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition ease-in duration-300"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-25">
            <div v-show="visible">
                <slot></slot>
            </div>
        </transition>
    </div>
</template>

<script setup>

const props = defineProps({
    visible: { type: Boolean, default: false}
})

</script>