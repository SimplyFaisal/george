import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link, IndexRoute, hashHistory } from 'react-router';
import axios from 'axios';

import {store} from './store.jsx';
import {updateNavBarContent, getCommunities, updateSource} from './actions.jsx';
import SearchBox from './components/SearchBox.jsx';
import DashboardPage from './dashboard/dashboard.jsx';
import ExplorePage from './explore/explore.jsx';
import GlancePage from './glance.jsx';
import {API, PORTS} from './utils.jsx'

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
    rightContent: null,
  }

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    store.dispatch(updateNavBarContent({
      leftContent: this.state.leftContent,
      centerContent: this.state.centerContent,
      rightContent: this.props.params.source
    }));
    store.dispatch(updateSource(this.props.params.source));
    store.subscribe(() => {
      let storeState = store.getState();
      this.setState({
        leftContent: storeState.navBarContent.leftContent,
        centerContent: storeState.navBarContent.centerContent,
        rightContent: storeState.navBarContent.rightContent,
      });
    });
    axios.get(`${this.getUrl()}/communities`)
      .then((response) => {
        store.dispatch(getCommunities(response.data));
      });
  }

  getUrl = () => {
    let port = PORTS[this.props.params.source];
    return `${API}:${port}`;
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
                   <Link to={`source/${this.props.params.source}`} className="navbar-brand">George</Link>
                 </div>

                 <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                   <ul className="nav navbar-nav">
                     <li><Link to={`source/${this.props.params.source}/explore`}>Explore</Link></li>
                   </ul>
                   {/* {this.state.centerContent} */}
                   <ul className="nav navbar-nav navbar-right">
                    <li><a href="#">{this.state.rightContent}</a></li>

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


class HomePage extends React.Component{

  constructor(props) {
    super(props);
  }

  render = () => {
    return (
      <div className="container-fluid">
        <div className="col-md-8 col-md-offset-2">
          <div className="page-header ">
            <h1 className="text-center">George <small>social media data vis</small></h1>
          </div>
          <div className="jumbotron">
            <p>George is an information visualization dashboard for community oriented social media applications</p>
          </div>
          <div className="row">
            <div className="list-group">
                <Link to="/source/reddit" className="list-group-item">
                  <h4 className="list-group-item-heading">Reddit</h4>
                  <p className="list-group-item-text">Subreddits for each presidential candidate</p>
                </Link>
                <Link to="/source/twitter" className="list-group-item">
                  <h4 className="list-group-item-heading">Twitter</h4>
                  <p className="list-group-item-text">Twitter accounts for major news organizations</p>
                </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

// ReactDOM.render(
//     <Router  history={hashHistory}>
//         <Route path="/" component={AppFrame}>
//           <IndexRoute component={DashboardPage} />
//           {/* <Route path="dashboard" component={DashboardPage} /> */}
//           <Route path="explore" component={ExplorePage} />
//           <Route path="trending" component={TrendingPage} />
//         </Route>
//     </Router>
//     , document.getElementById('app-frame'));

ReactDOM.render(
  <Router  history={hashHistory}>
      <Route path="/" component={HomePage}></Route>
      <Route path="/source/:source" component={AppFrame}>
        <IndexRoute component={DashboardPage} />
        {/* <Route path="dashboard" component={DashboardPage} /> */}
        <Route path="explore" component={ExplorePage} />
      </Route>
  </Router>
  , document.getElementById('app-frame'));
