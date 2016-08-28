import React from 'react';
import ReactDOM from 'react-dom';

export default class SearchBox extends React.Component {
  constructor(props) {
    super(props);
  }

  render = () => {
    return (
       <form className="navbar-form navbar-left" role="search">
            <div className="form-group">
                <div className="input-group input-group-lg">
                  <span className="input-group-addon glyphicon glyphicon-search"
                        id="sizing-addon1">

                  </span>
                  <input type="text"
                         className="form-control"
                         placeholder="explore topics"
                         aria-describedby="sizing-addon1"
                         onKeyPress={this.props.handleSubmit}/>
                </div>
            </div>
       </form>
    )
  }
}
