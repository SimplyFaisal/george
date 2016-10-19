import datetime
import server
import database
import textacy
import matplotlib.pyplot as plt
import networkx as nx

import gensim
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import NMF
from utils import DateRange


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

    def get_keyword_graph(self, documents, n_keyterms=10):
        doc = textacy.doc.Doc(unicode(' '.join(documents)))
        rank_output = textacy.keyterms.textrank(doc, n_keyterms=n_keyterms)
        G = self._create_graph(doc, n_keyterms=n_keyterms)
        keyterm_set = set(x[0] for x in rank_output)
        for term, weight in rank_output:
            G.node[term]['weight'] = weight
        non_keywords = [x for x in G.nodes() if x not in keyterm_set]
        G.remove_nodes_from(non_keywords)
        return G

    def _create_graph(self, doc, n_keyterms=10, window_width=2, edge_weighting='binary'):
        good_word_list = [textacy.spacy_utils.normalized_str(word)
        for word in doc
            if not word.is_stop and not word.is_punct and word.pos_ in {'NOUN', 'ADJ'}]
        graph = textacy.network.terms_to_semantic_network(
            good_word_list,
            window_width=window_width,
            edge_weighting=edge_weighting)
        return graph

    def key_terms_from_semantic_network(
            self,
            documents,
            join_key_words=True,
            n_keyterms=15):
        doc = textacy.doc.Doc(unicode(' '.join(documents)))
        terms = textacy.keyterms.key_terms_from_semantic_network(
            doc, join_key_words=join_key_words, n_keyterms=n_keyterms)
        return terms


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
