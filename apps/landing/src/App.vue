<template>
<div class = "min-h-screen">
	<transition name = "fade-slide" mode = "out-in">
		<router-view/>
	</transition>
</div>
</template>

<style scoped>
.fade-slide-enter-active, .fade-slide-leave-active {
	transition: opacity 0.35s ease, transform 0.35s ease;
}

.fade-slide-enter-from {
	opacity: 0;
	transform: translateX(0px);
}

.fade-slide-leave-to {
	opacity: 0;
	transform: translateY(-0px);
}
</style>