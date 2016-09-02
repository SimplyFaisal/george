import json
from bson import json_util
from datetime import datetime

import falcon
import falcon_cors
from elasticsearch import Elasticsearch
from elasticsearch_dsl import FacetedSearch, DateHistogramFacet


import database

cors = falcon_cors.CORS(allow_origins_list=['http://localhost:8080'])
client = Elasticsearch()


class TimeSeriesSearch(FacetedSearch):
    doc_types = [database.Message]
    # fields that should be searched
    fields = ['text', 'community']

    facets = {
        'activity': DateHistogramFacet(field='date', interval='day')
    }

    def __init__(self, date_range, interval):
        self.date_range = date_range
        self.interval = interval
        self.facets['activity'] = DateHistogramFacet(
            field='date', interval=interval)
        super(TimeSeriesSearch, self).__init__()

    def search(self):
        # override methods to add custom pieces
        interval_query = {'gte': self.date_range.start,
            'lte': self.date_range.end}
        s = super(TimeSeriesSearch, self).search() \
            .filter('range', date=interval_query)
        return s

class GetCommunitiesTask(object):

    @staticmethod
    def execute():
        return database.Community.search().execute()


class GetTrendingTopicsTask(object):

    @staticmethod
    def execute(community, date_range):
        return


class GetCommunityActivityTask(object):

    @staticmethod
    def execute(community_id, date_range, interval):
        ts = TimeSeriesSearch(date_range, interval).execute()
        return [{'date': point[0], 'count': point[1]}
            for point in ts.facets.activity]


class DateRange(object):

    def __init__(self, start, end):
        self.start = start
        self.end = end

    @staticmethod
    def from_date_strings(start, end):
        fmt = '%Y-%m-%dT%H:%M:%SZ'
        return DateRange(
            datetime.strptime(start, fmt), datetime.strptime(end, fmt))


class CommunitiesService(object):

    def on_get(self, request, response):
        communities = GetCommunitiesTask.execute()
        response.body = json.dumps(
            [{'community': community.to_dict()} for community in communities])


class CommunitySnapshotService(object):

    def on_get(self, request, response):
        date_range = DateRange.from_date_strings(
            request.get_param('start'),
            request.get_param('end'))
        activity = GetCommunityActivityTask.execute(
            request.get_param('community_id'),
            date_range,
            request.get_param('interval'))
        response.body = json.dumps(activity, default=json_util.default)

api = falcon.API(middleware=[cors.middleware])
api.add_route('/communities', CommunitiesService())
api.add_route('/snapshot', CommunitySnapshotService())
