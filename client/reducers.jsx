import {UPDATE_NAV_BAR_CONTENT, GET_COMMUNITIES} from './actions.jsx';

const initialState = {
  navBarContent: {},
  source: null,
  communities: []
};

export function georgeApplication(state=initialState, action) {
  switch(action.type) {
    case UPDATE_NAV_BAR_CONTENT:
      return Object.assign({}, state, {navBarContent: action.navBarContent});

    case GET_COMMUNITIES:
      return Object.assign({}, state, {communities: action.communities});
    default:
      return state;
  }
}
