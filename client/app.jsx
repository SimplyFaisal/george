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
                      <a className="navbar-brand" href="#">George</a>
                    </div>

                    <div className="collapse navbar-collapse">
                      <ul className="nav navbar-nav"></ul>
                      <ul className="nav navbar-nav navbar-right"></ul>
                   </div>
                </div>
            </nav>
        )
    }
}

class AppFrame extends React.Component {
  render() {
    return (
            <div>
                <GeorgeNavbar/>
                <div className="content">
                  {this.props.children}
                </div>
            </div>
    )
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
    return <h1>Explore Page</h1>
  }
}


ReactDOM.render(
    <Router  history={hashHistory}>
        <Route path="/" component={AppFrame}>
          <IndexRoute component={TrendingPage} />
          <Route path="explore" component={ExplorePage} />
        </Route>
    </Router>
    , document.getElementById('app-frame'));