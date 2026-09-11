# ATC Quick Reference Guide

## How Users See Each Other

### 1. Skill-Based Suggestions (Automatic)
```
Your Profile:
- Offer: Web Development
- Want: Graphic Design

Other User's Profile:
- Offer: Graphic Design
- Want: Web Development

Result: ✅ You see them as a suggestion (skill match!)
```

### 2. Manual Search
```
Search for: "Ali" or "ali@example.com"
Result: All users matching the search
```

---

## Complete Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    STEP-BY-STEP FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. DISCOVER USER                                              │
│     ├─ Via skill suggestions (automatic)                       │
│     └─ Via manual search                                       │
│                                                                 │
│  2. VIEW PROFILE                                               │
│     └─ See their skills, rating, reviews                       │
│                                                                 │
│  3. SEND FRIEND REQUEST                                        │
│     ├─ Cost: 100 credits                                       │
│     ├─ Requires: Subscription + 100 credits                    │
│     └─ Result: Request sent (they see it when they log in)     │
│                                                                 │
│  4. ACCEPT FRIEND REQUEST                                      │
│     ├─ Cost: 10 credits (paid by sender)                       │
│     ├─ Requires: 10 credits in sender's account               │
│     └─ Result: Both are now friends                            │
│                                                                 │
│  5. PROPOSE BARTER                                             │
│     ├─ Cost: 10 credits                                        │
│     ├─ Requires: Friend request accepted + 10 credits         │
│     └─ Result: Barter proposal sent                            │
│                                                                 │
│  6. ACCEPT BARTER                                              │
│     ├─ Cost: 10 credits                                        │
│     ├─ Requires: 10 credits                                    │
│     └─ Result: Trade is ACTIVE (can message)                   │
│                                                                 │
│  7. COMPLETE TRADE                                             │
│     ├─ Cost: 0 credits                                         │
│     └─ Result: Trade marked as completed                       │
│                                                                 │
│  8. LEAVE REVIEW                                               │
│     ├─ Cost: 0 credits                                         │
│     └─ Result: Rating updated for other user                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Credit Costs at a Glance

| Step | Action | Cost | Paid By |
|------|--------|------|---------|
| 3 | Send Friend Request | 100 | You |
| 4 | Accept Friend Request | 10 | Sender |
| 5 | Propose Barter | 10 | You |
| 6 | Accept Barter | 10 | You |
| **Total** | **Complete Trade** | **130** | **Both** |

---

## Where to Find Everything

| Feature | Location | What You See |
|---------|----------|--------------|
| Suggestions | Home Screen | Users with matching skills |
| Search Users | "Find Users" Screen | Search results by name/email |
| View Profile | Click on user | Their skills, rating, reviews |
| Active Trades | Home or "Active Trades" Screen | Your ongoing/pending/completed trades |
| Messaging | Active trade card | Chat with the other user |
| Reviews | Completed trade | Leave rating and comment |

---

## Important Rules

### ✅ Can Send Friend Request If:
- You have a subscription (not free trial)
- You have 100+ credits
- No existing request between you

### ✅ Can Propose Barter If:
- Friend request is accepted
- You have 10+ credits
- No existing barter proposal

### ✅ Can Message If:
- Barter is accepted (status: "accepted")

### ✅ Can Leave Review If:
- Trade is completed (status: "completed")

---

## Barter Status Meanings

| Status | Meaning | Can Message? | Can Review? |
|--------|---------|--------------|-------------|
| proposed | Waiting for acceptance | ❌ No | ❌ No |
| accepted | Active trade in progress | ✅ Yes | ❌ No |
| completed | Trade finished | ✅ Yes | ✅ Yes |

---

## Why You See Someone

### Reason 1: Skill Match (Automatic)
```
They offer what you want
AND
You offer what they want
```

### Reason 2: Manual Search
```
You searched for their name or email
```

---

## Example: Complete Trade Scenario

```
SYED wants: Graphic Design
SYED offers: Web Development

ALI wants: Web Development
ALI offers: Graphic Design

Timeline:
─────────────────────────────────────────────
1. Syed logs in
   └─ Sees Ali as suggestion ✅

2. Syed clicks "Add Friend"
   └─ Syed loses 100 credits

3. Ali logs in and accepts
   └─ Syed loses 10 more credits

4. Syed proposes barter
   ├─ Offers: Web Development
   ├─ Wants: Graphic Design
   └─ Syed loses 10 more credits

5. Ali accepts barter
   └─ Ali loses 10 credits

6. Both work on their skills

7. Both leave reviews
   └─ Ratings updated

TOTAL COST:
Syed: 120 credits
Ali: 10 credits
```

---

## Troubleshooting

### "I don't see any users"
**Solution:** 
- Check if you have skills_wanted set in your profile
- Other users must have skills_offered that match your skills_wanted
- Try searching manually instead

### "Can't send friend request"
**Solution:**
- Do you have a subscription? (Not free trial)
- Do you have 100+ credits?
- Is there already a request between you?

### "Can't propose barter"
**Solution:**
- Is the friend request accepted?
- Do you have 10+ credits?

### "Can't message"
**Solution:**
- Is the barter accepted? (status: "accepted")
- Messaging only works for accepted barters

---

## Database Collections

```
Users
├─ name, email, password
├─ skills_offered, skills_wanted
├─ credits, rating
└─ friends list

Friend Requests
├─ from (User A)
├─ to (User B)
└─ status (pending/accepted)

Barters
├─ requester (User A)
├─ accepter (User B)
├─ offered_skill, wanted_skill
├─ status (proposed/accepted/completed)
└─ reviews

Messages
├─ participants
├─ messages
└─ timestamps
```

---

## API Endpoints

```
GET  /api/barter/suggestions          → Get skill-based suggestions
GET  /api/user/search?query=...       → Search users
POST /api/barter/friend-request       → Send friend request
PUT  /api/barter/friend-request/:id   → Accept friend request
POST /api/barter/barter               → Propose barter
PUT  /api/barter/barter/:id/accept    → Accept barter
PUT  /api/barter/complete             → Complete trade + review
GET  /api/barter/trades?status=...    → Get active trades
POST /api/chat/send                   → Send message
GET  /api/chat/list                   → Get chats
```

---

## Key Differences

### Friend Request vs Barter Proposal
```
Friend Request:
- Required FIRST
- Costs 100 credits
- Just connects you as friends

Barter Proposal:
- Required AFTER friend request accepted
- Costs 10 credits
- Specifies what you offer and want
```

### Proposed vs Accepted Barter
```
Proposed:
- Waiting for other user to accept
- Cannot message yet
- Cannot leave review

Accepted:
- Both users agreed
- Can message each other
- Cannot leave review yet
```

### Accepted vs Completed Barter
```
Accepted:
- Trade in progress
- Can message
- Cannot leave review

Completed:
- Trade finished
- Can message
- Can leave review
```

---

## Remember

🎯 **Discovery:** Based on complementary skills
🎯 **Connection:** Friend request required first
🎯 **Trading:** Barter proposal after friendship
🎯 **Communication:** Messaging after barter accepted
🎯 **Feedback:** Reviews after trade completed
🎯 **Cost:** Each step costs credits to prevent spam
🎯 **Async:** Users don't need to be online

