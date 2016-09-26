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
      trendingData: [],
      chartType: ChartType.ACTIVITY,
      enableDragbox: false

    }
  constructor(props) {
    super(props);
    this.xScale = new Plottable.Scales.Time();
    this.yScale = new Plottable.Scales.Linear();
    this.yAxis = new Plottable.Axes.Numeric(this.yScale, "left");
    this.xAxis = new Plottable.Axes.Time(this.xScale, "bottom");

    this.sparkline = new Plottable.Plots.Line()
        .x(d => d.date, this.xScale)
        .y(d => d.doc_count, this.yScale);

    let self = this;

    this.dragbox = new Plottable.Components.XDragBoxLayer();
    this.dragbox.enabled(false);
    let onDragEnd = (bounds) => {
      let start = moment(this.xScale.invert(bounds.topLeft.x));
      let end = moment(this.xScale.invert(bounds.bottomRight.x));
      let config = {
        params: {
          community_id: self.props.community.displayName,
          start: start.utc().format(),
          end: end.utc().format(),
        }
      };
      axios.get('http://localhost:8000/topics', config)
      .then((response) => {
        console.log(response);
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
    let data = this.state.activityData.data.map((d) => {
      d.date = new Date(d.key);
      return d;
    });
    let options = this.state.activityData.options;
    let _id = '#' + this.getId();

    this.xScale.domain(d3.extent(data, d => d.date));
    this.yScale.domain([options.yMin, options.yMax]);

    this.sparkline.datasets([new Plottable.Dataset(data)]);

    let yLabel = new Plottable.Components.AxisLabel("# messages")
      .xAlignment("left")
      .yAlignment('top')
      .angle(90);

    let group = new Plottable.Components.Group([this.dragbox, this.sparkline])
    let chart = new Plottable.Components.Table([
      [yLabel, this.yAxis, group],
      [null, null, this.xAxis]
    ]);
    chart.renderTo(_id);
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
                      <svg id={this.getId()} height="150"> </svg>
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
          <div className="col-md-12">
            {panels}
          </div>
        </div>
      </div>
    )
  }

  handleDashboardFilterSubmit = (filters) => {
    let end = moment();
    let start;
    let interval;
    switch(filters.dateRange) {
      case DateRange.PAST_DAY:
        start = moment().subtract(1, 'days');
        break;
      case DateRange.PAST_4_HOURS:
        start = moment().subtract(4, 'hours');
        break;
      case DateRange.PAST_7_DAYS:
        start = moment().subtract(7, 'days');
        break;
      case DateRange.PAST_30_DAYS:
        start = moment().subtract(30, 'days');
        break;
      case DateRange.PAST_90_DAYS:
        start = moment().subtract(90, 'days');
        break;
      case DateRange.CUSTOM_TIME_RANGE:
        break;
      default:
        break;
    }
    let requests = filters.communities.map((community) => {
      let config = {
        params: {
          community_id: community.displayName,
          start: start.utc().format(),
          end: end.utc().format(),
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
              data: response.data.activity,
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
