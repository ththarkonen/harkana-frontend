<template>
<aside class = "bg-dark-gray rounded-lg shadow-sm z-40
                fixed md:static md:row-span-2
                top-[2px] h-[calc(100vh-4px)] md:h-auto 
                w-64 transition-[left] duration-300 md:left-auto">
    <div class="p-4 pt-4 h-full overflow-y-auto">
    <slot></slot>
    </div>
</aside>
</template>