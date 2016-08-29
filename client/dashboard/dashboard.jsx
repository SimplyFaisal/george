import React from 'react';
import ReactDOM from 'react-dom';

import Dropdown from '../components/Dropdown.jsx';
import {communities} from '../stubs/communities.jsx';

const PAST_90_DAYS = "Past 90 Days";
const PAST_30_DAYS = "Past 30 Days";
const PAST_7_DAYS = "Past 7 Days";
const PAST_DAY  = "Past Day";
const PAST_4_HOURS = "Past 4 Hours";
const CUSTOM_TIME_RANGE = "Custom Time Range";

class CommunitySnapshotComponent extends React.Component {
  constructor(props) {
    super(props);
  }

  render = () => {
    let options = [PAST_DAY, PAST_4_HOURS, PAST_7_DAYS, PAST_30_DAYS,
      PAST_90_DAYS, CUSTOM_TIME_RANGE].map((x, i) => {
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
    console.log(item);
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
