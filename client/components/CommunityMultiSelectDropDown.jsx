import React from 'react';
import ReactDOM from 'react-dom';
import Select from 'react-select';

import {store} from '../store.jsx';

export default class CommunityMultiSelectDropDown extends React.Component {
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
