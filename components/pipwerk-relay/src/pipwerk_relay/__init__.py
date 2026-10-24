"""pipwerk relay: forwards messages between components and between relays.

The relay reads its inboxes, checks every envelope, stores the message in its queue, and passes it
on to a connected component, a relay of its address book or the standard relay. Technical
documentation: ``docs/technical/pipwerk-relay.md``.
"""
