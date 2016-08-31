import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import axios from 'axios';
import {Enum} from 'enumify';

import Dropdown from '../components/Dropdown.jsx';
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
  constructor(props) {
    super(props);
  }

  render = () => {
    // TODO(simplyfaisal): figure out a cleaner way to do this.
    let options = DateRange.enumValues.map((dateRange, i) => {
        return {id: i, displayName: dateRange.displayName, dateRange};
      });
    return (
      <div className="panel panel-primary">
          <div className="panel-heading">
            <h3 className="panel-title">{this.props.community.displayName}</h3>
            <Dropdown options={options} handleClick={this.dropDownClickHandler}/>
          </div>
          <div className="panel-body">
            Panel content
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
        interval = 'day';
        break;
      case DateRange.PAST_4_HOURS:
        start = moment().subtract(1, 'hours');
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
        interval = 'week'
        break;
      case DateRange.CUSTOM_TIME_RANGE:
        break;
      default:
        break;
    }
    let config = {
      params: {
        community_id: this.props.community.displayName,
        start: start.format(),
        end: end.format(),
        interval
      }
    };
    axios.get('http://localhost:8000/snapshot', config)
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {

      });
  }
}

export default class DashboardPage extends React.Component {
  state = {data: []};

  componentDidMount = () => {
    axios.get('http://localhost:8000/dashboard')
      .then((response) => {
        this.setState({data: response.data});
      })
      .catch((error) => {

      });
  }

  render = () => {
    let panels = this.state.data.map((communityData, i) =>  {
      return <CommunitySnapshotComponent
        key={i}
        community={communityData.community}
        data={communityData.data} />;
    });
    return (
        <div className="col-md-8 col-md-offset-2">
          {panels}
        </div>)
  }
}
