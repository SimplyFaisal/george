import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import axios from 'axios';
import {Enum} from 'enumify';
import Select from 'react-select';

import {store} from '../store.jsx';
import Dropdown from '../components/Dropdown.jsx';
import {ChartData, LineDataset, TimeSeriesChart} from '../charts.jsx';
import {communities} from '../stubs/communities.jsx';

class DateRange extends Enum {}

DateRange.initEnum({
  PAST_DAY: {displayName: "Past Day"},
  PAST_4_HOURS: {displayName: "Past 4 Hours"},
  PAST_7_DAYS: {displayName: 'Past 7 Days'},
  PAST_30_DAYS: {displayName: 'Past 30 Days'},
  PAST_90_DAYS: {displayName: 'Past 90 Days'},
  CUSTOM_TIME_RANGE: {displayName: "Custom Time Range"}
});


class CommunityMultiSelectDropDown extends React.Component {
  state = {
    value: [],
    options: []
  }

  componentDidMount = () => {
    let self = this;
    store.subscribe(() => {
      let storeState = store.getState();
      self.setState({
        options: storeState.communities.map(this.communityToOption),
      });
    });
  }

  communityToOption = (i) => {
    return {
      value: i.community.identifier,
      label: i.community.displayName,
      community: i.community
    };
  }


  render = () => {
    return (
      <Select
          multi
          name="community-multi-select"
          value={this.state.value}
          options={this.state.options}
          onChange={this.onChange}
          placeholder="Select your communities..."
      />
    )
  }

  onChange = (value) => {
    this.setState({value});
    this.props.onChange(value.map(v => v.community));
  }
}


class DateRangeDropDown extends React.Component {
  state = {
      value: "",
  }

  render = () => {
    let dateRangeOptions = this.props.dateRangeList.map((range) => {
      return {value: range.name, label: range.displayName, range};
    });

    return (
      <Select
          multi={false}
          name="date-range-select"
          value={this.state.value}
          options={dateRangeOptions}
          onChange={this.onChange}
          placeholder="Select a date range"
      />
    )
  }

  onChange = (value) => {
    this.setState({value});
    this.props.onChange(value.range);
  }
}


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
            <DateRangeDropDown
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

  constructor(props) {
    super(props);
  }

  render = () => {
    let chartData = new ChartData()
        .setType('line')
        .addDataset(this.toLineDataset(this.props.data.activity));
    return (
      <div className="panel panel-primary">
          <div className="panel-heading">
            <h3 className="panel-title">{this.props.community.displayName}</h3>
          </div>
          <div className="panel-body">
            <TimeSeriesChart
              id={this.props.community.identifier}
              chartData={chartData}/>
          </div>
    </div>
    )
  }

  toLineDataset = (data) => {
    let transformed = data.map((d) => {
      return {
        x: d.key,
        y: d.doc_count
      };
    });
    let lineDataset = new LineDataset(this.props.community.displayName);
    lineDataset.addAllData(transformed);
    return lineDataset;
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
          data={i.data}/>
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
          <div className="col-md-8 col-md-offset-2">
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
        interval = 'hour';
        break;
      case DateRange.PAST_4_HOURS:
        start = moment().subtract(4, 'hours');
        interval = 'hour';
        break;
      case DateRange.PAST_7_DAYS:
        start = moment().subtract(7, 'days');
        interval = 'day'
        break;
      case DateRange.PAST_30_DAYS:
        start = moment().subtract(30, 'days');
        interval = 'day';
        break;
      case DateRange.PAST_90_DAYS:
        start = moment().subtract(90, 'days');
        interval = 'month';
        break;
      case DateRange.CUSTOM_TIME_RANGE:
        break;
      default:
        break;
    }
    let requests = filters.communities.map((community) => {
      let config = {
        params: {
          community_id: community.identifier,
          start: start.utc().format(),
          end: end.utc().format(),
          interval
        }
      };
      return axios.get('http://localhost:8000/snapshot', config);
    });
    axios.all(requests)
      .then((responses) => {
        let data = responses.map((response, i) => {
          return {
            community: filters.communities[i],
            data: response.data
          }
        });
        this.setState({data});
      });
  }
}
