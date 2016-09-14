import React from 'react';
import ReactDOM from 'react-dom';

import {store} from '../store.jsx';
import {DateRange} from '../utils.jsx';
import CommunityMultiSelectDropDown from '../components/CommunityMultiSelectDropDown.jsx';
import DateRangeDropdown from '../components/DateRangeDropdown.jsx';
import {updateNavBarContent, getCommunities} from '../actions.jsx';

class ExploreSearchComponent extends React.Component {
  state = {
    terms: []
  }
  constructor(props) {
    super(props);
  }

  render() {
    let ranges = [DateRange.PAST_DAY, DateRange.PAST_4_HOURS, DateRange.PAST_7_DAYS];
    // let inputs = this.props.params.map((param) => {
    //     return (
    //         <div className="col-md-3">
    //             <ExploreInputComponent/>
    //         </div>
    //       )
    //     });
    return (
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
                {/* {inputs} */}
                {/* <div className="col-md-2">
                    <ExploreInputComponent/>
                </div>
                <div className="col-md-2">
                    <ExploreInputComponent/>
                </div>
                <div className="col-md-2">
                    <ExploreInputComponent/>
                </div>
                <div className="col-md-2">
                    <ExploreInputComponent/>
                </div>
                <div className="col-md-2">
                    <ExploreInputComponent/>
                </div> */}
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
      )
  }

  addInputComponent = () => {
    let terms = this.state.terms;
    if (terms.length == 4) {
      return;
    }
    let component = <ExploreInputComponent/>;
    terms.push(component);
    this.setState({terms});
  }
}

class ExploreInputComponent extends React.Component {
  constructor(props) {
    super(props);
  }

  render = () => {
    return (
        <div className="">
            <div className="form-group">
              <input type="text" className="form-control" id="inputDefault"/>
              <label className="control-label" for="inputDefault">Search term</label>
            </div>
            <span
                className="glyphicon glyphicon-option-horizontal"
                aria-hidden="true"></span>
        </div>
    )
  }
}

export default class ExplorePage extends React.Component {

  componentDidMount() {
    let navBarContent = {
      leftContent: <li><a href="">Explore</a></li>
    }
    store.dispatch(updateNavBarContent(navBarContent));
  }

  render() {
    return (
      <div>
        <ExploreSearchComponent/>
      </div>
    )
  }
}
