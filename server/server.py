import json
from bson import json_util
from datetime import datetime

import falcon
import falcon_cors
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search, A


import database

cors = falcon_cors.CORS(allow_origins_list=['http://localhost:8080'])
client = Elasticsearch()


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
        date_filter = {'gte': date_range.start, 'lte': date_range.end}
        s = Search().filter('range', date=date_filter)\
            .filter('match', community=community_id)
        s.aggs.bucket(
            'activity', 'date_histogram', field='date', interval=interval)
        response = s.execute()
        return response.aggregations.activity.buckets


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
        activity_query_response = GetCommunityActivityTask.execute(
            request.get_param('community_id'),
            date_range,
            request.get_param('interval'))
        activities_as_dict = [activity.to_dict()
            for activity in activity_query_response]
        _response = {'activity': activities_as_dict, 'trending': []}
        response.body = json.dumps(_response, default=json_util.default)
api = falcon.API(middleware=[cors.middleware])
api.add_route('/communities', CommunitiesService())
api.add_route('/snapshot', CommunitySnapshotService())
