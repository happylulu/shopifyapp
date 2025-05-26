# v2 Schema Migration Summary

The database schema has been upgraded to version 2.0. Major changes include:

- Introduction of **CustomerLoyaltyProfile**, **RewardDefinition** and
  **TierDefinition** models.
- Detailed relationships with `back_populates` for bidirectional access.
- Helper properties such as `CustomerLoyaltyProfile.current_tier_name` for
  convenient tier lookups.
- FastAPI endpoints for creating and managing loyalty profiles, tiers and
  rewards are now available.

These updates lay the groundwork for advanced loyalty functionality and further
business logic development.
