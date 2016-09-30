import datetime
import server
import database
import textacy
import matplotlib.pyplot as plt
import networkx as nx
from networkx.readwrite import json_graph

import gensim
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import NMF


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


class TextacyKeywordExtractor(object):

    def get_keyword_graph(self, documents):
        doc = textacy.doc.Doc(' '.join(messages))
        rank_output = textacy.keyterms.textrank(doc)
        G = self._create_graph(doc)
        keyterm_set = set(x[0] for x in rank_output)
        non_keywords = [x for x in G.nodes() if x not in keyterm_set]
        G.remove_nodes_from(non_keywords)
        return json_graph.node_link_data(G)

    def _create_graph(self, doc,  window_width=2, edge_weighting='binary'):
        good_word_list = [textacy.spacy_utils.normalized_str(word)
        for word in doc
            if not word.is_stop and not word.is_punct and word.pos_ in {'NOUN', 'ADJ'}]
        graph = textacy.network.terms_to_semantic_network(
            good_word_list,
            window_width=window_width,
            edge_weighting=edge_weighting)
        return graph


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

now = datetime.datetime.now()
then = now - datetime.timedelta(days=14)
date_range = server.DateRange(start=then, end=now)
date_filter = {'gte': date_range.start, 'lte': date_range.end}
response = database.Message.search() \
    .filter('range', date=date_filter) \
    .filter('match', community='Georgia Tech') \
    .execute()
messages = [message.text for message in response]
g = TextacyKeywordExtractor().get_keyword_graph(messages)
print g
