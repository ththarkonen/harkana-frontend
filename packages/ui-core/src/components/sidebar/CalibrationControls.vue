<template>
  <transition
    enter-active-class="transition-all duration-300 ease-in-out"
    enter-from-class="opacity-0 max-h-0 overflow-hidden"
    enter-to-class="opacity-100 max-h-screen"
    leave-active-class="transition-all duration-300 ease-in-out"
    leave-from-class="opacity-100 max-h-screen"
    leave-to-class="opacity-0 max-h-0 overflow-hidden"
  >
    <div class="p-2 shadow-md shadow-black border-2 border-gray bg-gray-800 rounded-lg">
      <h3 class="text-white font-semibold mb-2">Calibration</h3>

      <!-- Marker location -->
      <label for="marker-input" class="block text-sm font-semibold text-white mb-1">Marker location:</label>
      <input
        ref="markerInput"
        id="marker-input"
        type="number"
        v-model.number="marker.x"
        :step="step"
        min="0"
        class="w-full rounded border border-gray-600 px-2 py-1 text-black text-center bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
      />

      <!-- Horizontal correction -->
      <label for="calibration-input" class="block text-sm font-semibold text-white mb-1">Horizontal correction:</label>
      <input
        ref="calibrationInput"
        id="calibration-input"
        type="number"
        v-model.number="calibration.x"
        :step="step"
        class="w-full rounded border border-gray-600 px-2 py-1 text-black text-center bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
      />

      <!-- Save button -->
      <SidebarButton @click="save" :disabled = "uploading" class = "disabled:opacity-50 disabled:cursor-not-allowed">
        <span v-if = "uploading"
            class = "inset-0 flex items-center : justify-center">
            <Spinner class = "w-6 h-6 text-brand" />
        </span>
        <span v-else>
            Save
        </span>
    </SidebarButton>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue'
import { results, utils} from '@harkana/tools'

import SidebarButton from './SidebarButton.vue'
import Spinner from '../general/Spinner.vue'

const props = defineProps({
    project: { type: Object, required: true },
    step: { type: Number, default: 1 }
})

const marker = defineModel('marker', { type: Object, required: true })
const calibration = defineModel('calibration', { type: Object, required: true })

const uploading = ref(false)

const save = async () => {

    uploading.value = true
    const response = await results.setCalibration( props.project, calibration.value)
    
    await utils.wait(1000)
    uploading.value = false
}
</script>
