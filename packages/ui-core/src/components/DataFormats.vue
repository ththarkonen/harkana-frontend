<template>
<!-- Outer frame -->
<div class="bg-brand min-h-screen p-[2px] overflow-y:hidden">

    <!-- Mobile overlay -->
    <div v-if="sidebarOpen" @click="sidebarOpen = false" class="fixed inset-0 bg-black/40 z-30 md:hidden"></div>
    
    <!-- App Grid -->
    <div class="grid h-[calc(100vh-4px)] gap-[2px] grid-cols-1 grid-rows-[auto_1fr] md:grid-cols-[16rem_1fr] md:grid-rows-[auto_1fr]">

        <Sidebar :style="sidebarStyle">
            <Logo></Logo>

            <h3 class="px-4 pl-0 mb-2 text-lg font-semibold text-white">
                Input data formats
            </h3>

            <div
                v-for="section in sections"
                :key="section"
                @click="selectSection(section)"
                class="px-4 py-2 my-2 rounded font-semibold text-white cursor-pointer transition-colors"
                :class="selected === section
                    ? 'bg-brand'
                    : 'text-gray-700 hover:bg-gray'"
            >
                {{ section }}
            </div>

            <hr class="h-0.5 bg-gray border-0 my-4">

            <div
                @click="selectSection('Output')"
                class="px-4 py-2 rounded font-semibold text-white cursor-pointer transition-colors"
                :class="selected === 'Output'
                    ? 'bg-brand'
                    : 'hover:bg-gray-100'"
            >
                Output
            </div>
        </Sidebar>

        <NavigationBar>
            <template v-slot:left-items>
                <button @click="sidebarOpen = true" class="md:hidden px-3 py-2 rounded bg-slate-100">☰</button>
                <MenuDropdown></MenuDropdown>
            </template>
            <template v-slot:right-items>
                <AccountDropdown></AccountDropdown>
            </template>
        </NavigationBar>

        <!-- Main Content -->
        <main class="min-h-0 bg-white rounded-lg shadow-sm p-4 overflow-y-auto">
            <div class="w-full max-w-3xl rounded-lg font-sans">
                <div class="mb-6 space-y-2">
                    <div class="text-xs font-semibold uppercase tracking-wide text-black/70">
                        {{ selected === 'Output' ? 'Output format' : 'Input data format' }}
                    </div>
                    <h3 class="m-0 text-lg font-bold text-black">{{ selectedLabel }}</h3>
                </div>

                <!-- Plain text -->
                <div v-if="selected === 'Plain text'" class="data-format-content">
                    <p>
                        <strong>Plain Text / CSV</strong> files are simple, comma-separated data tables used for numerical measurements such as 
                        spectra or analytical readings. Each line represents one observation, where the first column contains the 
                        <em>x-values</em> (e.g., wavelength or energy) and the second column contains the corresponding <em>y-values</em> 
                        (e.g., intensity).
                    </p>
                    <ul>
                        <li>
                            <strong>Delimiter:</strong> Data values are separated by commas. The platform automatically detects and parses 
                            numeric pairs.
                            <br>
                            Example line: <code class="bg-gray-100 px-1 rounded">901.0000, 1.2309150</code>
                            <br>
                            Example line: <code class="bg-gray-100 px-1 rounded">901.0000, 1.2309150,</code> (trailing commas are allowed)
                        </li>
                        <li>
                            <strong>Header:</strong> Not required. Files are read directly as numerical pairs in two columns.
                        </li>
                        <li>
                            <strong>File extension:</strong> .txt or .csv
                        </li>
                    </ul>
                    <a href="/examples/data/example_data.txt" download class="text-brand underline hover:opacity-80">
                        Download example data file
                    </a>
                    <br>
                    <a href="/examples/data/example_data_trailing.csv" download class="text-brand underline hover:opacity-80">
                        Download example data file with trailing zeroes
                    </a>
                </div>

                <!-- JSON -->
                <div v-else-if="selected === 'JSON'" class="data-format-content">
                    <p>
                        <strong>JSON</strong> files provide structured, machine-readable datasets, ideal for storing both data and metadata. 
                        Each dataset is represented as paired arrays of <em>x</em> and <em>y</em> values.
                    </p>
                    <ul>
                        <li>
                            <strong>Structure:</strong> Data is organized into two key arrays — <code class="bg-gray-100 px-1 rounded">x</code> and <code class="bg-gray-100 px-1 rounded">y</code> — 
                            each containing numeric sequences of equal length.
                            <br>
                            Example:
                            <pre class="bg-gray-900 text-gray-100 rounded p-4 text-sm overflow-x-auto whitespace-pre-wrap">{"x": [901, 902.17, 903.34, ...],
 "y": [1.230915, 1.233684, 1.236001, ...]}</pre>
                        </li>
                        <li>
                            <strong>File extension:</strong> .json
                        </li>
                    </ul>
                    <a href="/examples/data/example_data.json" download class="text-brand underline hover:opacity-80">
                        Download JSON-formatted example data file
                    </a>
                </div>

                <!-- SPC -->
                <div v-else-if="selected === 'SPC'" class="data-format-content">
                    <p>
                        <strong>SPC</strong> files are a widely used <em>binary</em> file format for spectroscopic data, 
                        commonly produced by analytical instruments such as Raman, IR, and UV-Vis spectrometers.
                        Unlike plain text or JSON files, SPC files store both the measured spectrum and instrument-specific
                        metadata in a compact binary structure.
                    </p>

                    <ul>
                        <li>
                            <strong>Data content:</strong>  
                            A single SPC file typically contains one or more spectra. Each spectrum consists of paired
                            <em>x-values</em> (e.g., wavelength, wavenumber, or energy) and corresponding
                            <em>y-values</em> (e.g., intensity or absorbance).
                        </li>

                        <li>
                            <strong>Binary format:</strong>  
                            SPC files are not human-readable and must be interpreted using a compatible reader.
                            The platform automatically parses SPC files and extracts the numerical spectrum data.
                        </li>

                        <li>
                            <strong>Metadata:</strong>  
                            In addition to spectral values, SPC files may include instrument parameters,
                            acquisition settings, axis calibration, and other experimental metadata.
                            These are preserved internally but only the spectral <em>x</em> and <em>y</em> arrays
                            are used for analysis.
                        </li>

                        <li>
                            <strong>Multiple spectra:</strong>  
                            Some SPC files may contain multiple spectra. At present, the platform processes
                            the first spectrum in the file.
                        </li>

                        <li>
                            <strong>File extension:</strong> .spc
                        </li>
                    </ul>

                    <p>
                        Once uploaded, SPC files are converted into the platform’s standard internal JSON representation,
                        ensuring consistent processing and visualization alongside other supported formats.
                    </p>

                    <!--
                    <a href="/examples/data/example_data.spc" download class="text-brand underline hover:opacity-80">
                        Download example SPC file
                    </a>
                    -->
                </div>


                <!-- Output -->
                <div v-else class="data-format-content">
                    <p>
                        The analysis process produces several structured <strong>JSON</strong> output files containing results, metadata, 
                        and calibration information. 
                        The original input data is preserved under the same name with a <code class="bg-gray-100 px-1 rounded">raw_</code> prefix.
                    </p>

                    <h4 class="text-lg font-semibold mt-6 mb-3">File Overview:</h4>
                    <ul class="space-y-4">
                        <li>
                            <strong>raw_*:</strong>  
                            The original uploaded dataset, stored under the same filename as the input, prefixed with 
                            <code class="bg-gray-100 px-1 rounded">raw_</code> (e.g., <code class="bg-gray-100 px-1 rounded">raw_data.json</code>).  
                            Contains the unmodified data as provided by the user.
                        </li>

                        <li>
                            <strong>data.json:</strong>  
                            The processed data file containing the measurement arrays.  
                            Structure example:
                            <pre class="bg-gray-900 text-gray-100 rounded p-4 text-sm overflow-x-auto whitespace-pre-wrap">{"x": [901, 902.17, 903.34, ...],
 "y": [1.230915, 1.233684, 1.236001, ...]}</pre>
                        </li>

                        <li>
                            <strong>estimate.json:</strong>  
                            Analysis result file containing median underlying Raman spectrum
                            and predictive intervals for uncertainty quantification.  
                            Each record includes:
                            <ul class="mt-2">
                                <li><code class="bg-gray-100 px-1 rounded">x</code> — x-axis positions (e.g., wavelength or energy)</li>
                                <li><code class="bg-gray-100 px-1 rounded">median</code> — Central estimate for each <code class="bg-gray-100 px-1 rounded">x</code> value</li>
                                <li><code class="bg-gray-100 px-1 rounded">lowerBound</code> and <code class="bg-gray-100 px-1 rounded">upperBound</code> — Objects with keys <code class="bg-gray-100 px-1 rounded">50</code>, <code class="bg-gray-100 px-1 rounded">75</code>, 
                                <code class="bg-gray-100 px-1 rounded">90</code>, and <code class="bg-gray-100 px-1 rounded">95</code>, representing predictive interval bounds at
                                at the corresponding confidence level for each <code class="bg-gray-100 px-1 rounded">x</code> value.</li>
                            </ul>
                            Example:
                            <pre class="bg-gray-900 text-gray-100 rounded p-4 text-sm overflow-x-auto whitespace-pre-wrap">{"x": [901, 902.17, 903.34, ...],
 "median": [1.23, 1.24, 1.25, ...],
 "lowerBound": {
    "50": [...],
    "75": [...],
    "90": [...],
    "95": [...]
 },
 "upperBound": {
    "50": [...],
    "75": [...],
    "90": [...],
    "95": [...]
 }}</pre>
                        </li>
                        
                        <li>
                            <strong>metadata.json:</strong>  
                            Contains user-defined metadata describing, for example, the dataset and measurement setup.  
                            Example:
                            <pre class="bg-gray-900 text-gray-100 rounded p-4 text-sm overflow-x-auto whitespace-pre-wrap">{"sample_id": "A123",
 "operator": "Jane Doe",
 "description": "Spectral measurement of sample A123",
 "date": "2025-11-03"}</pre>
                        </li>

                        <li>
                            <strong>calibration.json:</strong>  
                            Holds the user-defined spectrum calibration model, including optional polynomial terms and point pairs used for the fit.
                            This allows post-processing or visualization tools to re-align the data.
                            <br>
                            Example:
                            <pre class="bg-gray-900 text-gray-100 rounded p-4 text-sm overflow-x-auto whitespace-pre-wrap">{"x": 0.0,
 "polynomialOrder": 3,
 "includedOrders": [0, 1, 3],
 "points": [
  {"id": "p1", "sourceX": 100.2, "targetX": 100.0},
  {"id": "p2", "sourceX": 512.1, "targetX": 512.0},
  {"id": "p3", "sourceX": 1331.5, "targetX": 1331.0},
  {"id": "p4", "sourceX": 1601.2, "targetX": 1601.0}
 ]}</pre>
                        </li>
                    </ul>

                    <div class="mt-6 space-y-2">
                        <a href="/examples/output/data.json" download class="text-brand underline hover:opacity-80 block">
                            Download example data file
                        </a>
                        <a href="/examples/output/estimate.json" download class="text-brand underline hover:opacity-80 block">
                            Download example estimate file
                        </a>
                        <a href="/examples/output/metadata.json" download class="text-brand underline hover:opacity-80 block">
                            Download example metadata file
                        </a>
                        <a href="/examples/output/calibration.json" download class="text-brand underline hover:opacity-80 block">
                            Download example calibration file
                        </a>
                    </div>
                </div>

            </div>
        </main>

    </div>
</div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Sidebar from './sidebar/Sidebar.vue'
import Logo from "./sidebar/Logo.vue"

import NavigationBar from './navbar/NavigationBar.vue'
import MenuDropdown from './navbar/MenuDropdown.vue'
import AccountDropdown from './navbar/AccountDropdown.vue'

const route = useRoute()
const router = useRouter()

const emit = defineEmits(['loaded'])

const sidebarOpen = ref(false)
const sidebarStyle = computed(() => {
    return sidebarOpen.value
        ? { left: '2px' }
        : { left: 'calc(-16rem - 2px)' }
})

const sections = ['Plain text', 'JSON', "SPC"]
const selected = ref(route.query.section || 'Plain text')
const selectedLabel = computed(() => {
    if (selected.value === 'Plain text') {
        return 'Plain text / CSV'
    }
    if (selected.value === 'Output') {
        return 'Output files'
    }
    return selected.value
})

// Function to change section without triggering route navigation
const selectSection = (section) => {
    selected.value = section
}

// Sync with URL query params when they change externally
watch(
    () => route.query.section,
    (val) => {
        if (val && (sections.includes(val) || val === 'Output')) {
            selected.value = val
        }
    }
)

// Update URL when section changes, but use replace to avoid navigation event
watch(selected, (val) => {
    if (route.query.section !== val) {
        router.replace({ query: { section: val } }).catch(() => {})
    }
})

onMounted(() => {
    emit('loaded')
})
</script>

<style scoped>
.data-format-content {
    color: rgb(0 0 0 / 0.72);
    font-size: 0.9375rem;
    line-height: 1.7;
}

.data-format-content > * + * {
    margin-top: 1rem;
}

.data-format-content h4 {
    color: rgb(0 0 0);
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.4;
}

.data-format-content p,
.data-format-content ul,
.data-format-content pre {
    margin-top: 0;
    margin-bottom: 0;
}

.data-format-content ul {
    padding-left: 1.25rem;
}

.data-format-content li + li {
    margin-top: 0.75rem;
}

.data-format-content strong {
    color: rgb(0 0 0);
    font-weight: 600;
}

.data-format-content code {
    border-radius: 0.375rem;
    background: rgb(15 23 42 / 0.06);
    color: rgb(15 23 42);
    font-size: 0.875em;
    padding: 0.1rem 0.35rem;
}

.data-format-content pre {
    overflow-x: auto;
    border-radius: 0.75rem;
    background: rgb(15 23 42);
    color: rgb(241 245 249);
    font-size: 0.8125rem;
    line-height: 1.6;
    padding: 1rem;
}

.data-format-content pre code {
    background: transparent;
    color: inherit;
    padding: 0;
}

.data-format-content a {
    text-decoration: underline;
    text-underline-offset: 0.15em;
}

.data-format-content a:hover {
    opacity: 0.8;
}
</style>
