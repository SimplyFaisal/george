import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link, IndexRoute, hashHistory } from 'react-router';

class GeorgeNavbar extends React.Component {

    constructor(props) {
        super(props);
    }

    render = () => {
        return (
           <nav className="navbar navbar-default">
              <div className="container-fluid">
                <div className="navbar-header">
                  <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
                    <span className="sr-only">Toggle navigation</span>
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                  </button>
                  <a className="navbar-brand" href="#">George</a>
                </div>

                <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                  <ul className="nav navbar-nav">
                    {this.props.leftContent}
                  </ul>
                  {this.props.centerContent}
                </div>
              </div>
          </nav>
        )
    }
}

class ExploreSearchComponent extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="panel panel-default">
          <div className="panel-body">
            Basic panel
          </div>
      </div>
      )
  }
}

class ExploreInputComponent extends React.Component {
  constructor(props) {
    super(props);
  }

  render = () => {
    return (
      <div>
          <h1>Explore Search Component</h1>
      </div>
    )
  }
}

class CommunitySnapshotComponent extends React.Component {
  constructor(props) {
    super(props);
  }

  render = () => {
    return (
      <div className="panel panel-primary">
          <div className="panel-heading">
            <h3 className="panel-title">Panel primary</h3>
          </div>
          <div className="panel-body">
            Panel content
          </div>
    </div>

    )
  }
}

class SearchBox extends React.Component {
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

class AppFrame extends React.Component {
  render = () => {
    let searchBox = <SearchBox handleSubmit={this.handleSearchBoxSubmit}/>;
    return (
            <div>
                <GeorgeNavbar centerContent={searchBox}/>
                <div className="content container-fluid">
                    {this.props.children}
                </div>
            </div>
    )
  }

  handleSearchBoxSubmit = (event) => {
    // if the key pressed is not the enter key then exit.
    if (event.charCode !=  13) {
      return;
    }
    this.props.history.push('/explore');
  }
}

class HomePage extends React.Component {
  render() {
    let panels = [1,2,3,4].map((x) =>  <CommunitySnapshotComponent key={x} />);
    return (
        <div className="col-md-8 col-md-offset-2">
          {panels}
        </div>)
  }
}

class TrendingPage extends React.Component {
  render() {
    return (
        <div>
            <h1>Trending Page</h1>
        </div>)
  }
}

class ExplorePage extends React.Component {
  render() {
    return (
      <div>
        <ExploreSearchComponent/>
      </div>
    )
  }
}


ReactDOM.render(
    <Router  history={hashHistory}>
        <Route path="/" component={AppFrame}>
          <IndexRoute component={HomePage} />
          <Route path="explore" component={ExplorePage} />
          <Route path="trending" component={TrendingPage} />
        </Route>
    </Router>
    , document.getElementById('app-frame'));
