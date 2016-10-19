import reddit


def main():
    adapters = [reddit.RedditAdapter()]
    for adapter in adapters:
        adapter.run()

if __name__ == '__main__':
    main()
