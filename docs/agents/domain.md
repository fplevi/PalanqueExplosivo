# Domain Docs

## Before exploring

Read root `GLOSSARY.md` and ADRs in `docs/adr/` that concern the area being explored.

If these files do not exist, proceed silently. The `/domain-modeling` skill creates them when terms or decisions are resolved.

## Layout

This project uses a single-context layout:

- `GLOSSARY.md`: shared domain terms at the project root.
- `docs/adr/NNNN-<decision-slug>.md`: architectural decision records.

## Vocabulary

Use terms as defined in `GLOSSARY.md` in issue titles, proposals, hypotheses, and test names. If a needed concept is missing, note the gap for `/domain-modeling`.

## ADR conflicts

When a proposal contradicts an existing ADR, name the ADR and explain why the decision should be reconsidered before replacing it.
