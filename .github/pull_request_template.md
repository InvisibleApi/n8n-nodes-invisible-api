## Summary

<!-- What changes, and why. If it fixes an issue, link it: Fixes #123 -->

## Behaviour

<!-- What a user of the node sees differently. Write "none" for an internal
     change. Call out anything that breaks an existing workflow. -->

## Test plan

<!-- How you know this works. Name the tests you added, and say what you ran in
     a local n8n if the change is visible in the UI. -->

- [ ] `npm test`
- [ ] `npm run lint` and `npx prettier --check .`
- [ ] `npm run typecheck` and `npm run build`
- [ ] Ran the affected operation in a local n8n (`npm run dev`)

## Checklist

- [ ] `CHANGELOG.md` has a new top section for this work, not an entry appended
      to the section above
- [ ] No version bump and no tag in this PR
- [ ] New behaviour in `helpers/` or `transport/` is covered by a test
- [ ] No credential values, API keys or real account IDs in the diff
