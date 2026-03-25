# In-Country Editor Sync — Feb 10, 2026
## Remaining Action Items & Notes

Items 1, 4, 5, and 6 from this meeting have Trello cards in **new feature requests**.
Item 2 (Admin Bulk Time Entry) already has an ongoing Trello card.

---

### OSM Stats Integration & Validation
- Time tracking is functional, but **OSM stats still need testing**
- Keeley will test with her team using simple edits around Brighton
- Need to validate Mikro output against Chrono Cards data for accuracy
- This is a prerequisite for the April Chrono Cards transition

### Production Readiness Cleanup
- Remove **purge buttons** and other dev-only UI before outside users access the system
- Switch to a **proper tenant** (away from dev/test environment)
- General polish pass for external-facing views

---

## Timeline & Milestones

| Date | Milestone |
|------|-----------|
| **Thu Feb 12** | Keeley delivers dashboard design specs |
| **Fri Feb 13** | Review meeting with Keeley on the design |
| **March 10** | Gusto check-in on dashboard progress |
| **April** | Target to transition team off Chrono Cards |

## Dependencies on Keeley

- List of all Chrono Cards reports/data points (community reports, project stats, team stats)
- Dashboard design with charts/graphs spec
- Testing with her team on OSM stats
- Possible Chrono Cards login shared with Goose for replication reference
- Kibana review for filtering functions to port over

## Related Trello Cards

- [Admin Dashboard with Custom Reporting & Charts](https://trello.com/c/R8VzBlf7)
- [User Profile & Stats Dashboard](https://trello.com/c/r27imxMi)
- [Region-Based Filtering](https://trello.com/c/9HijjD7L)
- [Team Management & Team Reports](https://trello.com/c/WHylTnMJ)
