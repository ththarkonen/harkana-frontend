<template>
<div class="prose prose-gray max-w-none">

    <div class = "border-2 border-brand rounded-lg p-4 mb-8
                  shadow-black shadow-lg">
        <p>
            <strong>Visualization Settings</strong> let you customize how analytical results and 
            data visualizations are displayed. These options give you control over layout, labeling, 
            colors, and typography so that figures match your preferred appearance standards.
        </p>
        <br></br>
        <ul>
            <li>
            <strong>Layout:</strong>  
            Choose the graph layout style (e.g., vertical, horizontal, or single) and optionally 
            reverse the horizontal axis for mirrored visualizations.
            </li>
            <br></br>
            <li>
            <strong>Axis Labels:</strong>  
            Define axis labels using LaTeX-style notation to ensure consistent scientific formatting.
            </li>
            <br></br>

            <li>
            <strong>Graph Legends:</strong>  
            Customize legend entries for data points, median estimates, and uncertainty intervals 
            (50%, 75%, 90%, and 95%). Each legend supports LaTeX formatting for precise mathematical display.
            </li>
            <br></br>

            <li>
            <strong>Graph Colors and Opacity:</strong>  
            Adjust the colors for measurement data, median estimates, and uncertainty areas.  
            You can also control the opacity of uncertainty regions to balance clarity and visual emphasis.
            </li>
            <br></br>

            <li>
            <strong>Font Sizes:</strong>  
            Fine-tune font sizes for axis ticks, axis labels, and legends.  
            This ensures consistent readability across different display scales or exported figures.
            </li>
            <br></br>

            <li>
            <strong>Initial Graph Visibility:</strong>  
            Select which elements of the project graphs should be shown by default.  
            This applies to single project graphs as well as graphs in comparison views.
            </li>
        </ul>

            <br></br>
        <p>
            Together, these visualization controls provide a flexible and professional way to adapt 
            plots to your personal preferences or the visual standards of your research group.
        </p>
    </div>

    <div class = "border-2 border-brand rounded-lg p-4 mb-8
                  shadow-black shadow-lg">

        <h3 class = "font-semibold">Reverse horizontal axis</h3>
        <select v-model = "layout.reversed"
                class="w-full border border-gray-600 rounded px-3 py-2 mt-2 bg-white
                text-black focus:outline-none focus:ring-2 focus:ring-brand">
            <option value="true">True</option>
            <option value="false">False</option>
        </select>
                  
        <h3 class = "font-semibold mt-4">Graph layout</h3>
        <select v-model = "layout.layout"
                class="w-full border border-gray-600 rounded px-3 py-2 mt-2 bg-white
                text-black focus:outline-none focus:ring-2 focus:ring-brand">
            <option value="vertical">Vertical</option>
            <option value="horizontal">Horizontal</option>
            <option value="single">Single</option>
        </select>

        <hr class="h-0.5 bg-gray border-0 my-4">

        <LatexField description = "Horizontal axis label" v-model = "labels.horizontal"></LatexField>
        <LatexField description = "Measurement data legend" v-model = "legends.data" class = "mt-4"/>
        <LatexField description = "Median estimate legend" v-model = "legends.median" class = "mt-4"/>
        <LatexField description = "Marginal 50% uncertainty estimate legend" v-model = "legends.interval50" class = "mt-4"/>
        <LatexField description = "Marginal 75% uncertainty estimate legend" v-model = "legends.interval75" class = "mt-4"/>
        <LatexField description = "Marginal 90% uncertainty estimate legend" v-model = "legends.interval90" class = "mt-4"/>
        <LatexField description = "Marginal 95% uncertainty estimate legend" v-model = "legends.interval95" class = "mt-4"/>

        <hr class="h-0.5 bg-gray border-0 my-4">

        <ColorPicker v-model = "colors.data" description = "Measurement data color" class = "mt-4"></ColorPicker>
        <ColorPicker v-model = "colors.median" description = "Median estimate color" class = "mt-4"></ColorPicker>
        <ColorPicker v-model = "colors.area" description = "Uncertainty estimate color" class = "mt-4"></ColorPicker>
        <OpacityPicker v-model = "colors.opacity" :color = "colors.area" class = "mt-4"
                        description = "Uncertainty estimate opacity"></OpacityPicker>

        <hr class="h-0.5 bg-gray border-0 my-4">

        <ColorPicker v-model = "comparisonColors.data" description = "Comparison data color" class = "mt-4"></ColorPicker>
        <ColorPicker v-model = "comparisonColors.median" description = "Comparison median estimate color" class = "mt-4"></ColorPicker>
        <ColorPicker v-model = "comparisonColors.area" description = "Comparison uncertainty estimate color" class = "mt-4"></ColorPicker>
        <OpacityPicker v-model = "comparisonColors.opacity" :color = "comparisonColors.area" class = "mt-4"
                         description = "Comparison uncertainty estimate opacity"></OpacityPicker>

        <hr class="h-0.5 bg-gray border-0 my-4">

        <div class="flex flex-col gap-2 rounded-lg border-2 border-brand bg-black/5 p-4 shadow-sm mt-4">
            <h4 class=" font-semibold text-black">Axis tick font size</h4>
            <input v-model = "font.sizes.axis" class = "flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-800
                            focus:outline-none focus:ring-2 focus:ring-brand"
                            type ="number" min = "8" max = "72" step = "1"/>
        </div>

        <div class="flex flex-col gap-2 rounded-lg border-2 border-brand bg-black/5 p-4 shadow-sm mt-4">
            <h4 class=" font-semibold text-black">Axis label font size</h4>
            <input v-model = "font.sizes.label" class = "flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-800
                            focus:outline-none focus:ring-2 focus:ring-brand"
                            type ="number" min = "8" max = "72" step = "1"/>
        </div>

        <div class="flex flex-col gap-2 rounded-lg border-2 border-brand bg-black/5 p-4 shadow-sm mt-4">
            <h4 class=" font-semibold text-black">Legend font size</h4>
            <input v-model = "font.sizes.legend" class = "flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-800
                            focus:outline-none focus:ring-2 focus:ring-brand"
                            type ="number" min = "8" max = "72" step = "1"/>
        </div>

        <hr class="h-0.5 bg-gray border-0 my-4">

        <TickboxGroup v-model = "visibility" title = "Initial graph visibility"></TickboxGroup>
        <TickboxGroup v-model = "comparisonVisibility" title = "Comparison initial graph visibility" class = "mt-4"></TickboxGroup>
        
        <SettingsButton @click = "updateSettings" :loading = "updating" class = "mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
            Update visualization settings
        </SettingsButton>

    </div>

</div>
</template>

<script setup>

import { ref, onMounted} from "vue"
import { settings as settingslib, utils} from "@harkana/tools"

import SettingsButton from "../settings/SettingsButton.vue"
import LatexField from "../settings/LatexField.vue"
import ColorPicker from "../settings/ColorPicker.vue"
import OpacityPicker from "../settings/OpacityPicker.vue"
import TickboxGroup from "../settings/TickboxGroup.vue"

const updating = ref(false)

const layout = ref({})
const labels = ref({})
const legends = ref({})

const font = ref({ sizes: {}})
const colors = ref({})
const comparisonColors = ref({})

const visibility = ref([])
const comparisonVisibility = ref([])

const updateSettings = async () => {

    updating.value = true

    var settings = await settingslib.get()
    
    settings.font = font.value
    settings.layout = layout.value
    settings.labels = labels.value
    settings.legends = legends.value

    settings.colors = colors.value
    settings.comparisonColors = comparisonColors.value
    
    settings.visibility.plot.data = visibility.value[0]
    settings.visibility.plot.median = visibility.value[1]
    settings.visibility.plot.interval50 = visibility.value[2]
    settings.visibility.plot.interval75 = visibility.value[3]
    settings.visibility.plot.interval90 = visibility.value[4]
    settings.visibility.plot.interval95 = visibility.value[5]
    
    settings.visibility.comparison.data = comparisonVisibility.value[0]
    settings.visibility.comparison.median = comparisonVisibility.value[1]
    settings.visibility.comparison.interval50 = comparisonVisibility.value[2]
    settings.visibility.comparison.interval75 = comparisonVisibility.value[3]
    settings.visibility.comparison.interval90 = comparisonVisibility.value[4]
    settings.visibility.comparison.interval95 = comparisonVisibility.value[5]

    await settingslib.set( settings )

    await utils.wait( 1000 )
    updating.value = false
}

onMounted( async () => {

	var settings = await settingslib.get()
    
	font.value = settings.font
	layout.value = settings.layout
	labels.value = settings.labels
	legends.value = settings.legends
	
	colors.value = settings.colors
	comparisonColors.value = settings.comparisonColors

    visibility.value[0] = settings.visibility.plot.data
    visibility.value[1] = settings.visibility.plot.median
    visibility.value[2] = settings.visibility.plot.interval50
    visibility.value[3] = settings.visibility.plot.interval75
    visibility.value[4] = settings.visibility.plot.interval90
    visibility.value[5] = settings.visibility.plot.interval95

    comparisonVisibility.value[0] = settings.visibility.comparison.data
    comparisonVisibility.value[1] = settings.visibility.comparison.median
    comparisonVisibility.value[2] = settings.visibility.comparison.interval50
    comparisonVisibility.value[3] = settings.visibility.comparison.interval75
    comparisonVisibility.value[4] = settings.visibility.comparison.interval90
    comparisonVisibility.value[5] = settings.visibility.comparison.interval95
})

</script>