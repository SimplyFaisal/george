import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import axios from 'axios';
import {Enum} from 'enumify';

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

class CommunitySnapshotComponent extends React.Component {
  state = {activity: new ChartData(), trending: []}
  constructor(props) {
    super(props);
  }

  componentDidMount = () => {
    let end = moment();
    let start = moment().subtract(1, 'days');
    let interval = 'hour';
    let config = {
      params: {
        community_id: this.props.community.displayName,
        start: start.utc().format(),
        end: end.utc().format(),
        interval
      }
    };
    this.loadData(config)
      .then(function(response) {
        let chartData = new ChartData();
        let lineDataset = this.toLineDataset(response.data);
        chartData.addDataset(lineDataset)
            .setType('line');
        this.setState({activity: chartData});
      }.bind(this));
  }

  render = () => {
    // TODO(simplyfaisal): figure out a cleaner way to do this.
    let ranges = [DateRange.PAST_DAY, DateRange.PAST_4_HOURS, DateRange.PAST_7_DAYS];
    let options = ranges.map((dateRange, i) => {
        return {id: i, displayName: dateRange.displayName, dateRange};
      });
    return (
      <div className="panel panel-primary">
          <div className="panel-heading">
            <h3 className="panel-title">{this.props.community.displayName}</h3>
            <Dropdown options={options} handleClick={this.dropDownClickHandler}/>
          </div>
          <div className="panel-body">
            <TimeSeriesChart
              id={this.props.community.identifier}
              chartData={this.state.activity}/>
          </div>
    </div>
    )
  }

  dropDownClickHandler = (item) => {
    let end = moment();
    let start;
    let interval;
    switch(item.dateRange) {
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
    let config = {
      params: {
        community_id: this.props.community.identifier,
        start: start.utc().format(),
        end: end.utc().format(),
        interval
      }
    };
    this.loadData(config)
        .then((response) => {
            let chartData = new ChartData();
            let lineDataset = this.toLineDataset(response.data);
            chartData.addDataset(lineDataset)
                .setType('line');
            this.setState({activity: chartData});
        });
  }

  loadData = (config) => {
    return axios.get('http://localhost:8000/snapshot', config);
  }

  toLineDataset = (data) => {
    let transformed = data.map((d) => {
      return {
        x: d.key,
        y: d.doc_count
      };
    });
    let lineDataset = new LineDataset(this.props.community.identifier);
    lineDataset.addAllData(transformed);
    return lineDataset;
  }
}

export default class DashboardPage extends React.Component {
  state = {communities: []};

  componentDidMount = () => {
    axios.get('http://localhost:8000/communities')
      .then((response) => {
        this.setState({communities: response.data});
      });
  }

  render = () => {
    let panels = this.state.communities.map((communityData, i) =>  {
      return <CommunitySnapshotComponent
        key={i}
        community={communityData.community}
        data={communityData.data} />;
    });
    return (
      <div className="row">
        <div className="col-md-8 col-md-offset-2">
          {panels}
        </div>
      </div>
    )
  }
}
