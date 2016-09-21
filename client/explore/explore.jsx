import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import moment from 'moment';



import {store} from '../store.jsx';
import {DateRange} from '../utils.jsx';
import CommunityMultiSelectDropDown from '../components/CommunityMultiSelectDropDown.jsx';
import DateRangeDropdown from '../components/DateRangeDropdown.jsx';
import {updateNavBarContent, getCommunities} from '../actions.jsx';

class ExploreSearchComponent extends React.Component {
  state = {
    terms: [],
    communities: [],
    dateRange: null
  }
  constructor(props) {
    super(props);
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
    axios.get('http://localhost:8000/explore', config)
      .then((response) => {
        console.log(response);
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
}

class ExploreInputComponent extends React.Component {

  state = {
    id: null,
    value: ''
  }

  constructor(props) {
    super(props);
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

export default class ExplorePage extends React.Component {

  componentDidMount() {
    let navBarContent = {
      leftContent: <li><a href="">Explore</a></li>,
      centerContent: null,
      rightContent: null,
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
