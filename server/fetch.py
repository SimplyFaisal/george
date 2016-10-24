import argparse

import reddit
import twitter

parser = argparse.ArgumentParser(description='Run one of the adapters')
parser.add_argument('source', default='reddit')
adapters = {
    'reddit': reddit.RedditAdapter,
    'twitter': twitter.TwitterAdapter
}


def main():
    args = parser.parse_args()
    if args.source:
        if args.source in adapters:
            adapter = adapters[args.source]()
            adapter.run()
        else:
            print 'Unkown Adapter'
            return


if __name__ == '__main__':
    main()
