<template>
<!-- Outer frame -->
<div class="bg-brand min-h-screen p-[2px] overflow-hidden">

	<!-- Mobile overlay -->
	<div v-if = "sidebarOpen" @click = "sidebarOpen = false" class = "fixed inset-0 bg-black/40 z-30 md:hidden"></div>
	<!-- App Grid -->
	<div class="grid h-[calc(100vh-4px)] gap-[2px] grid-cols-1 grid-rows-[auto_1fr] md:grid-cols-[16rem_1fr] md:grid-rows-[auto_1fr]">

			<Sidebar :style = "sidebarStyle">
				<Logo></Logo>

				<SidebarButton @click = "navigation.route('Main menu', {})" class = "my-2">
					Project menu
				</SidebarButton>

				<div class = "mt-2 p-2 shadow-md shadow-black border-2 border-gray bg-gray-800 rounded-lg">
					<div class = "flex items-center justify-between gap-2 mb-2">
						<h3 class = "text-white font-semibold">Display</h3>

						<BaseDropdown :show-chevron = "false"
									  :close-on-select = "true"
									  :teleport-to-body = "true"
									  trigger-class = "h-8 w-8 inline-flex items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand"
									  menu-class = "fixed z-[45] min-w-[18rem] w-max max-w-[50vw] origin-top-left rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30">
							<template v-slot:trigger>
								<span class = "sr-only">Display options</span>
								<i class = "fas fa-ellipsis-v" aria-hidden = "true" title = "Display options"></i>
							</template>

							<li class = "px-4 pt-2 pb-1 text-xs uppercase tracking-wide text-white/70">
								Heatmap interaction
							</li>
							<li>
								<button @click = "setHeatmapInteractionMode('select')"
										class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
									<span>Select spectra</span>
									<i :class = "heatmapInteractionMode === 'select' ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
									   aria-hidden = "true"></i>
								</button>
							</li>
								<li>
									<button @click = "setHeatmapInteractionMode('zoom')"
											class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
										<span>Zoom</span>
										<i :class = "heatmapInteractionMode === 'zoom' ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
										   aria-hidden = "true"></i>
									</button>
								</li>

								<li><hr class = "h-0.5 bg-gray border-0"></li>
								<li class = "px-4 pt-2 pb-1 text-xs uppercase tracking-wide text-white/70">
									Selected region/pixel spectra
								</li>
								<li>
									<button @click = "setSelectedSpectraVisibility( true )"
											class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
										<span>Show</span>
										<i :class = "showSelectedSpectra ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
										   aria-hidden = "true"></i>
									</button>
								</li>
								<li>
									<button @click = "setSelectedSpectraVisibility( false )"
											class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
										<span>Hide</span>
										<i :class = "showSelectedSpectra === false ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
										   aria-hidden = "true"></i>
									</button>
								</li>

								<li><hr class = "h-0.5 bg-gray border-0"></li>
								<li class = "px-4 pt-2 pb-1 text-xs uppercase tracking-wide text-white/70">
									Selection confidence level (%)
								</li>
								<li>
									<button @click = "setSelectedConfidenceLevel( CONFIDENCE_NONE_VALUE )"
										class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
									<span>No uncertainty</span>
									<i :class = "selectedConfidenceLevelValue === CONFIDENCE_NONE_VALUE ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
									   aria-hidden = "true"></i>
								</button>
							</li>
								<li v-for = "level in confidenceLevelOptions"
									:key = "'display-confidence-' + level">
									<button @click = "setSelectedConfidenceLevel( level )"
											class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
										<span>{{ level }}</span>
											<i :class = "selectedConfidenceLevelValue === level ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
											   aria-hidden = "true"></i>
										</button>
									</li>

							

								<li><hr class = "h-0.5 bg-gray border-0"></li>
								<li class = "px-4 pt-2 pb-1 text-xs uppercase tracking-wide text-white/70">
									Loadings
								</li>
								<li>
									<button @click = "setPcaLoadingsVisibility( true )"
											class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
										<span>Show</span>
										<i :class = "showPcaLoadings ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
										   aria-hidden = "true"></i>
									</button>
								</li>
								<li>
									<button @click = "setPcaLoadingsVisibility( false )"
											class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
										<span>Hide</span>
										<i :class = "showPcaLoadings === false ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
										   aria-hidden = "true"></i>
									</button>
								</li>
							</BaseDropdown>
						</div>

					<select id = "plot-mode"
							v-model = "activePlot"
							class = "w-full rounded border border-gray-600 px-2 py-1 text-black bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
						<option value = "mip">MIP</option>
					<option value = "mip_hsv">HSV-mapped MIP</option>
					<option value = "umap">UMAP</option>
					<option value = "layer">Layer</option>
					<option value = "pca">PCA classification</option>
					<option value = "pca_mip">PCA MIP</option>
					<option value = "pca_rgb">PCA RGB</option>
					<option value = "rpca">RPCA classification</option>
						<option value = "rpca_mip">RPCA MIP</option>
						<option value = "rpca_rgb">RPCA RGB</option>
					</select>

				<div v-if = "activePlot === 'layer'" class = "mt-3">
					<label for = "layer-input" class = "block text-sm font-semibold text-white mb-1">
						Layer index
					</label>
					<input id = "layer-input"
							type = "number"
							min = "0"
							:max = "maxLayerIndex"
							step = "1"
							v-model = "layerInput"
							@input = "debouncedApplyLayerInput"
							@keydown.enter.prevent = "applyLayerInput"
							@blur = "applyLayerInput"
							class = "w-full rounded border border-gray-600 px-2 py-1 text-black text-center bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
				</div>

				<div v-if = "activePlot === 'pca' || activePlot === 'pca_mip' || activePlot === 'rpca' || activePlot === 'rpca_mip'" class = "mt-3">
					<div v-if = "activePlot === 'pca' || activePlot === 'rpca'" class = "mt-3">
						<label for = "pca-classification-component-count" class = "block text-sm font-semibold text-white mb-1">
							Number of components
						</label>
						<select id = "pca-classification-component-count"
								v-model = "pcaClassificationComponentCount"
								@change = "applyPcaClassificationComponentCount"
								class = "w-full rounded border border-gray-600 px-2 py-1 text-black bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
							<option v-for = "componentCount in pcaComponentIndices"
									:key = "'pca-classification-' + componentCount"
									:value = "componentCount">
								{{ componentCount }}
							</option>
						</select>
					</div>
					<div v-if = "activePlot === 'pca_mip' || activePlot === 'rpca_mip'" class = "mt-3">
						<label for = "pca-mip-component-count" class = "block text-sm font-semibold text-white mb-1">
							Number of components
						</label>
						<select id = "pca-mip-component-count"
								v-model = "pcaMipComponentCount"
								@change = "applyPcaMipComponentCount"
								class = "w-full rounded border border-gray-600 px-2 py-1 text-black bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
							<option v-for = "componentCount in pcaComponentIndices"
									:key = "'pca-mip-' + componentCount"
									:value = "componentCount">
								{{ componentCount }}
							</option>
						</select>
					</div>

						<div class = "grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
							<button v-for = "entry in visiblePcaLegendEntries"
								:key = "entry.label"
							type = "button"
							@click = "togglePcaComponent(entry.componentIndex)"
							:aria-pressed = "isPcaComponentActive(entry.componentIndex)"
							:title = "isPcaComponentActive(entry.componentIndex) ? `Hide ${entry.label}` : `Show ${entry.label}`"
							:class = "isPcaComponentActive(entry.componentIndex) ? 'opacity-100 ring-1 ring-white/70' : 'opacity-45'"
							class = "flex items-center text-xs text-white rounded px-1 py-0.5 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
							<span class = "inline-block w-3 h-3 rounded-sm mr-2"
									:style = "{ backgroundColor: entry.color }">
							</span>
								<span>{{ entry.label }}</span>
							</button>
						</div>
					</div>

				<div v-if = "activePlot === 'pca_rgb' || activePlot === 'rpca_rgb'" class = "mt-3">
					<p class = "text-sm text-white leading-snug">
						RGB composite from selected component scores.
					</p>

					<div class = "grid grid-cols-3 gap-2 mt-2">
						<div>
							<label for = "pca-r-input" class = "block text-xs font-semibold mb-1" style = "color: rgb(239, 68, 68);">R</label>
							<input id = "pca-r-input"
									type = "number"
									min = "1"
									max = "10"
									step = "1"
									v-model = "pcaRgbRedInput"
									@input = "debouncedApplyPcaRgbInput"
									@keydown.enter.prevent = "applyPcaRgbInput"
									@blur = "applyPcaRgbInput"
									class = "w-full rounded border border-gray-600 px-2 py-1 text-black text-center bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
						</div>

						<div>
							<label for = "pca-g-input" class = "block text-xs font-semibold mb-1" style = "color: rgb(34, 197, 94);">G</label>
							<input id = "pca-g-input"
									type = "number"
									min = "1"
									max = "10"
									step = "1"
									v-model = "pcaRgbGreenInput"
									@input = "debouncedApplyPcaRgbInput"
									@keydown.enter.prevent = "applyPcaRgbInput"
									@blur = "applyPcaRgbInput"
									class = "w-full rounded border border-gray-600 px-2 py-1 text-black text-center bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
						</div>

						<div>
							<label for = "pca-b-input" class = "block text-xs font-semibold mb-1" style = "color: rgb(59, 130, 246);">B</label>
							<input id = "pca-b-input"
									type = "number"
									min = "1"
									max = "10"
									step = "1"
									v-model = "pcaRgbBlueInput"
									@input = "debouncedApplyPcaRgbInput"
									@keydown.enter.prevent = "applyPcaRgbInput"
									@blur = "applyPcaRgbInput"
									class = "w-full rounded border border-gray-600 px-2 py-1 text-black text-center bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
						</div>
					</div>

					</div>
			</div>

				<div v-if = "project.shared || hasEstimatedRamanSpectraReady"
						 class = "mt-4 p-2 shadow-md shadow-black border-2 border-gray bg-gray-800 rounded-lg">
					<div class = "flex items-center justify-between gap-2">
						<div>
							<h3 class = "text-white font-semibold">Raman inference</h3>
						</div>

						<BaseDropdown :show-chevron = "false"
									  :close-on-select = "true"
									  :teleport-to-body = "true"
									  trigger-class = "h-8 w-8 inline-flex items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand"
									  menu-class = "fixed z-[45] min-w-[18rem] w-max max-w-[50vw] origin-top-left rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30">
							<template v-slot:trigger>
								<span class = "sr-only">Raman inference options</span>
								<i class = "fas fa-ellipsis-v" aria-hidden = "true" title = "Raman inference options"></i>
							</template>

								<template v-if = "hasSuccessfulRamanInference">
									<li class = "px-4 pt-2 pb-1 text-xs uppercase tracking-wide text-white/70">
										False-coloring basis
									</li>
									<li>
										<button @click = "setVisualizationDataSource('measurement')"
												class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
											<span>Measurements</span>
											<i :class = "visualizationDataSource === 'measurement' ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
											   aria-hidden = "true"></i>
										</button>
									</li>
									<li>
										<button @click = "setVisualizationDataSource('raman')"
												class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
											<span>Estimated Raman spectra</span>
											<i :class = "visualizationDataSource === 'raman' ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
											   aria-hidden = "true"></i>
										</button>
									</li>

									<li><hr class = "h-0.5 bg-gray border-0"></li>
								</template>
							<li class = "px-4 pt-2 pb-1 text-xs uppercase tracking-wide text-white/70">
								Bottom-left plot + loadings source
							</li>
							<li>
								<button @click = "setPrimarySpectrumSource('measurement')"
										class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
									<span>Measurements</span>
									<i :class = "primarySpectrumSource === 'measurement' ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
									   aria-hidden = "true"></i>
								</button>
							</li>
							<li>
								<button @click = "setPrimarySpectrumSource('raman')"
										class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
									<span>Estimated Raman spectra</span>
									<i :class = "primarySpectrumSource === 'raman' ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
									   aria-hidden = "true"></i>
								</button>
							</li>

							<li><hr class = "h-0.5 bg-gray border-0"></li>
							<li class = "px-4 pt-2 pb-1 text-xs uppercase tracking-wide text-white/70">
								Uncertainty level
							</li>
							<li>
								<button @click = "setSelectedConfidenceLevel( CONFIDENCE_NONE_VALUE )"
										class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
									<span>No uncertainty</span>
									<i :class = "selectedConfidenceLevelValue === CONFIDENCE_NONE_VALUE ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
									   aria-hidden = "true"></i>
								</button>
							</li>
							<li v-for = "level in confidenceLevelOptions"
								:key = "'raman-confidence-' + level">
								<button @click = "setSelectedConfidenceLevel( level )"
										class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
									<span>{{ level }}%</span>
									<i :class = "selectedConfidenceLevelValue === level ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
									   aria-hidden = "true"></i>
								</button>
							</li>
						</BaseDropdown>
					</div>
				</div>

					<div class = "mt-4 p-2 shadow-md shadow-black border-2 border-gray bg-gray-800 rounded-lg">
						<div class = "flex items-center justify-between gap-2 mb-2">
							<h3 class = "text-white font-semibold">Regions of interest</h3>

							<div class = "flex items-center gap-1.5">
								<BaseDropdown :show-chevron = "false"
									  :close-on-select = "true"
									  :teleport-to-body = "true"
									  trigger-class = "h-8 w-8 inline-flex items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand"
									  menu-class = "fixed z-[45] min-w-[16rem] w-max max-w-[50vw] origin-top-left rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30">
									<template v-slot:trigger>
										<span class = "sr-only">More ROI actions</span>
										<i class = "fas fa-ellipsis-v" aria-hidden = "true" title = "More ROI actions"></i>
									</template>

									<li>
										<button @click = "toggleAllRoiOverlays"
												:disabled = "rois.length === 0"
												class = "flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent">
											<i :class = "showAllRoiOverlays ? 'fas fa-eye-slash' : 'fas fa-eye'"
											   aria-hidden = "true"></i>
											<span>{{ showAllRoiOverlays ? "Hide all ROI boxes" : "Show all ROI boxes" }}</span>
										</button>
									</li>

										<template v-if = "hasEstimatedRamanSpectraReady">
										<li><hr class = "h-0.5 bg-gray border-0"></li>
										<li class = "px-4 pt-2 pb-1 text-xs uppercase tracking-wide text-white/70">
											Estimate ROI uncertainty
										</li>
										<li>
											<button @click = "setRoiEstimateUncertaintyMode('show')"
													class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
												<span>Show uncertainty</span>
												<i :class = "roiEstimateUncertaintyMode === 'show' ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
												   aria-hidden = "true"></i>
											</button>
										</li>
										<li>
											<button @click = "setRoiEstimateUncertaintyMode('hide')"
													class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
												<span>Hide uncertainty</span>
												<i :class = "roiEstimateUncertaintyMode === 'hide' ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
												   aria-hidden = "true"></i>
											</button>
										</li>
									</template>
								</BaseDropdown>
							</div>
						</div>

						<select id = "roi-select"
								v-model = "selectedRoiId"
							class = "w-full rounded border border-gray-600 px-2 py-1 text-black bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
						<option class = "text-gray" value = "">No region selected</option>
						<option v-for = "roi in rois" :key = "roi.roiId" :value = "roi.roiId">
							{{ roi.name }}
						</option>
					</select>

					<div class = "mt-2 flex flex-wrap items-center gap-1.5">
						<button v-if = "canMutateRois"
								@click = "openRoiSaveModal"
								:disabled = "!hasSelectedRegion"
								class = "h-8 w-8 inline-flex items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
								title = "Save selection as ROI"
								aria-label = "Save selection as ROI">
							<i class = "fas fa-save" aria-hidden = "true"></i>
						</button>

						<button v-if = "canMutateRois"
								@click = "openRoiDeleteModal"
								:disabled = "!selectedRoi"
								class = "h-8 w-8 inline-flex items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
								title = "Delete selected ROI"
								aria-label = "Delete selected ROI">
							<i class = "fas fa-trash" aria-hidden = "true"></i>
						</button>

						<button @click = "openRoiDescriptionModal"
								:disabled = "!selectedRoi"
								class = "h-8 w-8 inline-flex items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
								title = "Show ROI description"
								aria-label = "Show ROI description">
							<i class = "fas fa-info-circle" aria-hidden = "true"></i>
						</button>

						<button @click = "refreshRoisFromBackend"
								:disabled = "isRoiRefreshDisabled"
								class = "h-8 w-8 inline-flex items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
								title = "Reload ROIs from backend"
								aria-label = "Reload ROIs from backend">
							<i :class = "isRoiRefreshDisabled ? 'fas fa-sync-alt animate-spin' : 'fas fa-sync-alt'" aria-hidden = "true"></i>
						</button>
					</div>

					<p v-if = "canMutateRois && !hasSelectedRegion" class = "text-xs text-white/80 mt-1 leading-snug">
						Select a heatmap region first to save a new ROI.
					</p>

			</div>

		</Sidebar>

		<NavigationBar>
			<template v-slot:left-items>
				<button @click = "sidebarOpen = true" class = "md:hidden mr-4 px-3 py-2 rounded bg-slate-100">☰</button>
				<BaseDropdown>
					<template v-slot:trigger>
						<span class = "font-medium">Project</span>
					</template>

					<BaseDropdownItem v-if = "!project.shared" @select = "focusProjectNameEdit">
						Rename
					</BaseDropdownItem>

					<BaseDropdownItem v-if = "!project.shared" @select = "openXyzSettingsModal">
						Edit axis values
					</BaseDropdownItem>

					<BaseDropdownItem @select = "openMetadataModal">
						Metadata
					</BaseDropdownItem>

					<BaseDropdownItem @select = "openProjectChat">
						Notes
					</BaseDropdownItem>

						<BaseDropdownItem v-if = "!project.shared" @select = "openShareModal">
							Share
						</BaseDropdownItem>

						<BaseDropdownItem v-if = "!project.shared" @select = "openGpuInferenceModal">
							Raman spectrum inference
						</BaseDropdownItem>

					<hr class = "h-0.5 bg-gray border-0 ">

					<BaseDropdownItem @select = "download">
						Download
					</BaseDropdownItem>

					<BaseDropdownItem @select = "openVisualizationSettings">
						Visualization settings
					</BaseDropdownItem>

				</BaseDropdown>
				<ProjectNameInput ref = "projectNameInput" :project = "project"></ProjectNameInput>
			</template>
			<template v-slot:right-items>
				<AccountDropdown></AccountDropdown>
			</template>
		</NavigationBar>


		<!-- Main Content -->
			<main class="relative z-0 bg-dark-gray rounded-lg overflow-hidden shadow-sm p-0">
				<div ref = "graph" class = "w-full h-full bg-white rounded-lg"></div>
			</main>

	</div>

	<MetadataModal ref = "metadataModal" :project = "project"></MetadataModal>
	<ShareModal ref = "shareModal" :project = "project"></ShareModal>
	<ZenodoModal ref = "zenodoModal" :project = "project"></ZenodoModal>
	<RoiDescriptionModal ref = "roiDescriptionModal"
						 :roi-name = "selectedRoi ? selectedRoi.name : ''"
						 :roi-description = "selectedRoi ? selectedRoi.description : ''"
						 :pixel-count = "selectedRoi ? selectedRoi.pixelCount : 0"
						 :bounding-box = "selectedRoi ? selectedRoi.boundingBox : null"></RoiDescriptionModal>
	<RoiSaveModal ref = "roiSaveModal" :saving = "savingRoi" @save = "saveRoi"></RoiSaveModal>
	<RoiDeleteModal ref = "roiDeleteModal"
					:roi-name = "selectedRoi ? selectedRoi.name : ''"
					:roi-description = "selectedRoi ? selectedRoi.description : ''"
					:deleting = "deletingRoi"
					@confirm = "deleteSelectedRoi"></RoiDeleteModal>
	<GpuInferenceModal ref = "gpuInferenceModal"
					  :project = "project"
					  :default-group-id = "activeGroupID()"
					  :initial-job-id = "gpuInferenceJobId"
					  :initial-status = "gpuInferenceStatus"
					  @submitted = "handleGpuInferenceSubmitted"
					  @status = "handleGpuInferenceStatus"></GpuInferenceModal>
	<GpuInferenceOutcomeModal ref = "gpuInferenceOutcomeModal"></GpuInferenceOutcomeModal>
	<DownloadPreparingModal ref = "downloadPreparingModal"></DownloadPreparingModal>
	<XyzSettingsModal ref = "xyzSettingsModal"
					  :saving = "savingXyz"
					  @save = "saveXyzSettings"></XyzSettingsModal>
	<ProjectChatWindow v-model = "projectChatOpen"
					   :project = "project"></ProjectChatWindow>
</div>
</template>

<script setup>

import { ref, watch, computed, nextTick, onMounted, onBeforeUnmount} from 'vue'
import { useRoute } from 'vue-router'
import { debounce } from 'lodash'
const route = useRoute()

const emit = defineEmits(["loaded"])

import { projects as projectlib, settings as settingslib} from "@harkana/tools"
import { navigation, hyperspectrumCache, hyperspectra, results } from "@harkana/tools"
import { hyperspectrum } from "@harkana/plot"

import Sidebar from './sidebar/Sidebar.vue'
import Logo from "./sidebar/Logo.vue"
import SidebarButton from './sidebar/SidebarButton.vue'

import NavigationBar from './navbar/NavigationBar.vue'
import AccountDropdown from './navbar/AccountDropdown.vue'
import BaseDropdown from './navbar/BaseDropdown.vue'
import BaseDropdownItem from './navbar/BaseDropdownItem.vue'
import ProjectNameInput from './navbar/ProjectNameInput.vue'

import MetadataModal from './modals/MetadataModal.vue'
import ShareModal from './modals/ShareModal.vue'
import ZenodoModal  from './modals/ZenodoModal.vue'
import RoiDescriptionModal from './modals/RoiDescriptionModal.vue'
import RoiSaveModal from './modals/RoiSaveModal.vue'
import RoiDeleteModal from './modals/RoiDeleteModal.vue'
import GpuInferenceModal from './modals/GpuInferenceModal.vue'
import GpuInferenceOutcomeModal from './modals/GpuInferenceOutcomeModal.vue'
import DownloadPreparingModal from './modals/DownloadPreparingModal.vue'
import XyzSettingsModal from './modals/XyzSettingsModal.vue'
import ProjectChatWindow from './chat/ProjectChatWindow.vue'

const metadataModal = ref(null)
const shareModal = ref(null)
const zenodoModal = ref(null)
const projectNameInput = ref(null)
const roiDescriptionModal = ref(null)
const roiSaveModal = ref(null)
const roiDeleteModal = ref(null)
const gpuInferenceModal = ref(null)
const gpuInferenceOutcomeModal = ref(null)
const downloadPreparingModal = ref(null)
const xyzSettingsModal = ref(null)

const currentProjectID = () => {
	return typeof route.params.id === "string" ? route.params.id : ""
}

const project = ref({id: ""})
const projects = ref({})
const settings = ref({})

const mip = ref(null)
const mipHsv = ref(null)
const umap = ref(null)
const xyzAxes = ref(null)
const layer = ref(null)
const pcaClassification = ref(null)
const pcaClassificationMip = ref(null)
const pcaMip = ref(null)
const pcaLoadings = ref(null)
const rpcaClassification = ref(null)
const rpcaClassificationMip = ref(null)
const rpcaMip = ref(null)
const rpcaLoadings = ref(null)
const graph = ref(null)
const activePlot = ref("umap")
const activeLayerIndex = ref(0)
const activeLayerRequestID = ref(0)
const activeMipHsvRequestID = ref(0)
const activeUmapRequestID = ref(0)
const activeXyzRequestID = ref(0)
const activePcaClassificationRequestID = ref(0)
const activePcaClassificationMipRequestID = ref(0)
const activePcaMipRequestID = ref(0)
const activePcaLoadingsRequestID = ref(0)
const activeRpcaClassificationRequestID = ref(0)
const activeRpcaClassificationMipRequestID = ref(0)
const activeRpcaMipRequestID = ref(0)
const activeRpcaLoadingsRequestID = ref(0)
const activeProjectLoadRequestID = ref(0)
const activeEstimatedMipRequestID = ref(0)
const activeEstimatedMipHsvRequestID = ref(0)
const activeEstimatedUmapRequestID = ref(0)
const layerInput = ref(0)
const pcaRgbRedInput = ref(1)
const pcaRgbGreenInput = ref(2)
const pcaRgbBlueInput = ref(3)
const pcaClassificationComponentCount = ref(2)
const pcaMipComponentCount = ref(2)
const heatmapInteractionMode = ref("select")
const confidenceLevelOptions = [ 50, 75, 90, 95 ]
const CONFIDENCE_NONE_VALUE = "none"
const estimateConfidenceLevels = [ 50, 75, 90, 95 ]
const DISPLAY_MODE_OPTIONS = new Set([
	"mip",
	"mip_hsv",
	"umap",
	"layer",
	"pca",
	"pca_mip",
	"pca_rgb",
	"rpca",
	"rpca_mip",
	"rpca_rgb"
])
const ESTIMATED_ROI_FRONTEND_MODES = [ "roi/frontend", "estimate/roi/frontend", "roi/estimate/frontend" ]
const ESTIMATED_ROI_STORAGE_MODES = [ "roi/storage", "estimate/roi/storage", "roi/estimate/storage" ]
const selectedConfidenceLevel = ref(95)
const roiEstimateUncertaintyMode = ref("show")
const billingSettings = ref({ groupID: "" })
const gpuInferenceJobId = ref("")
const gpuInferenceStatus = ref("")
const gpuInferenceEstimateSpectraReady = ref(false)
const visualizationDataSource = ref("measurement")
const spectrumDataSource = ref("measurement")
const primarySpectrumSource = ref("measurement")
const selectedHeatmapIndices = ref({ xIndices: [], yIndices: [] })
const latestSelectedRegionPoints = ref([])
const latestMeasurementSingleSpectrum = ref(null)
const latestMeasurementMeanSpectrum = ref(null)
const latestMeasurementSelectedSpectrum = ref(null)
const latestRamanSingleSpectrum = ref(null)
const latestRamanMeanSpectrum = ref(null)
const latestRamanSelectedSpectrum = ref(null)
const ramanRoiSpectrum = ref(null)
const roiStorage = ref([])
const estimatedRoiStorage = ref([])
const estimatedRoiList = ref([])
const estimatedRoiListMode = ref("")
const estimatedRoiStorageMode = ref("")
const estimatedRoiListAttempted = ref(false)
const estimatedRoiStorageAttempted = ref(false)
const estimatedMip = ref(null)
const estimatedMipHsv = ref(null)
const estimatedUmap = ref(null)
const estimatedLayer = ref(null)
const estimatedPcaClassification = ref(null)
const estimatedPcaClassificationMip = ref(null)
const estimatedPcaMip = ref(null)
const estimatedPcaLoadings = ref(null)
const estimatedRpcaClassification = ref(null)
const estimatedRpcaClassificationMip = ref(null)
const estimatedRpcaMip = ref(null)
const estimatedRpcaLoadings = ref(null)
const activeEstimatedLayerIndex = ref(-1)
const activeEstimatedPcaClassificationRequestID = ref(0)
const activeEstimatedPcaClassificationMipRequestID = ref(0)
const activeEstimatedPcaMipRequestID = ref(0)
const activeEstimatedPcaLoadingsRequestID = ref(0)
const activeEstimatedRpcaClassificationRequestID = ref(0)
const activeEstimatedRpcaClassificationMipRequestID = ref(0)
const activeEstimatedRpcaMipRequestID = ref(0)
const activeEstimatedRpcaLoadingsRequestID = ref(0)
const activeMeasurementSingleSpectrumRequestID = ref(0)
const activeMeasurementMeanSpectrumRequestID = ref(0)
const activeRamanSingleSpectrumRequestID = ref(0)
const activeRamanMeanSpectrumRequestID = ref(0)
const activeRamanRoiRequestID = ref(0)
const rois = ref([])
const selectedRoiId = ref("")
const showAllRoiOverlays = ref(false)
const refreshingRois = ref(false)
const savingRoi = ref(false)
const deletingRoi = ref(false)
const savingXyz = ref(false)
const showPcaLoadings = ref(false)
const showSelectedSpectra = ref(true)
const projectChatOpen = ref(false)
const isRoiRefreshDisabled = computed(() => refreshingRois.value)

const pcaComponentIndices = Array.from({ length: 10 }, (_, index ) => index + 1)
const activePcaComponents = ref([ 1, 2 ])
const pcaRgbChannels = ref({
	r: 1,
	g: 2,
	b: 3
})
const activePcaClassificationComponentCount = ref(0)
const activePcaMipComponentCount = ref(2)
const activeRpcaClassificationComponentCount = ref(0)
const activeRpcaMipComponentCount = ref(2)
const activeEstimatedPcaClassificationComponentCount = ref(0)
const activeEstimatedPcaMipComponentCount = ref(2)
const activeEstimatedRpcaClassificationComponentCount = ref(0)
const activeEstimatedRpcaMipComponentCount = ref(2)

const DEFAULT_PCA_COMPONENT_COLORS = {
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

const pcaLegend = computed(() => {
	return pcaComponentIndices.map(( componentIndex ) => {
		const savedColor = settings.value?.hyperspectrumColors?.pcaComponents?.[componentIndex]

		return {
			componentIndex,
			label: "PC" + String( componentIndex ).padStart( 2, "0" ),
			color: typeof savedColor === "string" && savedColor.length > 0
				? savedColor
				: DEFAULT_PCA_COMPONENT_COLORS[componentIndex]
		}
	})
})

var resizeObserver = null

const cacheOptions = {
	memoryBudgetBytes: 120 * 1024 * 1024,
	ttlMs: 7 * 24 * 60 * 60 * 1000,
	prefetchRadius: 2,
	lowConcurrency: 1
}

const GPU_STATUS_POLL_INTERVAL_MS = 60 * 1000
const GPU_NON_TERMINAL_STATUSES = new Set([ "SUBMITTED", "STARTED" ])
const GPU_TERMINAL_STATUSES = new Set([ "SUCCEEDED", "FAILED" ])

let gpuStatusPollTimer = null
let gpuStatusPollInFlight = false

const downloading = ref(false)

const sidebarOpen = ref(false)
const sidebarStyle = computed(() => {
  return sidebarOpen.value
    ? { left: '2px' }
    : { left: 'calc(-16rem - 2px)' }
})

const canMutateRois = computed(() => {
	return typeof project.value?.id === "string" &&
		project.value.id.length > 0 &&
		project.value.shared !== true
})

const canEditXyz = computed(() => {
	return canMutateRois.value
})

const selectedRoi = computed(() => {
	if( selectedRoiId.value === "" ) return null

	return rois.value.find(( roi ) => roi.roiId === selectedRoiId.value ) ?? null
})

const hasSelectedRegion = computed(() => {
	return Array.isArray( latestSelectedRegionPoints.value ) && latestSelectedRegionPoints.value.length > 0
})

const visiblePcaLoadingCount = computed(() => {
	if( activePlot.value === "pca_mip" || activePlot.value === "rpca_mip" ){
		return normalizePcaComponentInput( pcaMipComponentCount.value )
	}

	return normalizePcaComponentInput( pcaClassificationComponentCount.value )
})

const visiblePcaLegendEntries = computed(() => {
	return pcaLegend.value.slice( 0, visiblePcaLoadingCount.value )
})

const maxLayerIndex = computed(() => {

	const zValues = Array.isArray( xyzAxes.value?.z ) ? xyzAxes.value.z : []
	if( zValues.length <= 0 ){
		return Number.MAX_SAFE_INTEGER
	}

	return Math.max( 0, zValues.length - 1 )
})

const hasSuccessfulRamanInference = computed(() => {
	return String( gpuInferenceStatus.value ?? "" ).trim().toUpperCase() === "SUCCEEDED"
})

const hasEstimatedRamanSpectraReady = computed(() => {
	return gpuInferenceEstimateSpectraReady.value === true || hasSuccessfulRamanInference.value
})

const heatmapUsesEstimatedRaman = computed(() => {
	return hasSuccessfulRamanInference.value && visualizationDataSource.value === "raman"
})

const spectrumSelectionMode = computed(() => {
	if( hasEstimatedRamanSpectraReady.value === false ){
		return "measurement"
	}

	return [ "measurement", "raman", "both" ].includes( spectrumDataSource.value )
		? spectrumDataSource.value
		: "measurement"
})

const resolvedPrimarySpectrumSource = () => {

	if( spectrumSelectionMode.value !== "both" ){
		return spectrumSelectionMode.value
	}

	return String( primarySpectrumSource.value ?? "" ).trim().toLowerCase() === "raman"
		? "raman"
		: "measurement"
}

const resolvedSecondarySpectrumSource = () => {

	if( spectrumSelectionMode.value !== "both" ){
		return null
	}

	return resolvedPrimarySpectrumSource() === "raman"
		? "measurement"
		: "raman"
}

const loadingsSource = () => {

	if( hasSuccessfulRamanInference.value === false ){
		return "measurement"
	}

	if( spectrumSelectionMode.value === "both" ){
		return resolvedPrimarySpectrumSource()
	}

	return spectrumSelectionMode.value === "raman" ? "raman" : "measurement"
}

const usesEstimatedLoadings = () => {
	return loadingsSource() === "raman"
}

const resolvedPcaLoadings = () => {

	if( usesEstimatedLoadings() ){
		return estimatedPcaLoadings.value ?? pcaLoadings.value
	}

	return pcaLoadings.value
}

const resolvedRpcaLoadings = () => {

	if( usesEstimatedLoadings() ){
		return estimatedRpcaLoadings.value ?? rpcaLoadings.value
	}

	return rpcaLoadings.value
}

const download = async() => {

	if( downloading.value ) return

	downloading.value = true
	downloadPreparingModal.value?.open()
	var closedOnStart = false

	try{
		await projectlib.download([ project.value ], {
			onStart: () => {
				closedOnStart = true
				downloadPreparingModal.value?.close()
			}
		})
	} catch( error ){
		console.log( error )
	} finally {
		if( closedOnStart === false ){
			downloadPreparingModal.value?.close()
		}
		downloading.value = false
	}
}

const openVisualizationSettings = () => {
	navigation.redirect('Settings', 'Visualization')
}

const openMetadataModal = () => {
	metadataModal.value?.open()
}

const openProjectChat = () => {
	projectChatOpen.value = true
}

const openShareModal = () => {
	if( project.value?.shared ) return
	shareModal.value?.open()
}

const openGpuInferenceModal = async () => {
	if( project.value?.shared ) return

	try{
		var savedBilling = await settingslib.getBilling()
		if( savedBilling && typeof savedBilling === "object" ){
			billingSettings.value = {
				groupID: typeof savedBilling.groupID === "string" ? savedBilling.groupID : ""
			}
		}
	} catch( error ){
		console.log( error )
	}

	gpuInferenceModal.value?.open()
}

const persistGpuInferenceState = async () => {

	if( project.value?.shared ) return
	if( typeof project.value?.id !== "string" || project.value.id.length === 0 ) return

	try{
		const projectInfo = await projectlib.getInfo( project.value )
		if( projectInfo === null || typeof projectInfo !== "object" || projectInfo instanceof Error ){
			return
		}

		projectInfo.gpuInferenceJobId = String( gpuInferenceJobId.value ?? "" ).trim()
		projectInfo.gpuInferenceStatus = String( gpuInferenceStatus.value ?? "" ).trim()
		projectInfo.gpuInferenceEstimateSpectraReady = gpuInferenceEstimateSpectraReady.value === true

		await projectlib.setInfo( projectInfo )
	} catch( error ){
		console.log( error )
	}
}

const normalizedGpuInferenceStatus = ( value ) => {
	return String( value ?? "" ).trim().toUpperCase()
}

const resolveGpuInferenceEstimateSpectraReady = ( payload, normalizedNextStatus ) => {

	if(
		payload !== null &&
		typeof payload === "object" &&
		Object.prototype.hasOwnProperty.call( payload, "estimateSpectraReady" )
	){
		return payload.estimateSpectraReady === true
	}

	if( normalizedNextStatus === "SUCCEEDED" ){
		return true
	}

	return gpuInferenceEstimateSpectraReady.value === true
}

const maybeShowGpuInferenceOutcome = async (
	previousStatus,
	nextStatus,
	previousEstimateSpectraReady,
	nextEstimateSpectraReady,
	payload = null
) => {

	const becameEstimateReady = previousEstimateSpectraReady === false &&
		nextEstimateSpectraReady === true &&
		nextStatus !== "SUCCEEDED"
	if( becameEstimateReady ){
		await gpuInferenceOutcomeModal.value?.open?.( "ESTIMATE_READY" )
		return
	}

	if( GPU_NON_TERMINAL_STATUSES.has( previousStatus ) === false ) return
	if( GPU_TERMINAL_STATUSES.has( nextStatus ) === false ) return

	await gpuInferenceOutcomeModal.value?.open?.( nextStatus, {
		errorCode: payload?.errorCode,
		errorMessage: payload?.errorMessage
	})
}

const updateGpuInferenceState = async ( payload, options = {} ) => {

	const normalizedNextStatus = normalizedGpuInferenceStatus(
		payload !== null && typeof payload === "object"
			? payload?.status
			: payload
	)
	if( normalizedNextStatus.length === 0 ) return false

	const normalizedPreviousStatus = normalizedGpuInferenceStatus( gpuInferenceStatus.value )
	const previousEstimateSpectraReady = gpuInferenceEstimateSpectraReady.value === true
	const nextEstimateSpectraReady = resolveGpuInferenceEstimateSpectraReady( payload, normalizedNextStatus )

	if( normalizedNextStatus === normalizedPreviousStatus &&
		nextEstimateSpectraReady === previousEstimateSpectraReady ){
		return false
	}

	gpuInferenceStatus.value = normalizedNextStatus
	gpuInferenceEstimateSpectraReady.value = nextEstimateSpectraReady
	await persistGpuInferenceState()

	if( options.announce === true ){
		await maybeShowGpuInferenceOutcome(
			normalizedPreviousStatus,
			normalizedNextStatus,
			previousEstimateSpectraReady,
			nextEstimateSpectraReady,
			payload
		)
	}

	return true
}

const handleGpuInferenceSubmitted = async ( payload ) => {

	const submittedJobId = String( payload?.jobId ?? "" ).trim()
	if( submittedJobId.length === 0 ) return

	gpuInferenceJobId.value = submittedJobId
	gpuInferenceStatus.value = normalizedGpuInferenceStatus( payload?.status ?? "STARTED" )
	gpuInferenceEstimateSpectraReady.value = false
	resetEstimatedVisualizationState()
	await clearEstimatedCacheForProject()

	await persistGpuInferenceState()
}

const handleGpuInferenceStatus = async ( payload ) => {

	await updateGpuInferenceState( payload, { announce: true })
}

const shouldPollGpuInferenceStatus = () => {

	if( project.value?.shared ) return false

	const jobId = String( gpuInferenceJobId.value ?? "" ).trim()
	if( jobId.length === 0 ) return false

	return GPU_NON_TERMINAL_STATUSES.has( normalizedGpuInferenceStatus( gpuInferenceStatus.value ))
}

const stopGpuInferenceStatusPolling = () => {

	if( gpuStatusPollTimer === null ) return

	clearInterval( gpuStatusPollTimer )
	gpuStatusPollTimer = null
}

const refreshGpuInferenceStatusPolling = async () => {

	if( gpuStatusPollInFlight ) return
	if( shouldPollGpuInferenceStatus() === false ) return

	const activeJobId = String( gpuInferenceJobId.value ?? "" ).trim()
	if( activeJobId.length === 0 ) return

	gpuStatusPollInFlight = true

	try{
		const response = await hyperspectra.status( activeJobId )
		if( String( gpuInferenceJobId.value ?? "" ).trim() !== activeJobId ) return

			await updateGpuInferenceState( response, { announce: true })
	} catch( error ){
		console.log( error )
	} finally {
		gpuStatusPollInFlight = false
	}
}

const syncGpuInferenceStatusPolling = () => {

	if( shouldPollGpuInferenceStatus() === false ){
		stopGpuInferenceStatusPolling()
		return
	}

	if( gpuStatusPollTimer !== null ) return

	void refreshGpuInferenceStatusPolling()

	gpuStatusPollTimer = setInterval( () => {
		void refreshGpuInferenceStatusPolling()
	}, GPU_STATUS_POLL_INTERVAL_MS )
}

const resetEstimatedVisualizationState = () => {

	activeEstimatedMipRequestID.value += 1
	activeEstimatedMipHsvRequestID.value += 1
	activeEstimatedUmapRequestID.value += 1
	activeEstimatedPcaClassificationRequestID.value += 1
	activeEstimatedPcaClassificationMipRequestID.value += 1
	activeEstimatedPcaMipRequestID.value += 1
	activeEstimatedPcaLoadingsRequestID.value += 1
	activeEstimatedRpcaClassificationRequestID.value += 1
	activeEstimatedRpcaClassificationMipRequestID.value += 1
	activeEstimatedRpcaMipRequestID.value += 1
	activeEstimatedRpcaLoadingsRequestID.value += 1
	activeRamanSingleSpectrumRequestID.value += 1
	activeRamanMeanSpectrumRequestID.value += 1
	activeRamanRoiRequestID.value += 1

	estimatedMip.value = null
	estimatedMipHsv.value = null
	estimatedUmap.value = null
	estimatedLayer.value = null
	estimatedPcaClassification.value = null
	estimatedPcaClassificationMip.value = null
	estimatedPcaMip.value = null
	estimatedPcaLoadings.value = null
	estimatedRpcaClassification.value = null
	estimatedRpcaClassificationMip.value = null
	estimatedRpcaMip.value = null
	estimatedRpcaLoadings.value = null
	activeEstimatedLayerIndex.value = -1
	activeEstimatedPcaClassificationComponentCount.value = 0
	activeEstimatedPcaMipComponentCount.value = 0
	activeEstimatedRpcaClassificationComponentCount.value = 0
	activeEstimatedRpcaMipComponentCount.value = 0
	latestRamanSingleSpectrum.value = null
	latestRamanMeanSpectrum.value = null
	latestRamanSelectedSpectrum.value = null
	ramanRoiSpectrum.value = null
	resetEstimatedRoiArtifacts()
}

const clearEstimatedCacheForProject = async () => {

	if( typeof project.value?.id !== "string" || project.value.id.length === 0 ){
		return
	}

	try{
		await hyperspectrumCache.clearProjectModePrefixes( project.value, [ "estimate/" ] )
	} catch( error ){
		console.log( error )
	}
}

const focusProjectNameEdit = async () => {
	await nextTick()
	projectNameInput.value?.focusNameEdit?.()
}

const activePcaClassificationCount = () => {

	const count = Number.parseInt( pcaClassificationComponentCount.value, 10 )
	if( Number.isInteger( count ) === false ){
		return 1
	}

	return Math.max( 1, Math.min( 10, count ))
}

const currentMeasurementMatrix = () => {
	if( activePlot.value === "mip_hsv" ){
		return mipHsv.value
	}
	if( activePlot.value === "umap" ){
		return umap.value
	}
	if( activePlot.value === "layer" ){
		return layer.value
	}
	if( activePlot.value === "pca" ){
		return pcaClassificationMip.value
	}
	if( activePlot.value === "pca_mip" ){
		return pcaMip.value
	}
	if( activePlot.value === "pca_rgb" ){
		return pcaClassification.value
	}
	if( activePlot.value === "rpca" ){
		return rpcaClassificationMip.value
	}
	if( activePlot.value === "rpca_mip" ){
		return rpcaMip.value
	}
	if( activePlot.value === "rpca_rgb" ){
		return rpcaClassification.value
	}
	return mip.value
}

const currentEstimatedMatrix = () => {
	if( activePlot.value === "mip_hsv" ){
		return estimatedMipHsv.value
	}
	if( activePlot.value === "umap" ){
		return estimatedUmap.value
	}
	if( activePlot.value === "layer" ){
		return estimatedLayer.value
	}
	if( activePlot.value === "mip" ){
		return estimatedMip.value
	}
	if( activePlot.value === "pca" ){
		return estimatedPcaClassificationMip.value
	}
	if( activePlot.value === "pca_mip" ){
		return estimatedPcaMip.value
	}
	if( activePlot.value === "pca_rgb" ){
		return estimatedPcaClassification.value
	}
	if( activePlot.value === "rpca" ){
		return estimatedRpcaClassificationMip.value
	}
	if( activePlot.value === "rpca_mip" ){
		return estimatedRpcaMip.value
	}
	if( activePlot.value === "rpca_rgb" ){
		return estimatedRpcaClassification.value
	}

	return null
}

const currentMatrix = () => {
	if( heatmapUsesEstimatedRaman.value ){
		const estimatedMatrix = currentEstimatedMatrix()
		if( estimatedMatrix !== null ){
			return estimatedMatrix
		}
	}

	return currentMeasurementMatrix()
}

const matrixDimensions = ( matrix ) => {

	if( Array.isArray( matrix ) && matrix.length > 0 && Array.isArray( matrix[0] ) ){
		return {
			width: matrix[0].length,
			height: matrix.length
		}
	}

	if( matrix !== null && typeof matrix === "object" ){
		const firstMatrix = Object.values( matrix ).find(( value ) => {
			return Array.isArray( value ) && value.length > 0 && Array.isArray( value[0] )
		})

		if( firstMatrix ){
			return {
				width: firstMatrix[0].length,
				height: firstMatrix.length
			}
		}
	}

	return null
}

const activeGroupID = () => {
	if( typeof billingSettings.value?.groupID === "string" ){
		return billingSettings.value.groupID
	}

	return ""
}

const plotAxes = () => {
	return xyzAxes.value
}

const resolvedUmapChannelColors = () => {
	return {
		r: settings.value?.hyperspectrumColors?.umapChannels?.r ?? "#ff0000",
		g: settings.value?.hyperspectrumColors?.umapChannels?.g ?? "#00ff00",
		b: settings.value?.hyperspectrumColors?.umapChannels?.b ?? "#0000ff"
	}
}

const loadingComponentsFromCount = ( value ) => {

	const parsedCount = Number.parseInt( value, 10 )
	const componentCount = Number.isInteger( parsedCount )
		? Math.max( 1, Math.min( 10, parsedCount ))
		: 1

	return Array.from({ length: componentCount }, (_, index ) => index + 1 )
}

const pcaClassificationLoadingComponents = () => {
	return loadingComponentsFromCount( pcaClassificationComponentCount.value )
		.filter(( componentIndex ) => activePcaComponents.value.includes( componentIndex ))
}

const pcaMipLoadingComponents = () => {
	return loadingComponentsFromCount( pcaMipComponentCount.value )
		.filter(( componentIndex ) => activePcaComponents.value.includes( componentIndex ))
}

const resetActivePcaComponents = ( count ) => {
	activePcaComponents.value = loadingComponentsFromCount( count )
}

const isPcaComponentActive = ( componentIndex ) => {
	return activePcaComponents.value.includes( componentIndex )
}

const normalizeBoundPercentage = ( value, fallback ) => {

	const numeric = Number( value )
	if( Number.isFinite( numeric ) === false ){
		return fallback
	}

	return Math.min( 100, Math.max( 0, numeric ))
}

const uncertaintyPercentages = () => {

	const lower = normalizeBoundPercentage(
		settings.value?.hyperspectrumSpectrum?.lowerBoundPercentage,
		7.5
	)
	const upper = normalizeBoundPercentage(
		settings.value?.hyperspectrumSpectrum?.upperBoundPercentage,
		97.5
	)

	if( lower <= upper ){
		return { lower, upper }
	}

	return {
		lower: upper,
		upper: lower
	}
}

const normalizeSelectionPoints = ( points ) => {

	if( Array.isArray( points ) === false ){
		return []
	}

	var normalized = []
	var seen = new Set()

	for( const point of points ){

		const x = Array.isArray( point ) ? Number.parseInt( point[0], 10 ) : Number.parseInt( point?.x, 10 )
		const y = Array.isArray( point ) ? Number.parseInt( point[1], 10 ) : Number.parseInt( point?.y, 10 )

		if( Number.isInteger( x ) === false || Number.isInteger( y ) === false ) continue

		const key = x + ":" + y
		if( seen.has( key ) ) continue

		seen.add( key )
		normalized.push({ x, y })
	}

	return normalized
}

const normalizeOpacity = ( value, fallback = 0.25 ) => {

	const numeric = Number( value )
	if( Number.isFinite( numeric ) === false ){
		return fallback
	}

	return Math.max( 0, Math.min( 1, numeric ))
}

const measurementDataType = String( import.meta.env?.VITE_DATA_TYPE ?? "hypercars" ).trim() || "hypercars"

const normalizeDisplayMode = ( value ) => {
	const normalized = String( value ?? "" ).trim()
	return DISPLAY_MODE_OPTIONS.has( normalized ) ? normalized : "umap"
}

const normalizeHeatmapInteraction = ( value ) => {
	return String( value ?? "" ).trim().toLowerCase() === "zoom" ? "zoom" : "select"
}

const normalizeShowHideMode = ( value, fallback = "hide" ) => {
	const normalized = String( value ?? "" ).trim().toLowerCase()
	if( normalized === "show" || normalized === "hide" ){
		return normalized
	}
	return fallback === "show" ? "show" : "hide"
}

const normalizeRoiEstimateUncertaintyMode = ( value ) => {
	return normalizeShowHideMode( value, "show" ) === "hide" ? "hide" : "show"
}

const normalizeConfidenceLevel = ( value ) => {

	if( String( value ?? "" ).trim().toLowerCase() === CONFIDENCE_NONE_VALUE ){
		return CONFIDENCE_NONE_VALUE
	}

	const numeric = Number.parseInt( value, 10 )
	if( Number.isInteger( numeric ) === false ){
		return 95
	}

	if( confidenceLevelOptions.includes( numeric ) ){
		return numeric
	}

	return 95
}

const defaultDisplayMode = () => {
	return normalizeDisplayMode( settings.value?.hyperspectrumDefaults?.displayMode )
}

const defaultHeatmapInteractionMode = () => {
	return normalizeHeatmapInteraction( settings.value?.hyperspectrumDefaults?.heatmapInteraction )
}

const defaultSelectionConfidenceLevel = () => {
	return normalizeConfidenceLevel( settings.value?.hyperspectrumDefaults?.selectionConfidenceLevel )
}

const defaultShowPcaLoadings = () => {
	return normalizeShowHideMode( settings.value?.hyperspectrumDefaults?.loadings, "hide" ) === "show"
}

const defaultFalseColoringBasis = () => {
	return String( settings.value?.hyperspectrumDefaults?.falseColoringBasis ?? "" ).trim().toLowerCase() === "raman"
		? "raman"
		: "measurement"
}

const defaultRoiEstimateUncertaintyMode = () => {
	return normalizeRoiEstimateUncertaintyMode( settings.value?.hyperspectrumDefaults?.roiEstimateUncertainty )
}

const resolvedDefaultVisualizationDataSource = () => {
	if( hasSuccessfulRamanInference.value === false ){
		return "measurement"
	}

	return defaultFalseColoringBasis() === "raman" ? "raman" : "measurement"
}

const selectedConfidenceLevelValue = computed(() => {
	return normalizeConfidenceLevel( selectedConfidenceLevel.value )
})

const selectedConfidenceNumericLevel = computed(() => {
	return typeof selectedConfidenceLevelValue.value === "number"
		? selectedConfidenceLevelValue.value
		: 95
})

const resolveConfidenceBoundSeries = ( boundsPayload, confidenceLevel ) => {

	if( Array.isArray( boundsPayload ) ){
		return boundsPayload
	}

	if( boundsPayload === null || typeof boundsPayload !== "object" ){
		return null
	}

	const directArray = boundsPayload[String( confidenceLevel )] ?? boundsPayload[ confidenceLevel ]
	if( Array.isArray( directArray ) ){
		return directArray
	}

	const availableEntries = Object.entries( boundsPayload ).filter(( [ key, value ]) => {
		const numericKey = Number.parseInt( String( key ), 10 )
		return Number.isInteger( numericKey ) && Array.isArray( value )
	})

	if( availableEntries.length === 0 ){
		return null
	}

	const matchingEntry = availableEntries.find(( [ key ] ) => {
		return Number.parseInt( String( key ), 10 ) === confidenceLevel
	})
	if( matchingEntry ){
		return matchingEntry[1]
	}

	availableEntries.sort(( left, right ) => {
		return Number.parseInt( String( right[0] ), 10 ) - Number.parseInt( String( left[0] ), 10 )
	})

	return availableEntries[0][1]
}

const withSelectedConfidenceBounds = ( payload ) => {

	if( payload === null || payload === undefined ){
		return null
	}

	if( Array.isArray( payload ) ){
		return payload
	}

	if( typeof payload !== "object" ){
		return payload
	}

	if( selectedConfidenceLevelValue.value === CONFIDENCE_NONE_VALUE ){
		return {
			...payload,
			lowerBound: null,
			upperBound: null
		}
	}

	const confidenceLevel = selectedConfidenceNumericLevel.value

	return {
		...payload,
		lowerBound: resolveConfidenceBoundSeries( payload.lowerBound, confidenceLevel ),
		upperBound: resolveConfidenceBoundSeries( payload.upperBound, confidenceLevel )
	}
}

const normalizeSpectrumSource = ( source ) => {
	const normalized = String( source ?? "" ).trim().toLowerCase()
	return normalized === "raman" ? "raman" : "measurement"
}

const setVisualizationDataSource = ( source ) => {

	if( hasSuccessfulRamanInference.value === false ){
		visualizationDataSource.value = "measurement"
		return
	}

	visualizationDataSource.value = normalizeSpectrumSource( source )
}

const setPrimarySpectrumSource = ( source ) => {
	primarySpectrumSource.value = normalizeSpectrumSource( source )
}

const setSelectedConfidenceLevel = ( level ) => {
	selectedConfidenceLevel.value = normalizeConfidenceLevel( level )
}

const setHeatmapInteractionMode = ( mode ) => {
	heatmapInteractionMode.value = mode === "zoom" ? "zoom" : "select"
}

const selectedSpectrumPayloadBySource = ( source ) => {

	const normalizedSource = normalizeSpectrumSource( source )

	if( normalizedSource === "raman" ){
		const payload = latestRamanSelectedSpectrum.value ??
			latestRamanSingleSpectrum.value?.response ??
			latestRamanMeanSpectrum.value?.response ??
			null
		return withSelectedConfidenceBounds( payload )
	}

	const payload = latestMeasurementSelectedSpectrum.value ??
		latestMeasurementSingleSpectrum.value?.response ??
		latestMeasurementMeanSpectrum.value?.response ??
		null
	return withSelectedConfidenceBounds( payload )
}

const roiSpectrumPayloadBySource = ( source ) => {

	const normalizedSource = normalizeSpectrumSource( source )

	if( selectedRoi.value === null ){
		return null
	}

	if( normalizedSource === "raman" ){
		const payload = ramanRoiSpectrum.value
		if( payload === null || payload === undefined ){
			return null
		}

		const resolvedPayload = {
			...payload,
			lowerBound: resolveConfidenceBoundSeries( payload.lowerBound, selectedConfidenceNumericLevel.value ),
			upperBound: resolveConfidenceBoundSeries( payload.upperBound, selectedConfidenceNumericLevel.value )
		}

		if( roiEstimateUncertaintyMode.value === "hide" ){
			return {
				...resolvedPayload,
				lowerBound: null,
				upperBound: null
			}
		}

		return resolvedPayload
	}

	const spectrum = Array.isArray( selectedRoi.value.meanSpectrum ) ? selectedRoi.value.meanSpectrum : null
	if( spectrum === null ) return null

	return withSelectedConfidenceBounds({
		spectrum,
		lowerBound: selectedRoi.value.lowerBound ?? null,
		upperBound: selectedRoi.value.upperBound ?? null
	})
}

const topLeftSpectrumOptions = () => {

	const mode = spectrumSelectionMode.value
	const showLoadingsFallback = activePlot.value === "pca" || activePlot.value === "pca_mip" || activePlot.value === "pca_rgb" ||
		activePlot.value === "rpca" || activePlot.value === "rpca_mip" || activePlot.value === "rpca_rgb"
		? showPcaLoadings.value
		: false

	if( selectedRoi.value === null && showLoadingsFallback ){
		return {
			showFallback: true
		}
	}

	const topSource = mode === "both"
		? ( resolvedSecondarySpectrumSource() ?? "measurement" )
		: mode
	const current = showSelectedSpectra.value
		? selectedSpectrumPayloadBySource( topSource )
		: null

	if( selectedRoi.value === null ){
		if( mode === "both" && current !== null ){
			return { current }
		}

		return {}
	}

	const roiPayload = roiSpectrumPayloadBySource( topSource )
	if( roiPayload === null ){
		return {
			current,
			showFallback: showLoadingsFallback
		}
	}

	return {
		roi: roiPayload,
		current: current
	}
}

const bottomLeftSpectrumOptions = () => {

	const mode = spectrumSelectionMode.value
	const lowerSource = mode === "both"
		? resolvedPrimarySpectrumSource()
		: mode
	const current = showSelectedSpectra.value
		? selectedSpectrumPayloadBySource( lowerSource )
		: null

	if( mode === "both" && selectedRoi.value !== null ){
		return {
			selectedSpectrum: current,
			bottomLeftSpectrum: {
				roi: roiSpectrumPayloadBySource( lowerSource ),
				current
			}
		}
	}

	return {
		selectedSpectrum: current,
		bottomLeftSpectrum: null
	}
}

const setPcaLoadingsVisibility = async ( shouldShowLoadings ) => {

	if( shouldShowLoadings ){
		if( activePcaComponents.value.length === 0 ){
			resetActivePcaComponents( visiblePcaLoadingCount.value )
		}

		showPcaLoadings.value = true
		if( selectedRoiId.value !== "" ){
			selectedRoiId.value = ""
			return
		}
	} else {
		showPcaLoadings.value = false
	}

	if( graph.value === null ) return
	if( currentMatrix() === null ) return

	try{
		await renderCurrentMatrix()
	} catch( error ){
		console.log( error )
	}
}

const setSelectedSpectraVisibility = async ( shouldShowSpectra ) => {

	showSelectedSpectra.value = shouldShowSpectra === true

	if( graph.value === null ) return
	if( currentMatrix() === null ) return

	try{
		await renderCurrentMatrix()
	} catch( error ){
		console.log( error )
	}
}

const roiOverlayFromEntry = ( roi ) => {

	if( roi === null || typeof roi !== "object" ){
		return null
	}

	return {
		name: roi.name,
		x0: roi.boundingBox.minX - 0.5,
		x1: roi.boundingBox.maxX + 0.5,
		y0: roi.boundingBox.minY - 0.5,
		y1: roi.boundingBox.maxY + 0.5,
		boxColor: settings.value?.hyperspectrumColors?.roiBox ??
			settings.value?.hyperspectrumColors?.roiOverlay ??
			"#ffffff",
		titleColor: settings.value?.hyperspectrumColors?.roiTitle ??
			settings.value?.hyperspectrumColors?.roiOverlay ??
			"#ffffff",
		opacity: normalizeOpacity( settings.value?.hyperspectrumRoi?.overlayOpacity, 0.25 )
	}
}

const currentSelectionOverlay = () => {

	const xIndices = Array.isArray( selectedHeatmapIndices.value?.xIndices )
		? selectedHeatmapIndices.value.xIndices
		: []
	const yIndices = Array.isArray( selectedHeatmapIndices.value?.yIndices )
		? selectedHeatmapIndices.value.yIndices
		: []

	if( xIndices.length === 0 || yIndices.length === 0 ){
		return null
	}

	const normalizedXIndices = xIndices
		.map(( value ) => Number.parseInt( value, 10 ))
		.filter(( value ) => Number.isInteger( value ))
	const normalizedYIndices = yIndices
		.map(( value ) => Number.parseInt( value, 10 ))
		.filter(( value ) => Number.isInteger( value ))

	if( normalizedXIndices.length === 0 || normalizedYIndices.length === 0 ){
		return null
	}

	const minX = Math.min( ...normalizedXIndices )
	const maxX = Math.max( ...normalizedXIndices )
	const minY = Math.min( ...normalizedYIndices )
	const maxY = Math.max( ...normalizedYIndices )
	const selectionColor = settings.value?.hyperspectrumColors?.selectionBox ?? "#9ca3af"

	return {
		name: "",
		showTitle: false,
		x0: minX - 0.5,
		x1: maxX + 0.5,
		y0: minY - 0.5,
		y1: maxY + 0.5,
		boxColor: selectionColor,
		titleColor: selectionColor,
		opacity: normalizeOpacity( settings.value?.hyperspectrumRoi?.overlayOpacity, 0.25 )
	}
}

const activeRoiOverlays = () => {

	var overlays = []

	if( showAllRoiOverlays.value ){
		overlays = rois.value
			.map(( roi ) => roiOverlayFromEntry( roi ))
			.filter(( overlay ) => overlay !== null )
	} else if( selectedRoi.value !== null ){
		const selectedOverlay = roiOverlayFromEntry( selectedRoi.value )
		overlays = selectedOverlay === null ? [] : [ selectedOverlay ]
	}

	const selectionOverlay = currentSelectionOverlay()
	if( selectionOverlay !== null ){
		overlays.push( selectionOverlay )
	}

	return overlays
}

const loadRoiList = async ( forceRefresh = false ) => {

	const loadedRois = forceRefresh
		? await hyperspectrumCache.refreshRois( project.value, cacheOptions )
		: await hyperspectrumCache.getRois( project.value, cacheOptions )

	rois.value = Array.isArray( loadedRois ) ? loadedRois : []

	if( selectedRoiId.value.length > 0 ){
		const stillExists = rois.value.some(( roi ) => roi.roiId === selectedRoiId.value )
		if( stillExists === false ){
			selectedRoiId.value = ""
		}
	}
}

const loadRoiStorage = async ( forceRefresh = false ) => {

	try{
		var payload = null

		if( forceRefresh ){
			payload = await results.load( project.value, "roi/storage" )
		} else {
			payload = await hyperspectrumCache.getArtifact( project.value, "roi/storage", {
				...cacheOptions,
				priority: "high"
			})
		}

		if( payload instanceof Error ){
			roiStorage.value = []
			return
		}

		const loadedRois = Array.isArray( payload?.rois ) ? payload.rois : []
		roiStorage.value = loadedRois
	} catch( error ){
		roiStorage.value = []
	}
}

const refreshRoisFromBackend = async () => {

	if( refreshingRois.value ) return
	refreshingRois.value = true

	try{
		await loadRoiList( true )
		await loadRoiStorage( true )
		await loadEstimatedRoiList( true )
		await loadEstimatedRoiStorage( true )
		await refreshRamanRoiSpectrum()

		if( graph.value !== null && currentMatrix() !== null ){
			await renderCurrentMatrix()
		}
	} catch( error ){
		console.log( error )
	} finally {
		refreshingRois.value = false
	}
}

const normalizeRoiNumericSeries = ( values ) => {

	if( Array.isArray( values ) === false || values.length === 0 ){
		return null
	}

	var series = []
	var hasNumericValue = false

	for( const value of values ){
		const numeric = Number( value )
		if( Number.isFinite( numeric ) ){
			series.push( numeric )
			hasNumericValue = true
			continue
		}
		series.push( null )
	}

	return hasNumericValue ? series : null
}

const normalizeRoiBoundsPayload = ( payload ) => {

	if( Array.isArray( payload ) ){
		return normalizeRoiNumericSeries( payload )
	}

	if( payload === null || typeof payload !== "object" ){
		return null
	}

	var normalized = {}
	var hasAnyLevel = false

	for( const [ key, value ] of Object.entries( payload )){
		const numericKey = Number.parseInt( String( key ), 10 )
		if( Number.isInteger( numericKey ) === false ) continue

		const normalizedSeries = normalizeRoiNumericSeries( value )
		if( normalizedSeries === null ) continue

		normalized[String( numericKey )] = normalizedSeries
		hasAnyLevel = true
	}

	return hasAnyLevel ? normalized : null
}

const extractEstimateSpectrumFromRoi = ( roi ) => {

	if( roi === null || typeof roi !== "object" ){
		return null
	}

	const directSpectrumKeys = [
		"estimateMeanSpectrum",
		"estimatedMeanSpectrum",
		"meanSpectrumEstimate",
		"meanSpectrumEstimated",
		"ramanMeanSpectrum"
	]

	for( const key of directSpectrumKeys ){
		const series = normalizeRoiNumericSeries( roi?.[key] )
		if( series === null ) continue

		const lowerBound = normalizeRoiBoundsPayload(
			roi?.estimateLowerBound ??
			roi?.estimatedLowerBound ??
			roi?.lowerBoundEstimate ??
			roi?.ramanLowerBound ??
			null
		)
		const upperBound = normalizeRoiBoundsPayload(
			roi?.estimateUpperBound ??
			roi?.estimatedUpperBound ??
			roi?.upperBoundEstimate ??
			roi?.ramanUpperBound ??
			null
		)

		return {
			spectrum: series,
			lowerBound,
			upperBound
		}
	}

	const nestedCandidates = [
		roi?.estimate,
		roi?.estimated,
		roi?.raman,
		roi?.inference,
		roi?.sources?.estimate
	]

	for( const nested of nestedCandidates ){
		if( nested === null || typeof nested !== "object" ) continue

		const series = normalizeRoiNumericSeries( nested.meanSpectrum ?? nested.spectrum ?? nested.values )
		if( series === null ) continue

		return {
			spectrum: series,
			lowerBound: normalizeRoiBoundsPayload( nested.lowerBound ),
			upperBound: normalizeRoiBoundsPayload( nested.upperBound )
		}
	}

	return null
}

const normalizeEstimatedRoiEntry = ( roi, mode = "" ) => {

	if( roi === null || typeof roi !== "object" ){
		return null
	}

	const roiId = String( roi.roiId ?? "" ).trim()
	if( roiId.length === 0 ){
		return null
	}

	const normalizedMode = String( mode ?? "" ).trim().toLowerCase()
	const estimateFromRoi = extractEstimateSpectrumFromRoi( roi )
	const useEstimateOnly = normalizedMode === "roi/frontend"
	const fallbackMeanSpectrum = useEstimateOnly
		? null
		: normalizeRoiNumericSeries( roi.meanSpectrum )
	const spectrum = estimateFromRoi?.spectrum ?? fallbackMeanSpectrum
	const lowerBound = estimateFromRoi?.lowerBound ?? normalizeRoiBoundsPayload( roi.lowerBound )
	const upperBound = estimateFromRoi?.upperBound ?? normalizeRoiBoundsPayload( roi.upperBound )

	return {
		roiId,
		name: String( roi.name ?? "" ).trim(),
		description: String( roi.description ?? "" ),
		meanSpectrum: spectrum,
		lowerBound,
		upperBound,
		pixels: normalizeSelectionPoints( Array.isArray( roi.pixels ) ? roi.pixels : [] )
	}
}

const normalizeEstimatedRoiPayload = ( payload, mode = "" ) => {

	if( Array.isArray( payload?.rois ) === false ){
		return []
	}

	var normalized = []
	for( const roi of payload.rois ){
		const normalizedRoi = normalizeEstimatedRoiEntry( roi, mode )
		if( normalizedRoi === null ) continue
		normalized.push( normalizedRoi )
	}

	return normalized
}

const roiPointsFromBoundingBox = ( roi ) => {

	if( roi === null || typeof roi !== "object" ){
		return []
	}

	const boundingBox = roi?.boundingBox
	if( boundingBox === null || typeof boundingBox !== "object" ){
		return []
	}

	const minX = Number.parseInt( boundingBox.minX, 10 )
	const maxX = Number.parseInt( boundingBox.maxX, 10 )
	const minY = Number.parseInt( boundingBox.minY, 10 )
	const maxY = Number.parseInt( boundingBox.maxY, 10 )

	if(
		Number.isInteger( minX ) === false ||
		Number.isInteger( maxX ) === false ||
		Number.isInteger( minY ) === false ||
		Number.isInteger( maxY ) === false
	){
		return []
	}

	if( maxX < minX || maxY < minY ){
		return []
	}

	const width = maxX - minX + 1
	const height = maxY - minY + 1
	const area = width * height

	if( area <= 0 ){
		return []
	}

	const pixelCount = Number.parseInt( roi?.pixelCount, 10 )
	if( Number.isInteger( pixelCount ) && pixelCount > 0 && pixelCount !== area ){
		return []
	}

	const points = []

	for( var y = minY; y <= maxY; y++ ){
		for( var x = minX; x <= maxX; x++ ){
			points.push({ x, y })
		}
	}

	return points
}

const resetEstimatedRoiArtifacts = () => {

	estimatedRoiStorage.value = []
	estimatedRoiList.value = []
	estimatedRoiListMode.value = ""
	estimatedRoiStorageMode.value = ""
	estimatedRoiListAttempted.value = false
	estimatedRoiStorageAttempted.value = false
}

const loadOptionalRoiArtifact = async ( modes, preferredMode = "", forceRefresh = false ) => {

	const candidates = Array.isArray( modes ) ? modes : []
	if( candidates.length === 0 ) return null

	const orderedModes = preferredMode.length > 0
		? [ preferredMode, ...candidates.filter(( mode ) => mode !== preferredMode ) ]
		: [ ...candidates ]

	for( const mode of orderedModes ){
		try{
			const payload = forceRefresh
				? await results.load( project.value, mode )
				: await hyperspectrumCache.getArtifact( project.value, mode, {
					...cacheOptions,
					priority: "high"
				})

			if( payload instanceof Error ) continue

			return { mode, payload }
		} catch( error ){
			continue
		}
	}

	return null
}

const loadEstimatedRoiList = async ( forceRefresh = false ) => {

	if( forceRefresh === false && estimatedRoiListAttempted.value ){
		return
	}

	const loadedArtifact = await loadOptionalRoiArtifact(
		ESTIMATED_ROI_FRONTEND_MODES,
		estimatedRoiListMode.value,
		forceRefresh
	)

	if( loadedArtifact === null ){
		estimatedRoiList.value = []
		estimatedRoiListMode.value = ""
		estimatedRoiListAttempted.value = true
		return
	}

	estimatedRoiList.value = normalizeEstimatedRoiPayload( loadedArtifact.payload, loadedArtifact.mode )
	estimatedRoiListMode.value = loadedArtifact.mode
	estimatedRoiListAttempted.value = true
}

const loadEstimatedRoiStorage = async ( forceRefresh = false ) => {

	if( forceRefresh === false && estimatedRoiStorageAttempted.value ){
		return
	}

	const loadedArtifact = await loadOptionalRoiArtifact(
		ESTIMATED_ROI_STORAGE_MODES,
		estimatedRoiStorageMode.value,
		forceRefresh
	)

	if( loadedArtifact === null ){
		estimatedRoiStorage.value = []
		estimatedRoiStorageMode.value = ""
		estimatedRoiStorageAttempted.value = true
		return
	}

	estimatedRoiStorage.value = normalizeEstimatedRoiPayload( loadedArtifact.payload, loadedArtifact.mode )
	estimatedRoiStorageMode.value = loadedArtifact.mode
	estimatedRoiStorageAttempted.value = true
}

const roiPixelsForId = ( roiId, sourceRois = roiStorage.value ) => {

	if( typeof roiId !== "string" || roiId.length === 0 ){
		return []
	}

	const collection = Array.isArray( sourceRois ) ? sourceRois : []
	const matched = collection.find(( roi ) => roi?.roiId === roiId ) ?? null
	if( matched === null ) return []

	const points = Array.isArray( matched?.pixels ) ? matched.pixels : []
	return normalizeSelectionPoints( points )
}

const refreshRamanRoiSpectrum = async () => {

	if( selectedRoi.value === null ){
		ramanRoiSpectrum.value = null
		return
	}

	const needsRaman = spectrumSelectionMode.value === "raman" || spectrumSelectionMode.value === "both"
	if( needsRaman === false || hasEstimatedRamanSpectraReady.value === false ){
		ramanRoiSpectrum.value = null
		return
	}

	const roiId = String( selectedRoi.value.roiId ?? "" ).trim()
	if( roiId.length === 0 ){
		ramanRoiSpectrum.value = null
		return
	}

	await loadEstimatedRoiList()

	const matchedEstimatedRoi = estimatedRoiList.value.find(( roi ) => roi.roiId === roiId ) ?? null
	if( matchedEstimatedRoi !== null && Array.isArray( matchedEstimatedRoi.meanSpectrum )){
		ramanRoiSpectrum.value = {
			spectrum: matchedEstimatedRoi.meanSpectrum,
			lowerBound: matchedEstimatedRoi.lowerBound ?? null,
			upperBound: matchedEstimatedRoi.upperBound ?? null
		}
		return
	}

	if( estimatedRoiStorage.value.length === 0 && estimatedRoiStorageAttempted.value === false ){
		await loadEstimatedRoiStorage()
	}

	var points = roiPixelsForId( roiId, estimatedRoiStorage.value )

	if( points.length === 0 ){
		if( roiStorage.value.length === 0 ){
			await loadRoiStorage()
		}
		points = roiPixelsForId( roiId, roiStorage.value )
	}

	if( points.length === 0 ){
		points = roiPointsFromBoundingBox( selectedRoi.value )
	}

	if( points.length === 0 ){
		ramanRoiSpectrum.value = null
		return
	}

	const requestID = activeRamanRoiRequestID.value + 1
	activeRamanRoiRequestID.value = requestID

		try{
			const percentages = uncertaintyPercentages()
			const response = await hyperspectra.meanSpectrum(
				project.value,
				points,
			activeGroupID(),
			true,
			false,
			percentages.lower,
			percentages.upper,
			dataTypeForSpectrumSource( "raman" ),
			dataSourceForSpectrumSource( "raman" ),
			confidenceLevelsForSpectrumSource( "raman" )
		)

		if( requestID !== activeRamanRoiRequestID.value ) return

		ramanRoiSpectrum.value = response ?? null
	} catch( error ){
		if( requestID !== activeRamanRoiRequestID.value ) return
		ramanRoiSpectrum.value = null
	}
}

const newestMatchingRoiId = ( name, description ) => {

	const normalizedName = String( name ?? "" ).trim()
	const normalizedDescription = String( description ?? "" )

	const matches = rois.value.filter(( roi ) => {
		return roi.name === normalizedName && roi.description === normalizedDescription
	})

	if( matches.length === 0 ){
		return ""
	}

	matches.sort(( left, right ) => {
		const leftTimestamp = Date.parse( left.createdAt || "" )
		const rightTimestamp = Date.parse( right.createdAt || "" )
		const safeLeft = Number.isFinite( leftTimestamp ) ? leftTimestamp : 0
		const safeRight = Number.isFinite( rightTimestamp ) ? rightTimestamp : 0

		return safeRight - safeLeft
	})

	return matches[0].roiId
}

const openRoiSaveModal = () => {

	if( canMutateRois.value === false ) return
	if( hasSelectedRegion.value === false ) return

	roiSaveModal.value?.open()
}

const openRoiDeleteModal = () => {

	if( canMutateRois.value === false ) return
	if( selectedRoi.value === null ) return

	roiDeleteModal.value?.open()
}

const openRoiDescriptionModal = () => {

	if( selectedRoi.value === null ) return
	roiDescriptionModal.value?.open()
}

const openXyzSettingsModal = async () => {

	if( canEditXyz.value === false ) return

	try{
		const axes = xyzAxes.value ?? await loadXyz( "high" )
		xyzSettingsModal.value?.open( axes )
	} catch( error ){
		console.log( error )
	}
}

const normalizeAxisValuesForSave = ( values, fallbackValues = [] ) => {

	if( Array.isArray( values ) === false || values.length === 0 ){
		return Array.isArray( fallbackValues ) ? [ ...fallbackValues ] : []
	}

	var normalized = []

	for( var index = 0; index < values.length; index++ ){

		const numeric = Number( values[index] )
		if( Number.isFinite( numeric ) ){
			normalized.push( numeric )
			continue
		}

		const fallbackNumeric = Number( fallbackValues?.[index] )
		if( Number.isFinite( fallbackNumeric ) ){
			normalized.push( fallbackNumeric )
			continue
		}

		normalized.push( index )
	}

	return normalized
}

const saveXyzSettings = async ( payload ) => {

	if( canEditXyz.value === false ) return
	if( savingXyz.value ) return

	var existingAxes = xyzAxes.value
	if( existingAxes === null ){
		try{
			existingAxes = await loadXyz( "high" )
		} catch( error ){
			console.log( error )
			return
		}
	}

	if( existingAxes === null || typeof existingAxes !== "object" ) return

	const updatedAxes = {
		...existingAxes,
		x: normalizeAxisValuesForSave( payload?.x, existingAxes.x ),
		y: normalizeAxisValuesForSave( payload?.y, existingAxes.y ),
		z: normalizeAxisValuesForSave( payload?.z, existingAxes.z ),
		xUnit: typeof payload?.xUnit === "string" ? payload.xUnit : existingAxes.xUnit,
		yUnit: typeof payload?.yUnit === "string" ? payload.yUnit : existingAxes.yUnit,
		zUnit: typeof payload?.zUnit === "string" ? payload.zUnit : existingAxes.zUnit
	}

	savingXyz.value = true

	try{
		await results.set( project.value, "xyz", updatedAxes )
		await hyperspectrumCache.setXyz( project.value, updatedAxes, cacheOptions )

		xyzAxes.value = updatedAxes
		layerInput.value = normalizeLayerInput( layerInput.value )

		if( graph.value !== null && currentMatrix() !== null ){
			await renderCurrentMatrix()
		}

		xyzSettingsModal.value?.close()
	} catch( error ){
		console.log( error )
	} finally {
		savingXyz.value = false
	}
}

const toggleAllRoiOverlays = async () => {

	showAllRoiOverlays.value = !showAllRoiOverlays.value

	if( graph.value === null ) return
	if( currentMatrix() === null ) return

	try{
		await renderCurrentMatrix()
	} catch( error ){
		console.log( error )
	}
}

const setRoiEstimateUncertaintyMode = ( mode ) => {
	roiEstimateUncertaintyMode.value = mode === "hide" ? "hide" : "show"
}

const saveRoi = async ( payload ) => {

	if( savingRoi.value ) return
	if( canMutateRois.value === false ) return

	const points = normalizeSelectionPoints( latestSelectedRegionPoints.value )
	if( points.length === 0 ) return

	savingRoi.value = true

	try{
		const percentages = points.length > 1 ? uncertaintyPercentages() : null

			await hyperspectra.createRoi( project.value, {
				name: payload?.name,
				description: payload?.description ?? "",
				shapeType: "pixel-list",
				deduplicate: true,
			strictBounds: false,
			points
			},
			activeGroupID(),
			percentages?.lower,
			percentages?.upper,
			estimateConfidenceLevels )

		await loadRoiList( true )
		await loadRoiStorage( true )
		resetEstimatedRoiArtifacts()
		await loadEstimatedRoiList( true )
		await loadEstimatedRoiStorage( true )

		const matchedRoiId = newestMatchingRoiId( payload?.name, payload?.description ?? "" )
		if( matchedRoiId.length > 0 ){
			selectedRoiId.value = matchedRoiId
		}

		roiSaveModal.value?.close()
	} catch( error ){
		console.log( error )
	} finally {
		savingRoi.value = false
	}
}

const deleteSelectedRoi = async () => {

	if( deletingRoi.value ) return
	if( canMutateRois.value === false ) return
	if( selectedRoi.value === null ) return

	const roiId = selectedRoi.value.roiId
	deletingRoi.value = true

	try{
		await hyperspectra.deleteRoi( project.value, roiId, activeGroupID() )
		selectedRoiId.value = ""
		await loadRoiList( true )
		await loadRoiStorage( true )
		resetEstimatedRoiArtifacts()
		await loadEstimatedRoiList( true )
		await loadEstimatedRoiStorage( true )
		roiDeleteModal.value?.close()
	} catch( error ){
		console.log( error )
	} finally {
		deletingRoi.value = false
	}
}

const spectrumSourcesToQuery = () => {

	if( hasEstimatedRamanSpectraReady.value === false ){
		return [ "measurement" ]
	}

	const mode = spectrumSelectionMode.value
	if( mode === "raman" ){
		return [ "raman" ]
	}
	if( mode === "both" ){
		return [ "measurement", "raman" ]
	}

	return [ "measurement" ]
}

const dataTypeForSpectrumSource = ( source ) => {
	normalizeSpectrumSource( source )
	return measurementDataType
}

const dataSourceForSpectrumSource = ( source ) => {
	return normalizeSpectrumSource( source ) === "raman" ? "estimate" : ""
}

const confidenceLevelsForSpectrumSource = ( source ) => {
	return normalizeSpectrumSource( source ) === "raman" ? estimateConfidenceLevels : []
}

const updateLatestSingleSpectrum = ( source, x, y, response ) => {

	if( normalizeSpectrumSource( source ) === "raman" ){
		latestRamanSingleSpectrum.value = { x, y, response }
		latestRamanSelectedSpectrum.value = response ?? null
		return
	}

	latestMeasurementSingleSpectrum.value = { x, y, response }
	latestMeasurementSelectedSpectrum.value = response ?? null
}

const updateLatestMeanSpectrum = ( source, xIndices, yIndices, points, response ) => {

	const payload = {
		xIndices: [ ...xIndices ],
		yIndices: [ ...yIndices ],
		pointsCount: points.length,
		response
	}

	if( normalizeSpectrumSource( source ) === "raman" ){
		latestRamanMeanSpectrum.value = payload
		latestRamanSelectedSpectrum.value = response ?? null
		return
	}

	latestMeasurementMeanSpectrum.value = payload
	latestMeasurementSelectedSpectrum.value = response ?? null
}

const queryPointSpectrumForSource = async ( source, x, y ) => {

	const normalizedSource = normalizeSpectrumSource( source )
	const requestIDRef = normalizedSource === "raman"
		? activeRamanSingleSpectrumRequestID
		: activeMeasurementSingleSpectrumRequestID
	const requestID = requestIDRef.value + 1
	requestIDRef.value = requestID

	try{
		const response = await hyperspectra.spectrum(
			project.value,
			x,
			y,
			activeGroupID(),
			dataTypeForSpectrumSource( normalizedSource ),
			dataSourceForSpectrumSource( normalizedSource ),
			confidenceLevelsForSpectrumSource( normalizedSource )
		)

		if( requestID !== requestIDRef.value ) return

		updateLatestSingleSpectrum( normalizedSource, x, y, response )
	} catch( error ){
		console.log( error )
	}
}

const queryMeanSpectrumForSource = async ( source, xIndices, yIndices, points ) => {

	const normalizedSource = normalizeSpectrumSource( source )
	const requestIDRef = normalizedSource === "raman"
		? activeRamanMeanSpectrumRequestID
		: activeMeasurementMeanSpectrumRequestID
	const requestID = requestIDRef.value + 1
	requestIDRef.value = requestID

	try{
		const percentages = uncertaintyPercentages()
		const response = await hyperspectra.meanSpectrum(
			project.value,
			points,
			activeGroupID(),
			true,
			false,
				percentages.lower,
				percentages.upper,
				dataTypeForSpectrumSource( normalizedSource ),
				dataSourceForSpectrumSource( normalizedSource ),
				estimateConfidenceLevels
			)

		if( requestID !== requestIDRef.value ) return

		updateLatestMeanSpectrum( normalizedSource, xIndices, yIndices, points, response )
	} catch( error ){
		console.log( error )
	}
}

const handleHeatmapPointSelection = async ( selection ) => {

	if( project.value.id === "" ) return
	if( selection === null || typeof selection !== "object" ) return

	const x = Number.parseInt( selection.x, 10 )
	const y = Number.parseInt( selection.y, 10 )

	if( Number.isInteger( x ) === false || Number.isInteger( y ) === false ) return

	selectedHeatmapIndices.value = {
		xIndices: [ x ],
		yIndices: [ y ]
	}
	latestSelectedRegionPoints.value = [ { x, y } ]

	const sources = spectrumSourcesToQuery()
	await Promise.all( sources.map(( source ) => queryPointSpectrumForSource( source, x, y )))
	await renderCurrentMatrix()
}

const handleHeatmapRegionSelection = async ( selection ) => {

	if( project.value.id === "" ) return
	if( selection === null || typeof selection !== "object" ) return

	const xIndices = Array.isArray( selection.xIndices ) ? selection.xIndices : []
	const yIndices = Array.isArray( selection.yIndices ) ? selection.yIndices : []
	const points = normalizeSelectionPoints( selection.points )

	if( xIndices.length === 0 || yIndices.length === 0 || points.length === 0 ) return

	selectedHeatmapIndices.value = {
		xIndices: [ ...xIndices ],
		yIndices: [ ...yIndices ]
	}
	latestSelectedRegionPoints.value = points.map(( point ) => ({ ...point }))

	const sources = spectrumSourcesToQuery()
	await Promise.all( sources.map(( source ) => queryMeanSpectrumForSource( source, xIndices, yIndices, points )))
	await renderCurrentMatrix()
}

const applyHeatmapInteraction = async () => {

	if( graph.value === null ) return

	const dimensions = matrixDimensions( currentMatrix() )
	if( dimensions === null ) return

	await hyperspectrum.configureHeatmapInteraction( graph.value, {
		mode: heatmapInteractionMode.value,
		width: dimensions.width,
		height: dimensions.height,
		onPointSelect: ( selection ) => {
			void handleHeatmapPointSelection( selection )
		},
		onRegionSelect: ( selection ) => {
			void handleHeatmapRegionSelection( selection )
		}
	})
}

const togglePcaComponent = async ( componentIndex ) => {

	const normalizedComponent = Number.parseInt( componentIndex, 10 )
	if( Number.isInteger( normalizedComponent ) === false ) return
	if( normalizedComponent < 1 || normalizedComponent > visiblePcaLoadingCount.value ) return

	if( isPcaComponentActive( normalizedComponent ) ){
		activePcaComponents.value = activePcaComponents.value.filter(( index ) => index !== normalizedComponent )
	} else {
		activePcaComponents.value = [ ...activePcaComponents.value, normalizedComponent ].sort(( left, right ) => left - right )
	}

	showPcaLoadings.value = activePcaComponents.value.length > 0

	if( selectedRoiId.value !== "" ){
		selectedRoiId.value = ""
		return
	}

	if( graph.value === null ) return
	if( currentMatrix() === null ) return

	await renderCurrentMatrix()
}

const renderCurrentMatrix = async ( initialize = false ) => {

	if( heatmapUsesEstimatedRaman.value ){
		await ensureEstimatedVisualizationMatrix( "high" )
	}

	await ensureActivePlotLoadings( "high" )

	const matrix = currentMatrix()
	if( matrix === null || graph.value === null ) return
	const bottomLeftOptions = bottomLeftSpectrumOptions()
	const sharedOptions = {
		selectedSpectrum: bottomLeftOptions.selectedSpectrum,
		bottomLeftSpectrum: bottomLeftOptions.bottomLeftSpectrum,
		topLeftSpectrum: topLeftSpectrumOptions(),
		roiOverlays: activeRoiOverlays(),
		axes: plotAxes()
	}

	if( activePlot.value === "pca" ){
		const options = {
			...sharedOptions,
			loadings: resolvedPcaLoadings(),
			loadingComponents: pcaClassificationLoadingComponents()
		}

		if( initialize ){
			await hyperspectrum.initializePcaClassification( matrix, graph.value, settings.value, options )
			await applyHeatmapInteraction()
			return
		}

		await hyperspectrum.updatePcaClassification( matrix, graph.value, settings.value, options )
		await applyHeatmapInteraction()
		return
	}

	if( activePlot.value === "rpca" ){
		const options = {
			...sharedOptions,
			loadings: resolvedRpcaLoadings(),
			loadingComponents: pcaClassificationLoadingComponents()
		}

		if( initialize ){
			await hyperspectrum.initializePcaClassification( matrix, graph.value, settings.value, options )
			await applyHeatmapInteraction()
			return
		}

		await hyperspectrum.updatePcaClassification( matrix, graph.value, settings.value, options )
		await applyHeatmapInteraction()
		return
	}

	if( activePlot.value === "pca_mip" ){
		const options = {
			...sharedOptions,
			loadings: resolvedPcaLoadings(),
			loadingComponents: pcaMipLoadingComponents()
		}

		if( initialize ){
			await hyperspectrum.initializePcaMip( matrix, graph.value, settings.value, options )
			await applyHeatmapInteraction()
			return
		}

		await hyperspectrum.updatePcaMip( matrix, graph.value, settings.value, options )
		await applyHeatmapInteraction()
		return
	}

	if( activePlot.value === "rpca_mip" ){
		const options = {
			...sharedOptions,
			loadings: resolvedRpcaLoadings(),
			loadingComponents: pcaMipLoadingComponents()
		}

		if( initialize ){
			await hyperspectrum.initializePcaMip( matrix, graph.value, settings.value, options )
			await applyHeatmapInteraction()
			return
		}

		await hyperspectrum.updatePcaMip( matrix, graph.value, settings.value, options )
		await applyHeatmapInteraction()
		return
	}

	if( activePlot.value === "pca_rgb" ){
		const redComponentLabel = String( pcaRgbChannels.value.r ).padStart( 2, "0" )
		const greenComponentLabel = String( pcaRgbChannels.value.g ).padStart( 2, "0" )
		const blueComponentLabel = String( pcaRgbChannels.value.b ).padStart( 2, "0" )

		const options = {
			...sharedOptions,
			channels: { ...pcaRgbChannels.value },
			loadings: resolvedPcaLoadings(),
			loadingSeries: [
				{
					componentIndex: pcaRgbChannels.value.r,
					label: "R - PC" + redComponentLabel,
					color: "rgb(239, 68, 68)"
				},
				{
					componentIndex: pcaRgbChannels.value.g,
					label: "G - PC" + greenComponentLabel,
					color: "rgb(34, 197, 94)"
				},
				{
					componentIndex: pcaRgbChannels.value.b,
					label: "B - PC" + blueComponentLabel,
					color: "rgb(59, 130, 246)"
				}
			]
		}

		if( initialize ){
			await hyperspectrum.initializePcaRgb( matrix, graph.value, settings.value, options )
			await applyHeatmapInteraction()
			return
		}

		await hyperspectrum.updatePcaRgb( matrix, graph.value, settings.value, options )
		await applyHeatmapInteraction()
		return
	}

	if( activePlot.value === "rpca_rgb" ){
		const redComponentLabel = String( pcaRgbChannels.value.r ).padStart( 2, "0" )
		const greenComponentLabel = String( pcaRgbChannels.value.g ).padStart( 2, "0" )
		const blueComponentLabel = String( pcaRgbChannels.value.b ).padStart( 2, "0" )

		const options = {
			...sharedOptions,
			channels: { ...pcaRgbChannels.value },
			loadings: resolvedRpcaLoadings(),
			loadingSeries: [
				{
					componentIndex: pcaRgbChannels.value.r,
					label: "R - PC" + redComponentLabel,
					color: "rgb(239, 68, 68)"
				},
				{
					componentIndex: pcaRgbChannels.value.g,
					label: "G - PC" + greenComponentLabel,
					color: "rgb(34, 197, 94)"
				},
				{
					componentIndex: pcaRgbChannels.value.b,
					label: "B - PC" + blueComponentLabel,
					color: "rgb(59, 130, 246)"
				}
			]
		}

		if( initialize ){
			await hyperspectrum.initializePcaRgb( matrix, graph.value, settings.value, options )
			await applyHeatmapInteraction()
			return
		}

		await hyperspectrum.updatePcaRgb( matrix, graph.value, settings.value, options )
		await applyHeatmapInteraction()
		return
	}

	if( activePlot.value === "umap" ){
		const options = {
			...sharedOptions,
			channelColors: resolvedUmapChannelColors()
		}

		if( initialize ){
			await hyperspectrum.initializeUmap( matrix, graph.value, settings.value, options )
			await applyHeatmapInteraction()
			return
		}

		await hyperspectrum.updateUmap( matrix, graph.value, settings.value, options )
		await applyHeatmapInteraction()
		return
	}

	if( activePlot.value === "mip_hsv" ){
		if( initialize ){
			await hyperspectrum.initializeRgb( matrix, graph.value, settings.value, sharedOptions )
			await applyHeatmapInteraction()
			return
		}

		await hyperspectrum.updateRgb( matrix, graph.value, settings.value, sharedOptions )
		await applyHeatmapInteraction()
		return
	}

	const scalarColorscale = activePlot.value === "layer"
		? settings.value?.colormaps?.layer
		: settings.value?.colormaps?.mip
	const colorscale = typeof scalarColorscale === "string" && scalarColorscale.length > 0
		? scalarColorscale
		: "Viridis"
	const scalarOptions = {
		...sharedOptions,
		colorscale
	}

	if( initialize ){
		await hyperspectrum.initialize( matrix, graph.value, settings.value, scalarOptions )
		await applyHeatmapInteraction()
		return
	}

	await hyperspectrum.update( matrix, graph.value, settings.value, scalarOptions )
	await applyHeatmapInteraction()
}

const loadLayer = async ( layerIndex ) => {

	if( layer.value !== null && layerIndex === activeLayerIndex.value ){
		if( activePlot.value === "layer" ){
			await renderCurrentMatrix()
		}
		void hyperspectrumCache.prefetchWindow( project.value, layerIndex, 2, cacheOptions )
		return
	}

	const requestID = activeLayerRequestID.value + 1
	activeLayerRequestID.value = requestID

	hyperspectrumCache.setActiveLayer( project.value, layerIndex, cacheOptions )

	const loadedLayer = await hyperspectrumCache.getLayer( project.value,
														layerIndex,
														{ ...cacheOptions, priority: "high" })

	if( requestID !== activeLayerRequestID.value ) return

	layer.value = loadedLayer
	activeLayerIndex.value = layerIndex

	if( activePlot.value === "layer" ){
		await renderCurrentMatrix()
	}

	void hyperspectrumCache.prefetchWindow( project.value, layerIndex, 2, cacheOptions )
}

const loadEstimatedArtifact = async ( mode, priority = "high" ) => {
	return await hyperspectrumCache.getArtifact( project.value,
											"estimate/" + mode,
											{ ...cacheOptions, priority: priority === "low" ? "low" : "high" } )
}

const loadEstimatedMip = async ( priority = "high" ) => {

	if( estimatedMip.value !== null ){
		return estimatedMip.value
	}

	const requestID = activeEstimatedMipRequestID.value + 1
	activeEstimatedMipRequestID.value = requestID

	const loadedMip = await loadEstimatedArtifact( "mip", priority )
	if( requestID !== activeEstimatedMipRequestID.value ) return estimatedMip.value

	estimatedMip.value = loadedMip
	return estimatedMip.value
}

const loadEstimatedMipHsv = async ( priority = "high" ) => {

	if( estimatedMipHsv.value !== null ){
		return estimatedMipHsv.value
	}

	const requestID = activeEstimatedMipHsvRequestID.value + 1
	activeEstimatedMipHsvRequestID.value = requestID

	const loadedMipHsv = await loadEstimatedArtifact( "mip_hsv", priority )
	if( requestID !== activeEstimatedMipHsvRequestID.value ) return estimatedMipHsv.value

	estimatedMipHsv.value = loadedMipHsv
	return estimatedMipHsv.value
}

const loadEstimatedUmap = async ( priority = "high" ) => {

	if( estimatedUmap.value !== null ){
		return estimatedUmap.value
	}

	const requestID = activeEstimatedUmapRequestID.value + 1
	activeEstimatedUmapRequestID.value = requestID

	const [ redChannel, greenChannel, blueChannel ] = await Promise.all([
		loadEstimatedArtifact( "umap/r", priority ),
		loadEstimatedArtifact( "umap/g", priority ),
		loadEstimatedArtifact( "umap/b", priority )
	])

	if( requestID !== activeEstimatedUmapRequestID.value ) return estimatedUmap.value

	estimatedUmap.value = {
		r: redChannel,
		g: greenChannel,
		b: blueChannel
	}
	return estimatedUmap.value
}

const loadEstimatedLayer = async ( layerIndex, priority = "high" ) => {

	if( estimatedLayer.value !== null && activeEstimatedLayerIndex.value === layerIndex ){
		return estimatedLayer.value
	}

	const loadedLayer = await loadEstimatedArtifact( "layers/" + layerIndex, priority )

	estimatedLayer.value = loadedLayer
	activeEstimatedLayerIndex.value = layerIndex

	return estimatedLayer.value
}

const decompositionScoreMode = ( family, componentIndex ) => {
	const normalizedFamily = String( family ?? "" ).trim().toLowerCase() === "rpca" ? "rpca" : "pca"
	const normalizedComponent = normalizePcaComponentInput( componentIndex )
	const suffix = String( normalizedComponent ).padStart( 2, "0" )
	return normalizedFamily + "/scores/pc" + suffix
}

const decompositionMipMode = ( family, componentCount ) => {
	const normalizedFamily = String( family ?? "" ).trim().toLowerCase() === "rpca" ? "rpca" : "pca"
	const normalizedCount = normalizePcaComponentInput( componentCount )
	const suffix = String( normalizedCount ).padStart( 2, "0" )
	return normalizedFamily + "/pca_mip/pc" + suffix
}

const loadEstimatedPcaClassification = async ( priority = "high" ) => {

	if( estimatedPcaClassification.value !== null ){
		return estimatedPcaClassification.value
	}

	const requestID = activeEstimatedPcaClassificationRequestID.value + 1
	activeEstimatedPcaClassificationRequestID.value = requestID

	const modes = pcaComponentIndices.map(( componentIndex ) => decompositionScoreMode( "pca", componentIndex ))
	const scores = await Promise.all( modes.map(( mode ) => loadEstimatedArtifact( mode, priority )))

	if( requestID !== activeEstimatedPcaClassificationRequestID.value ) return estimatedPcaClassification.value

	var combinedScores = {}
	for( var ii = 0; ii < pcaComponentIndices.length; ii++ ){
		combinedScores[ pcaComponentIndices[ii] ] = scores[ii]
	}

	estimatedPcaClassification.value = combinedScores
	return estimatedPcaClassification.value
}

const loadEstimatedPcaClassificationMip = async ( componentCount = activePcaClassificationCount(), priority = "high" ) => {

	const normalizedCount = normalizePcaComponentInput( componentCount )

	if( estimatedPcaClassificationMip.value !== null &&
		activeEstimatedPcaClassificationComponentCount.value === normalizedCount ){
		return estimatedPcaClassificationMip.value
	}

	const requestID = activeEstimatedPcaClassificationMipRequestID.value + 1
	activeEstimatedPcaClassificationMipRequestID.value = requestID

	const loaded = await loadEstimatedArtifact( decompositionMipMode( "pca", normalizedCount ), priority )
	if( requestID !== activeEstimatedPcaClassificationMipRequestID.value ) return estimatedPcaClassificationMip.value

	estimatedPcaClassificationMip.value = loaded
	activeEstimatedPcaClassificationComponentCount.value = normalizedCount

	return estimatedPcaClassificationMip.value
}

const loadEstimatedPcaMip = async ( componentCount = pcaMipComponentCount.value, priority = "high" ) => {

	const normalizedCount = normalizePcaComponentInput( componentCount )

	if( estimatedPcaMip.value !== null && activeEstimatedPcaMipComponentCount.value === normalizedCount ){
		return estimatedPcaMip.value
	}

	const requestID = activeEstimatedPcaMipRequestID.value + 1
	activeEstimatedPcaMipRequestID.value = requestID

	const loaded = await loadEstimatedArtifact( decompositionMipMode( "pca", normalizedCount ), priority )
	if( requestID !== activeEstimatedPcaMipRequestID.value ) return estimatedPcaMip.value

	estimatedPcaMip.value = loaded
	activeEstimatedPcaMipComponentCount.value = normalizedCount

	return estimatedPcaMip.value
}

const loadEstimatedRpcaClassification = async ( priority = "high" ) => {

	if( estimatedRpcaClassification.value !== null ){
		return estimatedRpcaClassification.value
	}

	const requestID = activeEstimatedRpcaClassificationRequestID.value + 1
	activeEstimatedRpcaClassificationRequestID.value = requestID

	const modes = pcaComponentIndices.map(( componentIndex ) => decompositionScoreMode( "rpca", componentIndex ))
	const scores = await Promise.all( modes.map(( mode ) => loadEstimatedArtifact( mode, priority )))

	if( requestID !== activeEstimatedRpcaClassificationRequestID.value ) return estimatedRpcaClassification.value

	var combinedScores = {}
	for( var ii = 0; ii < pcaComponentIndices.length; ii++ ){
		combinedScores[ pcaComponentIndices[ii] ] = scores[ii]
	}

	estimatedRpcaClassification.value = combinedScores
	return estimatedRpcaClassification.value
}

const loadEstimatedRpcaClassificationMip = async ( componentCount = activePcaClassificationCount(), priority = "high" ) => {

	const normalizedCount = normalizePcaComponentInput( componentCount )

	if( estimatedRpcaClassificationMip.value !== null &&
		activeEstimatedRpcaClassificationComponentCount.value === normalizedCount ){
		return estimatedRpcaClassificationMip.value
	}

	const requestID = activeEstimatedRpcaClassificationMipRequestID.value + 1
	activeEstimatedRpcaClassificationMipRequestID.value = requestID

	const loaded = await loadEstimatedArtifact( decompositionMipMode( "rpca", normalizedCount ), priority )
	if( requestID !== activeEstimatedRpcaClassificationMipRequestID.value ) return estimatedRpcaClassificationMip.value

	estimatedRpcaClassificationMip.value = loaded
	activeEstimatedRpcaClassificationComponentCount.value = normalizedCount

	return estimatedRpcaClassificationMip.value
}

const loadEstimatedRpcaMip = async ( componentCount = pcaMipComponentCount.value, priority = "high" ) => {

	const normalizedCount = normalizePcaComponentInput( componentCount )

	if( estimatedRpcaMip.value !== null && activeEstimatedRpcaMipComponentCount.value === normalizedCount ){
		return estimatedRpcaMip.value
	}

	const requestID = activeEstimatedRpcaMipRequestID.value + 1
	activeEstimatedRpcaMipRequestID.value = requestID

	const loaded = await loadEstimatedArtifact( decompositionMipMode( "rpca", normalizedCount ), priority )
	if( requestID !== activeEstimatedRpcaMipRequestID.value ) return estimatedRpcaMip.value

	estimatedRpcaMip.value = loaded
	activeEstimatedRpcaMipComponentCount.value = normalizedCount

	return estimatedRpcaMip.value
}

const loadEstimatedPcaLoadings = async ( priority = "high" ) => {

	if( estimatedPcaLoadings.value !== null ){
		return estimatedPcaLoadings.value
	}

	const requestID = activeEstimatedPcaLoadingsRequestID.value + 1
	activeEstimatedPcaLoadingsRequestID.value = requestID

	try{
		const loadedLoadings = await loadEstimatedArtifact( "pca/loadings", priority )
		if( requestID !== activeEstimatedPcaLoadingsRequestID.value ) return estimatedPcaLoadings.value
		estimatedPcaLoadings.value = loadedLoadings
	} catch( error ){
		if( requestID !== activeEstimatedPcaLoadingsRequestID.value ) return estimatedPcaLoadings.value
		estimatedPcaLoadings.value = null
	}

	return estimatedPcaLoadings.value
}

const loadEstimatedRpcaLoadings = async ( priority = "high" ) => {

	if( estimatedRpcaLoadings.value !== null ){
		return estimatedRpcaLoadings.value
	}

	const requestID = activeEstimatedRpcaLoadingsRequestID.value + 1
	activeEstimatedRpcaLoadingsRequestID.value = requestID

	try{
		const loadedLoadings = await loadEstimatedArtifact( "rpca/loadings", priority )
		if( requestID !== activeEstimatedRpcaLoadingsRequestID.value ) return estimatedRpcaLoadings.value
		estimatedRpcaLoadings.value = loadedLoadings
	} catch( error ){
		if( requestID !== activeEstimatedRpcaLoadingsRequestID.value ) return estimatedRpcaLoadings.value
		estimatedRpcaLoadings.value = null
	}

	return estimatedRpcaLoadings.value
}

const activePlotUsesPcaLoadings = () => {
	return activePlot.value === "pca" || activePlot.value === "pca_mip" || activePlot.value === "pca_rgb"
}

const activePlotUsesRpcaLoadings = () => {
	return activePlot.value === "rpca" || activePlot.value === "rpca_mip" || activePlot.value === "rpca_rgb"
}

const ensureActivePlotLoadings = async ( priority = "high" ) => {

	if( showPcaLoadings.value === false ) return
	if( selectedRoi.value !== null ) return

	if( activePlotUsesPcaLoadings() ){
		if( usesEstimatedLoadings() ){
			const loadedEstimated = await loadEstimatedPcaLoadings( priority )
			if( loadedEstimated === null ){
				await loadPcaLoadings()
			}
		} else {
			await loadPcaLoadings()
		}
		return
	}

	if( activePlotUsesRpcaLoadings() ){
		if( usesEstimatedLoadings() ){
			const loadedEstimated = await loadEstimatedRpcaLoadings( priority )
			if( loadedEstimated === null ){
				await loadRpcaLoadings()
			}
		} else {
			await loadRpcaLoadings()
		}
	}
}

const ensureEstimatedVisualizationMatrix = async ( priority = "high" ) => {

	if( heatmapUsesEstimatedRaman.value === false ) return

	try{
		if( activePlot.value === "mip" ){
			await loadEstimatedMip( priority )
			return
		}

		if( activePlot.value === "mip_hsv" ){
			await loadEstimatedMipHsv( priority )
			return
		}

		if( activePlot.value === "umap" ){
			await loadEstimatedUmap( priority )
			return
		}

			if( activePlot.value === "layer" ){
				const layerIndex = normalizeLayerInput( layerInput.value )
				layerInput.value = layerIndex
				await loadEstimatedLayer( layerIndex, priority )
				return
			}

			if( activePlot.value === "pca" ){
				await loadEstimatedPcaClassificationMip( activePcaClassificationCount(), priority )
				return
			}

			if( activePlot.value === "pca_mip" ){
				await loadEstimatedPcaMip( pcaMipComponentCount.value, priority )
				return
			}

			if( activePlot.value === "pca_rgb" ){
				await loadEstimatedPcaClassification( priority )
				return
			}

			if( activePlot.value === "rpca" ){
				await loadEstimatedRpcaClassificationMip( activePcaClassificationCount(), priority )
				return
			}

			if( activePlot.value === "rpca_mip" ){
				await loadEstimatedRpcaMip( pcaMipComponentCount.value, priority )
				return
			}

			if( activePlot.value === "rpca_rgb" ){
				await loadEstimatedRpcaClassification( priority )
				return
			}
		} catch( error ){
			console.log( error )
		}
	}

const loadMipHsv = async ( priority = "high" ) => {

	if( mipHsv.value !== null ){
		return mipHsv.value
	}

	const requestID = activeMipHsvRequestID.value + 1
	activeMipHsvRequestID.value = requestID

	const loadedMipHsv = await hyperspectrumCache.getMipHsv( project.value,
														{ ...cacheOptions, priority: priority === "low" ? "low" : "high" })

	if( requestID !== activeMipHsvRequestID.value ) return mipHsv.value

	mipHsv.value = loadedMipHsv
	return mipHsv.value
}

const loadUmap = async ( priority = "high" ) => {

	if( umap.value !== null ){
		return umap.value
	}

	const requestID = activeUmapRequestID.value + 1
	activeUmapRequestID.value = requestID

	const loadedUmap = await hyperspectrumCache.getUmap( project.value,
													{ ...cacheOptions, priority: priority === "low" ? "low" : "high" })

	if( requestID !== activeUmapRequestID.value ) return umap.value

	umap.value = loadedUmap
	return umap.value
}

const loadXyz = async ( priority = "high" ) => {

	if( xyzAxes.value !== null ){
		return xyzAxes.value
	}

	const requestID = activeXyzRequestID.value + 1
	activeXyzRequestID.value = requestID

	const loadedXyz = await hyperspectrumCache.getXyz( project.value,
													{ ...cacheOptions, priority: priority === "low" ? "low" : "high" } )

	if( requestID !== activeXyzRequestID.value ) return xyzAxes.value

	xyzAxes.value = loadedXyz
	return xyzAxes.value
}

const loadPcaClassification = async () => {

	const requestID = activePcaClassificationRequestID.value + 1
	activePcaClassificationRequestID.value = requestID

	hyperspectrumCache.setActivePca( project.value, 5, cacheOptions )

	const scores = await Promise.all( pcaComponentIndices.map(( componentIndex ) => {
		return hyperspectrumCache.getPcaScore( project.value,
											componentIndex,
											{ ...cacheOptions, priority: "high" })
	}))

	if( requestID !== activePcaClassificationRequestID.value ) return

	var combinedScores = {}
	for( var ii = 0; ii < pcaComponentIndices.length; ii++ ){
		combinedScores[ pcaComponentIndices[ii] ] = scores[ii]
	}

	pcaClassification.value = combinedScores

	if( activePlot.value === "pca" || activePlot.value === "pca_rgb" ){
		if( activePlot.value === "pca_rgb" ){
			await renderCurrentMatrix()
		}
	}
}

const loadPcaClassificationMip = async ( componentCount = activePcaClassificationCount() ) => {

	const normalizedComponentCount = normalizePcaComponentInput( componentCount )

	if( pcaClassificationMip.value !== null &&
		activePcaClassificationComponentCount.value === normalizedComponentCount ){
		return pcaClassificationMip.value
	}

	const requestID = activePcaClassificationMipRequestID.value + 1
	activePcaClassificationMipRequestID.value = requestID

	const loadedPcaClassificationMip = await hyperspectrumCache.getPcaMip( project.value, {
		...cacheOptions,
		componentCount: normalizedComponentCount,
		priority: "high"
	})

	if( requestID !== activePcaClassificationMipRequestID.value ) return pcaClassificationMip.value

	pcaClassificationMip.value = loadedPcaClassificationMip
	activePcaClassificationComponentCount.value = normalizedComponentCount

	return pcaClassificationMip.value
}

const loadPcaMip = async ( componentCount = pcaMipComponentCount.value ) => {

	const normalizedComponentCount = normalizePcaComponentInput( componentCount )
	pcaMipComponentCount.value = normalizedComponentCount

	if( pcaMip.value !== null && activePcaMipComponentCount.value === normalizedComponentCount ){
		return pcaMip.value
	}

	const requestID = activePcaMipRequestID.value + 1
	activePcaMipRequestID.value = requestID

	const loadedPcaMip = await hyperspectrumCache.getPcaMip( project.value, {
		...cacheOptions,
		componentCount: normalizedComponentCount,
		priority: "high"
	})

	if( requestID !== activePcaMipRequestID.value ) return pcaMip.value

	pcaMip.value = loadedPcaMip
	activePcaMipComponentCount.value = normalizedComponentCount

	if( activePlot.value === "pca_mip" ){
		await renderCurrentMatrix()
	}

	return pcaMip.value
}

const loadPcaLoadings = async () => {

	if( pcaLoadings.value !== null ){
		return pcaLoadings.value
	}

	const requestID = activePcaLoadingsRequestID.value + 1
	activePcaLoadingsRequestID.value = requestID

	const loadedLoadings = await hyperspectrumCache.getLoadings( project.value, { ...cacheOptions, priority: "high" })

	if( requestID !== activePcaLoadingsRequestID.value ) return pcaLoadings.value

	pcaLoadings.value = loadedLoadings

	return pcaLoadings.value
}

const loadRpcaClassification = async () => {

	const requestID = activeRpcaClassificationRequestID.value + 1
	activeRpcaClassificationRequestID.value = requestID

	hyperspectrumCache.setActiveRpca( project.value, 5, cacheOptions )

	const scores = await Promise.all( pcaComponentIndices.map(( componentIndex ) => {
		return hyperspectrumCache.getRpcaScore( project.value,
											componentIndex,
											{ ...cacheOptions, priority: "high" })
	}))

	if( requestID !== activeRpcaClassificationRequestID.value ) return

	var combinedScores = {}
	for( var ii = 0; ii < pcaComponentIndices.length; ii++ ){
		combinedScores[ pcaComponentIndices[ii] ] = scores[ii]
	}

	rpcaClassification.value = combinedScores

	if( activePlot.value === "rpca_rgb" ){
		await renderCurrentMatrix()
	}
}

const loadRpcaClassificationMip = async ( componentCount = activePcaClassificationCount() ) => {

	const normalizedComponentCount = normalizePcaComponentInput( componentCount )

	if( rpcaClassificationMip.value !== null &&
		activeRpcaClassificationComponentCount.value === normalizedComponentCount ){
		return rpcaClassificationMip.value
	}

	const requestID = activeRpcaClassificationMipRequestID.value + 1
	activeRpcaClassificationMipRequestID.value = requestID

	const loadedRpcaClassificationMip = await hyperspectrumCache.getRpcaMip( project.value, {
		...cacheOptions,
		componentCount: normalizedComponentCount,
		priority: "high"
	})

	if( requestID !== activeRpcaClassificationMipRequestID.value ) return rpcaClassificationMip.value

	rpcaClassificationMip.value = loadedRpcaClassificationMip
	activeRpcaClassificationComponentCount.value = normalizedComponentCount

	return rpcaClassificationMip.value
}

const loadRpcaMip = async ( componentCount = pcaMipComponentCount.value ) => {

	const normalizedComponentCount = normalizePcaComponentInput( componentCount )
	pcaMipComponentCount.value = normalizedComponentCount

	if( rpcaMip.value !== null && activeRpcaMipComponentCount.value === normalizedComponentCount ){
		return rpcaMip.value
	}

	const requestID = activeRpcaMipRequestID.value + 1
	activeRpcaMipRequestID.value = requestID

	const loadedRpcaMip = await hyperspectrumCache.getRpcaMip( project.value, {
		...cacheOptions,
		componentCount: normalizedComponentCount,
		priority: "high"
	})

	if( requestID !== activeRpcaMipRequestID.value ) return rpcaMip.value

	rpcaMip.value = loadedRpcaMip
	activeRpcaMipComponentCount.value = normalizedComponentCount

	return rpcaMip.value
}

const loadRpcaLoadings = async () => {

	if( rpcaLoadings.value !== null ){
		return rpcaLoadings.value
	}

	const requestID = activeRpcaLoadingsRequestID.value + 1
	activeRpcaLoadingsRequestID.value = requestID

	const loadedLoadings = await hyperspectrumCache.getRpcaLoadings( project.value, { ...cacheOptions, priority: "high" })

	if( requestID !== activeRpcaLoadingsRequestID.value ) return rpcaLoadings.value

	rpcaLoadings.value = loadedLoadings

	return rpcaLoadings.value
}

const normalizeLayerInput = ( value ) => {

	const parsed = Number.parseInt( value, 10 )
	if( Number.isInteger( parsed ) === false || parsed < 0 ){
		return 0
	}

	return Math.max( 0, Math.min( maxLayerIndex.value, parsed ))
}

const applyLayerInput = async () => {

	const layerIndex = normalizeLayerInput( layerInput.value )
	layerInput.value = layerIndex

	if( heatmapUsesEstimatedRaman.value && activePlot.value === "layer" ){
		await loadEstimatedLayer( layerIndex )
		await renderCurrentMatrix()
		return
	}

	await loadLayer( layerIndex )
}

const normalizePcaComponentInput = ( value ) => {

	const parsed = Number.parseInt( value, 10 )
	if( Number.isInteger( parsed ) === false ){
		return 1
	}

	return Math.max( 1, Math.min( 10, parsed ))
}

const applyPcaRgbInput = async () => {

	const red = normalizePcaComponentInput( pcaRgbRedInput.value )
	const green = normalizePcaComponentInput( pcaRgbGreenInput.value )
	const blue = normalizePcaComponentInput( pcaRgbBlueInput.value )

	pcaRgbRedInput.value = red
	pcaRgbGreenInput.value = green
	pcaRgbBlueInput.value = blue

	pcaRgbChannels.value = {
		r: red,
		g: green,
		b: blue
	}

	if((( activePlot.value === "pca_rgb" && pcaClassification.value !== null ) ||
		( activePlot.value === "rpca_rgb" && rpcaClassification.value !== null ))){
		await renderCurrentMatrix()
	}
}

const applyPcaMipComponentCount = async () => {

	const normalizedCount = normalizePcaComponentInput( pcaMipComponentCount.value )
	pcaMipComponentCount.value = normalizedCount
	resetActivePcaComponents( normalizedCount )

	if( activePlot.value === "pca_mip" ){
		await loadPcaMip( normalizedCount )
		await renderCurrentMatrix()
		return
	}

	if( activePlot.value !== "rpca_mip" ) return

	await loadRpcaMip( normalizedCount )
	await renderCurrentMatrix()
}

const applyPcaClassificationComponentCount = async () => {

	const normalizedCount = normalizePcaComponentInput( pcaClassificationComponentCount.value )
	pcaClassificationComponentCount.value = normalizedCount
	resetActivePcaComponents( normalizedCount )

	if( activePlot.value === "pca" ){
		await loadPcaClassificationMip( normalizedCount )
		await renderCurrentMatrix()
		return
	}

	if( activePlot.value !== "rpca" ) return

	await loadRpcaClassificationMip( normalizedCount )
	await renderCurrentMatrix()
}

const refreshOnResize = debounce( async () => {
	if( graph.value === null ) return
	await renderCurrentMatrix()
}, 100 )

const debouncedApplyLayerInput = debounce( async () => {

	if( activePlot.value !== "layer" ) return
	await applyLayerInput()
}, 120 )

const debouncedApplyPcaRgbInput = debounce( async () => {

	if( activePlot.value !== "pca_rgb" && activePlot.value !== "rpca_rgb" ) return
	await applyPcaRgbInput()
}, 120 )

const resetViewerState = () => {

	stopGpuInferenceStatusPolling()
	gpuStatusPollInFlight = false

	project.value = { id: "" }
	gpuInferenceJobId.value = ""
	gpuInferenceStatus.value = ""
	gpuInferenceEstimateSpectraReady.value = false
	visualizationDataSource.value = resolvedDefaultVisualizationDataSource()
	spectrumDataSource.value = "measurement"
	primarySpectrumSource.value = "measurement"
	activePlot.value = defaultDisplayMode()
	heatmapInteractionMode.value = defaultHeatmapInteractionMode()
	selectedConfidenceLevel.value = defaultSelectionConfidenceLevel()
	roiEstimateUncertaintyMode.value = defaultRoiEstimateUncertaintyMode()
	mip.value = null
	mipHsv.value = null
	umap.value = null
	xyzAxes.value = null
	layer.value = null
	estimatedMip.value = null
	estimatedMipHsv.value = null
	estimatedUmap.value = null
	estimatedLayer.value = null
	estimatedPcaClassification.value = null
	estimatedPcaClassificationMip.value = null
	estimatedPcaMip.value = null
	estimatedPcaLoadings.value = null
	estimatedRpcaClassification.value = null
	estimatedRpcaClassificationMip.value = null
	estimatedRpcaMip.value = null
	estimatedRpcaLoadings.value = null
	activeEstimatedLayerIndex.value = -1
	pcaClassification.value = null
	pcaClassificationMip.value = null
	pcaMip.value = null
	pcaLoadings.value = null
	rpcaClassification.value = null
	rpcaClassificationMip.value = null
	rpcaMip.value = null
	rpcaLoadings.value = null
	showPcaLoadings.value = defaultShowPcaLoadings()
	showSelectedSpectra.value = true
	rois.value = []
	roiStorage.value = []
	resetEstimatedRoiArtifacts()
	selectedRoiId.value = ""
	showAllRoiOverlays.value = false
	selectedHeatmapIndices.value = { xIndices: [], yIndices: [] }
	latestSelectedRegionPoints.value = []
	latestMeasurementSingleSpectrum.value = null
	latestMeasurementMeanSpectrum.value = null
	latestMeasurementSelectedSpectrum.value = null
	latestRamanSingleSpectrum.value = null
	latestRamanMeanSpectrum.value = null
	latestRamanSelectedSpectrum.value = null
	ramanRoiSpectrum.value = null
	activeLayerIndex.value = 0
	activePcaClassificationComponentCount.value = 0
	activePcaMipComponentCount.value = 0
	activeRpcaClassificationComponentCount.value = 0
	activeRpcaMipComponentCount.value = 0
	activeEstimatedPcaClassificationComponentCount.value = 0
	activeEstimatedPcaMipComponentCount.value = 0
	activeEstimatedRpcaClassificationComponentCount.value = 0
	activeEstimatedRpcaMipComponentCount.value = 0
}

const restoreGpuInferenceState = async ( requestID ) => {

	if( project.value?.shared ){
		const sharedStatusCandidates = [
			project.value?.gpuInferenceStatus,
			project.value?.inferenceStatus,
			project.value?.status
		]

		var sharedStatus = ""
		for( const candidate of sharedStatusCandidates ){
			const normalizedCandidate = normalizedGpuInferenceStatus( candidate )
			if( normalizedCandidate.length === 0 ) continue
			sharedStatus = normalizedCandidate
			break
		}

		const sharedEstimateSpectraReady =
			project.value?.gpuInferenceEstimateSpectraReady === true ||
			project.value?.estimateSpectraReady === true ||
			sharedStatus === "SUCCEEDED"

		if( sharedStatus.length > 0 ){
			gpuInferenceStatus.value = sharedStatus
		}
		gpuInferenceEstimateSpectraReady.value = sharedEstimateSpectraReady
		return
	}

	if( typeof project.value?.id !== "string" || project.value.id.length === 0 ) return

	try{
		const projectInfo = await projectlib.getInfo( project.value )
		if( requestID !== activeProjectLoadRequestID.value ) return
		if( projectInfo === null || typeof projectInfo !== "object" || projectInfo instanceof Error ){
			return
		}

		const storedJobId = String( projectInfo.gpuInferenceJobId ?? "" ).trim()
		const storedStatus = String( projectInfo.gpuInferenceStatus ?? "" ).trim()
		const storedEstimateSpectraReady = projectInfo.gpuInferenceEstimateSpectraReady === true ||
			normalizedGpuInferenceStatus( storedStatus ) === "SUCCEEDED"

		if( storedJobId.length === 0 ) return

		gpuInferenceJobId.value = storedJobId
		gpuInferenceStatus.value = normalizedGpuInferenceStatus( storedStatus )
		gpuInferenceEstimateSpectraReady.value = storedEstimateSpectraReady

		const response = await hyperspectra.status( storedJobId )
		if( requestID !== activeProjectLoadRequestID.value ) return

		await updateGpuInferenceState( response, { announce: true })
	} catch( error ){
		if( requestID !== activeProjectLoadRequestID.value ) return
		console.log( error )
	}
}

const initializeProjectView = async () => {

	const nextProjectID = currentProjectID()
	if( nextProjectID.length === 0 ) return

	const requestID = activeProjectLoadRequestID.value + 1
	activeProjectLoadRequestID.value = requestID

	resetViewerState()

	try{
		projects.value = await projectlib.list()
		if( requestID !== activeProjectLoadRequestID.value ) return

		const nextProject = projects.value[ nextProjectID ]
		if( nextProject === undefined ){
			throw new Error( "Project not found: " + nextProjectID )
		}

		project.value = nextProject
		await restoreGpuInferenceState( requestID )
		if( requestID !== activeProjectLoadRequestID.value ) return

		await hyperspectrumCache.initProjectCache( project.value, cacheOptions )
		if( requestID !== activeProjectLoadRequestID.value ) return

		hyperspectrumCache.setActiveLayer( project.value, 0, cacheOptions )
		hyperspectrumCache.setActivePca( project.value, 5, cacheOptions )
		hyperspectrumCache.setActiveRpca( project.value, 5, cacheOptions )
		await loadRoiList()
		await loadRoiStorage()
		if( requestID !== activeProjectLoadRequestID.value ) return

		try{
			await loadXyz( "high" )
		} catch( xyzError ){
			console.log( xyzError )
		}

		if( requestID !== activeProjectLoadRequestID.value ) return

		const loadedMip = await hyperspectrumCache.getMip( project.value, cacheOptions )
		if( requestID !== activeProjectLoadRequestID.value ) return
		mip.value = loadedMip

		if( activePlot.value === "mip_hsv" ){
			await loadMipHsv( "high" )
		} else if( activePlot.value === "umap" ){
			await loadUmap( "high" )
		} else if( activePlot.value === "layer" ){
			const initialIndex = Math.floor( maxLayerIndex.value / 2 )
			layerInput.value = initialIndex
			await loadLayer( initialIndex )
			} else if( activePlot.value === "pca_mip" ){
				resetActivePcaComponents( pcaMipComponentCount.value )
				await loadPcaMip( pcaMipComponentCount.value )
				if( showPcaLoadings.value ){
					try{
						await loadPcaLoadings()
					} catch( loadingsError ){
						console.log( loadingsError )
					}
				}
			} else if( activePlot.value === "pca" ){
				resetActivePcaComponents( pcaClassificationComponentCount.value )
				await loadPcaClassificationMip()
				if( showPcaLoadings.value ){
					try{
						await loadPcaLoadings()
					} catch( loadingsError ){
						console.log( loadingsError )
					}
				}
			} else if( activePlot.value === "pca_rgb" ){
				await loadPcaClassification()
				if( showPcaLoadings.value ){
					try{
						await loadPcaLoadings()
					} catch( loadingsError ){
						console.log( loadingsError )
					}
				}
			} else if( activePlot.value === "rpca_mip" ){
				resetActivePcaComponents( pcaMipComponentCount.value )
				await loadRpcaMip( pcaMipComponentCount.value )
				if( showPcaLoadings.value ){
					try{
						await loadRpcaLoadings()
					} catch( loadingsError ){
						console.log( loadingsError )
					}
				}
			} else if( activePlot.value === "rpca" ){
				resetActivePcaComponents( pcaClassificationComponentCount.value )
				await loadRpcaClassificationMip()
				if( showPcaLoadings.value ){
					try{
						await loadRpcaLoadings()
					} catch( loadingsError ){
						console.log( loadingsError )
					}
				}
			} else if( activePlot.value === "rpca_rgb" ){
				await loadRpcaClassification()
				if( showPcaLoadings.value ){
					try{
						await loadRpcaLoadings()
					} catch( loadingsError ){
						console.log( loadingsError )
					}
				}
			}

		if( requestID !== activeProjectLoadRequestID.value ) return

		await nextTick()
		if( requestID !== activeProjectLoadRequestID.value ) return

		await renderCurrentMatrix( true )

		if( activePlot.value !== "layer" ){
			void ( async () => {
				try{
					const initialIndex = Math.floor( maxLayerIndex.value / 2 )
					layerInput.value = initialIndex
					await loadLayer( initialIndex )
				} catch( layerError ){
					console.log( layerError )
				}
			})()
		}

		if( activePlot.value !== "mip_hsv" ){
			void loadMipHsv( "low" ).catch(( mipHsvError ) => {
				console.log( mipHsvError )
			})
		}

		if( activePlot.value !== "umap" ){
			void loadUmap( "low" ).catch(( umapError ) => {
				console.log( umapError )
			})
		}

		void hyperspectrumCache.prefetchWindow( project.value, 0, 2, cacheOptions )

		void hyperspectrumCache.prefetchPcaScores( project.value, cacheOptions )
		void loadPcaClassification().catch(( classificationError ) => {
			console.log( classificationError )
		})
		void loadPcaClassificationMip().catch(( classificationMipError ) => {
			console.log( classificationMipError )
		})
		void loadPcaMip( pcaMipComponentCount.value ).catch(( pcaMipError ) => {
			console.log( pcaMipError )
		})
		void loadPcaLoadings().catch(( loadingsError ) => {
			console.log( loadingsError )
		})
		void loadRpcaClassification().catch(( classificationError ) => {
			console.log( classificationError )
		})
		void loadRpcaClassificationMip().catch(( classificationMipError ) => {
			console.log( classificationMipError )
		})
		void loadRpcaMip( pcaMipComponentCount.value ).catch(( rpcaMipError ) => {
			console.log( rpcaMipError )
		})
		void loadRpcaLoadings().catch(( loadingsError ) => {
			console.log( loadingsError )
		})

		if( resizeObserver === null && typeof ResizeObserver !== "undefined" && graph.value ){
			resizeObserver = new ResizeObserver(() => {
				void refreshOnResize()
			})
			resizeObserver.observe( graph.value )
		}

		emit("loaded")
	} catch( error ){
		if( requestID !== activeProjectLoadRequestID.value ) return
		console.log( error )
		navigation.route("Main menu", {})
	}
}

onMounted( async () => {

    try{

        var savedSettings = await settingslib.get()
		var savedBilling = await settingslib.getBilling()

        settings.value = savedSettings
		if( savedBilling && typeof savedBilling === "object" ){
			billingSettings.value = {
				groupID: typeof savedBilling.groupID === "string" ? savedBilling.groupID : ""
			}
		}
		await initializeProjectView()
    } catch( error ){
		console.log( error )
        navigation.route("Main menu", {})
    }
})

watch( pcaLegend, async ( legendEntries ) => {

	hyperspectrum.setPcaComponentColors( legendEntries )

	if( graph.value === null ) return
	if( activePlot.value !== "pca" &&
		activePlot.value !== "pca_mip" &&
		activePlot.value !== "pca_rgb" &&
		activePlot.value !== "rpca" &&
		activePlot.value !== "rpca_mip" &&
		activePlot.value !== "rpca_rgb" ) return
	if( currentMatrix() === null ) return

	try{
		await renderCurrentMatrix()
	} catch( error ){
		console.log( error )
	}
}, { immediate: true })

watch( () => route.params.id, async ( nextProjectID, previousProjectID ) => {

	if( typeof nextProjectID !== "string" || nextProjectID.length === 0 ) return
	if( nextProjectID === previousProjectID ) return

	await initializeProjectView()
})

watch( activePlot, async ( plotMode ) => {

	if( project.value.id === "" ) return

	try{
		if( plotMode === "mip" ){
			await renderCurrentMatrix()
			return
		}

		if( plotMode === "mip_hsv" ){
			if( heatmapUsesEstimatedRaman.value === false ){
				await loadMipHsv( "high" )
			}
			await renderCurrentMatrix()
			return
		}

		if( plotMode === "umap" ){
			if( heatmapUsesEstimatedRaman.value === false ){
				await loadUmap( "high" )
			}
			await renderCurrentMatrix()
			return
		}

		if( plotMode === "layer" ){
			await applyLayerInput()
			return
		}

			if( plotMode === "pca_mip" ){
				resetActivePcaComponents( pcaMipComponentCount.value )
				await loadPcaMip( pcaMipComponentCount.value )
				await renderCurrentMatrix()
				if( showPcaLoadings.value ){
					void loadPcaLoadings().catch(( loadingsError ) => {
						console.log( loadingsError )
					})
				}
				return
			}

			if( plotMode === "pca" ){
				resetActivePcaComponents( pcaClassificationComponentCount.value )
				await loadPcaClassificationMip()
				await renderCurrentMatrix()
				if( showPcaLoadings.value ){
					void loadPcaLoadings().catch(( loadingsError ) => {
						console.log( loadingsError )
					})
				}
				return
			}

			if( plotMode === "pca_rgb" ){
				await loadPcaClassification()
				await renderCurrentMatrix()
				if( showPcaLoadings.value ){
					void loadPcaLoadings().catch(( loadingsError ) => {
						console.log( loadingsError )
					})
				}
				return
			}

			if( plotMode === "rpca_mip" ){
				resetActivePcaComponents( pcaMipComponentCount.value )
				await loadRpcaMip( pcaMipComponentCount.value )
				if( showPcaLoadings.value ){
					await loadRpcaLoadings()
				}
				await renderCurrentMatrix()
				return
			}

			if( plotMode === "rpca" ){
				resetActivePcaComponents( pcaClassificationComponentCount.value )
				await loadRpcaClassificationMip()
				if( showPcaLoadings.value ){
					await loadRpcaLoadings()
				}
				await renderCurrentMatrix()
				return
			}

			if( plotMode === "rpca_rgb" ){
				await loadRpcaClassification()
				if( showPcaLoadings.value ){
					await loadRpcaLoadings()
				}
				await renderCurrentMatrix()
				return
			}
	} catch( error ){
		console.log( error )
	}
})

watch( heatmapInteractionMode, async () => {
	try{
		await applyHeatmapInteraction()
	} catch( error ){
		console.log( error )
	}
})

watch( selectedRoiId, async () => {

	await refreshRamanRoiSpectrum()

	if( graph.value === null ) return

	try{
		await renderCurrentMatrix()
	} catch( error ){
		console.log( error )
	}
})

watch( visualizationDataSource, async ( nextSource ) => {

	if( hasSuccessfulRamanInference.value === false ){
		if( nextSource !== "measurement" ){
			visualizationDataSource.value = "measurement"
		}
		return
	}

	try{
		await renderCurrentMatrix()
	} catch( error ){
		console.log( error )
	}
})

watch( spectrumDataSource, async ( nextSource ) => {

	if( hasEstimatedRamanSpectraReady.value === false ){
		if( nextSource !== "measurement" ){
			spectrumDataSource.value = "measurement"
		}
		return
	}

	if( nextSource !== "both" ){
		spectrumDataSource.value = "both"
		return
	}

	await refreshRamanRoiSpectrum()

	if( graph.value === null ) return

	try{
		await renderCurrentMatrix()
	} catch( error ){
		console.log( error )
	}
})

watch( primarySpectrumSource, async ( nextSource ) => {

	if( hasEstimatedRamanSpectraReady.value === false ){
		if( nextSource !== "measurement" ){
			primarySpectrumSource.value = "measurement"
		}
		return
	}

	if( spectrumSelectionMode.value !== "both" ) return

	await refreshRamanRoiSpectrum()

	if( graph.value === null ) return

	try{
		await renderCurrentMatrix()
	} catch( error ){
		console.log( error )
	}
})

watch( selectedConfidenceLevel, async ( nextLevel ) => {

	const normalizedLevel = normalizeConfidenceLevel( nextLevel )
	if( normalizedLevel !== nextLevel ){
		selectedConfidenceLevel.value = normalizedLevel
		return
	}

	if( graph.value === null ) return

	try{
		await renderCurrentMatrix()
	} catch( error ){
		console.log( error )
	}
})

watch( roiEstimateUncertaintyMode, async ( nextMode ) => {

	if( nextMode !== "show" && nextMode !== "hide" ){
		roiEstimateUncertaintyMode.value = "show"
		return
	}

	if( graph.value === null ) return
	if( selectedRoi.value === null ) return

	try{
		await renderCurrentMatrix()
	} catch( error ){
		console.log( error )
	}
})

watch( hasEstimatedRamanSpectraReady, async ( isReady ) => {

	if( isReady === false ){
		spectrumDataSource.value = "measurement"
		primarySpectrumSource.value = "measurement"
		ramanRoiSpectrum.value = null
		latestRamanSingleSpectrum.value = null
		latestRamanMeanSpectrum.value = null
		latestRamanSelectedSpectrum.value = null

		if( graph.value !== null ){
			try{
				await renderCurrentMatrix()
			} catch( error ){
				console.log( error )
			}
		}
		return
	}

	if( spectrumDataSource.value !== "both" ){
		spectrumDataSource.value = "both"
	}

	await refreshRamanRoiSpectrum()

	if( graph.value !== null ){
		try{
			await renderCurrentMatrix()
		} catch( error ){
			console.log( error )
		}
	}
})

watch( hasSuccessfulRamanInference, async ( isReady ) => {

	if( isReady ){
		const nextVisualizationSource = resolvedDefaultVisualizationDataSource()
		if( visualizationDataSource.value !== nextVisualizationSource ){
			visualizationDataSource.value = nextVisualizationSource
			return
		}
		return
	}

	if( visualizationDataSource.value !== "measurement" ){
		visualizationDataSource.value = "measurement"
		return
	}

	if( graph.value !== null ){
		try{
			await renderCurrentMatrix()
		} catch( error ){
			console.log( error )
		}
	}
})

watch( [ gpuInferenceJobId, gpuInferenceStatus, () => project.value?.id, () => project.value?.shared ], () => {
	syncGpuInferenceStatusPolling()
}, { immediate: true })

onBeforeUnmount( () => {

	stopGpuInferenceStatusPolling()
	gpuStatusPollInFlight = false

	if( resizeObserver !== null ){
		resizeObserver.disconnect()
		resizeObserver = null
	}

	refreshOnResize.cancel()
	debouncedApplyLayerInput.cancel()
	debouncedApplyPcaRgbInput.cancel()
})

</script>
