## [Jira ticket link](link here)

Short description if any.

Related PRs:
- If any

Author Todo List:

- [ ] Add/adjust tests (if applicable)
- [ ] Build in CI passes
- [ ] Latest master revision is merged into the branch
- [ ] Self-Review
- [ ] Set `Ready For Review` status

Reviewer Todo List:

- The PR and the branch names describe the change
- The PR is branch -> master
- The change addresses the described issue
- The change follows defined [code style](https://liveintent.atlassian.net/wiki/spaces/EB/pages/827064330/Scala+Code+Style)
- The change provides necessary test adjustments
- The public API documentation is updated (for public-facing projects)
- The config variables naming is correct
- There are no Java/Scala specific issues:
  - Future creation can only return failed future, doesn't throw exceptions
  - No resources are left open
  - Try monad is not silencing thrown exceptions

If a reviewer requests major changes he removes `Ready for Review` label until the comments are addressed.
