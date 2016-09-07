import React from 'react';
import ReactDOM from 'react-dom';

export default class MultiSelectDropdown extends React.Component {

  state = {selectedOption: null};
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    let selectedOption= this.props.initiallySelected || this.props.options[0];
    this.setState({selectedOption});
  }

  render = () => {
    let listItems = this.props.options.map((item) => {
      let onClick = () => {
        this.setState({selectedOption: item});
        this.props.handleClick(item);
      };
      return (<li key={item.id} onClick={onClick}><a href="#">{item.displayName}</a></li>);
    });
    return (
      <div className="btn-group closed">
        <a href="#" className="btn btn-default">{this.state.selectedOption.displayName}</a>
        <a href="#" className="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-expanded="true"><span className="caret"></span></a>
        <ul className="dropdown-menu">
          {listItems}
        </ul>
    </div>
    )
  }
}
