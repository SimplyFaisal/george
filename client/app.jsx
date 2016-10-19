import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link, IndexRoute, hashHistory } from 'react-router';
import axios from 'axios';

import {store} from './store.jsx';
import {updateNavBarContent, getCommunities} from './actions.jsx';
import SearchBox from './components/SearchBox.jsx';
import DashboardPage from './dashboard/dashboard.jsx';
import ExplorePage from './explore/explore.jsx';
import GlancePage from './glance.jsx';

class AppFrame extends React.Component {
  state = {
    leftContent: null,
    centerContent: <SearchBox handleSubmit={(event) => {
      // if the key pressed is not the enter key then exit.
      if (event.charCode !=  13) {
        return;
      }
      event.preventDefault();
      this.props.history.push({
          pathname: '/explore',
          query: {q: event.target.value}
      });
    }}/>,
    rightContent: null
  }

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    store.dispatch(updateNavBarContent({
      leftContent: this.state.leftContent,
      centerContent: this.state.centerContent,
      rightContent: this.state.rightContent
    }));
    store.subscribe(() => {
      let storeState = store.getState();
      this.setState({
        leftContent: storeState.navBarContent.leftContent,
        centerContent: storeState.navBarContent.centerContent,
        rightContent: storeState.navBarContent.rightContent,
      });
    });

    axios.get('http://localhost:8000/communities')
      .then((response) => {
        store.dispatch(getCommunities(response.data));
      });
  }

  render = () => {
    return (
            <div>
            <nav className="navbar navbar-primary">
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

ReactDOM.render(
    <Router  history={hashHistory}>
        <Route path="/" component={AppFrame}>
          <IndexRoute component={DashboardPage} />
          {/* <Route path="dashboard" component={DashboardPage} /> */}
          <Route path="explore" component={ExplorePage} />
          <Route path="trending" component={TrendingPage} />
        </Route>
    </Router>
    , document.getElementById('app-frame'));
