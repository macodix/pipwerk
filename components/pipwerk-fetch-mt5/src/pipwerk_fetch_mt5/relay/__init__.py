"""The commands of ``pipwerk-fetch-mt5`` that take part in pipwerk relay.

``serve`` runs on the machine of MetaTrader 5 and answers requests that arrive through the
relay of that machine; ``request`` asks for files from another machine and writes what it
receives. Both use the library ``pipwerk_relaycore`` for the connection to the relay.

Nothing in this package is loaded by the call on the command line (``pipwerk-fetch-mt5
--from ... --to ...``): ``cli.main`` imports ``relay.commands`` only when the first argument is
``serve`` or ``request``. A test sees to it (``tests/test_relay_isolation.py``).

Modules:

``contents``
    The contents of the kinds of messages ``fetch.request``, ``fetch.file`` and ``fetch.result``
    (specification relay 6.2).
``schemas``
    The JSON schemas of these contents under ``contracts/messages/v1/``, generated from the
    models.
``connection``
    From the section ``[relay]`` of the startup configuration to the connector of the library.
``serve``
    The component that answers requests.
``request``
    The component that asks and receives.
``commands``
    The command line of both.
"""
