import tweepy
from tweepy import OAuthHandler
from vaderSentiment.vaderSentiment import sentiment as vader
from elasticsearch_dsl import Index
import json
import database

def get_credentials(name='credentials.json'):
    with open(name, 'r') as f:
        credentials = json.loads(f.read())
        return credentials

USERS = [
    {'community': 'Tech',  'id': 'TechCrunch'},
    {'community': 'Tech',  'id': 'engadget'},
    {'community': 'Tech',  'id': 'WIRED'},
    {'community': 'Tech',  'id': 'TheNextWeb'},
    {'community': 'Tech',  'id': 'Gizmodo'},
    {'community': 'Tech',  'id': 'mashable'},
    {'community': 'Tech',  'id': 'techradar'},
    {'community': 'World News',  'id': 'guardian'},
    {'community': 'World News',  'id': 'BBCWorld'},
    {'community': 'World News',  'id': 'AJEnglish'},
    {'community': 'US News', 'id': 'FoxNews'},
    {'community': 'US News', 'id': 'washingtonpost'},
    {'community': 'US News', 'id': 'nytimes'},
    {'community': 'US News', 'id': 'NBCNews'},
    {'community': 'US News', 'id': 'HuffPostPol'},
    {'community': 'US News', 'id': 'ABC'}
]

TwitterIndex = Index('twitter')

@TwitterIndex.doc_type
class TwitterMessage(database.Message):

    class Meta:
        index = 'twitter'


class TwitterElasticSearchClient(object):

    def __init__(self):
        return

    def save(self, post, community):
        post_sentiment = vader(post.text.encode('utf8'))
        message = TwitterMessage(
            _id=post.id_str,
            text=post.text,
            date=post.created_at,
            community=community,
            positive=post_sentiment['pos'],
            negative=post_sentiment['neg'],
            neutral=post_sentiment['neu'],
            score=post.retweet_count,
        )
        message.save()
        return


class TwitterCrawler(object):

    def __init__(self, accounts=USERS, credentials=get_credentials()):
        self.accounts = accounts
        self.access_token = credentials['access_token']
        self.access_token_secret = credentials['access_token_secret']
        self.consumer_key = credentials['consumer_key']
        self.consumer_secret = credentials['consumer_secret']

    def start(self):
        auth = OAuthHandler(self.consumer_key, self.consumer_secret)
        auth.set_access_token(self.access_token, self.access_token_secret)
        api = tweepy.API(auth)
        client = TwitterElasticSearchClient()
        for account in self.accounts:
            _id = account['id']
            community = account['community']
            tweets = api.user_timeline(_id)
            for tweet in tweets:
                client.save(tweet, community)


class TwitterAdapter(database.Adapter):

    def run(self):
        crawler = TwitterCrawler()
        crawler.start()
        return

    def get_message_type(self):
        return TwitterMessage
