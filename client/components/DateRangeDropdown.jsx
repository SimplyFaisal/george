import React from 'react';
import ReactDOM from 'react-dom';

import Select from 'react-select';


export default class DateRangeDropdown extends React.Component {
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
