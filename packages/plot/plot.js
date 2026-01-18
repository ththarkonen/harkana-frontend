import Plotly from 'plotly.js-dist'

var initialize = async function( data, estimate, graphContainer, settings) {

    const xLabel = settings.labels.horizontal.replace(/\\/g, "\\");

    const dataLegend = settings.legends.data.replace(/\\/g, "\\");
    const medianLabel = settings.legends.median.replace(/\\/g, "\\");

    var legends = {};
    legends["95"] = settings.legends.interval95.replace(/\\/g, "\\");
    legends["90"] = settings.legends.interval90.replace(/\\/g, "\\");
    legends["75"] = settings.legends.interval75.replace(/\\/g, "\\");
    legends["50"] = settings.legends.interval50.replace(/\\/g, "\\");

    const tickFontSize = settings.font.sizes.axis;
    const labelFontSize = settings.font.sizes.label;
    const legendFontSize = settings.font.sizes.legend;

    const horizontalReverse = settings.layout.reversed == "true" ? "reversed" : true;

    const dataColorRGBA = hexToRgba( settings.colors.data, 1);
    const medianColorRGBA = hexToRgba( settings.colors.median, 1);
    const areaColorRGBA = hexToRgba( settings.colors.area, 0.10);

    const calibratedDataX = data.x.map( x => x + data.calibration.x);
    const calibratedEstimateX = estimate.x.map( x => x + data.calibration.x);

    var traceData = {};
    traceData.x = calibratedDataX;
    traceData.y = data.y;
    traceData.mode = "lines";
    traceData.name = "$" + dataLegend  + "$";
    traceData.line = {};
    traceData.line.color = dataColorRGBA;
    traceData.showlegend = true;
    traceData.visible = settings.visibility.plot.data == false ? "legendonly" : true;
    traceData.legendrank = 0;
    traceData.hovertemplate = "(%{x}, %{y})<extra></extra>"

    var traceEstimate = {};
    traceEstimate.x = calibratedEstimateX;
    traceEstimate.y = estimate.median;
    traceEstimate.mode = "lines";
    traceEstimate.name = "$" + medianLabel + "$";
    traceEstimate.line = {};
    traceEstimate.line.color = medianColorRGBA;
    traceEstimate.showlegend = true;
    traceEstimate.visible = settings.visibility.plot.median == false ? "legendonly" : true;
    traceEstimate.legendrank = 1;
    traceEstimate.xaxis = "x2";
    traceEstimate.yaxis = "y2";
    traceEstimate.hovertemplate = "(%{x}, %{y})<extra></extra>"

    const quantiles = [ 50, 75, 90, 95];

    var traces = [];
    traces.push(  traceData, traceEstimate);

    for( var ii = 0; ii < quantiles.length; ii++ ){

        var [ traceLowerBound, traceUpperBound] = uncertaintyTraces(calibratedEstimateX,
                                                                    estimate.lowerBound,
                                                                    estimate.upperBound,
                                                                    quantiles[ii],
                                                                    legends,
                                                                    settings.visibility.plot,
                                                                    areaColorRGBA);

        traces.push( traceLowerBound, traceUpperBound)
    }

    var tracesAll = structuredClone( traces )

    for( const ii in tracesAll ){
        tracesAll[ii].xaxis = "x";
    };

    var layout = {};

    layout.autosize = true;
    layout.xaxis = {};
    layout.xaxis.tickfont = {};
    layout.xaxis.title = {};
    layout.xaxis.title.font = {};

    layout.xaxis.tickfont.size = tickFontSize;
    layout.xaxis.title.text = "$$\\Large " + xLabel + "$$";
    layout.xaxis.title.font.size = labelFontSize
    layout.xaxis.autorange = horizontalReverse;

    layout.legend = {};
    layout.legend.font = {};
    layout.legend.font.size = legendFontSize;
    layout.legend.itemwidth = 20;
    layout.legend.orientation = "v"

    layout.margin = {};
    layout.margin.t = 30;
    layout.margin.l = 10 + 2 * labelFontSize;
    layout.margin.r = 100;

    var layoutVertical = structuredClone( layout );
    layoutVertical.grid = {};
    layoutVertical.grid.rows = 2;
    layoutVertical.grid.columns = 1;
    layoutVertical.grid.pattern = "independent";

    layoutVertical.xaxis2 = {};
    layoutVertical.xaxis2.title = {};
    layoutVertical.xaxis2.title.font = {};
    layoutVertical.xaxis2.tickfont = {};
    layoutVertical.xaxis2.tickfont.size = tickFontSize;
    layoutVertical.xaxis2.title.text = "$$\\Large " + xLabel + "$$";
    layoutVertical.xaxis2.title.font.size = labelFontSize
    layoutVertical.xaxis2.autorange = horizontalReverse;

    layoutVertical.yaxis = {};
    layoutVertical.yaxis2 = {};
    layoutVertical.yaxis2.rangemode = "tozero";
    layoutVertical.yaxis.tickfont = {};
    layoutVertical.yaxis2.tickfont = {};
    layoutVertical.yaxis.tickfont.size = tickFontSize;
    layoutVertical.yaxis2.tickfont.size = tickFontSize;

    var layoutHorizontal = structuredClone( layout );
    layoutHorizontal.grid = {};
    layoutHorizontal.grid.rows = 1;
    layoutHorizontal.grid.columns = 2;
    layoutHorizontal.grid.pattern = "independent";
    
    layoutHorizontal.xaxis2 = {};
    layoutHorizontal.xaxis2.title = {};
    layoutHorizontal.xaxis2.title.font = {};
    layoutHorizontal.xaxis2.tickfont = {};
    layoutHorizontal.xaxis2.tickfont.size = tickFontSize;
    layoutHorizontal.xaxis2.title.text = "$$\\Large " + xLabel + "$$";
    layoutHorizontal.xaxis2.title.font.size = labelFontSize
    layoutHorizontal.xaxis2.autorange = horizontalReverse;

    layoutHorizontal.yaxis = {};
    layoutHorizontal.yaxis2 = {};
    layoutHorizontal.rangemode = "tozero";
    layoutHorizontal.yaxis.tickfont = {};
    layoutHorizontal.yaxis2.tickfont = {};
    layoutHorizontal.yaxis.tickfont.size = tickFontSize;
    layoutHorizontal.yaxis2.tickfont.size = tickFontSize;

    layout.margin.r = 10 + 2 * labelFontSize;
    layout.yaxis = {};
    layout.yaxis.tickfont = {};
    layout.yaxis.tickfont.size = tickFontSize;

    layout.yaxis2 = {};
    layout.rangemode = "tozero";
    layout.yaxis2.overlaying = "y";
    layout.yaxis2.side = "right";
    layout.yaxis2.tickfont = {};
    layout.yaxis2.tickfont.size = tickFontSize;

    var config = {};
    config.responsive = true;
    config.displaylogo = false;

    if( settings.layout.layout === "vertical" )   Plotly.newPlot( graphContainer, traces, layoutVertical, config)
    if( settings.layout.layout === "horizontal" ) Plotly.newPlot( graphContainer, traces, layoutHorizontal, config)
    if( settings.layout.layout === "single" )     Plotly.newPlot( graphContainer, tracesAll, layout, config)
};

function uncertaintyTraces( x, lowerBounds, upperBounds, quantile, legends, visibility, color, flag){

    const legend = legends[ quantile ]

    var traceLowerBound = {};
    traceLowerBound.x = x;
    traceLowerBound.y = lowerBounds[ quantile ];
    traceLowerBound.mode = "lines";
    traceLowerBound.xaxis = "x2";
    traceLowerBound.yaxis = "y2";
    traceLowerBound.line = {};
    traceLowerBound.line.color = color;
    traceLowerBound.showlegend = false;
    traceLowerBound.visible = visibility["interval" + quantile] == false ? "legendonly" : true;
    traceLowerBound.legendgroup = "uncertainty" + quantile + flag;
    traceLowerBound.hovertemplate = "(%{x}, %{y})<extra></extra>"

    var traceUpperBound = {};
    traceUpperBound.x = x;
    traceUpperBound.y = upperBounds[ quantile ];
    traceUpperBound.mode = "lines";
    traceUpperBound.name = "$" + legend  + "$"
    traceUpperBound.fill = "tonexty";
    traceUpperBound.line = {};
    traceUpperBound.line.color = color;
    traceUpperBound.fillcolor = color;
    traceUpperBound.xaxis = "x2";
    traceUpperBound.yaxis = "y2";
    traceUpperBound.visible = visibility["interval" + quantile] == false ? "legendonly" : true;
    traceUpperBound.legendgroup = "uncertainty" + quantile + flag;
    traceUpperBound.hovertemplate = "(%{x}, %{y})<extra></extra>"

    return [ traceLowerBound, traceUpperBound]
}


var comparison = async function( data, estimate,
                                 comparisonData, comparisonEstimate,
                                 graphContainer, settings) {

    const xLabel = settings.labels.horizontal.replace(/\\/g, "\\");

    const dataLegend = settings.legends.data.replace(/\\/g, "\\");
    const medianLabel = settings.legends.median.replace(/\\/g, "\\");

    var legends = {};
    legends["95"] = settings.legends.interval95.replace(/\\/g, "\\");
    legends["90"] = settings.legends.interval90.replace(/\\/g, "\\");
    legends["75"] = settings.legends.interval75.replace(/\\/g, "\\");
    legends["50"] = settings.legends.interval50.replace(/\\/g, "\\");

    const tickFontSize = settings.font.sizes.axis;
    const labelFontSize = settings.font.sizes.label;
    const legendFontSize = settings.font.sizes.legend;
    
    const horizontalReverse = settings.layout.reversed == "true" ? "reversed" : true;

    const dataColorRGBA = hexToRgba( settings.colors.data, 1);
    const medianColorRGBA = hexToRgba( settings.colors.median, 1);
    const areaColorRGBA = hexToRgba( settings.colors.area, 0.10);

    const dataComparisonColorRGBA = hexToRgba( settings.comparisonColors.data, 1);
    const medianComparisonColorRGBA = hexToRgba( settings.comparisonColors.median, 1);
    const areaComparisonColorRGBA = hexToRgba( settings.comparisonColors.area, 0.10);

    const calibratedDataX = data.x.map( x => x + data.calibration.x);
    const calibratedEstimateX = estimate.x.map( x => x + data.calibration.x);

    const calibrateComparisondDataX = comparisonData.x.map( x => x + comparisonData.calibration.x);
    const calibratedComparisonEstimateX = comparisonEstimate.x.map( x => x + comparisonData.calibration.x);

    var traceData = {};
    traceData.x = calibratedDataX;
    traceData.y = data.y;
    traceData.mode = "lines";
    traceData.name = "$" + dataLegend  + "$";
    traceData.line = {};
    traceData.line.color = dataColorRGBA;
    traceData.visible = settings.visibility.comparison.data == false ? "legendonly" : true;
    traceData.showlegend = true;
    traceData.legendrank = 0;
    traceData.hovertemplate = "(%{x}, %{y})<extra></extra>"

    var traceEstimate = {};
    traceEstimate.x = calibratedEstimateX;
    traceEstimate.y = estimate.median;
    traceEstimate.mode = "lines";
    traceEstimate.name = "$" + medianLabel + "$";
    traceEstimate.line = {};
    traceEstimate.line.color = medianColorRGBA;
    traceEstimate.visible = settings.visibility.comparison.median == false ? "legendonly" : true;
    traceEstimate.showlegend = true;
    traceEstimate.legendrank = 1;
    traceEstimate.xaxis = "x2";
    traceEstimate.yaxis = "y2";
    traceEstimate.hovertemplate = "(%{x}, %{y})<extra></extra>"

    var traceDataComparison = {};
    traceDataComparison.x = calibrateComparisondDataX;
    traceDataComparison.y = comparisonData.y;
    traceDataComparison.mode = "lines";
    traceDataComparison.name = "$" + dataLegend  + "$";
    traceDataComparison.line = {};
    traceDataComparison.line.color = dataComparisonColorRGBA;
    traceDataComparison.visible = settings.visibility.comparison.data == false ? "legendonly" : true;
    traceDataComparison.showlegend = true;
    traceDataComparison.hovertemplate = "(%{x}, %{y})<extra></extra>"

    var traceEstimateComparison = {};
    traceEstimateComparison.x = calibratedComparisonEstimateX;
    traceEstimateComparison.y = comparisonEstimate.median;
    traceEstimateComparison.mode = "lines";
    traceEstimateComparison.name = "$" + medianLabel + "$";
    traceEstimateComparison.line = {};
    traceEstimateComparison.line.color = medianComparisonColorRGBA;
    traceEstimateComparison.visible = settings.visibility.comparison.median == false ? "legendonly" : true;
    traceEstimateComparison.showlegend = true;
    traceEstimateComparison.xaxis = "x2";
    traceEstimateComparison.yaxis = "y2";
    traceEstimateComparison.hovertemplate = "(%{x}, %{y})<extra></extra>"

    const quantiles = [ 50, 75, 90, 95];

    var traces = [];
    traces.push( traceData, traceEstimate);

    for( var ii = 0; ii < quantiles.length; ii++ ){

        var [ traceLowerBound, traceUpperBound] = uncertaintyTraces( estimate.x,
                                                                    estimate.lowerBound,
                                                                    estimate.upperBound,
                                                                    quantiles[ii],
                                                                    legends,
                                                                    settings.visibility.comparison,
                                                                    areaColorRGBA,
                                                                "");

        traces.push( traceLowerBound, traceUpperBound)
    }

    traces.push( traceDataComparison, traceEstimateComparison)

    for( var ii = 0; ii < quantiles.length; ii++ ){

        var [ traceLowerBound, traceUpperBound] = uncertaintyTraces( comparisonEstimate.x,
                                                                    comparisonEstimate.lowerBound,
                                                                    comparisonEstimate.upperBound,
                                                                    quantiles[ii],
                                                                    legends,
                                                                    settings.visibility.comparison,
                                                                    areaComparisonColorRGBA,
                                                                    "2");

        traces.push( traceLowerBound, traceUpperBound)
    }

    var tracesAll = structuredClone( traces )

    for( const ii in tracesAll ){
        tracesAll[ii].xaxis = "x";
    };

    var layout = {};

    layout.autosize = true;
    layout.xaxis = {};
    layout.xaxis.tickfont = {};
    layout.xaxis.title = {};
    layout.xaxis.title.font = {};

    layout.xaxis.tickfont.size = tickFontSize;
    layout.xaxis.title.text = "$$\\Large " + xLabel + "$$";
    layout.xaxis.title.font.size = labelFontSize
    layout.xaxis.autorange = horizontalReverse;

    layout.legend = {};
    layout.legend.font = {};
    layout.legend.font.size = legendFontSize;
    layout.legend.itemwidth = 20;
    layout.legend.orientation = "v"

    layout.margin = {};
    layout.margin.t = 30;
    layout.margin.l = 10 + 2 * labelFontSize;
    layout.margin.r = 100;

    var layoutVertical = structuredClone( layout );
    layoutVertical.grid = {};
    layoutVertical.grid.rows = 2;
    layoutVertical.grid.columns = 1;
    layoutVertical.grid.pattern = "independent";

    layoutVertical.xaxis2 = {};
    layoutVertical.xaxis2.title = {};
    layoutVertical.xaxis2.title.font = {};
    layoutVertical.xaxis2.tickfont = {};
    layoutVertical.xaxis2.tickfont.size = tickFontSize;
    layoutVertical.xaxis2.title.text = "$$\\Large " + xLabel + "$$";
    layoutVertical.xaxis2.title.font.size = labelFontSize
    layoutVertical.xaxis2.autorange = horizontalReverse;

    layoutVertical.yaxis = {};
    layoutVertical.yaxis2 = {};
    layoutVertical.yaxis2.rangemode = "tozero";
    layoutVertical.yaxis.tickfont = {};
    layoutVertical.yaxis2.tickfont = {};
    layoutVertical.yaxis.tickfont.size = tickFontSize;
    layoutVertical.yaxis2.tickfont.size = tickFontSize;

    var layoutHorizontal = structuredClone( layout );
    layoutHorizontal.grid = {};
    layoutHorizontal.grid.rows = 1;
    layoutHorizontal.grid.columns = 2;
    layoutHorizontal.grid.pattern = "independent";
    
    layoutHorizontal.xaxis2 = {};
    layoutHorizontal.xaxis2.title = {};
    layoutHorizontal.xaxis2.title.font = {};
    layoutHorizontal.xaxis2.tickfont = {};
    layoutHorizontal.xaxis2.tickfont.size = tickFontSize;
    layoutHorizontal.xaxis2.title.text = "$$\\Large " + xLabel + "$$";
    layoutHorizontal.xaxis2.title.font.size = labelFontSize
    layoutHorizontal.xaxis2.autorange = horizontalReverse;

    layoutHorizontal.yaxis = {};
    layoutHorizontal.yaxis2 = {};
    layoutHorizontal.rangemode = "tozero";
    layoutHorizontal.yaxis.tickfont = {};
    layoutHorizontal.yaxis2.tickfont = {};
    layoutHorizontal.yaxis.tickfont.size = tickFontSize;
    layoutHorizontal.yaxis2.tickfont.size = tickFontSize;

    layout.margin.r = 10 + 2 * labelFontSize;
    layout.yaxis = {};
    layout.yaxis.tickfont = {};
    layout.yaxis.tickfont.size = tickFontSize;

    layout.yaxis2 = {};
    layout.rangemode = "tozero";
    layout.yaxis2.overlaying = "y";
    layout.yaxis2.side = "right";
    layout.yaxis2.tickfont = {};
    layout.yaxis2.tickfont.size = tickFontSize;

    var config = {};
    config.responsive = true;
    config.displaylogo = false;

    if( settings.layout.layout === "vertical" )   Plotly.newPlot( graphContainer, traces, layoutVertical, config)
    if( settings.layout.layout === "horizontal" ) Plotly.newPlot( graphContainer, traces, layoutHorizontal, config)
    if( settings.layout.layout === "single" )     Plotly.newPlot( graphContainer, tracesAll, layout, config)
};


var showMarker = async function( marker, graphContainer, settings){
    
    var updatedShape = {}
    updatedShape.type = "line";
    updatedShape.x0 = marker.x;
    updatedShape.x1 = marker.x;

    updatedShape.y0 = 0;
    updatedShape.y1 = 10;

    updatedShape.xref = "x";
    updatedShape.yref = "y";

    updatedShape.line = {};
    updatedShape.line.color = "black";
    updatedShape.line.dash = "dash";

    var updatedShapeSecondAxis = structuredClone( updatedShape );
    updatedShapeSecondAxis.xref = "x2";
    updatedShapeSecondAxis.yref = "y2";

    const updatedShapes = [ updatedShape, updatedShapeSecondAxis]

    if( settings.layout.layout !== "single" ){
        Plotly.relayout( graphContainer, { shapes: updatedShapes });
    } else {
        Plotly.relayout( graphContainer, { shapes: updatedShape })
    };
}

var deleteMarker = async function( graphContainer ){
    try{
        Plotly.relayout( graphContainer, { shapes: []})
    } finally {
        return
    }
}


var updateHorizontalAxis = async function( data, calibration, graphContainer){

    const traces = graphContainer.data;

    for( var ii = 0; ii < 10; ii++ ){
        traces[ii].x = data.x.map( x => x + calibration.x);
    }

    await Plotly.redraw( graphContainer );
}


function hexToRgba(hex, alpha = 1) {
    // Remove '#' if present
    hex = hex.replace(/^#/, '');
  
    // If hex is a 3-digit shorthand, expand it to 6 digits
    if (hex.length === 3) {
      hex = hex.split('').map((char) => char + char).join('');
    }
  
    // Parse the hex to get RGB components
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
  
    // Return RGBA string
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

export default {
    initialize,
    comparison,
    showMarker,
    updateHorizontalAxis,
    deleteMarker
}