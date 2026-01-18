<template>
    <header class="bg-dark-gray rounded-lg shadow-sm">
        <div class="h-14 px-4 flex items-center gap-4">
            <div class="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                <slot name="left-items"></slot>
            </div>
            <div class="flex items-center flex-shrink-0">
                <slot name="right-items"></slot>
            </div>
        </div>
    </header>
</template>