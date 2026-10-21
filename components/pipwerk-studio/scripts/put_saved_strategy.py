"""Puts a saved strategy into the object directory of the test environment.

Called by ``testenv start`` with the Python of the backend:

    python -I put_saved_strategy.py <file> <object directory>

The file is copied unchanged (the format of the file stays as it is; the backend reads a file of the
format 1.0 by converting it and writes the format 2.0 only when the user saves) under the file name
of the object directory: ``<identifier>.strategy.json`` with the identifier of the document in
canonical lower case. Nothing is put if the directory already holds a file for this identifier,
whatever its kind. A missing directory is created (only for the user).

The program prints ``put`` or ``present`` and ends with exit code 0; any problem (the file is no JSON
document with an identifier) ends with a message on the error output and exit code 1.
"""

import json
import os
import sys
import uuid


def put_saved_strategy(source: str, directory: str) -> str:
    """Copy the file into the directory; ``put`` or ``present``."""
    with open(source, "rb") as handle:
        content = handle.read()
    document = json.loads(content)
    identifier = str(uuid.UUID(document["id"]))
    os.makedirs(directory, mode=0o700, exist_ok=True)
    if any(name.startswith(identifier + ".") for name in os.listdir(directory)):
        return "present"
    path = os.path.join(directory, identifier + ".strategy.json")
    with open(path, "xb") as handle:
        handle.write(content)
    os.chmod(path, 0o600)
    return "put"


def main(arguments: list[str]) -> int:
    if len(arguments) != 2:
        print("usage: put_saved_strategy.py <file> <object directory>", file=sys.stderr)
        return 2
    try:
        print(put_saved_strategy(arguments[0], arguments[1]))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(f"the saved strategy could not be put: {type(error).__name__}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
