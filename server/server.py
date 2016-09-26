import json
from bson import json_util
from datetime import datetime

import falcon
import falcon_cors
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search, A, MultiSearch

import nltk
import gensim
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import NMF


import database

import logging
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

cors = falcon_cors.CORS(allow_origins_list=['http://localhost:8080'])
client = Elasticsearch()


class GetCommunitiesTask(object):

    @staticmethod
    def execute():
        return database.Community.search().execute()

def lsi(texts):
    print 'starting lsi ------------'
    dictionary = gensim.corpora.Dictionary(texts)
    corpus = [dictionary.doc2bow(text) for text in texts]
    tfidf = gensim.models.TfidfModel(corpus)
    corpus_tfidf = tfidf[corpus]
    lsi = gensim.models.LsiModel(
        corpus_tfidf, id2word=dictionary, num_topics=2)
    lsi.print_topics(2)
    print 'finishing lsi ------------'

def _nmf(texts):
    print 'starting nmf -------------'
    n_features = 1000
    n_top_words = 20
    n_topics = 10
    vectorizer = TfidfVectorizer(
        max_df=0.95,
        min_df=2,
        max_features=n_features,
        stop_words='english')
    tfidf = vectorizer.fit_transform(texts)
    nmf = NMF(n_components=n_topics, random_state=1).fit(tfidf)
    feature_names = vectorizer.get_feature_names()

    for topic_idx, topic in enumerate(nmf.components_):
        print("Topic #%d:" % topic_idx)
        print(" ".join([feature_names[i]
                        for i in topic.argsort()[:-n_top_words - 1:-1]]))
        print()
    print 'finishing nmf -------------'

class KeyWordExtractor(object):


    @staticmethod
    def get_keywords(documents, text_accessor=lambda x: x, threshold=0.2, ngram_range=(1, 2)):
        """
        Args:
            documents list(<T>):
        Returns:
            a set of keywords
        """
        tfidf_vectorizer = TfidfVectorizer(stop_words='english', ngram_range=ngram_range)
        corpus = [text_accessor(doc) for doc in documents]
        matrix = tfidf_vectorizer.fit_transform(corpus)
        features = tfidf_vectorizer.get_feature_names()
        document_terms = []
        for vector in matrix:
            terms = [(features[feature_index], weight)
                    for feature_index, weight in zip(vector.indices, vector.data)
                        if weight > threshold]
            _d = {term: weight for term, weight in terms}
            print _d
            document_terms.append(_d)
        return document_terms


class GetTrendingTopicsTask(object):

    @staticmethod
    def execute(community_id, date_range):
        date_filter = {'gte': date_range.start, 'lte': date_range.end}
        response = database.Message.search() \
            .filter('range', date=date_filter) \
            .filter('match', community=community_id) \
            .execute()
        messages = [message for message in response]
        print len(messages)
        keywords = KeyWordExtractor.get_keywords(
            messages, text_accessor=lambda x: x.text)
        print keywords
        return keywords


class GetCommunityActivityTask(object):

    @staticmethod
    def execute(community_id, date_range, interval):
        date_filter = {'gte': date_range.start, 'lte': date_range.end}
        s = Search().filter('range', date=date_filter)\
            .filter('match', community=community_id)
        s.aggs \
            .bucket(
                'activity',
                'date_histogram',
                field='date',
                interval=interval)
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

class TrendingTopicService(object):

    def on_get(self, request, response):
        date_range = DateRange.from_date_strings(
            request.get_param('start'),
            request.get_param('end')
        )
        trending_topics_response = GetTrendingTopicsTask.execute(
            request.get_param('community_id'), date_range)
        response.body = json.dumps(trending_topics_response)

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

api = falcon.API(middleware=[cors.middleware])
api.add_route('/communities', CommunitiesService())
api.add_route('/snapshot', CommunitySnapshotService())
api.add_route('/topics', TrendingTopicService())
api.add_route('/explore', ExploreService())
