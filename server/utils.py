from datetime import datetime, timedelta


class DateRange(object):

    def __init__(self, start, end):
        self.start = start
        self.end = end

    @staticmethod
    def from_date_strings(start, end):
        fmt = '%Y-%m-%dT%H:%M:%SZ'
        return DateRange(
            datetime.strptime(start, fmt), datetime.strptime(end, fmt))

    @staticmethod
    def past_day():
        end = datetime.now()
        start = end - timedelta(hours=24)
        return DateRange(start, end)
