# Use the design system

**PASS** when every new tooltip, modal, toast and button is imported from
`src/ui/`.

**FAIL** when a component defines its own, or styles a raw `<button>` to look
like one.

Fails:
- `src/features/billing/PlanCard.tsx` declaring a local `Tooltip` component.
- A `<div role="dialog">` built by hand outside `src/ui/`.

Does not apply to: files under `src/ui/` itself, tests, and Storybook stories.
