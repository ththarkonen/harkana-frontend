<template>
<div class = "bg-brand min-h-screen p-[2px]">
	<main class = "min-h-[calc(100vh-4px)] bg-dark-gray rounded-lg shadow-sm p-6 flex items-center justify-center">
		<div class = "w-full max-w-2xl border-2 border-brand rounded-lg bg-white p-8 shadow-black shadow-lg">
			<h1 class = "text-3xl font-bold text-black mb-4">
				Thank you for your purchase
			</h1>

			<p class = "text-black leading-relaxed">
				Your compute token purchase was completed successfully. You should receive a receipt to 
				your email within a moment.
			</p>

			<p class = "text-black leading-relaxed mt-4">
				Purchased tokens are typically visible within a few seconds after a successful purchase.
				If your balance does not update right away, please try refreshing the compute tokens page or the project menu.
			</p>

			<p class = "text-black leading-relaxed mt-4">
				In case of any problems, please contact us at
				<a href = "mailto:contact@harkana.com" class = "text-brand underline hover:opacity-80">
					contact@harkana.com
				</a>.
			</p>

			<div class = "flex flex-col gap-3 mt-8 sm:flex-row">
				<SettingsButton @click = "goToTokens" class = "w-full sm:w-auto">
					Go to compute tokens
				</SettingsButton>
				<SettingsButton @click = "goToMainMenu" class = "w-full sm:w-auto">
					Go to project menu
				</SettingsButton>
			</div>
		</div>
	</main>
</div>
</template>

<script setup>

import { onMounted } from "vue"
import { useRouter } from "vue-router"

import SettingsButton from "./settings/SettingsButton.vue"

const emit = defineEmits(["loaded"])
const router = useRouter()

const goToTokens = () => {
	router.push({
		name: "Settings",
		query: { section: "Compute tokens" }
	})
}

const goToMainMenu = () => {
	router.push({ name: "Main menu" })
}

onMounted( async() => {
	emit("loaded")
})

</script>
