#!/usr/bin/env python3
import argparse
import json
import sys


plugin = {
    "name": "Unsplash Images",
    "directives": [
        {
            "name": "unsplash-py",
            "doc": "An example directive for showing a nice random image at a custom size.",
            "alias": ["random-pic-py"],
            "arg": {
                "type": "string",
                "doc": "The kinds of images to search for, e.g., `fruit`",
            },
            "options": {
                "size": {
                    "type": "string",
                    "doc": "Size of the image, for example, `500x200`.",
                },
            },
        }
    ],
}


def declare_result(content):
    """Declare result as JSON to stdout

    :param content: content to declare as the result
    """

    # Format result and write to stdout
    json.dump(content, sys.stdout, indent=2)
    # Successfully exit
    raise SystemExit(0)


def run_directive(name, data):
    """Execute a directive with the given name and data

    :param name: name of the directive to run
    :param data: data of the directive to run
    """
    assert name == "unsplash-py"

    query = data["arg"]
    size = data["options"].get("size", "500x200")
    url = f"https://source.unsplash.com/random/{size}/?{query}"
    # Insert an image of a landscape
    img = {
        "type": "image",
        "url": url,
    }
    return [img]


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--role")
    group.add_argument("--directive")
    group.add_argument("--transform")
    args = parser.parse_args()

    if args.directive:
        data = json.load(sys.stdin)
        declare_result(run_directive(args.directive, data))
    elif args.transform:
        raise NotImplementedError
    elif args.role:
        raise NotImplementedError
    else:
        declare_result(plugin)
