<template>
<li>
    <button @click = "$emit('select', $event)" @click.middle = "$emit('select', $event)"
            class = "block w-full px-4 py-2 text-left text-sm text-white
                    transition hover:bg-brand hover:text-white">
        <slot></slot>
    </button>
</li>
</template>
