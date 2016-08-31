import logging
import praw
import random
import string
import threading

import database
from datetime import datetime, timedelta
from Queue import Queue

logging.basicConfig(level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logging.getLogger('requests').setLevel(logging.CRITICAL)
logger = logging.getLogger(__name__)


SUBREDDITS = [
        {'name': 'McGill University', 'subreddit': 'mcgill'},
        {'name': 'Georgia Tech', 'subreddit': 'gatech'},
        {'name': 'UT Austin', 'subreddit': 'UTAustin'},
        {'name': 'Penn State University', 'subreddit': 'PennStateUniversity'},
        {'name': 'Purdue', 'subreddit': 'purdue'},
        {'name': 'UC Berkeley', 'subreddit': 'berkeley'},
        {'name': 'CalPoly Ubispo', 'subreddit': 'CalPoly'},
        {'name': 'UC Santa Barbara', 'subreddit': 'ucsantabarbara'},
        {'name': 'North Carolina State University', 'subreddit': 'ncsu'},
        {'name': 'York University', 'subreddit': 'yorku'},
        {'name': 'Texas A&M', 'subreddit': 'aggies'},
        {'name': 'Arizona State University', 'subreddit': 'asu'},
        {'name': 'University of Central Florida', 'subreddit': 'ucf'},
        {'name': 'University of British Columbia', 'subreddit': 'UBC'},
        {'name': 'University of Maryland', 'subreddit': 'UMD'},
        {'name': 'Rochester Institute of Technology', 'subreddit': 'rit'},
        {'name': 'Ohio State University', 'subreddit': 'OSU'},
        {'name': 'UC San Diego', 'subreddit': 'ucsd'},
        {'name': 'University of Missouri', 'subreddit': 'mizzou'},
        {'name': 'University of Georgia', 'subreddit': 'UGA'}
  ]

class RedditApiClient(object):
    """ Wrapper around praw """

    CLOUD_QUERY = 'timestamp:{end}..{start}'
    CLOUD_SEARCH = 'cloudsearch'

    def __init__(self):
        user_agent = ''.join(random.choice(string.ascii_letters)
            for i in range(5))
        self.reddit = praw.Reddit(user_agent=user_agent)
        return

    def get_posts(self, subreddit, start, end, sort='new'):
        """
        Gets posts between the start and end time for a given subreddit.

        Args:
            subreddit (str) : subreddit to crawl
            start (datetime.datetime) : start time
            end (datetime.datetime) : end time

        Returns:
            A list of praw.post objects
        """
        start_seconds = self.to_seconds(start)
        end_seconds = self.to_seconds(end)
        # Format the string to create a cloud query that restricts the returned
        # posts to those between the start and end date.
        query = self.CLOUD_QUERY.format(start=start_seconds, end=end_seconds)
        posts = self.reddit.search(
            query,
            subreddit=subreddit,
            sort=sort,
            limit=None,
            syntax=self.CLOUD_SEARCH)
        return posts

    @staticmethod
    def get_comments(post):
        """
        Retrieve the comments of a post

        Args:
            post (praw.post) : the post to get the comments for

        Returns:
            a list of praw.comment objects
        """
        try:
            post.replace_more_comments(limit=None, threshold=0)
            return praw.helpers.flatten_tree(post.comments)
        except AssertionError as e:
            return []

    def to_seconds(self, dt):
        """
        Convert a datetime object to seconds.

        Args:
            dt (datetime.datetime):

        Returns:
            an int of the datetime seconds
        """
        return int((dt - datetime(1970, 1, 1)).total_seconds())


class RedditWorker(threading.Thread):
    """ self contained thread object """

    def __init__(self, reddit_client, database_client, q,
            interval=timedelta(days=14)):
        """
        Args:
            reddit_client (praw.reddit) : praw.reddit object used for
                communicating with reddit api
            database_client: custom class that has a save method
            q (<Queue>) : queue containing college infos
            interval (timedelta): amount to shift the window every time a query
                is created, defaults to two weeks
        """
        threading.Thread.__init__(self)
        self.reddit_client = reddit_client
        self.database_client = database_client
        self.q = q
        self.interval = interval
        return

    def run(self):
        """
        Crawl the college retrieved from the queue.
        """
        while True:
            subreddit_info = self.q.get()
            logging.info('Started {}'.format(subreddit_info['name']))
            start_date = datetime.now()
            end_date = self.database_client.last_post_date(subreddit_info)
            if end_date:
                # Pad by a few hours to make sure we pick up any new comments
                # for relatively new posts.
                end_date -= timedelta(hours=12)
            else:
                # The college is not in the database so just get the last weeks
                # worth of data.
                end_date = start_date - timedelta(hours=12)
            self.crawl(subreddit_info, start_date, end_date)
            logger.info('Finished {} from {} to {}'.format(
                subreddit_info['name'], start_date, end_date))
            self.q.task_done()

    def crawl(self, subreddit_info, start, end):
        """
        Retrieve all the activity on a subreddit between the start and end dates.

        Args:
            subreddit_info (dict): a dictionary with 'subreddit' and 'name' keys
            start (datetime.datetime):
            end (datetime.datetime):
        """
        subreddit = subreddit_info['subreddit']
        upper = start
        lower = upper - self.interval
        while upper > end:
            if lower < end:
                lower = end
            posts = self.reddit_client.get_posts(subreddit, upper, lower)
            self.database_client.save(
                posts,
                subreddit_info,
                RedditApiClient.get_comments)
            upper = lower
            lower -= self.interval


class RedditCrawler(object):

    def __init__(self, subreddits):
        """
        Input:
            colleges:
        """
        self.subreddits = subreddits

    def start(self):
        """
        Activate the threads
        """
        q = Queue()
        for i, _ in enumerate(self.subreddits):
            logger.info('Spawned #{}'.format(i))
            client = ElasticSearchClient()
            worker = RedditWorker(
                RedditApiClient(), client,  q)
            worker.daemon = True
            worker.start()
        for subreddit in self.subreddits:
            logger.info('Queueing {}'.format(subreddit['name']))
            q.put(subreddit)
            # Lets the main thread exit even if the workers are blocking.

        # Forces the main thread to wait for the queue to finish processing
        # all the tasks.
        q.join()


class ElasticSearchClient(object):

    def __init__(self):
        return

    def save(self, posts, subreddit_info, get_comments):
        total = 0
        for post in posts:
            message = database.Message(
                text=post.selftext,
                date=datetime.utcfromtimestamp(post.created_utc),
                community=subreddit_info['name'])
            comments = get_comments(post)
            for comment in comments:
                comment_message = database.Message(
                    text=comment.body,
                    date=datetime.utcfromtimestamp(comment.created_utc),
                    community=subreddit_info['name'])
                print comment
                comment_message.save()
                total += 1
            message.save()
            total += 1
        logger.info('{}: saved {} messages'.format(
            subreddit_info['name'], total))

    def last_post_date(self, subreddit_info):
        """
        Returns the date of the last post crawled for the request subreddit

        Args:
            subreddit_info (dict): { 'name': name of the college,
                'subreddit': name of the subreddit}

        Returns: A datetime object
        """
        return None


def insert_communities():
    for subreddit in SUBREDDITS:
        print subreddit
        message = database.Community(
            identifier=subreddit['subreddit'],
            displayName=subreddit['name'])
        message.save()


def crawl_reddit():
    crawler = RedditCrawler(SUBREDDITS)
    crawler.start()
    
if __name__ == '__main__':
    crawl_reddit()
