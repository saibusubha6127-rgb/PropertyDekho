# Security Spec

## Data Invariants
1. Users can only edit their own user profile, except for the `role` field.
2. Only admins can create, update, or delete properties.
3. Anyone can read available properties.
4. Anyone can send a message.
5. Users can only manage their own favorites subcollection.

## Dirt Dozen Payloads
(To be written if actual test framework is used, here establishing logical boundaries)
1. Write to another user's profile.
2. Edit role directly.
3. Add property as non-admin.
4. Add massive string ID.
5. Update property status but skip other fields inappropriately.
6. Create message missing required fields.
7. Change creator of a favorite document.

## Test Runner
Defined in firestore.rules.test.ts
