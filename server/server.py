import json
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
    fields = ['text']

    facets = {
        'activity': DateHistogramFacet(field='date', interval='day')
    }


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
    def execute(community, date_range):
        ts = TimeSeriesSearch() \
            .filter(
                'range',
                date={'gte': date_range.start, 'lte': date_range.end})
        return ts.execute()


class DateRange(object):

    def _init__(self, start=None, end=None):
        self.start = start
        self.end = end

    @staticmethod
    def from_date_strings(start, end):
        fmt = '%Y-%m-%dT%H:%M:%S%z'
        return DateRange(
            start=datetime.strptime(start, fmt),
            end=datetime.strptime(start, fmt))


class DashboardService(object):

    def on_get(self, request, response):
        communities = GetCommunitiesTask.execute()
        date_range = DateRange.from_date_strings(
            request.get_param('start'),
            request.get_param('end'))
        for community in communities:
            activity = GetCommunityActivityTask.execute(community, date_range)
            print activity
        response.body = json.dumps(
            [{'community': community.to_json()} for community in communities])


class CommunitySnapshotService(object):

    def on_get(self, request, response):
        response.body = 'CommunitySnapshotService'

api = falcon.API(middleware=[cors.middleware])
api.add_route('/dashboard', DashboardService())
api.add_route('/snapshot', CommunitySnapshotService())
