import falcon


class GetCommunitiesTask(object):

    @staticmethod
    def execute():
        pass


class GetTrendingTopicsTask(object):

    @staticmethod
    def execute(self, community, date_range):
        pass


class GetCommunityActivityTask(object):

    @staticmethod
    def execute(self, community, data_range):
        pass


class DateRange(object):

    @staticmethod
    def _init__(self, start, end):
        self.start = start
        self.end = end


class DashboardService(object):

    def on_get(self, request, response):
        response.body = 'Hello World'
        communities = GetCommunitiesTask.execute()
        for community in communities:
            activity = GetCommunityActivityTask.execute()
            trending_topics = GetTrendingTopicsTask.execute()

class CommunitySnapshotService(object):

    def on_get(self, request, response):
        response.body = 'CommunitySnapshotService'

api = falcon.API()
api.add_route('/dashboard', DashboardService())
api.add_route('/snapshot', CommunitySnapshotService())
