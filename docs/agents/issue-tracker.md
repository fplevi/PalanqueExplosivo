# Issue tracker: Local Markdown

Issues and specs live as Markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`.
- Spec: `.scratch/<feature-slug>/spec.md`.
- Implementation issues: one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`.
- Triage state: a `Status:` line near the top of each issue file; use the role strings in `triage-labels.md`.
- Comments and conversation history: append under `## Comments` at the bottom of the issue file.

## Publishing and fetching

When a skill says to publish to the issue tracker, create a file under `.scratch/<feature-slug>/`, creating the directory as needed.

When a skill says to fetch a ticket, read the referenced file. Resolve ticket numbers within the specified feature directory.

## Wayfinding operations

Used by `/wayfinder`:

- Map: `.scratch/<effort>/map.md`, with Notes, Decisions-so-far, and Fog sections.
- Child ticket: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with its question in the body.
- Type: a `Type:` line containing `research`, `prototype`, `grilling`, or `task`.
- Status: open tickets use `Status: open`; claim with `Status: claimed`; finish with `Status: resolved`.
- Blocking: a `Blocked by: NN, NN` line lists dependencies. A ticket is unblocked when every dependency is resolved.
- Frontier: scan open, unblocked, unclaimed tickets; choose the lowest number first.
- Claim: save `Status: claimed` before beginning work.
- Resolve: append the answer under `## Answer`, save `Status: resolved`, then append a summary and link to Decisions-so-far in the map.
