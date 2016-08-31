import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import axios from 'axios';

import Dropdown from '../components/Dropdown.jsx';
import {communities} from '../stubs/communities.jsx';

const DATE_RANGE = {
  PAST_90_DAYS: "Past 90 Days",
  PAST_30_DAYS: "Past 30 Days",
  PAST_7_DAYS: "Past 7 Days",
  PAST_DAY: "Past Day",
  PAST_4_HOURS: "Past 4 Hours",
  CUSTOM_TIME_RANGE: "Custom Time Range"
}

class CommunitySnapshotComponent extends React.Component {
  constructor(props) {
    super(props);
  }

  render = () => {
    // TODO(simplyfaisal): figure out a cleaner way to do this.
    let options = [
        DATE_RANGE.PAST_DAY, DATE_RANGE.PAST_4_HOURS,
        DATE_RANGE.PAST_7_DAYS, DATE_RANGE.PAST_30_DAYS,
        DATE_RANGE.PAST_90_DAYS, DATE_RANGE.CUSTOM_TIME_RANGE].map((x, i) => {
        return {id: i, displayName: x};
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
    switch(item.dateRange) {
      case DATE_RANGE.PAST_DAY:
        start = moment.subtract(1, 'days');
        break;
      case DATE_RANGE.PAST_4_HOURS:
        start = moment.subtract(1, 'hours');
        break;
      case DATE_RANGE.PAST_7_DAYS:
        start = moment.subtract(7, 'days');
        break;
      case DATE_RANGE.PAST_30_DAYS:
        start = moment.subtract(30, 'days');
        break;
      case DATE_RANGE.PAST_90_DAYS:
        start = moment.subtract(90, 'days');
        break;
      case DATE_RANGE.CUSTOM_TIME_RANGE:
        break;
      default:
        break;
    }
    let config = {
      params: {
        start: start.utc.format(),
        end: end.utc.format()
      }
    };
    axios.get('/', config)
      .then((response) => {

      })
      .catch((error) => {

      });
  }
}

export default class DashboardPage extends React.Component {
  render() {
    let panels = communities.map((x, i) =>  <CommunitySnapshotComponent key={i} community={x} />);
    return (
        <div className="col-md-8 col-md-offset-2">
          {panels}
        </div>)
  }
}
