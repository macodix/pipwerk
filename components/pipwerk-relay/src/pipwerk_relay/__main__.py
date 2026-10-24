"""``python -m pipwerk_relay`` is the same as the command ``pipwerk-relay``."""

import sys

from pipwerk_relay.cli import main

if __name__ == "__main__":
    sys.exit(main())
