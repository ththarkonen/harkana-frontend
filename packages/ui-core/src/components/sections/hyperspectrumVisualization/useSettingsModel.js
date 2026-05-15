import { onMounted, reactive, ref } from "vue"
import { settings as settingslib, utils } from "@harkana/tools"
import {
    colorscales,
    DEFAULT_HYPERSPECTRUM_PRIORITIZATION,
    DEFAULT_ROI_PALETTE,
    DEFAULT_Z_BLEND_PALETTE,
    HYPERSPECTRUM_DISPLAY_MODES,
    PCA_DEFAULT_COLORS,
    pcaColorEntries,
    prioritizationEntries,
    visualizationTabs
} from "./constants.js"

function normalizeCheckbox( value, fallback = true ){

    if( typeof value === "boolean" ){
        return value
    }

    if( typeof value === "string" ){
        if( value === "false" ) return false
        if( value === "true" ) return true
    }

    return fallback
}

function normalizeOpacity( value, fallback = 0.25 ){

    const numeric = Number( value )
    if( Number.isFinite( numeric ) === false ){
        return fallback
    }

    return Math.min( 1, Math.max( 0, numeric ))
}

function normalizeDisplayMode( value ){
    const normalized = String( value ?? "" ).trim()
    return HYPERSPECTRUM_DISPLAY_MODES.has( normalized ) ? normalized : "umap"
}

function normalizeHeatmapInteraction( value ){
    return String( value ?? "" ).trim().toLowerCase() === "zoom" ? "zoom" : "select"
}

function normalizeHeatmapRenderer(){
    return "deckgl"
}

function normalizeHeatmapZoomAspectRatio( value ){
    return String( value ?? "" ).trim().toLowerCase() === "free" ? "free" : "square"
}

function normalizeSelectionConfidenceLevel( value ){

    if( String( value ?? "" ).trim().toLowerCase() === "none" ){
        return "none"
    }

    const numeric = Number.parseInt( value, 10 )
    if([ 50, 75, 90, 95 ].includes( numeric )){
        return String( numeric )
    }

    return "95"
}

function normalizeRoiEstimateUncertaintyLevel( value ){
    const normalized = String( value ?? "" ).trim().toLowerCase()
    if( normalized === "show" ){
        return "95"
    }

    if( normalized === "hide" ){
        return "none"
    }

    return normalizeSelectionConfidenceLevel( value )
}

function normalizeShowHide( value, fallback = "hide" ){
    const normalized = String( value ?? "" ).trim().toLowerCase()
    if( normalized === "show" || normalized === "hide" ){
        return normalized
    }
    return fallback === "show" ? "show" : "hide"
}

function normalizeFalseColoringBasis( value ){
    return String( value ?? "" ).trim().toLowerCase() === "raman" ? "raman" : "measurement"
}

function normalizeZBlendPalette( value ){
    const source = Array.isArray( value ) ? value : []
    const resolvedPalette = source
        .map(( entry ) => String( entry ?? "" ).trim() )
        .filter(( entry ) => entry.length > 0 )
        .slice( 0, DEFAULT_Z_BLEND_PALETTE.length )

    while( resolvedPalette.length < DEFAULT_Z_BLEND_PALETTE.length ){
        resolvedPalette.push( DEFAULT_Z_BLEND_PALETTE[resolvedPalette.length] )
    }

    return resolvedPalette
}

function normalizeRoiPalette( value, primaryFallback = DEFAULT_ROI_PALETTE[0] ){
    const source = Array.isArray( value ) ? value : []
    const fallbackPrimary = typeof primaryFallback === "string" && primaryFallback.trim().length > 0
        ? primaryFallback.trim()
        : DEFAULT_ROI_PALETTE[0]
    const defaultPalette = [ fallbackPrimary, ...DEFAULT_ROI_PALETTE.slice( 1 ) ]
    const resolvedPalette = source
        .map(( entry ) => String( entry ?? "" ).trim() )
        .filter(( entry ) => entry.length > 0 )
        .slice( 0, defaultPalette.length )

    while( resolvedPalette.length < defaultPalette.length ){
        resolvedPalette.push( defaultPalette[resolvedPalette.length] )
    }

    return resolvedPalette
}

function normalizePrioritization( value ){

    const source = value !== null && typeof value === "object" ? value : {}
    const normalized = { ...DEFAULT_HYPERSPECTRUM_PRIORITIZATION }

    for( const key of Object.keys( DEFAULT_HYPERSPECTRUM_PRIORITIZATION ) ){
        normalized[key] = normalizeCheckbox(
            source[key],
            DEFAULT_HYPERSPECTRUM_PRIORITIZATION[key]
        )
    }

    return normalized
}

function useHyperspectrumVisualizationSettings(){

    const updating = ref( false )
    const activeVisualizationTab = ref( "axis" )

    const layout = reactive({
        leftPlotsReversed: "false",
        heatmapOrigin: "bottom-left"
    })

    const labels = reactive({
        horizontal: "x",
        vertical: "y",
        spectral: "\\nu",
        intensity: "I",
        showUnits: true
    })

    const gridlines = reactive({
        hyperspectra: false
    })

    const colormaps = reactive({
        mip: "Viridis",
        layer: "Viridis"
    })

    const spectrumColors = reactive({
        queriedSpectrum: "#1f77b4",
        queriedInterval: "#1f77b4"
    })

    const umapChannelColors = reactive({
        r: "#ff0000",
        g: "#00ff00",
        b: "#0000ff"
    })

    const zBlendPalette = reactive([ ...DEFAULT_Z_BLEND_PALETTE ])
    const roiPalette = reactive([ ...DEFAULT_ROI_PALETTE ])

    const roiColors = reactive({
        roiSpectrum: "#333333",
        roiInterval: "#333333",
        roiBox: "#ffffff",
        roiTitle: "#ffffff",
        selectionBox: "#9ca3af"
    })

    const spectrumOptions = reactive({
        intervalOpacity: 0.25,
        showInterval: true
    })

    const roiOptions = reactive({
        showInterval: true,
        intervalOpacity: 0.25,
        overlayOpacity: 0.25
    })

    const viewerDefaults = reactive({
        displayMode: "umap",
        heatmapInteraction: "select",
        heatmapRenderer: "deckgl",
        heatmapZoomAspectRatio: "square",
        selectionConfidenceLevel: "95",
        loadings: "hide",
        falseColoringBasis: "measurement",
        roiEstimateUncertainty: "95"
    })

    const prioritization = reactive({ ...DEFAULT_HYPERSPECTRUM_PRIORITIZATION })

    const fontSizes = reactive({
        axis: 16,
        label: 16
    })

    const pcaComponentColors = reactive({ ...PCA_DEFAULT_COLORS })

    const syncFromSettings = ( savedSettings ) => {

        layout.leftPlotsReversed = savedSettings?.layout?.leftPlotsReversed === "true" ? "true" : "false"
        layout.heatmapOrigin = savedSettings?.layout?.heatmapOrigin === "top-left" ? "top-left" : "bottom-left"

        labels.horizontal = typeof savedSettings?.labels?.horizontal === "string" ? savedSettings.labels.horizontal : "x"
        labels.vertical = typeof savedSettings?.labels?.vertical === "string" ? savedSettings.labels.vertical : "y"
        labels.spectral = typeof savedSettings?.labels?.spectral === "string" ? savedSettings.labels.spectral : "\\nu"
        labels.intensity = typeof savedSettings?.labels?.intensity === "string" ? savedSettings.labels.intensity : "I"
        labels.showUnits = normalizeCheckbox( savedSettings?.labels?.showUnits, true )
        gridlines.hyperspectra = normalizeCheckbox( savedSettings?.gridlines?.hyperspectra, false )

        colormaps.mip = typeof savedSettings?.colormaps?.mip === "string" && savedSettings.colormaps.mip.length > 0
            ? savedSettings.colormaps.mip
            : "Viridis"
        colormaps.layer = typeof savedSettings?.colormaps?.layer === "string" && savedSettings.colormaps.layer.length > 0
            ? savedSettings.colormaps.layer
            : "Viridis"

        spectrumColors.queriedSpectrum =
            typeof savedSettings?.hyperspectrumColors?.queriedSpectrum === "string" && savedSettings.hyperspectrumColors.queriedSpectrum.length > 0
                ? savedSettings.hyperspectrumColors.queriedSpectrum
                : "#1f77b4"
        spectrumColors.queriedInterval =
            typeof savedSettings?.hyperspectrumColors?.queriedInterval === "string" && savedSettings.hyperspectrumColors.queriedInterval.length > 0
                ? savedSettings.hyperspectrumColors.queriedInterval
                : "#1f77b4"
        roiColors.roiSpectrum =
            typeof savedSettings?.hyperspectrumColors?.roiSpectrum === "string" && savedSettings.hyperspectrumColors.roiSpectrum.length > 0
                ? savedSettings.hyperspectrumColors.roiSpectrum
                : "#333333"
        roiColors.roiInterval =
            typeof savedSettings?.hyperspectrumColors?.roiInterval === "string" && savedSettings.hyperspectrumColors.roiInterval.length > 0
                ? savedSettings.hyperspectrumColors.roiInterval
                : "#333333"
        roiColors.roiBox =
            typeof savedSettings?.hyperspectrumColors?.roiBox === "string" && savedSettings.hyperspectrumColors.roiBox.length > 0
                ? savedSettings.hyperspectrumColors.roiBox
                : (
                    typeof savedSettings?.hyperspectrumColors?.roiOverlay === "string" && savedSettings.hyperspectrumColors.roiOverlay.length > 0
                        ? savedSettings.hyperspectrumColors.roiOverlay
                        : "#ffffff"
                )
        roiColors.roiTitle =
            typeof savedSettings?.hyperspectrumColors?.roiTitle === "string" && savedSettings.hyperspectrumColors.roiTitle.length > 0
                ? savedSettings.hyperspectrumColors.roiTitle
                : (
                    typeof savedSettings?.hyperspectrumColors?.roiOverlay === "string" && savedSettings.hyperspectrumColors.roiOverlay.length > 0
                        ? savedSettings.hyperspectrumColors.roiOverlay
                        : "#ffffff"
                )
        roiColors.selectionBox =
            typeof savedSettings?.hyperspectrumColors?.selectionBox === "string" && savedSettings.hyperspectrumColors.selectionBox.length > 0
                ? savedSettings.hyperspectrumColors.selectionBox
                : "#9ca3af"
        const normalizedRoiPalette = normalizeRoiPalette(
            savedSettings?.hyperspectrumColors?.roiPalette,
            roiColors.roiSpectrum
        )
        for( let index = 0; index < DEFAULT_ROI_PALETTE.length; index++ ){
            roiPalette[index] = normalizedRoiPalette[index]
        }

        umapChannelColors.r =
            typeof savedSettings?.hyperspectrumColors?.umapChannels?.r === "string" && savedSettings.hyperspectrumColors.umapChannels.r.length > 0
                ? savedSettings.hyperspectrumColors.umapChannels.r
                : "#ff0000"
        umapChannelColors.g =
            typeof savedSettings?.hyperspectrumColors?.umapChannels?.g === "string" && savedSettings.hyperspectrumColors.umapChannels.g.length > 0
                ? savedSettings.hyperspectrumColors.umapChannels.g
                : "#00ff00"
        umapChannelColors.b =
            typeof savedSettings?.hyperspectrumColors?.umapChannels?.b === "string" && savedSettings.hyperspectrumColors.umapChannels.b.length > 0
                ? savedSettings.hyperspectrumColors.umapChannels.b
                : "#0000ff"
        const normalizedZBlendPalette = normalizeZBlendPalette(
            savedSettings?.hyperspectrumColors?.zBlendPalette
        )
        for( let index = 0; index < DEFAULT_Z_BLEND_PALETTE.length; index++ ){
            zBlendPalette[index] = normalizedZBlendPalette[index]
        }

        spectrumOptions.intervalOpacity = normalizeOpacity(
            savedSettings?.hyperspectrumSpectrum?.intervalOpacity,
            0.25
        )
        spectrumOptions.showInterval = normalizeCheckbox(
            savedSettings?.hyperspectrumSpectrum?.showInterval,
            true
        )

        roiOptions.showInterval = normalizeCheckbox(
            savedSettings?.hyperspectrumRoi?.showInterval,
            true
        )
        roiOptions.intervalOpacity = normalizeOpacity(
            savedSettings?.hyperspectrumRoi?.intervalOpacity,
            0.25
        )
        roiOptions.overlayOpacity = normalizeOpacity(
            savedSettings?.hyperspectrumRoi?.overlayOpacity,
            0.25
        )

        viewerDefaults.displayMode = normalizeDisplayMode(
            savedSettings?.hyperspectrumDefaults?.displayMode
        )
        viewerDefaults.heatmapInteraction = normalizeHeatmapInteraction(
            savedSettings?.hyperspectrumDefaults?.heatmapInteraction
        )
        viewerDefaults.heatmapRenderer = normalizeHeatmapRenderer(
            savedSettings?.hyperspectrumDefaults?.heatmapRenderer
        )
        viewerDefaults.heatmapZoomAspectRatio = normalizeHeatmapZoomAspectRatio(
            savedSettings?.hyperspectrumDefaults?.heatmapZoomAspectRatio
        )
        viewerDefaults.selectionConfidenceLevel = normalizeSelectionConfidenceLevel(
            savedSettings?.hyperspectrumDefaults?.selectionConfidenceLevel
        )
        viewerDefaults.loadings = normalizeShowHide(
            savedSettings?.hyperspectrumDefaults?.loadings,
            "hide"
        )
        viewerDefaults.falseColoringBasis = normalizeFalseColoringBasis(
            savedSettings?.hyperspectrumDefaults?.falseColoringBasis
        )
        viewerDefaults.roiEstimateUncertainty = normalizeRoiEstimateUncertaintyLevel(
            savedSettings?.hyperspectrumDefaults?.roiEstimateUncertainty
        )
        const normalizedPrioritization = normalizePrioritization(
            savedSettings?.hyperspectrumPrioritization
        )
        for( const key of Object.keys( DEFAULT_HYPERSPECTRUM_PRIORITIZATION ) ){
            prioritization[key] = normalizedPrioritization[key]
        }

        fontSizes.axis = Number.isFinite( Number( savedSettings?.font?.sizes?.axis ))
            ? Number( savedSettings.font.sizes.axis )
            : 16
        fontSizes.label = Number.isFinite( Number( savedSettings?.font?.sizes?.label ))
            ? Number( savedSettings.font.sizes.label )
            : 16

        for( const entry of pcaColorEntries ){
            const componentIndex = entry.componentIndex
            const savedColor = savedSettings?.hyperspectrumColors?.pcaComponents?.[componentIndex]

            pcaComponentColors[componentIndex] = typeof savedColor === "string" && savedColor.length > 0
                ? savedColor
                : PCA_DEFAULT_COLORS[componentIndex]
        }
    }

    const updateSettings = async () => {

        updating.value = true

        const savedSettings = await settingslib.get()

        savedSettings.layout = {
            ...( savedSettings.layout ?? {} ),
            leftPlotsReversed: layout.leftPlotsReversed,
            heatmapOrigin: layout.heatmapOrigin
        }

        savedSettings.labels = {
            ...( savedSettings.labels ?? {} ),
            horizontal: labels.horizontal,
            vertical: labels.vertical,
            spectral: labels.spectral,
            intensity: labels.intensity,
            showUnits: labels.showUnits
        }
        savedSettings.gridlines = {
            ...( savedSettings.gridlines ?? {} ),
            hyperspectra: gridlines.hyperspectra === true
        }

        savedSettings.font = {
            ...( savedSettings.font ?? {} ),
            sizes: {
                ...( savedSettings.font?.sizes ?? {} ),
                axis: Number( fontSizes.axis ) || 16,
                label: Number( fontSizes.label ) || 16
            }
        }

        savedSettings.colormaps = {
            ...( savedSettings.colormaps ?? {} ),
            mip: colormaps.mip,
            layer: colormaps.layer
        }

        const normalizedRoiPalette = normalizeRoiPalette( roiPalette )
        const primaryRoiColor = normalizedRoiPalette[0] ?? DEFAULT_ROI_PALETTE[0]

        savedSettings.hyperspectrumColors = {
            ...( savedSettings.hyperspectrumColors ?? {} ),
            queriedSpectrum: spectrumColors.queriedSpectrum,
            queriedInterval: spectrumColors.queriedInterval,
            roiSpectrum: primaryRoiColor,
            roiInterval: primaryRoiColor,
            roiPalette: normalizedRoiPalette,
            roiBox: roiColors.roiBox,
            roiTitle: roiColors.roiTitle,
            selectionBox: roiColors.selectionBox,
            roiOverlay: roiColors.roiBox,
            umapChannels: {
                ...( savedSettings.hyperspectrumColors?.umapChannels ?? {} ),
                r: umapChannelColors.r,
                g: umapChannelColors.g,
                b: umapChannelColors.b
            },
            zBlendPalette: normalizeZBlendPalette( zBlendPalette ),
            pcaComponents: {
                ...( savedSettings.hyperspectrumColors?.pcaComponents ?? {} )
            }
        }

        savedSettings.hyperspectrumSpectrum = {
            ...( savedSettings.hyperspectrumSpectrum ?? {} ),
            showInterval: spectrumOptions.showInterval,
            intervalOpacity: normalizeOpacity( spectrumOptions.intervalOpacity, 0.25 )
        }

        spectrumOptions.intervalOpacity = normalizeOpacity( spectrumOptions.intervalOpacity, 0.25 )

        savedSettings.hyperspectrumRoi = {
            ...( savedSettings.hyperspectrumRoi ?? {} ),
            showInterval: roiOptions.showInterval,
            intervalOpacity: normalizeOpacity( roiOptions.intervalOpacity, 0.25 ),
            overlayOpacity: normalizeOpacity( roiOptions.overlayOpacity, 0.25 )
        }

        savedSettings.hyperspectrumDefaults = {
            ...( savedSettings.hyperspectrumDefaults ?? {} ),
            displayMode: normalizeDisplayMode( viewerDefaults.displayMode ),
            heatmapInteraction: normalizeHeatmapInteraction( viewerDefaults.heatmapInteraction ),
            heatmapRenderer: normalizeHeatmapRenderer( viewerDefaults.heatmapRenderer ),
            heatmapZoomAspectRatio: normalizeHeatmapZoomAspectRatio( viewerDefaults.heatmapZoomAspectRatio ),
            selectionConfidenceLevel: viewerDefaults.selectionConfidenceLevel === "none"
                ? "none"
                : Number.parseInt( normalizeSelectionConfidenceLevel( viewerDefaults.selectionConfidenceLevel ), 10 ),
            loadings: normalizeShowHide( viewerDefaults.loadings, "hide" ),
            falseColoringBasis: normalizeFalseColoringBasis( viewerDefaults.falseColoringBasis ),
            roiEstimateUncertainty: viewerDefaults.roiEstimateUncertainty === "none"
                ? "none"
                : Number.parseInt( normalizeRoiEstimateUncertaintyLevel( viewerDefaults.roiEstimateUncertainty ), 10 )
        }
        savedSettings.hyperspectrumPrioritization = {
            ...( savedSettings.hyperspectrumPrioritization ?? {} ),
            ...normalizePrioritization( prioritization )
        }

        roiOptions.intervalOpacity = normalizeOpacity( roiOptions.intervalOpacity, 0.25 )
        roiOptions.overlayOpacity = normalizeOpacity( roiOptions.overlayOpacity, 0.25 )

        for( const entry of pcaColorEntries ){
            const componentIndex = entry.componentIndex
            savedSettings.hyperspectrumColors.pcaComponents[componentIndex] =
                typeof pcaComponentColors[componentIndex] === "string" && pcaComponentColors[componentIndex].length > 0
                    ? pcaComponentColors[componentIndex]
                    : PCA_DEFAULT_COLORS[componentIndex]
        }

        await settingslib.set( savedSettings )

        await utils.wait( 1000 )
        updating.value = false
    }

    const resetSettings = async () => {

        updating.value = true

        const defaultSettings = await settingslib.getDefaultSettings()
        await settingslib.set( defaultSettings )
        syncFromSettings( defaultSettings )

        await utils.wait( 1000 )
        updating.value = false
    }

    onMounted( async () => {
        const savedSettings = await settingslib.get()
        syncFromSettings( savedSettings )
    })

    return {
        activeVisualizationTab,
        colorscales,
        colormaps,
        fontSizes,
        gridlines,
        labels,
        layout,
        pcaColorEntries,
        pcaComponentColors,
        prioritization,
        prioritizationEntries,
        resetSettings,
        roiColors,
        roiOptions,
        roiPalette,
        spectrumColors,
        spectrumOptions,
        updateSettings,
        updating,
        umapChannelColors,
        viewerDefaults,
        visualizationTabs,
        zBlendPalette
    }
}

export {
    useHyperspectrumVisualizationSettings
}
