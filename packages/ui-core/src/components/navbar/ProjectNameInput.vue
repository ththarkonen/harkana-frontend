<template>
  <div class="flex items-center w-full group min-w-0">
    <!-- Input when editing -->
    <input
      v-if="editing"
      ref="input"
      type="text"
      v-model="newProjectName"
      :placeholder="project.name"
      :style="{ width: displayWidth, maxWidth: '100%' }"
      @keyup.enter="update"
      @keydown.esc="hide"
      @blur="hide"
      class="border border-gray-600 rounded px-2 py-1 text-md
             focus:outline-none focus:ring-2 focus:ring-brand bg-white text-black min-w-0"
    />
    <!-- Display name + pen -->
    <div
      v-else
      ref="displayDiv"
      :style="{ maxWidth: '100%' }"
      class="flex-1 flex items-center justify-between cursor-pointer min-w-0"
      @click="startEditing"
    >
      <span class="text-white text-lg truncate min-w-0" :title="project.name">
        {{ project.name }}
      <i
        class="fa-solid fa-pen text-white ml-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      ></i>
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { projects as projectlib } from "@harkana/tools"

const props = defineProps({
  project: { type: Object, required: true },
})

const input = ref(null)
const displayDiv = ref(null)
const editing = ref(false)
const newProjectName = ref(props.project.name)
const displayWidth = ref('auto')

const hide = async () => {
  newProjectName.value = props.project.name
  editing.value = false
}

const startEditing = async () => {
  // Capture the width before switching to edit mode
  newProjectName.value = props.project.name
  if (displayDiv.value) {
    displayWidth.value = `${displayDiv.value.offsetWidth}px`
  }
  
  editing.value = true
  nextTick(() => input.value.focus())
}

const update = async () => {
  await projectlib.rename(props.project, newProjectName.value)
  props.project.name = newProjectName.value
  hide()
}
</script>





