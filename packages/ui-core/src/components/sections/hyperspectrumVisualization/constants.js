const colorscales = [
    "Blackbody",
    "Bluered",
    "Blues",
    "Cividis",
    "Earth",
    "Electric",
    "Greens",
    "Greys",
    "Hot",
    "Jet",
    "Picnic",
    "Portland",
    "Rainbow",
    "RdBu",
    "Reds",
    "Viridis",
    "YlGnBu",
    "YlOrRd"
]

const PCA_DEFAULT_COLORS = {
    1: "#0072b2",
    2: "#e69f00",
    3: "#009e73",
    4: "#d55e00",
    5: "#cc79a7",
    6: "#56b4e9",
    7: "#f0e442",
    8: "#8c564b",
    9: "#f781bf",
    10: "#7f7f7f"
}

const HYPERSPECTRUM_DISPLAY_MODES = new Set([
    "mip",
    "mip_hsv",
    "umap",
    "layer",
    "z_blend",
    "custom_index",
    "pca",
    "pca_mip",
    "pca_rgb",
    "rpca",
    "rpca_mip",
    "rpca_rgb"
])

const pcaColorEntries = Array.from({ length: 10 }, (_, index ) => {
    const componentIndex = index + 1
    return {
        componentIndex,
        label: "PC" + String( componentIndex ).padStart( 2, "0" )
    }
})

const visualizationTabs = [
    { id: "axis", label: "Axis settings" },
    { id: "colormaps", label: "Colormaps" },
    { id: "initialization", label: "Initialization" },
    { id: "umap", label: "UMAP channel colors" },
    { id: "z-blend", label: "Z-blend palette" },
    { id: "custom-index", label: "Custom indices" },
    { id: "spectrum", label: "Spectrum selection color" },
    { id: "roi", label: "Regions of interest" },
    { id: "pca", label: "PCA colors" }
]

const DEFAULT_Z_BLEND_PALETTE = [
    "#0000ff",
    "#00ff00",
    "#ff00ff",
    "#ffff00",
    "#00ffff",
    "#ff0000",
    "#0000ff",
    "#00ff00",
    "#ff00ff",
    "#ffff00"
]

const DEFAULT_ROI_PALETTE = [
    "#ff7f0e",
    "#2ca02c",
    "#d62728",
    "#9467bd",
    "#8c564b",
    "#e377c2",
    "#7f7f7f",
    "#bcbd22",
    "#17becf",
    "#333333"
]

const DEFAULT_HYPERSPECTRUM_PRIORITIZATION = {
    mip: true,
    mip_hsv: true,
    umap: true,
    z_blend: false,
    custom_index: false,
    layer_window: true,
    pca: false,
    pca_mip: false,
    pca_rgb: false,
    rpca: false,
    rpca_mip: false,
    rpca_rgb: false
}

const prioritizationEntries = [
    { key: "mip", label: "MIP" },
    { key: "mip_hsv", label: "HSV-mapped MIP" },
    { key: "umap", label: "UMAP" },
    { key: "z_blend", label: "Z-blend" },
    { key: "custom_index", label: "Custom index" },
    { key: "layer_window", label: "Layer neighborhood" },
    { key: "pca", label: "PCA classification" },
    { key: "pca_mip", label: "PCA MIP" },
    { key: "pca_rgb", label: "PCA RGB" },
    { key: "rpca", label: "RPCA classification" },
    { key: "rpca_mip", label: "RPCA MIP" },
    { key: "rpca_rgb", label: "RPCA RGB" }
]

export {
    colorscales,
    DEFAULT_HYPERSPECTRUM_PRIORITIZATION,
    DEFAULT_ROI_PALETTE,
    DEFAULT_Z_BLEND_PALETTE,
    HYPERSPECTRUM_DISPLAY_MODES,
    PCA_DEFAULT_COLORS,
    pcaColorEntries,
    prioritizationEntries,
    visualizationTabs
}
