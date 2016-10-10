import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import axios from 'axios';
import Select from 'react-select';
import * as d3 from "d3";
import * as d3Tip from 'd3-tip';
import Plottable from 'plottable';
import { StickyContainer, Sticky } from 'react-sticky';

import {store} from '../store.jsx';
import CommunityMultiSelectDropDown from '../components/CommunityMultiSelectDropDown.jsx';
import DateRangeDropdown from '../components/DateRangeDropdown.jsx';
import {DateRange, Tooltip, ChartType} from '../utils.jsx';

class DashboardFilterComponent extends React.Component {
  state = {
    communities: [],
    dateRange: null,
  }
  render = () => {
    let ranges = [DateRange.PAST_DAY, DateRange.PAST_4_HOURS, DateRange.PAST_7_DAYS];
    return (
      <div className="panel panel-default">
        <div className="panel-body">
          <div className="col-md-8">
            <CommunityMultiSelectDropDown
              onChange={this.handleCommunitiesChange}
            />
          </div>

          <div className="col-md-2">
            <DateRangeDropdown
              dateRangeList={ranges}
              onChange={this.handleDateRangeChange}
            />
          </div>
          <a className="btn btn-default" onClick={this.handleSubmit}>
            Search
          </a>
        </div>
      </div>
    )
  }

  handleCommunitiesChange = (communities) => {
    this.setState({communities})
  }

  handleDateRangeChange = (dateRange) => {
    this.setState({dateRange})
  }

  handleSubmit = (event) => {
    event.preventDefault();
    let filters = {
      communities: this.state.communities,
      dateRange: this.state.dateRange
    };
    this.props.onSubmit(filters);
  }
}


class CommunitySnapshotComponent extends React.Component {

  state = {
      activityData: [],
      trendingData: null,
      chartType: ChartType.ACTIVITY,
      enableDragbox: false

    }
  constructor(props) {
    super(props);
    this.xScale = new Plottable.Scales.Time();
    this.yScale = new Plottable.Scales.Linear();
    this.colorScale = new Plottable.Scales.InterpolatedColor();
    this.colorScale.range(["#2ecc71", "#f1c40f", '#e74c3c']);
    this.yAxis = new Plottable.Axes.Numeric(this.yScale, "left");
    this.yLabel = new Plottable.Components.AxisLabel()
      .xAlignment("left")
      .yAlignment('top')
      .angle(90);
    this.xAxis = new Plottable.Axes.Time(this.xScale, "bottom");
    this.lineDataset = new Plottable.Dataset();
    this.sparklines = new Plottable.Plots.Line();
    this.stacked = new Plottable.Plots.StackedArea();

    this.sparklines.addDataset(this.lineDataset);

    this.dragbox = new Plottable.Components.XDragBoxLayer();
    this.dragbox.enabled(this.state.enableDragbox);
    let onDragEnd = (bounds) => {
      let start = moment(this.xScale.invert(bounds.topLeft.x));
      let end = moment(this.xScale.invert(bounds.bottomRight.x));
      let config = {
        params: {
          community_id: this.props.community.displayName,
          start: start.utc().format(),
          end: end.utc().format(),
        }
      };
      this.getTrendingTopics(config).then((response) => {
        this.setState({trendingData: response.data});
      });
    };
    this.dragbox.onDragEnd(onDragEnd.bind(this));
  }

  componentDidMount = () => {
    this.setState({
        activityData: this.props.activityData
    });
  }

  componentWillReceiveProps = (nextProps) => {
    this.setState({
        activityData: nextProps.activityData,
    });
  }

  componentDidUpdate = (prevProps, prevState) => {
    let _id = '#' + this.getId();
    let data = this.state.activityData.data;
    // this.xScale.domain(d3.extent(data, d => d.date));
    this.sparklines.x(d => d.date, this.xScale);
    var chart;
    switch (this.state.chartType) {
      case ChartType.ACTIVITY:
          let options = this.state.activityData.options;
          this.yScale.domain([options.yMin, options.yMax]);
          this.sparklines.y(d => d.doc_count, this.yScale);
          this.yAxis.redraw();
          this.lineDataset.data(data);
          // this.sparklines.datasets([new Plottable.Dataset(data)]);
          this.yLabel.text("# messages");
          chart = this.sparklines;
        break;
      case ChartType.VOTES:
        this.yScale.domain(d3.extent(data, x => x.score.value));
        this.sparklines.y(d => d.score.value, this.yScale);
        this.lineDataset.data(data);
        this.yAxis.redraw();
        // this.sparklines.datasets([new Plottable.Dataset(data)]);
        this.yLabel.text("average score")
        chart = this.sparklines;
        break;
      case ChartType.SENTIMENT:
        let positive = new Plottable.Dataset(
            data.map((d) => { return {y: d.positive.value, x: d.date} }))
                .metadata(1);
        let neutral = new Plottable.Dataset(
            data.map((d) => { return {y: d.neutral.value, x: d.date} }))
                .metadata(2);
        let negative = new Plottable.Dataset(
            data.map((d) => { return { y: d.negative.value, x: d.date} }))
                .metadata(3);
        this.yScale.domain([0, 1]);
        this.stacked.x(d => d.x, this.xScale)
            .y(d => d.y, this.yScale)
            .attr('fill', (d, i, dataset) =>  dataset.metadata(), this.colorScale);
        this.stacked.datasets([positive, neutral, negative]);
        chart = this.stacked;
        break;
      default:
        break;
    }

    // this.xScale.domain(d3.extent(data, d => d.date));
    // this.yScale.domain([options.yMin, options.yMax]);

    // this.sparkline.datasets([new Plottable.Dataset(data)]);



    let group = new Plottable.Components.Group([this.dragbox, chart])
    let table = new Plottable.Components.Table([
      [this.yLabel, this.yAxis, group],
      [null, null, this.xAxis]
    ]);
    table.renderTo(_id);
  }

  render = () => {
    let options = ChartType.enumValues.map((x) => {
      return {
        value: x.displayName,
        label: x.displayName,
        chartType: x
      };
    })
    return (
      <div className="col-md-12">
          <div className="panel panel-primary">
              <div className="panel-heading">
                <h3 className="panel-title">{this.props.community.displayName}</h3>
              </div>
              <div className="panel-body">
                  <div className="well well-sm">
                      <div className="checkbox inline">
                        <label>
                          <input type="checkbox" onClick={this.onTrendingTopicsCheckboxClick}/>
                          Display Trending Topics
                        </label>
                      </div>
                      <div className="col-md-2">
                          <Select
                              mult={false}
                              name="chart-type-multi-select"
                              value={this.state.chartType.displayName}
                              options={options}
                              onChange={this.onChartTypeChange}
                          />
                      </div>
                  </div>
                  <div>
                      <svg id={this.getId()} height="200"> </svg>
                  </div>
                  <div style={{display: this.state.enableDragbox ? 'block' : 'none'}}>
                      <KeywordPanel data={this.state.trendingData} id={this.getId()}/>
                  </div>
              </div>
        </div>
      </div>
    )
  }

  onTrendingTopicsCheckboxClick = (event) => {
    this.setState({enableDragbox: event.target.checked});
    this.dragbox.enabled(event.target.checked);
  }

  onChartTypeChange = (item) => {
    this.setState({chartType: item.chartType})
    console.log(this.state);
  }

  getId = () => {
    return this.props.community.identifier;
  }

  getTrendingTopics(config) {
    return axios.get('http://localhost:8000/topics', config);
  }
}

class KeywordPanel extends React.Component {
  render = () => {
    return (
        <div className="well well-sm">
            <svg
              id={'arc-diagram-' + this.props.id}
              height="200">
            </svg>
        </div>
    )
  }

  componentDidUpdate(prevProps, prevState) {
    let graph = this.props.data;
    if (!graph || graph.nodes.length == 0) {
      return;
    }
    let _id = 'arc-diagram-' + this.props.id;
    let container = document.getElementById(_id).parentElement;
    let HEIGHT = 150;
    let WIDTH = container.offsetWidth;

    var width  = 600;           // width of svg image
    var height = 200;           // height of svg image
    var margin = 50;            // amount of margin around plot area
    var pad = margin / 2;       // actual padding amount


    let MIN_RADIUS = 5
    let MAX_RADIUS = 30;
    var YFIXED = margin +  MAX_RADIUS;
    graph.links.forEach((d) => {
        d.source = graph.nodes[d.source];
        d.target = graph.nodes[d.target];
    });

    let svg = d3.select('#' +_id)
        .attr('fill', 'red')
        .attr('width', container.offsetWidth);

    // create plot area within svg image
    let plot = svg.append("g")
        .attr("id", "plot")
        .attr("transform", "translate(" + pad + ", " + pad + ")");

    // sort nodes by group
    graph.nodes.sort(function(a, b) {
        return b.weight - a.weight;
    });

    let tip = d3Tip.default()
        .attr('class', 'd3-tip')
        .html(function(d) { return d.id; });

    // used to scale node index to x position
    var xscale = d3.scaleLinear()
        .domain([0, graph.nodes.length - 1])
        .range([MAX_RADIUS + margin, WIDTH - margin - MAX_RADIUS]);

    let xScale = d3.scaleLinear()
        .domain([0, graph.nodes.length - 1])
        .range([MAX_RADIUS + margin, WIDTH - margin - MAX_RADIUS])

    var radiusScale = d3.scaleLinear()
        .domain(d3.extent(graph.nodes, d => d.weight))
        .range([MIN_RADIUS, MAX_RADIUS]);

    var cpyScale = d3.scaleLinear()
        .domain([pad, width])
        .range([YFIXED + 40, height - pad])

    // calculate pixel location for each node
    graph.nodes.forEach(function(d, i) {
        d.x = xScale(i);
        d.y = YFIXED;
    });

    plot.selectAll(".link")
        .data(graph.links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr('stroke', 'black')
        .attr('stroke-width', 2)
        .attr("d", function(d, i) {
            var context = d3.path();
            let distance =  Math.abs(d.source.x - d.target.x);
            let radius = distance / 2;
            let midpointX = (d.source.x + d.target.x) / 2;
            context.moveTo(d.source.x, d.source.y);
            // context.lineTo(d.target.x, d.target.y);
            let cpx = midpointX;
            let cpy = cpyScale(distance);
            // context.arc(midpointX, YFIXED, radius, 0, Math.PI);
            context.quadraticCurveTo(cpx, cpy, d.target.x, d.target.y)
            return context.toString();
        })
        .on('mouseover', function(d, i) {
          d3.select(this)
          .attr('stroke-width', 4);

          d3.selectAll('.node')
              .filter(x => x.id == d.source.id || x.id == d.target.id)
              .attr('r', x => radiusScale(x.weight) * 1.25);
        })
        .on('mouseout', function(d, i) {
          d3.select(this)
              .attr('stroke-width', 2)

          d3.selectAll('.node')
              .filter(x => x.id == d.source.id || x.id == d.target.id)
              .attr('r', x => radiusScale(x.weight));
        });

    plot.call(tip);
    plot.selectAll("circle")
        .data(graph.nodes)
        .enter()
        .append("circle")
        .attr("class", "node")
        .attr('fill', '#2196f3')
        // .attr("id", function(d, i) { return d.name; })
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r",  (d, i)  => radiusScale(d.weight))
        .on('mouseover', function(d) {
          d3.select(this)
              .transition()
              .attr('r', radiusScale(d.weight) * 1.25);
          tip.show(d)
        })
        .on('mouseout', function(d) {
          d3.select(this)
              .transition()
              .attr('r', radiusScale(d.weight));
          tip.hide(d);
        });

    plot.selectAll('text')
        .data(graph.nodes)
        .enter()
        .append('text')
        .attr('x', d => d.x - radiusScale(d.weight))
        .attr('y', d => d.y - (1.5 * radiusScale(d.weight)) - 10)
        .text(d => d.id);
  }
}

export default class DashboardPage extends React.Component {
  state = {
    data: []
  }

  render = () => {
    let panels = this.state.data.map((i) => {
      return (
        <CommunitySnapshotComponent
          key={i.community.identifier}
          community={i.community}
          activityData={i.activityData}
          trendingData={i.trendingData}/>
      )
    });
    return (
      <div>
        <div className="row">
          <div className="col-md-12">
            <DashboardFilterComponent
              onSubmit={this.handleDashboardFilterSubmit}
            />
          </div>
        </div>
        <div className="row">
          {/* <div className="col-md-12"> */}
            {panels}
          {/* </div> */}
        </div>
      </div>
    )
  }

  handleDashboardFilterSubmit = (filters) => {
    let requests = filters.communities.map((community) => {
      let config = {
        params: {
          community_id: community.displayName,
          start: filters.dateRange.getStart().utc().format(),
          end: moment().utc().format(),
          interval: filters.dateRange.interval
        }
      };
      return axios.get('http://localhost:8000/snapshot', config);
    });
    axios.all(requests)
      .then((responses) => {
        function getExtreme(dataList, fn) {
          return fn(d3.merge(dataList), (d) => {return d.doc_count});
        }

        let activities = responses.map((i) => {return i.data.activity});
        let yMin = getExtreme(activities, d3.min);
        let yMax = getExtreme(activities, d3.max);

        let data = responses.map((response, i) => {
          return {
            community: filters.communities[i],
            activityData: {
              data: response.data.activity.map((x) => {
                x.date = new Date(x.key);
                return x;
              }),
              options: {yMin, yMax}
            },
            trendingData: {
              data: response.data.trending
            }
          }
        });
        this.setState({data});
      });
  }
}
