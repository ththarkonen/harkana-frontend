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

                <div v-if="selected !== 'Output'"
                     class="mb-6 rounded-lg border border-brand/60 bg-brand/5 p-4 text-sm leading-relaxed text-black/75">
                    <p class="m-0">
                        During upload, the platform shows the dataset dimensions and available axes so the analysis
                        can be configured before it starts. Users can choose the horizontal and vertical image axes,
                        include depth, channel, or time axes when they are useful for analysis, and select a specific
                        slice for dimensions that should stay fixed. For standard TIFF image stacks, the image pages
                        define the layer dimension, so additional axis assignment is typically unnecessary.
                    </p>
                </div>

                <div v-if="selected === 'OIR'" class="data-format-content">
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

                    <h4 class="text-lg font-semibold mt-6 mb-3">Upload inspection and axis selection</h4>
                    <p>
                        OIR files are checked before analysis. The upload dialog reports the detected axes, shape,
                        physical pixel sizes, channel labels, and warnings. The analysis roles are chosen from the
                        detected axes during upload.
                    </p>
                    <ul>
                        <li><strong>X and Y:</strong> Required spatial axes selected by the user during upload.</li>
                        <li><strong>Z, C, and T:</strong> Optional roles that can be assigned when the source contains depth, channel, or time axes.</li>
                        <li><strong>Fixed indices:</strong> Any unassigned source axis with size greater than one must be fixed to a single index.</li>
                        <li><strong>Layer choice:</strong> The upload dialog may recommend a layer axis, usually channel or depth, to guide the selection.</li>
                    </ul>

                    <p>
                        The resulting analysis artifacts use the platform's standard hyperspectral representation:
                    </p>
                    <pre class="bg-gray-900 text-gray-100 rounded p-4 text-sm overflow-x-auto whitespace-pre-wrap">output hypercube shape = [layer, y, x]</pre>
                    <p>
                        The layer axis is derived from the user-confirmed axis mapping and fixed-index choices rather
                        than from a hard-coded flattening rule.
                    </p>

                    <ul>
                        <li>
                            <strong>Normalization:</strong> The 3D hypercube is converted to
                            <code class="bg-gray-100 px-1 rounded">float32</code> and divided by the global maximum
                            so that the maximum of the flattened dataset is
                            <code class="bg-gray-100 px-1 rounded">1.0</code>.
                        </li>
                        <li>
                            <strong>Axis vectors:</strong> X, Y, and the output layer axis are derived from the
                            source metadata and the user-confirmed axis mapping when calibration metadata is
                            available. If not, the platform falls back to integer index coordinates.
                        </li>
                        <li>
                            <strong>Units:</strong> Physical units are preserved when available. If the OIR metadata
                            does not provide usable calibration, the exported units default to
                            <code class="bg-gray-100 px-1 rounded">index</code>.
                        </li>
                        <li>
                            <strong>Channel naming:</strong> Channel names are preserved when available. Otherwise the
                            platform generates placeholder names such as
                            <code class="bg-gray-100 px-1 rounded">channel_000</code>.
                        </li>
                        <li>
                            <strong>Failure mode:</strong> If the file cannot be interpreted as a supported
                            multidimensional image cube, the parse job fails and no analysis artifacts are produced.
                        </li>
                    </ul>
                </div>

                <div v-else-if="selected === 'TIFF'" class="data-format-content">
                    <p>
                        <strong>TIFF</strong> is a widely used <em>raster image container format</em> for
                        scientific imaging, microscopy, and image exchange. Within this platform, TIFF files are
                        supported as raw input for the hyperspectral workflow when the file is a standard image or
                        image stack. If the uploaded TIFF contains OME metadata, the platform uses the OME-TIFF
                        workflow instead.
                    </p>
                    <p>
                        Although TIFF is broadly supported, files can vary substantially in dimensional organization
                        depending on how they were written. The platform converts supported TIFF inputs into the same
                        hyperspectral project structure used for the other supported formats.
                    </p>
                    <ul>
                        <li>
                            <strong>File extensions:</strong> The expected source files use
                            <code class="bg-gray-100 px-1 rounded">.tif</code> or
                            <code class="bg-gray-100 px-1 rounded">.tiff</code>.
                        </li>
                        <li>
                            <strong>Analytical role:</strong> In this workflow, the TIFF file is treated as the raw
                            image source from which standardized downstream artifacts are derived.
                        </li>
                        <li>
                            <strong>Metadata handling:</strong> Inspection records TIFF series metadata, data type,
                            ImageJ metadata presence, OME XML presence, and available pixel-size metadata. Files with
                            OME metadata are handled by the OME-TIFF workflow.
                        </li>
                        <li>
                            <strong>Series handling:</strong> If the TIFF contains multiple separate image series or
                            stacks, the platform currently uses the first series only and shows a warning.
                        </li>
                    </ul>

                    <h4 class="text-lg font-semibold mt-6 mb-3">Stack handling</h4>
                    <p>
                        Standard TIFF files do not usually require manual axis selection in the upload dialog. The
                        image width and height are used as the spatial axes, and image pages are used as layers.
                    </p>
                    <ul>
                        <li><strong>Single 2D TIFF:</strong> The image becomes one layer.</li>
                        <li><strong>Multi-page TIFF stack:</strong> Pages in the first series become layers.</li>
                        <li><strong>Multiple image series/stacks in one TIFF:</strong> Only the first series is used. To analyze every stack, upload each stack as a separate file when possible.</li>
                    </ul>

                    <h4 class="text-lg font-semibold mt-6 mb-3">Additional requirements and behavior</h4>
                    <ul>
                        <li>
                            <strong>Minimum dimensionality:</strong> The TIFF input must have at least two dimensions.
                            Files with fewer than two dimensions are rejected.
                        </li>
                        <li>
                            <strong>Normalization:</strong> The exported hypercube is converted to
                            <code class="bg-gray-100 px-1 rounded">float32</code> and normalized by the global maximum
                            so that the maximum of the flattened dataset is
                            <code class="bg-gray-100 px-1 rounded">1.0</code>.
                        </li>
                        <li>
                            <strong>Axis vectors:</strong> X and Y axis vectors are derived from physical calibration
                            metadata when possible. If calibration metadata is unavailable, the platform falls back to
                            integer index coordinates.
                        </li>
                        <li>
                            <strong>XY calibration source:</strong> Physical pixel spacing is derived from TIFF
                            resolution tags when possible. Resolution units of inches or centimeters are converted
                            into micrometers.
                        </li>
                        <li>
                            <strong>Layer calibration:</strong> The plain TIFF layer axis represents the image page
                            dimension and defaults to index-based coordinates.
                        </li>
                        <li>
                            <strong>Units:</strong> If usable physical calibration is available, X and Y units are
                            exported as physical units. Otherwise the exported units default to
                            <code class="bg-gray-100 px-1 rounded">index</code>.
                        </li>
                        <li>
                            <strong>Channel naming:</strong> The TIFF reader currently generates placeholder layer
                            names such as
                            <code class="bg-gray-100 px-1 rounded">channel_000</code>,
                            <code class="bg-gray-100 px-1 rounded">channel_001</code>, and so on, rather than
                            preserving semantic channel labels.
                        </li>
                        <li>
                            <strong>Failure mode:</strong> If the TIFF cannot be interpreted as at least a
                            two-dimensional image with valid spatial axes, the parse job fails and no analysis
                            artifacts are produced.
                        </li>
                    </ul>
                    <p>
                        This organization standardizes TIFF inputs into a consistent hyperspectral representation while
                        preserving usable structural and calibration metadata when available.
                    </p>
                    <a href="/examples/data/example_data.tif" download class="text-brand underline hover:opacity-80">
                        Download example TIFF file (example_data.tif)
                    </a>
                </div>

                <div v-else-if="selected === 'OME-TIFF'" class="data-format-content">
                    <p>
                        <strong>OME-TIFF</strong> is a TIFF-based microscopy format that stores OME metadata together
                        with image planes. It is useful when the acquisition contains explicit dimensional metadata,
                        physical pixel sizes, and channel labels. In the upload flow, OME-TIFF is selected from the
                        upload menu. A TIFF file with OME metadata is handled with this workflow; a standard TIFF
                        without OME metadata is handled with the standard TIFF workflow.
                    </p>

                    <ul>
                        <li>
                            <strong>File extensions:</strong>
                            <code class="bg-gray-100 px-1 rounded">.ome.tif</code>,
                            <code class="bg-gray-100 px-1 rounded">.ome.tiff</code>,
                            <code class="bg-gray-100 px-1 rounded">.tif</code>, or
                            <code class="bg-gray-100 px-1 rounded">.tiff</code>.
                        </li>
                        <li>
                            <strong>Inspection metadata:</strong> OME schema, OME dimension order, series index,
                            image-description tag information, physical sizes, physical units, and channel labels are
                            reported when available.
                        </li>
                        <li>
                            <strong>Warnings:</strong> Inspection warnings are shown directly in the upload modal and
                            should be reviewed before analysis is started.
                        </li>
                    </ul>

                    <h4 class="text-lg font-semibold mt-6 mb-3">Upload inspection and axis selection</h4>
                    <p>
                        OME-TIFF inspection reports the detected axis order, shape, per-axis sizes and units, and the
                        axes that can be used as layer axes. The user selects which source axes represent
                        <code class="bg-gray-100 px-1 rounded">x</code> and
                        <code class="bg-gray-100 px-1 rounded">y</code>, and may assign
                        <code class="bg-gray-100 px-1 rounded">z</code>,
                        <code class="bg-gray-100 px-1 rounded">c</code>, and
                        <code class="bg-gray-100 px-1 rounded">t</code> when those roles are relevant.
                    </p>
                    <p>
                        Any source axis with size greater than one that is not assigned to an analysis role must be
                        fixed to a single index. This makes the dimensional reduction explicit and reproducible.
                    </p>
                    <pre class="bg-gray-900 text-gray-100 rounded p-4 text-sm overflow-x-auto whitespace-pre-wrap">source axes -> user-confirmed x/y/z/c/t roles + fixed indices
output hypercube shape = [layer, y, x]</pre>
                </div>

                <div v-else-if="selected === 'OME-Zarr'" class="data-format-content">
                    <p>
                        <strong>OME-Zarr</strong> is a chunked, directory-based microscopy format designed for
                        scalable multidimensional image data. It stores image arrays and metadata in a Zarr hierarchy,
                        commonly with multiscale pyramids for efficient browsing and analysis.
                    </p>

                    <ul>
                        <li>
                            <strong>Upload selection:</strong> OME-Zarr uploads use a directory picker. Select the
                            root OME-Zarr folder rather than an individual file inside the dataset.
                        </li>
                        <li>
                            <strong>Metadata:</strong> OME-Zarr version, Zarr format, dataset path,
                            multiscales count, and metadata paths are reported when available.
                        </li>
                    </ul>

                    <h4 class="text-lg font-semibold mt-6 mb-3">Upload inspection and axis selection</h4>
                    <p>
                        OME-Zarr inspection reports the source axis order, shape, per-axis sizes and units, candidate
                        layer axes, and a recommended layer axis when one can be inferred. The upload modal uses those
                        inspected axes directly; it does not infer axis roles from the folder name or file extension.
                    </p>
                    <ul>
                        <li><strong>X and Y:</strong> Required spatial axes selected by the user.</li>
                        <li><strong>Z, C, and T:</strong> Optional roles selected when the dataset contains depth, channel, or time axes.</li>
                        <li><strong>Fixed indices:</strong> Unassigned axes with size greater than one must be fixed to one index.</li>
                        <li><strong>Reusable settings:</strong> For batch uploads, the same axis settings can be reused for subsequent datasets only when inspected dimensions match exactly.</li>
                    </ul>
                    <pre class="bg-gray-900 text-gray-100 rounded p-4 text-sm overflow-x-auto whitespace-pre-wrap">OME-Zarr axes -> user-confirmed analysis roles
output hypercube shape = [layer, y, x]</pre>
                </div>

                <div v-else class="data-format-content">
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

const sections = ['OIR', 'TIFF', 'OME-TIFF', 'OME-Zarr']
const selected = ref(
    sections.includes(String(route.query.section ?? ''))
        ? String(route.query.section)
        : 'OIR'
)
const selectedLabel = computed(() => {
    if (selected.value === 'Output') {
        return 'Output files'
    }
    return selected.value
})

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
