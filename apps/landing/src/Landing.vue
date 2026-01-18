<template>
  <main class="min-h-screen bg-gray-900 text-white relative overflow-hidden">

    <SiteHeader/>

	<LandingHero/>
    <ExampleCorrections/>
	<Features/>
	<ExampleWorkflow/>
	<DataTypes/>

    <SiteFooter/>
  </main>
</template>

<script setup>

import SiteHeader from '@/components/SiteHeader.vue'
import SiteFooter from '@/components/SiteFooter.vue'

import LandingHero from '@/components/LandingHero.vue'
import ExampleCorrections from '@/components/ExampleCorrections.vue'
import Features from '@/components/Features.vue'
import ExampleWorkflow from '@/components/ExampleWorkflow.vue'
import DataTypes from '@/components/DataTypes.vue'

</script>
