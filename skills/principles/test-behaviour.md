# Test behaviour

A test checks what the code does at a public boundary, not how it does it.
The two-edit test: an edit that breaks the behaviour must make the test fail,
and an edit that keeps the behaviour but rearranges the inside must leave it
passing. A test that fails the second edit is testing the implementation.

**Applies when:** writing the failing check for a ticket, naming a ticket's
`Seam to test`, or reviewing whether a change is covered.
