# Ticket format

```markdown
## <Behaviour in one line>

**Parent:** <spec or feature ticket>
**Type:** bug | feature | refactor | research | ops | docs

### Current behaviour
### Desired behaviour

### Acceptance
- [ ] A check a stranger can run or observe.

### Out of scope

### Technical Dependencies
- **Seat:** junior | mid | senior
- **Risk:** normal | high
- **Touches:** <paths or globs this ticket may change>
- **Must not touch:** <paths or modules that are off limits>
- **Seam to test:** <public boundary, and the check to run there>
- **Blocked by:** <ticket links, or none>
- **Base:** default branch | <branch of the blocking ticket>
```

## Why each line exists

| Line | What goes wrong without it |
|---|---|
| Seat | The ticket goes to a model that is too weak or too expensive for it |
| Risk | A risky change gets a routine review |
| Touches | Two builders edit the same file and one branch is thrown away |
| Must not touch | A builder "tidies" a module that someone else depends on |
| Seam to test | Tests are written against internals and break on the next refactor |
| Blocked by | A ticket is built before the thing it needs exists |
| Base | A stacked ticket is cut from the wrong branch and cannot be merged |

`Touches` is the mechanism that makes parallel work safe. The dispatcher
compares the `Touches` of a new ticket with every ticket in flight. Any overlap
means the new ticket waits.
