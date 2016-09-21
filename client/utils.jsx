import {Enum} from 'enumify';
import moment from 'moment';


class DateRange extends Enum {}

DateRange.initEnum({
  PAST_DAY: {
    displayName: "Past Day",
    interval: 'hour',
    getStart: () => {return moment().subtract(1, 'days')},
  },
  PAST_4_HOURS: {
    displayName: "Past 4 Hours",
    interval: 'hour',
    getStart: () => {return moment().subtract(4, 'hours')}
  },
  PAST_7_DAYS: {
    displayName: 'Past 7 Days',
    interval: 'day',
    getStart: () => {return moment().subtract(7, 'days')}
  },
  PAST_30_DAYS: {
    displayName: 'Past 30 Days',
    interval: 'day',
    getStart: () => {return moment().subtract(30, 'days')}
  },
  PAST_90_DAYS: {
    displayName: 'Past 90 Days',
    interval: 'day',
    getStart: () => {return moment().subtract(90, 'days')}
  },
  CUSTOM_TIME_RANGE: {
    displayName: "Custom Time Range",
    interval: 'day',
    getStart: () => {}
  }
});
export {DateRange};
