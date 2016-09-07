
export const UPDATE_NAV_BAR_CONTENT = "UPDATE_NAV_BAR_CONTENT";
export const GET_COMMUNITIES = "GET_COMMUNITIES";

export function updateNavBarContent(navBarContent) {
  return {type: UPDATE_NAV_BAR_CONTENT, navBarContent}
}

export function getCommunities(communities) {
  return {type: GET_COMMUNITIES, communities};
}
