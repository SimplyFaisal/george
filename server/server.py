import json
from bson import json_util
from datetime import datetime

import falcon
import falcon_cors
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search, A
from networkx.readwrite import json_graph

import database
import reddit
import analysis
from utils import DateRange

import logging
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

cors = falcon_cors.CORS(allow_origins_list=['http://localhost:8080'])
client = Elasticsearch()


class GetCommunitiesTask(object):

    @staticmethod
    def execute():
        s = Search()
        s.aggs.bucket('communities', 'terms', field='community')
        communities = [hit['key']
            for hit in s.execute().aggregations.communities.buckets]
        # hack to get rid of the r returned by the query
        return [{'identifier': c, 'displayName': c} for c in communities if c != 'r']



class GetTrendingTopicsTask(object):

    @staticmethod
    def execute(community_id, date_range):
        date_filter = {'gte': date_range.start, 'lte': date_range.end}
        response = reddit.RedditMessage.search() \
            .filter('range', date=date_filter) \
            .filter('match', community=community_id) \
            .execute()
        messages = [message.text for message in response]
        g = analysis.TextacyKeywordExtractor().get_keyword_graph(messages)
        return g


class GetCommunityActivityTask(object):

    @staticmethod
    def execute(community_id, date_range, interval):
        print community_id, date_range, interval
        date_filter = {'gte': date_range.start, 'lte': date_range.end}
        s = reddit.RedditMessage.search().filter('range', date=date_filter)\
            .filter('match', community=community_id)
        s.aggs \
            .bucket(
                'activity',
                'date_histogram',
                field='date',
                min_doc_count=0,
                interval=interval) \
            .metric('score', 'avg', field='score') \
            .metric('positive', 'avg', field='positive') \
            .metric('negative', 'avg', field='negative') \
            .metric('neutral', 'avg', field='neutral')

        response = s.execute()
        return response.aggregations.activity.buckets

class GetSearchQueryActivityTask(object):

    @staticmethod
    def execute(community_ids, date_range, interval, search_terms):
        date_filter = {'gte': date_range.start, 'lte': date_range.end}
        results = []
        for term in search_terms:
            responses = []
            for _id in community_ids:
                s = Search() \
                    .query('match', text=term) \
                    .filter('range', date=date_filter) \
                    .filter('match', community=_id)
                s.aggs.bucket(
                    'activity',
                    'date_histogram',
                    field='date',
                    interval=interval)
                response = s.execute()
                responses.append({
                    'community': _id,
                    'activity': map(lambda r: r.to_dict(),
                        response.aggregations.activity.buckets)
                    })
            results.append({'term': term, 'data': responses})
        return results
#
# class CommunitiesService(object):
#
#     def on_get(self, request, response):
#         communities = GetCommunitiesTask.execute()
#         response.body = json.dumps(
#             [{'community': community.to_dict()} for community in communities])

class CommunitiesService(object):

    def on_get(self, request, response):
        communities = GetCommunitiesTask.execute()
        response.body = json.dumps([{'community': c} for c in communities])



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

class TrendingTopicService(object):

    def on_get(self, request, response):
        date_range = DateRange.from_date_strings(
            request.get_param('start'),
            request.get_param('end')
        )
        trending_topics_response = GetTrendingTopicsTask.execute(
            request.get_param('community_id'), date_range)
        response.body = json.dumps(json_graph.node_link_data(trending_topics_response))

class ExploreService(object):

    def on_get(self, request, response):
        date_range = DateRange.from_date_strings(
            request.get_param('start'),
            request.get_param('end'))
        communities = request.get_param_as_list('communities')
        search_terms = request.get_param_as_list('search_terms')
        interval = request.get_param('interval')

        explore_response = GetSearchQueryActivityTask.execute(
            communities, date_range, interval, search_terms)
        response.body = json.dumps(explore_response, default=json_util.default)
        return

class GlanceService(object):

    def on_get(self, request, response):
        communities = GetCommunitiesTask.execute()
        date_range = DateRange.past_day()
        date_filter = {'gte': date_range.start, 'lte': date_range.end}
        body = {'communities': [], 'topics': []}
        topics = set()
        keyword_extractor = analysis.TextacyKeywordExtractor()
        for community in communities:
            r = reddit.RedditMessage.search() \
                .filter('range', date=date_filter) \
                .filter('match', community=community) \
                .execute()
            messages = [message.text for message in r]
            payload = {}
            payload['id'] = community
            payload['doc_count'] = len(messages)
            terms = keyword_extractor.key_terms_from_semantic_network(messages)
            payload['topics'] = [{'id': term, 'score': score} for term, score in terms]
            for term, scores in terms:
                topics.add(term)
            body['communities'].append(payload)
        body['topics'] = list(topics)
        response.body = json.dumps(body)

api = falcon.API(middleware=[cors.middleware])
api.add_route('/communities', CommunitiesService())
api.add_route('/snapshot', CommunitySnapshotService())
api.add_route('/topics', TrendingTopicService())
api.add_route('/explore', ExploreService())
api.add_route('/glance', GlanceService())
