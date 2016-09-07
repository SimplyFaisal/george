import React from 'react';

import Chart from 'chart.js'

class ChartData {
  constructor() {
    this.data = {datasets: []}
    this.type = '';
    this.labels = [];
    this.xLabels = [];
    this.yLabels = []
    this.options = {
        scales: {
            xAxes: [{
                type: 'time',
                position: 'bottom'
            }]
        }
    }
  }

  addDataset = (dataset) =>{
    this.data.datasets.push(dataset);
    return this;
  }

  addAllDataset = (datasets) => {
    datasets.forEach(this.addDataset, datasets);
    return this;
  }

  setType = (type) => {
    this.type = type;
    return this;
  }
}

class LineDataset {
  constructor(label) {
    this.label = label;
    this.data = [];
  }

  addData = (point) => {
    this.data.push(point);
  }

  addAllData = (points) => {
    points.forEach(this.addData);
  }

  setLabel = (label) => {
    this.label = label;
  }
}

class TimeSeriesChart extends React.Component {
  static defaultProps = {
    chartData: new ChartData()
  }
  constructor(props) {
    super(props);

  }
  componentDidMount = () => {
    this.ctx = document.getElementById(this.getChartId());
    this.chart = new Chart(this.ctx, this.props.chartData);
  }

  componentWillReceiveProps = (nextProps) => {
    let ctx = document.getElementById(this.getChartId());
    let chart = new Chart(ctx, nextProps.chartData);
  }

  render = () => {
    let id = 'time-series-chart-' + this.props.id;
    return (
      <canvas id={this.getChartId()} width="400" height="100"></canvas>
    );
  }

  getChartId = () => {
    return 'time-series-chart-' + this.props.id;
  }
}

export {ChartData, LineDataset, TimeSeriesChart};
