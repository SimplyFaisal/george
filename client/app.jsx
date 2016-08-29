import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link, IndexRoute, hashHistory } from 'react-router';

import {store} from './store.jsx';
import {updateNavBarContent} from './actions.jsx';
import SearchBox from './components/SearchBox.jsx';
import DashboardPage from './dashboard/dashboard.jsx';


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

class AppFrame extends React.Component {
  state = {
    leftContent: null,
    centerContent: <SearchBox handleSubmit={(event) => {
      // if the key pressed is not the enter key then exit.
      if (event.charCode !=  13) {
        return;
      }
      event.preventDefault();
      this.props.history.push('/explore');
    }}/>,
    rightContent: null
  }

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    store.subscribe(() => {
      let storeState = store.getState();
      this.setState({
        leftContent: storeState.navBarContent.leftContent,
        centerContent: storeState.navBarContent.centerContent,
        rightContent: storeState.navBarContent.rightContent,
      });
    });
  }

  render = () => {
    return (
            <div>
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
                     {this.state.leftContent}
                   </ul>
                   {this.state.centerContent}
                   <ul className="nav navbar-nav navbar-right">
                     {this.state.rightContent}
                   </ul>
                 </div>
               </div>
           </nav>
            <div className="content container-fluid">
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


ReactDOM.render(
    <Router  history={hashHistory}>
        <Route path="/" component={AppFrame}>
          <IndexRoute component={DashboardPage} />
          <Route path="explore" component={ExplorePage} />
          <Route path="trending" component={TrendingPage} />
        </Route>
    </Router>
    , document.getElementById('app-frame'));
