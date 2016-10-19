from elasticsearch_dsl import Index, DocType, String, Date, Integer, Float
from elasticsearch_dsl.connections import connections

# Define a default Elasticsearch client
connections.create_connection(hosts=['localhost'])

GeorgeIndex = Index('george')


class Community(DocType):
    identifier = String()
    displayName = String()

    class Meta:
        index = 'george'

    def save(self, **kwargs):
        return super(Community, self).save(**kwargs)


class Message(DocType):
    text = String()
    community = String(fields={'raw': String(index='not_analyzed')})
    date = Date()
    score = Integer()
    positive = Float()
    negative = Float()
    neutral = Float()

    class Meta:
        index = 'george'

    def save(self, **kwargs):
        return super(Message, self).save(**kwargs)

class Adapter(object):

    def run(self):
        raise NotImplementedError()

    def get_messsage_type(self):
        raise NotImplementedError()
