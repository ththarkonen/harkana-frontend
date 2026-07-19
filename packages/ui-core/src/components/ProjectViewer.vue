<template>
<!-- Outer frame -->
<div class="bg-brand min-h-screen p-[2px] overflow-hidden"
	 data-tutorial = "spectrum-viewer-layout">

	<!-- Mobile overlay -->
	<div v-if = "sidebarOpen" @click = "sidebarOpen = false" class = "fixed inset-0 bg-black/40 z-30 md:hidden"></div>
	<!-- App Grid -->
	<div class="grid h-[calc(100vh-4px)] gap-[2px] grid-cols-1 grid-rows-[auto_1fr] md:grid-cols-[16rem_1fr] md:grid-rows-[auto_1fr]">

		<Sidebar :style = "sidebarStyle">
			<Logo></Logo>

			<div v-if = "sidebarEstimateStatusText.length > 0"
				 class = "mt-2 flex items-center gap-2 rounded-lg border border-brand/60 bg-gray-800 px-3 py-2 text-sm text-white"
				 aria-live = "polite">
				<Spinner class = "h-4 w-4 shrink-0 text-brand"></Spinner>
				<span>{{ sidebarEstimateStatusText }}</span>
			</div>

			<div v-if = "sidebarEstimateErrorText.length > 0"
				 class = "mt-2 rounded-lg border border-red-500/70 bg-red-500/10 px-3 py-2 text-sm text-red-100"
				 aria-live = "polite">
				{{ sidebarEstimateErrorText }}
			</div>

			<div class = "mt-2 rounded-lg border-2 border-gray bg-gray-800 p-2 shadow-md shadow-black"
				 data-tutorial = "spectrum-display-section">
				<div class = "flex items-center justify-between gap-1">
					<div class = "flex min-w-0 items-center gap-1">
						<span class = "inline-flex h-5 w-5 items-center justify-center text-white" aria-hidden = "true">
							<i class = "fas fa-layer-group text-sm"></i>
						</span>
						<h3 class = "whitespace-nowrap font-semibold text-white">Display</h3>
					</div>

					<BaseDropdown ref = "displayOptionsDropdown"
								  :open = "tutorialDisplayOptionsOpenBinding"
								  @update:open = "handleTutorialDisplayOptionsOpenUpdate"
								  :show-chevron = "false"
								  :close-on-select = "true"
								  :teleport-to-body = "true"
								  trigger-class = "inline-flex h-8 w-8 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand"
								  :menu-class = "displayOptionsMenuClass"
								  data-tutorial = "spectrum-display-options">
						<template v-slot:trigger>
							<span class = "sr-only">Display options</span>
							<i class = "fas fa-ellipsis-v" aria-hidden = "true" title = "Display options"></i>
						</template>

						<li class = "px-4 pt-2 pb-1 text-xs uppercase tracking-wide text-white/70">
							Layout
						</li>
						<li v-for = "option in SPECTRUM_LAYOUT_SELECT_OPTIONS"
							:key = "'spectrum-layout-' + option.value">
							<button type = "button"
									@click = "updateSpectrumLayoutMode( option.value )"
									class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
								<span>{{ option.label }}</span>
								<i :class = "spectrumLayoutMode === option.value ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
								   aria-hidden = "true"></i>
							</button>
						</li>

						<li><hr class = "h-0.5 bg-gray border-0"></li>
						<li class = "px-4 pt-2 pb-1 text-xs uppercase tracking-wide text-white/70">
							Project trace visibility
						</li>
						<li v-for = "entry in projectTraceVisibilityOptions"
							:key = "'project-trace-visibility-' + entry.key">
							<button type = "button"
									@click = "toggleProjectTraceVisibility( entry.key )"
									:disabled = "entry.requiresEstimate && hasEstimate === false"
									class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent">
								<span>{{ entry.label }}</span>
								<i :class = "isProjectTraceVisible( entry.key ) ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
								   aria-hidden = "true"></i>
							</button>
						</li>
						<li class = "px-4 pt-2 pb-1 text-xs uppercase tracking-wide text-white/70">
							Project uncertainty level
						</li>
						<li>
							<button type = "button"
									@click = "setProjectUncertaintyLevel( UNCERTAINTY_ALL )"
									:disabled = "hasEstimate === false"
									class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent">
								<span>All uncertainties</span>
								<i :class = "projectUncertaintyLevel === UNCERTAINTY_ALL ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
								   aria-hidden = "true"></i>
							</button>
						</li>
						<li>
							<button type = "button"
									@click = "setProjectUncertaintyLevel( COMPARISON_UNCERTAINTY_NONE )"
									:disabled = "hasEstimate === false"
									class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent">
								<span>No uncertainty</span>
								<i :class = "projectUncertaintyLevel === COMPARISON_UNCERTAINTY_NONE ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
								   aria-hidden = "true"></i>
							</button>
						</li>
						<li v-for = "level in comparisonUncertaintyLevelOptions"
							:key = "'project-uncertainty-' + level">
							<button type = "button"
									@click = "setProjectUncertaintyLevel( level )"
									:disabled = "hasEstimate === false"
									class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent">
								<span>{{ level }}%</span>
								<i :class = "projectUncertaintyLevel === level ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
								   aria-hidden = "true"></i>
							</button>
						</li>

						<li><hr class = "h-0.5 bg-gray border-0"></li>
						<li class = "px-4 pt-2 pb-1 text-xs uppercase tracking-wide text-white/70">
							Legend hover emphasis
						</li>
						<li>
							<button type = "button"
									@click = "setLegendHoverEmphasisEnabled( true )"
									class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
								<span>Enabled</span>
								<i :class = "legendHoverEmphasisEnabled ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
								   aria-hidden = "true"></i>
							</button>
						</li>
						<li>
							<button type = "button"
									@click = "setLegendHoverEmphasisEnabled( false )"
									class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
								<span>Disabled</span>
								<i :class = "legendHoverEmphasisEnabled === false ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
								   aria-hidden = "true"></i>
							</button>
						</li>
					</BaseDropdown>
				</div>
			</div>

			<div class = "mt-4 rounded-lg border-2 border-gray bg-gray-800 p-2 shadow-md shadow-black"
				 data-tutorial = "spectrum-comparison-section">
				<div class = "flex items-center justify-between gap-1 mb-2">
					<div class = "flex min-w-0 items-center gap-1">
						<span class = "inline-flex h-5 w-5 items-center justify-center text-white" aria-hidden = "true">
							<i class = "fas fa-clone text-sm"></i>
						</span>
						<h3 class = "whitespace-nowrap font-semibold text-white">Comparison</h3>
					</div>

					<div class = "flex items-center gap-2">
						<BaseDropdown :show-chevron = "false"
									  :close-on-select = "true"
									  :teleport-to-body = "true"
									  trigger-class = "inline-flex h-8 w-8 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand"
									  menu-class = "fixed z-[45] min-w-[16rem] w-max max-w-[50vw] origin-top-left rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30">
							<template v-slot:trigger>
								<span class = "sr-only">Comparison options</span>
								<i class = "fas fa-ellipsis-v" aria-hidden = "true" title = "Comparison options"></i>
							</template>

							<li class = "px-4 pt-2 pb-1 text-xs uppercase tracking-wide text-white/70">
								Comparison trace visibility
							</li>
							<li v-for = "entry in comparisonTraceVisibilityOptions"
								:key = "'comparison-trace-visibility-' + entry.role">
								<button type = "button"
										@click = "toggleComparisonTraceVisibility( entry.role )"
										class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
									<span>{{ entry.label }}</span>
									<i :class = "isComparisonTraceVisible( entry.role ) ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
									   aria-hidden = "true"></i>
								</button>
							</li>

							<li><hr class = "h-0.5 bg-gray border-0"></li>
							<li class = "px-4 pt-2 pb-1 text-xs uppercase tracking-wide text-white/70">
								Comparison uncertainty level
							</li>
							<li>
								<button type = "button"
										@click = "setComparisonUncertaintyLevel( UNCERTAINTY_ALL )"
										class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
									<span>All uncertainties</span>
									<i :class = "comparisonUncertaintyLevel === UNCERTAINTY_ALL ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
									   aria-hidden = "true"></i>
								</button>
							</li>
							<li>
								<button type = "button"
										@click = "setComparisonUncertaintyLevel( COMPARISON_UNCERTAINTY_NONE )"
										class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
									<span>No uncertainty</span>
									<i :class = "comparisonUncertaintyLevel === COMPARISON_UNCERTAINTY_NONE ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
									   aria-hidden = "true"></i>
								</button>
							</li>
							<li v-for = "level in comparisonUncertaintyLevelOptions"
								:key = "'comparison-uncertainty-' + level">
								<button type = "button"
										@click = "setComparisonUncertaintyLevel( level )"
										class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
									<span>{{ level }}%</span>
									<i :class = "comparisonUncertaintyLevel === level ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
									   aria-hidden = "true"></i>
								</button>
							</li>
						</BaseDropdown>
					</div>
				</div>

				<div>
					<BaseDropdown root-class = "relative block w-full text-left"
								  :show-chevron = "false"
								  :close-on-select = "false"
								  :teleport-to-body = "true"
								  portal-placement = "bottom-start"
								  trigger-class = "group w-full rounded-xl text-white transition focus:outline-none"
								  menu-class = "fixed z-[45] min-w-[18rem] w-max max-w-[50vw] origin-top-left rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30">
						<template v-slot:trigger>
							<div class = "flex items-center gap-2.5 rounded-xl border border-white/10 bg-gray-700/90 px-2.5 py-1.5 transition group-focus:border-white/10 group-focus:bg-gray-700 group-focus:ring-2 group-focus:ring-brand"
								 :class = "canCompare ? '' : 'opacity-60'">
								<div class = "min-w-0 flex-1 text-left">
									<div class = "truncate text-sm font-semibold text-white"
										 :title = "comparisonDropdownSummaryLabel">
										{{ comparisonDropdownSummaryLabel }}
									</div>
								</div>

								<div class = "inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/75 transition group-focus:bg-white/10">
									<i class = "fas fa-chevron-down text-xs" aria-hidden = "true"></i>
								</div>
							</div>
						</template>

						<li class = "px-3 pt-3 pb-2">
							<div class = "relative">
								<span class = "pointer-events-none absolute inset-y-0 left-3 flex items-center text-white/40">
									<i class = "fas fa-search text-xs"></i>
								</span>
								<input v-model = "comparisonSearchPattern"
									   type = "text"
									   placeholder = "Search projects"
									   style = "-webkit-text-fill-color: #ffffff; caret-color: #ffffff;"
									   class = "w-full rounded-lg border border-white/10 bg-gray-700 pl-9 pr-9 py-2 text-sm text-white placeholder-white/40 [color-scheme:dark] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/60"/>
								<button v-if = "comparisonSearchPattern.length > 0"
										type = "button"
										@click = "comparisonSearchPattern = ''"
										class = "absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white">
									<i class = "fas fa-times text-xs" aria-hidden = "true"></i>
								</button>
							</div>
						</li>
						<li><hr class = "h-0.5 bg-gray border-0"></li>
						<li>
							<button type = "button"
									@click = "clearSelectedComparisonProjectIDs"
									:disabled = "comparisonProjectIDs.length === 0"
									class = "flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent">
								<i class = "fas fa-eye-slash text-white/70" aria-hidden = "true"></i>
								<span>Clear comparison projects</span>
							</button>
						</li>
						<li><hr class = "h-0.5 bg-gray border-0"></li>
						<li class = "list-none px-0 py-0">
							<ul class = "max-h-[min(20rem,calc(100vh-18rem))] overflow-y-auto py-0">
								<li v-for = "option in comparisonSelectOptions"
									:key = "'comparison-project-' + option.value">
									<button type = "button"
											@click = "toggleComparisonProjectID( option.value )"
											:disabled = "canCompare === false"
											class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent">
										<div class = "min-w-0 flex-1">
											<div class = "truncate">{{ option.label }}</div>
											<div class = "truncate text-xs text-white/55">{{ option.ownerLabel }}</div>
										</div>
										<span class = "inline-flex min-w-[1.5rem] items-center justify-end gap-2">
											<span v-if = "isSelectedComparisonProjectID( option.value )"
												  class = "h-2.5 w-2.5 rounded-sm"
												  :style = "{ backgroundColor: option.color }"></span>
											<span class = "inline-flex h-4 min-w-[1rem] items-center justify-center text-sm font-semibold leading-none text-brand"
												  :class = "isSelectedComparisonProjectID( option.value ) ? 'opacity-100' : 'opacity-0'"
												  aria-hidden = "true">
												&#10003;
											</span>
										</span>
									</button>
								</li>
							</ul>
						</li>
					</BaseDropdown>

					<p v-if = "canCompare === false"
					   class = "mt-2 text-xs leading-snug text-white/70">
						{{ comparisonTooltip }}
					</p>

					<div v-else-if = "selectedComparisonProjectSummaries.length > 0"
						 class = "mt-2 flex flex-wrap items-center gap-1.5">
						<span v-for = "entry in selectedComparisonProjectSummaries"
							  :key = "'selected-comparison-summary-' + entry.projectID"
							  class = "inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/80">
							<span class = "h-2.5 w-2.5 rounded-sm"
								  :style = "{ backgroundColor: entry.color }"></span>
							<span class = "truncate max-w-[10rem]">{{ entry.projectName }}</span>
						</span>
					</div>
				</div>

			</div>

			<div v-if = "!project.shared && calibrating"
				 ref = "calibrationSidebarSection"
				 class = "mt-4 rounded-lg border-2 border-gray bg-gray-800 p-2 shadow-md shadow-black"
				 data-tutorial = "spectrum-calibration-sidebar-block">
				<div class = "flex items-center justify-between gap-1">
					<div class = "flex min-w-0 items-center gap-1">
						<span class = "inline-flex h-5 w-5 items-center justify-center text-white" aria-hidden = "true">
							<i class = "fas fa-ruler text-sm"></i>
						</span>
						<h3 class = "whitespace-nowrap font-semibold text-white">Calibration</h3>
					</div>

					<button type = "button"
							@click = "cancelCalibration"
							class = "inline-flex h-8 w-8 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand"
							title = "Cancel calibration"
							aria-label = "Cancel calibration">
						<i class = "fas fa-times" aria-hidden = "true"></i>
					</button>
				</div>

				<div class = "mt-2">
					<CalibrationControls :saving = "calibrationAssignmentSaving"
										 :profile-options = "calibrationProfileOptions"
										 :selected-profile-id = "calibrationSelectedProfileID"
										 :profiles-loading = "calibrationProfilesLoading"
										 :can-save-selection = "canAssignCalibrationProfile"
										 @show-panel = "calibrationPanelOpen = true"
										 @update:selected-profile-id = "handleCalibrationProfileSelection"
										 @save = "assignCalibrationProfileToProject">
					</CalibrationControls>
				</div>
			</div>

		</Sidebar>

		<NavigationBar>
			<template v-slot:left-items>
				<button @click = "sidebarOpen = true" class = "md:hidden mr-4 px-3 py-2 rounded bg-slate-100">☰</button>
				<div data-tutorial = "spectrum-project-menu">
				<BaseDropdown ref = "projectMenuDropdown"
							  :open = "tutorialProjectMenuOpenBinding"
							  @update:open = "handleTutorialProjectMenuOpenUpdate"
							  :teleport-to-body = "true"
							  portal-placement = "bottom-start"
							  :portal-offset-x = "0"
							  :portal-offset-y = "8"
							  :menu-class = "projectMenuClass">
					<template v-slot:trigger>
						<span class = "font-medium">Project</span>
					</template>

					<BaseDropdownItem @select = "focusProjectNameEdit"
									  :disabled = "project.shared"
									  :tooltip = "ownedProjectActionTooltip('Renaming')">
						Rename
					</BaseDropdownItem>

					<BaseDropdownItem @select = "toggleCalibration"
									  :disabled = "project.shared"
									  :tooltip = "ownedProjectActionTooltip('Calibration')">
						Calibrate
					</BaseDropdownItem>

					<hr class = "h-0.5 bg-gray border-0 my-1">

					<BaseDropdownItem @select = "openProjectChat">
						Notes
					</BaseDropdownItem>

					<BaseDropdownItem @select = "openMetadataModal">
						Metadata
					</BaseDropdownItem>

					<BaseDropdownItem @select = "download">
						Download
					</BaseDropdownItem>

					<BaseDropdownItem @select = "openShareModal"
									  :disabled = "project.shared"
									  :tooltip = "ownedProjectActionTooltip('Sharing')">
						Share
					</BaseDropdownItem>

					<BaseDropdownItem @select = "openZenodoModal"
									  :disabled = "project.shared"
									  :tooltip = "ownedProjectActionTooltip('Zenodo exporting')">
						Zenodo export
					</BaseDropdownItem>

					<hr class = "h-0.5 bg-gray border-0 my-1">

					<BaseDropdownItem @select = "openVisualizationSettings">
						Visualization settings
					</BaseDropdownItem>

					<BaseDropdownItem @select = "openProjectMenu">
						Main menu
					</BaseDropdownItem>

					<hr class = "h-0.5 bg-gray border-0 my-1">

					<BaseDropdownItem @select = "restartTutorial">
						Tutorial
					</BaseDropdownItem>
				</BaseDropdown>
				</div>
				<ProjectNameInput ref = "projectNameInput" :project = "project"></ProjectNameInput>
			</template>
			<template v-slot:right-items>
				<AccountDropdown></AccountDropdown>
			</template>
		</NavigationBar>


		<!-- Main Content -->
			<main class="relative z-0 bg-dark-gray rounded-lg overflow-hidden shadow-sm p-0">
				<div class = "flex h-full min-h-0 flex-col gap-2 p-2"
					 data-tutorial = "spectrum-panes">
					<div v-if = "splitSpectrumLegendEntries.length > 0"
						 class = "shrink-0 overflow-hidden rounded-lg bg-white">
						<div class = "flex flex-wrap items-center gap-1.5 border-b border-gray/20 px-2 py-1.5">
							<span class = "text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45">
								Legend
							</span>
							<button v-for = "entry in splitSpectrumLegendEntries"
									:key = "entry.key"
									type = "button"
									:title = "isSplitSpectrumLegendHidden( entry.key ) ? 'Show' : 'Hide'"
									@click = "toggleSplitSpectrumLegendVisibility( entry.key )"
									@mouseenter = "hoveredSplitSpectrumLegendKey = entry.key"
									@mouseleave = "hoveredSplitSpectrumLegendKey = ''"
									@focus = "hoveredSplitSpectrumLegendKey = entry.key"
									@blur = "hoveredSplitSpectrumLegendKey = ''"
									:class = "[
										isSplitSpectrumLegendHidden( entry.key ) ? 'border-gray/25 bg-white text-black/35 opacity-55' : '',
										hoveredSplitSpectrumLegendKey === entry.key ? 'border-black/25 bg-black/5 text-black shadow-sm' : 'border-gray/30 bg-white text-black/70'
									]"
									class = "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] transition-colors focus:outline-none">
								<span class = "h-2.5 w-2.5 rounded-sm"
									  :style = "{ backgroundColor: entry.color }"></span>
								<span v-html = "entry.html"></span>
							</button>
						</div>
					</div>

					<template v-if = "usesSplitSpectrumLayout">
						<div ref = "spectraPaneContainer"
							 class = "grid min-h-0 w-full flex-1"
							 :style = "spectraPaneGridStyle">
							<div class = "relative min-h-0 min-w-0 overflow-hidden rounded-lg bg-white">
								<div class = "flex h-full min-h-0 flex-col">
									<div class = "shrink-0 border-b border-gray/20 px-3 py-2">
										<span class = "text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
											Measurement
										</span>
									</div>
									<div class = "relative min-h-0 flex-1">
										<div ref = "topGraph" class = "h-full w-full bg-white"></div>
									</div>
								</div>
							</div>

							<div v-if = "splitPaneIsVertical"
								 class = "relative h-5 shrink-0 cursor-row-resize select-none touch-none"
								 title = "Resize spectra panes"
								 @pointerdown = "startSpectraPaneResize">
								<div class = "absolute inset-x-2 top-1/2 h-px -translate-y-1/2 rounded-full bg-gray/90"></div>
								<div class = "absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-row items-center"
									 aria-hidden = "true">
									<span class = "flex flex-row items-center gap-[2px] rounded-md border border-gray/70 bg-dark-gray/90 px-1 py-1 shadow-sm">
										<span class = "h-1 w-1 rotate-45 bg-white/60"></span>
										<span class = "h-1 w-1 rotate-45 bg-white/60"></span>
										<span class = "h-1 w-1 rotate-45 bg-white/60"></span>
									</span>
								</div>
							</div>
							<div v-else
								 class = "relative w-5 shrink-0 cursor-col-resize touch-none"
								 title = "Resize spectra panes"
								 @pointerdown = "startSpectraPaneResize">
								<div class = "absolute inset-y-2 left-1/2 w-px -translate-x-1/2 rounded-full bg-gray/90"></div>
								<div class = "absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
									 aria-hidden = "true">
									<span class = "flex flex-col items-center gap-[2px] rounded-md border border-gray/70 bg-dark-gray/90 px-1 py-1 shadow-sm">
										<span class = "h-1 w-1 rotate-45 bg-white/60"></span>
										<span class = "h-1 w-1 rotate-45 bg-white/60"></span>
										<span class = "h-1 w-1 rotate-45 bg-white/60"></span>
									</span>
								</div>
							</div>

							<div class = "relative min-h-0 min-w-0 overflow-hidden rounded-lg bg-white">
								<div class = "flex h-full min-h-0 flex-col">
									<div class = "shrink-0 border-b border-gray/20 px-3 py-2">
										<span class = "text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
											{{ estimatePaneTitle }}
										</span>
									</div>
									<div v-if = "hasEstimate" class = "relative min-h-0 flex-1">
										<div ref = "bottomGraph" class = "h-full w-full bg-white"></div>
									</div>
									<div v-else class = "flex min-h-0 flex-1 items-center justify-center px-8 text-center">
										<div class = "max-w-lg space-y-3">
											<p class = "text-base font-semibold text-black/80">
												Estimate pending
											</p>
											<p class = "text-sm leading-relaxed text-black/55">
												{{ estimatePanePlaceholderText }}
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</template>
					<template v-else>
						<div class = "min-h-0 flex-1">
							<div class = "relative h-full min-h-0 overflow-hidden rounded-lg bg-white">
							<div ref = "singleGraph" class = "h-full w-full bg-white"></div>
							<div v-if = "hasEstimate === false"
								 class = "pointer-events-none absolute bottom-4 right-4 max-w-sm rounded-lg border border-brand/30 bg-white/92 px-4 py-3 text-sm shadow-sm">
								<p class = "font-semibold text-black/80">
									Estimate pending
								</p>
								<p class = "mt-1 leading-relaxed text-black/55">
									{{ estimatePanePlaceholderText }}
								</p>
							</div>
						</div>
						</div>
					</template>
				</div>
			</main>

	</div>

	<MetadataModal v-if = "mountedViewerOverlays.metadata" ref = "metadataModal" :project = "project"></MetadataModal>
	<ShareModal v-if = "mountedViewerOverlays.share" ref = "shareModal" :project = "project"></ShareModal>
	<ZenodoModal v-if = "mountedViewerOverlays.zenodo" ref = "zenodoModal" :project = "project"></ZenodoModal>
	<CalibrationPanel v-if = "calibrationPanelOpen || mountedViewerOverlays.calibrationPanel"
					  v-model = "calibrationPanelOpen"
					  data-tutorial = "spectrum-calibration-panel"
					  :project = "project"
					  :anchor-element = "calibrationSidebarSection"
					  :points = "calibration.points"
					  :polynomial-order = "calibration.polynomialOrder"
					  :included-orders = "calibration.includedOrders"
					  :max-polynomial-order = "calibrationMaxOrder"
					  :focused-point-id = "focusedCalibrationPointID"
					  :can-apply = "calibrationHasSavablePoints"
					  :can-save-profile = "canSaveCalibrationProfile"
					  :saving-profile = "calibrationProfileSaving"
					  :save-disabled-reason = "calibrationProfileSaveDisabledReason"
					  @update:point-target = "updateCalibrationPointTarget"
					  @update:polynomial-order = "updateCalibrationPolynomialOrder"
					  @toggle-order = "toggleCalibrationIncludedOrder"
					  @apply-calibration = "applyCalibrationPreview"
					  @save-profile = "openCalibrationProfileSaveModal"
					  @remove-point = "removeCalibrationPoint"
					  @focus-point = "setFocusedCalibrationPointID"></CalibrationPanel>
	<CalibrationProfileSaveModal v-if = "mountedViewerOverlays.calibrationProfileSave"
								 ref = "calibrationProfileSaveModal"
								 :saving = "calibrationProfileSaving"
								 :reserved-names = "calibrationReservedProfileNames"
								 :base-disabled-reason = "calibrationProfileSaveDisabledReason"
								 @save = "saveCalibrationProfile"></CalibrationProfileSaveModal>
	<ProjectChatWindow v-if = "projectChatOpen || mountedViewerOverlays.projectChat"
					   v-model = "projectChatOpen"
					   :project = "project"></ProjectChatWindow>
	<ViewerTutorialPrompt v-if = "tutorialPromptVisible || mountedViewerOverlays.tutorialPrompt"
						  :visible = "tutorialPromptVisible"
						  title = "Welcome to the spectrum viewer"
						  body = "This tutorial walks through the spectrum project workflow, including display layouts, comparisons, calibration profiles, project actions, and downloads."
						  @start = "startTutorial"
						  @skip = "skipTutorialPrompt"></ViewerTutorialPrompt>
	<ViewerTutorialOverlay v-if = "tutorialVisible || mountedViewerOverlays.tutorialOverlay"
						   :visible = "tutorialVisible"
						   :step-id = "activeTutorialStep?.id ?? ''"
						   :title = "activeTutorialStep?.title ?? ''"
						   :body = "activeTutorialStep?.body ?? ''"
						   :step-number = "tutorialStepIndex + 1"
						   :step-count = "tutorialStepCount"
						   :can-go-back = "tutorialStepIndex > 0"
						   :is-final = "isFinalTutorialStep"
						   :preferred-placement = "activeTutorialStep?.placement ?? 'center'"
						   :target-element = "activeTutorialTargetElement"
						   :spotlight-enabled = "activeTutorialStep?.kind !== 'centered'"
						   @next = "advanceTutorial"
						   @back = "rewindTutorial"
						   @skip = "skipActiveTutorial"></ViewerTutorialOverlay>
</div>
</template>

<script setup>

import { ref, toRaw, watch, computed, nextTick, onMounted, onBeforeUnmount, defineAsyncComponent} from 'vue'
import { useRoute } from 'vue-router'
import { debounce } from 'lodash'
import katex from "katex"
const route = useRoute()
const dataType = String( import.meta.env.VITE_DATA_TYPE ?? "" ).trim().toLowerCase()
const CALIBRATION_AXIS_ROLE = "spectrum-x"

const emit = defineEmits(["loaded"])

import { projects as projectlib, settings as settingslib, data as datalib} from "@harkana/tools"
import { navigation, results, utils} from "@harkana/tools"
import {
	plot,
	splitSpectrumLegendGroups,
	buildComparisonProjectLegendGroup,
	calibrationHasValidPoints,
	calibrationMaxPolynomialOrder,
	cloneCalibrationModel,
	normalizeCalibrationModel
} from "@harkana/plot"

import Sidebar from './sidebar/Sidebar.vue'
import Logo from "./sidebar/Logo.vue"
import CalibrationControls from './sidebar/CalibrationControls.vue'
import Spinner from './general/Spinner.vue'

import NavigationBar from './navbar/NavigationBar.vue'
import AccountDropdown from './navbar/AccountDropdown.vue'
import BaseDropdown from './navbar/BaseDropdown.vue'
import BaseDropdownItem from './navbar/BaseDropdownItem.vue'
import ProjectNameInput from './navbar/ProjectNameInput.vue'

import { useSpectrumProjectTutorial } from '../composables/spectrum/useSpectrumProjectTutorial.js'
import { markViewerLoad, measureViewerLoad } from '../utils/viewerPerformance.js'

const MetadataModal = defineAsyncComponent(() => import('./modals/MetadataModal.vue'))
const ShareModal = defineAsyncComponent(() => import('./modals/ShareModal.vue'))
const ZenodoModal = defineAsyncComponent(() => import('./modals/ZenodoModal.vue'))
const CalibrationPanel = defineAsyncComponent(() => import('./modals/CalibrationPanel.vue'))
const CalibrationProfileSaveModal = defineAsyncComponent(() => import('./modals/CalibrationProfileSaveModal.vue'))
const ProjectChatWindow = defineAsyncComponent(() => import('./chat/ProjectChatWindow.vue'))
const ViewerTutorialPrompt = defineAsyncComponent(() => import('./tutorial/ViewerTutorialPrompt.vue'))
const ViewerTutorialOverlay = defineAsyncComponent(() => import('./tutorial/ViewerTutorialOverlay.vue'))

const metadataModal = ref(null)
const shareModal = ref(null)
const zenodoModal = ref(null)
const projectNameInput = ref(null)
const calibrationProfileSaveModal = ref(null)
const displayOptionsDropdown = ref(null)
const projectMenuDropdown = ref(null)
const mountedViewerOverlays = ref({
	metadata: false,
	share: false,
	zenodo: false,
	calibrationPanel: false,
	calibrationProfileSave: false,
	projectChat: false,
	tutorialPrompt: false,
	tutorialOverlay: false
})

const waitForViewerOverlayFrame = () => {
	return new Promise(( resolve ) => {
		window.setTimeout( resolve, 16 )
	})
}

const viewerOverlayRef = ( key ) => {
	if( key === "metadata" ) return metadataModal
	if( key === "share" ) return shareModal
	if( key === "zenodo" ) return zenodoModal
	if( key === "calibrationProfileSave" ) return calibrationProfileSaveModal
	return null
}

const ensureViewerOverlayMounted = async ( key ) => {
	if( typeof key !== "string" || key.length === 0 ) return
	if( mountedViewerOverlays.value[key] !== true ){
		mountedViewerOverlays.value = {
			...mountedViewerOverlays.value,
			[key]: true
		}
	}

	const targetRef = viewerOverlayRef( key )
	if( targetRef === null ){
		await nextTick()
		return
	}

	for( let attempt = 0; attempt < 20; attempt++ ){
		await nextTick()
		if( targetRef.value !== null && targetRef.value !== undefined ){
			return
		}
		await waitForViewerOverlayFrame()
	}
}

const projectID = route.params.id
const activeSpectrumProjectLoadRequestID = ref(0)
const comparisonProjectIDs = ref([])
const comparisonSearchPattern = ref("")

const project = ref({id: ""})
const projects = ref({})
const settings = ref({})

const data = ref(null)
const estimate = ref(null)
const estimateJobStatus = ref(null)
const estimateJobError = ref("")
const comparisonEntries = ref([])

const downloading = ref(false)
const calibrating = ref(false)
const calibrationProfileSaving = ref(false)
const calibrationAssignmentSaving = ref(false)
const calibrationPanelOpen = ref(false)
const calibrationProfilesLoading = ref(false)
const calibrationProfilesSupported = ref(true)
const calibrationProfiles = ref([])
const calibrationProfileName = ref("")
const calibrationProfileDescription = ref("")
const calibrationSelectedProfileID = ref("")
const calibrationAssignedProfileID = ref("")
const savedCalibrationProfileName = ref("")
const savedCalibrationProfileDescription = ref("")
const activeCalibrationPreview = ref(null)
const focusedCalibrationPointID = ref("")
const calibrationSidebarSection = ref(null)
const savedCalibrationSnapshot = ref(normalizeCalibrationModel({ x: 0, polynomialOrder: 0, includedOrders: [ 0 ], points: [] }))
const calibrationPulsePhase = ref(0)
const calibration = ref({
	x: 0,
	polynomialOrder: 0,
	includedOrders: [ 0 ],
	points: []
})

const topGraph = ref(null)
const bottomGraph = ref(null)
const singleGraph = ref(null)
const spectraPaneContainer = ref(null)
const projectChatOpen = ref(false)
const hoveredSplitSpectrumLegendKey = ref("")
let estimatePollTimeout = null
let comparisonLoadToken = 0
let spectraPaneResizeSession = null
let spectraPaneResizeFrame = null
let spectraPaneContainerResizeObserver = null
let calibrationPlotClickHandler = null
let calibrationPlotHoverHandler = null
let calibrationPlotUnhoverHandler = null
let calibrationGraphClickFallbackHandler = null
let calibrationPulseInterval = null
let lastCalibrationClickSignature = null

const MIN_SPECTRUM_PANEL_SIZE = 120
const SPECTRA_PANE_DIVIDER_SIZE_PX = 20
const SPECTRUM_LAYOUT_SELECT_OPTIONS = Object.freeze([
	{ value: "vertical", label: "Vertical panes" },
	{ value: "horizontal", label: "Horizontal panes" },
	{ value: "single", label: "Single pane" }
])
const projectTraceVisibilityOptions = Object.freeze([
	{
		key: splitSpectrumLegendGroups.measurement,
		label: "Measurement data",
		requiresEstimate: false
	},
	{
		key: splitSpectrumLegendGroups.estimateMedian,
		label: "Median estimate",
		requiresEstimate: true
	}
])
const comparisonTraceVisibilityOptions = Object.freeze([
	{
		role: "measurement",
		label: "Measurement data"
	},
	{
		role: "median",
		label: "Median estimate"
	}
])
const splitPanePrimarySize = ref(null)
const splitPanePrimarySizeTouched = ref(false)
const splitPlotHiddenLegendKeys = ref([])
const splitComparisonHiddenLegendKeys = ref([])
const legendHoverEmphasisEnabled = ref(true)
const COMPARISON_UNCERTAINTY_NONE = "none"
const UNCERTAINTY_ALL = "all"
const comparisonUncertaintyLevelOptions = Object.freeze([ "50", "75", "90", "95" ])
const projectUncertaintyLevel = ref(UNCERTAINTY_ALL)
const comparisonTraceVisibility = ref({
	measurement: true,
	median: true
})
const ESTIMATE_STATUS_FINAL_WRITE_STOPPED_MESSAGE = "Task stopped before writing final single-spectrum estimate status."

const estimateTerminalStatuses = new Set([ "SUCCEEDED", "PARTIAL_SUCCEEDED", "FAILED" ])
const estimateRunningStatuses = new Set([ "SUBMITTED", "STARTED", "PENDING" ])

const sidebarOpen = ref(false)
const sidebarStyle = computed(() => {
  return sidebarOpen.value
    ? { left: '2px' }
    : { left: 'calc(-16rem - 2px)' }
})

const hasEstimate = computed(() => {
	return estimate.value !== null && !( estimate.value instanceof Error )
})

const activeEstimateItem = computed(() => {
	const items = Array.isArray( estimateJobStatus.value?.items ) ? estimateJobStatus.value.items : []
	return items.find(( item ) => String( item?.projectID ?? "" ) === String( project.value?.id ?? "" )) ?? null
})

const projectEstimateJobId = computed(() => {
	return String(
		estimateJobStatus.value?.jobId ??
		project.value?.estimateJobId ??
		project.value?.jobId ??
		""
	).trim()
})

const estimateInProgress = computed(() => {
	if( hasEstimate.value ){
		return false
	}

	const itemStatus = String( activeEstimateItem.value?.status ?? project.value?.estimateItemStatus ?? "" ).trim()
	if( estimateRunningStatuses.has( itemStatus )){
		return true
	}

	const jobStatus = String( estimateJobStatus.value?.status ?? project.value?.estimateJobStatus ?? "" ).trim()
	return estimateRunningStatuses.has( jobStatus )
})

const sidebarEstimateStatusText = computed(() => {
	if( sidebarEstimateErrorText.value.includes( ESTIMATE_STATUS_FINAL_WRITE_STOPPED_MESSAGE ) ){
		return ""
	}

	return estimateInProgress.value ? "Raman inference running" : ""
})

const sidebarEstimateErrorText = computed(() => {
	return String( estimateJobError.value || project.value?.estimateErrorMessage || "" ).trim()
})

const canCompare = computed(() => {
	return hasEstimate.value === true
})

const comparisonTooltip = computed(() => {
	return canCompare.value ? "" : "Comparison is available once the estimate is ready."
})

const deriveInitialComparisonUncertaintyLevel = ( visibility = {} ) => {
	const visibleLevels = comparisonUncertaintyLevelOptions.filter(( level ) => visibility?.[`interval${level}`] === true )
	if( visibleLevels.length === 0 ){
		return COMPARISON_UNCERTAINTY_NONE
	}

	if( visibleLevels.length === comparisonUncertaintyLevelOptions.length ){
		return UNCERTAINTY_ALL
	}

	if( visibleLevels.includes( "95" ) ){
		return "95"
	}

	return visibleLevels[0]
}

const deriveInitialProjectUncertaintyLevel = ( visibility = {} ) => {
	const visibleLevels = comparisonUncertaintyLevelOptions.filter(( level ) => visibility?.[`interval${level}`] === true )
	if( visibleLevels.length === 0 ){
		return COMPARISON_UNCERTAINTY_NONE
	}

	if( visibleLevels.length === comparisonUncertaintyLevelOptions.length ){
		return UNCERTAINTY_ALL
	}

	return visibleLevels.length === 1 ? visibleLevels[0] : UNCERTAINTY_ALL
}

const comparisonUncertaintyLevel = ref(COMPARISON_UNCERTAINTY_NONE)

const normalizeUncertaintyLevel = ( level ) => {
	const normalizedLevel = String( level ?? "" ).trim()
	if( normalizedLevel === UNCERTAINTY_ALL ){
		return UNCERTAINTY_ALL
	}

	return comparisonUncertaintyLevelOptions.includes( normalizedLevel )
		? normalizedLevel
		: COMPARISON_UNCERTAINTY_NONE
}

const normalizeProjectUncertaintyLevel = ( level ) => {
	const normalizedLevel = String( level ?? "" ).trim()
	return normalizeUncertaintyLevel( normalizedLevel )
}

const projectUncertaintyLegendKeys = Object.freeze({
	"50": splitSpectrumLegendGroups.estimateQ50,
	"75": splitSpectrumLegendGroups.estimateQ75,
	"90": splitSpectrumLegendGroups.estimateQ90,
	"95": splitSpectrumLegendGroups.estimateQ95
})

const comparisonPalette = computed(() => {
	const storedPalette = Array.isArray( settings.value?.comparisonColors?.palette )
		? settings.value.comparisonColors.palette
		: []
	const normalizedPalette = storedPalette
		.map(( color ) => String( color ?? "" ).trim() )
		.filter(( color ) => color.length > 0 )

	if( normalizedPalette.length > 0 ){
		return normalizedPalette
	}

	const fallbackColor = String(
		settings.value?.comparisonColors?.data ??
		settings.value?.colors?.median ??
		"#ff7f0e"
	).trim()

	return fallbackColor.length > 0 ? [ fallbackColor ] : [ "#ff7f0e" ]
})

const resolveComparisonProjectColor = ( index ) => {
	const palette = comparisonPalette.value
	if( palette.length === 0 ){
		return "#ff7f0e"
	}

	return palette[ index % palette.length ]
}

const comparisonProjectColorByID = computed(() => {
	return comparisonProjectIDs.value.reduce(( colorMap, comparisonID, index ) => {
		const normalizedComparisonID = String( comparisonID ?? "" ).trim()
		if( normalizedComparisonID.length === 0 ){
			return colorMap
		}

		colorMap[ normalizedComparisonID ] = resolveComparisonProjectColor( index )
		return colorMap
	}, {})
})

const normalizeProjectOwnerName = ( candidateProject ) => {
	const owner = candidateProject?.owner ?? {}
	const firstName = String( owner?.firstName ?? owner?.givenName ?? "" ).trim()
	const familyName = String( owner?.familyName ?? "" ).trim()
	return [ firstName, familyName ].filter(( part ) => part.length > 0 ).join( " " )
}

const buildComparisonProjectLegendKeys = ( projectID ) => {
	return {
		measurement: buildComparisonProjectLegendGroup( projectID, "measurement" ),
		median: buildComparisonProjectLegendGroup( projectID, "median" ),
		q50: buildComparisonProjectLegendGroup( projectID, "q50" ),
		q75: buildComparisonProjectLegendGroup( projectID, "q75" ),
		q90: buildComparisonProjectLegendGroup( projectID, "q90" ),
		q95: buildComparisonProjectLegendGroup( projectID, "q95" )
	}
}

const comparisonSelectOptions = computed(() => {
	const searchPattern = String( comparisonSearchPattern.value ?? "" ).trim().toLowerCase()
	const availableProjects = Object.values( projects.value ?? {} )

	const matchesSearch = ( candidateProject ) => {
		if( searchPattern.length === 0 ){
			return true
		}

		const projectName = String( candidateProject?.name ?? "" ).trim().toLowerCase()
		const ownerName = normalizeProjectOwnerName( candidateProject ).toLowerCase()
		return projectName.includes( searchPattern ) || ownerName.includes( searchPattern )
	}

	return availableProjects
		.filter(( candidateProject ) => {
			return String( candidateProject?.id ?? "" ) !== String( project.value?.id ?? "" ) &&
				matchesSearch( candidateProject )
		})
		.map(( candidateProject ) => {
			const candidateID = String( candidateProject?.id ?? "" ).trim()
			const colorIndex = comparisonProjectIDs.value.findIndex(( selectedID ) => String( selectedID ?? "" ) === candidateID )
			return {
				value: candidateID,
				label: String( candidateProject?.name ?? "Untitled project" ).trim() || "Untitled project",
				ownerLabel: normalizeProjectOwnerName( candidateProject ),
				color: resolveComparisonProjectColor( colorIndex >= 0 ? colorIndex : comparisonProjectIDs.value.length )
			}
		})
})

const comparisonDropdownSummaryLabel = computed(() => {
	const comparisonCount = comparisonProjectIDs.value.length
	if( comparisonCount === 0 ){
		return "Select comparison projects"
	}

	return comparisonCount === 1
		? "1 comparison project"
		: `${comparisonCount} comparison projects`
})

const selectedComparisonProjectSummaries = computed(() => {
	return comparisonProjectIDs.value.map(( comparisonID, index ) => {
		const candidateProject = projects.value?.[ comparisonID ]
		return {
			projectID: comparisonID,
			projectName: String( candidateProject?.name ?? comparisonID ?? "Comparison project" ).trim() || "Comparison project",
			color: resolveComparisonProjectColor( index )
		}
	})
})

const applyComparisonUncertaintyHiddenKeys = ( currentKeys ) => {
	const currentKeySet = new Set(
		( Array.isArray( currentKeys ) ? currentKeys : [] )
			.map(( key ) => normalizeLegendKey( key ))
			.filter(( key ) => key.length > 0 )
	)

	for( const entry of comparisonEntries.value ){
		const legendKeys = buildComparisonProjectLegendKeys( entry.projectID )
		const uncertaintyKeys = [
			legendKeys.q50,
			legendKeys.q75,
			legendKeys.q90,
			legendKeys.q95
		]

		for( const uncertaintyKey of uncertaintyKeys ){
			currentKeySet.delete( uncertaintyKey )
		}

		if( comparisonUncertaintyLevel.value === UNCERTAINTY_ALL ){
			continue
		}

		if( comparisonUncertaintyLevel.value === COMPARISON_UNCERTAINTY_NONE ){
			for( const uncertaintyKey of uncertaintyKeys ){
				currentKeySet.add( uncertaintyKey )
			}
			continue
		}

		for( const uncertaintyKey of uncertaintyKeys ){
			if( uncertaintyKey !== legendKeys[`q${comparisonUncertaintyLevel.value}`] ){
				currentKeySet.add( uncertaintyKey )
			}
		}
	}

	return Array.from( currentKeySet )
}

const normalizeComparisonTraceRole = ( role ) => {
	const normalizedRole = String( role ?? "" ).trim()
	return normalizedRole === "measurement" || normalizedRole === "median" ? normalizedRole : ""
}

const applyComparisonTraceVisibilityHiddenKeys = ( currentKeys ) => {
	const currentKeySet = new Set(
		( Array.isArray( currentKeys ) ? currentKeys : [] )
			.map(( key ) => normalizeLegendKey( key ))
			.filter(( key ) => key.length > 0 )
	)

	for( const entry of comparisonEntries.value ){
		const legendKeys = buildComparisonProjectLegendKeys( entry.projectID )
		for( const option of comparisonTraceVisibilityOptions ){
			const role = normalizeComparisonTraceRole( option.role )
			const legendKey = normalizeLegendKey( legendKeys[ role ] )
			if( role.length === 0 || legendKey.length === 0 ){
				continue
			}

			currentKeySet.delete( legendKey )
			if( comparisonTraceVisibility.value[ role ] === false ){
				currentKeySet.add( legendKey )
			}
		}
	}

	return Array.from( currentKeySet )
}

const applyProjectUncertaintyHiddenKeys = ( currentKeys ) => {
	const currentKeySet = new Set(
		( Array.isArray( currentKeys ) ? currentKeys : [] )
			.map(( key ) => normalizeLegendKey( key ))
			.filter(( key ) => key.length > 0 )
	)

	for( const uncertaintyKey of Object.values( projectUncertaintyLegendKeys ) ){
		currentKeySet.delete( uncertaintyKey )
	}

	if( projectUncertaintyLevel.value === UNCERTAINTY_ALL ){
		return Array.from( currentKeySet )
	}

	if( projectUncertaintyLevel.value === COMPARISON_UNCERTAINTY_NONE ){
		for( const uncertaintyKey of Object.values( projectUncertaintyLegendKeys ) ){
			currentKeySet.add( uncertaintyKey )
		}
		return Array.from( currentKeySet )
	}

	for( const [ level, uncertaintyKey ] of Object.entries( projectUncertaintyLegendKeys ) ){
		if( level !== projectUncertaintyLevel.value ){
			currentKeySet.add( uncertaintyKey )
		}
	}

	return Array.from( currentKeySet )
}

const setComparisonUncertaintyLevel = ( level ) => {
	comparisonUncertaintyLevel.value = normalizeUncertaintyLevel( level )

	if( comparisonPlotsVisible.value === false ){
		return
	}

	splitComparisonHiddenLegendKeys.value = applyComparisonUncertaintyHiddenKeys( splitComparisonHiddenLegendKeys.value )
}

const setComparisonTraceVisibility = async ( role, visible ) => {
	const normalizedRole = normalizeComparisonTraceRole( role )
	if( normalizedRole.length === 0 ){
		return
	}

	comparisonTraceVisibility.value = {
		...comparisonTraceVisibility.value,
		[ normalizedRole ]: visible === true
	}

	splitComparisonHiddenLegendKeys.value = applyComparisonTraceVisibilityHiddenKeys( splitComparisonHiddenLegendKeys.value )
	await applySplitSpectrumLegendVisibility()
}

const isComparisonTraceVisible = ( role ) => {
	const normalizedRole = normalizeComparisonTraceRole( role )
	return normalizedRole.length > 0 && comparisonTraceVisibility.value[ normalizedRole ] !== false
}

const toggleComparisonTraceVisibility = async ( role ) => {
	const normalizedRole = normalizeComparisonTraceRole( role )
	if( normalizedRole.length === 0 ){
		return
	}

	await setComparisonTraceVisibility( normalizedRole, isComparisonTraceVisible( normalizedRole ) === false )
}

const setProjectUncertaintyLevel = async ( level ) => {
	projectUncertaintyLevel.value = normalizeProjectUncertaintyLevel( level )
	splitPlotHiddenLegendKeys.value = applyProjectUncertaintyHiddenKeys( splitPlotHiddenLegendKeys.value )
	splitComparisonHiddenLegendKeys.value = applyProjectUncertaintyHiddenKeys( splitComparisonHiddenLegendKeys.value )
	await applySplitSpectrumLegendVisibility()
}

const setProjectTraceVisibility = async ( legendKey, visible ) => {
	const normalizedKey = normalizeLegendKey( legendKey )
	if( normalizedKey.length === 0 ){
		return
	}

	const updateHiddenKeys = ( currentKeys ) => {
		const nextKeySet = new Set(
			( Array.isArray( currentKeys ) ? currentKeys : [] )
				.map(( key ) => normalizeLegendKey( key ))
				.filter(( key ) => key.length > 0 )
		)

		if( visible ){
			nextKeySet.delete( normalizedKey )
		} else {
			nextKeySet.add( normalizedKey )
		}

		return Array.from( nextKeySet )
	}

	splitPlotHiddenLegendKeys.value = updateHiddenKeys( splitPlotHiddenLegendKeys.value )
	splitComparisonHiddenLegendKeys.value = updateHiddenKeys( splitComparisonHiddenLegendKeys.value )
	await applySplitSpectrumLegendVisibility()
}

const isProjectTraceVisible = ( legendKey ) => {
	return hiddenSplitSpectrumLegendKeySet.value.has( normalizeLegendKey( legendKey ) ) === false
}

const toggleProjectTraceVisibility = async ( legendKey ) => {
	await setProjectTraceVisibility( legendKey, isProjectTraceVisible( legendKey ) === false )
}

const reconcileComparisonLegendHiddenKeys = () => {
	const nextHiddenKeySet = new Set(
		( Array.isArray( splitComparisonHiddenLegendKeys.value ) ? splitComparisonHiddenLegendKeys.value : [] )
			.map(( key ) => normalizeLegendKey( key ))
			.filter(( key ) => key.length > 0 )
	)

	splitComparisonHiddenLegendKeys.value = applyComparisonUncertaintyHiddenKeys(
		applyComparisonTraceVisibilityHiddenKeys(
			applyProjectUncertaintyHiddenKeys( Array.from( nextHiddenKeySet ) )
		)
	)
}

const comparisonPlotsVisible = computed(() => {
	return hasEstimate.value === true &&
		comparisonEntries.value.length > 0
})

const spectrumLayoutMode = computed(() => {
	const value = String( settings.value?.layout?.layout ?? "vertical" ).trim().toLowerCase()
	if( value === "horizontal" || value === "single" ){
		return value
	}

	return "vertical"
})

const usesSplitSpectrumLayout = computed(() => {
	return spectrumLayoutMode.value !== "single"
})

const splitPaneIsVertical = computed(() => {
	return spectrumLayoutMode.value !== "horizontal"
})

const estimatePaneTitle = computed(() => {
	return dataType === "raman" ? "Raman estimate" : "Estimate"
})

const estimatePanePlaceholderText = computed(() => {
	if( sidebarEstimateErrorText.value.length > 0 ){
		return dataType === "raman"
			? "The Raman spectrum estimate is not available because the analysis did not complete successfully."
			: "The spectrum estimate is not available because the analysis did not complete successfully."
	}

	return dataType === "raman"
		? "The Raman spectrum estimate will be shown in this pane once the analysis is complete."
		: "The spectrum estimate will be shown in this pane once the analysis is complete."
})

const normalizeLegendKey = ( key ) => {
	return typeof key === "string" ? key.trim() : ""
}

const normalizeLegendLabel = ( value, fallback ) => {
	const normalizedValue = String( value ?? "" ).trim()
	return normalizedValue.length > 0 ? normalizedValue : fallback
}

const normalizeLegendColor = ( value, fallback ) => {
	const normalizedValue = String( value ?? "" ).trim()
	return normalizedValue.length > 0 ? normalizedValue : fallback
}

const stripLegendMathDelimiters = ( value ) => {
	const normalizedValue = String( value ?? "" ).trim()
	if( normalizedValue.startsWith( "$$" ) && normalizedValue.endsWith( "$$" ) && normalizedValue.length >= 4 ){
		return normalizedValue.slice( 2, -2 ).trim()
	}
	if( normalizedValue.startsWith( "$" ) && normalizedValue.endsWith( "$" ) && normalizedValue.length >= 2 ){
		return normalizedValue.slice( 1, -1 ).trim()
	}
	return normalizedValue
}

const escapeHtml = ( value ) => {
	return String( value ?? "" )
		.replaceAll( "&", "&amp;" )
		.replaceAll( "<", "&lt;" )
		.replaceAll( ">", "&gt;" )
		.replaceAll( '"', "&quot;" )
		.replaceAll( "'", "&#39;" )
}

const escapeLatexText = ( value ) => {
	return String( value ?? "" )
		.replaceAll( "\\", "\\textbackslash{}" )
		.replaceAll( "{", "\\{" )
		.replaceAll( "}", "\\}" )
}

const renderLegendLabelHtml = ( value, fallback ) => {
	const normalizedValue = stripLegendMathDelimiters( normalizeLegendLabel( value, fallback ) )
	if( normalizedValue.length === 0 ){
		return ""
	}

	const isPlainTextLabel = /[\\^_{}]/.test( normalizedValue ) === false
	const expression = isPlainTextLabel
		? `\\text{${escapeLatexText( normalizedValue )}}`
		: normalizedValue

	try{
		return katex.renderToString( expression, {
			throwOnError: false,
			displayMode: false
		} )
	} catch{
		return escapeHtml( normalizedValue )
	}
}

const buildCalibrationLegendExpression = ( value, fallback ) => {
	const normalizedValue = stripLegendMathDelimiters( normalizeLegendLabel( value, fallback ) )
	if( normalizedValue.length === 0 ){
		return ""
	}

	const isPlainTextLabel = /[\\^_{}]/.test( normalizedValue ) === false
	return isPlainTextLabel
		? `\\text{Calibration | ${escapeLatexText( normalizedValue )}}`
		: `\\text{Calibration | }${normalizedValue}`
}

const renderCalibrationLegendLabelHtml = ( value, fallback ) => {
	const expression = buildCalibrationLegendExpression( value, fallback )
	if( expression.length === 0 ){
		return ""
	}

	try{
		return katex.renderToString( expression, {
			throwOnError: false,
			displayMode: false
		} )
	} catch{
		return escapeHtml( `Calibration | ${normalizeLegendLabel( value, fallback )}` )
	}
}

const hiddenLegendKeysFromVisibility = ( visibility = {} ) => {
	const hiddenKeys = []

	if( visibility?.data === false ){
		hiddenKeys.push( splitSpectrumLegendGroups.measurement )
	}
	if( visibility?.median === false ){
		hiddenKeys.push( splitSpectrumLegendGroups.estimateMedian )
	}
	if( visibility?.interval50 === false ){
		hiddenKeys.push( splitSpectrumLegendGroups.estimateQ50 )
	}
	if( visibility?.interval75 === false ){
		hiddenKeys.push( splitSpectrumLegendGroups.estimateQ75 )
	}
	if( visibility?.interval90 === false ){
		hiddenKeys.push( splitSpectrumLegendGroups.estimateQ90 )
	}
	if( visibility?.interval95 === false ){
		hiddenKeys.push( splitSpectrumLegendGroups.estimateQ95 )
	}

	return Array.from( new Set( hiddenKeys ) )
}

const seedSplitSpectrumLegendVisibility = () => {
	splitPlotHiddenLegendKeys.value = hiddenLegendKeysFromVisibility( settings.value?.visibility?.plot ?? {} )
	splitComparisonHiddenLegendKeys.value = hiddenLegendKeysFromVisibility( settings.value?.visibility?.plot ?? {} )
	projectUncertaintyLevel.value = deriveInitialProjectUncertaintyLevel( settings.value?.visibility?.plot ?? {} )
	comparisonUncertaintyLevel.value = deriveInitialComparisonUncertaintyLevel( settings.value?.visibility?.comparison ?? {} )
	comparisonTraceVisibility.value = {
		measurement: settings.value?.visibility?.comparison?.data !== false,
		median: settings.value?.visibility?.comparison?.median !== false
	}
	splitPlotHiddenLegendKeys.value = applyProjectUncertaintyHiddenKeys( splitPlotHiddenLegendKeys.value )
	splitComparisonHiddenLegendKeys.value = applyProjectUncertaintyHiddenKeys( splitComparisonHiddenLegendKeys.value )
	splitComparisonHiddenLegendKeys.value = applyComparisonTraceVisibilityHiddenKeys( splitComparisonHiddenLegendKeys.value )
	splitComparisonHiddenLegendKeys.value = applyComparisonUncertaintyHiddenKeys( splitComparisonHiddenLegendKeys.value )
}

const activeSplitSpectrumHiddenLegendKeys = computed(() => {
	const source = comparisonPlotsVisible.value ? splitComparisonHiddenLegendKeys.value : splitPlotHiddenLegendKeys.value
	return Array.from( new Set(
		( Array.isArray( source ) ? source : [] )
			.map(( key ) => normalizeLegendKey( key ))
			.filter(( key ) => key.length > 0 )
	))
})

const hiddenSplitSpectrumLegendKeySet = computed(() => {
	return new Set( activeSplitSpectrumHiddenLegendKeys.value )
})

const splitSpectrumLegendEntries = computed(() => {
	if( data.value === null ){
		return []
	}

	const nextEntries = [
		{
			key: splitSpectrumLegendGroups.measurement,
			label: normalizeLegendLabel( settings.value?.legends?.data, "Measurement" ),
			html: renderLegendLabelHtml( settings.value?.legends?.data, "Measurement" ),
			color: normalizeLegendColor( settings.value?.colors?.data, "#111827" )
		}
	]

	if( hasEstimate.value ){
		nextEntries.push(
			{
				key: splitSpectrumLegendGroups.estimateMedian,
				label: normalizeLegendLabel( settings.value?.legends?.median, "Estimate" ),
				html: renderLegendLabelHtml( settings.value?.legends?.median, "Estimate" ),
				color: normalizeLegendColor( settings.value?.colors?.median, "#111827" )
			},
			{
				key: splitSpectrumLegendGroups.estimateQ50,
				label: normalizeLegendLabel( settings.value?.legends?.interval50, "50%" ),
				html: renderLegendLabelHtml( settings.value?.legends?.interval50, "50%" ),
				color: normalizeLegendColor( settings.value?.colors?.area, "#9ca3af" )
			},
			{
				key: splitSpectrumLegendGroups.estimateQ75,
				label: normalizeLegendLabel( settings.value?.legends?.interval75, "75%" ),
				html: renderLegendLabelHtml( settings.value?.legends?.interval75, "75%" ),
				color: normalizeLegendColor( settings.value?.colors?.area, "#9ca3af" )
			},
			{
				key: splitSpectrumLegendGroups.estimateQ90,
				label: normalizeLegendLabel( settings.value?.legends?.interval90, "90%" ),
				html: renderLegendLabelHtml( settings.value?.legends?.interval90, "90%" ),
				color: normalizeLegendColor( settings.value?.colors?.area, "#9ca3af" )
			},
			{
				key: splitSpectrumLegendGroups.estimateQ95,
				label: normalizeLegendLabel( settings.value?.legends?.interval95, "95%" ),
				html: renderLegendLabelHtml( settings.value?.legends?.interval95, "95%" ),
				color: normalizeLegendColor( settings.value?.colors?.area, "#9ca3af" )
			}
		)
	}

	if( calibrationPreviewOverlay.value !== null ){
		nextEntries.push(
			{
				key: splitSpectrumLegendGroups.calibrationMeasurement,
				label: `Calibration | ${normalizeLegendLabel( settings.value?.legends?.data, "Measurement" )}`,
				html: renderCalibrationLegendLabelHtml( settings.value?.legends?.data, "Measurement" ),
				color: normalizeLegendColor( settings.value?.colors?.calibration, "#333333" )
			}
		)

		if( hasEstimate.value ){
			nextEntries.push(
				{
					key: splitSpectrumLegendGroups.calibrationEstimateMedian,
					label: `Calibration | ${normalizeLegendLabel( settings.value?.legends?.median, "Estimate" )}`,
					html: renderCalibrationLegendLabelHtml( settings.value?.legends?.median, "Estimate" ),
					color: normalizeLegendColor( settings.value?.colors?.calibration, "#333333" )
				},
				{
					key: splitSpectrumLegendGroups.calibrationEstimateQ50,
					label: `Calibration | ${normalizeLegendLabel( settings.value?.legends?.interval50, "50%" )}`,
					html: renderCalibrationLegendLabelHtml( settings.value?.legends?.interval50, "50%" ),
					color: normalizeLegendColor( settings.value?.colors?.calibration, "#333333" )
				},
				{
					key: splitSpectrumLegendGroups.calibrationEstimateQ75,
					label: `Calibration | ${normalizeLegendLabel( settings.value?.legends?.interval75, "75%" )}`,
					html: renderCalibrationLegendLabelHtml( settings.value?.legends?.interval75, "75%" ),
					color: normalizeLegendColor( settings.value?.colors?.calibration, "#333333" )
				},
				{
					key: splitSpectrumLegendGroups.calibrationEstimateQ90,
					label: `Calibration | ${normalizeLegendLabel( settings.value?.legends?.interval90, "90%" )}`,
					html: renderCalibrationLegendLabelHtml( settings.value?.legends?.interval90, "90%" ),
					color: normalizeLegendColor( settings.value?.colors?.calibration, "#333333" )
				},
				{
					key: splitSpectrumLegendGroups.calibrationEstimateQ95,
					label: `Calibration | ${normalizeLegendLabel( settings.value?.legends?.interval95, "95%" )}`,
					html: renderCalibrationLegendLabelHtml( settings.value?.legends?.interval95, "95%" ),
					color: normalizeLegendColor( settings.value?.colors?.calibration, "#333333" )
				}
			)
		}
	}

	if( comparisonPlotsVisible.value ){
		nextEntries.push(
			...comparisonEntries.value.flatMap(( entry, index ) => {
				const legendKeys = buildComparisonProjectLegendKeys( entry.projectID )
				const entryColor = normalizeLegendColor( entry.color, resolveComparisonProjectColor( index ) )
				const buildComparisonEntry = ( key, label ) => ({
					key,
					label,
					html: renderLegendLabelHtml( label, label ),
					color: entryColor
				})

				return [
					buildComparisonEntry(
						legendKeys.measurement,
						normalizeLegendLabel( settings.value?.legends?.data, "Measurement" )
					),
					buildComparisonEntry(
						legendKeys.median,
						normalizeLegendLabel( settings.value?.legends?.median, "Estimate" )
					),
					buildComparisonEntry(
						legendKeys.q50,
						normalizeLegendLabel( settings.value?.legends?.interval50, "50%" )
					),
					buildComparisonEntry(
						legendKeys.q75,
						normalizeLegendLabel( settings.value?.legends?.interval75, "75%" )
					),
					buildComparisonEntry(
						legendKeys.q90,
						normalizeLegendLabel( settings.value?.legends?.interval90, "90%" )
					),
					buildComparisonEntry(
						legendKeys.q95,
						normalizeLegendLabel( settings.value?.legends?.interval95, "95%" )
					)
				]
			})
		)
	}

	return nextEntries
})

const isSplitSpectrumLegendHidden = ( key ) => {
	return hiddenSplitSpectrumLegendKeySet.value.has( normalizeLegendKey( key ) )
}

const setActiveSplitSpectrumHiddenLegendKeys = ( nextKeys ) => {
	const normalizedKeys = Array.from( new Set(
		( Array.isArray( nextKeys ) ? nextKeys : [] )
			.map(( key ) => normalizeLegendKey( key ))
			.filter(( key ) => key.length > 0 )
	))

	if( comparisonPlotsVisible.value ){
		splitComparisonHiddenLegendKeys.value = normalizedKeys
		return
	}

	splitPlotHiddenLegendKeys.value = normalizedKeys
}

const toggleSplitSpectrumLegendVisibility = ( key ) => {
	const normalizedKey = normalizeLegendKey( key )
	if( normalizedKey.length === 0 ){
		return
	}

	if( hiddenSplitSpectrumLegendKeySet.value.has( normalizedKey ) ){
		setActiveSplitSpectrumHiddenLegendKeys(
			activeSplitSpectrumHiddenLegendKeys.value.filter(( currentKey ) => currentKey !== normalizedKey )
		)
		return
	}

	setActiveSplitSpectrumHiddenLegendKeys([
		...activeSplitSpectrumHiddenLegendKeys.value,
		normalizedKey
	])
}

const setLegendHoverEmphasisEnabled = ( enabled ) => {
	legendHoverEmphasisEnabled.value = enabled === true
}

const clampSplitPanePrimarySize = ( size ) => {

	const normalizedSize = Number( size )
	const containerSize = splitPaneIsVertical.value
		? Number( spectraPaneContainer.value?.clientHeight )
		: Number( spectraPaneContainer.value?.clientWidth )

	if( Number.isFinite( normalizedSize ) === false ){
		return MIN_SPECTRUM_PANEL_SIZE
	}

	if( Number.isFinite( containerSize ) === false || containerSize <= 0 ){
		return Math.max( MIN_SPECTRUM_PANEL_SIZE, Math.round( normalizedSize ))
	}

	const maximumHeight = Math.max(
		MIN_SPECTRUM_PANEL_SIZE,
		Math.round( containerSize - MIN_SPECTRUM_PANEL_SIZE - SPECTRA_PANE_DIVIDER_SIZE_PX )
	)

	return Math.max( MIN_SPECTRUM_PANEL_SIZE, Math.min( maximumHeight, Math.round( normalizedSize )))
}

const defaultSplitPanePrimarySize = () => {

	const containerSize = splitPaneIsVertical.value
		? Number( spectraPaneContainer.value?.clientHeight )
		: Number( spectraPaneContainer.value?.clientWidth )
	if( Number.isFinite( containerSize ) === false || containerSize <= 0 ){
		return MIN_SPECTRUM_PANEL_SIZE
	}

	const availableHeight = containerSize - SPECTRA_PANE_DIVIDER_SIZE_PX
	if( Number.isFinite( availableHeight ) === false || availableHeight <= 0 ){
		return MIN_SPECTRUM_PANEL_SIZE
	}

	return clampSplitPanePrimarySize( availableHeight / 2 )
}

const ensureSplitPanePrimarySize = ( options = {} ) => {

	const shouldReset = options?.forceDefault === true
	const nextHeight = shouldReset || Number.isFinite( Number( splitPanePrimarySize.value )) === false
		? defaultSplitPanePrimarySize()
		: clampSplitPanePrimarySize( splitPanePrimarySize.value )

	splitPanePrimarySize.value = nextHeight
	return nextHeight
}

const resolvedSplitPanePrimarySize = computed(() => {

	const configuredHeight = Number( splitPanePrimarySize.value )
	if( Number.isFinite( configuredHeight ) ){
		return clampSplitPanePrimarySize( configuredHeight )
	}

	return defaultSplitPanePrimarySize()
})

const spectraPaneGridStyle = computed(() => {
	if( splitPaneIsVertical.value ){
		return {
			gridTemplateRows: `${resolvedSplitPanePrimarySize.value}px ${SPECTRA_PANE_DIVIDER_SIZE_PX}px minmax(${MIN_SPECTRUM_PANEL_SIZE}px, 1fr)`
		}
	}

	return {
		gridTemplateColumns: `${resolvedSplitPanePrimarySize.value}px ${SPECTRA_PANE_DIVIDER_SIZE_PX}px minmax(${MIN_SPECTRUM_PANEL_SIZE}px, 1fr)`
	}
})

const download = async() => {

	downloading.value = true
	await projectlib.download([ project.value ])

	await utils.wait(1000)
	downloading.value = false
}

const openProjectChat = () => {
	mountedViewerOverlays.value = {
		...mountedViewerOverlays.value,
		projectChat: true
	}
	projectChatOpen.value = true
}

const openMetadataModal = async () => {
	await ensureViewerOverlayMounted( "metadata" )
	metadataModal.value?.open()
}

const openShareModal = async () => {
	await ensureViewerOverlayMounted( "share" )
	shareModal.value?.open()
}

const openZenodoModal = async () => {
	await ensureViewerOverlayMounted( "zenodo" )
	zenodoModal.value?.open()
}

const openProjectMenu = () => {
	navigation.route( "Main menu", {} )
}

const openVisualizationSettings = () => {
	navigation.redirect( "Settings", "Visualization" )
}

const focusProjectNameEdit = () => {
	projectNameInput.value?.focusNameEdit?.()
}

const calibrationDraftPointCounter = ref(0)

const buildDefaultDraftIncludedOrders = ( polynomialOrder = 0 ) => {
	const resolvedOrder = Math.max( Math.trunc( Number( polynomialOrder ) ), 0 )
	return Array.from({ length: resolvedOrder + 1 }, ( _, index ) => index )
}

const normalizeDraftIncludedOrders = ( includedOrders = [], polynomialOrder = 0 ) => {
	const resolvedOrder = Math.max( Math.trunc( Number( polynomialOrder ) ), 0 )
	const fallbackOrders = buildDefaultDraftIncludedOrders( resolvedOrder )
	if( Array.isArray( includedOrders ) === false ){
		return fallbackOrders
	}

	const normalizedOrders = Array.from( new Set(
		includedOrders
			.map(( order ) => Math.trunc( Number( order ) ) )
			.filter(( order ) => Number.isInteger( order ) && order >= 0 && order <= resolvedOrder )
	)).sort(( left, right ) => left - right )

	if( normalizedOrders.length === 0 ){
		return fallbackOrders
	}

	if( normalizedOrders.includes( resolvedOrder ) === false ){
		normalizedOrders.push( resolvedOrder )
		normalizedOrders.sort(( left, right ) => left - right )
	}

	return normalizedOrders
}

const toCalibrationDraftPoint = ( point = {}, index = 0 ) => {
	const fallbackID = `calibration-point-${index + 1}`
	const id = String( point?.id ?? fallbackID ).trim() || fallbackID
	const sourceX = Number( point?.sourceX ?? 0 )
	const numericTargetX = Number( point?.targetX )

	return {
		id,
		sourceX: Number.isFinite( sourceX ) ? sourceX : 0,
		targetInput: Number.isFinite( numericTargetX ) ? String( numericTargetX ) : String( Number.isFinite( sourceX ) ? sourceX : 0 )
	}
}

const buildCalibrationDraftFromSavedValue = ( value ) => {
	const normalizedCalibration = normalizeCalibrationModel( value )
	const points = normalizedCalibration.points.map(( point, index ) => toCalibrationDraftPoint( point, index ))
	calibrationDraftPointCounter.value = points.length

	return {
		x: normalizedCalibration.x,
		polynomialOrder: normalizedCalibration.polynomialOrder,
		includedOrders: [ ...normalizedCalibration.includedOrders ],
		points
	}
}

const buildPersistedCalibrationFromDraft = ( draft = calibration.value ) => {
	const rawPoints = Array.isArray( draft?.points ) ? draft.points : []

	return normalizeCalibrationModel({
		x: Number( draft?.x ?? 0 ),
		polynomialOrder: Number( draft?.polynomialOrder ?? 0 ),
		includedOrders: Array.isArray( draft?.includedOrders ) ? draft.includedOrders : [ 0 ],
		points: rawPoints.map(( point, index ) => {
			const numericTargetX = Number( point?.targetInput )
			return {
				id: String( point?.id ?? `calibration-point-${index + 1}` ),
				sourceX: Number( point?.sourceX ?? 0 ),
				targetX: Number.isFinite( numericTargetX ) ? numericTargetX : null
			}
		})
	})
}

const isMissingCalibrationProfileApiError = ( error ) => {
	const status = Number( error?.status )
	return status === 404 || status === 501
}

const calibrationProfileOptions = computed(() => {
	const options = calibrationProfiles.value.map(( profile ) => {
		const profileID = String( profile?.profileID ?? "" ).trim()
		const friendlyName = String( profile?.friendlyName ?? "" ).trim()
		const shared = profile?.shared === true
		const pointCount = Number( profile?.pointCount ?? profile?.points?.length ?? 0 )
		const pointLabel = pointCount === 1 ? "1 point" : `${pointCount} points`
		const sharedLabel = shared ? " • shared" : ""

		return {
			value: profileID,
			label: friendlyName.length > 0 ? `${friendlyName} • ${pointLabel}${sharedLabel}` : `${profileID} • ${pointLabel}${sharedLabel}`
		}
	})

	const selectedProfileID = String( calibrationSelectedProfileID.value ?? "" ).trim()
	if( selectedProfileID.length > 0 && options.some(( option ) => option.value === selectedProfileID ) === false ){
		const fallbackLabel = String( calibrationProfileName.value ?? selectedProfileID ).trim() || selectedProfileID
		options.unshift({
			value: selectedProfileID,
			label: fallbackLabel
		})
	}

	return options
})

const calibrationReservedProfileNames = computed(() => {
	return calibrationProfiles.value
		.filter(( profile ) => profile?.shared !== true )
		.map(( profile ) => String( profile?.friendlyName ?? "" ).trim() )
		.filter(( friendlyName ) => friendlyName.length > 0 )
})

const serializeCalibrationModel = ( value ) => {
	return JSON.stringify( normalizeCalibrationModel( value ) )
}

const calibrationPreview = computed(() => {
	return buildPersistedCalibrationFromDraft( calibration.value )
})

const calibrationPreviewIsCurrent = computed(() => {
	return activeCalibrationPreview.value !== null &&
		serializeCalibrationModel( activeCalibrationPreview.value ) === serializeCalibrationModel( calibrationPreview.value )
})

const calibrationPreviewOverlay = computed(() => {
	return calibrating.value ? activeCalibrationPreview.value : null
})

const calibrationValidPointCount = computed(() => {
	return calibrationPreview.value.points.filter(( point ) => Number.isFinite( point.targetX ) ).length
})

const calibrationMaxOrder = computed(() => {
	return calibrationMaxPolynomialOrder( calibrationPreview.value )
})

const calibrationHasSavablePoints = computed(() => {
	return calibrationHasValidPoints( calibrationPreview.value )
})

const projectHasCalibration = computed(() => {
	return String( calibrationAssignedProfileID.value ?? "" ).trim().length > 0 ||
		calibrationHasValidPoints( savedCalibrationSnapshot.value )
})

const selectionPreviewUsesRawBase = computed(() => {
	return activeCalibrationPreview.value?.__harkanaPreviewSource === "selection" &&
		calibrationHasValidPoints( activeCalibrationPreview.value )
})

const canSaveCalibrationProfile = computed(() => {
	return project.value?.shared !== true &&
		calibrationProfilesSupported.value &&
		calibrationProfileSaving.value === false &&
		calibrationHasSavablePoints.value &&
		calibrationPreviewIsCurrent.value
})

const calibrationProfileSaveDisabledReason = computed(() => {
	if( calibrationProfilesSupported.value === false ){
		return "Calibration profiles are not available."
	}
	if( calibrationPreviewIsCurrent.value === false ){
		return "Run the preview before saving the calibration profile."
	}
	if( calibrationHasSavablePoints.value === false ){
		return "Select enough valid points to fit the calibration."
	}

	return ""
})

const canAssignCalibrationProfile = computed(() => {
	if( calibrationProfilesSupported.value === false ){
		return calibrationHasSavablePoints.value && calibrationPreviewIsCurrent.value
	}

	return String( calibrationSelectedProfileID.value ?? "" ).trim() !== String( calibrationAssignedProfileID.value ?? "" ).trim()
})

const normalizeCalibrationProfileModel = ( profileOrModel = {} ) => {
	const candidateModel = profileOrModel?.model?.type === "polynomial"
		? profileOrModel.model
		: profileOrModel

	return normalizeCalibrationModel( candidateModel ?? { x: 0, polynomialOrder: 0, includedOrders: [ 0 ], points: [] })
}

const calibrationProfileNameExists = ( friendlyName ) => {
	const candidateName = String( friendlyName ?? "" ).trim()
	if( candidateName.length === 0 ){
		return false
	}

	return calibrationReservedProfileNames.value.some(( reservedName ) => {
		return String( reservedName ?? "" ).trim().localeCompare( candidateName, undefined, { sensitivity: "accent" } ) === 0
	})
}

const buildCalibrationProfilePayload = ( calibrationModel = calibrationPreview.value, metadata = {} ) => {
	const normalizedModel = normalizeCalibrationModel( calibrationModel )
	const points = Array.isArray( normalizedModel?.points ) ? normalizedModel.points.map(( point ) => ({
		id: String( point?.id ?? "" ),
		sourceX: Number( point?.sourceX ?? 0 ),
		targetX: Number( point?.targetX ?? 0 )
	})) : []
	const polynomialOrder = Number( normalizedModel?.polynomialOrder ?? 0 )
	const includedOrders = Array.isArray( normalizedModel?.includedOrders ) ? normalizedModel.includedOrders : [ 0 ]

	return {
		version: "calibration-profile-write-v2",
		profileKind: "axis-calibration",
		axisRole: CALIBRATION_AXIS_ROLE,
		sourceProjectID: String( project.value?.id ?? "" ).trim(),
		dataType,
		friendlyName: String( metadata?.friendlyName ?? "" ).trim(),
		description: String( metadata?.description ?? "" ).trim(),
		polynomialOrder,
		includedOrders,
		points,
		model: {
			type: "polynomial",
			polynomialOrder,
			includedOrders,
			points
		}
	}
}

const calibrationReferenceLines = computed(() => {
	const focusedPointID = String( focusedCalibrationPointID.value ?? "" ).trim()
	return calibration.value.points
		.map(( point ) => ({
			x: Number( point.sourceX ),
			color: focusedPointID.length > 0 && point.id === focusedPointID
				? `rgba(17, 17, 17, ${0.55 + 0.45 * ( 0.5 + 0.5 * Math.sin( calibrationPulsePhase.value ) )})`
				: "rgba(17, 17, 17, 0.75)",
			width: focusedPointID.length > 0 && point.id === focusedPointID
				? 1.5 + 1.5 * ( 0.5 + 0.5 * Math.sin( calibrationPulsePhase.value ) )
				: 1,
			dash: focusedPointID.length > 0 && point.id === focusedPointID ? "solid" : "dash"
		}))
})

const applyCalibrationProfileToState = ( profile = null, options = {} ) => {
	const normalizedCalibration = normalizeCalibrationProfileModel( profile ?? { x: 0, polynomialOrder: 0, includedOrders: [ 0 ], points: [] })
	const profileID = String( profile?.profileID ?? options?.profileID ?? "" ).trim()
	const friendlyName = String( profile?.friendlyName ?? options?.friendlyName ?? "" ).trim()
	const description = String( profile?.description ?? options?.description ?? "" ).trim()

	activeCalibrationPreview.value = null
	savedCalibrationSnapshot.value = cloneCalibrationModel( normalizedCalibration )
	data.value.calibration = cloneCalibrationModel( normalizedCalibration )
	calibration.value = buildCalibrationDraftFromSavedValue( normalizedCalibration )
	focusedCalibrationPointID.value = ""
	calibrationAssignedProfileID.value = profileID
	calibrationSelectedProfileID.value = profileID
	savedCalibrationProfileName.value = friendlyName.length > 0
		? friendlyName
		: String( project.value?.name ?? project.value?.id ?? "Calibration profile" )
	calibrationProfileName.value = savedCalibrationProfileName.value
	savedCalibrationProfileDescription.value = description
	calibrationProfileDescription.value = description
}

const refreshCalibrationProfiles = async () => {
	if( project.value?.shared ){
		calibrationProfiles.value = []
		return
	}

	calibrationProfilesLoading.value = true

	try{
		const ownedResponse = await datalib.listCalibrationProfiles({
			dataType,
			axisRole: CALIBRATION_AXIS_ROLE,
			scope: "owned"
		})
		const ownedProfiles = Array.isArray( ownedResponse?.items ) ? ownedResponse.items : []
		let sharedProfiles = []

		try{
			const sharedResponse = await datalib.listCalibrationProfiles({
				dataType,
				axisRole: CALIBRATION_AXIS_ROLE,
				scope: "shared"
			})
			sharedProfiles = Array.isArray( sharedResponse?.items )
				? sharedResponse.items.map(( profile ) => ({ ...profile, shared: true }))
				: []
		} catch( error ){
			if( isMissingCalibrationProfileApiError( error ) === false ){
				console.log( error )
			}
		}

		const profileByID = new Map()
		for( const profile of [ ...ownedProfiles, ...sharedProfiles ] ){
			const profileID = String( profile?.profileID ?? "" ).trim()
			if( profileID.length > 0 && profileByID.has( profileID ) === false ){
				profileByID.set( profileID, profile )
			}
		}

		calibrationProfiles.value = Array.from( profileByID.values() )
		calibrationProfilesSupported.value = true
	} catch( error ){
		if( isMissingCalibrationProfileApiError( error ) ){
			calibrationProfilesSupported.value = false
			calibrationProfiles.value = []
			return
		}

		console.log( error )
	} finally {
		calibrationProfilesLoading.value = false
	}
}

const loadAssignedCalibration = async () => {
	try{
		const assignment = await datalib.getProjectCalibration( project.value, dataType, CALIBRATION_AXIS_ROLE )
		calibrationProfilesSupported.value = true

		if( assignment?.profile ){
			applyCalibrationProfileToState( assignment.profile, {
				profileID: assignment.profileID,
				friendlyName: assignment.profile?.friendlyName,
				description: assignment.profile?.description
			})
			return true
		}

		calibrationAssignedProfileID.value = ""
		calibrationSelectedProfileID.value = ""
	} catch( error ){
		if( isMissingCalibrationProfileApiError( error ) ){
			calibrationProfilesSupported.value = false
			calibrationAssignedProfileID.value = ""
			calibrationSelectedProfileID.value = ""
			return false
		}

		console.log( error )
	}

	return false
}

const loadSelectedCalibrationProfile = async () => {
	const selectedProfileID = String( calibrationSelectedProfileID.value ?? "" ).trim()
	if( selectedProfileID.length === 0 ){
		return
	}

	calibrationProfilesLoading.value = true

	try{
		const profile = await datalib.getCalibrationProfile( selectedProfileID, dataType, CALIBRATION_AXIS_ROLE )
		calibrationProfilesSupported.value = true
		await setCalibrationSelectionDraft(
			profile,
			String( profile?.friendlyName ?? calibrationProfileName.value ?? "" ).trim(),
			{ forcePreview: true, previewSource: "selection" }
		)
	} catch( error ){
		if( isMissingCalibrationProfileApiError( error ) ){
			calibrationProfilesSupported.value = false
			return
		}

		console.log( error )
	} finally {
		calibrationProfilesLoading.value = false
	}
}

const syncCalibrationDraftFromSavedData = () => {
	activeCalibrationPreview.value = null
	calibration.value = buildCalibrationDraftFromSavedValue( savedCalibrationSnapshot.value )
	focusedCalibrationPointID.value = ""
	if( String( calibrationProfileName.value ?? "" ).trim().length === 0 ){
		calibrationProfileName.value = String( savedCalibrationProfileName.value ?? project.value?.name ?? project.value?.id ?? "Calibration profile" )
	}
	if( String( calibrationProfileDescription.value ?? "" ).trim().length === 0 ){
		calibrationProfileDescription.value = String( savedCalibrationProfileDescription.value ?? "" )
	}
}

const setCalibrationSelectionDraft = async ( calibrationModel, friendlyName = "", options = {} ) => {
	const normalizedCalibration = normalizeCalibrationProfileModel( calibrationModel ?? { x: 0, polynomialOrder: 0, includedOrders: [ 0 ], points: [] })
	const forcePreview = options?.forcePreview === true
	const previewSource = String( options?.previewSource ?? "selection" ).trim() || "selection"
	calibration.value = buildCalibrationDraftFromSavedValue( normalizedCalibration )
	activeCalibrationPreview.value = ( forcePreview || serializeCalibrationModel( normalizedCalibration ) !== serializeCalibrationModel( savedCalibrationSnapshot.value ) )
		? {
			...cloneCalibrationModel( normalizedCalibration ),
			__harkanaForcePreview: true,
			__harkanaPreviewSource: previewSource
		}
		: null
	focusedCalibrationPointID.value = ""

	if( String( friendlyName ?? "" ).trim().length > 0 ){
		calibrationProfileName.value = String( friendlyName ).trim()
	}
	if( String( calibrationModel?.description ?? "" ).trim().length > 0 ){
		calibrationProfileDescription.value = String( calibrationModel.description ).trim()
	}

	await renderSpectrumLayout()
}

const startCalibration = async () => {
	if( project.value?.shared || data.value === null ){
		return
	}

	activeCalibrationPreview.value = null
	syncCalibrationDraftFromSavedData()
	calibrating.value = true
	calibrationPanelOpen.value = false
	await refreshCalibrationProfiles()
	calibrationPanelOpen.value = projectHasCalibration.value === false
}

const handleCalibrationProfileSelection = async ( nextProfileID ) => {
	const normalizedProfileID = String( nextProfileID ?? "" ).trim()
	calibrationSelectedProfileID.value = normalizedProfileID

	if( normalizedProfileID.length === 0 ){
		calibrationProfileDescription.value = ""
		await setCalibrationSelectionDraft(
			{ x: 0, polynomialOrder: 0, includedOrders: [ 0 ], points: [] },
			String( project.value?.name ?? project.value?.id ?? "Calibration profile" )
		)
		return
	}

	await loadSelectedCalibrationProfile()
}

const cancelCalibration = () => {
	if( calibrationProfileSaving.value || calibrationAssignmentSaving.value ){
		return
	}

	focusedCalibrationPointID.value = ""
	calibrationPanelOpen.value = false
	syncCalibrationDraftFromSavedData()
	calibrationSelectedProfileID.value = calibrationAssignedProfileID.value
	calibrationProfileName.value = savedCalibrationProfileName.value
	calibrationProfileDescription.value = savedCalibrationProfileDescription.value
	data.value.calibration = cloneCalibrationModel( savedCalibrationSnapshot.value )
	calibrating.value = false
}

const applyCalibrationPreview = async () => {
	if( data.value === null || calibrationHasSavablePoints.value === false ){
		return
	}

	activeCalibrationPreview.value = {
		...cloneCalibrationModel( calibrationPreview.value ),
		__harkanaPreviewSource: "editor"
	}
	await renderSpectrumLayout()
}

const buildRenderedSpectrumData = () => {
	if( data.value === null ){
		return null
	}

	const rawData = toRaw( data.value )
	if( selectionPreviewUsesRawBase.value === false ){
		return rawData
	}

	return {
		...rawData,
		calibration: normalizeCalibrationModel({ x: 0, polynomialOrder: 0, includedOrders: [ 0 ], points: [] })
	}
}

const openCalibrationProfileSaveModal = async () => {
	if( canSaveCalibrationProfile.value === false ){
		return
	}

	const defaultName = String( calibrationProfileName.value ?? savedCalibrationProfileName.value ?? project.value?.name ?? project.value?.id ?? "" ).trim() || "Calibration profile"
	await ensureViewerOverlayMounted( "calibrationProfileSave" )
	await calibrationProfileSaveModal.value?.open?.({
		name: calibrationProfileNameExists( defaultName ) ? "" : defaultName,
		description: calibrationProfileDescription.value
	})
}

const saveCalibrationProfile = async ( metadata = {} ) => {
	const friendlyName = String( metadata?.friendlyName ?? "" ).trim()
	const description = String( metadata?.description ?? "" ).trim()
	if(
		project.value?.shared ||
		calibrationProfileSaving.value ||
		data.value === null ||
		canSaveCalibrationProfile.value === false ||
		friendlyName.length === 0 ||
		calibrationProfileNameExists( friendlyName )
	){
		return
	}

	calibrationProfileSaving.value = true

	try{
		const savedProfile = await datalib.createCalibrationProfile(
			buildCalibrationProfilePayload( calibrationPreview.value, { friendlyName, description }),
			dataType,
			CALIBRATION_AXIS_ROLE
		)
		calibrationProfilesSupported.value = true
		calibrationSelectedProfileID.value = String( savedProfile?.profileID ?? "" ).trim()
		calibrationProfileName.value = String( savedProfile?.friendlyName ?? friendlyName ).trim()
		calibrationProfileDescription.value = String( savedProfile?.description ?? description ).trim()
		calibrationProfileSaveModal.value?.close?.()
		await refreshCalibrationProfiles()
	} catch( error ){
		if( isMissingCalibrationProfileApiError( error ) ){
			calibrationProfilesSupported.value = false
		} else {
			console.log( error )
		}
	} finally {
		calibrationProfileSaving.value = false
	}
}

const assignCalibrationProfileToProject = async () => {
	if( project.value?.shared || calibrationAssignmentSaving.value || data.value === null ){
		return
	}

	calibrationAssignmentSaving.value = true

	try{
		if( calibrationProfilesSupported.value ){
			const selectedProfileID = String( calibrationSelectedProfileID.value ?? "" ).trim()
			const assignment = await datalib.setProjectCalibration(
				project.value,
				selectedProfileID.length > 0 ? selectedProfileID : null,
				dataType,
				CALIBRATION_AXIS_ROLE
			)
			applyCalibrationProfileToState( assignment?.profile, {
				profileID: assignment?.profileID,
				friendlyName: assignment?.profile?.friendlyName,
				description: assignment?.profile?.description
			})
			await refreshCalibrationProfiles()
		} else {
			if( canAssignCalibrationProfile.value === false ){
				return
			}

			const nextCalibration = calibrationPreview.value
			const fallbackError = await results.setCalibration( project.value, nextCalibration )
			if( fallbackError instanceof Error ){
				throw fallbackError
			}

			savedCalibrationSnapshot.value = cloneCalibrationModel( nextCalibration )
			data.value.calibration = cloneCalibrationModel( nextCalibration )
			calibration.value = buildCalibrationDraftFromSavedValue( nextCalibration )
			savedCalibrationProfileName.value = String( project.value?.name ?? project.value?.id ?? "Calibration profile" )
			calibrationProfileName.value = savedCalibrationProfileName.value
			savedCalibrationProfileDescription.value = ""
			calibrationProfileDescription.value = ""
			activeCalibrationPreview.value = null
			focusedCalibrationPointID.value = ""
		}

		calibrationPanelOpen.value = false
		calibrating.value = false
		await renderSpectrumLayout()
	} catch( error ){
		if( isMissingCalibrationProfileApiError( error ) ){
			calibrationProfilesSupported.value = false
		} else {
			console.log( error )
		}
	} finally {
		calibrationAssignmentSaving.value = false
	}
}

const toggleCalibration = () => {
	if( project.value?.shared ){
		return
	}

	if( calibrating.value ){
		cancelCalibration()
		return
	}

	void startCalibration()
}

const {
	tutorialPromptVisible,
	tutorialVisible,
	tutorialStepIndex,
	activeTutorialTargetElement,
	activeTutorialStep,
	tutorialSteps,
	tutorialProjectMenuOpenBinding,
	tutorialDisplayOptionsOpenBinding,
	projectMenuClass,
	displayOptionsMenuClass,
	handleTutorialProjectMenuOpenUpdate,
	handleTutorialDisplayOptionsOpenUpdate,
	maybeOfferTutorialPrompt,
	startTutorial,
	restartTutorial,
	skipTutorialPrompt,
	skipActiveTutorial,
	advanceTutorial,
	rewindTutorial,
	resetTutorialState
} = useSpectrumProjectTutorial({
	nextTick,
	project,
	dataType,
	projectMenuDropdown,
	displayOptionsDropdown,
	calibrating,
	calibrationPanelOpen,
	startCalibration: () => startCalibration(),
	cancelCalibration: () => cancelCalibration()
})

const resolvedTutorialSteps = computed(() => {
	if( Array.isArray( tutorialSteps?.value ) ){
		return tutorialSteps.value
	}

	if( Array.isArray( tutorialSteps ) ){
		return tutorialSteps
	}

	return []
})

const tutorialStepCount = computed(() => resolvedTutorialSteps.value.length )

const isFinalTutorialStep = computed(() => {
	return tutorialStepIndex.value >= ( resolvedTutorialSteps.value.length - 1 )
})

const isSelectedComparisonProjectID = ( comparisonID ) => {
	const normalizedComparisonID = String( comparisonID ?? "" ).trim()
	return normalizedComparisonID.length > 0 &&
		comparisonProjectIDs.value.some(( selectedID ) => String( selectedID ?? "" ) === normalizedComparisonID )
}

const setComparisonProjectIDs = ( nextProjectIDs ) => {
	const normalizedProjectIDs = Array.from( new Set(
		( Array.isArray( nextProjectIDs ) ? nextProjectIDs : [] )
			.map(( comparisonID ) => String( comparisonID ?? "" ).trim() )
			.filter(( comparisonID ) => comparisonID.length > 0 && comparisonID !== String( project.value?.id ?? "" ) )
	))

	comparisonProjectIDs.value = normalizedProjectIDs
}

const toggleComparisonProjectID = ( comparisonID ) => {
	if( canCompare.value === false ){
		return
	}

	const normalizedComparisonID = String( comparisonID ?? "" ).trim()
	if( normalizedComparisonID.length === 0 ){
		return
	}

	if( isSelectedComparisonProjectID( normalizedComparisonID ) ){
		setComparisonProjectIDs(
			comparisonProjectIDs.value.filter(( selectedID ) => String( selectedID ?? "" ) !== normalizedComparisonID )
		)
		return
	}

	setComparisonProjectIDs([
		...comparisonProjectIDs.value,
		normalizedComparisonID
	])
}

const clearSelectedComparisonProjectIDs = () => {
	setComparisonProjectIDs([])
}

const updateSpectrumLayoutMode = async ( nextLayoutMode ) => {
	const normalizedLayoutMode = String( nextLayoutMode ?? "" ).trim().toLowerCase()
	const resolvedLayoutMode = normalizedLayoutMode === "horizontal" || normalizedLayoutMode === "single"
		? normalizedLayoutMode
		: "vertical"

	if( spectrumLayoutMode.value === resolvedLayoutMode ){
		return
	}

	const nextSettings = structuredClone( toRaw( settings.value ?? {} ) )
	nextSettings.layout = {
		...( nextSettings.layout ?? {} ),
		layout: resolvedLayoutMode
	}

	settings.value = nextSettings

	const error = await settingslib.set( nextSettings )
	if( error ){
		console.log( error )
	}
}

const ownedProjectActionTooltip = ( action ) => {
	return project.value?.shared ? `${action} is available for owned projects only.` : ""
}

const queueSpectraPaneResponsiveResize = () => {
	if( spectraPaneResizeFrame !== null ){
		cancelAnimationFrame( spectraPaneResizeFrame )
	}

	spectraPaneResizeFrame = requestAnimationFrame(() => {
		spectraPaneResizeFrame = null
		if( singleGraph.value !== null ){
			void plot.resize( singleGraph.value )
		}
		if( topGraph.value !== null ){
			void plot.resize( topGraph.value )
		}
		if( bottomGraph.value !== null ){
			void plot.resize( bottomGraph.value )
		}
	})
}

const applySplitSpectrumLegendVisibility = async () => {
	const operations = []
	const hiddenKeys = activeSplitSpectrumHiddenLegendKeys.value

	if( singleGraph.value !== null ){
		operations.push( plot.setHiddenTraceGroups( singleGraph.value, hiddenKeys ) )
	}

	if( topGraph.value !== null ){
		operations.push( plot.setHiddenTraceGroups( topGraph.value, hiddenKeys ) )
	}

	if( bottomGraph.value !== null ){
		operations.push( plot.setHiddenTraceGroups( bottomGraph.value, hiddenKeys ) )
	}

	await Promise.all( operations )
}

const applySplitSpectrumLegendHighlight = async () => {
	const operations = []
	const highlightedKey = legendHoverEmphasisEnabled.value
		? normalizeLegendKey( hoveredSplitSpectrumLegendKey.value )
		: ""

	if( singleGraph.value !== null ){
		operations.push( plot.setHighlightedTraceGroup( singleGraph.value, highlightedKey ) )
	}

	if( topGraph.value !== null ){
		operations.push( plot.setHighlightedTraceGroup( topGraph.value, highlightedKey ) )
	}

	if( bottomGraph.value !== null ){
		operations.push( plot.setHighlightedTraceGroup( bottomGraph.value, highlightedKey ) )
	}

	await Promise.all( operations )
}

const waitForAnimationFrame = () => {
	return new Promise(( resolve ) => {
		requestAnimationFrame(() => resolve() )
	})
}

const calibrationClickableLegendGroups = new Set([
	splitSpectrumLegendGroups.measurement,
	splitSpectrumLegendGroups.estimateMedian,
	splitSpectrumLegendGroups.estimateQ50,
	splitSpectrumLegendGroups.estimateQ75,
	splitSpectrumLegendGroups.estimateQ90,
	splitSpectrumLegendGroups.estimateQ95
])
const MAX_CALIBRATION_CLICK_DISTANCE_PX = 14
const CALIBRATION_CLICK_DEDUP_WINDOW_MS = 48
const calibrationHoverSelections = new WeakMap()

const buildCalibrationClickSignature = ( graphElement, eventLike ) => {
	const clientX = Number( eventLike?.clientX )
	const clientY = Number( eventLike?.clientY )
	const timeStamp = Number( eventLike?.timeStamp )
	if( Number.isFinite( clientX ) === false || Number.isFinite( clientY ) === false || Number.isFinite( timeStamp ) === false ){
		return null
	}

	return {
		graphElement,
		clientX,
		clientY,
		timeStamp
	}
}

const isDuplicateCalibrationClick = ( signature ) => {
	if( signature === null || lastCalibrationClickSignature === null ){
		return false
	}

	return signature.graphElement === lastCalibrationClickSignature.graphElement &&
		Math.abs( signature.clientX - lastCalibrationClickSignature.clientX ) <= 1 &&
		Math.abs( signature.clientY - lastCalibrationClickSignature.clientY ) <= 1 &&
		Math.abs( signature.timeStamp - lastCalibrationClickSignature.timeStamp ) <= CALIBRATION_CLICK_DEDUP_WINDOW_MS
}

const rememberCalibrationClick = ( signature ) => {
	lastCalibrationClickSignature = signature
}

const axisReferenceToLayoutKey = ( axisReference = "", axisType = "x" ) => {
	const normalizedAxisReference = String( axisReference ?? "" ).trim().toLowerCase()
	const normalizedAxisType = axisType === "y" ? "y" : "x"
	if( normalizedAxisReference.length === 0 || normalizedAxisReference === normalizedAxisType ){
		return `${normalizedAxisType}axis`
	}

	if( normalizedAxisReference.startsWith( normalizedAxisType ) ){
		const suffix = normalizedAxisReference.slice( normalizedAxisType.length )
		return `${normalizedAxisType}axis${suffix}`
	}

	return `${normalizedAxisType}axis`
}

const resolveGraphAxis = ( graphElement, axisReference = "", axisType = "x" ) => {
	const axisKey = axisReferenceToLayoutKey( axisReference, axisType )
	return graphElement?._fullLayout?.[ axisKey ] ?? null
}

const readTracePointDistance = ( tracePoints = [], clickedValue ) => {
	let bestIndex = -1
	let bestDistance = Number.POSITIVE_INFINITY

	for( let index = 0; index < tracePoints.length; index += 1 ){
		const tracePointValue = Number( tracePoints[ index ] )
		if( Number.isFinite( tracePointValue ) === false ){
			continue
		}

		const nextDistance = Math.abs( tracePointValue - clickedValue )
		if( nextDistance < bestDistance ){
			bestDistance = nextDistance
			bestIndex = index
		}
	}

	return bestIndex
}

const resolveCalibrationPointIndex = ( selectedPoint, selectedTrace ) => {
	const candidateIndices = [
		selectedPoint?.pointIndex,
		selectedPoint?.pointNumber,
		selectedPoint?.i
	]
	const tracePointCount = Array.isArray( selectedTrace?.customdata )
		? selectedTrace.customdata.length
		: Array.isArray( selectedTrace?.x )
			? selectedTrace.x.length
			: 0

	for( const candidateIndex of candidateIndices ){
		const normalizedIndex = Number( candidateIndex )
		if( Number.isInteger( normalizedIndex ) && normalizedIndex >= 0 && ( tracePointCount === 0 || normalizedIndex < tracePointCount ) ){
			return normalizedIndex
		}
	}

	const selectedX = Number( selectedPoint?.x )
	if( Number.isFinite( selectedX ) && Array.isArray( selectedTrace?.x ) ){
		const matchingIndex = selectedTrace.x.findIndex(( traceX ) => Math.abs( Number( traceX ) - selectedX ) < 1e-9 )
		if( matchingIndex >= 0 ){
			return matchingIndex
		}
	}

	return null
}

const resolveCalibrationSourceXFromPoint = ( selectedPoint, selectedTrace ) => {
	const directCustomData = Number( selectedPoint?.customdata )
	if( Number.isFinite( directCustomData ) ){
		return directCustomData
	}

	const pointIndex = resolveCalibrationPointIndex( selectedPoint, selectedTrace )
	if( pointIndex === null ){
		return null
	}

	const traceCustomDataValue = Number( selectedTrace?.customdata?.[ pointIndex ] )
	if( Number.isFinite( traceCustomDataValue ) ){
		return traceCustomDataValue
	}

	const calibrationSource = String( selectedTrace?.meta?.harkanaCalibrationSource ?? "" ).trim()
	if( calibrationSource === "measurement" ){
		return Number.isFinite( Number( data.value?.x?.[pointIndex] ) ) ? Number( data.value.x[pointIndex] ) : null
	}

	if( calibrationSource === "estimate" ){
		return Number.isFinite( Number( estimate.value?.x?.[pointIndex] ) ) ? Number( estimate.value.x[pointIndex] ) : null
	}

	return null
}

const resolveCalibrationSelection = ( eventData ) => {
	const candidatePoints = Array.isArray( eventData?.points ) ? eventData.points : []
	for( const selectedPoint of candidatePoints ){
		const selectedTrace = selectedPoint?.data ?? selectedPoint?.fullData ?? null
		const legendGroup = typeof selectedTrace?.legendgroup === "string" ? selectedTrace.legendgroup.trim() : ""
		if( calibrationClickableLegendGroups.has( legendGroup ) === false ){
			continue
		}

		const sourceX = resolveCalibrationSourceXFromPoint( selectedPoint, selectedTrace )
		if( Number.isFinite( sourceX ) ){
			return { sourceX, selectedPoint, selectedTrace }
		}
	}

	return null
}

const resolveCalibrationSelectionFromGraphClick = ( graphElement, event ) => {
	if( graphElement === null || event === null || event === undefined ){
		return null
	}

	const fullLayout = graphElement?._fullLayout ?? null
	const plotRect = typeof graphElement.getBoundingClientRect === "function"
		? graphElement.getBoundingClientRect()
		: null
	if( fullLayout === null || plotRect === null ){
		return null
	}

	const relativeX = event.clientX - plotRect.left
	const relativeY = event.clientY - plotRect.top
	const traces = Array.isArray( graphElement.data ) ? graphElement.data : []
	const lowerBandTraceByLegendGroup = new Map()

	for( const trace of traces ){
		const legendGroup = typeof trace?.legendgroup === "string" ? trace.legendgroup.trim() : ""
		const traceKind = String( trace?.meta?.harkanaTraceKind ?? "" ).trim()
		if( calibrationClickableLegendGroups.has( legendGroup ) && traceKind === "band-line" ){
			lowerBandTraceByLegendGroup.set( legendGroup, trace )
		}
	}

	let bestSelection = null

	for( const trace of traces ){
		const legendGroup = typeof trace?.legendgroup === "string" ? trace.legendgroup.trim() : ""
		if( calibrationClickableLegendGroups.has( legendGroup ) === false ){
			continue
		}
		if( trace?.visible === false || trace?.visible === "legendonly" ){
			continue
		}

		const xAxis = resolveGraphAxis( graphElement, trace?.xaxis, "x" )
		const yAxis = resolveGraphAxis( graphElement, trace?.yaxis, "y" )
		if( xAxis === null || yAxis === null || typeof xAxis.p2d !== "function" || typeof xAxis.d2p !== "function" || typeof yAxis.d2p !== "function" ){
			continue
		}

		const plotLeft = Number( xAxis._offset ?? 0 )
		const plotTop = Number( yAxis._offset ?? 0 )
		const plotRight = plotLeft + Number( xAxis._length ?? 0 )
		const plotBottom = plotTop + Number( yAxis._length ?? 0 )
		if( relativeX < plotLeft || relativeX > plotRight || relativeY < plotTop || relativeY > plotBottom ){
			continue
		}

		const clickedXValue = Number( xAxis.p2d( relativeX - plotLeft ) )
		if( Number.isFinite( clickedXValue ) === false ){
			continue
		}

		const displayedXValues = Array.isArray( trace?.x ) ? trace.x : []
		const sourceXValues = Array.isArray( trace?.customdata ) ? trace.customdata : displayedXValues
		const yValues = Array.isArray( trace?.y ) ? trace.y : []
		if( displayedXValues.length === 0 || sourceXValues.length === 0 || yValues.length === 0 ){
			continue
		}

		const nearestIndex = readTracePointDistance( displayedXValues, clickedXValue )
		if( nearestIndex < 0 ){
			continue
		}

		const sourceX = Number( sourceXValues[ nearestIndex ] )
		const displayedX = Number( displayedXValues[ nearestIndex ] )
		if( Number.isFinite( sourceX ) === false || Number.isFinite( displayedX ) === false ){
			continue
		}

		const projectedX = Number( xAxis.d2p( displayedX ) ) + plotLeft
		const horizontalDistance = Math.abs( relativeX - projectedX )
		if( horizontalDistance > MAX_CALIBRATION_CLICK_DISTANCE_PX ){
			continue
		}

		const traceKind = String( trace?.meta?.harkanaTraceKind ?? "" ).trim()
		let verticalDistance = Number.POSITIVE_INFINITY

		if( traceKind === "band-fill" ){
			const lowerBandTrace = lowerBandTraceByLegendGroup.get( legendGroup ) ?? null
			const lowerY = Number( lowerBandTrace?.y?.[ nearestIndex ] )
			const upperY = Number( yValues[ nearestIndex ] )
			if( Number.isFinite( lowerY ) === false || Number.isFinite( upperY ) === false ){
				continue
			}

			const lowerPixel = Number( yAxis.d2p( lowerY ) ) + plotTop
			const upperPixel = Number( yAxis.d2p( upperY ) ) + plotTop
			const bandTop = Math.min( lowerPixel, upperPixel )
			const bandBottom = Math.max( lowerPixel, upperPixel )
			if( relativeY < bandTop ){
				verticalDistance = bandTop - relativeY
			}else if( relativeY > bandBottom ){
				verticalDistance = relativeY - bandBottom
			}else{
				verticalDistance = 0
			}
		}else{
			const displayedY = Number( yValues[ nearestIndex ] )
			if( Number.isFinite( displayedY ) === false ){
				continue
			}

			const projectedY = Number( yAxis.d2p( displayedY ) ) + plotTop
			verticalDistance = Math.abs( relativeY - projectedY )
		}

		const score = horizontalDistance + verticalDistance
		if( Number.isFinite( score ) === false ){
			continue
		}

		if( bestSelection === null || score < bestSelection.score ){
			bestSelection = {
				sourceX,
				score
			}
		}
	}

	return bestSelection
}

const applyCalibrationSelection = ( sourceX ) => {
	if( Number.isFinite( sourceX ) === false ){
		return
	}

	const existingPoint = calibration.value.points.find(( point ) => Math.abs( Number( point.sourceX ) - sourceX ) < 1e-9 ) ?? null
	if( existingPoint !== null ){
		focusedCalibrationPointID.value = existingPoint.id
		calibrationPanelOpen.value = true
		return
	}

	calibrationDraftPointCounter.value += 1
	const nextPoint = {
		id: `calibration-point-${calibrationDraftPointCounter.value}`,
		sourceX,
		targetInput: String( sourceX )
	}

	calibration.value = {
		...calibration.value,
		points: [ ...calibration.value.points, nextPoint ]
	}

	focusedCalibrationPointID.value = nextPoint.id
	calibrationPanelOpen.value = true
}

const detachCalibrationPlotClickListeners = () => {
	const graphElements = [ singleGraph.value, topGraph.value, bottomGraph.value ]

	for( const graphElement of graphElements ){
		if( graphElement === null ) continue

		if( typeof graphElement.removeListener === "function" ){
			if( calibrationPlotHoverHandler !== null ){
				graphElement.removeListener( "plotly_hover", calibrationPlotHoverHandler )
			}
			if( calibrationPlotUnhoverHandler !== null ){
				graphElement.removeListener( "plotly_unhover", calibrationPlotUnhoverHandler )
			}
		}

		if( calibrationGraphClickFallbackHandler !== null ){
			graphElement.removeEventListener( "click", calibrationGraphClickFallbackHandler )
		}

		calibrationHoverSelections.delete( graphElement )
	}

	lastCalibrationClickSignature = null
}

const syncCalibrationHoverSelection = ( graphElement, eventData ) => {
	if( graphElement === null ){
		return
	}

	const selection = resolveCalibrationSelection( eventData )
	if( selection === null ){
		calibrationHoverSelections.delete( graphElement )
		return
	}

	calibrationHoverSelections.set( graphElement, selection )
}

const handleCalibrationGraphClickFallback = ( graphElement, event ) => {
	if( calibrating.value === false || graphElement === null ){
		return
	}

	const clickSignature = buildCalibrationClickSignature( graphElement, event )
	if( isDuplicateCalibrationClick( clickSignature ) ){
		return
	}

	if( event?.target instanceof Element && event.target.closest( ".modebar" ) !== null ){
		return
	}

	const directSelection = resolveCalibrationSelectionFromGraphClick( graphElement, event )
	if( directSelection !== null ){
		rememberCalibrationClick( clickSignature )
		applyCalibrationSelection( directSelection.sourceX )
		return
	}

	const selection = calibrationHoverSelections.get( graphElement ) ??
		resolveCalibrationSelection({ points: graphElement?._hoverdata }) ??
		null
	if( selection === null ){
		return
	}

	rememberCalibrationClick( clickSignature )
	applyCalibrationSelection( selection.sourceX )
}

const syncCalibrationPlotClickListeners = () => {
	detachCalibrationPlotClickListeners()

	if( calibrating.value === false ){
		calibrationPlotClickHandler = null
		calibrationPlotHoverHandler = null
		calibrationPlotUnhoverHandler = null
		calibrationGraphClickFallbackHandler = null
		return
	}

	const graphElements = [ singleGraph.value, topGraph.value, bottomGraph.value ]
	calibrationPlotHoverHandler = function( eventData ){
		syncCalibrationHoverSelection( this ?? null, eventData )
	}
	calibrationPlotUnhoverHandler = function(){
		if( this !== null && this !== undefined ){
			calibrationHoverSelections.delete( this )
		}
	}
	calibrationGraphClickFallbackHandler = function( event ){
		handleCalibrationGraphClickFallback( this ?? null, event )
	}

	for( const graphElement of graphElements ){
		if( graphElement === null ) continue
		if( typeof graphElement.on === "function" ){
			graphElement.on( "plotly_hover", calibrationPlotHoverHandler )
			graphElement.on( "plotly_unhover", calibrationPlotUnhoverHandler )
		}
		graphElement.addEventListener( "click", calibrationGraphClickFallbackHandler )
	}
}

const stopCalibrationPulse = () => {
	if( calibrationPulseInterval !== null ){
		clearInterval( calibrationPulseInterval )
		calibrationPulseInterval = null
	}

	calibrationPulsePhase.value = 0
}

const syncCalibrationPulse = () => {
	stopCalibrationPulse()

	if( calibrating.value === false || focusedCalibrationPointID.value.length === 0 ){
		return
	}

	let phase = 0
	calibrationPulseInterval = setInterval(() => {
		phase += Math.PI / 10
		calibrationPulsePhase.value = phase
	}, 100 )
}

const updateCalibrationPointTarget = ( payload = {} ) => {
	const pointID = String( payload?.id ?? "" ).trim()
	if( pointID.length === 0 ){
		return
	}

	calibration.value = {
		...calibration.value,
		points: calibration.value.points.map(( point ) => {
			if( point.id !== pointID ){
				return point
			}

			return {
				...point,
				targetInput: String( payload?.value ?? "" )
			}
		})
	}
}

const updateCalibrationPolynomialOrder = ( value ) => {
	const requestedOrder = Math.trunc( Number( value ) )
	const nextOrder = Number.isFinite( requestedOrder )
		? Math.min( Math.max( requestedOrder, 0 ), calibrationMaxOrder.value )
		: 0
	const currentOrder = Math.max( Math.trunc( Number( calibration.value.polynomialOrder ) ), 0 )
	const currentIncludedOrders = Array.isArray( calibration.value.includedOrders ) ? calibration.value.includedOrders : [ currentOrder ]
	const nextIncludedOrderCandidates = currentIncludedOrders.filter(( order ) => Number( order ) <= nextOrder )

	if( nextOrder > currentOrder ){
		for( let order = currentOrder + 1; order <= nextOrder; order++ ){
			nextIncludedOrderCandidates.push( order )
		}
	}

	calibration.value = {
		...calibration.value,
		polynomialOrder: nextOrder,
		includedOrders: normalizeDraftIncludedOrders( nextIncludedOrderCandidates, nextOrder )
	}
}

const toggleCalibrationIncludedOrder = ( value ) => {
	const order = Math.trunc( Number( value ) )
	if( Number.isInteger( order ) === false ){
		return
	}

	const currentOrder = Math.max( Math.trunc( Number( calibration.value.polynomialOrder ) ), 0 )
	if( order < 0 || order > currentOrder || order === currentOrder ){
		return
	}

	const currentIncludedOrders = Array.isArray( calibration.value.includedOrders ) ? calibration.value.includedOrders : [ currentOrder ]
	const nextIncludedOrders = currentIncludedOrders.includes( order )
		? currentIncludedOrders.filter(( includedOrder ) => Number( includedOrder ) !== order )
		: [ ...currentIncludedOrders, order ]

	calibration.value = {
		...calibration.value,
		includedOrders: normalizeDraftIncludedOrders( nextIncludedOrders, currentOrder )
	}
}

const removeCalibrationPoint = ( pointID ) => {
	const normalizedPointID = String( pointID ?? "" ).trim()
	if( normalizedPointID.length === 0 ){
		return
	}

	calibration.value = {
		...calibration.value,
		points: calibration.value.points.filter(( point ) => point.id !== normalizedPointID )
	}

	if( focusedCalibrationPointID.value === normalizedPointID ){
		focusedCalibrationPointID.value = ""
	}

	if( calibration.value.polynomialOrder > calibrationMaxOrder.value ){
		calibration.value = {
			...calibration.value,
			polynomialOrder: calibrationMaxOrder.value,
			includedOrders: normalizeDraftIncludedOrders( calibration.value.includedOrders, calibrationMaxOrder.value )
		}
	}
}

const setFocusedCalibrationPointID = ( pointID ) => {
	focusedCalibrationPointID.value = String( pointID ?? "" ).trim()
}

const syncUntouchedSplitPanePrimarySize = () => {
	if( usesSplitSpectrumLayout.value === false || splitPanePrimarySizeTouched.value ){
		return
	}

	const nextSize = defaultSplitPanePrimarySize()
	if( Number.isFinite( nextSize ) === false || nextSize <= 0 ){
		return
	}

	splitPanePrimarySize.value = nextSize
}

const prepareSplitPaneLayoutForRender = async ( options = {} ) => {
	if( usesSplitSpectrumLayout.value === false ){
		return
	}

	if( options?.forceDefault === true ){
		ensureSplitPanePrimarySize({ forceDefault: true })
	}

	await nextTick()
	await waitForAnimationFrame()
	syncUntouchedSplitPanePrimarySize()
	await nextTick()
}

const disconnectSpectraPaneResizeObserver = () => {
	if( spectraPaneContainerResizeObserver === null ){
		return
	}

	spectraPaneContainerResizeObserver.disconnect()
	spectraPaneContainerResizeObserver = null
}

const connectSpectraPaneResizeObserver = () => {
	disconnectSpectraPaneResizeObserver()

	if( usesSplitSpectrumLayout.value === false || spectraPaneContainer.value === null ){
		return
	}

	if( typeof ResizeObserver !== "function" ){
		return
	}

	spectraPaneContainerResizeObserver = new ResizeObserver(() => {
		syncUntouchedSplitPanePrimarySize()
		queueSpectraPaneResponsiveResize()
	})

	spectraPaneContainerResizeObserver.observe( spectraPaneContainer.value )
	syncUntouchedSplitPanePrimarySize()
}

const stopSpectraPaneResize = () => {

	if( spectraPaneResizeSession === null ){
		return
	}

	window.removeEventListener( "pointermove", spectraPaneResizeSession.onPointerMove )
	window.removeEventListener( "pointerup", spectraPaneResizeSession.onPointerUp )
	window.removeEventListener( "pointercancel", spectraPaneResizeSession.onPointerUp )

	spectraPaneResizeSession = null
}

const startSpectraPaneResize = ( event ) => {

	if( usesSplitSpectrumLayout.value === false ){
		return
	}

	stopSpectraPaneResize()

	const startHeight = ensureSplitPanePrimarySize()
	const startY = splitPaneIsVertical.value
		? Number( event.clientY )
		: Number( event.clientX )

	if( Number.isFinite( startY ) === false ){
		return
	}

	const onPointerMove = ( moveEvent ) => {

		const currentY = splitPaneIsVertical.value
			? Number( moveEvent.clientY )
			: Number( moveEvent.clientX )
		if( Number.isFinite( currentY ) === false ){
			return
		}

		splitPanePrimarySize.value = clampSplitPanePrimarySize( startHeight + ( currentY - startY ))
		queueSpectraPaneResponsiveResize()
	}

	const onPointerUp = () => {
		stopSpectraPaneResize()
		queueSpectraPaneResponsiveResize()
	}

	spectraPaneResizeSession = {
		onPointerMove,
		onPointerUp
	}

	splitPanePrimarySizeTouched.value = true

	window.addEventListener( "pointermove", onPointerMove )
	window.addEventListener( "pointerup", onPointerUp )
	window.addEventListener( "pointercancel", onPointerUp )

	event.preventDefault()
}

const renderSplitSpectrumLayout = async () => {

	if( topGraph.value === null || data.value === null || settings.value === null ){
		return
	}

	const renderedData = buildRenderedSpectrumData()
	if( renderedData === null ){
		return
	}

	if( comparisonPlotsVisible.value ){
		await plot.renderMeasurementComparisonPane(
			renderedData,
			toRaw( comparisonEntries.value ),
			topGraph.value,
			settings.value,
			{ calibrationPreview: toRaw( calibrationPreviewOverlay.value ) }
		)
	} else {
		await plot.renderMeasurementPane(
			renderedData,
			topGraph.value,
			settings.value,
			{ calibrationPreview: toRaw( calibrationPreviewOverlay.value ) }
		)
	}

	if( hasEstimate.value && bottomGraph.value !== null ){
		if( comparisonPlotsVisible.value ){
			await plot.renderEstimateComparisonPane(
				renderedData,
				toRaw( estimate.value ),
				toRaw( comparisonEntries.value ),
				bottomGraph.value,
				settings.value,
				{ calibrationPreview: toRaw( calibrationPreviewOverlay.value ) }
			)
		} else {
			await plot.renderEstimatePane(
				renderedData,
				toRaw( estimate.value ),
				bottomGraph.value,
				settings.value,
				{ calibrationPreview: toRaw( calibrationPreviewOverlay.value ) }
			)
		}
	}

	await applySplitSpectrumLegendVisibility()
	await applySplitSpectrumLegendHighlight()
}

const renderSingleSpectrumLayout = async () => {

	if( singleGraph.value === null || data.value === null || settings.value === null ){
		return
	}

	const renderedData = buildRenderedSpectrumData()
	if( renderedData === null ){
		return
	}

	if( comparisonPlotsVisible.value && hasEstimate.value ){
		await plot.comparison(
			renderedData,
			toRaw( estimate.value ),
			toRaw( comparisonEntries.value ),
			singleGraph.value,
			settings.value,
			{ calibrationPreview: toRaw( calibrationPreviewOverlay.value ) }
		)
		return
	}

	await plot.initialize(
		renderedData,
		hasEstimate.value ? toRaw( estimate.value ) : null,
		singleGraph.value,
		settings.value,
		{ calibrationPreview: toRaw( calibrationPreviewOverlay.value ) }
	)

	await applySplitSpectrumLegendVisibility()
	await applySplitSpectrumLegendHighlight()
}

const renderSpectrumLayout = async () => {

	if( usesSplitSpectrumLayout.value ){
		await renderSplitSpectrumLayout()
	} else {
		await renderSingleSpectrumLayout()
	}

	queueSpectraPaneResponsiveResize()

	if( calibrating.value ){
		await syncCalibrationReferenceLines()
	}

	syncCalibrationPlotClickListeners()
}

const syncCalibrationReferenceLines = async () => {
	const operations = []
	const referenceLines = calibrationReferenceLines.value

	if( usesSplitSpectrumLayout.value === false ){
		if( singleGraph.value !== null ){
			operations.push(
				calibrating.value
					? plot.showCalibrationLines( referenceLines, singleGraph.value, settings.value )
					: plot.deleteMarker( singleGraph.value )
			)
		}

		await Promise.all( operations )
		return
	}

	if( topGraph.value !== null ){
		operations.push(
			calibrating.value
				? plot.showCalibrationLines( referenceLines, topGraph.value, settings.value )
				: plot.deleteMarker( topGraph.value )
		)
	}

	if( bottomGraph.value !== null ){
		operations.push(
			calibrating.value
				? plot.showCalibrationLines( referenceLines, bottomGraph.value, settings.value )
				: plot.deleteMarker( bottomGraph.value )
		)
	}

	await Promise.all( operations )
}

const handleWindowResize = () => {
	if( usesSplitSpectrumLayout.value ){
		if( splitPanePrimarySizeTouched.value ){
			splitPanePrimarySize.value = clampSplitPanePrimarySize( splitPanePrimarySize.value )
		}
	}

	queueSpectraPaneResponsiveResize()
}

const clearEstimatePollTimeout = () => {
	if( estimatePollTimeout !== null ){
		clearTimeout( estimatePollTimeout )
		estimatePollTimeout = null
	}
}

const projectEstimateItemSucceeded = ( status ) => {
	const items = Array.isArray( status?.items ) ? status.items : []
	const item = items.find(( candidate ) => String( candidate?.projectID ?? "" ) === String( project.value?.id ?? "" ))
	return item?.status === "SUCCEEDED"
}

const projectEstimateItemFailed = ( status ) => {
	const items = Array.isArray( status?.items ) ? status.items : []
	const item = items.find(( candidate ) => String( candidate?.projectID ?? "" ) === String( project.value?.id ?? "" ))
	return item?.status === "FAILED"
}

const loadEstimateIfAvailable = async () => {
	const loadedEstimate = await results.load( project.value, "estimate" )
	if( loadedEstimate instanceof Error ){
		return false
	}

	estimate.value = loadedEstimate
	await nextTick()
	await renderSpectrumLayout()
	return true
}

const pollEstimateJobStatus = async () => {
	clearEstimatePollTimeout()

	const jobId = projectEstimateJobId.value
	if( jobId.length === 0 || hasEstimate.value ){
		return
	}

	try{
		const status = await projectlib.singleSpectrumEstimateJobStatus( jobId )
		estimateJobStatus.value = status
		project.value = await projectlib.updateSingleSpectrumEstimateState( project.value, status )

		if( projectEstimateItemSucceeded( status )){
			const loaded = await loadEstimateIfAvailable()
			if( loaded ){
				return
			}

			estimatePollTimeout = setTimeout(() => {
				void pollEstimateJobStatus()
			}, 5000 )
			return
		}

		if( projectEstimateItemFailed( status )){
			estimateJobError.value = String( activeEstimateItem.value?.errorMessage ?? status?.errorMessage ?? "Estimate job failed." )
			return
		}

		if( estimateTerminalStatuses.has( String( status?.status ?? "" )) === false ){
			estimatePollTimeout = setTimeout(() => {
				void pollEstimateJobStatus()
			}, 5000 )
		}
	} catch( error ){
		console.log( error )
		estimatePollTimeout = setTimeout(() => {
			void pollEstimateJobStatus()
		}, 10000 )
	}
}

watch( [ comparisonProjectIDs, hasEstimate ], async () => {

	const loadToken = comparisonLoadToken + 1
	comparisonLoadToken = loadToken

	if( hasEstimate.value === false || comparisonProjectIDs.value.length === 0 ){
		comparisonEntries.value = []
		await nextTick()
		await renderSpectrumLayout()
		return
	}

	const requestedProjectIDs = comparisonProjectIDs.value.filter(( comparisonID ) => {
		return String( comparisonID ?? "" ).trim().length > 0 &&
			String( comparisonID ?? "" ) !== String( project.value?.id ?? "" )
	})

	const loadedEntries = await Promise.all(
		requestedProjectIDs.map( async ( comparisonID, index ) => {
			const comparisonProject = projects.value?.[ comparisonID ]
			if( comparisonProject === undefined ){
				return null
			}

			const [ comparisonData, comparisonEstimate, comparisonCalibration ] = await Promise.all([
				results.load( comparisonProject, "data" ),
				results.load( comparisonProject, "estimate" ),
				results.load( comparisonProject, "calibration" )
			])

			if( comparisonData instanceof Error || comparisonEstimate instanceof Error ){
				return null
			}

			if( comparisonCalibration instanceof Error === false ){
				comparisonData.calibration = comparisonCalibration
			}

			return {
				projectID: comparisonID,
				projectName: String( comparisonProject?.name ?? comparisonID ?? "Comparison project" ).trim() || "Comparison project",
				color: comparisonProjectColorByID.value?.[ comparisonID ] ?? resolveComparisonProjectColor( index ),
				data: comparisonData,
				estimate: comparisonEstimate
			}
		})
	)

	if( comparisonLoadToken !== loadToken ){
		return
	}

	const nextEntries = loadedEntries.filter(( entry ) => entry !== null )
	const nextValidProjectIDs = nextEntries.map(( entry ) => entry.projectID )
	const requestedKey = requestedProjectIDs.join( "|" )
	const validKey = nextValidProjectIDs.join( "|" )

	comparisonEntries.value = nextEntries

	if( requestedKey !== validKey ){
		setComparisonProjectIDs( nextValidProjectIDs )
		return
	}

	await nextTick()
	await renderSpectrumLayout()

}, { deep: true })

watch( comparisonEntries, async () => {
	reconcileComparisonLegendHiddenKeys()
	await applySplitSpectrumLegendVisibility()
}, { deep: true, flush: "post" })

watch( calibrationMaxOrder, ( nextMaxOrder ) => {
	const normalizedIncludedOrders = normalizeDraftIncludedOrders( calibration.value.includedOrders, Math.min( calibration.value.polynomialOrder, nextMaxOrder ) )
	const includedOrdersChanged =
		normalizedIncludedOrders.length !== ( Array.isArray( calibration.value.includedOrders ) ? calibration.value.includedOrders.length : 0 ) ||
		normalizedIncludedOrders.some(( order, index ) => order !== calibration.value.includedOrders?.[index] )

	if( calibration.value.polynomialOrder <= nextMaxOrder && includedOrdersChanged === false ){
		return
	}

	calibration.value = {
		...calibration.value,
		polynomialOrder: Math.min( calibration.value.polynomialOrder, nextMaxOrder ),
		includedOrders: normalizedIncludedOrders
	}
})

watch( calibrating, async () => {
	await renderSpectrumLayout()
})

watch( [ calibrating, focusedCalibrationPointID ], () => {
	syncCalibrationPulse()
}, { flush: "post" })

watch( activeSplitSpectrumHiddenLegendKeys, async () => {
	await applySplitSpectrumLegendVisibility()
}, { flush: "post" })

watch( hoveredSplitSpectrumLegendKey, async () => {
	await applySplitSpectrumLegendHighlight()
}, { flush: "post" })

watch( legendHoverEmphasisEnabled, async () => {
	await applySplitSpectrumLegendHighlight()
}, { flush: "post" })

watch( splitSpectrumLegendEntries, ( entries ) => {
	const currentKey = normalizeLegendKey( hoveredSplitSpectrumLegendKey.value )
	if( currentKey.length === 0 ){
		return
	}

	const hasCurrentEntry = Array.isArray( entries ) && entries.some(( entry ) => entry?.key === currentKey )
	if( hasCurrentEntry === false ){
		hoveredSplitSpectrumLegendKey.value = ""
	}
}, { flush: "post" })

watch( spectrumLayoutMode, async ( nextMode, previousMode ) => {
	if( previousMode === undefined || nextMode === previousMode ){
		return
	}

	stopSpectraPaneResize()
	hoveredSplitSpectrumLegendKey.value = ""

	await nextTick()
	connectSpectraPaneResizeObserver()
	await prepareSplitPaneLayoutForRender({ forceDefault: true })
	await renderSpectrumLayout()
})

watch( [calibrationReferenceLines, calibrating], async () => {
	await syncCalibrationReferenceLines()
}, { deep: true })

const isActiveSpectrumProjectLoad = ( requestID ) => {
	return requestID === activeSpectrumProjectLoadRequestID.value
}

const hydrateInitialSpectrumEstimate = async ( requestID ) => {
	const loadedEstimate = await results.load( project.value, "estimate" )
	if( isActiveSpectrumProjectLoad( requestID ) === false ) return

	estimate.value = loadedEstimate
	await renderSpectrumLayout()

	if( hasEstimate.value === false && projectEstimateJobId.value.length > 0 ){
		void pollEstimateJobStatus()
	}
}

const hydrateInitialSpectrumCalibration = async ( requestID ) => {
	const loadedAssignedCalibration = await loadAssignedCalibration()
	if( isActiveSpectrumProjectLoad( requestID ) === false ) return

	if( loadedAssignedCalibration === false ){
		const loadedCalibration = await results.load( project.value, "calibration" )
		if( isActiveSpectrumProjectLoad( requestID ) === false ) return

		savedCalibrationSnapshot.value = loadedCalibration instanceof Error
			? normalizeCalibrationModel({ x: 0, polynomialOrder: 0, includedOrders: [ 0 ], points: [] })
			: normalizeCalibrationModel( loadedCalibration )
		data.value.calibration = cloneCalibrationModel( savedCalibrationSnapshot.value )
		savedCalibrationProfileName.value = String( project.value?.name ?? project.value?.id ?? "Calibration profile" )
		calibrationProfileName.value = String( project.value?.name ?? project.value?.id ?? "Calibration profile" )
		savedCalibrationProfileDescription.value = ""
		calibrationProfileDescription.value = ""
		syncCalibrationDraftFromSavedData()
	}

	await renderSpectrumLayout()
}

const hydrateDeferredSpectrumProjectState = async ( requestID ) => {
	const deferredTasks = [
		hydrateInitialSpectrumEstimate( requestID ),
		hydrateInitialSpectrumCalibration( requestID )
	]

	await Promise.allSettled( deferredTasks )
	if( isActiveSpectrumProjectLoad( requestID ) === false ) return

	if( project.value?.shared === false && calibrationProfilesSupported.value ){
		void refreshCalibrationProfiles()
	}

	markViewerLoad( "spectrum:deferred-ready", { projectID: String( project.value?.id ?? "" ) })
	maybeOfferTutorialPrompt()
}

onMounted( async () => {

    try{
		const requestID = activeSpectrumProjectLoadRequestID.value + 1
		activeSpectrumProjectLoadRequestID.value = requestID
		markViewerLoad( "spectrum:route-mounted", { projectID: String( projectID ?? "" ) })

        const [ savedSettings, listedProjects ] = await Promise.all([
			settingslib.get(),
			projectlib.list()
		])

        settings.value = savedSettings;
		seedSplitSpectrumLegendVisibility()
        projects.value = listedProjects;
        project.value = projects.value[ projectID ];
		markViewerLoad( "spectrum:project-metadata-ready", { projectID: String( project.value?.id ?? "" ) })

		data.value = await results.load( project.value, "data");
		markViewerLoad( "spectrum:first-data-ready", { projectID: String( project.value?.id ?? "" ) })

        await nextTick()
		window.addEventListener( "resize", handleWindowResize )
		connectSpectraPaneResizeObserver()
		await prepareSplitPaneLayoutForRender()
		markViewerLoad( "spectrum:first-plot-render-start", { projectID: String( project.value?.id ?? "" ) })
        await renderSpectrumLayout()
		markViewerLoad( "spectrum:first-plot-render-end", { projectID: String( project.value?.id ?? "" ) })
		measureViewerLoad(
			"spectrum:first-plot-render",
			"spectrum:first-plot-render-start",
			"spectrum:first-plot-render-end"
		)
		emit("loaded")

		void hydrateDeferredSpectrumProjectState( requestID )

    } catch( error ){
		console.log( error )
        navigation.route("Main menu", {})
    }
})

onBeforeUnmount(() => {
	activeSpectrumProjectLoadRequestID.value += 1
	clearEstimatePollTimeout()
	detachCalibrationPlotClickListeners()
	stopCalibrationPulse()
	resetTutorialState()
	stopSpectraPaneResize()
	disconnectSpectraPaneResizeObserver()
	window.removeEventListener( "resize", handleWindowResize )
	if( spectraPaneResizeFrame !== null ){
		cancelAnimationFrame( spectraPaneResizeFrame )
		spectraPaneResizeFrame = null
	}
})

</script>
