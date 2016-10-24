import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import moment from 'moment';
import Plottable from 'plottable';
import * as d3 from "d3";
import * as d3Tip from 'd3-tip';



import {store} from '../store.jsx';
import {DateRange, API, PORTS} from '../utils.jsx';
import CommunityMultiSelectDropDown from '../components/CommunityMultiSelectDropDown.jsx';
import DateRangeDropdown from '../components/DateRangeDropdown.jsx';
import {updateNavBarContent, getCommunities} from '../actions.jsx';

class ExploreSearchComponent extends React.Component {
  state = {
    hasError: false,
    terms: [],
    communities: [],
    dateRange: null
  }

  render = () => {
    let ranges = [DateRange.PAST_DAY, DateRange.PAST_4_HOURS, DateRange.PAST_7_DAYS];
    let inputs = this.state.terms.map((x) => {
      return (
        <div key={x.id} className="col-md-3">
          <ExploreInputComponent
            id={x.id}
            value={x.value}
            handleDelete={this.handleDelete}
            handleChange={this.handleInputChange}/>
        </div>
      );
    });
    return (
      <div>
        {(() => {
            if (this.state.hasError) {
              return (<div className="alert alert-danger">
                <button type="button" className="close">&times;</button>
                Please enter a at least 1 search term and community, and a date range.
                </div>
              )
            }
          }
        )()}
          <div className="panel panel-primary">
            <div className="panel-body">
              <div className="col-md-12">
                <div className="row">
                    <div className="col-md-2">
                        <button type="button" className="btn btn-primary btn-xs">
                            <span
                                className="glyphicon glyphicon-plus"
                                aria-hidden="true"
                                onClick={this.addInputComponent}>
                            </span>
                        </button>
                    </div>
                </div>
                <div className="row">
                    {inputs}
                </div>
              </div>
            </div>
            <div className="panel-footer">
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
        </div>
      )
  }

  handleDateRangeChange = (dateRange) => {
    this.setState({dateRange});
  }

  handleCommunitiesChange = (communities) => {
    this.setState({communities});
  }

  handleSubmit = (event) => {
    event.preventDefault();
    let hasError = this.state.dateRange == null
        || this.state.terms.length == 0
        || this.state.communities.length == 0;
    if (hasError) {
      this.setState({hasError});
      return;
    }
    let communities = this.state.communities.map(x => x.displayName).join(',');
    let searchTerms = this.state.terms.map(x => x.value).join(',');
    let config = {
      params: {
        communities,
        search_terms: searchTerms,
        start: this.state.dateRange.getStart().utc().format(),
        end: moment().utc().format(),
        interval: this.state.dateRange.interval
      }
    };
    axios.get(`${this.getUrl()}/explore`, config)
      .then((response) => {
        this.props.onSubmit(response.data);
      });
  }

  handleDelete = (term) => {
    let terms = this.state.terms.filter((x) => x.id != term.id);
    this.setState({terms});
  }

  handleInputChange = (idx, term) => {
    let terms = this.state.terms;
    terms[idx] = term;
    this.setState({terms});
  }

  addInputComponent = () => {
    let terms = this.state.terms;
    if (terms.length == 4) {
      return;
    }
    terms.push({id: terms.length, value: ''});
    this.setState({terms});
  }

  getUrl = () => {
    let port = PORTS[this.props.source];
    return `${API}:${port}`;
  }
}

class ExploreInputComponent extends React.Component {

  state = {
    id: null,
    value: ''
  }

  componentDidMount = () => {
    this.setState({id: this.props.id, value: this.props.value});
  }

  render = () => {
    return (
        <div className="">
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                id="inputDefault"
                value={this.state.value}
                onChange={this.onChange}/>
              <label className="control-label">Search term</label>
            </div>
            <span
                className="glyphicon glyphicon-remove"
                aria-hidden="true"
                onClick={this.handleDelete}>
            </span>
        </div>
    )
  }

  onChange = (event) => {
    event.preventDefault();
    this.setState({value: event.target.value});
    this.props.handleChange(
      this.props.id, {id: this.state.id, value: event.target.value});
  }

  handleDelete = (event) => {
    event.preventDefault();
    this.props.handleDelete(this.state);
  }


}

class ExploreChartComponent extends React.Component {

  constructor(props) {
    super(props);
    this.xScale = new Plottable.Scales.Time();
    this.yScale = new Plottable.Scales.Linear();
    this.colorScale = new Plottable.Scales.Color();
    this.yAxis = new Plottable.Axes.Numeric(this.yScale, "left");
    this.xAxis = new Plottable.Axes.Time(this.xScale, "bottom");
    this.yLabel =  new Plottable.Components.AxisLabel()
        .xAlignment("left")
        .yAlignment('top')
        .angle(90);
    this.legend = new Plottable.Components.Legend(this.colorScale);

    this.bPxScale = new Plottable.Scales.Category();
    this.bPyScale = new Plottable.Scales.Linear()
    this.barPlot =  new Plottable.Plots.Bar()
        .x(d => d.community, this.bPxScale)
        .y(d => d.average, this.bPyScale)
        .attr('fill', d => d.community, this.colorScale);


    this.sparkline = new Plottable.Plots.Line()
        .x(d => d.date, this.xScale)
        .y(d => d.doc_count, this.yScale)
        .attr("stroke", function(d) { return d.community; }, this.colorScale);

    this.scatter = new Plottable.Plots.Scatter();
    this.scatter.x(d => d.date, this.xScale)
        .y(d => d.doc_count, this.yScale);
  }

  componentDidMount = () => {
    this.setState({
        data: this.props.data,
    });
  }

  componentWillReceiveProps = (nextProps) => {
    this.setState({
        data: nextProps.data,
    });
  }

  componentDidUpdate = (prevProps, prevState) => {
    let datasets = this.state.data.data.map((x) => {
      let points = x.activity.map(p => {
        p.date = new Date(p.key);
        p.community = x.community;
        return p;
      });
      // console.log(this.colorScale.scale(x.community));
      return new Plottable.Dataset(points);
    });
    let communities = this.state.data.data.map(x => x.community);
    this.colorScale.domain(communities);
    let _id = '#' + this.getLinePlotId();

    // this.xScale.domain(d3.extent(data, d => d.date));
    // this.yScale.domain([options.yMin, options.yMax]);
    this.sparkline.datasets(datasets);
    this.scatter.datasets(datasets);
    let averages = this.state.data.data.map((x) => {
      return {community: x.community, average: d3.mean(x.activity, d => d.doc_count)}
    });

    this.barPlot.datasets([new Plottable.Dataset(averages)])
    let xAxisLabel = new Plottable.Components.AxisLabel("Average")
        .yAlignment("center");
    let barChart = new Plottable.Components.Table([
      [null, this.barPlot],
      [null, xAxisLabel]
    ])
    barChart.renderTo('#' + this.getBarPlotId());
    // Initializing tooltip anchor
    var tooltipAnchorSelection = this.barPlot.foreground().append("circle").attr({
      r: 3,
      opacity: 0
    });

    var tooltipAnchor = $(tooltipAnchorSelection.node());
    tooltipAnchor.tooltip({
      animation: false,
      container: 'body',
      placement: "auto",
      title: "text",
      trigger: "manual"
    });
    // Setup Interaction.Pointer
    var pointer = new Plottable.Interactions.Pointer();
    pointer.onPointerMove((p) => {
      var closest = this.barPlot.entityNearest(p);
      if (closest) {
        tooltipAnchorSelection.attr({
          cx: closest.position.x,
          cy: closest.position.y,
          "data-original-title": closest.datum.community + ' ' + closest.datum.average
        });
        tooltipAnchor.tooltip("show");
      }
    });

    pointer.onPointerExit(function() {
      tooltipAnchor.tooltip("hide");
    });

    pointer.attachTo(this.barPlot);


    this.yLabel.text('# messages');
    // let group = new Plottable.Components.Group([this.sparkline)
    let lineChart = new Plottable.Components.Table([,
      [null, null, this.legend],
      [this.yLabel, this.yAxis, this.sparkline],
      [null, null, this.xAxis]
    ]);
    lineChart.renderTo(_id);
  }

  render = () => {
    return (
      <div className="panel panel-primary">
        <div className="panel-heading">
          <h3 className="panel-title">
            Interest in <span className="text-warning">{this.props.data.term}</span> over time</h3>
        </div>
        <div className="panel-body">
          <div className="col-md-2">
            <svg id={this.getBarPlotId()} height="250"> </svg>
          </div>
          <div className="col-md-10">
            <svg id={this.getLinePlotId()} height="250"> </svg>
          </div>
        </div>
    </div>
    )
  }

  getId = () => {
    return this.props.data.term;
  }
  getBarPlotId = () => {
    return 'bar-plot-' + this.getId();
  }
  getLinePlotId = () => {
    return 'line-plot-' + this.getId();
  }
}

export default class ExplorePage extends React.Component {

  state = {
    searchResults: []
  }
  componentDidMount = () => {
    let navBarContent = {
      leftContent: <li><a href="">Explore</a></li>,
      centerContent: null,
      rightContent: this.props.params.source,
    }
    store.dispatch(updateNavBarContent(navBarContent));
  }

  handleSubmit = (data) => {
    this.setState({searchResults: data});
  }

  render = () => {
    let panels = this.state.searchResults.map(x => {
      return <ExploreChartComponent key={x.term} data={x} source={this.props.params.source}/>
    });
    return (
      <div>
        <ExploreSearchComponent onSubmit={this.handleSubmit} source={this.props.params.source}/>
        {panels}
      </div>
    )
  }
}
