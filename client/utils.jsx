import {Enum} from 'enumify';

class DateRange extends Enum {}

DateRange.initEnum({
  PAST_DAY: {displayName: "Past Day", interval: 'hour'},
  PAST_4_HOURS: {displayName: "Past 4 Hours", interval: 'hour'},
  PAST_7_DAYS: {displayName: 'Past 7 Days', interval: 'day'},
  PAST_30_DAYS: {displayName: 'Past 30 Days', interval: 'day'},
  PAST_90_DAYS: {displayName: 'Past 90 Days', interval: 'day'},
  CUSTOM_TIME_RANGE: {displayName: "Custom Time Range", interval: 'day'}
});
export {DateRange};
