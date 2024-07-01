#!/usr/bin/env python3
import argparse
import json
import sys


plugin = {
    "name": "Strong to emphasis",
    "transforms": [
        {
            "name": "transform-typography",
            "doc": "An example transform that rewrites bold text as text with emphasis.",
            "stage": "document"
            }
    ],
}

def find_all_by_type(node: dict, type_: str):
    """Simple node visitor that matches a particular node type

    :param parent: starting node
    :param type_: type of the node to search for
    """
    if node["type"] == type_:
        yield node


    if "children" not in node:
        return
    for next_node in node["children"]:      
        yield from find_all_by_type(next_node, type_)


def declare_result(content):
    """Declare result as JSON to stdout

    :param content: content to declare as the result
    """

    # Format result and write to stdout
    json.dump(content, sys.stdout, indent=2)
    # Successfully exit
    raise SystemExit(0)


def run_transform(name, data):
    """Execute a transform with the given name and data

    :param name: name of the transform to run
    :param data: AST of the document upon which the transform is being run
    """
    assert name == "transform-typography"
    for strong_node in find_all_by_type(data, "strong"):
        child_text_nodes = find_all_by_type(strong_node, "text")
        child_text = "".join([node['value'] for node in child_text_nodes])

        # Only transform nodes whose text reads "special bold text (python)"
        if child_text == "special bold text (python)":
            strong_node["type"] = "emphasis"
    
    return data


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--role")
    group.add_argument("--directive")
    group.add_argument("--transform")
    args = parser.parse_args()

    if args.directive:
        raise NotImplementedError
    elif args.transform:
        data = json.load(sys.stdin)
        declare_result(run_transform(args.transform, data))
    elif args.role:
        raise NotImplementedError
    else:
        declare_result(plugin)

