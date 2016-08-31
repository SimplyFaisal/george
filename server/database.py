from elasticsearch_dsl import Index, DocType, String, Date
from elasticsearch_dsl.connections import connections

# Define a default Elasticsearch client
connections.create_connection(hosts=['localhost'])

GeorgeIndex = Index('george')


@GeorgeIndex.doc_type
class Community(DocType):
    identifier = String()
    displayName = String()

    class Meta:
        index = 'george'

    def save(self, **kwargs):
        return super(Community, self).save(**kwargs)


@GeorgeIndex.doc_type
class Message(DocType):
    text = String(analyzer='snowball', fields={'raw': String(index='not_analyzed')})
    community = String()
    date = Date()

    class Meta:
        index = 'george'

    def save(self, **kwargs):
        return super(Message, self).save(**kwargs)
