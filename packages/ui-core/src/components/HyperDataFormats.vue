<template>
<!-- Outer frame -->
<div class="bg-brand min-h-screen p-[2px]">

    <!-- Mobile overlay -->
    <div v-if="sidebarOpen" @click="sidebarOpen = false" class="fixed inset-0 bg-black/40 z-30 md:hidden"></div>

    <!-- App Grid -->
    <div class="grid h-[calc(100vh-4px)] gap-[2px] grid-cols-1 grid-rows-[auto_1fr] md:grid-cols-[16rem_1fr] md:grid-rows-[auto_1fr]">

        <Sidebar :style="sidebarStyle">
            <Logo></Logo>

            <SidebarButton @click="navigation.route('Main menu', {})" class="my-2">
                Project menu
            </SidebarButton>

            <hr class="h-0.5 bg-gray border-0 my-4">

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
            </template>
            <template v-slot:right-items>
                <AccountDropdown></AccountDropdown>
            </template>
        </NavigationBar>

        <!-- Main Content -->
        <main class="bg-dark-gray rounded-lg shadow-sm p-4 overflow-y-auto">
            <div class="w-full max-w-3xl bg-white rounded-lg shadow p-6">

                <div v-if="selected === 'OIR'" class="prose prose-gray max-w-none">
                    <p>
                        <strong>OIR</strong> is a proprietary <em>binary microscopy image format</em> used by
                        Olympus / Evident imaging systems for multidimensional image acquisition. Within this
                        platform, OIR files serve as the primary raw input format for the hyperspectral workflow.
                    </p>
                    <p>
                        Because OIR is a vendor-specific binary format, it is not well suited to direct inspection,
                        exchange, or reuse in general analytical workflows. The platform therefore converts the
                        acquisition into standardized artifacts intended for visualization, quantitative analysis,
                        and long-term reuse.
                    </p>
                    <ul>
                        <li>
                            <strong>File extension:</strong> The expected source files use the
                            <code class="bg-gray-100 px-1 rounded">.oir</code>.
                        </li>
                        <li>
                            <strong>Binary structure:</strong> OIR files are not human-readable and are ordinarily
                            handled within instrument-specific software environments.
                        </li>
                        <li>
                            <strong>Analytical role:</strong> In this workflow, the OIR file is treated as the raw
                            acquisition source from which standardized downstream artifacts are derived.
                        </li>
                    </ul>
                    <p>
                        This organization preserves the scientific content of the original acquisition while moving
                        subsequent work into formats that are substantially easier to inspect, exchange, and process.
                    </p>

                    <h4 class="text-lg font-semibold mt-6 mb-3">Dimensional structure</h4>
                    <p>
                        OIR acquisitions are interpreted in
                        <code class="bg-gray-100 px-1 rounded">TCZYX</code> axis order:
                    </p>
                    <ul>
                        <li><strong>T</strong> = time points</li>
                        <li><strong>C</strong> = channels</li>
                        <li><strong>Z</strong> = depth planes</li>
                        <li><strong>Y</strong> = image height</li>
                        <li><strong>X</strong> = image width</li>
                    </ul>

                    <p>
                        For numerical analysis, the non-spatial axes are consolidated into a single layer axis:
                    </p>
                    <pre class="bg-gray-900 text-gray-100 rounded p-4 text-sm overflow-x-auto whitespace-pre-wrap">L = T * C * Z
output hypercube shape = [L, Y, X]</pre>
                    <p>
                        Consequently, the exported hypercube is always three-dimensional, even when the source OIR
                        acquisition contains multiple channels, time points, or Z slices.
                    </p>

                    <ul>
                        <li>
                            <strong>Normalization:</strong> The 3D hypercube is converted to
                            <code class="bg-gray-100 px-1 rounded">float32</code> and divided by the global maximum
                            so that the maximum of the flattened dataset is
                            <code class="bg-gray-100 px-1 rounded">1.0</code>.
                        </li>
                        <li>
                            <strong>Axis vectors:</strong> X, Y, and Z axis vectors are derived from physical pixel
                            sizes when such calibration metadata is available. If not, the backend falls back to
                            integer index coordinates.
                        </li>
                        <li>
                            <strong>Units:</strong> Physical units are preserved when available. If the OIR metadata
                            does not provide usable calibration, the exported units default to
                            <code class="bg-gray-100 px-1 rounded">index</code>.
                        </li>
                        <li>
                            <strong>Channel naming:</strong> Channel names are preserved when available. Otherwise the
                            backend generates placeholder names such as
                            <code class="bg-gray-100 px-1 rounded">channel_000</code>.
                        </li>
                        <li>
                            <strong>Failure mode:</strong> If the file cannot be interpreted as a supported
                            multidimensional image cube, the parse job fails and no analysis artifacts are produced.
                        </li>
                    </ul>
                    <a href="/examples/data.oir" download class="text-brand underline hover:opacity-80">
                        Download example OIR file
                    </a>
                </div>

                <div v-else class="prose prose-gray max-w-none">
                    <p>
                        The following output files are common to the hyperspectral workflow and are intended to be
                        shared across currently supported and upcoming hyperspectral input formats. After a successful
                        parse, the platform performs numerical analysis and stores the resulting derived data for
                        visualization and subsequent use. These results can be downloaded from selected projects for further analysis, reporting, or
                        custom visualization in external tools.
                    </p>
                    <br>
                    <p>
                        These output files are designed not to require
                        specialized vendor-specific readers. They can be inspected directly and used readily in
                        further analysis, thereby reducing reliance on proprietary software stacks that are often
                        difficult to configure and maintain.
                    </p>

                    <h4 class="text-lg font-semibold mt-6 mb-3">Top-level outputs</h4>
                    <ul>
                        <li>
                            <strong>hypercube.h5</strong><br>
                            HDF5 export of the normalized 3D cube in
                            <code class="bg-gray-100 px-1 rounded">[layer, y, x]</code> order.
                        </li>
                        <li>
                            <strong>metadata.json</strong><br>
                            Primary manifest file containing source metadata, normalized cube shape, data type,
                            channel information, normalization details, axis metadata, PCA summary, and references
                            to generated artifacts.
                        </li>
                        <li>
                            <strong>mip.json</strong><br>
                            2D maximum intensity projection across the layer axis.
                        </li>
                        <li>
                            <strong>mip_hsv.json</strong><br>
                            Three-channel RGB array for the alternative HSV MIP visualization. Hue is derived from
                            the dominant layer index and value from the maximum intensity at each pixel.
                        </li>
                        <li>
                            <strong>xyz.json</strong><br>
                            JSON object with:
                            <code class="bg-gray-100 px-1 rounded">x</code>,
                            <code class="bg-gray-100 px-1 rounded">y</code>,
                            <code class="bg-gray-100 px-1 rounded">z</code>,
                            <code class="bg-gray-100 px-1 rounded">xUnit</code>,
                            <code class="bg-gray-100 px-1 rounded">yUnit</code>, and
                            <code class="bg-gray-100 px-1 rounded">zUnit</code>.
                        </li>
                    </ul>

                    <h4 class="text-lg font-semibold mt-6 mb-3">Principal component analysis (PCA) outputs</h4>
                    <ul>
                        <li>
                            <strong>pca/summary.json</strong><br>
                            PCA manifest containing component count, score-map shape, explained variance,
                            explained-variance ratio, raw score ranges, and references to PCA artifacts.
                        </li>
                        <li>
                            <strong>pca/scores/pc01.json</strong>, <strong>pc02.json</strong>, ...<br>
                            One normalized two-dimensional display map per principal component, each scaled to
                            <code class="bg-gray-100 px-1 rounded">[0, 1]</code> independently.
                        </li>
                        <li>
                            <strong>pca/loadings.json</strong><br>
                            Stores the PCA loadings matrix with
                            <code class="bg-gray-100 px-1 rounded">shape = [componentCount, spectralLength]</code>
                            and a 2D <code class="bg-gray-100 px-1 rounded">components</code> array.
                        </li>
                        <li>
                            <strong>pca/mean_spectrum.json</strong><br>
                            Mean spectrum used for PCA centering.
                        </li>
                        <li>
                            <strong>pca/raw/*.npy</strong><br>
                            Raw NumPy arrays for advanced processing:
                            <code class="bg-gray-100 px-1 rounded">scores.npy</code>,
                            <code class="bg-gray-100 px-1 rounded">components.npy</code>,
                            <code class="bg-gray-100 px-1 rounded">mean.npy</code>,
                            <code class="bg-gray-100 px-1 rounded">explained_variance.npy</code>, and
                            <code class="bg-gray-100 px-1 rounded">explained_variance_ratio.npy</code>.
                        </li>
                    </ul>

                    <h4 class="text-lg font-semibold mt-6 mb-3">Regions of interest</h4>
                    <ul>
                        <li>
                            <strong>roi/storage.json</strong><br>
                            Full ROI manifest for persistent storage. At the top level, this file stores
                            <code class="bg-gray-100 px-1 rounded">version</code>,
                            <code class="bg-gray-100 px-1 rounded">projectID</code>,
                            <code class="bg-gray-100 px-1 rounded">dataType</code>,
                            <code class="bg-gray-100 px-1 rounded">createdAt</code>,
                            <code class="bg-gray-100 px-1 rounded">createdBy</code>,
                            <code class="bg-gray-100 px-1 rounded">roiCount</code>, and
                            a <code class="bg-gray-100 px-1 rounded">rois</code> array. Each ROI entry stores
                            identifiers and descriptive fields together with derived statistics and the complete
                            data payload, including
                            <code class="bg-gray-100 px-1 rounded">boundingBox</code>,
                            <code class="bg-gray-100 px-1 rounded">meanSpectrum</code>,
                            optional bound arrays,
                            <code class="bg-gray-100 px-1 rounded">xy</code>,
                            <code class="bg-gray-100 px-1 rounded">normalization</code>,
                            <code class="bg-gray-100 px-1 rounded">source</code>,
                            the exact valid <code class="bg-gray-100 px-1 rounded">pixels</code> list, and
                            per-pixel <code class="bg-gray-100 px-1 rounded">individualSpectra</code>.
                        </li>
                        <li>
                            <strong>roi/frontend.json</strong><br>
                            Frontend-optimized ROI manifest with the same general structure and metadata as
                            <code class="bg-gray-100 px-1 rounded">roi/storage.json</code>, but without the most
                            data-intensive fields. In particular, the lightweight frontend representation omits
                            detailed per-pixel payloads such as the exact stored pixel list and the individual
                            spectra for each pixel, while retaining the aggregate ROI information required for
                            visualization and interaction.
                        </li>
                    </ul>
                </div>

            </div>
        </main>

    </div>
</div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { navigation } from '@harkana/tools'

import Sidebar from './sidebar/Sidebar.vue'
import Logo from "./sidebar/Logo.vue"
import SidebarButton from './sidebar/SidebarButton.vue'

import NavigationBar from './navbar/NavigationBar.vue'
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

const sections = ['OIR']
const selected = ref(route.query.section || 'OIR')

const selectSection = (section) => {
    selected.value = section
}

watch(
    () => route.query.section,
    (val) => {
        if (val && (sections.includes(val) || val === 'Output')) {
            selected.value = val
        }
    }
)

watch(selected, (val) => {
    if (route.query.section !== val) {
        router.replace({ query: { section: val } }).catch(() => {})
    }
})

onMounted(() => {
    emit('loaded')
})
</script>
