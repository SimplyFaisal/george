import React from 'react';

import Plottable from 'plottable';
import * as d3 from "d3";

class TimeSeriesChart extends React.Component {
  constructor(props) {
    super(props);

  }
  componentWillReceiveProps = (nextProps) => {
    let data = nextProps.data.data.map((d) => {
      d.key = new Date(d.key);
      return d;
    });

    let options = nextProps.data.options;
    let xScale = new Plottable.Scales.Time()
        .domain(d3.extent(data, (d) => {return d.key}));
    let yScale = new Plottable.Scales.Linear()
        .domain([options.yMin, options.yMax]);

    let plot = new Plottable.Plots.Line()
        .addDataset(new Plottable.Dataset(data))
        .x((d) => { return d.key;}, xScale)
        .y((d) => { return d.doc_count; }, yScale);

    let xAxis = new Plottable.Axes.Time(xScale, "bottom")
      .renderTo('#' + this.getChartId());
    let yAxis = new Plottable.Axes.Numeric(yScale, "left");

    let chart = new Plottable.Components.Table([
      [yAxis, plot],
      [null, xAxis]
    ]);

    chart.renderTo('#' + this.getChartId());
    window.addEventListener("resize", function() {
      plot.redraw();
    });
  }

  render = () => {
    return (
      <svg id={this.getChartId()} width="400" height="100"></svg>
    );
  }

  getChartId = () => {
    return 'time-series-chart-' + this.props.id;
  }
}

export {TimeSeriesChart};
