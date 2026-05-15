<template>
<!-- Outer frame -->
<div class="bg-brand min-h-screen p-[2px] overflow-hidden">

	<!-- Mobile overlay -->
	<div v-if = "sidebarOpen" @click = "sidebarOpen = false" class = "fixed inset-0 bg-black/40 z-30 md:hidden"></div>
	<!-- App Grid -->
	<div class="grid h-[calc(100vh-4px)] gap-[2px] grid-cols-1 grid-rows-[auto_1fr] md:grid-cols-[16rem_1fr] md:grid-rows-[auto_1fr]"
		 data-tutorial = "viewer-layout">

			<Sidebar :style = "sidebarStyle">
				<Logo></Logo>

				<div v-if = "sidebarInferenceStatusText.length > 0"
					 class = "mt-2 flex items-center gap-2 rounded-lg border border-brand/60 bg-gray-800 px-3 py-2 text-sm text-white"
					 aria-live = "polite">
					<Spinner class = "h-4 w-4 shrink-0 text-brand"></Spinner>
					<span>{{ sidebarInferenceStatusText }}</span>
				</div>

				<div class = "mt-2 p-2 shadow-md shadow-black border-2 border-gray bg-gray-800 rounded-lg"
					 data-tutorial = "display-section">
					<div class = "flex items-center justify-between gap-1 mb-2">
						<div class = "flex min-w-0 items-center gap-1">
							<span class = "inline-flex h-5 w-5 items-center justify-center text-white" aria-hidden = "true">
								<i class = "fas fa-layer-group text-sm"></i>
							</span>
							<h3 class = "text-white font-semibold whitespace-nowrap">Display</h3>
							<span v-if = "showDisplayInfoIcon"
								  ref = "displayInfoTrigger"
								  class = "relative inline-flex items-center"
								  @mouseenter = "showDisplayInfoTooltipOverlay"
								  @mouseleave = "hideDisplayInfoTooltipOverlay">
								<span class = "inline-flex h-4 w-4 items-center justify-center text-xs text-white/70 cursor-help">
									<i class = "fas fa-info-circle" aria-hidden = "true"></i>
								</span>
							</span>
						</div>

						<div data-tutorial = "display-options">
						<BaseDropdown ref = "displayOptionsDropdown"
									  :open = "tutorialDisplayOptionsOpenBinding"
									  @update:open = "handleTutorialDisplayOptionsOpenUpdate"
									  :show-chevron = "false"
									  :close-on-select = "true"
									  :teleport-to-body = "true"
									  trigger-class = "h-8 w-8 inline-flex items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand"
									  :menu-class = "displayOptionsMenuClass">
							<template v-slot:trigger>
								<span class = "sr-only">Display options</span>
								<i class = "fas fa-ellipsis-v" aria-hidden = "true" title = "Display options"></i>
							</template>

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
									Selection uncertainty level
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

								<li><hr class = "h-0.5 bg-gray border-0"></li>
								<li class = "px-4 pt-2 pb-1 text-xs uppercase tracking-wide text-white/70">
									Legend hover emphasis
								</li>
								<li>
									<button @click = "setLegendHoverEmphasisEnabled( true )"
											class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
										<span>Enabled</span>
										<i :class = "legendHoverEmphasisEnabled ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
										   aria-hidden = "true"></i>
									</button>
								</li>
								<li>
									<button @click = "setLegendHoverEmphasisEnabled( false )"
											class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
										<span>Disabled</span>
										<i :class = "legendHoverEmphasisEnabled === false ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
										   aria-hidden = "true"></i>
									</button>
								</li>
							</BaseDropdown>
							</div>
						</div>

						<div data-tutorial = "display-select">
							<FloatingLabelSelect ref = "displaySelectDropdown"
											   :model-value = "activePlot"
											   @update:model-value = "setActiveDisplayMode"
											   :options = "DISPLAY_MODE_SELECT_OPTIONS"
											   label = "Display"
											   variant = "soft"
											   :open = "tutorialDisplaySelectOpenBinding"
											   @update:open = "handleTutorialDisplaySelectOpenUpdate"
											   :menu-class = "displaySelectMenuClass"></FloatingLabelSelect>
						</div>

				<div v-if = "activePlot === 'layer'" class = "mt-3" data-tutorial = "layer-controls">
					<label for = "layer-input" class = "block text-sm font-semibold text-white mb-1">
						Layer index
					</label>
					<div class = "viewer-stepper w-full border-b border-white/30 transition-colors focus-within:border-brand">
						<input id = "layer-input"
								type = "number"
								min = "0"
								:max = "maxLayerIndex"
								step = "1"
								v-model.number = "layerInput"
								@input = "debouncedApplyLayerInput"
								@keydown.enter.prevent = "applyLayerInput"
								@blur = "applyLayerInput"
								class = "viewer-stepper-input w-full bg-transparent px-0 py-1 text-center text-white placeholder:text-white/40 focus:outline-none"/>

						<div class = "flex flex-col">
							<button type = "button"
									@click.stop = "stepLayerInput( 1 )"
									:disabled = "canStepLayerInput( 1 ) === false"
									class = "inline-flex h-3.5 w-4 items-center justify-center text-[10px] text-white/55 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
								<span class = "sr-only">Increase layer index</span>
								<i class = "fas fa-chevron-up" aria-hidden = "true"></i>
							</button>
							<button type = "button"
									@click.stop = "stepLayerInput( -1 )"
									:disabled = "canStepLayerInput( -1 ) === false"
									class = "inline-flex h-3.5 w-4 items-center justify-center text-[10px] text-white/55 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
								<span class = "sr-only">Decrease layer index</span>
								<i class = "fas fa-chevron-down" aria-hidden = "true"></i>
							</button>
						</div>
					</div>
					<div class = "mt-1 text-xs text-white/70">
						{{ layerAxisValueLabel }}
					</div>
				</div>

				<div v-if = "activePlot === 'z_blend'" class = "mt-3 space-y-3">
					<div class = "w-full">
						<BaseDropdown root-class = "relative block w-full text-left"
									  :show-chevron = "false"
									  :close-on-select = "false"
									  :teleport-to-body = "true"
									  trigger-class = "inline-flex w-full items-center justify-between gap-3 rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-left text-sm text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand"
									  menu-class = "fixed z-[45] max-h-[70vh] min-w-[24rem] w-[24rem] max-w-[min(32rem,calc(100vw-1rem))] origin-top-left overflow-y-auto rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30">
							<template v-slot:trigger>
								<span class = "font-semibold">Channels</span>
								<div class = "flex items-center text-white/80">
									<i class = "fas fa-sliders-h" aria-hidden = "true"></i>
								</div>
							</template>

							<li class = "px-4 pt-3 pb-3 text-xs uppercase tracking-wide text-white/70">
								<div class = "flex items-center gap-2">
									<span>Z-blend channels</span>
									<span class = "group relative inline-flex items-center z-[70] normal-case">
										<span class = "inline-flex h-4 w-4 items-center justify-center text-xs text-white/80 cursor-help">
											<i class = "fas fa-info-circle" aria-hidden = "true"></i>
										</span>
										<span class = "pointer-events-none absolute left-1/2 top-full z-[80] mt-2 hidden w-64 -translate-x-1/2 rounded-md border border-white/10 px-3 py-2 text-[11px] normal-case leading-relaxed text-white shadow-xl ring-1 ring-black/30 group-hover:block"
											  style = "background-color: rgb(17 24 39);">
											Each channel adds one z-layer in its assigned color. The left slider handle sets the intensity below which that channel is hidden, and the right handle sets the intensity at which the channel reaches full color. Intensities between those two values fade in smoothly before all channels are added together.
										</span>
									</span>
								</div>
							</li>

							<li v-for = "( channel, index ) in zBlendChannels"
								:key = "'z-blend-channel-' + index"
								class = "border-t border-gray/40 px-4 py-3 text-white first:border-t-0">
								<div class = "space-y-1.5" :class = "channel.enabled === false ? 'opacity-45' : ''">
									<div class = "flex items-center gap-3">
										<label class = "inline-flex shrink-0 items-center justify-center">
											<input :checked = "channel.enabled !== false"
												   type = "checkbox"
												   @change = "toggleZBlendChannelEnabled( index, $event )"
												   class = "h-4 w-4 rounded border border-brand/70 bg-gray-700 accent-brand focus:ring-2 focus:ring-brand"/>
											<span class = "sr-only">Toggle z-blend channel</span>
										</label>

										<div class = "z-blend-value-stepper w-24 shrink-0 border-b border-white/30 transition-colors focus-within:border-brand">
											<input :id = "'z-blend-value-' + index"
												   v-model.number = "channel.requestedZ"
												   type = "number"
												   step = "any"
												   @input = "handleZBlendChannelInput( index )"
												   @blur = "applyZBlendChannelInput( index )"
												   class = "z-blend-value-input w-full bg-transparent px-0 py-1 text-center text-white placeholder:text-white/40 focus:outline-none"/>

											<div class = "flex flex-col">
												<button type = "button"
														@click.stop = "stepZBlendChannelValue( index, 1 )"
														:disabled = "canStepZBlendChannelValue( index, 1 ) === false"
														class = "inline-flex h-3.5 w-4 items-center justify-center text-[10px] text-white/55 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
													<span class = "sr-only">Increase z value</span>
													<i class = "fas fa-chevron-up" aria-hidden = "true"></i>
												</button>
												<button type = "button"
														@click.stop = "stepZBlendChannelValue( index, -1 )"
														:disabled = "canStepZBlendChannelValue( index, -1 ) === false"
														class = "inline-flex h-3.5 w-4 items-center justify-center text-[10px] text-white/55 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
													<span class = "sr-only">Decrease z value</span>
													<i class = "fas fa-chevron-down" aria-hidden = "true"></i>
												</button>
											</div>
										</div>

										<DualRangeSlider class = "flex-1"
														 :min = "0"
														 :max = "zBlendChannelSliderMaximum( index )"
														 :step = "zBlendChannelSliderStep( index )"
														 :min-value = "channel.clampMin"
														 :max-value = "channel.clampMax"
														 :color = "zBlendChannelColorHex( index )"
														 :show-values-on-hover = "true"
														 @update:min-value = "updateZBlendClampValue( index, 'min', $event )"
														 @update:max-value = "updateZBlendClampValue( index, 'max', $event )"/>

										<button type = "button"
												@click.stop = "removeZBlendChannel( index )"
												:disabled = "zBlendChannels.length <= 1 || zBlendSaving"
												class = "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
											<span class = "sr-only">Remove z-blend channel</span>
											<i class = "fas fa-times" aria-hidden = "true"></i>
										</button>
									</div>

									<div class = "text-xs text-white/70">
										Layer {{ zBlendResolvedChannelLabel( index ).layerLabel }}
									</div>
								</div>
							</li>

							<li class = "border-t border-gray/40 px-4 py-3">
								<div class = "flex flex-wrap items-center justify-between gap-2">
									<button type = "button"
											@click.stop = "addZBlendChannel"
											:disabled = "zBlendChannels.length >= MAX_Z_BLEND_CHANNELS || zBlendSaving"
											class = "inline-flex items-center gap-2 rounded-md border border-gray-600 px-3 py-2 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50">
										<i class = "fas fa-plus" aria-hidden = "true"></i>
										<span>Add channel</span>
									</button>

									<div class = "flex flex-wrap items-center gap-2">
										<button type = "button"
												@click.stop = "saveZBlendPreset"
												:disabled = "zBlendSaving || zBlendChannels.length === 0"
												class = "inline-flex items-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50">
											<span class = "relative inline-flex min-w-[4.5rem] items-center justify-center">
												<span :class = "zBlendSaving ? 'invisible' : ''">Save</span>
												<span v-if = "zBlendSaving" class = "absolute inset-0 flex items-center justify-center">
													<Spinner class = "h-4 w-4 text-white"/>
												</span>
											</span>
										</button>
									</div>
								</div>

								<p v-if = "zBlendPresetStatusMessage.length > 0"
								   class = "mt-2 text-xs"
								   :class = "zBlendPresetStatus === 'error' ? 'text-red-300' : 'text-white/70'">
									{{ zBlendPresetStatusMessage }}
								</p>
							</li>
						</BaseDropdown>
					</div>

					<p v-if = "zBlendPresetSummaryLabel.length > 0" class = "text-xs text-white/70">
						{{ zBlendPresetSummaryLabel }}
					</p>
				</div>

				<div v-if = "activePlot === 'pca' || activePlot === 'pca_mip' || activePlot === 'rpca' || activePlot === 'rpca_mip'" class = "mt-3">
					<div v-if = "activePlot === 'pca' || activePlot === 'rpca'" class = "mt-3">
						<label for = "pca-classification-component-count" class = "block text-sm font-semibold text-white mb-1">
							Number of components
						</label>
						<div class = "viewer-stepper w-full border-b border-white/30 transition-colors focus-within:border-brand">
							<input id = "pca-classification-component-count"
									type = "number"
									min = "1"
									max = "10"
									step = "1"
									v-model.number = "pcaClassificationComponentCount"
									@input = "debouncedApplyPcaClassificationComponentCount"
									@keydown.enter.prevent = "applyPcaClassificationComponentCount"
									@blur = "applyPcaClassificationComponentCount"
									class = "viewer-stepper-input w-full bg-transparent px-0 py-1 text-center text-white placeholder:text-white/40 focus:outline-none"/>

							<div class = "flex flex-col">
								<button type = "button"
										@click.stop = "stepPcaComponentCount( 'classification', 1 )"
										:disabled = "canStepPcaComponentCount( 'classification', 1 ) === false"
										class = "inline-flex h-3.5 w-4 items-center justify-center text-[10px] text-white/55 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
									<span class = "sr-only">Increase number of components</span>
									<i class = "fas fa-chevron-up" aria-hidden = "true"></i>
								</button>
								<button type = "button"
										@click.stop = "stepPcaComponentCount( 'classification', -1 )"
										:disabled = "canStepPcaComponentCount( 'classification', -1 ) === false"
										class = "inline-flex h-3.5 w-4 items-center justify-center text-[10px] text-white/55 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
									<span class = "sr-only">Decrease number of components</span>
									<i class = "fas fa-chevron-down" aria-hidden = "true"></i>
								</button>
							</div>
						</div>
					</div>
					<div v-if = "activePlot === 'pca_mip' || activePlot === 'rpca_mip'" class = "mt-3">
						<label for = "pca-mip-component-count" class = "block text-sm font-semibold text-white mb-1">
							Number of components
						</label>
						<div class = "viewer-stepper w-full border-b border-white/30 transition-colors focus-within:border-brand">
							<input id = "pca-mip-component-count"
									type = "number"
									min = "1"
									max = "10"
									step = "1"
									v-model.number = "pcaMipComponentCount"
									@input = "debouncedApplyPcaMipComponentCount"
									@keydown.enter.prevent = "applyPcaMipComponentCount"
									@blur = "applyPcaMipComponentCount"
									class = "viewer-stepper-input w-full bg-transparent px-0 py-1 text-center text-white placeholder:text-white/40 focus:outline-none"/>

							<div class = "flex flex-col">
								<button type = "button"
										@click.stop = "stepPcaComponentCount( 'mip', 1 )"
										:disabled = "canStepPcaComponentCount( 'mip', 1 ) === false"
										class = "inline-flex h-3.5 w-4 items-center justify-center text-[10px] text-white/55 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
									<span class = "sr-only">Increase number of components</span>
									<i class = "fas fa-chevron-up" aria-hidden = "true"></i>
								</button>
								<button type = "button"
										@click.stop = "stepPcaComponentCount( 'mip', -1 )"
										:disabled = "canStepPcaComponentCount( 'mip', -1 ) === false"
										class = "inline-flex h-3.5 w-4 items-center justify-center text-[10px] text-white/55 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
									<span class = "sr-only">Decrease number of components</span>
									<i class = "fas fa-chevron-down" aria-hidden = "true"></i>
								</button>
							</div>
						</div>
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
							<div class = "viewer-stepper border-b border-white/30 transition-colors focus-within:border-brand">
								<input id = "pca-r-input"
										type = "number"
										min = "1"
										max = "10"
										step = "1"
										v-model.number = "pcaRgbRedInput"
										@input = "debouncedApplyPcaRgbInput"
										@keydown.enter.prevent = "applyPcaRgbInput"
										@blur = "applyPcaRgbInput"
										class = "viewer-stepper-input w-full bg-transparent px-0 py-1 text-center text-white placeholder:text-white/40 focus:outline-none"/>

								<div class = "flex flex-col">
									<button type = "button"
											@click.stop = "stepPcaRgbComponent( 'r', 1 )"
											:disabled = "canStepPcaRgbComponent( 'r', 1 ) === false"
											class = "inline-flex h-3.5 w-4 items-center justify-center text-[10px] text-white/55 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
										<span class = "sr-only">Increase red component</span>
										<i class = "fas fa-chevron-up" aria-hidden = "true"></i>
									</button>
									<button type = "button"
											@click.stop = "stepPcaRgbComponent( 'r', -1 )"
											:disabled = "canStepPcaRgbComponent( 'r', -1 ) === false"
											class = "inline-flex h-3.5 w-4 items-center justify-center text-[10px] text-white/55 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
										<span class = "sr-only">Decrease red component</span>
										<i class = "fas fa-chevron-down" aria-hidden = "true"></i>
									</button>
								</div>
							</div>
						</div>

						<div>
							<label for = "pca-g-input" class = "block text-xs font-semibold mb-1" style = "color: rgb(34, 197, 94);">G</label>
							<div class = "viewer-stepper border-b border-white/30 transition-colors focus-within:border-brand">
								<input id = "pca-g-input"
										type = "number"
										min = "1"
										max = "10"
										step = "1"
										v-model.number = "pcaRgbGreenInput"
										@input = "debouncedApplyPcaRgbInput"
										@keydown.enter.prevent = "applyPcaRgbInput"
										@blur = "applyPcaRgbInput"
										class = "viewer-stepper-input w-full bg-transparent px-0 py-1 text-center text-white placeholder:text-white/40 focus:outline-none"/>

								<div class = "flex flex-col">
									<button type = "button"
											@click.stop = "stepPcaRgbComponent( 'g', 1 )"
											:disabled = "canStepPcaRgbComponent( 'g', 1 ) === false"
											class = "inline-flex h-3.5 w-4 items-center justify-center text-[10px] text-white/55 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
										<span class = "sr-only">Increase green component</span>
										<i class = "fas fa-chevron-up" aria-hidden = "true"></i>
									</button>
									<button type = "button"
											@click.stop = "stepPcaRgbComponent( 'g', -1 )"
											:disabled = "canStepPcaRgbComponent( 'g', -1 ) === false"
											class = "inline-flex h-3.5 w-4 items-center justify-center text-[10px] text-white/55 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
										<span class = "sr-only">Decrease green component</span>
										<i class = "fas fa-chevron-down" aria-hidden = "true"></i>
									</button>
								</div>
							</div>
						</div>

						<div>
							<label for = "pca-b-input" class = "block text-xs font-semibold mb-1" style = "color: rgb(59, 130, 246);">B</label>
							<div class = "viewer-stepper border-b border-white/30 transition-colors focus-within:border-brand">
								<input id = "pca-b-input"
										type = "number"
										min = "1"
										max = "10"
										step = "1"
										v-model.number = "pcaRgbBlueInput"
										@input = "debouncedApplyPcaRgbInput"
										@keydown.enter.prevent = "applyPcaRgbInput"
										@blur = "applyPcaRgbInput"
										class = "viewer-stepper-input w-full bg-transparent px-0 py-1 text-center text-white placeholder:text-white/40 focus:outline-none"/>

								<div class = "flex flex-col">
									<button type = "button"
											@click.stop = "stepPcaRgbComponent( 'b', 1 )"
											:disabled = "canStepPcaRgbComponent( 'b', 1 ) === false"
											class = "inline-flex h-3.5 w-4 items-center justify-center text-[10px] text-white/55 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
										<span class = "sr-only">Increase blue component</span>
										<i class = "fas fa-chevron-up" aria-hidden = "true"></i>
									</button>
									<button type = "button"
											@click.stop = "stepPcaRgbComponent( 'b', -1 )"
											:disabled = "canStepPcaRgbComponent( 'b', -1 ) === false"
											class = "inline-flex h-3.5 w-4 items-center justify-center text-[10px] text-white/55 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
										<span class = "sr-only">Decrease blue component</span>
										<i class = "fas fa-chevron-down" aria-hidden = "true"></i>
									</button>
								</div>
							</div>
						</div>
					</div>

					</div>
			</div>

					<div v-if = "showRamanInferenceTutorialBlock"
						 class = "mt-4 p-2 shadow-md shadow-black border-2 border-gray bg-gray-800 rounded-lg"
						 data-tutorial = "raman-inference-sidebar-block">
					<div v-if = "showTutorialRamanSidebarPlaceholder === false"
						 class = "flex items-center justify-between gap-1">
						<div class = "flex min-w-0 items-center gap-1">
							<span class = "inline-flex h-5 w-5 items-center justify-center text-white" aria-hidden = "true">
								<i class = "fas fa-wave-square text-sm"></i>
							</span>
							<h3 class = "text-white font-semibold whitespace-nowrap">Raman inference</h3>
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
								Selection uncertainty level
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

					<div v-else
						 class = "flex min-h-8 items-center justify-between gap-1">
						<div class = "flex min-w-0 items-center gap-1">
							<span class = "inline-flex h-5 w-5 items-center justify-center text-white" aria-hidden = "true">
								<i class = "fas fa-wave-square text-sm"></i>
							</span>
							<h3 class = "text-white font-semibold whitespace-nowrap">Raman inference</h3>
						</div>

						<button type = "button"
								disabled
								class = "h-8 w-8 inline-flex items-center justify-center rounded-md text-white/80">
							<span class = "sr-only">Raman inference options</span>
							<i class = "fas fa-ellipsis-v" aria-hidden = "true" title = "Raman inference options"></i>
						</button>
					</div>

				</div>

					<div class = "mt-4 p-2 shadow-md shadow-black border-2 border-gray bg-gray-800 rounded-lg"
						 data-tutorial = "roi-controls">
						<div class = "flex items-center justify-between gap-1 mb-2">
							<div class = "flex min-w-0 items-center gap-1">
								<span class = "inline-flex h-5 w-5 items-center justify-center text-white" aria-hidden = "true">
									<i class = "fas fa-crop-simple text-sm"></i>
								</span>
								<h3 class = "text-white font-semibold whitespace-nowrap">Regions of interest</h3>
							</div>

							<div class = "flex items-center gap-1">
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
											<span>{{ showAllRoiOverlays ? "Hide all ROIs" : "Show all ROIs" }}</span>
										</button>
									</li>
									<li>
										<button @click = "downloadAllRois"
												:disabled = "rois.length === 0"
												class = "flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent">
											<i class = "fas fa-download" aria-hidden = "true"></i>
											<span>Download all ROIs</span>
										</button>
									</li>

										<li><hr class = "h-0.5 bg-gray border-0"></li>
										<li class = "px-4 pt-2 pb-1 text-xs uppercase tracking-wide text-white/70">
											Selection uncertainty level
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
											:key = "'roi-selection-confidence-' + level">
											<button @click = "setSelectedConfidenceLevel( level )"
													class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
												<span>{{ level }}%</span>
												<i :class = "selectedConfidenceLevelValue === level ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
												   aria-hidden = "true"></i>
											</button>
										</li>
										<template v-if = "hasEstimatedRamanSpectraReady">
										<li><hr class = "h-0.5 bg-gray border-0"></li>
										<li class = "px-4 pt-2 pb-1 text-xs uppercase tracking-wide text-white/70">
											Estimate uncertainty level
										</li>
										<li>
											<button @click = "setRoiEstimateUncertaintyLevel( CONFIDENCE_NONE_VALUE )"
													class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
												<span>No uncertainty</span>
												<i :class = "roiEstimateUncertaintyLevelValue === CONFIDENCE_NONE_VALUE ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
												   aria-hidden = "true"></i>
											</button>
										</li>
										<li v-for = "level in confidenceLevelOptions"
											:key = "'roi-estimate-confidence-' + level">
											<button @click = "setRoiEstimateUncertaintyLevel( level )"
													class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
												<span>{{ level }}%</span>
												<i :class = "roiEstimateUncertaintyLevelValue === level ? 'fas fa-check text-brand' : 'fas fa-check opacity-0'"
												   aria-hidden = "true"></i>
											</button>
										</li>
										</template>
								</BaseDropdown>
							</div>
						</div>

						<BaseDropdown root-class = "relative block w-full text-left"
									  :show-chevron = "false"
									  :close-on-select = "false"
									  :teleport-to-body = "true"
									  portal-placement = "bottom-start"
									  trigger-class = "group w-full rounded-xl text-white transition focus:outline-none"
									  menu-class = "fixed z-[45] min-w-[16rem] w-max max-w-[50vw] origin-top-left rounded-md bg-dark-gray shadow-lg ring-1 ring-black/30">
							<template v-slot:trigger>
								<div class = "flex items-center gap-2.5 rounded-xl border border-white/10 bg-gray-700/90 px-2.5 py-1.5 transition group-focus:border-white/10 group-focus:bg-gray-700 group-focus:ring-2 group-focus:ring-brand">
									<div class = "min-w-0 flex-1 text-left">
										<div class = "truncate text-sm font-semibold text-white">{{ roiDropdownSummaryLabel }}</div>
									</div>

									<div class = "inline-flex h-8 w-8 items-center justify-center rounded-full text-white/75 transition bg-white/8 group-focus:bg-white/10">
										<i class = "fas fa-chevron-down text-xs" aria-hidden = "true"></i>
									</div>
								</div>
							</template>

							<li>
								<button type = "button"
										@click = "clearSelectedRois"
										class = "flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
									<i class = "fas fa-eye text-white/70" aria-hidden = "true"></i>
									<span>Clear plotted ROIs</span>
								</button>
							</li>
							<li><hr class = "h-0.5 bg-gray border-0"></li>
							<li v-for = "option in roiSelectOptions"
								:key = "option.value">
								<button type = "button"
										@click = "toggleSelectedRoiId( option.value )"
										class = "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-white transition hover:bg-brand hover:text-white">
									<span class = "truncate">{{ option.label }}</span>
									<span class = "inline-flex h-4 min-w-[1rem] items-center justify-center text-sm font-semibold leading-none text-brand"
										  :class = "isSelectedRoiId( option.value ) ? 'opacity-100' : 'opacity-0'"
										  aria-hidden = "true">
										&#10003;
									</span>
								</button>
							</li>
						</BaseDropdown>

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
								:disabled = "selectedRois.length === 0"
								class = "h-8 w-8 inline-flex items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
								title = "Delete selected ROIs"
								aria-label = "Delete selected ROIs">
							<i class = "fas fa-trash" aria-hidden = "true"></i>
						</button>

						<button @click = "openRoiDescriptionModal"
								:disabled = "selectedRois.length === 0"
								class = "h-8 w-8 inline-flex items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
								title = "Show ROI details"
								aria-label = "Show ROI details">
							<i class = "fas fa-info-circle" aria-hidden = "true"></i>
						</button>

						<button @click = "downloadSelectedRoi"
								:disabled = "selectedRois.length === 0"
								class = "h-8 w-8 inline-flex items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
								title = "Download selected ROIs"
								aria-label = "Download selected ROIs">
							<i class = "fas fa-download" aria-hidden = "true"></i>
						</button>

						<button @click = "refreshRoisFromBackend"
								:disabled = "isRoiRefreshDisabled"
								class = "h-8 w-8 inline-flex items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
								title = "Reload ROIs from backend"
								aria-label = "Reload ROIs from backend">
							<span class = "inline-flex h-4 w-4 items-center justify-center"
								  :class = "{ 'roi-refresh-spin': isRoiRefreshDisabled }">
								<i class = "fas fa-sync-alt" aria-hidden = "true"></i>
							</span>
						</button>
					</div>

					<p v-if = "canMutateRois && !hasSelectedRegion" class = "text-xs text-white/80 mt-1 leading-snug">
						Select a heatmap region first to save a new region of interest.
					</p>

			</div>

			<div v-if = "spectralCalibrationSidebarOpen"
				 ref = "spectralCalibrationSidebarSection"
				 class = "mt-4 p-2 shadow-md shadow-black border-2 border-gray bg-gray-800 rounded-lg"
				 data-tutorial = "spectral-calibration-sidebar-block">
				<div class = "flex items-center justify-between gap-1">
					<div class = "flex min-w-0 items-center gap-1">
						<span class = "inline-flex h-5 w-5 items-center justify-center text-white" aria-hidden = "true">
							<i class = "fas fa-ruler text-sm"></i>
						</span>
						<h3 class = "text-white font-semibold whitespace-nowrap">Calibration</h3>
					</div>

					<div class = "flex items-center gap-1">
						<span v-if = "spectralCalibrationProfilesLoading"
							  class = "inline-flex h-8 w-8 items-center justify-center">
							<Spinner class = "h-4 w-4 text-brand"></Spinner>
						</span>
						<button type = "button"
								@click = "spectralCalibrationSidebarOpen = false"
								class = "inline-flex h-8 w-8 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand"
								title = "Close calibration controls"
								aria-label = "Close calibration controls">
							<i class = "fas fa-times" aria-hidden = "true"></i>
						</button>
					</div>
				</div>

				<div v-if = "spectralCalibrationProfilesSupported === false"
					 class = "mt-2 rounded-md border border-white/10 bg-white/5 px-2 py-2 text-xs leading-snug text-white/70">
					Spectral calibration profiles are not available in this environment.
				</div>

				<div v-else-if = "project.shared"
					 class = "mt-2 space-y-2">
					<p class = "text-xs leading-snug text-white/70">
						Shared projects use the calibration profile assigned by the project owner.
					</p>
					<div class = "min-w-0 truncate border-b border-white/20 py-1 text-sm font-medium text-white"
						 :title = "activeSpectralCalibrationProfileLabel">
						{{ activeSpectralCalibrationProfileLabel }}
					</div>
				</div>

				<div v-else class = "mt-2">
					<CalibrationControls :saving = "spectralCalibrationAssignmentSaving"
										 :profile-options = "spectralCalibrationProfileOptions"
										 :selected-profile-id = "spectralCalibrationSelectedProfileID"
										 :profiles-loading = "spectralCalibrationProfilesLoading"
										 :can-save-selection = "canAssignSpectralCalibrationProfile"
										 description = "Selecting a saved spectral calibration previews it immediately. Save assigns the selected profile to this project."
										 @show-panel = "spectralCalibrationPanelOpen = true"
										 @update:selected-profile-id = "handleSpectralCalibrationProfileSelection"
										 @save = "assignSpectralCalibrationProfileToProject">
					</CalibrationControls>
				</div>

				<p v-if = "spectralCalibrationSelectionDirty"
				   class = "mt-2 text-xs leading-snug text-amber-200">
					Unsaved calibration selection. Save before running Raman inference.
				</p>
				<p v-else-if = "spectralCalibrationSelectedProfileID.length > 0"
				   class = "mt-2 text-xs leading-snug text-white/70">
					Applied on top of the raw Z axis values.
				</p>
				<p v-if = "spectralCalibrationError.length > 0"
				   class = "mt-2 text-xs leading-snug text-red-300">
					{{ spectralCalibrationError }}
				</p>
			</div>

		</Sidebar>

		<NavigationBar>
			<template v-slot:left-items>
				<button @click = "sidebarOpen = true" class = "md:hidden mr-4 px-3 py-2 rounded bg-slate-100">☰</button>
				<div data-tutorial = "project-menu">
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
									  :dimmed = "isProjectMenuItemDimmed('core')"
									  :disabled = "project.shared"
									  :tooltip = "ownedProjectActionTooltip('Renaming')">
						Rename
					</BaseDropdownItem>

					<BaseDropdownItem @select = "openXyzSettingsModal"
									  :dimmed = "isProjectMenuItemDimmed('core')"
									  :disabled = "project.shared"
									  :tooltip = "ownedProjectActionTooltip('Axis value editing')">
						Edit raw axis values
					</BaseDropdownItem>

					<BaseDropdownItem @select = "openSpectralCalibrationSidebar"
									  :dimmed = "isProjectMenuItemDimmed('core')">
						Calibration
					</BaseDropdownItem>

					<BaseDropdownItem @select = "openGpuInferenceModal"
									  :dimmed = "isProjectMenuItemDimmed('core')"
									  :disabled = "project.shared"
									  :tooltip = "ownedProjectActionTooltip('Raman inference')">
						Raman spectrum inference
					</BaseDropdownItem>

					<hr :class = "projectMenuDividerClass('sharing')">

					<BaseDropdownItem @select = "openShareModal"
									  :dimmed = "isProjectMenuItemDimmed('sharing')"
									  :disabled = "project.shared"
									  :tooltip = "ownedProjectActionTooltip('Sharing')">
						Share
					</BaseDropdownItem>

					<BaseDropdownItem @select = "openProjectChat"
									  :dimmed = "isProjectMenuItemDimmed('sharing')">
						Notes
					</BaseDropdownItem>

					<BaseDropdownItem @select = "openMetadataModal"
									  :dimmed = "isProjectMenuItemDimmed('sharing')">
						Metadata
					</BaseDropdownItem>

					<BaseDropdownItem @select = "download"
									  :dimmed = "isProjectMenuItemDimmed('sharing')">
						Download
					</BaseDropdownItem>

					<BaseDropdownItem @select = "openZenodoModal"
									  :dimmed = "isProjectMenuItemDimmed('sharing')"
									  :disabled = "project.shared"
									  :tooltip = "ownedProjectActionTooltip('Zenodo exporting')">
						Zenodo export
					</BaseDropdownItem>

					<hr :class = "projectMenuDividerClass('utility')">

					<BaseDropdownItem @select = "openVisualizationSettings"
									  :dimmed = "isProjectMenuItemDimmed('utility')">
						Visualization settings
					</BaseDropdownItem>

					<BaseDropdownItem @select = "openProjectMenu"
									  :dimmed = "isProjectMenuItemDimmed('utility')">
						Main menu
					</BaseDropdownItem>

					<hr :class = "projectMenuDividerClass('utility')">

					<BaseDropdownItem @select = "restartViewerTutorial"
									  :dimmed = "isProjectMenuItemDimmed('utility')">
						Tutorial
					</BaseDropdownItem>

					<li v-if = "frontendVersionDisplay.length > 0"
						class = "px-4 py-2 text-left text-sm text-white/45"
						:title = "'Release ' + version.release + ( version.buildSha.length > 0 ? '\nCommit ' + version.buildSha : '' ) + ( version.buildDate.length > 0 ? '\nBuilt ' + version.buildDate : '' )">
						Version {{ frontendVersionDisplay }}
					</li>

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
				<template v-if = "heatmapRendererMode === 'deckgl'">
					<div ref = "deckLayoutContainer" class = "flex h-full min-h-0 gap-0 p-2">
						<div ref = "deckSpectraPaneContainer"
							 class = "relative grid h-full min-h-0 min-w-0 flex-1 md:min-w-[20rem]"
							 :style = "deckSpectraPaneGridStyle"
							 data-tutorial = "spectra-panels">
							<div class = "relative min-h-0 overflow-hidden rounded-lg bg-white">
								<div class = "flex h-full min-h-0 flex-col">
									<div v-if = "topSpectrumPaneLegendVisible && topSpectrumPaneLegendEntries.length > 0"
										 class = "shrink-0 border-b border-gray/20 px-2 py-1.5">
										<div class = "flex flex-wrap items-center gap-1.5">
											<span class = "text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45">
												Legend
											</span>
											<button v-for = "entry in topSpectrumPaneLegendEntries"
												  :key = "entry.key"
												  type = "button"
												  :title = "isSpectrumLegendHidden( entry.key ) ? 'Show' : 'Hide'"
												  @click = "toggleSpectrumLegendTraceVisibility( entry.key )"
												  @mouseenter = "hoveredSpectrumLegendKey = entry.key"
												  @mouseleave = "hoveredSpectrumLegendKey = ''"
												  @focus = "hoveredSpectrumLegendKey = entry.key"
												  @blur = "hoveredSpectrumLegendKey = ''"
												  :class = "[
													  isSpectrumLegendHidden( entry.key ) ? 'border-gray/25 bg-white text-black/35 opacity-55' : '',
													  hoveredSpectrumLegendKey === entry.key ? 'border-black/25 bg-black/5 text-black shadow-sm' : 'border-gray/30 bg-white text-black/70'
												  ]"
												  class = "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] transition-colors focus:outline-none">
												<span class = "h-2.5 w-2.5 rounded-sm"
													  :style = "{ backgroundColor: entry.color }"></span>
												<span>{{ entry.label }}</span>
											</button>
										</div>
									</div>
									<div class = "relative min-h-0 flex-1">
										<div ref = "deckTopPanelGraph" class = "h-full w-full bg-white"></div>
										<div v-if = "topSpectrumPaneQuerying"
											 class = "pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-white/45">
											<div class = "inline-flex items-center justify-center rounded-full bg-dark-gray/85 p-3 text-brand shadow-sm">
												<Spinner class = "h-6 w-6"></Spinner>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div class = "relative h-5 shrink-0 cursor-row-resize select-none touch-none"
								 title = "Resize spectra panes"
								 @pointerdown = "startDeckSpectraPaneResize">
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
							<div class = "relative min-h-0 overflow-hidden rounded-lg bg-white">
								<div class = "flex h-full min-h-0 flex-col">
									<div class = "relative min-h-0 flex-1">
										<div ref = "deckBottomPanelGraph" class = "h-full w-full bg-white"></div>
										<div v-if = "bottomSpectrumPaneQuerying"
											 class = "pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-white/45">
											<div class = "inline-flex items-center justify-center rounded-full bg-dark-gray/85 p-3 text-brand shadow-sm">
												<Spinner class = "h-6 w-6"></Spinner>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div class = "relative w-5 shrink-0 cursor-col-resize touch-none"
							 title = "Resize"
							 @pointerdown = "startDeckPaneResize">
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
							<div :class = "[
									 'deck-heatmap-pane relative h-full shrink-0 overflow-visible rounded-lg bg-white',
									 { 'tutorial-modebar-visible': isHeatmapTutorialStepActive }
								 ]"
								 data-tutorial = "heatmap-pane"
								 :style = "deckHeatmapPaneStyle">
								<div class = "absolute inset-x-1 bottom-1 top-10">
									<div class = "relative h-full w-full">
										<div ref = "graph" class = "w-full h-full bg-white rounded-lg"></div>
										<HeatmapRendererPane :renderer-mode = "heatmapRendererMode"
															 :payload = "heatmapRendererPayload"
															 :pane-state = "heatmapRendererPaneState"
															 :interaction-mode = "heatmapInteractionMode"
															 :lock-square-zoom = "heatmapZoomAspectRatio === 'square'"
															 :overlays = "activeRoiOverlays()"
															 :view-mode = "activePlot"
															 :benchmark-token = "heatmapRenderBenchmarkToken"
															 @point-select = "handleHeatmapPointSelection"
															 @region-select = "handleHeatmapRegionSelection"
															 @zoom-range = "handleHeatmapZoomRange"
															 @reset-zoom = "handleHeatmapResetZoom"
															 @render-timing = "handleHeatmapRendererTiming"></HeatmapRendererPane>
									</div>
								</div>
							</div>
						</div>
					</template>
				<template v-else>
					<div ref = "graph" class = "w-full h-full bg-white rounded-lg"></div>
				</template>
			</main>

	</div>

	<MetadataModal ref = "metadataModal" :project = "project"></MetadataModal>
	<ShareModal ref = "shareModal" :project = "project"></ShareModal>
	<ZenodoModal ref = "zenodoModal" :project = "project"></ZenodoModal>
	<RoiDescriptionModal ref = "roiDescriptionModal"
						 :rois = "selectedRois"></RoiDescriptionModal>
	<RoiSaveModal ref = "roiSaveModal" :saving = "savingRoi" @save = "saveRoi"></RoiSaveModal>
	<RoiDeleteModal ref = "roiDeleteModal"
					:rois = "selectedRois"
					:deleting = "deletingRoi"
					@confirm = "deleteSelectedRoi"></RoiDeleteModal>
	<GpuInferenceModal ref = "gpuInferenceModal"
					  :project = "project"
					  :default-group-id = "resolvedActiveGroupID"
					  :initial-job-id = "gpuInferenceJobId"
					  :initial-status = "gpuInferenceStatus"
					  :spectral-calibration-profile-name = "spectralCalibrationAssignedProfileID.length > 0 ? activeSpectralCalibrationProfileLabel : ''"
					  @submitted = "handleGpuInferenceSubmitted"
					  @status = "handleGpuInferenceStatus"></GpuInferenceModal>
	<GpuInferenceOutcomeModal ref = "gpuInferenceOutcomeModal"></GpuInferenceOutcomeModal>
	<DownloadPreparingModal ref = "downloadPreparingModal"></DownloadPreparingModal>
	<XyzSettingsModal ref = "xyzSettingsModal"
					  :saving = "savingXyz"
					  :spectral-calibration-active = "spectralCalibrationSelectedProfileID.length > 0"
					  :spectral-calibration-profile-name = "activeSpectralCalibrationProfileLabel"
					  @save = "saveXyzSettings"></XyzSettingsModal>
	<CalibrationPanel v-model = "spectralCalibrationPanelOpen"
					  :project = "project"
					  :anchor-element = "spectralCalibrationSidebarSection"
					  :points = "spectralCalibrationDraft.points"
					  :polynomial-order = "spectralCalibrationDraft.polynomialOrder"
					  :included-orders = "spectralCalibrationDraft.includedOrders"
					  :max-polynomial-order = "spectralCalibrationMaxOrder"
					  :focused-point-id = "focusedSpectralCalibrationPointID"
					  :can-apply = "spectralCalibrationHasSavablePoints"
					  :can-save-profile = "canSaveSpectralCalibrationProfile"
					  :saving-profile = "spectralCalibrationProfileSaving"
					  :save-disabled-reason = "spectralCalibrationProfileSaveDisabledReason"
					  description-text = "Click spectrum traces or loadings to add points. Preview the current spectral-axis calibration here, save the previewed profile beside it, and assign the selected saved profile from the sidebar."
					  @update:point-target = "updateSpectralCalibrationPointTarget"
					  @update:polynomial-order = "updateSpectralCalibrationPolynomialOrder"
					  @toggle-order = "toggleSpectralCalibrationIncludedOrder"
					  @apply-calibration = "applySpectralCalibrationPreview"
					  @save-profile = "openSpectralCalibrationProfileSaveModal"
					  @remove-point = "removeSpectralCalibrationPoint"
					  @focus-point = "setFocusedSpectralCalibrationPointID"></CalibrationPanel>
	<CalibrationProfileSaveModal ref = "spectralCalibrationProfileSaveModal"
								 :saving = "spectralCalibrationProfileSaving"
								 :reserved-names = "spectralCalibrationReservedProfileNames"
								 :base-disabled-reason = "spectralCalibrationProfileSaveDisabledReason"
								 @save = "saveSpectralCalibrationProfile"></CalibrationProfileSaveModal>
	<ProjectChatWindow v-model = "projectChatOpen"
					   :project = "project"></ProjectChatWindow>
	<ViewerTutorialPrompt :visible = "viewerTutorialPromptVisible"
						  @start = "startViewerTutorial"
						  @skip = "skipViewerTutorialPrompt"></ViewerTutorialPrompt>
	<ViewerTutorialOverlay :visible = "viewerTutorialVisible"
						   :step-id = "activeViewerTutorialStep?.id ?? ''"
						   :title = "activeViewerTutorialStep?.title ?? ''"
						   :body = "activeViewerTutorialStep?.body ?? ''"
						   :step-number = "viewerTutorialStepIndex + 1"
						   :step-count = "viewerTutorialStepCount"
						   :can-go-back = "viewerTutorialStepIndex > 0"
						   :is-final = "isFinalViewerTutorialStep"
						   :preferred-placement = "activeViewerTutorialStep?.placement ?? 'center'"
						   :target-element = "activeViewerTutorialTargetElement"
						   :spotlight-enabled = "activeViewerTutorialStep?.kind !== 'centered'"
						   @next = "advanceViewerTutorial"
						   @back = "rewindViewerTutorial"
						   @skip = "skipActiveViewerTutorial"></ViewerTutorialOverlay>
	<div v-if = "showDisplayInfoTooltip && showDisplayInfoIcon"
		 class = "pointer-events-none fixed z-[120] w-64 rounded-md border border-white/10 px-3 py-2 text-[11px] leading-relaxed text-white shadow-xl ring-1 ring-black/30"
		 :style = "displayInfoTooltipStyle">
		<span class = "block">
			The select menu can be used to select various false-color visualizations. Views are downloaded when needed and then cached so returning to them is faster.
		</span>
		<span v-if = "pendingPreparationTargets.length > 0" class = "mt-2 block text-white/70">
			Preparing
		</span>
		<span v-for = "target in pendingPreparationTargets"
			  :key = "'display-tooltip-overlay-' + target"
			  class = "mt-1 flex items-center gap-2 text-white/80">
			<Spinner v-if = "currentPreparationTarget === target"
					 class = "h-3 w-3 text-brand"/>
			<span v-else
				  class = "inline-block h-1.5 w-1.5 rounded-full bg-white/30"></span>
			<span>{{ preparationTargetLabel( target ) }}</span>
		</span>
	</div>
</div>
</template>

<script setup>

import { ref, shallowRef, watch, computed, nextTick, onBeforeUnmount} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { debounce } from 'lodash'
const route = useRoute()
const router = useRouter()

const emit = defineEmits(["loaded"])

import {
	projects as projectlib,
	settings as settingslib,
	version,
	navigation,
	hyperspectrumCache,
	hyperspectra,
	results,
	data as datalib
} from "@harkana/tools"
import {
	applyCalibrationToValues,
	calibrationMaxPolynomialOrder,
	calibrationHasValidPoints,
	hyperspectrum,
	normalizeCalibrationModel,
	plot
} from "@harkana/plot"

import Sidebar from './sidebar/Sidebar.vue'
import Logo from "./sidebar/Logo.vue"

import NavigationBar from './navbar/NavigationBar.vue'
import AccountDropdown from './navbar/AccountDropdown.vue'
import BaseDropdown from './navbar/BaseDropdown.vue'
import BaseDropdownItem from './navbar/BaseDropdownItem.vue'
import ProjectNameInput from './navbar/ProjectNameInput.vue'
import CalibrationControls from './sidebar/CalibrationControls.vue'

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
import HeatmapRendererPane from './plot/HeatmapRendererPane.vue'
import CalibrationPanel from './modals/CalibrationPanel.vue'
import CalibrationProfileSaveModal from './modals/CalibrationProfileSaveModal.vue'
import { createHyperspectrumDisplayRegistry } from './plot/hyperspectrum/displayRegistry.js'
import DualRangeSlider from './general/DualRangeSlider.vue'
import FloatingLabelSelect from './general/FloatingLabelSelect.vue'
import Spinner from './general/Spinner.vue'
import ViewerTutorialPrompt from './tutorial/ViewerTutorialPrompt.vue'
import ViewerTutorialOverlay from './tutorial/ViewerTutorialOverlay.vue'
import {
	normalizeSelectionBoundingBox
} from '../composables/hyperspectrum/selectionBounds.js'
import {
	normalizeSelectionConfidenceLevel,
	useHyperspectrumSelections
} from '../composables/hyperspectrum/useSelections.js'
import { useHyperspectrumRois } from '../composables/hyperspectrum/useRois.js'
import {
	normalizeHeatmapInteraction,
	normalizeHeatmapRendererMode,
	normalizeHeatmapZoomAspectRatio,
	useHyperspectrumHeatmapToolbarState
} from '../composables/hyperspectrum/useHeatmapToolbarState.js'
import { useHyperspectrumPreloadQueue } from '../composables/hyperspectrum/usePreloadQueue.js'
import { useGpuInferenceState } from '../composables/hyperspectrum/useGpuInferenceState.js'
import { useDisplayModeWorkflow } from '../composables/hyperspectrum/useDisplayModeWorkflow.js'
import { useHyperspectrumRenderPipeline } from '../composables/hyperspectrum/useHyperspectrumRenderPipeline.js'
import { useProjectViewLifecycle } from '../composables/hyperspectrum/useProjectViewLifecycle.js'
import { useSpectrumPlotSync } from '../composables/hyperspectrum/useSpectrumPlotSync.js'
import { useSpectrumPaneState } from '../composables/hyperspectrum/useSpectrumPaneState.js'
import { useViewerTutorial } from '../composables/hyperspectrum/useViewerTutorial.js'
import {
	normalizedLoadPriority,
	shouldChunkBackgroundLoad,
	yieldToBrowser
} from '../composables/hyperspectrum/browserIdle.js'

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
const spectralCalibrationProfileSaveModal = ref(null)
const displayInfoTrigger = ref(null)
const displayOptionsDropdown = ref(null)
const projectMenuDropdown = ref(null)
const displaySelectDropdown = ref(null)
const showDisplayInfoTooltip = ref(false)
const displayInfoTooltipStyle = ref({
	left: "0px",
	top: "0px",
	backgroundColor: "rgb(17 24 39)"
})
const frontendVersionDisplay = String( version.display ?? "" ).trim()

const currentProjectID = () => {
	return typeof route.params.id === "string" ? route.params.id : ""
}

const project = ref({id: ""})
const projects = ref({})
const settings = ref({})

const mip = shallowRef(null)
const mipHsv = shallowRef(null)
const umap = shallowRef(null)
const xyzAxes = shallowRef(null)
const spectralCalibrationProfilesSupported = ref(true)
const spectralCalibrationProfilesLoading = ref(false)
const spectralCalibrationAssignmentSaving = ref(false)
const spectralCalibrationProfileSaving = ref(false)
const spectralCalibrationProfiles = ref([])
const spectralCalibrationAssignedProfileID = ref("")
const spectralCalibrationSelectedProfileID = ref("")
const spectralCalibrationAssignedProfile = shallowRef(null)
const spectralCalibrationSelectedProfile = shallowRef(null)
const spectralCalibrationPreview = shallowRef(null)
const spectralCalibrationPanelOpen = ref(false)
const spectralCalibrationSidebarSection = ref(null)
const focusedSpectralCalibrationPointID = ref("")
const spectralCalibrationPulsePhase = ref(0)
const spectralCalibrationDraftPointCounter = ref(0)
const spectralCalibrationError = ref("")
const spectralCalibrationSidebarOpen = ref(false)
const spectralCalibrationDraft = ref({
	x: 0,
	polynomialOrder: 0,
	includedOrders: [ 0 ],
	points: []
})
const layer = shallowRef(null)
const pcaClassification = shallowRef(null)
const pcaClassificationMip = shallowRef(null)
const pcaMip = shallowRef(null)
const pcaLoadings = shallowRef(null)
const rpcaClassification = shallowRef(null)
const rpcaClassificationMip = shallowRef(null)
const rpcaMip = shallowRef(null)
const rpcaLoadings = shallowRef(null)
const deckLayoutContainer = ref(null)
const deckSpectraPaneContainer = ref(null)
const deckTopPanelGraph = ref(null)
const deckBottomPanelGraph = ref(null)
let spectralCalibrationPlotClickHandler = null
let spectralCalibrationPlotHoverHandler = null
let spectralCalibrationPlotUnhoverHandler = null
let spectralCalibrationGraphClickFallbackHandler = null
let spectralCalibrationPulseInterval = null
let lastSpectralCalibrationClickSignature = null
const graph = ref(null)
const activePlot = ref("umap")
const heatmapRendererPayload = shallowRef(null)
const heatmapRendererPaneState = shallowRef(null)
const heatmapRenderBenchmark = ref({
	renderer: "plotly",
	viewMode: "",
	initialRenderMs: null,
	lastMeasuredAt: null
})
const heatmapRenderBenchmarkToken = ref(0)
const pendingDeckRenderBenchmark = ref(null)
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
const zBlendChannels = ref([])
const zBlendPresetStatus = ref("idle")
const zBlendPresetStatusMessage = ref("")
const zBlendPresetLoadedFromBackend = ref(false)
const zBlendDirty = ref(false)
const zBlendSaving = ref(false)
const zBlendMeasurementIntensityMaximumByLayer = ref({})
const zBlendEstimatedIntensityMaximumByLayer = ref({})
const pcaRgbRedInput = ref(1)
const pcaRgbGreenInput = ref(2)
const pcaRgbBlueInput = ref(3)
const pcaClassificationComponentCount = ref(2)
const pcaMipComponentCount = ref(2)
const confidenceLevelOptions = [ 50, 75, 90, 95 ]
const CONFIDENCE_NONE_VALUE = "none"
const estimateConfidenceLevels = [ 50, 75, 90, 95 ]
const LAYER_CACHE_WINDOW_RADIUS = 10
const DEFAULT_ROI_SPECTRUM_PALETTE = [
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
const cacheOptions = {
	memoryBudgetBytes: 2 * 1024 * 1024 * 1024,
	ttlMs: 7 * 24 * 60 * 60 * 1000,
	prefetchRadius: LAYER_CACHE_WINDOW_RADIUS,
	lowConcurrency: 4
}
const DISPLAY_MODE_OPTIONS = new Set([
	"mip",
	"mip_hsv",
	"umap",
	"layer",
	"z_blend",
	"pca",
	"pca_mip",
	"pca_rgb",
	"rpca",
	"rpca_mip",
	"rpca_rgb"
])
const MAX_Z_BLEND_CHANNELS = 10
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
const DEFAULT_HYPERSPECTRUM_PRIORITIZATION = {
	mip: true,
	mip_hsv: true,
	umap: true,
	z_blend: false,
	layer_window: true,
	pca: false,
	pca_mip: false,
	pca_rgb: false,
	rpca: false,
	rpca_mip: false,
	rpca_rgb: false
}
const PREPARATION_TARGET_ORDER = [
	"mip",
	"mip_hsv",
	"umap",
	"z_blend",
	"pca",
	"pca_mip",
	"pca_rgb",
	"rpca",
	"rpca_mip",
	"rpca_rgb",
	"layer_window"
]

const PREPARATION_TARGET_LABELS = {
	mip: "MIP",
	mip_hsv: "HSV-mapped MIP",
	umap: "UMAP",
	layer_window: "Layer neighborhood",
	z_blend: "Z-blend",
	pca: "PCA classification",
	pca_mip: "PCA MIP",
	pca_rgb: "PCA RGB",
	rpca: "RPCA classification",
	rpca_mip: "RPCA MIP",
	rpca_rgb: "RPCA RGB"
}
const DISPLAY_MODE_SELECT_OPTIONS = [
	{ value: "mip", label: "MIP" },
	{ value: "mip_hsv", label: "HSV-mapped MIP" },
	{ value: "umap", label: "UMAP" },
	{ value: "layer", label: "Layer" },
	{ value: "z_blend", label: "Z-blend" },
	{ value: "pca", label: "PCA classification" },
	{ value: "pca_mip", label: "PCA MIP" },
	{ value: "pca_rgb", label: "PCA RGB" },
	{ value: "rpca", label: "RPCA classification" },
	{ value: "rpca_mip", label: "RPCA MIP" },
	{ value: "rpca_rgb", label: "RPCA RGB" }
]
const DISPLAY_MODE_LABELS = {
	mip: "MIP",
	mip_hsv: "HSV-mapped MIP",
	umap: "UMAP",
	layer: "Layer",
	z_blend: "Z-blend",
	pca: "PCA classification",
	pca_mip: "PCA MIP",
	pca_rgb: "PCA RGB",
	rpca: "RPCA classification",
	rpca_mip: "RPCA MIP",
	rpca_rgb: "RPCA RGB"
}
const roiEstimateUncertaintyLevel = ref(95)
const billingSettings = ref({ groupID: "" })
const estimatedMip = shallowRef(null)
const estimatedMipHsv = shallowRef(null)
const estimatedUmap = shallowRef(null)
const estimatedLayer = shallowRef(null)
const zBlendMeasurementSource = shallowRef(null)
const zBlendEstimatedSource = shallowRef(null)
const estimatedPcaClassification = shallowRef(null)
const estimatedPcaClassificationMip = shallowRef(null)
const estimatedPcaMip = shallowRef(null)
const estimatedPcaLoadings = shallowRef(null)
const estimatedRpcaClassification = shallowRef(null)
const estimatedRpcaClassificationMip = shallowRef(null)
const estimatedRpcaMip = shallowRef(null)
const estimatedRpcaLoadings = shallowRef(null)
const activeEstimatedLayerIndex = ref(-1)
const activeZBlendMeasurementRequestID = ref(0)
const activeZBlendEstimatedRequestID = ref(0)
const activeEstimatedPcaClassificationRequestID = ref(0)
const activeEstimatedPcaClassificationMipRequestID = ref(0)
const activeEstimatedPcaMipRequestID = ref(0)
const activeEstimatedPcaLoadingsRequestID = ref(0)
const activeEstimatedRpcaClassificationRequestID = ref(0)
const activeEstimatedRpcaClassificationMipRequestID = ref(0)
const activeEstimatedRpcaMipRequestID = ref(0)
const activeEstimatedRpcaLoadingsRequestID = ref(0)
const savingXyz = ref(false)
const showPcaLoadings = ref(false)
const showSelectedSpectra = ref(true)
const legendHoverEmphasisEnabled = ref(true)
const projectChatOpen = ref(false)

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

const {
	heatmapRendererMode,
	heatmapZoomAspectRatio,
	heatmapInteractionMode,
	setHeatmapInteractionMode,
	setHeatmapZoomAspectRatio,
	applyHeatmapInteraction,
	handleHeatmapZoomRange,
	handleHeatmapResetZoom,
	syncExternalHeatmapRenderer,
	removeHeatmapViewportSyncListener,
	syncHeatmapViewportSyncListener,
	syncHeatmapModebarGraphListeners,
	resetHeatmapToolbarState,
	finalizeHeatmapRender
} = useHyperspectrumHeatmapToolbarState({
	graph,
	hyperspectrum,
	currentMatrix: () => currentMatrix(),
	matrixDimensions: ( matrix ) => matrixDimensions( matrix ),
	handleHeatmapPointSelection: ( selection ) => handleHeatmapPointSelection( selection ),
	handleHeatmapRegionSelection: ( selection ) => handleHeatmapRegionSelection( selection ),
	heatmapRendererPayload,
	heatmapRendererPaneState,
	heatmapRenderBenchmark,
	activePlot
})

const measurementDataType = String( import.meta.env?.VITE_DATA_TYPE ?? "hypercars" ).trim() || "hypercars"
const HYPERSPECTRAL_CALIBRATION_AXIS_ROLE = "hyperspectral-spectral"

const isMissingCalibrationProfileApiError = ( error ) => {
	const status = Number( error?.status )
	return status === 404 || status === 501
}

const {
	gpuInferenceJobId,
	gpuInferenceStatus,
	gpuInferenceEstimateSpectraReady,
	hasSuccessfulRamanInference,
	hasEstimatedRamanSpectraReady,
	sidebarInferenceStatusText,
	openGpuInferenceModal: openGpuInferenceModalBase,
	handleGpuInferenceSubmitted,
	handleGpuInferenceStatus,
	restoreGpuInferenceState,
	stopGpuInferenceStatusPolling,
	resetGpuInferenceState
} = useGpuInferenceState({
	project,
	billingSettings,
	activeProjectLoadRequestID,
	settingslib,
	projectlib,
	hyperspectra,
	gpuInferenceModal,
	gpuInferenceOutcomeModal,
	resetEstimatedVisualizationState: async () => {
		resetEstimatedVisualizationState()
	},
	clearEstimatedCacheForProject: async () => {
		await clearEstimatedCacheForProject()
	}
})

const {
	visualizationDataSource,
	spectrumDataSource,
	primarySpectrumSource,
	selectedConfidenceLevel,
	selectedHeatmapIndices,
	selectedHeatmapBoundingBox,
	latestMeasurementSingleSpectrum,
	latestMeasurementMeanSpectrum,
	latestMeasurementSelectedSpectrum,
	latestRamanSingleSpectrum,
	latestRamanMeanSpectrum,
	latestRamanSelectedSpectrum,
	measurementSelectionSpectrumQuerying,
	ramanSelectionSpectrumQuerying,
	spectrumSelectionMode,
	resolvedPrimarySpectrumSource,
	resolvedSecondarySpectrumSource,
	normalizeSpectrumSource,
	setVisualizationDataSource,
	setPrimarySpectrumSource,
	setSelectedConfidenceLevel,
	isSelectionSpectrumQuerying,
	cancelSelectionSpectrumQuery,
	cancelSelectionSpectrumQueryState,
	dataTypeForSpectrumSource,
	dataSourceForSpectrumSource,
	confidenceLevelsForSpectrumSource,
	handleHeatmapPointSelection,
	handleHeatmapRegionSelection,
	clearSpectrumSourceState,
	resetSelectionState
} = useHyperspectrumSelections({
	project,
	hyperspectra,
	activeGroupID: () => getActiveGroupID(),
	hasEstimatedRamanSpectraReady: computed(() => hasEstimatedRamanSpectraReady.value),
	hasSuccessfulRamanInference: computed(() => hasSuccessfulRamanInference.value),
	queueSpectraPanelRender: () => queueSpectraPanelRender(),
	measurementDataType,
	confidenceLevelOptions,
	estimateConfidenceLevels
})

const {
	rois,
	selectedRoiIds,
	refreshingRois,
	savingRoi,
	deletingRoi,
	ramanRoiSpectraById,
	estimatedRoiList,
	estimatedRoiListMode,
	estimatedRoiListAttempted,
	activeRamanRoiRequestIDs,
	isRoiRefreshDisabled,
	selectedRoi,
	selectedRoiIdSet,
	selectedRois,
	showAllRoiOverlays,
	roiSelectOptions,
	roiDropdownSummaryLabel,
	activeDisplayedRois,
	resolvedRoiSpectrumPalette,
	roiDisplayStylesById,
	isSelectedRoiId,
	clearSelectedRois,
	toggleSelectedRoiId,
	loadRoiList,
	refreshRoisFromBackend,
	resetEstimatedRoiArtifacts,
	loadEstimatedRoiList,
	cachedRamanRoiSpectrumForId,
	estimatedRoiSpectrumForId,
	roiSpectrumStyleForId,
	refreshRamanRoiSpectrum,
	toggleAllRoiOverlays: applyToggleAllRoiOverlays,
	saveRoi: persistRoi,
	deleteSelectedRois,
	resetRoiState
} = useHyperspectrumRois({
	settings,
	project,
	cacheOptions,
	hyperspectrumCache,
	hyperspectra,
	activeGroupID: () => getActiveGroupID(),
	estimateConfidenceLevels,
	normalizeSelectionBoundingBox,
	canMutateRois: computed(() => canMutateRois.value),
	selectedHeatmapBoundingBox,
	hasEstimatedRamanSpectraReady: computed(() => hasEstimatedRamanSpectraReady.value),
	spectrumSelectionMode: computed(() => spectrumSelectionMode.value),
	dataTypeForSpectrumSource,
	dataSourceForSpectrumSource,
	confidenceLevelsForSpectrumSource,
	queueSpectraPanelRender: () => queueSpectraPanelRender(),
	rerenderHeatmap: async () => {
		if( graph.value === null || currentMatrix() === null ){
			return
		}
		await renderCurrentMatrix()
	},
	defaultRoiSpectrumPalette: DEFAULT_ROI_SPECTRUM_PALETTE
})

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
let deckPaneResizeSession = null
let deckPaneResponsiveResizeQueued = false

const MIN_DECK_HEATMAP_PANE_WIDTH = 320
const MIN_DECK_SPECTRA_PANE_WIDTH = 360
const MIN_DECK_SPECTRUM_PANEL_HEIGHT = 120
const DECK_HEATMAP_PANE_INSET_PX = 8
const DECK_SPECTRA_PANE_DIVIDER_HEIGHT_PX = 20

const deckHeatmapPaneWidth = ref(null)
const deckHeatmapPaneWidthTouched = ref(false)
const deckTopSpectrumPaneHeight = ref(null)
const deckTopSpectrumPaneHeightTouched = ref(false)

const layerCacheOptions = () => {

	const options = { ...cacheOptions }
	const zValues = Array.isArray( xyzAxes.value?.z ) ? xyzAxes.value.z : []
	if( zValues.length > 0 ){
		options.maxLayerIndex = Math.max( 0, zValues.length - 1 )
	}

	return options
}

let pcaClassificationLoadPromise = null
let rpcaClassificationLoadPromise = null

const downloading = ref(false)

const sidebarOpen = ref(false)
const sidebarStyle = computed(() => {
  return sidebarOpen.value
    ? { left: '2px' }
    : { left: 'calc(-16rem - 2px)' }
})

const hasProjectReference = computed(() => {
	return typeof project.value?.id === "string" && project.value.id.length > 0
})

const isSharedProject = computed(() => {
	const shareInfo = project.value?.shareInfo ?? {}
	const shareInfoProjectID = String( shareInfo?.projectId ?? "" ).trim()
	const shareInfoProjectKey = String( shareInfo?.projectKey ?? "" ).trim()

	return project.value?.shared === true || ( shareInfoProjectID.length > 0 && shareInfoProjectKey.length > 0 )
})

const canMutateRois = computed(() => {
	return hasProjectReference.value
})

const canEditXyz = computed(() => {
	return hasProjectReference.value && isSharedProject.value === false
})

const hasSelectedRegion = computed(() => {
	return normalizeSelectionBoundingBox( selectedHeatmapBoundingBox.value ) !== null
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

const queriedSpectrumLegendColor = computed(() => {
	const configuredColor = String( settings.value?.hyperspectrumColors?.queriedSpectrum ?? "" ).trim()
	return configuredColor.length > 0 ? configuredColor : "#1f77b4"
})

const activeLoadingLegendEntries = computed(() => {
	if( activePlot.value === "pca_rgb" || activePlot.value === "rpca_rgb" ){
		return [
			{
				key: `loading-r-${pcaRgbChannels.value.r}`,
				label: "R - PC" + String( pcaRgbChannels.value.r ).padStart( 2, "0" ),
				color: "rgb(239, 68, 68)"
			},
			{
				key: `loading-g-${pcaRgbChannels.value.g}`,
				label: "G - PC" + String( pcaRgbChannels.value.g ).padStart( 2, "0" ),
				color: "rgb(34, 197, 94)"
			},
			{
				key: `loading-b-${pcaRgbChannels.value.b}`,
				label: "B - PC" + String( pcaRgbChannels.value.b ).padStart( 2, "0" ),
				color: "rgb(59, 130, 246)"
			}
		]
	}

	const componentIndices = activePlot.value === "pca_mip" || activePlot.value === "rpca_mip"
		? pcaMipLoadingComponents()
		: ( activePlot.value === "pca" || activePlot.value === "rpca"
			? pcaClassificationLoadingComponents()
			: [] )
	const activeComponentSet = new Set( componentIndices )

	return pcaLegend.value
		.filter(( entry ) => activeComponentSet.has( entry.componentIndex ))
		.map(( entry ) => ({
			key: `loading-${entry.componentIndex}`,
			label: entry.label,
			color: entry.color
		}))
})

const maxLayerIndex = computed(() => {

	const zValues = Array.isArray( xyzAxes.value?.z ) ? xyzAxes.value.z : []
	if( zValues.length <= 0 ){
		return Number.MAX_SAFE_INTEGER
	}

	return Math.max( 0, zValues.length - 1 )
})

const zAxisUnitLabel = computed(() => {
	const unit = typeof xyzAxes.value?.zUnit === "string" ? xyzAxes.value.zUnit.trim() : ""
	return unit.length > 0 ? unit : ""
})

const formatCompactNumericValue = ( value ) => {

	const numeric = Number( value )
	if( Number.isFinite( numeric ) === false ){
		return ""
	}

	const absolute = Math.abs( numeric )
	if( absolute >= 10000 || ( absolute > 0 && absolute < 0.01 ) ){
		return numeric.toPrecision( 5 ).replace(/\.?0+e/, "e" )
	}

	return numeric.toLocaleString( undefined, {
		maximumFractionDigits: 4
	})
}

const layerAxisValueLabel = computed(() => {

	const layerIndex = normalizeLayerInput( layerInput.value )
	const axisValue = zValueForLayerIndex( layerIndex, layerIndex )
	const formattedValue = formatCompactNumericValue( axisValue )

	if( formattedValue.length === 0 ){
		return ""
	}

	return zAxisUnitLabel.value.length > 0
		? `${formattedValue} ${zAxisUnitLabel.value}`
		: formattedValue
})

const {
	viewerTutorialPromptVisible,
	viewerTutorialVisible,
	viewerTutorialStepIndex,
	activeViewerTutorialTargetElement,
	activeViewerTutorialStep,
	viewerTutorialSteps,
	isHeatmapTutorialStepActive,
	isProjectMenuItemDimmed,
	projectMenuDividerClass,
	showTutorialRamanSidebarPlaceholder,
	showRamanInferenceTutorialBlock,
	displayOptionsMenuClass,
	projectMenuClass,
	displaySelectMenuClass,
	tutorialDisplaySelectOpenBinding,
	tutorialDisplayOptionsOpenBinding,
	tutorialProjectMenuOpenBinding,
	handleTutorialDisplaySelectOpenUpdate,
	handleTutorialDisplayOptionsOpenUpdate,
	handleTutorialProjectMenuOpenUpdate,
	maybeOfferViewerTutorialPrompt,
	startViewerTutorial,
	restartViewerTutorial,
	skipViewerTutorialPrompt,
	skipActiveViewerTutorial,
	advanceViewerTutorial,
	rewindViewerTutorial,
	resetViewerTutorialState
} = useViewerTutorial({
	nextTick,
	project,
	activeProjectLoadRequestID,
	activePlot,
	heatmapInteractionMode: computed(() => heatmapInteractionMode.value),
	hasEstimatedRamanSpectraReady: computed(() => hasEstimatedRamanSpectraReady.value),
	displaySelectDropdown,
	projectMenuDropdown,
	setHeatmapInteractionMode: ( mode ) => setHeatmapInteractionMode( mode ),
	renderCurrentMatrix: () => renderCurrentMatrix(),
	isKnownDisplayMode: ( value ) => DISPLAY_MODE_OPTIONS.has( value )
})

const resolvedViewerTutorialSteps = computed(() => {
	if( Array.isArray( viewerTutorialSteps?.value ) ){
		return viewerTutorialSteps.value
	}

	if( Array.isArray( viewerTutorialSteps ) ){
		return viewerTutorialSteps
	}

	return []
})

const viewerTutorialStepCount = computed(() => resolvedViewerTutorialSteps.value.length )

const isFinalViewerTutorialStep = computed(() => {
	return viewerTutorialStepIndex.value >= ( resolvedViewerTutorialSteps.value.length - 1 )
})

const heatmapUsesEstimatedRaman = computed(() => {
	return hasSuccessfulRamanInference.value && visualizationDataSource.value === "raman"
})

const spectrumGridlineSourceKeyForSpectrumSource = ( source ) => {
	return normalizeSpectrumSource( source ) === "raman" ? "estimate" : "measurement"
}

const topSpectrumGridlineSourceKey = () => {

	const mode = spectrumSelectionMode.value
	const topSource = mode === "both"
		? ( resolvedSecondarySpectrumSource() ?? "measurement" )
		: mode

	return spectrumGridlineSourceKeyForSpectrumSource( topSource )
}

const bottomSpectrumGridlineSourceKey = () => {

	const mode = spectrumSelectionMode.value
	const bottomSource = mode === "both"
		? resolvedPrimarySpectrumSource()
		: mode

	return spectrumGridlineSourceKeyForSpectrumSource( bottomSource )
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

const openProjectMenu = async () => {
	projectMenuDropdown.value?.close?.()
	await router.push({ name: "Main menu" })
}

const openShareModal = () => {
	if( project.value?.shared ) return
	shareModal.value?.open()
}

const ownedProjectActionTooltip = ( actionLabel ) => {
	return `${actionLabel} is allowed for owned projects.`
}

const openZenodoModal = () => {
	if( project.value?.shared ) return
	zenodoModal.value?.open()
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
	cancelSelectionSpectrumQuery( "raman" )

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
		clearSpectrumSourceState( "raman" )
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
	if( activePlot.value === "z_blend" ){
		return zBlendMeasurementSource.value
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
	if( activePlot.value === "z_blend" ){
		return zBlendEstimatedSource.value
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

	if( matrix !== null &&
		typeof matrix === "object" &&
		matrix.kind === "z-blend-source" &&
		Number.isFinite( Number( matrix.width )) &&
		Number.isFinite( Number( matrix.height )) ){
		return {
			width: Math.max( 1, Number( matrix.width ) || 1 ),
			height: Math.max( 1, Number( matrix.height ) || 1 )
		}
	}

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

const getActiveGroupID = () => {
	if( typeof billingSettings.value?.groupID === "string" ){
		return billingSettings.value.groupID
	}

	return ""
}

const resolvedActiveGroupID = computed(() => getActiveGroupID())

const normalizeSpectralCalibrationProfileModel = ( profileOrModel = {} ) => {
	const candidateModel = profileOrModel?.model?.type === "polynomial"
		? profileOrModel.model
		: profileOrModel

	return normalizeCalibrationModel( candidateModel ?? { x: 0, polynomialOrder: 0, includedOrders: [ 0 ], points: [] })
}

const cloneSpectralCalibrationModel = ( value = {} ) => {
	const normalized = normalizeSpectralCalibrationProfileModel( value )
	return {
		x: normalized.x,
		polynomialOrder: normalized.polynomialOrder,
		includedOrders: [ ...normalized.includedOrders ],
		points: normalized.points.map(( point ) => ({ ...point }))
	}
}

const buildDefaultSpectralCalibrationModel = () => {
	return cloneSpectralCalibrationModel({ x: 0, polynomialOrder: 0, includedOrders: [ 0 ], points: [] })
}

const buildDefaultSpectralCalibrationIncludedOrders = ( polynomialOrder = 0 ) => {
	const resolvedOrder = Math.max( Math.trunc( Number( polynomialOrder ) ), 0 )
	return Array.from({ length: resolvedOrder + 1 }, ( _, index ) => index )
}

const normalizeSpectralCalibrationIncludedOrders = ( includedOrders = [], polynomialOrder = 0 ) => {
	const resolvedOrder = Math.max( Math.trunc( Number( polynomialOrder ) ), 0 )
	const fallbackOrders = buildDefaultSpectralCalibrationIncludedOrders( resolvedOrder )
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

const toSpectralCalibrationDraftPoint = ( point = {}, index = 0 ) => {
	const fallbackID = `calibration-point-${index + 1}`
	const id = String( point?.id ?? fallbackID ).trim() || fallbackID
	const sourceX = Number( point?.sourceX ?? 0 )
	const numericTargetX = Number( point?.targetX )
	const resolvedSourceX = Number.isFinite( sourceX ) ? sourceX : 0

	return {
		id,
		sourceX: resolvedSourceX,
		targetInput: Number.isFinite( numericTargetX ) ? String( numericTargetX ) : String( resolvedSourceX )
	}
}

const buildSpectralCalibrationDraftFromModel = ( value = {} ) => {
	const normalized = normalizeSpectralCalibrationProfileModel( value )
	const points = normalized.points.map(( point, index ) => toSpectralCalibrationDraftPoint( point, index ))
	spectralCalibrationDraftPointCounter.value = points.length

	return {
		x: normalized.x,
		polynomialOrder: normalized.polynomialOrder,
		includedOrders: [ ...normalized.includedOrders ],
		points
	}
}

const buildSpectralCalibrationModelFromDraft = ( draft = spectralCalibrationDraft.value ) => {
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

const serializeSpectralCalibrationModel = ( value ) => {
	return JSON.stringify( normalizeSpectralCalibrationProfileModel( value ) )
}

const spectralCalibrationProfileOptions = computed(() => {
	const options = spectralCalibrationProfiles.value.map(( profile ) => {
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

	const selectedProfileID = String( spectralCalibrationSelectedProfileID.value ?? "" ).trim()
	if( selectedProfileID.length > 0 && options.some(( option ) => option.value === selectedProfileID ) === false ){
		const fallbackLabel = String(
			spectralCalibrationSelectedProfile.value?.friendlyName ??
			spectralCalibrationAssignedProfile.value?.friendlyName ??
			selectedProfileID
		).trim() || selectedProfileID
		options.unshift({
			value: selectedProfileID,
			label: fallbackLabel
		})
	}

	return options
})

const spectralCalibrationReservedProfileNames = computed(() => {
	return spectralCalibrationProfiles.value
		.filter(( profile ) => profile?.shared !== true )
		.map(( profile ) => String( profile?.friendlyName ?? "" ).trim() )
		.filter(( friendlyName ) => friendlyName.length > 0 )
})

const spectralCalibrationProfileNameExists = ( friendlyName ) => {
	const candidateName = String( friendlyName ?? "" ).trim()
	if( candidateName.length === 0 ){
		return false
	}

	return spectralCalibrationReservedProfileNames.value.some(( reservedName ) => {
		return String( reservedName ?? "" ).trim().localeCompare( candidateName, undefined, { sensitivity: "accent" } ) === 0
	})
}

const spectralCalibrationDraftModel = computed(() => {
	return buildSpectralCalibrationModelFromDraft( spectralCalibrationDraft.value )
})

const spectralCalibrationPreviewIsCurrent = computed(() => {
	return spectralCalibrationPreview.value !== null &&
		serializeSpectralCalibrationModel( spectralCalibrationPreview.value ) === serializeSpectralCalibrationModel( spectralCalibrationDraftModel.value )
})

const spectralCalibrationHasSavablePoints = computed(() => {
	return calibrationHasValidPoints( spectralCalibrationDraftModel.value )
})

const spectralCalibrationMaxOrder = computed(() => {
	return calibrationMaxPolynomialOrder( spectralCalibrationDraftModel.value )
})

const canSaveSpectralCalibrationProfile = computed(() => {
	return project.value?.shared !== true &&
		spectralCalibrationProfilesSupported.value &&
		spectralCalibrationProfileSaving.value === false &&
		spectralCalibrationHasSavablePoints.value &&
		spectralCalibrationPreviewIsCurrent.value
})

const spectralCalibrationProfileSaveDisabledReason = computed(() => {
	if( spectralCalibrationProfilesSupported.value === false ){
		return "Calibration profiles are not available."
	}
	if( spectralCalibrationPreviewIsCurrent.value === false ){
		return "Run the preview before saving the calibration profile."
	}
	if( spectralCalibrationHasSavablePoints.value === false ){
		return "Select enough valid points to fit the calibration."
	}

	return ""
})

const activeSpectralCalibrationProfile = computed(() => {
	const selectedProfileID = String( spectralCalibrationSelectedProfileID.value ?? "" ).trim()
	if( selectedProfileID.length === 0 ){
		return null
	}

	const selectedProfile = spectralCalibrationSelectedProfile.value
	if( String( selectedProfile?.profileID ?? "" ).trim() === selectedProfileID ){
		return selectedProfile
	}

	const assignedProfile = spectralCalibrationAssignedProfile.value
	if( String( assignedProfile?.profileID ?? "" ).trim() === selectedProfileID ){
		return assignedProfile
	}

	return null
})

const activeSpectralCalibrationProfileLabel = computed(() => {
	const profile = activeSpectralCalibrationProfile.value
	const friendlyName = String( profile?.friendlyName ?? "" ).trim()
	if( friendlyName.length > 0 ){
		return friendlyName
	}

	const profileID = String( spectralCalibrationSelectedProfileID.value ?? "" ).trim()
	return profileID.length > 0 ? profileID : "No calibration"
})

const spectralCalibrationSelectionDirty = computed(() => {
	return String( spectralCalibrationSelectedProfileID.value ?? "" ).trim() !==
		String( spectralCalibrationAssignedProfileID.value ?? "" ).trim()
})

const canAssignSpectralCalibrationProfile = computed(() => {
	return project.value?.shared !== true &&
		spectralCalibrationProfilesSupported.value &&
		spectralCalibrationAssignmentSaving.value === false &&
		spectralCalibrationSelectionDirty.value
})

const activeSpectralCalibrationModel = computed(() => {
	if( spectralCalibrationPreview.value !== null ){
		const normalizedPreview = normalizeSpectralCalibrationProfileModel( spectralCalibrationPreview.value )
		if( calibrationHasValidPoints( normalizedPreview ) ){
			return normalizedPreview
		}
	}

	const profile = activeSpectralCalibrationProfile.value
	if( profile === null || typeof profile !== "object" ){
		return null
	}

	const normalizedModel = normalizeSpectralCalibrationProfileModel( profile )
	return calibrationHasValidPoints( normalizedModel ) ? normalizedModel : null
})

const rawSpectralAxisValues = () => {
	const rawValues = Array.isArray( xyzAxes.value?.z ) ? xyzAxes.value.z : []
	return rawValues.map(( value, index ) => numericAxisValue( value, index ))
}

const effectiveSpectralAxisValues = () => {
	const rawValues = rawSpectralAxisValues()
	const calibrationModel = activeSpectralCalibrationModel.value
	if( calibrationModel === null ){
		return rawValues
	}

	return applyCalibrationToValues( rawValues, calibrationModel )
}

const plotAxes = () => {
	if( xyzAxes.value === null || typeof xyzAxes.value !== "object" ){
		return xyzAxes.value
	}

	return {
		...xyzAxes.value,
		z: effectiveSpectralAxisValues(),
		rawZ: rawSpectralAxisValues(),
		zCalibrationProfileID: String( spectralCalibrationSelectedProfileID.value ?? "" ).trim()
	}
}

const resolvedUmapChannelColors = () => {
	return {
		r: settings.value?.hyperspectrumColors?.umapChannels?.r ?? "#ff0000",
		g: settings.value?.hyperspectrumColors?.umapChannels?.g ?? "#00ff00",
		b: settings.value?.hyperspectrumColors?.umapChannels?.b ?? "#0000ff"
	}
}

const normalizeZBlendPalette = ( palette ) => {

	const source = Array.isArray( palette ) ? palette : []
	const normalizedPalette = source
		.map(( value ) => String( value ?? "" ).trim() )
		.filter(( value ) => value.length > 0 )
		.slice( 0, MAX_Z_BLEND_CHANNELS )

	while( normalizedPalette.length < MAX_Z_BLEND_CHANNELS ){
		normalizedPalette.push( DEFAULT_Z_BLEND_PALETTE[normalizedPalette.length] )
	}

	return normalizedPalette
}

const resolvedZBlendPalette = () => {
	return normalizeZBlendPalette( settings.value?.hyperspectrumColors?.zBlendPalette )
}

const zAxisValues = () => {

	const rawValues = Array.isArray( xyzAxes.value?.z ) ? xyzAxes.value.z : []
	if( rawValues.length > 0 ){
		return rawValues.map(( value, index ) => numericAxisValue( value, index ))
	}

	return [ 0 ]
}

const normalizeZBlendLayerIndex = ( value, fallback = 0 ) => {

	const axis = zAxisValues()
	const maximumIndex = Math.max( 0, axis.length - 1 )
	const parsed = Number.parseInt( value, 10 )
	const fallbackIndex = Number.isInteger( Number( fallback ) )
		? Number( fallback )
		: resolveZBlendLayerMatch( fallback ).layerIndex

	if( Number.isInteger( parsed ) === false ){
		return Math.max( 0, Math.min( maximumIndex, fallbackIndex ))
	}

	return Math.max( 0, Math.min( maximumIndex, parsed ))
}

const zValueForLayerIndex = ( layerIndex, fallback = 0 ) => {

	const axis = zAxisValues()
	if( axis.length === 0 ){
		return numericAxisValue( fallback, 0 )
	}

	const normalizedIndex = normalizeZBlendLayerIndex( layerIndex, 0 )
	return numericAxisValue( axis[normalizedIndex], normalizedIndex )
}

const resolveZBlendLayerMatch = ( requestedZ ) => {

	const availableValues = zAxisValues()
	if( availableValues.length === 0 ){
		return {
			layerIndex: 0,
			resolvedZ: 0
		}
	}

	const normalizedRequestedZ = numericAxisValue( requestedZ, availableValues[0] )
	let bestIndex = 0
	let bestDistance = Math.abs( availableValues[0] - normalizedRequestedZ )

	for( let index = 1; index < availableValues.length; index++ ){
		const candidateDistance = Math.abs( availableValues[index] - normalizedRequestedZ )
		if( candidateDistance < bestDistance ){
			bestDistance = candidateDistance
			bestIndex = index
		}
	}

	return {
		layerIndex: bestIndex,
		resolvedZ: availableValues[bestIndex]
	}
}

const canStepZBlendChannelValue = ( index, direction ) => {

	const channel = Array.isArray( zBlendResolvedChannels.value ) ? zBlendResolvedChannels.value[index] : null
	if( channel === null || typeof channel !== "object" ){
		return false
	}

	const axis = zAxisValues()
	if( axis.length <= 1 ){
		return false
	}

	const nextIndex = channel.resolvedLayerIndex + ( direction > 0 ? 1 : -1 )
	return nextIndex >= 0 && nextIndex < axis.length
}

const stepZBlendChannelValue = ( index, direction ) => {

	const normalizedChannels = normalizeZBlendChannels( zBlendChannels.value )
	const channel = normalizedChannels[index]
	if( channel === undefined ){
		return
	}

	const axis = zAxisValues()
	if( axis.length === 0 ){
		return
	}

	const currentIndex = normalizeZBlendLayerIndex( channel.resolvedLayerIndex, index )
	const nextIndex = Math.max( 0, Math.min( axis.length - 1, currentIndex + ( direction > 0 ? 1 : -1 ) ))
	if( nextIndex === currentIndex ){
		return
	}

	channel.resolvedLayerIndex = nextIndex
	channel.requestedZ = zValueForLayerIndex( nextIndex, axis[nextIndex] )
	zBlendChannels.value = normalizedChannels
	markZBlendDirty()
	queueZBlendRender()
}

const zBlendChannelColorHex = ( index ) => {
	const palette = resolvedZBlendPalette()
	if( palette.length === 0 ){
		return DEFAULT_Z_BLEND_PALETTE[0]
	}

	const normalizedIndex = Number.isInteger( Number( index ) ) ? Number( index ) : 0
	return palette[(( normalizedIndex % palette.length ) + palette.length ) % palette.length]
}

const zBlendChannelIntensityMaximum = ( matrix ) => {

	if( Array.isArray( matrix ) === false || matrix.length === 0 ){
		return 1
	}

	let maximum = 0

	for( const row of matrix ){
		if( Array.isArray( row ) === false ) continue

		for( const value of row ){
			const numeric = Number( value )
			if( Number.isFinite( numeric ) === false ) continue
			if( numeric > maximum ){
				maximum = numeric
			}
		}
	}

	return maximum > 0 ? maximum : 1
}

const zBlendChannelDefaultContrastLimits = ( matrix ) => {

	if( Array.isArray( matrix ) === false || matrix.length === 0 ){
		return {
			clampMin: 0,
			clampMax: 1
		}
	}

	const maximum = zBlendChannelIntensityMaximum( matrix )
	if( maximum <= 0 ){
		return {
			clampMin: 0,
			clampMax: 1
		}
	}

	let nonZeroCount = 0
	for( const row of matrix ){
		if( Array.isArray( row ) === false ) continue
		for( const value of row ){
			const numeric = Number( value )
			if( Number.isFinite( numeric ) && numeric > 0 ){
				nonZeroCount += 1
			}
		}
	}

	if( nonZeroCount <= 0 ){
		return {
			clampMin: 0,
			clampMax: maximum
		}
	}

	const SAMPLE_TARGET = 200000
	const sampleStride = Math.max( 1, Math.ceil( nonZeroCount / SAMPLE_TARGET ))
	const samples = []
	let nonZeroIndex = 0

	for( const row of matrix ){
		if( Array.isArray( row ) === false ) continue
		for( const value of row ){
			const numeric = Number( value )
			if( Number.isFinite( numeric ) === false || numeric <= 0 ){
				continue
			}

			if(( nonZeroIndex % sampleStride ) === 0 ){
				samples.push( numeric )
			}
			nonZeroIndex += 1
		}
	}

	if( samples.length <= 0 ){
		return {
			clampMin: 0,
			clampMax: maximum
		}
	}

	samples.sort(( left, right ) => left - right )

	const cutoffPercentile = 0.0005
	const lowIndex = Math.max( 0, Math.min( samples.length - 1, Math.floor( samples.length * cutoffPercentile )))
	const highIndex = Math.max( 0, Math.min( samples.length - 1, Math.floor( samples.length * ( 1 - cutoffPercentile ))))
	const clampMin = samples[lowIndex] ?? 0
	const clampMax = samples[highIndex] ?? maximum

	if( Number.isFinite( clampMin ) === false ||
		Number.isFinite( clampMax ) === false ||
		clampMin === clampMax ){
		return {
			clampMin: 0,
			clampMax: maximum
		}
	}

	return {
		clampMin: Math.max( 0, clampMin ),
		clampMax: Math.max( Math.max( 0, clampMin ), clampMax )
	}
}

const activeZBlendSourceForControls = () => {

	if( heatmapUsesEstimatedRaman.value ){
		return zBlendEstimatedSource.value ?? zBlendMeasurementSource.value
	}

	return zBlendMeasurementSource.value ?? zBlendEstimatedSource.value
}

const activeZBlendIntensityMaximumMap = () => {
	return heatmapUsesEstimatedRaman.value
		? zBlendEstimatedIntensityMaximumByLayer.value
		: zBlendMeasurementIntensityMaximumByLayer.value
}

const zBlendChannelSliderMaximum = ( index ) => {

	const source = activeZBlendSourceForControls()
	const channel = Array.isArray( source?.channels ) ? source.channels[index] : null
	const sourceMaximum = Number( channel?.intensityMaximum )
	if( Number.isFinite( sourceMaximum ) && sourceMaximum > 0 ){
		return sourceMaximum
	}

	const resolvedChannel = Array.isArray( zBlendResolvedChannels.value ) ? zBlendResolvedChannels.value[index] : null
	const layerKey = String( resolvedChannel?.resolvedLayerIndex ?? "" )
	const mappedMaximum = Number( activeZBlendIntensityMaximumMap()?.[ layerKey ] )

	return Number.isFinite( mappedMaximum ) && mappedMaximum > 0 ? mappedMaximum : 1
}

const zBlendChannelSliderStep = ( index ) => {

	const maximum = zBlendChannelSliderMaximum( index )
	if( maximum <= 1 ){
		return 0.001
	}

	return Math.max( maximum / 1000, 0.001 )
}

const zBlendResolvedChannelLabel = ( index ) => {

	const channel = Array.isArray( zBlendResolvedChannels.value ) ? zBlendResolvedChannels.value[index] : null
	if( channel === null || typeof channel !== "object" ){
		return {
			layerLabel: "0",
			zLabel: "0"
		}
	}

	return {
		layerLabel: String( channel.resolvedLayerIndex ),
		zLabel: String( Number.isFinite( channel.resolvedZ ) ? channel.resolvedZ : 0 )
	}
}

const zBlendPresetSummaryLabel = computed(() => {

	if( zBlendSaving.value ){
		return "Saving channels..."
	}

	if( zBlendPresetStatus.value === "saved" ){
		return "Channel settings saved"
	}

	if( zBlendDirty.value ){
		return "Unsaved channel changes"
	}

	if( zBlendPresetLoadedFromBackend.value ){
		return "Project channels loaded"
	}

	return ""
})

const zBlendResolvedChannels = computed(() => {
	const channels = Array.isArray( zBlendChannels.value ) ? zBlendChannels.value : []

	return channels.map(( channel, index ) => {
		const resolvedLayerIndex = normalizeZBlendLayerIndex( channel?.resolvedLayerIndex, index )
		const resolvedZ = zValueForLayerIndex( resolvedLayerIndex, resolvedLayerIndex )
		const clampMin = Math.max( 0, Number( channel?.clampMin ?? 0 ) || 0 )
		const clampMax = Math.max( clampMin, Number( channel?.clampMax ?? clampMin ) || clampMin )

		return {
			enabled: channel?.enabled !== false,
			requestedZ: numericAxisValue( channel?.requestedZ, resolvedZ ),
			resolvedLayerIndex,
			resolvedZ,
			clampMin,
			clampMax,
			color: zBlendChannelColorHex( index )
		}
	})
})

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

const normalizeOpacity = ( value, fallback = 0.25 ) => {

	const numeric = Number( value )
	if( Number.isFinite( numeric ) === false ){
		return fallback
	}

	return Math.max( 0, Math.min( 1, numeric ))
}

const normalizeDisplayMode = ( value ) => {
	const normalized = String( value ?? "" ).trim()
	return DISPLAY_MODE_OPTIONS.has( normalized ) ? normalized : "umap"
}

const normalizeShowHideMode = ( value, fallback = "hide" ) => {
	const normalized = String( value ?? "" ).trim().toLowerCase()
	if( normalized === "show" || normalized === "hide" ){
		return normalized
	}
	return fallback === "show" ? "show" : "hide"
}

const normalizeConfidenceLevel = ( value ) => {
	return normalizeSelectionConfidenceLevel( value, {
		confidenceLevelOptions,
		noneValue: CONFIDENCE_NONE_VALUE
	}, 95 )
}

const normalizeRoiEstimateUncertaintyLevel = ( value ) => {
	const normalized = String( value ?? "" ).trim().toLowerCase()
	if( normalized === "show" ){
		return 95
	}

	if( normalized === "hide" ){
		return CONFIDENCE_NONE_VALUE
	}

	return normalizeConfidenceLevel( value )
}

const defaultDisplayMode = () => {
	return normalizeDisplayMode( settings.value?.hyperspectrumDefaults?.displayMode )
}

const defaultHeatmapInteractionMode = () => {
	return normalizeHeatmapInteraction( settings.value?.hyperspectrumDefaults?.heatmapInteraction )
}

const defaultHeatmapRendererMode = () => "deckgl"

const defaultHeatmapZoomAspectRatio = () => {
	return normalizeHeatmapZoomAspectRatio( settings.value?.hyperspectrumDefaults?.heatmapZoomAspectRatio )
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

const defaultRoiEstimateUncertaintyLevel = () => {
	return normalizeRoiEstimateUncertaintyLevel( settings.value?.hyperspectrumDefaults?.roiEstimateUncertainty )
}

const normalizeHyperspectrumPrioritization = ( value ) => {

	const source = value !== null && typeof value === "object" ? value : {}
	const normalized = { ...DEFAULT_HYPERSPECTRUM_PRIORITIZATION }

	for( const key of Object.keys( DEFAULT_HYPERSPECTRUM_PRIORITIZATION ) ){
		if( typeof source[key] === "boolean" ){
			normalized[key] = source[key]
			continue
		}

		if( typeof source[key] === "string" ){
			normalized[key] = source[key] !== "false"
		}
	}

	return normalized
}

const resolvedHyperspectrumPrioritization = () => {
	return normalizeHyperspectrumPrioritization( settings.value?.hyperspectrumPrioritization )
}

const blockingPreparationTargetForDisplayMode = ( displayMode ) => {
	return normalizeDisplayMode( displayMode ) === "layer" ? "layer_window" : normalizeDisplayMode( displayMode )
}

const preparationTargetLabel = ( target ) => {
	return PREPARATION_TARGET_LABELS[target] ?? String( target ?? "" )
}

const resolvePrioritizedPreparationTargets = ( startingDisplayMode ) => {

	const prioritized = resolvedHyperspectrumPrioritization()
	const blockingTarget = blockingPreparationTargetForDisplayMode( startingDisplayMode )

	return PREPARATION_TARGET_ORDER.filter(( target ) => {
		return prioritized[target] === true &&
			target !== blockingTarget &&
			target !== "layer_window"
	})
}

const resolveDeferredPreparationTargets = ( startingDisplayMode ) => {

	const prioritized = resolvedHyperspectrumPrioritization()
	const blockingTarget = blockingPreparationTargetForDisplayMode( startingDisplayMode )

	return PREPARATION_TARGET_ORDER.filter(( target ) => {
		return prioritized[target] !== true &&
			target !== blockingTarget &&
			target !== "layer_window"
	})
}

const resolveTrailingPreparationTargets = ( startingDisplayMode ) => {

	const blockingTarget = blockingPreparationTargetForDisplayMode( startingDisplayMode )
	if( blockingTarget === "layer_window" ){
		return []
	}

	return [ "layer_window" ]
}

const {
	currentPreparationTarget,
	pendingPreparationTargets,
	showDisplayInfoIcon,
	resetPreparationState,
	markPreparationStarted,
	markPreparationCompleted,
	markPreparationFailed,
	emitLoadedOnce,
	installProjectBackgroundInteractionListeners,
	removeBackgroundInteractionListeners,
	clearProjectBackgroundWork,
	loadVisualizationTargetData,
	queueProjectBackgroundHydration,
	scheduleDisplayPayloadPrewarm,
	resolveLayerWindowIndices,
	prefetchMeasurementLayerWindow,
	prefetchEstimatedLayerWindow,
	ensureMeasurementLayerWindowReady,
	ensureEstimatedLayerWindowReady,
	scheduleLayerPayloadPrewarm,
	invalidateDisplayPayloadPrewarm,
	invalidateLayerPayloadPrewarm
} = useHyperspectrumPreloadQueue({
	emitLoaded: () => emit("loaded"),
	nextTick,
	graph,
	activePlot,
	project,
	activeProjectLoadRequestID,
	heatmapRendererMode,
	heatmapUsesEstimatedRaman: computed(() => heatmapUsesEstimatedRaman.value),
	mip,
	cacheOptions,
	layerCacheOptions: () => layerCacheOptions(),
	layerInput,
	maxLayerIndex,
	pcaClassificationComponentCount,
	pcaMipComponentCount,
	pcaComponentIndices,
	activePcaClassificationCount: () => activePcaClassificationCount(),
	resetActivePcaComponents: ( count ) => resetActivePcaComponents( count ),
	normalizeLayerInput: ( value ) => normalizeLayerInput( value ),
	normalizePcaComponentInput: ( value ) => normalizePcaComponentInput( value ),
	decompositionMipMode: ( mode, count ) => decompositionMipMode( mode, count ),
	decompositionScoreMode: ( mode, index ) => decompositionScoreMode( mode, index ),
	loadEstimatedArtifact: ( path, priority ) => loadEstimatedArtifact( path, priority ),
	loadEstimatedMip: ( priority ) => loadEstimatedMip( priority ),
	loadEstimatedMipHsv: ( priority ) => loadEstimatedMipHsv( priority ),
	loadEstimatedUmap: ( priority ) => loadEstimatedUmap( priority ),
	loadEstimatedLayer: ( index, priority ) => loadEstimatedLayer( index, priority ),
	loadEstimatedPcaClassificationMip: ( count, priority ) => loadEstimatedPcaClassificationMip( count, priority ),
	loadEstimatedPcaMip: ( count, priority ) => loadEstimatedPcaMip( count, priority ),
	loadEstimatedPcaClassification: ( priority ) => loadEstimatedPcaClassification( priority ),
	loadEstimatedRpcaClassificationMip: ( count, priority ) => loadEstimatedRpcaClassificationMip( count, priority ),
	loadEstimatedRpcaMip: ( count, priority ) => loadEstimatedRpcaMip( count, priority ),
	loadEstimatedRpcaClassification: ( priority ) => loadEstimatedRpcaClassification( priority ),
	loadMipHsv: ( priority ) => loadMipHsv( priority ),
	loadUmap: ( priority ) => loadUmap( priority ),
	loadLayer: ( index, priority ) => loadLayer( index, priority ),
	loadZBlendSource: ( estimated, priority ) => loadZBlendSource( estimated, priority ),
	loadPcaClassificationMip: ( count, priority ) => loadPcaClassificationMip( count, priority ),
	loadPcaMip: ( count, priority ) => loadPcaMip( count, priority ),
	loadPcaClassification: ( priority ) => loadPcaClassification( priority ),
	loadRpcaClassificationMip: ( count, priority ) => loadRpcaClassificationMip( count, priority ),
	loadRpcaMip: ( count, priority ) => loadRpcaMip( count, priority ),
	loadRpcaClassification: ( priority ) => loadRpcaClassification( priority ),
	resolvePrioritizedPreparationTargets: ( startingDisplayMode ) => resolvePrioritizedPreparationTargets( startingDisplayMode ),
	resolveDeferredPreparationTargets: ( startingDisplayMode ) => resolveDeferredPreparationTargets( startingDisplayMode ),
	resolveTrailingPreparationTargets: ( startingDisplayMode ) => resolveTrailingPreparationTargets( startingDisplayMode ),
	prewarmVisualizationTargetPayload: ( target, loadedData ) => prewarmVisualizationTargetPayload( target, loadedData ),
	hyperspectrumCache,
	hyperspectrum,
	layerHeatmapColorscale: () => layerHeatmapColorscale()
})

const updateDisplayInfoTooltipPosition = () => {

	const triggerElement = displayInfoTrigger.value
	if( triggerElement === null || typeof triggerElement.getBoundingClientRect !== "function" ){
		return
	}

	const triggerRect = triggerElement.getBoundingClientRect()
	const tooltipWidth = 256
	const tooltipHeight = 72 + ( pendingPreparationTargets.value.length > 0
		? 22 + ( pendingPreparationTargets.value.length * 18 )
		: 0 )
	const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 0
	const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 0
	const gap = 8
	const padding = 8

	let left = triggerRect.right + gap
	let top = triggerRect.top + ( triggerRect.height / 2 ) - ( tooltipHeight / 2 )

	if( viewportWidth > 0 ){
		left = Math.min( left, viewportWidth - tooltipWidth - padding )
		left = Math.max( padding, left )
	}

	if( viewportHeight > 0 ){
		top = Math.min( top, viewportHeight - tooltipHeight - padding )
		top = Math.max( padding, top )
	}

	displayInfoTooltipStyle.value = {
		left: `${Math.round( left )}px`,
		top: `${Math.round( top )}px`,
		backgroundColor: "rgb(17 24 39)"
	}
}

const showDisplayInfoTooltipOverlay = () => {
	if( showDisplayInfoIcon.value === false ){
		showDisplayInfoTooltip.value = false
		return
	}
	updateDisplayInfoTooltipPosition()
	showDisplayInfoTooltip.value = true
}

const hideDisplayInfoTooltipOverlay = () => {
	showDisplayInfoTooltip.value = false
}

const clampDeckHeatmapPaneWidth = ( width ) => {

	const normalizedWidth = Number( width )
	const containerWidth = Number( deckLayoutContainer.value?.clientWidth )
	const minimumWidth = MIN_DECK_HEATMAP_PANE_WIDTH

	if( Number.isFinite( normalizedWidth ) === false ){
		return minimumWidth
	}

	if( Number.isFinite( containerWidth ) === false || containerWidth <= 0 ){
		return Math.max( minimumWidth, Math.round( normalizedWidth ))
	}

	const dividerAllowance = 20
	const maximumWidth = Math.max(
		minimumWidth,
		Math.round( containerWidth - MIN_DECK_SPECTRA_PANE_WIDTH - dividerAllowance )
	)

	return Math.max( minimumWidth, Math.min( maximumWidth, Math.round( normalizedWidth )))
}

const clampDeckTopSpectrumPaneHeight = ( height ) => {

	const normalizedHeight = Number( height )
	const containerHeight = Number( deckSpectraPaneContainer.value?.clientHeight )
	const minimumHeight = MIN_DECK_SPECTRUM_PANEL_HEIGHT

	if( Number.isFinite( normalizedHeight ) === false ){
		return minimumHeight
	}

	if( Number.isFinite( containerHeight ) === false || containerHeight <= 0 ){
		return Math.max( minimumHeight, Math.round( normalizedHeight ))
	}

	const maximumHeight = Math.max(
		minimumHeight,
		Math.round( containerHeight - minimumHeight - DECK_SPECTRA_PANE_DIVIDER_HEIGHT_PX )
	)

	return Math.max( minimumHeight, Math.min( maximumHeight, Math.round( normalizedHeight )))
}

const normalizedHeatmapAspectRatio = ( dimensions ) => {

	if( dimensions === null ) return null

	const width = Number( dimensions.width )
	const height = Number( dimensions.height )
	if( Number.isFinite( width ) === false || Number.isFinite( height ) === false ){
		return null
	}
	if( width <= 0 || height <= 0 ){
		return null
	}

	return width / height
}

const measuredDeckHeatmapPaneWidthFromPlotly = ( dimensions ) => {

	if( graph.value === null ) return null

	const aspectRatio = normalizedHeatmapAspectRatio( dimensions )
	if( aspectRatio === null ) return null

	const graphHeight = Number( graph.value.clientHeight )
	const fullLayout = graph.value._fullLayout
	const margin = fullLayout?.margin ?? {}

	const marginTop = Number( margin.t )
	const marginBottom = Number( margin.b )
	const marginLeft = Number( margin.l )
	const marginRight = Number( margin.r )

	if( Number.isFinite( graphHeight ) === false || graphHeight <= 0 ){
		return null
	}
	if( Number.isFinite( marginTop ) === false ||
		Number.isFinite( marginBottom ) === false ||
		Number.isFinite( marginLeft ) === false ||
		Number.isFinite( marginRight ) === false ){
		return null
	}

	const drawableHeight = graphHeight - marginTop - marginBottom
	if( Number.isFinite( drawableHeight ) === false || drawableHeight <= 0 ){
		return null
	}

	const requiredGraphWidth = marginLeft + marginRight + ( drawableHeight * aspectRatio )
	return clampDeckHeatmapPaneWidth( requiredGraphWidth + DECK_HEATMAP_PANE_INSET_PX )
}

const defaultDeckHeatmapPaneWidth = () => {

	const containerHeight = Number( deckLayoutContainer.value?.clientHeight )
	if( Number.isFinite( containerHeight ) === false || containerHeight <= 0 ){
		return MIN_DECK_HEATMAP_PANE_WIDTH
	}

	const dimensions = matrixDimensions( currentMatrix() )
	const measuredWidth = measuredDeckHeatmapPaneWidthFromPlotly( dimensions )
	if( Number.isFinite( measuredWidth ) ){
		return measuredWidth
	}

	const aspectRatio = normalizedHeatmapAspectRatio( dimensions )
	if( aspectRatio !== null ){
		const estimatedGraphHeight = Math.max( 1, containerHeight - DECK_HEATMAP_PANE_INSET_PX )
		return clampDeckHeatmapPaneWidth( estimatedGraphHeight * aspectRatio + DECK_HEATMAP_PANE_INSET_PX )
	}

	return clampDeckHeatmapPaneWidth( containerHeight )
}

const defaultDeckTopSpectrumPaneHeight = () => {

	const containerHeight = Number( deckSpectraPaneContainer.value?.clientHeight )
	if( Number.isFinite( containerHeight ) === false || containerHeight <= 0 ){
		return MIN_DECK_SPECTRUM_PANEL_HEIGHT
	}

	const availableHeight = containerHeight - DECK_SPECTRA_PANE_DIVIDER_HEIGHT_PX
	if( Number.isFinite( availableHeight ) === false || availableHeight <= 0 ){
		return MIN_DECK_SPECTRUM_PANEL_HEIGHT
	}

	return clampDeckTopSpectrumPaneHeight( availableHeight / 2 )
}

const ensureDeckHeatmapPaneWidth = ( options = {} ) => {

	const shouldReset = options?.forceDefault === true
	const nextWidth = shouldReset || Number.isFinite( Number( deckHeatmapPaneWidth.value )) === false
		? defaultDeckHeatmapPaneWidth()
		: clampDeckHeatmapPaneWidth( deckHeatmapPaneWidth.value )

	deckHeatmapPaneWidth.value = nextWidth
	return nextWidth
}

const ensureDeckTopSpectrumPaneHeight = ( options = {} ) => {

	const shouldReset = options?.forceDefault === true
	const nextHeight = shouldReset || Number.isFinite( Number( deckTopSpectrumPaneHeight.value )) === false
		? defaultDeckTopSpectrumPaneHeight()
		: clampDeckTopSpectrumPaneHeight( deckTopSpectrumPaneHeight.value )

	deckTopSpectrumPaneHeight.value = nextHeight
	return nextHeight
}

const reconcileDeckHeatmapPaneWidthWithPlotlyLayout = ( matrix ) => {

	if( deckHeatmapPaneWidthTouched.value ){
		return false
	}

	const dimensions = matrixDimensions( matrix )
	const measuredWidth = measuredDeckHeatmapPaneWidthFromPlotly( dimensions )
	if( Number.isFinite( measuredWidth ) === false ){
		return false
	}

	const currentWidth = Number( deckHeatmapPaneWidth.value )
	if( Number.isFinite( currentWidth ) === false ){
		deckHeatmapPaneWidth.value = measuredWidth
		return true
	}

	if( Math.abs( measuredWidth - currentWidth ) <= 2 ){
		return false
	}

	deckHeatmapPaneWidth.value = measuredWidth
	return true
}

const resolvedDeckHeatmapPaneWidth = computed(() => {

	const configuredWidth = Number( deckHeatmapPaneWidth.value )
	if( Number.isFinite( configuredWidth ) ){
		return clampDeckHeatmapPaneWidth( configuredWidth )
	}

	return defaultDeckHeatmapPaneWidth()
})

const deckHeatmapPaneStyle = computed(() => {
	return {
		width: `${resolvedDeckHeatmapPaneWidth.value}px`
	}
})

const resolvedDeckTopSpectrumPaneHeight = computed(() => {

	const configuredHeight = Number( deckTopSpectrumPaneHeight.value )
	if( Number.isFinite( configuredHeight ) ){
		return clampDeckTopSpectrumPaneHeight( configuredHeight )
	}

	return defaultDeckTopSpectrumPaneHeight()
})

const deckSpectraPaneGridStyle = computed(() => {
	return {
		gridTemplateRows: `${resolvedDeckTopSpectrumPaneHeight.value}px ${DECK_SPECTRA_PANE_DIVIDER_HEIGHT_PX}px minmax(${MIN_DECK_SPECTRUM_PANEL_HEIGHT}px, 1fr)`
	}
})

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

const roiEstimateUncertaintyLevelValue = computed(() => {
	return normalizeRoiEstimateUncertaintyLevel( roiEstimateUncertaintyLevel.value )
})

const roiEstimateUncertaintyNumericLevel = computed(() => {
	return typeof roiEstimateUncertaintyLevelValue.value === "number"
		? roiEstimateUncertaintyLevelValue.value
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

const withSpectrumLegendName = ( payload, name = "Selection" ) => {

	if( payload === null || payload === undefined ){
		return null
	}

	if( Array.isArray( payload ) ){
		return {
			spectrum: payload,
			name,
			traceGroupKey: "selection"
		}
	}

	if( typeof payload !== "object" ){
		return payload
	}

	return {
		...payload,
		name: typeof payload?.name === "string" && payload.name.trim().length > 0
			? payload.name
			: name,
		traceGroupKey: typeof payload?.traceGroupKey === "string" && payload.traceGroupKey.trim().length > 0
			? payload.traceGroupKey
			: "selection"
	}
}

const {
	topSpectrumPaneLegendVisible,
	hoveredSpectrumLegendKey,
	normalizedHiddenSpectrumLegendKeys,
	topSpectrumPaneQuerying,
	bottomSpectrumPaneQuerying,
	topLeftSpectrumOptions,
	bottomLeftSpectrumOptions,
	topSpectrumPaneLegendEntries,
	isSpectrumLegendHidden,
	toggleSpectrumLegendTraceVisibility
} = useSpectrumPaneState({
	nextTick,
	deckTopPanelGraph,
	deckBottomPanelGraph,
	hyperspectrum,
	resizePlotlyContainer: async ( graphContainer ) => resizePlotlyContainer( graphContainer ),
	activePlot,
	showPcaLoadings,
	showSelectedSpectra,
	spectrumSelectionMode: computed(() => spectrumSelectionMode.value),
	resolvedPrimarySpectrumSource: () => resolvedPrimarySpectrumSource(),
	resolvedSecondarySpectrumSource: () => resolvedSecondarySpectrumSource(),
	normalizeSpectrumSource: ( source ) => normalizeSpectrumSource( source ),
	latestMeasurementSelectedSpectrum,
	latestMeasurementSingleSpectrum,
	latestMeasurementMeanSpectrum,
	latestRamanSelectedSpectrum,
	latestRamanSingleSpectrum,
	latestRamanMeanSpectrum,
	withSelectedConfidenceBounds: ( payload ) => withSelectedConfidenceBounds( payload ),
	withSpectrumLegendName: ( payload, name ) => withSpectrumLegendName( payload, name ),
	activeDisplayedRois,
	roiSpectrumStyleForId: ( roiId ) => roiSpectrumStyleForId( roiId ),
	estimatedRoiSpectrumForId: ( roiId ) => estimatedRoiSpectrumForId( roiId ),
	cachedRamanRoiSpectrumForId: ( roiId ) => cachedRamanRoiSpectrumForId( roiId ),
	roiEstimateUncertaintyLevelValue,
	roiEstimateUncertaintyNumericLevel,
	confidenceNoneValue: CONFIDENCE_NONE_VALUE,
	resolveConfidenceBoundSeries: ( boundsPayload, confidenceLevel ) => resolveConfidenceBoundSeries( boundsPayload, confidenceLevel ),
	queriedSpectrumLegendColor,
	resolvedRoiSpectrumPalette,
	activeLoadingLegendEntries,
	isSelectionSpectrumQuerying: ( source ) => isSelectionSpectrumQuerying( source ),
	legendHoverEmphasisEnabled
})

const {
	projectSpectrumGridlinesVisible,
	normalizeProjectSpectrumGridlineState,
	applyProjectSpectrumGridlineState,
	loadProjectSpectrumGridlinePreset,
	syncSpectrumPlotGraphListeners,
	clearSpectrumPlotGraphListeners,
	cancelSpectrumGridlinePresetSave,
	resetSpectrumPlotSyncState
} = useSpectrumPlotSync({
	settings,
	project,
	measurementDataType,
	hyperspectra,
	graph,
	deckTopPanelGraph,
	deckBottomPanelGraph,
	topSpectrumPaneLegendVisible,
	topSpectrumGridlineSourceKey: () => topSpectrumGridlineSourceKey(),
	bottomSpectrumGridlineSourceKey: () => bottomSpectrumGridlineSourceKey(),
	activeProjectLoadRequestID
})

const setRoiEstimateUncertaintyLevel = ( level ) => {
	roiEstimateUncertaintyLevel.value = normalizeRoiEstimateUncertaintyLevel( level )
}

const setActiveDisplayMode = ( nextValue ) => {
	const normalizedValue = String( nextValue ?? "" ).trim()
	if( DISPLAY_MODE_OPTIONS.has( normalizedValue ) === false ){
		return
	}
	if( activePlot.value === normalizedValue ){
		return
	}

	activePlot.value = normalizedValue
}

const setPcaLoadingsVisibility = async ( shouldShowLoadings ) => {

	if( shouldShowLoadings ){
		if( activePcaComponents.value.length === 0 ){
			resetActivePcaComponents( visiblePcaLoadingCount.value )
		}

		showPcaLoadings.value = true
		if( selectedRoiIds.value.length > 0 ){
			clearSelectedRois()
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

const setLegendHoverEmphasisEnabled = ( enabled ) => {
	legendHoverEmphasisEnabled.value = enabled === true
}

const roiOverlayFromEntry = ( roi ) => {

	if( roi === null || typeof roi !== "object" ){
		return null
	}

	const roiId = String( roi?.roiId ?? "" ).trim()
	const style = roiSpectrumStyleForId( roiId )

	return {
		name: roi.name,
		legendKey: `roi-${roiId}`,
		x0: roi.boundingBox.minX - 0.5,
		x1: roi.boundingBox.maxX + 0.5,
		y0: roi.boundingBox.minY - 0.5,
		y1: roi.boundingBox.maxY + 0.5,
		boxColor: style.boxColor,
		titleColor: style.titleColor,
		opacity: normalizeOpacity( settings.value?.hyperspectrumRoi?.overlayOpacity, 0.25 )
	}
}

const currentSelectionOverlay = () => {

	const boundingBox = normalizeSelectionBoundingBox( selectedHeatmapBoundingBox.value )
	if( boundingBox === null ){
		return null
	}

	const selectionColor = settings.value?.hyperspectrumColors?.selectionBox ?? "#9ca3af"

	return {
		name: "",
		legendKey: "selection",
		showTitle: false,
		x0: boundingBox.minX - 0.5,
		x1: boundingBox.maxX + 0.5,
		y0: boundingBox.minY - 0.5,
		y1: boundingBox.maxY + 0.5,
		boxColor: selectionColor,
		titleColor: selectionColor,
		opacity: normalizeOpacity( settings.value?.hyperspectrumRoi?.overlayOpacity, 0.25 )
	}
}

const activeRoiOverlays = () => {

	var overlays = []
	const highlightedLegendKey = legendHoverEmphasisEnabled.value
		? String( hoveredSpectrumLegendKey.value ?? "" ).trim()
		: ""
	const highlightsOverlay = highlightedLegendKey === "selection" || highlightedLegendKey.startsWith( "roi-" )

	overlays = activeDisplayedRois.value
		.map(( roi ) => roiOverlayFromEntry( roi ))
		.filter(( overlay ) => overlay !== null )

	const selectionOverlay = currentSelectionOverlay()
	if( selectionOverlay !== null ){
		overlays.push( selectionOverlay )
	}

	return overlays.map(( overlay ) => {
		const legendKey = String( overlay?.legendKey ?? "" ).trim()
		const isEmphasized = highlightsOverlay && legendKey === highlightedLegendKey
		const isDimmed = highlightsOverlay && legendKey.length > 0 && legendKey !== highlightedLegendKey

		return {
			...overlay,
			isEmphasized,
			isDimmed
		}
	})
}

const {
	resetDeckPanelRenderKeys,
	queueSpectraPanelRender,
	renderCurrentMatrix: renderCurrentMatrixBase
} = useHyperspectrumRenderPipeline({
	nextTick,
	graph,
	deckTopPanelGraph,
	deckBottomPanelGraph,
	settings,
	hyperspectrum,
	resolveCurrentPlotRenderSpec: ( plotOptions ) => resolveCurrentPlotRenderSpec( plotOptions ),
	currentMatrix: () => currentMatrix(),
	bottomLeftSpectrumOptions: () => bottomLeftSpectrumOptions(),
	topLeftSpectrumOptions: () => topLeftSpectrumOptions(),
	topSpectrumGridlineSourceKey: () => topSpectrumGridlineSourceKey(),
	bottomSpectrumGridlineSourceKey: () => bottomSpectrumGridlineSourceKey(),
	normalizeProjectSpectrumGridlineState: ( value, fallback ) => normalizeProjectSpectrumGridlineState( value, fallback ),
	projectSpectrumGridlinesVisible,
	activeRoiOverlays: () => activeRoiOverlays(),
	plotAxes: () => plotAxes(),
	heatmapRendererMode,
	topSpectrumPaneLegendVisible,
	hoveredSpectrumLegendKey: computed(() => {
		return legendHoverEmphasisEnabled.value
			? hoveredSpectrumLegendKey.value
			: ""
	}),
	normalizedHiddenSpectrumLegendKeys,
	activePlot,
	heatmapUsesEstimatedRaman,
	ensureZBlendVisualizationMatrix: ( priority ) => ensureZBlendVisualizationMatrix( priority ),
	ensureEstimatedVisualizationMatrix: ( priority ) => ensureEstimatedVisualizationMatrix( priority ),
	ensureActivePlotLoadings: ( priority ) => ensureActivePlotLoadings( priority ),
	syncSpectrumPlotGraphListeners: () => syncSpectrumPlotGraphListeners(),
	syncHeatmapModebarGraphListeners: () => syncHeatmapModebarGraphListeners(),
	syncHeatmapModebarState: ( graphContainer, mode, aspectRatio ) => {
		hyperspectrum.syncHeatmapModebarState( graphContainer, mode, aspectRatio )
	},
	heatmapInteractionMode,
	heatmapZoomAspectRatio,
	applyProjectSpectrumGridlineState: async ( state ) => applyProjectSpectrumGridlineState( state ),
	deckHeatmapPaneWidth,
	deckHeatmapPaneWidthTouched,
	deckTopSpectrumPaneHeight,
	deckTopSpectrumPaneHeightTouched,
	defaultDeckHeatmapPaneWidth: () => defaultDeckHeatmapPaneWidth(),
	defaultDeckTopSpectrumPaneHeight: () => defaultDeckTopSpectrumPaneHeight(),
	matrixDimensions: ( matrix ) => matrixDimensions( matrix ),
	queueDeckPaneResponsiveResize: () => queueDeckPaneResponsiveResize(),
	reconcileDeckHeatmapPaneWidthWithPlotlyLayout: ( matrix ) => reconcileDeckHeatmapPaneWidthWithPlotlyLayout( matrix ),
	finalizeHeatmapRender: async ( startedAt ) => finalizeHeatmapRender( startedAt ),
	heatmapRenderBenchmarkToken,
	pendingDeckRenderBenchmark
})

const renderCurrentMatrix = async ( initialize = false ) => {
	const result = await renderCurrentMatrixBase( initialize )
	if( spectralCalibrationEditingActive.value ){
		await nextTick()
		syncSpectralCalibrationPlotClickListeners()
		await syncSpectralCalibrationReferenceLines()
	}

	return result
}

const openRoiSaveModal = () => {

	if( canMutateRois.value === false ) return
	if( hasSelectedRegion.value === false ) return

	roiSaveModal.value?.open()
}

const openRoiDeleteModal = () => {

	if( canMutateRois.value === false ) return
	if( selectedRois.value.length === 0 ) return

	roiDeleteModal.value?.open()
}

const openRoiDescriptionModal = () => {

	if( selectedRois.value.length === 0 ) return
	roiDescriptionModal.value?.open()
}

const sanitizeRoiFilenameToken = ( value, fallback = "roi" ) => {

	const normalized = String( value ?? "" )
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9_-]+/g, "_" )
		.replace(/^_+|_+$/g, "" )

	return normalized.length > 0 ? normalized : fallback
}

const numericAxisValue = ( value, fallback ) => {

	const numeric = Number( value )
	if( Number.isFinite( numeric ) ){
		return numeric
	}

	return fallback
}

const spectrumLengthForRoi = ( roi ) => {

	if( Array.isArray( roi?.meanSpectrum ) && roi.meanSpectrum.length > 0 ){
		return roi.meanSpectrum.length
	}

	const parsedLength = Number.parseInt( roi?.spectrumLength, 10 )
	if( Number.isInteger( parsedLength ) && parsedLength > 0 ){
		return parsedLength
	}

	const zValues = Array.isArray( xyzAxes.value?.z ) ? xyzAxes.value.z : []
	return zValues.length
}

const currentXAxisForLength = ( length ) => {

	const targetLength = Number.isInteger( length ) && length > 0 ? length : 0
	if( targetLength <= 0 ){
		return []
	}

	const zValues = effectiveSpectralAxisValues()
	var xValues = []

	for( var index = 0; index < targetLength; index++ ){
		xValues.push( numericAxisValue( zValues[index], index ))
	}

	return xValues
}

const normalizeZBlendRequestedZ = ( value, fallback = 0 ) => {
	return numericAxisValue( value, fallback )
}

const normalizeZBlendClampValue = ( value, fallback, maximum = Infinity ) => {

	const numeric = Number( value )
	if( Number.isFinite( numeric ) === false ){
		return fallback
	}

	const safeMaximum = Number.isFinite( Number( maximum )) && Number( maximum ) > 0
		? Number( maximum )
		: Infinity

	return Math.max( 0, Math.min( safeMaximum, numeric ))
}

const buildDefaultZBlendChannels = () => {

	const axis = zAxisValues()
	if( axis.length === 0 ){
		return [{
			enabled: true,
			resolvedLayerIndex: 0,
			requestedZ: 0,
			clampMin: 0,
			clampMax: 1
		}]
	}

	const candidateIndices = [ 0, 0.5, 1 ]
		.map(( fraction ) => Math.max( 0, Math.min( axis.length - 1, Math.round(( axis.length - 1 ) * fraction ))))
	const uniqueIndices = Array.from( new Set( candidateIndices ))

	return uniqueIndices.map(( index ) => {
		return {
			enabled: true,
			resolvedLayerIndex: index,
			requestedZ: zValueForLayerIndex( index, axis[index] ),
			clampMin: 0,
			clampMax: 1
		}
	})
}

const normalizeZBlendChannels = ( channels, fallbackChannels = [] ) => {

	const source = Array.isArray( channels ) ? channels : []
	const fallback = Array.isArray( fallbackChannels ) && fallbackChannels.length > 0
		? fallbackChannels
		: buildDefaultZBlendChannels()
	const normalizedChannels = source
		.slice( 0, MAX_Z_BLEND_CHANNELS )
		.map(( channel, index ) => {
			const fallbackChannel = fallback[index] ?? fallback[0] ?? {
				enabled: true,
				resolvedLayerIndex: 0,
				requestedZ: 0,
				clampMin: 0,
				clampMax: 1
			}
			const fallbackLayerIndex = normalizeZBlendLayerIndex(
				fallbackChannel?.resolvedLayerIndex,
				resolveZBlendLayerMatch( fallbackChannel?.requestedZ ?? index ).layerIndex
			)
			const resolvedLayerIndex = channel?.resolvedLayerIndex !== undefined && channel?.resolvedLayerIndex !== null
				? normalizeZBlendLayerIndex( channel.resolvedLayerIndex, fallbackLayerIndex )
				: normalizeZBlendLayerIndex(
					resolveZBlendLayerMatch( channel?.requestedZ ?? zValueForLayerIndex( fallbackLayerIndex, fallbackLayerIndex ) ).layerIndex,
					fallbackLayerIndex
				)
			const clampMin = normalizeZBlendClampValue( channel?.clampMin, 0 )
			const clampMax = normalizeZBlendClampValue( channel?.clampMax, 1 )

			return {
				enabled: channel?.enabled !== false,
				resolvedLayerIndex,
				requestedZ: zValueForLayerIndex(
					resolvedLayerIndex,
					channel?.requestedZ ?? fallbackChannel?.requestedZ ?? resolvedLayerIndex
				),
				clampMin: Math.min( clampMin, clampMax ),
				clampMax: Math.max( clampMin, clampMax )
			}
		})

	if( normalizedChannels.length > 0 ){
		return normalizedChannels
	}

	return fallback.slice( 0, MAX_Z_BLEND_CHANNELS ).map(( channel ) => {
		const clampMin = normalizeZBlendClampValue( channel?.clampMin, 0 )
		const clampMax = normalizeZBlendClampValue( channel?.clampMax, 1 )
		const resolvedLayerIndex = normalizeZBlendLayerIndex(
			channel?.resolvedLayerIndex,
			resolveZBlendLayerMatch( channel?.requestedZ ?? 0 ).layerIndex
		)

		return {
			enabled: channel?.enabled !== false,
			resolvedLayerIndex,
			requestedZ: zValueForLayerIndex( resolvedLayerIndex, channel?.requestedZ ?? 0 ),
			clampMin: Math.min( clampMin, clampMax ),
			clampMax: Math.max( clampMin, clampMax )
		}
	})
}

const canonicalizeZBlendChannelsForPersistence = ( channels = zBlendChannels.value ) => {

	const rawChannels = Array.isArray( channels ) ? channels : []
	const normalizedChannels = normalizeZBlendChannels( rawChannels )

	return normalizedChannels.map(( channel, index ) => {
		const rawRequestedZ = normalizeZBlendRequestedZ(
			rawChannels[index]?.requestedZ,
			channel?.requestedZ ?? zValueForLayerIndex( channel?.resolvedLayerIndex, index )
		)
		const match = resolveZBlendLayerMatch( rawRequestedZ )
		const resolvedLayerIndex = normalizeZBlendLayerIndex(
			match.layerIndex,
			channel?.resolvedLayerIndex ?? index
		)

		return {
			...channel,
			resolvedLayerIndex,
			requestedZ: zValueForLayerIndex( resolvedLayerIndex, match.resolvedZ )
		}
	})
}

const invalidateZBlendSources = () => {
	activeZBlendMeasurementRequestID.value += 1
	activeZBlendEstimatedRequestID.value += 1
	zBlendMeasurementSource.value = null
	zBlendEstimatedSource.value = null
}

const applyZBlendState = ( nextState = {}, options = {} ) => {

	const fallbackChannels = buildDefaultZBlendChannels()
	zBlendChannels.value = normalizeZBlendChannels( nextState?.channels, fallbackChannels )
	zBlendPresetLoadedFromBackend.value = options.loadedFromBackend === true

	if( options.markDirty === true ){
		zBlendDirty.value = true
	} else if( options.markDirty === false ){
		zBlendDirty.value = false
	}

	if( typeof options.status === "string" && options.status.length > 0 ){
		zBlendPresetStatus.value = options.status
	}

	if( typeof options.message === "string" ){
		zBlendPresetStatusMessage.value = options.message
	}

	invalidateZBlendSources()
}

const canReuseZBlendSource = ( source, resolvedChannels ) => {

	const sourceChannels = Array.isArray( source?.channels ) ? source.channels : []
	if( sourceChannels.length === 0 || sourceChannels.length !== resolvedChannels.length ){
		return false
	}

	for( let index = 0; index < resolvedChannels.length; index++ ){
		const sourceChannel = sourceChannels[index] ?? {}
		const resolvedChannel = resolvedChannels[index] ?? {}

		if( normalizeZBlendLayerIndex( sourceChannel?.resolvedLayerIndex, index ) !==
			normalizeZBlendLayerIndex( resolvedChannel?.resolvedLayerIndex, index ) ){
			return false
		}

		if( Array.isArray( sourceChannel?.matrix ) === false || sourceChannel.matrix.length === 0 ){
			return false
		}
	}

	return true
}

const patchZBlendSourceFromResolvedChannels = ( source, resolvedChannels ) => {

	const sourceChannels = Array.isArray( source?.channels ) ? source.channels : []

	return {
		...source,
		palette: resolvedZBlendPalette(),
		channels: sourceChannels.map(( sourceChannel, index ) => {
			const resolvedChannel = resolvedChannels[index] ?? {}

			return {
				...sourceChannel,
				enabled: resolvedChannel.enabled !== false,
				requestedZ: resolvedChannel.requestedZ,
				resolvedLayerIndex: resolvedChannel.resolvedLayerIndex,
				resolvedZ: resolvedChannel.resolvedZ,
				clampMin: resolvedChannel.clampMin,
				clampMax: resolvedChannel.clampMax,
				color: resolvedChannel.color ?? sourceChannel.color
			}
		})
	}
}

const ensureDefaultZBlendState = () => {

	if( Array.isArray( zBlendChannels.value ) && zBlendChannels.value.length > 0 ){
		return
	}

	applyZBlendState({
		channels: buildDefaultZBlendChannels()
	}, {
		loadedFromBackend: false,
		markDirty: false,
		status: "defaulted",
		message: ""
	})
}

const zBlendPresetPayload = () => {
	return {
		version: "zblend-v1",
		projectID: String( project.value?.rawid ?? project.value?.id ?? "" ).trim(),
		dataType: measurementDataType.toLowerCase() === "hyperraman" || measurementDataType.toLowerCase() === "raman"
			? "hyperraman"
			: "hypercars",
		channels: canonicalizeZBlendChannelsForPersistence()
	}
}

const loadZBlendPreset = async ( requestID = null ) => {

	ensureDefaultZBlendState()
	if( project.value?.id === "" ) return

	try{
		const response = await hyperspectra.loadZBlendSettings( project.value, measurementDataType )
		if( requestID !== null && requestID !== activeProjectLoadRequestID.value ) return
		applyZBlendState( response, {
			loadedFromBackend: true,
			markDirty: false,
			status: "loaded",
			message: ""
		})
		scheduleDisplayPayloadPrewarm([ "z_blend" ])

		if( activePlot.value === "z_blend" && graph.value !== null ){
			await renderCurrentMatrix()
			await renderZBlendHeatmapOnly()
		}
	} catch( error ){
		if( requestID !== null && requestID !== activeProjectLoadRequestID.value ) return
		applyZBlendState({
			channels: zBlendChannels.value
		}, {
			loadedFromBackend: false,
			markDirty: false,
			status: "defaulted",
			message: ""
		})
		if( Number( error?.status ) === 404 ){
			return
		}
		console.log( error )
	}
}

const loadZBlendSource = async ( estimated = false, priority = "high" ) => {

	const requestIDRef = estimated ? activeZBlendEstimatedRequestID : activeZBlendMeasurementRequestID
	const targetSource = estimated ? zBlendEstimatedSource : zBlendMeasurementSource
	const targetIntensityMaximumMap = estimated
		? zBlendEstimatedIntensityMaximumByLayer
		: zBlendMeasurementIntensityMaximumByLayer
	const currentRequestID = requestIDRef.value + 1
	requestIDRef.value = currentRequestID

	const resolvedChannels = zBlendResolvedChannels.value
	if( resolvedChannels.length === 0 ){
		targetSource.value = null
		return null
	}

	if( canReuseZBlendSource( targetSource.value, resolvedChannels ) ){
		targetSource.value = patchZBlendSourceFromResolvedChannels( targetSource.value, resolvedChannels )
		return targetSource.value
	}

	const channelEntries = []

	if( shouldChunkBackgroundLoad( priority ) ){
		for( const channel of resolvedChannels ){
			const matrix = estimated
				? await loadEstimatedArtifact( "layers/" + channel.resolvedLayerIndex, priority )
				: await hyperspectrumCache.getLayer(
					project.value,
					channel.resolvedLayerIndex,
					{ ...cacheOptions, priority: priority === "low" ? "low" : "high" }
				)

			channelEntries.push({
				...channel,
				intensityMaximum: zBlendChannelIntensityMaximum( matrix ),
				defaultContrastLimits: zBlendChannelDefaultContrastLimits( matrix ),
				matrix
			})

			if( currentRequestID !== requestIDRef.value ){
				return targetSource.value
			}

			await yieldToBrowser()
		}
	} else {
		channelEntries.push( ...( await Promise.all( resolvedChannels.map( async ( channel ) => {
			const matrix = estimated
				? await loadEstimatedArtifact( "layers/" + channel.resolvedLayerIndex, priority )
				: await hyperspectrumCache.getLayer(
					project.value,
					channel.resolvedLayerIndex,
					{ ...cacheOptions, priority: priority === "low" ? "low" : "high" }
				)

			return {
				...channel,
				intensityMaximum: zBlendChannelIntensityMaximum( matrix ),
				defaultContrastLimits: zBlendChannelDefaultContrastLimits( matrix ),
				matrix
			}
		}))))
	}

	if( currentRequestID !== requestIDRef.value ){
		return targetSource.value
	}

	targetIntensityMaximumMap.value = channelEntries.reduce(( aggregate, entry ) => {
		const layerKey = String( entry?.resolvedLayerIndex ?? "" )
		const maximum = Number( entry?.intensityMaximum )
		if( layerKey.length > 0 && Number.isFinite( maximum ) && maximum > 0 ){
			aggregate[ layerKey ] = maximum
		}
		return aggregate
	}, { ...targetIntensityMaximumMap.value })

	const firstChannel = channelEntries.find(( entry ) => Array.isArray( entry?.matrix ) && entry.matrix.length > 0 ) ?? null
	if( firstChannel === null ){
		targetSource.value = null
		return null
	}

	const shouldAdoptDefaultWindows = zBlendPresetLoadedFromBackend.value === false &&
		zBlendDirty.value === false
	const normalizedUiChannels = normalizeZBlendChannels( zBlendChannels.value )
	let nextUiChannels = normalizedUiChannels
	let updatedEntries = channelEntries

	if( shouldAdoptDefaultWindows ){
		let changed = false

		nextUiChannels = normalizedUiChannels.map(( channel, index ) => {
			const entry = channelEntries[index]
			const intensityMaximum = Number( entry?.intensityMaximum )
			const safeMaximum = Number.isFinite( intensityMaximum ) && intensityMaximum > 0
				? intensityMaximum
				: 1
			const defaultContrastLimits = entry?.defaultContrastLimits ?? {
				clampMin: 0,
				clampMax: safeMaximum
			}
			const usesDefaultWindow = channel.clampMin === 0 && channel.clampMax === 1
			if( usesDefaultWindow === false ){
				return channel
			}

			if( Math.abs( channel.clampMin - Number( defaultContrastLimits.clampMin ?? 0 )) > 1e-9 ||
				Math.abs( channel.clampMax - Number( defaultContrastLimits.clampMax ?? safeMaximum )) > 1e-9 ){
				changed = true
			}

			return {
				...channel,
				clampMin: Number( defaultContrastLimits.clampMin ?? 0 ),
				clampMax: Number( defaultContrastLimits.clampMax ?? safeMaximum )
			}
		})

		if( changed ){
			zBlendChannels.value = nextUiChannels
			updatedEntries = channelEntries.map(( entry, index ) => ({
				...entry,
				clampMin: nextUiChannels[index]?.clampMin ?? entry.clampMin,
				clampMax: nextUiChannels[index]?.clampMax ?? entry.clampMax
			}))
		}
	}

	targetSource.value = {
		kind: "z-blend-source",
		palette: resolvedZBlendPalette(),
		width: firstChannel.matrix[0].length,
		height: firstChannel.matrix.length,
		channels: updatedEntries
			.filter(( entry ) => Array.isArray( entry?.matrix ) && entry.matrix.length > 0 )
			.map(( entry ) => ({
				enabled: entry.enabled !== false,
				requestedZ: entry.requestedZ,
				resolvedLayerIndex: entry.resolvedLayerIndex,
				resolvedZ: entry.resolvedZ,
				clampMin: entry.clampMin,
				clampMax: entry.clampMax,
				intensityMaximum: entry.intensityMaximum,
				color: entry.color,
				matrix: entry.matrix
			}))
	}

	return targetSource.value
}

const ensureZBlendVisualizationMatrix = async ( priority = "high" ) => {

	if( activePlot.value !== "z_blend" ) return

	if( heatmapUsesEstimatedRaman.value ){
		try{
			const estimatedSource = await loadZBlendSource( true, priority )
			if( estimatedSource !== null ){
				return
			}
		} catch( error ){
			console.log( error )
		}
	}

	await loadZBlendSource( false, priority )
}

const markZBlendDirty = ( invalidateSources = true ) => {
	if( zBlendSaving.value === false ){
		zBlendPresetStatus.value = "dirty"
	}
	zBlendPresetStatusMessage.value = ""
	zBlendDirty.value = true
	if( invalidateSources ){
		invalidateZBlendSources()
	}
}

const queueZBlendRender = ( immediate = false ) => {

	if( activePlot.value !== "z_blend" || graph.value === null ){
		return
	}

	if( immediate ){
		debouncedApplyZBlendChanges.cancel()
		void renderCurrentMatrix().catch(( error ) => {
			console.log( error )
		})
		return
	}

	debouncedApplyZBlendChanges()
}

const renderZBlendHeatmapOnly = async () => {

	if( activePlot.value !== "z_blend" || graph.value === null ){
		return
	}

	if( heatmapRendererMode.value !== "deckgl" ){
		await renderCurrentMatrix()
		return
	}

	await ensureZBlendVisualizationMatrix( "high" )

	await syncZBlendHeatmapPayloadFromCurrentSource()
}

const syncZBlendHeatmapPayloadFromCurrentSource = async () => {

	if( activePlot.value !== "z_blend" || graph.value === null ){
		return
	}

	if( heatmapRendererMode.value !== "deckgl" ){
		return
	}

	const matrix = currentMatrix()
	if( matrix === null ){
		return
	}

	const payload = hyperspectrum.updateZBlendHeatmapPayload( matrix, graph.value, {
		heatmapRenderer: heatmapRendererMode.value
	})

	if( payload === null ){
		return
	}

	heatmapRendererPayload.value = payload

	if( heatmapRendererPaneState.value === null ){
		heatmapRendererPaneState.value = hyperspectrum.getHeatmapPaneState( graph.value )
	}
}

const queueZBlendHeatmapOnlyRender = ( immediate = false ) => {

	if( activePlot.value !== "z_blend" || graph.value === null ){
		return
	}

	if( immediate ){
		debouncedApplyZBlendHeatmapOnlyChanges.cancel()
		void renderZBlendHeatmapOnly().catch(( error ) => {
			console.log( error )
		})
		return
	}

	debouncedApplyZBlendHeatmapOnlyChanges()
}

const addZBlendChannel = () => {

	if( zBlendChannels.value.length >= MAX_Z_BLEND_CHANNELS ){
		return
	}

	const axis = zAxisValues()
	const nextIndex = Math.min( axis.length - 1, Math.max( 0, zBlendChannels.value.length ))
	zBlendChannels.value = [
		...normalizeZBlendChannels( zBlendChannels.value ),
		{
			enabled: true,
			resolvedLayerIndex: nextIndex,
			requestedZ: zValueForLayerIndex( nextIndex, axis[nextIndex] ?? nextIndex ),
			clampMin: 0,
			clampMax: 1
		}
	]
	markZBlendDirty()
	queueZBlendRender( true )
}

const removeZBlendChannel = ( index ) => {

	if( zBlendChannels.value.length <= 1 ){
		return
	}

	zBlendChannels.value = normalizeZBlendChannels( zBlendChannels.value )
		.filter(( _, candidateIndex ) => candidateIndex !== index )
	markZBlendDirty()
	queueZBlendRender( true )
}

const toggleZBlendChannelEnabled = ( index, event ) => {

	const normalizedChannels = normalizeZBlendChannels( zBlendChannels.value )
	const channel = normalizedChannels[index]
	if( channel === undefined ){
		return
	}

	channel.enabled = event?.target?.checked !== false
	zBlendChannels.value = normalizedChannels
	markZBlendDirty( false )
	queueZBlendHeatmapOnlyRender()
}

const applyZBlendChannelInput = ( index ) => {

	const normalizedChannels = normalizeZBlendChannels( zBlendChannels.value )
	const channel = normalizedChannels[index]
	if( channel === undefined ){
		return
	}

	const rawRequestedZ = normalizeZBlendRequestedZ(
		Array.isArray( zBlendChannels.value ) ? zBlendChannels.value[index]?.requestedZ : channel.requestedZ,
		channel.requestedZ
	)
	const match = resolveZBlendLayerMatch( rawRequestedZ )
	channel.resolvedLayerIndex = normalizeZBlendLayerIndex( match.layerIndex, channel.resolvedLayerIndex ?? index )
	channel.requestedZ = zValueForLayerIndex( channel.resolvedLayerIndex, match.resolvedZ )
	zBlendChannels.value = normalizedChannels
	markZBlendDirty()
	queueZBlendRender( true )
}

const handleZBlendChannelInput = ( index ) => {

	const nextChannels = Array.isArray( zBlendChannels.value )
		? zBlendChannels.value.map(( channel ) => ({ ...channel }))
		: []
	const channel = nextChannels[index]
	if( channel === undefined ){
		return
	}

	channel.requestedZ = normalizeZBlendRequestedZ(
		channel.requestedZ,
		zValueForLayerIndex( channel?.resolvedLayerIndex, index )
	)
	zBlendChannels.value = nextChannels
	markZBlendDirty( false )
}

const updateZBlendClampValue = ( index, field, value ) => {

	const normalizedChannels = normalizeZBlendChannels( zBlendChannels.value )
	const channel = normalizedChannels[index]
	if( channel === undefined ){
		return
	}
	const sliderMaximum = zBlendChannelSliderMaximum( index )

	const nextValue = normalizeZBlendClampValue(
		value,
		field === "min" ? channel.clampMin : channel.clampMax,
		sliderMaximum
	)

	if( field === "min" ){
		channel.clampMin = Math.min( nextValue, channel.clampMax )
	} else {
		channel.clampMax = Math.max( nextValue, channel.clampMin )
	}

	zBlendChannels.value = normalizedChannels
	markZBlendDirty( false )
	queueZBlendHeatmapOnlyRender()
}

const saveZBlendPreset = async () => {

	if( project.value?.id === "" ){
		return
	}

	zBlendSaving.value = true
	zBlendPresetStatusMessage.value = ""

	try{
		zBlendChannels.value = canonicalizeZBlendChannelsForPersistence()
		await hyperspectra.saveZBlendSettings( project.value, zBlendPresetPayload(), measurementDataType )
		zBlendPresetStatus.value = "saved"
		zBlendPresetStatusMessage.value = "Channel settings saved."
		zBlendPresetLoadedFromBackend.value = true
		zBlendDirty.value = false
	} catch( error ){
		zBlendPresetStatus.value = "error"
		zBlendPresetStatusMessage.value = String( error?.detail ?? error?.message ?? "Failed to save z-blend settings." )
		console.log( error )
	} finally {
		zBlendSaving.value = false
	}
}

const roiWithXAxis = ( roi ) => {

	if( roi === null || typeof roi !== "object" ){
		return roi
	}

	return {
		...roi,
		x: currentXAxisForLength( spectrumLengthForRoi( roi ) )
	}
}

const triggerJsonDownload = ( filename, payload ) => {

	const blob = new Blob([ JSON.stringify( payload, null, 2 ) ], { type: "application/json" })
	const url = URL.createObjectURL( blob )
	const link = document.createElement( "a" )
	link.href = url
	link.download = filename
	link.click()
	URL.revokeObjectURL( url )
}

const downloadSelectedRoi = () => {

	if( selectedRois.value.length === 0 ) return

	if( selectedRois.value.length === 1 ){
		const roi = roiWithXAxis( selectedRois.value[0] )
		const roiName = sanitizeRoiFilenameToken( selectedRois.value[0]?.name, "roi" )
		triggerJsonDownload( `roi_${roiName}.json`, roi )
		return
	}

	const projectToken = sanitizeRoiFilenameToken( project.value?.id, "project" )
	const payload = {
		projectID: project.value?.id ?? "",
		roiCount: selectedRois.value.length,
		rois: selectedRois.value.map(( roi ) => roiWithXAxis( roi ))
	}

	triggerJsonDownload( `selected_rois_${projectToken}.json`, payload )
}

const downloadAllRois = () => {

	if( Array.isArray( rois.value ) === false || rois.value.length === 0 ) return

	const projectToken = sanitizeRoiFilenameToken( project.value?.id, "project" )
	const payload = {
		projectID: project.value?.id ?? "",
		roiCount: rois.value.length,
		rois: rois.value.map(( roi ) => roiWithXAxis( roi ))
	}

	triggerJsonDownload( `rois_${projectToken}.json`, payload )
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

const applySpectralCalibrationAssignment = ( assignmentProfile = null, options = {} ) => {
	const profile = assignmentProfile !== null && typeof assignmentProfile === "object" ? assignmentProfile : null
	const profileID = String( profile?.profileID ?? options?.profileID ?? "" ).trim()
	const model = profile !== null ? normalizeSpectralCalibrationProfileModel( profile ) : buildDefaultSpectralCalibrationModel()

	spectralCalibrationAssignedProfileID.value = profileID
	spectralCalibrationSelectedProfileID.value = profileID
	spectralCalibrationAssignedProfile.value = profile
	spectralCalibrationSelectedProfile.value = profile
	spectralCalibrationPreview.value = null
	spectralCalibrationDraft.value = buildSpectralCalibrationDraftFromModel( model )
	focusedSpectralCalibrationPointID.value = ""
	spectralCalibrationError.value = ""
}

const buildSpectralCalibrationProfilePayload = ( calibrationModel = spectralCalibrationDraftModel.value, metadata = {} ) => {
	const normalizedModel = normalizeSpectralCalibrationProfileModel( calibrationModel )
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
		axisRole: HYPERSPECTRAL_CALIBRATION_AXIS_ROLE,
		sourceProjectID: String( project.value?.id ?? "" ).trim(),
		dataType: measurementDataType,
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

const refreshSpectralCalibrationProfiles = async () => {
	if( project.value?.shared ){
		return
	}

	spectralCalibrationProfilesLoading.value = true
	spectralCalibrationError.value = ""

	try{
		const ownedResponse = await datalib.listCalibrationProfiles({
			dataType: measurementDataType,
			axisRole: HYPERSPECTRAL_CALIBRATION_AXIS_ROLE,
			scope: "owned"
		})
		const ownedProfiles = Array.isArray( ownedResponse?.items ) ? ownedResponse.items : []
		let sharedProfiles = []

		try{
			const sharedResponse = await datalib.listCalibrationProfiles({
				dataType: measurementDataType,
				axisRole: HYPERSPECTRAL_CALIBRATION_AXIS_ROLE,
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

		spectralCalibrationProfiles.value = Array.from( profileByID.values() )
		spectralCalibrationProfilesSupported.value = true
	} catch( error ){
		if( isMissingCalibrationProfileApiError( error ) ){
			spectralCalibrationProfilesSupported.value = false
			spectralCalibrationProfiles.value = []
			return
		}

		spectralCalibrationError.value = String( error?.detail ?? error?.message ?? "Failed to load calibration profiles." ).trim()
		console.log( error )
	} finally {
		spectralCalibrationProfilesLoading.value = false
	}
}

const loadAssignedSpectralCalibration = async () => {
	spectralCalibrationError.value = ""

	try{
		const assignment = await datalib.getProjectCalibration(
			project.value,
			measurementDataType,
			HYPERSPECTRAL_CALIBRATION_AXIS_ROLE
		)
		spectralCalibrationProfilesSupported.value = true

		if( assignment?.profile ){
			applySpectralCalibrationAssignment( assignment.profile, {
				profileID: assignment.profileID
			})
			return true
		}

		const assignedProfileID = String( assignment?.profileID ?? "" ).trim()
		if( assignedProfileID.length > 0 ){
			const profile = await datalib.getCalibrationProfile(
				assignedProfileID,
				measurementDataType,
				HYPERSPECTRAL_CALIBRATION_AXIS_ROLE
			)
			applySpectralCalibrationAssignment( profile, {
				profileID: assignedProfileID
			})
			return true
		}

		applySpectralCalibrationAssignment( null )
		return true
	} catch( error ){
		if( isMissingCalibrationProfileApiError( error ) ){
			spectralCalibrationProfilesSupported.value = false
			applySpectralCalibrationAssignment( null )
			return false
		}

		spectralCalibrationError.value = String( error?.detail ?? error?.message ?? "Failed to load assigned calibration." ).trim()
		console.log( error )
	}

	return false
}

const loadSpectralCalibrationState = async () => {
	await loadAssignedSpectralCalibration()
	if( project.value?.shared !== true && spectralCalibrationProfilesSupported.value ){
		await refreshSpectralCalibrationProfiles()
	}
}

const openSpectralCalibrationSidebar = async () => {
	spectralCalibrationSidebarOpen.value = true
	if(
		project.value?.shared !== true &&
		spectralCalibrationProfilesSupported.value &&
		spectralCalibrationProfilesLoading.value === false &&
		spectralCalibrationProfiles.value.length === 0
	){
		await refreshSpectralCalibrationProfiles()
	}

	await nextTick()
	syncSpectralCalibrationPlotClickListeners()
	await syncSpectralCalibrationReferenceLines()
}

const renderSpectralCalibrationChange = async () => {
	resetDeckPanelRenderKeys()
	if( graph.value === null || currentMatrix() === null ){
		syncSpectralCalibrationPlotClickListeners()
		await syncSpectralCalibrationReferenceLines()
		return
	}

	await renderCurrentMatrix()
	await nextTick()
	syncSpectralCalibrationPlotClickListeners()
	await syncSpectralCalibrationReferenceLines()
}

const handleSpectralCalibrationProfileSelection = async ( nextProfileID ) => {
	const normalizedProfileID = String( nextProfileID ?? "" ).trim()
	spectralCalibrationSelectedProfileID.value = normalizedProfileID
	spectralCalibrationError.value = ""

	if( normalizedProfileID.length === 0 ){
		spectralCalibrationSelectedProfile.value = null
		spectralCalibrationPreview.value = null
		spectralCalibrationDraft.value = buildSpectralCalibrationDraftFromModel( buildDefaultSpectralCalibrationModel() )
		focusedSpectralCalibrationPointID.value = ""
		await renderSpectralCalibrationChange()
		return
	}

	const existingProfile = spectralCalibrationSelectedProfile.value
	if(
		String( existingProfile?.profileID ?? "" ).trim() === normalizedProfileID &&
		( existingProfile?.model?.type === "polynomial" || Array.isArray( existingProfile?.points ))
	){
		spectralCalibrationPreview.value = null
		spectralCalibrationDraft.value = buildSpectralCalibrationDraftFromModel( existingProfile )
		focusedSpectralCalibrationPointID.value = ""
		await renderSpectralCalibrationChange()
		return
	}

	spectralCalibrationProfilesLoading.value = true

	try{
		const profile = await datalib.getCalibrationProfile(
			normalizedProfileID,
			measurementDataType,
			HYPERSPECTRAL_CALIBRATION_AXIS_ROLE
		)
		spectralCalibrationProfilesSupported.value = true
		spectralCalibrationSelectedProfile.value = profile
		spectralCalibrationPreview.value = null
		spectralCalibrationDraft.value = buildSpectralCalibrationDraftFromModel( profile )
		focusedSpectralCalibrationPointID.value = ""
		await renderSpectralCalibrationChange()
	} catch( error ){
		if( isMissingCalibrationProfileApiError( error ) ){
			spectralCalibrationProfilesSupported.value = false
			return
		}

		spectralCalibrationError.value = String( error?.detail ?? error?.message ?? "Failed to load calibration profile." ).trim()
		console.log( error )
	} finally {
		spectralCalibrationProfilesLoading.value = false
	}
}

const assignSpectralCalibrationProfileToProject = async () => {
	if( project.value?.shared || spectralCalibrationAssignmentSaving.value ){
		return false
	}

	spectralCalibrationAssignmentSaving.value = true
	spectralCalibrationError.value = ""

	try{
		const selectedProfileID = String( spectralCalibrationSelectedProfileID.value ?? "" ).trim()
		const assignment = await datalib.setProjectCalibration(
			project.value,
			selectedProfileID.length > 0 ? selectedProfileID : null,
			measurementDataType,
			HYPERSPECTRAL_CALIBRATION_AXIS_ROLE
		)
		const assignedProfileID = String( assignment?.profileID ?? selectedProfileID ).trim()
		const assignedProfile = assignment?.profile ??
			( assignedProfileID.length > 0 && String( spectralCalibrationSelectedProfile.value?.profileID ?? "" ).trim() === assignedProfileID
				? spectralCalibrationSelectedProfile.value
				: null )
		applySpectralCalibrationAssignment( assignedProfile, {
			profileID: assignedProfileID
		})
		if( spectralCalibrationProfilesSupported.value ){
			await refreshSpectralCalibrationProfiles()
		}
		await renderSpectralCalibrationChange()
		return true
	} catch( error ){
		if( isMissingCalibrationProfileApiError( error ) ){
			spectralCalibrationProfilesSupported.value = false
			return false
		}

		spectralCalibrationError.value = String( error?.detail ?? error?.message ?? "Failed to save calibration assignment." ).trim()
		console.log( error )
		return false
	} finally {
		spectralCalibrationAssignmentSaving.value = false
	}
}

const applySpectralCalibrationPreview = async () => {
	if( spectralCalibrationHasSavablePoints.value === false ){
		return
	}

	spectralCalibrationPreview.value = cloneSpectralCalibrationModel( spectralCalibrationDraftModel.value )
	await renderSpectralCalibrationChange()
}

const openSpectralCalibrationProfileSaveModal = async () => {
	if( canSaveSpectralCalibrationProfile.value === false ){
		return
	}

	const activeName = String( activeSpectralCalibrationProfile.value?.friendlyName ?? "" ).trim()
	const defaultName = String( activeName || project.value?.name || project.value?.id || "" ).trim() || "Spectral calibration profile"
	await spectralCalibrationProfileSaveModal.value?.open?.({
		name: spectralCalibrationProfileNameExists( defaultName ) ? "" : defaultName,
		description: String( activeSpectralCalibrationProfile.value?.description ?? "" ).trim()
	})
}

const saveSpectralCalibrationProfile = async ( metadata = {} ) => {
	const friendlyName = String( metadata?.friendlyName ?? "" ).trim()
	const description = String( metadata?.description ?? "" ).trim()
	if(
		project.value?.shared ||
		spectralCalibrationProfileSaving.value ||
		canSaveSpectralCalibrationProfile.value === false ||
		friendlyName.length === 0 ||
		spectralCalibrationProfileNameExists( friendlyName )
	){
		return
	}

	spectralCalibrationProfileSaving.value = true
	spectralCalibrationError.value = ""

	try{
		const savedProfile = await datalib.createCalibrationProfile(
			buildSpectralCalibrationProfilePayload( spectralCalibrationDraftModel.value, { friendlyName, description }),
			measurementDataType,
			HYPERSPECTRAL_CALIBRATION_AXIS_ROLE
		)
		spectralCalibrationProfilesSupported.value = true
		spectralCalibrationSelectedProfileID.value = String( savedProfile?.profileID ?? "" ).trim()
		spectralCalibrationSelectedProfile.value = savedProfile
		spectralCalibrationPreview.value = null
		spectralCalibrationDraft.value = buildSpectralCalibrationDraftFromModel( savedProfile )
		focusedSpectralCalibrationPointID.value = ""
		spectralCalibrationProfileSaveModal.value?.close?.()
		await refreshSpectralCalibrationProfiles()
		await renderSpectralCalibrationChange()
	} catch( error ){
		if( isMissingCalibrationProfileApiError( error ) ){
			spectralCalibrationProfilesSupported.value = false
		} else {
			spectralCalibrationError.value = String( error?.detail ?? error?.message ?? "Failed to save calibration profile." ).trim()
			console.log( error )
		}
	} finally {
		spectralCalibrationProfileSaving.value = false
	}
}

const updateSpectralCalibrationPointTarget = ( payload = {} ) => {
	const pointID = String( payload?.id ?? "" ).trim()
	if( pointID.length === 0 ){
		return
	}

	spectralCalibrationDraft.value = {
		...spectralCalibrationDraft.value,
		points: spectralCalibrationDraft.value.points.map(( point ) => {
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

const updateSpectralCalibrationPolynomialOrder = ( value ) => {
	const requestedOrder = Math.trunc( Number( value ) )
	const nextOrder = Number.isFinite( requestedOrder )
		? Math.min( Math.max( requestedOrder, 0 ), spectralCalibrationMaxOrder.value )
		: 0
	const currentOrder = Math.max( Math.trunc( Number( spectralCalibrationDraft.value.polynomialOrder ) ), 0 )
	const currentIncludedOrders = Array.isArray( spectralCalibrationDraft.value.includedOrders )
		? spectralCalibrationDraft.value.includedOrders
		: [ currentOrder ]
	const nextIncludedOrderCandidates = currentIncludedOrders.filter(( order ) => Number( order ) <= nextOrder )

	if( nextOrder > currentOrder ){
		for( let order = currentOrder + 1; order <= nextOrder; order++ ){
			nextIncludedOrderCandidates.push( order )
		}
	}

	spectralCalibrationDraft.value = {
		...spectralCalibrationDraft.value,
		polynomialOrder: nextOrder,
		includedOrders: normalizeSpectralCalibrationIncludedOrders( nextIncludedOrderCandidates, nextOrder )
	}
}

const toggleSpectralCalibrationIncludedOrder = ( value ) => {
	const order = Math.trunc( Number( value ) )
	if( Number.isInteger( order ) === false ){
		return
	}

	const currentOrder = Math.max( Math.trunc( Number( spectralCalibrationDraft.value.polynomialOrder ) ), 0 )
	if( order < 0 || order > currentOrder || order === currentOrder ){
		return
	}

	const currentIncludedOrders = Array.isArray( spectralCalibrationDraft.value.includedOrders )
		? spectralCalibrationDraft.value.includedOrders
		: [ currentOrder ]
	const nextIncludedOrders = currentIncludedOrders.includes( order )
		? currentIncludedOrders.filter(( includedOrder ) => Number( includedOrder ) !== order )
		: [ ...currentIncludedOrders, order ]

	spectralCalibrationDraft.value = {
		...spectralCalibrationDraft.value,
		includedOrders: normalizeSpectralCalibrationIncludedOrders( nextIncludedOrders, currentOrder )
	}
}

const removeSpectralCalibrationPoint = ( pointID ) => {
	const normalizedPointID = String( pointID ?? "" ).trim()
	if( normalizedPointID.length === 0 ){
		return
	}

	spectralCalibrationDraft.value = {
		...spectralCalibrationDraft.value,
		points: spectralCalibrationDraft.value.points.filter(( point ) => point.id !== normalizedPointID )
	}

	if( focusedSpectralCalibrationPointID.value === normalizedPointID ){
		focusedSpectralCalibrationPointID.value = ""
	}

	if( spectralCalibrationDraft.value.polynomialOrder > spectralCalibrationMaxOrder.value ){
		spectralCalibrationDraft.value = {
			...spectralCalibrationDraft.value,
			polynomialOrder: spectralCalibrationMaxOrder.value,
			includedOrders: normalizeSpectralCalibrationIncludedOrders(
				spectralCalibrationDraft.value.includedOrders,
				spectralCalibrationMaxOrder.value
			)
		}
	}
}

const setFocusedSpectralCalibrationPointID = ( pointID ) => {
	focusedSpectralCalibrationPointID.value = String( pointID ?? "" ).trim()
}

const spectralCalibrationEditingActive = computed(() => {
	return spectralCalibrationSidebarOpen.value &&
		project.value?.shared !== true &&
		spectralCalibrationProfilesSupported.value
})

const spectralCalibrationDisplayValueForSource = ( sourceX ) => {
	const numericSourceX = Number( sourceX )
	if( Number.isFinite( numericSourceX ) === false ){
		return null
	}

	const calibrationModel = activeSpectralCalibrationModel.value
	if( calibrationModel === null ){
		return numericSourceX
	}

	const calibratedValues = applyCalibrationToValues([ numericSourceX ], calibrationModel )
	const calibratedValue = Number( calibratedValues?.[0] )
	return Number.isFinite( calibratedValue ) ? calibratedValue : numericSourceX
}

const spectralCalibrationReferenceLines = computed(() => {
	const focusedPointID = String( focusedSpectralCalibrationPointID.value ?? "" ).trim()
	return spectralCalibrationDraft.value.points
		.map(( point ) => {
			const displayX = spectralCalibrationDisplayValueForSource( point.sourceX )
			if( Number.isFinite( displayX ) === false ){
				return null
			}

			const focused = focusedPointID.length > 0 && point.id === focusedPointID
			const pulse = 0.5 + 0.5 * Math.sin( spectralCalibrationPulsePhase.value )

			return {
				x: displayX,
				color: focused ? `rgba(17, 17, 17, ${0.55 + 0.45 * pulse})` : "rgba(17, 17, 17, 0.75)",
				width: focused ? 1.5 + 1.5 * pulse : 1,
				dash: focused ? "solid" : "dash"
			}
		})
		.filter(( line ) => line !== null )
})

const spectralCalibrationHoverSelections = new WeakMap()
const MAX_SPECTRAL_CALIBRATION_CLICK_DISTANCE_PX = 14
const SPECTRAL_CALIBRATION_CLICK_DEDUP_WINDOW_MS = 48

const buildSpectralCalibrationClickSignature = ( graphElement, eventLike ) => {
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

const isDuplicateSpectralCalibrationClick = ( signature ) => {
	if( signature === null || lastSpectralCalibrationClickSignature === null ){
		return false
	}

	return signature.graphElement === lastSpectralCalibrationClickSignature.graphElement &&
		Math.abs( signature.clientX - lastSpectralCalibrationClickSignature.clientX ) <= 1 &&
		Math.abs( signature.clientY - lastSpectralCalibrationClickSignature.clientY ) <= 1 &&
		Math.abs( signature.timeStamp - lastSpectralCalibrationClickSignature.timeStamp ) <= SPECTRAL_CALIBRATION_CLICK_DEDUP_WINDOW_MS
}

const rememberSpectralCalibrationClick = ( signature ) => {
	lastSpectralCalibrationClickSignature = signature
}

const spectralCalibrationAxisReferenceToLayoutKey = ( axisReference = "", axisType = "x" ) => {
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

const resolveSpectralCalibrationGraphAxis = ( graphElement, axisReference = "", axisType = "x" ) => {
	const axisKey = spectralCalibrationAxisReferenceToLayoutKey( axisReference, axisType )
	return graphElement?._fullLayout?.[ axisKey ] ?? null
}

const readSpectralCalibrationTracePointDistance = ( tracePoints = [], clickedValue ) => {
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

const resolveSpectralCalibrationPointIndex = ( selectedPoint, selectedTrace ) => {
	const candidateIndices = [
		selectedPoint?.pointIndex,
		selectedPoint?.pointNumber,
		selectedPoint?.i
	]
	const tracePointCount = Array.isArray( selectedTrace?.x ) ? selectedTrace.x.length : 0

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

const resolveSpectralCalibrationSourceXFromIndex = ( index, fallbackValue = null ) => {
	const pointIndex = Number( index )
	const rawValues = rawSpectralAxisValues()
	if( Number.isInteger( pointIndex ) && pointIndex >= 0 && pointIndex < rawValues.length ){
		const rawValue = Number( rawValues[ pointIndex ] )
		if( Number.isFinite( rawValue ) ){
			return rawValue
		}
	}

	const fallback = Number( fallbackValue )
	return Number.isFinite( fallback ) ? fallback : null
}

const isSpectralCalibrationClickableTrace = ( trace ) => {
	if( trace === null || typeof trace !== "object" ){
		return false
	}
	if( trace.visible === false || trace.visible === "legendonly" ){
		return false
	}
	if( trace.hoverinfo === "skip" ){
		return false
	}
	if( Array.isArray( trace.x ) === false || Array.isArray( trace.y ) === false ){
		return false
	}

	return trace.x.length > 0 && trace.y.length > 0
}

const resolveSpectralCalibrationSelection = ( eventData ) => {
	const candidatePoints = Array.isArray( eventData?.points ) ? eventData.points : []
	for( const selectedPoint of candidatePoints ){
		const selectedTrace = selectedPoint?.data ?? selectedPoint?.fullData ?? null
		if( isSpectralCalibrationClickableTrace( selectedTrace ) === false ){
			continue
		}

		const pointIndex = resolveSpectralCalibrationPointIndex( selectedPoint, selectedTrace )
		const sourceX = resolveSpectralCalibrationSourceXFromIndex( pointIndex, selectedPoint?.x )
		if( Number.isFinite( sourceX ) ){
			return { sourceX, selectedPoint, selectedTrace }
		}
	}

	return null
}

const resolveSpectralCalibrationSelectionFromGraphClick = ( graphElement, event ) => {
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
		if( isSpectralCalibrationClickableTrace( trace ) && legendGroup.length > 0 && trace?.fill !== "tonexty" ){
			lowerBandTraceByLegendGroup.set( legendGroup, trace )
		}
	}

	let bestSelection = null

	for( const trace of traces ){
		if( isSpectralCalibrationClickableTrace( trace ) === false ){
			continue
		}

		const xAxis = resolveSpectralCalibrationGraphAxis( graphElement, trace?.xaxis, "x" )
		const yAxis = resolveSpectralCalibrationGraphAxis( graphElement, trace?.yaxis, "y" )
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
		const yValues = Array.isArray( trace?.y ) ? trace.y : []
		const nearestIndex = readSpectralCalibrationTracePointDistance( displayedXValues, clickedXValue )
		if( nearestIndex < 0 ){
			continue
		}

		const sourceX = resolveSpectralCalibrationSourceXFromIndex( nearestIndex, displayedXValues[ nearestIndex ] )
		const displayedX = Number( displayedXValues[ nearestIndex ] )
		if( Number.isFinite( sourceX ) === false || Number.isFinite( displayedX ) === false ){
			continue
		}

		const projectedX = Number( xAxis.d2p( displayedX ) ) + plotLeft
		const horizontalDistance = Math.abs( relativeX - projectedX )
		if( horizontalDistance > MAX_SPECTRAL_CALIBRATION_CLICK_DISTANCE_PX ){
			continue
		}

		let verticalDistance = Number.POSITIVE_INFINITY
		if( trace?.fill === "tonexty" ){
			const legendGroup = typeof trace?.legendgroup === "string" ? trace.legendgroup.trim() : ""
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
			} else if( relativeY > bandBottom ){
				verticalDistance = relativeY - bandBottom
			} else {
				verticalDistance = 0
			}
		} else {
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

const applySpectralCalibrationSelection = ( sourceX ) => {
	if( Number.isFinite( sourceX ) === false ){
		return
	}

	const existingPoint = spectralCalibrationDraft.value.points.find(( point ) => Math.abs( Number( point.sourceX ) - sourceX ) < 1e-9 ) ?? null
	if( existingPoint !== null ){
		focusedSpectralCalibrationPointID.value = existingPoint.id
		spectralCalibrationPanelOpen.value = true
		return
	}

	spectralCalibrationDraftPointCounter.value += 1
	const nextPoint = {
		id: `calibration-point-${spectralCalibrationDraftPointCounter.value}`,
		sourceX,
		targetInput: String( sourceX )
	}

	spectralCalibrationDraft.value = {
		...spectralCalibrationDraft.value,
		points: [ ...spectralCalibrationDraft.value.points, nextPoint ]
	}

	focusedSpectralCalibrationPointID.value = nextPoint.id
	spectralCalibrationPanelOpen.value = true
}

const detachSpectralCalibrationPlotClickListeners = () => {
	const graphElements = [ deckTopPanelGraph.value, deckBottomPanelGraph.value ]

	for( const graphElement of graphElements ){
		if( graphElement === null ) continue

		if( typeof graphElement.removeListener === "function" ){
			if( spectralCalibrationPlotHoverHandler !== null ){
				graphElement.removeListener( "plotly_hover", spectralCalibrationPlotHoverHandler )
			}
			if( spectralCalibrationPlotUnhoverHandler !== null ){
				graphElement.removeListener( "plotly_unhover", spectralCalibrationPlotUnhoverHandler )
			}
		}

		if( spectralCalibrationGraphClickFallbackHandler !== null ){
			graphElement.removeEventListener( "click", spectralCalibrationGraphClickFallbackHandler )
		}

		spectralCalibrationHoverSelections.delete( graphElement )
	}

	lastSpectralCalibrationClickSignature = null
}

const syncSpectralCalibrationHoverSelection = ( graphElement, eventData ) => {
	if( graphElement === null ){
		return
	}

	const selection = resolveSpectralCalibrationSelection( eventData )
	if( selection === null ){
		spectralCalibrationHoverSelections.delete( graphElement )
		return
	}

	spectralCalibrationHoverSelections.set( graphElement, selection )
}

const handleSpectralCalibrationGraphClickFallback = ( graphElement, event ) => {
	if( spectralCalibrationEditingActive.value === false || graphElement === null ){
		return
	}

	const clickSignature = buildSpectralCalibrationClickSignature( graphElement, event )
	if( isDuplicateSpectralCalibrationClick( clickSignature ) ){
		return
	}

	if( event?.target instanceof Element && event.target.closest( ".modebar" ) !== null ){
		return
	}

	const directSelection = resolveSpectralCalibrationSelectionFromGraphClick( graphElement, event )
	if( directSelection !== null ){
		rememberSpectralCalibrationClick( clickSignature )
		applySpectralCalibrationSelection( directSelection.sourceX )
		return
	}

	const selection = spectralCalibrationHoverSelections.get( graphElement ) ??
		resolveSpectralCalibrationSelection({ points: graphElement?._hoverdata }) ??
		null
	if( selection === null ){
		return
	}

	rememberSpectralCalibrationClick( clickSignature )
	applySpectralCalibrationSelection( selection.sourceX )
}

const syncSpectralCalibrationPlotClickListeners = () => {
	detachSpectralCalibrationPlotClickListeners()

	if( spectralCalibrationEditingActive.value === false ){
		spectralCalibrationPlotClickHandler = null
		spectralCalibrationPlotHoverHandler = null
		spectralCalibrationPlotUnhoverHandler = null
		spectralCalibrationGraphClickFallbackHandler = null
		return
	}

	const graphElements = [ deckTopPanelGraph.value, deckBottomPanelGraph.value ]
	spectralCalibrationPlotHoverHandler = function( eventData ){
		syncSpectralCalibrationHoverSelection( this ?? null, eventData )
	}
	spectralCalibrationPlotUnhoverHandler = function(){
		if( this !== null && this !== undefined ){
			spectralCalibrationHoverSelections.delete( this )
		}
	}
	spectralCalibrationGraphClickFallbackHandler = function( event ){
		handleSpectralCalibrationGraphClickFallback( this ?? null, event )
	}

	for( const graphElement of graphElements ){
		if( graphElement === null ) continue
		if( typeof graphElement.on === "function" ){
			graphElement.on( "plotly_hover", spectralCalibrationPlotHoverHandler )
			graphElement.on( "plotly_unhover", spectralCalibrationPlotUnhoverHandler )
		}
		graphElement.addEventListener( "click", spectralCalibrationGraphClickFallbackHandler )
	}
}

const syncSpectralCalibrationReferenceLines = async () => {
	const graphElements = [ deckTopPanelGraph.value, deckBottomPanelGraph.value ]
	const lines = spectralCalibrationReferenceLines.value
	const operations = graphElements
		.filter(( graphElement ) => graphElement !== null )
		.map(( graphElement ) => spectralCalibrationEditingActive.value
			? plot.showCalibrationLines( lines, graphElement, settings.value )
			: plot.deleteMarker( graphElement ))

	await Promise.all( operations )
}

const stopSpectralCalibrationPulse = () => {
	if( spectralCalibrationPulseInterval !== null ){
		clearInterval( spectralCalibrationPulseInterval )
		spectralCalibrationPulseInterval = null
	}

	spectralCalibrationPulsePhase.value = 0
}

const syncSpectralCalibrationPulse = () => {
	stopSpectralCalibrationPulse()

	if( spectralCalibrationEditingActive.value === false || focusedSpectralCalibrationPointID.value.length === 0 ){
		return
	}

	let phase = 0
	spectralCalibrationPulseInterval = setInterval(() => {
		phase += Math.PI / 10
		spectralCalibrationPulsePhase.value = phase
	}, 100 )
}

const openGpuInferenceModal = async () => {
	if( spectralCalibrationSelectionDirty.value ){
		const shouldSave = window.confirm(
			"The selected spectral calibration profile has not been saved to this project. Save it before starting Raman inference?"
		)
		if( shouldSave === false ){
			return
		}

		const saved = await assignSpectralCalibrationProfileToProject()
		if( saved === false || spectralCalibrationSelectionDirty.value ){
			return
		}
	}

	await openGpuInferenceModalBase()
}

const toggleAllRoiOverlays = () => {
	applyToggleAllRoiOverlays()
}

const saveRoi = async ( payload ) => {
	try{
		const saved = await persistRoi( payload )
		if( saved ){
			roiSaveModal.value?.close()
		}
	} catch( error ){
		console.log( error )
	}
}

const deleteSelectedRoi = async () => {
	try{
		const deleted = await deleteSelectedRois()
		if( deleted ){
			roiDeleteModal.value?.close()
		}
	} catch( error ){
		console.log( error )
	}
}

const handleHeatmapRendererTiming = ( payload ) => {

	const pendingBenchmark = pendingDeckRenderBenchmark.value
	if( pendingBenchmark === null ){
		return
	}

	const payloadToken = Number.parseInt( payload?.benchmarkToken, 10 )
	if( Number.isInteger( payloadToken ) === false || payloadToken !== pendingBenchmark.token ){
		return
	}

	const initialRenderMs = performance.now() - pendingBenchmark.startedAt
	if( Number.isFinite( initialRenderMs ) === false ){
		return
	}

	pendingDeckRenderBenchmark.value = null

	heatmapRenderBenchmark.value = {
		renderer: typeof payload?.renderer === "string" ? payload.renderer : heatmapRendererMode.value,
		viewMode: pendingBenchmark.viewMode,
		initialRenderMs,
		lastMeasuredAt: new Date().toISOString()
	}
}

const layerHeatmapColorscale = () => {

	const configuredColorscale = settings.value?.colormaps?.layer
	return typeof configuredColorscale === "string" && configuredColorscale.length > 0
		? configuredColorscale
		: "Viridis"
}

const mipHeatmapColorscale = () => {

	const configuredColorscale = settings.value?.colormaps?.mip
	return typeof configuredColorscale === "string" && configuredColorscale.length > 0
		? configuredColorscale
		: "Viridis"
}

const hyperspectrumDisplayRegistry = createHyperspectrumDisplayRegistry({
	graph,
	heatmapRendererMode,
	heatmapUsesEstimatedRaman,
	hyperspectrum,
	mip,
	estimatedMip,
	mipHsv,
	estimatedMipHsv,
	umap,
	estimatedUmap,
	zBlendMeasurementSource,
	zBlendEstimatedSource,
	pcaClassificationMip,
	estimatedPcaClassificationMip,
	pcaMip,
	estimatedPcaMip,
	pcaClassification,
	estimatedPcaClassification,
	rpcaClassificationMip,
	estimatedRpcaClassificationMip,
	rpcaMip,
	estimatedRpcaMip,
	rpcaClassification,
	estimatedRpcaClassification,
	mipHeatmapColorscale,
	resolvedUmapChannelColors,
	activePlot,
	settings,
	pcaRgbChannels,
	resolvedPcaLoadings,
	resolvedRpcaLoadings,
	pcaClassificationLoadingComponents,
	pcaMipLoadingComponents
})

const { prewarmVisualizationTargetPayload, resolveCurrentPlotRenderSpec } = hyperspectrumDisplayRegistry

const stopDeckPaneResize = () => {

	if( deckPaneResizeSession === null ){
		return
	}

	window.removeEventListener( "pointermove", deckPaneResizeSession.onPointerMove )
	window.removeEventListener( "pointerup", deckPaneResizeSession.onPointerUp )
	window.removeEventListener( "pointercancel", deckPaneResizeSession.onPointerUp )
	deckPaneResizeSession = null
}

const resizePlotlyContainer = async ( graphContainer ) => {

	try{
		await hyperspectrum.resizeGraph( graphContainer )
	} catch( error ){
		console.log( error )
	}
}

const queueDeckPaneResponsiveResize = () => {

	if( heatmapRendererMode.value !== "deckgl" ){
		return
	}

	if( deckPaneResponsiveResizeQueued ){
		return
	}

	deckPaneResponsiveResizeQueued = true

	requestAnimationFrame( async () => {

		deckPaneResponsiveResizeQueued = false

		await Promise.all([
			resizePlotlyContainer( deckTopPanelGraph.value ),
			resizePlotlyContainer( deckBottomPanelGraph.value ),
			resizePlotlyContainer( graph.value )
		])

		await syncExternalHeatmapRenderer()
	} )
}

const startDeckPaneResize = ( event ) => {

	if( heatmapRendererMode.value !== "deckgl" ){
		return
	}

	stopDeckPaneResize()

	const startWidth = ensureDeckHeatmapPaneWidth()
	const startX = Number( event.clientX )

	if( Number.isFinite( startX ) === false ){
		return
	}

	const onPointerMove = ( moveEvent ) => {

		const currentX = Number( moveEvent.clientX )
		if( Number.isFinite( currentX ) === false ){
			return
		}

		deckHeatmapPaneWidth.value = clampDeckHeatmapPaneWidth( startWidth - ( currentX - startX ))
		queueDeckPaneResponsiveResize()
	}

	const onPointerUp = () => {
		stopDeckPaneResize()
		queueDeckPaneResponsiveResize()
	}

	deckPaneResizeSession = {
		onPointerMove,
		onPointerUp
	}

	deckHeatmapPaneWidthTouched.value = true

	window.addEventListener( "pointermove", onPointerMove )
	window.addEventListener( "pointerup", onPointerUp )
	window.addEventListener( "pointercancel", onPointerUp )

	event.preventDefault()
}

const startDeckSpectraPaneResize = ( event ) => {

	if( heatmapRendererMode.value !== "deckgl" ){
		return
	}

	stopDeckPaneResize()

	const startHeight = ensureDeckTopSpectrumPaneHeight()
	const startY = Number( event.clientY )

	if( Number.isFinite( startY ) === false ){
		return
	}

	const onPointerMove = ( moveEvent ) => {

		const currentY = Number( moveEvent.clientY )
		if( Number.isFinite( currentY ) === false ){
			return
		}

		deckTopSpectrumPaneHeight.value = clampDeckTopSpectrumPaneHeight( startHeight + ( currentY - startY ))
		queueDeckPaneResponsiveResize()
	}

	const onPointerUp = () => {
		stopDeckPaneResize()
		queueDeckPaneResponsiveResize()
	}

	deckPaneResizeSession = {
		onPointerMove,
		onPointerUp
	}

	deckTopSpectrumPaneHeightTouched.value = true

	window.addEventListener( "pointermove", onPointerMove )
	window.addEventListener( "pointerup", onPointerUp )
	window.addEventListener( "pointercancel", onPointerUp )

	event.preventDefault()
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

	if( selectedRoiIds.value.length > 0 ){
		clearSelectedRois()
		return
	}

	if( graph.value === null ) return
	if( currentMatrix() === null ) return

	await renderCurrentMatrix()
}
const loadLayer = async ( layerIndex, priority = "high" ) => {

	if( layer.value !== null && layerIndex === activeLayerIndex.value ){
		if( activePlot.value === "layer" ){
			await renderCurrentMatrix()
		}
		if( shouldChunkBackgroundLoad( priority ) === false || activePlot.value === "layer" ){
			prefetchMeasurementLayerWindow( layerIndex )
		}
		return
	}

	const requestID = activeLayerRequestID.value + 1
	activeLayerRequestID.value = requestID

	hyperspectrumCache.setActiveLayer( project.value, layerIndex, layerCacheOptions() )

	const immediateLayer = hyperspectrumCache.peekLayer( project.value, layerIndex, layerCacheOptions() )
	if( immediateLayer !== null ){
		layer.value = immediateLayer
		activeLayerIndex.value = layerIndex

		if( activePlot.value === "layer" ){
			await renderCurrentMatrix()
		}

		prefetchMeasurementLayerWindow( layerIndex )
		scheduleLayerPayloadPrewarm( layerIndex, false )
		return
	}

	const loadedLayer = await hyperspectrumCache.getLayer( project.value,
														layerIndex,
														{ ...layerCacheOptions(), priority: normalizedLoadPriority( priority ) })

	if( requestID !== activeLayerRequestID.value ) return

	layer.value = loadedLayer
	activeLayerIndex.value = layerIndex

	if( activePlot.value === "layer" ){
		await renderCurrentMatrix()
	}

	if( shouldChunkBackgroundLoad( priority ) === false || activePlot.value === "layer" ){
		prefetchMeasurementLayerWindow( layerIndex )
		scheduleLayerPayloadPrewarm( layerIndex, false )
	}
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

	let redChannel = null
	let greenChannel = null
	let blueChannel = null

	if( shouldChunkBackgroundLoad( priority ) ){
		redChannel = await loadEstimatedArtifact( "umap/r", priority )
		if( requestID !== activeEstimatedUmapRequestID.value ) return estimatedUmap.value
		await yieldToBrowser()

		greenChannel = await loadEstimatedArtifact( "umap/g", priority )
		if( requestID !== activeEstimatedUmapRequestID.value ) return estimatedUmap.value
		await yieldToBrowser()

		blueChannel = await loadEstimatedArtifact( "umap/b", priority )
	} else {
		[ redChannel, greenChannel, blueChannel ] = await Promise.all([
			loadEstimatedArtifact( "umap/r", priority ),
			loadEstimatedArtifact( "umap/g", priority ),
			loadEstimatedArtifact( "umap/b", priority )
		])
	}

	if( requestID !== activeEstimatedUmapRequestID.value ) return estimatedUmap.value

	estimatedUmap.value = {
		r: redChannel,
		g: greenChannel,
		b: blueChannel
	}
	return estimatedUmap.value
}

const loadEstimatedLayer = async ( layerIndex, priority = "high" ) => {

	hyperspectrumCache.setActiveLayer( project.value, layerIndex, layerCacheOptions() )

	if( estimatedLayer.value !== null && activeEstimatedLayerIndex.value === layerIndex ){
		if( shouldChunkBackgroundLoad( priority ) === false || activePlot.value === "layer" ){
			prefetchEstimatedLayerWindow( layerIndex )
		}
		return estimatedLayer.value
	}

	const immediateLayer = hyperspectrumCache.peekArtifact( project.value, "estimate/layers/" + layerIndex, layerCacheOptions() )
	if( immediateLayer !== null ){
		estimatedLayer.value = immediateLayer
		activeEstimatedLayerIndex.value = layerIndex
		if( shouldChunkBackgroundLoad( priority ) === false || activePlot.value === "layer" ){
			prefetchEstimatedLayerWindow( layerIndex )
			scheduleLayerPayloadPrewarm( layerIndex, true )
		}
		return estimatedLayer.value
	}

	const loadedLayer = await loadEstimatedArtifact( "layers/" + layerIndex, priority )

	estimatedLayer.value = loadedLayer
	activeEstimatedLayerIndex.value = layerIndex
	if( shouldChunkBackgroundLoad( priority ) === false || activePlot.value === "layer" ){
		prefetchEstimatedLayerWindow( layerIndex )
		scheduleLayerPayloadPrewarm( layerIndex, true )
	}

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
	const scores = []

	if( shouldChunkBackgroundLoad( priority ) ){
		for( const mode of modes ){
			scores.push( await loadEstimatedArtifact( mode, priority ) )
			if( requestID !== activeEstimatedPcaClassificationRequestID.value ) return estimatedPcaClassification.value
			await yieldToBrowser()
		}
	} else {
		scores.push( ...( await Promise.all( modes.map(( mode ) => loadEstimatedArtifact( mode, priority )))))
	}

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
	const scores = []

	if( shouldChunkBackgroundLoad( priority ) ){
		for( const mode of modes ){
			scores.push( await loadEstimatedArtifact( mode, priority ) )
			if( requestID !== activeEstimatedRpcaClassificationRequestID.value ) return estimatedRpcaClassification.value
			await yieldToBrowser()
		}
	} else {
		scores.push( ...( await Promise.all( modes.map(( mode ) => loadEstimatedArtifact( mode, priority )))))
	}

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
	if( activeDisplayedRois.value.length > 0 ) return

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

		if( activePlot.value === "z_blend" ){
			await loadZBlendSource( true, priority )
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

	let loadedUmap = null

	if( shouldChunkBackgroundLoad( priority ) ){
		const requestPriority = priority === "low" ? "low" : "high"
		const redChannel = await hyperspectrumCache.getArtifact( project.value, "umap/r", {
			...cacheOptions,
			priority: requestPriority
		} )
		if( requestID !== activeUmapRequestID.value ) return umap.value
		await yieldToBrowser()

		const greenChannel = await hyperspectrumCache.getArtifact( project.value, "umap/g", {
			...cacheOptions,
			priority: requestPriority
		} )
		if( requestID !== activeUmapRequestID.value ) return umap.value
		await yieldToBrowser()

		const blueChannel = await hyperspectrumCache.getArtifact( project.value, "umap/b", {
			...cacheOptions,
			priority: requestPriority
		} )

		loadedUmap = {
			r: redChannel,
			g: greenChannel,
			b: blueChannel
		}
	} else {
		loadedUmap = await hyperspectrumCache.getUmap( project.value,
													{ ...cacheOptions, priority: priority === "low" ? "low" : "high" })
	}

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

const loadPcaClassification = async ( priority = "high" ) => {

	const requestPriority = normalizedLoadPriority( priority )

	if( pcaClassification.value !== null ){
		return pcaClassification.value
	}
	if( pcaClassificationLoadPromise !== null ){
		return pcaClassificationLoadPromise
	}

	pcaClassificationLoadPromise = ( async () => {

		const requestID = activePcaClassificationRequestID.value + 1
		activePcaClassificationRequestID.value = requestID

		hyperspectrumCache.setActivePca( project.value, 5, cacheOptions )

		const scores = []

		if( shouldChunkBackgroundLoad( priority ) ){
			for( const componentIndex of pcaComponentIndices ){
				scores.push( await hyperspectrumCache.getPcaScore( project.value,
												componentIndex,
												{ ...cacheOptions, priority: requestPriority }))
				if( requestID !== activePcaClassificationRequestID.value ) return pcaClassification.value
				await yieldToBrowser()
			}
		} else {
			scores.push( ...( await Promise.all( pcaComponentIndices.map(( componentIndex ) => {
				return hyperspectrumCache.getPcaScore( project.value,
												componentIndex,
												{ ...cacheOptions, priority: requestPriority })
			}))))
		}

		if( requestID !== activePcaClassificationRequestID.value ) return pcaClassification.value

		var combinedScores = {}
		for( var ii = 0; ii < pcaComponentIndices.length; ii++ ){
			combinedScores[ pcaComponentIndices[ii] ] = scores[ii]
		}

		pcaClassification.value = combinedScores

		return pcaClassification.value
	})()

	try{
		return await pcaClassificationLoadPromise
	} finally {
		pcaClassificationLoadPromise = null
	}
}

const loadPcaClassificationMip = async ( componentCount = activePcaClassificationCount(), priority = "high" ) => {

	const normalizedComponentCount = normalizePcaComponentInput( componentCount )
	const requestPriority = normalizedLoadPriority( priority )

	if( pcaClassificationMip.value !== null &&
		activePcaClassificationComponentCount.value === normalizedComponentCount ){
		return pcaClassificationMip.value
	}

	const requestID = activePcaClassificationMipRequestID.value + 1
	activePcaClassificationMipRequestID.value = requestID

	const loadedPcaClassificationMip = await hyperspectrumCache.getPcaMip( project.value, {
		...cacheOptions,
		componentCount: normalizedComponentCount,
		priority: requestPriority
	})

	if( requestID !== activePcaClassificationMipRequestID.value ) return pcaClassificationMip.value

	pcaClassificationMip.value = loadedPcaClassificationMip
	activePcaClassificationComponentCount.value = normalizedComponentCount

	return pcaClassificationMip.value
}

const loadPcaMip = async ( componentCount = pcaMipComponentCount.value, priority = "high" ) => {

	const normalizedComponentCount = normalizePcaComponentInput( componentCount )
	const requestPriority = normalizedLoadPriority( priority )
	pcaMipComponentCount.value = normalizedComponentCount

	if( pcaMip.value !== null && activePcaMipComponentCount.value === normalizedComponentCount ){
		return pcaMip.value
	}

	const requestID = activePcaMipRequestID.value + 1
	activePcaMipRequestID.value = requestID

	const loadedPcaMip = await hyperspectrumCache.getPcaMip( project.value, {
		...cacheOptions,
		componentCount: normalizedComponentCount,
		priority: requestPriority
	})

	if( requestID !== activePcaMipRequestID.value ) return pcaMip.value

	pcaMip.value = loadedPcaMip
	activePcaMipComponentCount.value = normalizedComponentCount

	if( activePlot.value === "pca_mip" ){
		await renderCurrentMatrix()
	}

	return pcaMip.value
}

const loadPcaLoadings = async ( priority = "high" ) => {

	if( pcaLoadings.value !== null ){
		return pcaLoadings.value
	}

	const requestID = activePcaLoadingsRequestID.value + 1
	activePcaLoadingsRequestID.value = requestID

	const loadedLoadings = await hyperspectrumCache.getLoadings( project.value, {
		...cacheOptions,
		priority: normalizedLoadPriority( priority )
	})

	if( requestID !== activePcaLoadingsRequestID.value ) return pcaLoadings.value

	pcaLoadings.value = loadedLoadings

	return pcaLoadings.value
}

const loadRpcaClassification = async ( priority = "high" ) => {

	const requestPriority = normalizedLoadPriority( priority )

	if( rpcaClassification.value !== null ){
		return rpcaClassification.value
	}
	if( rpcaClassificationLoadPromise !== null ){
		return rpcaClassificationLoadPromise
	}

	rpcaClassificationLoadPromise = ( async () => {

		const requestID = activeRpcaClassificationRequestID.value + 1
		activeRpcaClassificationRequestID.value = requestID

		hyperspectrumCache.setActiveRpca( project.value, 5, cacheOptions )

		const scores = []

		if( shouldChunkBackgroundLoad( priority ) ){
			for( const componentIndex of pcaComponentIndices ){
				scores.push( await hyperspectrumCache.getRpcaScore( project.value,
												componentIndex,
												{ ...cacheOptions, priority: requestPriority }))
				if( requestID !== activeRpcaClassificationRequestID.value ) return rpcaClassification.value
				await yieldToBrowser()
			}
		} else {
			scores.push( ...( await Promise.all( pcaComponentIndices.map(( componentIndex ) => {
				return hyperspectrumCache.getRpcaScore( project.value,
												componentIndex,
												{ ...cacheOptions, priority: requestPriority })
			}))))
		}

		if( requestID !== activeRpcaClassificationRequestID.value ) return rpcaClassification.value

		var combinedScores = {}
		for( var ii = 0; ii < pcaComponentIndices.length; ii++ ){
			combinedScores[ pcaComponentIndices[ii] ] = scores[ii]
		}

		rpcaClassification.value = combinedScores

		return rpcaClassification.value
	})()

	try{
		return await rpcaClassificationLoadPromise
	} finally {
		rpcaClassificationLoadPromise = null
	}
}

const loadRpcaClassificationMip = async ( componentCount = activePcaClassificationCount(), priority = "high" ) => {

	const normalizedComponentCount = normalizePcaComponentInput( componentCount )
	const requestPriority = normalizedLoadPriority( priority )

	if( rpcaClassificationMip.value !== null &&
		activeRpcaClassificationComponentCount.value === normalizedComponentCount ){
		return rpcaClassificationMip.value
	}

	const requestID = activeRpcaClassificationMipRequestID.value + 1
	activeRpcaClassificationMipRequestID.value = requestID

	const loadedRpcaClassificationMip = await hyperspectrumCache.getRpcaMip( project.value, {
		...cacheOptions,
		componentCount: normalizedComponentCount,
		priority: requestPriority
	})

	if( requestID !== activeRpcaClassificationMipRequestID.value ) return rpcaClassificationMip.value

	rpcaClassificationMip.value = loadedRpcaClassificationMip
	activeRpcaClassificationComponentCount.value = normalizedComponentCount

	return rpcaClassificationMip.value
}

const loadRpcaMip = async ( componentCount = pcaMipComponentCount.value, priority = "high" ) => {

	const normalizedComponentCount = normalizePcaComponentInput( componentCount )
	const requestPriority = normalizedLoadPriority( priority )
	pcaMipComponentCount.value = normalizedComponentCount

	if( rpcaMip.value !== null && activeRpcaMipComponentCount.value === normalizedComponentCount ){
		return rpcaMip.value
	}

	const requestID = activeRpcaMipRequestID.value + 1
	activeRpcaMipRequestID.value = requestID

	const loadedRpcaMip = await hyperspectrumCache.getRpcaMip( project.value, {
		...cacheOptions,
		componentCount: normalizedComponentCount,
		priority: requestPriority
	})

	if( requestID !== activeRpcaMipRequestID.value ) return rpcaMip.value

	rpcaMip.value = loadedRpcaMip
	activeRpcaMipComponentCount.value = normalizedComponentCount

	return rpcaMip.value
}

const loadRpcaLoadings = async ( priority = "high" ) => {

	if( rpcaLoadings.value !== null ){
		return rpcaLoadings.value
	}

	const requestID = activeRpcaLoadingsRequestID.value + 1
	activeRpcaLoadingsRequestID.value = requestID

	const loadedLoadings = await hyperspectrumCache.getRpcaLoadings( project.value, {
		...cacheOptions,
		priority: normalizedLoadPriority( priority )
	})

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

const canStepLayerInput = ( delta ) => {
	const currentValue = normalizeLayerInput( layerInput.value )
	const nextValue = currentValue + Number( delta )
	return nextValue >= 0 && nextValue <= maxLayerIndex.value
}

const stepLayerInput = async ( delta ) => {

	const currentValue = normalizeLayerInput( layerInput.value )
	const nextValue = Math.max( 0, Math.min( maxLayerIndex.value, currentValue + Number( delta )))

	if( nextValue === currentValue ){
		return
	}

	layerInput.value = nextValue
	await applyLayerInput()
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

const pcaRgbComponentInputRef = ( channel ) => {
	if( channel === "r" ) return pcaRgbRedInput
	if( channel === "g" ) return pcaRgbGreenInput
	return pcaRgbBlueInput
}

const canStepPcaRgbComponent = ( channel, delta ) => {
	const componentRef = pcaRgbComponentInputRef( channel )
	const currentValue = normalizePcaComponentInput( componentRef.value )
	const nextValue = currentValue + Number( delta )
	return nextValue >= 1 && nextValue <= 10
}

const stepPcaRgbComponent = async ( channel, delta ) => {

	const componentRef = pcaRgbComponentInputRef( channel )
	const currentValue = normalizePcaComponentInput( componentRef.value )
	const nextValue = Math.max( 1, Math.min( 10, currentValue + Number( delta )))

	if( nextValue === currentValue ){
		return
	}

	componentRef.value = nextValue
	await applyPcaRgbInput()
}

const pcaComponentCountRef = ( kind ) => {
	return kind === "classification" ? pcaClassificationComponentCount : pcaMipComponentCount
}

const canStepPcaComponentCount = ( kind, delta ) => {
	const countRef = pcaComponentCountRef( kind )
	const currentValue = normalizePcaComponentInput( countRef.value )
	const nextValue = currentValue + Number( delta )
	return nextValue >= 1 && nextValue <= 10
}

const stepPcaComponentCount = async ( kind, delta ) => {

	const countRef = pcaComponentCountRef( kind )
	const currentValue = normalizePcaComponentInput( countRef.value )
	const nextValue = Math.max( 1, Math.min( 10, currentValue + Number( delta )))

	if( nextValue === currentValue ){
		return
	}

	countRef.value = nextValue

	if( kind === "classification" ){
		await applyPcaClassificationComponentCount()
		return
	}

	await applyPcaMipComponentCount()
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
	if( heatmapRendererMode.value === "deckgl" ){
		ensureDeckHeatmapPaneWidth()
		ensureDeckTopSpectrumPaneHeight()
		queueDeckPaneResponsiveResize()
		return
	}
	await renderCurrentMatrix()
}, 100 )

const ensureViewerResizeObserver = () => {

	if( resizeObserver !== null ) return
	if( typeof ResizeObserver === "undefined" ) return
	if( graph.value === null ) return

	resizeObserver = new ResizeObserver(() => {
		void refreshOnResize()
	})
	resizeObserver.observe( graph.value )
}

const debouncedApplyLayerInput = debounce( async () => {

	if( activePlot.value !== "layer" ) return
	await applyLayerInput()
}, 120 )

const debouncedApplyZBlendChanges = debounce( async () => {

	if( activePlot.value !== "z_blend" ) return
	if( graph.value === null ) return

	try{
		await renderCurrentMatrix()
	} catch( error ){
		console.log( error )
	}
}, 16 )

const debouncedApplyZBlendHeatmapOnlyChanges = debounce( async () => {

	if( activePlot.value !== "z_blend" ) return
	if( graph.value === null ) return

	try{
		await renderZBlendHeatmapOnly()
	} catch( error ){
		console.log( error )
	}
}, 16 )

const debouncedApplyPcaRgbInput = debounce( async () => {

	if( activePlot.value !== "pca_rgb" && activePlot.value !== "rpca_rgb" ) return
	await applyPcaRgbInput()
}, 120 )

const debouncedApplyPcaClassificationComponentCount = debounce( async () => {

	if( activePlot.value !== "pca" && activePlot.value !== "rpca" ) return
	await applyPcaClassificationComponentCount()
}, 120 )

const debouncedApplyPcaMipComponentCount = debounce( async () => {

	if( activePlot.value !== "pca_mip" && activePlot.value !== "rpca_mip" ) return
	await applyPcaMipComponentCount()
}, 120 )

const resetViewerState = () => {

	resetGpuInferenceState()
	resetHeatmapToolbarState()
	stopDeckPaneResize()
	invalidateLayerPayloadPrewarm()
	invalidateDisplayPayloadPrewarm()
	clearProjectBackgroundWork()
	resetSpectrumPlotSyncState()
	activeLayerRequestID.value += 1
	activeMipHsvRequestID.value += 1
	activeUmapRequestID.value += 1
	activeXyzRequestID.value += 1
	activePcaClassificationRequestID.value += 1
	activePcaClassificationMipRequestID.value += 1
	activePcaMipRequestID.value += 1
	activePcaLoadingsRequestID.value += 1
	activeRpcaClassificationRequestID.value += 1
	activeRpcaClassificationMipRequestID.value += 1
	activeRpcaMipRequestID.value += 1
	activeRpcaLoadingsRequestID.value += 1
	activeEstimatedMipRequestID.value += 1
	activeEstimatedMipHsvRequestID.value += 1
	activeEstimatedUmapRequestID.value += 1
	activeZBlendMeasurementRequestID.value += 1
	activeZBlendEstimatedRequestID.value += 1
	pcaClassificationLoadPromise = null
	rpcaClassificationLoadPromise = null
	pendingDeckRenderBenchmark.value = null
	resetDeckPanelRenderKeys()
	deckHeatmapPaneWidth.value = null
	deckHeatmapPaneWidthTouched.value = false
	deckTopSpectrumPaneHeight.value = null
	deckTopSpectrumPaneHeightTouched.value = false
	resetPreparationState()
	resetViewerTutorialState()

	project.value = { id: "" }
	resetSelectionState()
	visualizationDataSource.value = resolvedDefaultVisualizationDataSource()
	selectedConfidenceLevel.value = defaultSelectionConfidenceLevel()
	activePlot.value = defaultDisplayMode()
	heatmapInteractionMode.value = defaultHeatmapInteractionMode()
	heatmapRendererMode.value = defaultHeatmapRendererMode()
	heatmapZoomAspectRatio.value = defaultHeatmapZoomAspectRatio()
	zBlendChannels.value = []
	zBlendSaving.value = false
	zBlendPresetStatus.value = "idle"
	zBlendPresetStatusMessage.value = ""
	zBlendPresetLoadedFromBackend.value = false
	zBlendDirty.value = false
	zBlendMeasurementIntensityMaximumByLayer.value = {}
	zBlendEstimatedIntensityMaximumByLayer.value = {}
	heatmapRendererPayload.value = null
	heatmapRendererPaneState.value = null
	heatmapRenderBenchmark.value = {
		renderer: heatmapRendererMode.value,
		viewMode: "",
		initialRenderMs: null,
		lastMeasuredAt: null
	}
	selectedConfidenceLevel.value = defaultSelectionConfidenceLevel()
	roiEstimateUncertaintyLevel.value = defaultRoiEstimateUncertaintyLevel()
	mip.value = null
	mipHsv.value = null
	umap.value = null
	xyzAxes.value = null
	stopSpectralCalibrationPulse()
	detachSpectralCalibrationPlotClickListeners()
	spectralCalibrationProfilesSupported.value = true
	spectralCalibrationProfilesLoading.value = false
	spectralCalibrationAssignmentSaving.value = false
	spectralCalibrationProfileSaving.value = false
	spectralCalibrationProfiles.value = []
	spectralCalibrationAssignedProfileID.value = ""
	spectralCalibrationSelectedProfileID.value = ""
	spectralCalibrationAssignedProfile.value = null
	spectralCalibrationSelectedProfile.value = null
	spectralCalibrationPreview.value = null
	spectralCalibrationPanelOpen.value = false
	focusedSpectralCalibrationPointID.value = ""
	spectralCalibrationPulsePhase.value = 0
	spectralCalibrationDraftPointCounter.value = 0
	spectralCalibrationDraft.value = buildSpectralCalibrationDraftFromModel( buildDefaultSpectralCalibrationModel() )
	spectralCalibrationError.value = ""
	spectralCalibrationSidebarOpen.value = false
	layer.value = null
	estimatedMip.value = null
	estimatedMipHsv.value = null
	estimatedUmap.value = null
	estimatedLayer.value = null
	zBlendMeasurementSource.value = null
	zBlendEstimatedSource.value = null
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
	resetRoiState()
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

useProjectViewLifecycle({
	route,
	project,
	projects,
	settings,
	billingSettings,
	activeProjectLoadRequestID,
	activePlot,
	layerInput,
	mip,
	maxLayerIndex,
	cacheOptions,
	projectlib,
	settingslib,
	hyperspectrumCache,
	navigation,
	resetViewerState: () => resetViewerState(),
	restoreGpuInferenceState: ( requestID ) => restoreGpuInferenceState( requestID ),
	loadRoiList: () => loadRoiList(),
	loadXyz: ( priority ) => loadXyz( priority ),
	loadSpectralCalibrationState: () => loadSpectralCalibrationState(),
	layerCacheOptions: () => layerCacheOptions(),
	ensureDefaultZBlendState: () => ensureDefaultZBlendState(),
	loadProjectSpectrumGridlinePreset: ( requestID ) => loadProjectSpectrumGridlinePreset( requestID ),
	loadZBlendPreset: ( requestID ) => loadZBlendPreset( requestID ),
	blockingPreparationTargetForDisplayMode: ( displayMode ) => blockingPreparationTargetForDisplayMode( displayMode ),
	markPreparationStarted: ( target ) => markPreparationStarted( target ),
	markPreparationFailed: ( target ) => markPreparationFailed( target ),
	markPreparationCompleted: ( target ) => markPreparationCompleted( target ),
	loadVisualizationTargetData: ( target, initialLayerIndex, priority ) => loadVisualizationTargetData( target, initialLayerIndex, priority ),
	nextTick,
	renderCurrentMatrix: ( initialize = false ) => renderCurrentMatrix( initialize ),
	emitLoadedOnce: () => emitLoadedOnce(),
	maybeOfferViewerTutorialPrompt: ( requestID ) => maybeOfferViewerTutorialPrompt( requestID ),
	queueProjectBackgroundHydration: ( requestID, initialLayerIndex, startingDisplayMode ) => {
		queueProjectBackgroundHydration( requestID, initialLayerIndex, startingDisplayMode )
	},
	ensureResizeObserver: () => ensureViewerResizeObserver(),
	installProjectBackgroundInteractionListeners: () => installProjectBackgroundInteractionListeners(),
	currentProjectID: () => currentProjectID()
})

useDisplayModeWorkflow({
	activePlot,
	project,
	heatmapUsesEstimatedRaman,
	showPcaLoadings,
	pcaMipComponentCount,
	pcaClassificationComponentCount,
	renderCurrentMatrix: () => renderCurrentMatrix(),
	loadMipHsv: ( priority ) => loadMipHsv( priority ),
	loadUmap: ( priority ) => loadUmap( priority ),
	ensureZBlendVisualizationMatrix: ( priority ) => ensureZBlendVisualizationMatrix( priority ),
	renderZBlendHeatmapOnly: () => renderZBlendHeatmapOnly(),
	applyLayerInput: () => applyLayerInput(),
	resetActivePcaComponents: ( count ) => resetActivePcaComponents( count ),
	loadPcaMip: ( count ) => loadPcaMip( count ),
	loadPcaClassificationMip: () => loadPcaClassificationMip(),
	loadPcaClassification: () => loadPcaClassification(),
	loadPcaLoadings: () => loadPcaLoadings(),
	loadRpcaMip: ( count ) => loadRpcaMip( count ),
	loadRpcaClassificationMip: () => loadRpcaClassificationMip(),
	loadRpcaClassification: () => loadRpcaClassification(),
	loadRpcaLoadings: () => loadRpcaLoadings()
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

watch(
	[
		() => zBlendMeasurementSource.value,
		() => zBlendEstimatedSource.value,
		() => heatmapUsesEstimatedRaman.value,
		() => heatmapRendererMode.value,
		() => activePlot.value
	],
	() => {
		if( activePlot.value !== "z_blend" ){
			return
		}

		if( heatmapRendererMode.value !== "deckgl" ){
			return
		}

		if( graph.value === null ){
			return
		}

		void syncZBlendHeatmapPayloadFromCurrentSource().catch(( error ) => {
			console.log( error )
		})
	},
	{ flush: "post" }
)

watch( heatmapInteractionMode, async () => {
	try{
		await applyHeatmapInteraction()
		syncHeatmapViewportSyncListener()
		await syncExternalHeatmapRenderer()
		hyperspectrum.syncHeatmapModebarState( graph.value, heatmapInteractionMode.value, heatmapZoomAspectRatio.value )
	} catch( error ){
		console.log( error )
	}
})

watch( heatmapRendererMode, async () => {

	invalidateLayerPayloadPrewarm()
	invalidateDisplayPayloadPrewarm()
	resetDeckPanelRenderKeys()
	removeHeatmapViewportSyncListener()

	await nextTick()

	if( heatmapRendererMode.value === "deckgl" ){
		ensureDeckHeatmapPaneWidth()
		scheduleDisplayPayloadPrewarm([ "mip", "mip_hsv", "umap", "z_blend", "pca", "pca_mip", "pca_rgb", "rpca", "rpca_mip", "rpca_rgb" ])
	}

	if( graph.value === null ){
		heatmapRendererPayload.value = null
		heatmapRendererPaneState.value = null
		return
	}

	if( currentMatrix() === null ){
		await syncExternalHeatmapRenderer()
		return
	}

	try{
		await renderCurrentMatrix()
		await applyHeatmapInteraction()
	} catch( error ){
		console.log( error )
	}
})

watch( selectedRoiIds, async () => {

	await nextTick()
	await new Promise(( resolve ) => {
		window.requestAnimationFrame(() => resolve() )
	})

	void refreshRamanRoiSpectrum()

	if( graph.value === null ) return

	try{
		await renderCurrentMatrix()
	} catch( error ){
		console.log( error )
	}
})

watch( showDisplayInfoIcon, ( nextVisible ) => {
	if( nextVisible === false ){
		showDisplayInfoTooltip.value = false
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

watch( roiEstimateUncertaintyLevel, async ( nextLevel ) => {

	const normalizedLevel = normalizeRoiEstimateUncertaintyLevel( nextLevel )
	if( normalizedLevel !== nextLevel ){
		roiEstimateUncertaintyLevel.value = normalizedLevel
		return
	}

	if( graph.value === null ) return
	if( activeDisplayedRois.value.length === 0 ) return

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
		cancelSelectionSpectrumQuery( "raman" )
		resetEstimatedRoiArtifacts()
		clearSpectrumSourceState( "raman" )

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

watch( spectralCalibrationMaxOrder, ( nextMaxOrder ) => {
	const normalizedIncludedOrders = normalizeSpectralCalibrationIncludedOrders(
		spectralCalibrationDraft.value.includedOrders,
		Math.min( spectralCalibrationDraft.value.polynomialOrder, nextMaxOrder )
	)
	const includedOrdersChanged =
		normalizedIncludedOrders.length !== ( Array.isArray( spectralCalibrationDraft.value.includedOrders ) ? spectralCalibrationDraft.value.includedOrders.length : 0 ) ||
		normalizedIncludedOrders.some(( order, index ) => order !== spectralCalibrationDraft.value.includedOrders?.[index] )

	if( spectralCalibrationDraft.value.polynomialOrder <= nextMaxOrder && includedOrdersChanged === false ){
		return
	}

	spectralCalibrationDraft.value = {
		...spectralCalibrationDraft.value,
		polynomialOrder: Math.min( spectralCalibrationDraft.value.polynomialOrder, nextMaxOrder ),
		includedOrders: normalizedIncludedOrders
	}
})

watch( spectralCalibrationSidebarOpen, async ( isOpen ) => {
	if( isOpen ){
		await nextTick()
		syncSpectralCalibrationPlotClickListeners()
		await syncSpectralCalibrationReferenceLines()
		return
	}

	spectralCalibrationPanelOpen.value = false
	focusedSpectralCalibrationPointID.value = ""
	detachSpectralCalibrationPlotClickListeners()
	stopSpectralCalibrationPulse()
	await syncSpectralCalibrationReferenceLines()
})

watch( [ spectralCalibrationEditingActive, focusedSpectralCalibrationPointID ], () => {
	syncSpectralCalibrationPulse()
}, { flush: "post" })

watch( [ spectralCalibrationReferenceLines, spectralCalibrationEditingActive ], async () => {
	await syncSpectralCalibrationReferenceLines()
}, { deep: true, flush: "post" })

onBeforeUnmount( () => {

	stopGpuInferenceStatusPolling()
	stopSpectralCalibrationPulse()
	detachSpectralCalibrationPlotClickListeners()
	resetHeatmapToolbarState()
	stopDeckPaneResize()
	cancelSpectrumGridlinePresetSave()
	cancelSelectionSpectrumQueryState()
	clearSpectrumPlotGraphListeners()
	clearProjectBackgroundWork()
	removeBackgroundInteractionListeners()

	if( resizeObserver !== null ){
		resizeObserver.disconnect()
		resizeObserver = null
	}

	invalidateLayerPayloadPrewarm()
	invalidateDisplayPayloadPrewarm()

	refreshOnResize.cancel()
	debouncedApplyLayerInput.cancel()
	debouncedApplyZBlendChanges.cancel()
	debouncedApplyZBlendHeatmapOnlyChanges.cancel()
	debouncedApplyPcaRgbInput.cancel()
	debouncedApplyPcaClassificationComponentCount.cancel()
	debouncedApplyPcaMipComponentCount.cancel()
	resetViewerTutorialState()
})

</script>

<style scoped>
.viewer-stepper,
.z-blend-value-stepper {
	display: flex;
	align-items: center;
	gap: 0.25rem;
}

.viewer-stepper-input,
.z-blend-value-input {
	appearance: textfield;
	-moz-appearance: textfield;
}

.viewer-stepper-input::-webkit-inner-spin-button,
.viewer-stepper-input::-webkit-outer-spin-button,
.z-blend-value-input::-webkit-inner-spin-button,
.z-blend-value-input::-webkit-outer-spin-button {
	-webkit-appearance: none;
	margin: 0;
}

.deck-heatmap-pane :deep(.modebar-container) {
	top: -2.25rem !important;
	right: 0.25rem !important;
	z-index: 30 !important;
	pointer-events: none;
}

.deck-heatmap-pane :deep(.modebar) {
	opacity: 0;
	z-index: 31 !important;
	pointer-events: none;
	transition: opacity 0.15s ease;
}

.deck-heatmap-pane:hover :deep(.modebar),
.deck-heatmap-pane:focus-within :deep(.modebar),
.deck-heatmap-pane.tutorial-modebar-visible :deep(.modebar) {
	opacity: 1;
	pointer-events: auto;
}

.roi-refresh-spin {
	animation: roi-refresh-rotate 0.8s linear infinite;
	transform-origin: center;
}

@keyframes roi-refresh-rotate {
	from {
		transform: rotate( 0deg );
	}

	to {
		transform: rotate( 360deg );
	}
}
</style>
