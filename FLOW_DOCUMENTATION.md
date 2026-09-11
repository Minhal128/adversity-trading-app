# Complete ATC (Active Trader Community) Flow Documentation

## Overview
The ATC app is a skill-sharing platform where users can discover each other based on skills and create barter trades. Here's the complete flow:

---

## 1. USER DISCOVERY - How You See Each Other

### Method 1: Skill-Based Suggestions (Automatic)
**Basis:** Users are matched based on complementary skills

**How it works:**
```
User A's Profile:
├─ Skills Offered: Web Development, UI Design
└─ Skills Wanted: Graphic Design, Video Editing

User B's Profile:
├─ Skills Offered: Graphic Design, Photography
└─ Skills Wanted: Web Development

Result: User A sees User B as a suggestion because:
- User B offers "Graphic Design" (which User A wants)
- User B wants "Web Development" (which User A offers)
```

**Flow:**
1. User logs in → Home screen loads
2. `loadSuggestions()` is called
3. Backend finds users whose `skills_offered` match current user's `skills_wanted`
4. Suggestions appear on Home screen
5. User can click on a suggestion to view their profile

**Code Path:**
```
Frontend: Home.tsx → loadSuggestions()
  ↓
API: barterApi.getSkillSuggestions()
  ↓
Backend: GET /api/barter/suggestions
  ↓
Controller: barterController.getSkillSuggestions()
  ↓
Database Query:
  User.find({
    _id: { $ne: currentUserId },
    skills_offered: { $in: currentUser.skills_wanted }
  })
```

### Method 2: Manual Search (User-Initiated)
**Basis:** Search by name or email

**How it works:**
```
User enters search query: "Ali"
  ↓
System searches all users where:
- name contains "Ali" (case-insensitive)
- OR email contains "Ali"
  ↓
Results displayed with their profile info
```

**Flow:**
1. User goes to "Find Users" screen (UserDiscovery.tsx)
2. Enters search query (name or email)
3. Clicks "Search" button
4. Backend searches database
5. Results displayed with user cards
6. User clicks "View" to see full profile

**Code Path:**
```
Frontend: UserDiscovery.tsx → handleSearch()
  ↓
API: userApi.searchUsers(query)
  ↓
Backend: GET /api/user/search?query=...
  ↓
Controller: userController.searchUsers()
  ↓
Database Query:
  User.find({
    _id: { $ne: currentUserId },
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ]
  })
```

---

## 2. VIEWING USER PROFILE

**What You See:**
- User's name, email, profile picture
- Skills they offer
- Skills they seek
- Rating (based on completed trades)
- Reviews from previous trades
- Action buttons: "Add Friend", "Message", "Propose Barter"

**Code Path:**
```
Frontend: OtherProfile.tsx
  ↓
Displays user data passed from:
- Suggestions list
- Search results
- Active trades list
```

---

## 3. SENDING FRIEND REQUEST

**Cost:** 100 credits (deducted from your account)

**Prerequisites:**
- You must have a subscription (not on free trial)
- You must have at least 100 credits
- No existing friend request between you two

**Flow:**
```
Step 1: User clicks "Add Friend" button
  ↓
Step 2: Frontend calls barterApi.sendFriendRequest({ toUserId })
  ↓
Step 3: Backend receives request
  ├─ Checks if user has subscription
  ├─ Checks if user has 100+ credits
  ├─ Checks if request already exists
  └─ If all OK: Deducts 100 credits and creates FriendRequest
  ↓
Step 4: FriendRequest stored in database with status: "pending"
  ↓
Step 5: Other user sees notification when they log in
```

**Database Entry:**
```javascript
FriendRequest {
  from: User A ID,
  to: User B ID,
  status: "pending",
  createdAt: timestamp
}
```

**Code Path:**
```
Frontend: OtherProfile.tsx → handleAddFriend()
  ↓
API: barterApi.sendFriendRequest({ toUserId: userId })
  ↓
Backend: POST /api/barter/friend-request
  ↓
Controller: barterController.sendFriendRequest()
  ↓
Actions:
1. Verify subscription
2. Check credits (100 required)
3. Check for existing request
4. Deduct 100 credits: User.findByIdAndUpdate({ $inc: { credits: -100 } })
5. Create FriendRequest document
```

---

## 4. ACCEPTING FRIEND REQUEST

**Cost:** 10 credits (deducted from the sender's account)

**Who Pays:** The person who SENT the original request

**Flow:**
```
Step 1: User B sees friend request notification
  ↓
Step 2: User B clicks "Accept"
  ↓
Step 3: Backend checks if sender has 10+ credits
  ├─ If yes: Deduct 10 credits from sender
  ├─ Update FriendRequest status to "accepted"
  └─ Add both users to each other's friends list
  ↓
Step 4: Now both users can propose barters
```

**Database Changes:**
```javascript
// FriendRequest updated
FriendRequest {
  from: User A ID,
  to: User B ID,
  status: "accepted",  // Changed from "pending"
  createdAt: timestamp
}

// Both users updated
User A: friends array includes User B
User B: friends array includes User A
```

**Code Path:**
```
Frontend: Notification/Request screen → Accept button
  ↓
API: barterApi.acceptFriendRequest(requestId)
  ↓
Backend: PUT /api/barter/friend-request/:requestId/accept
  ↓
Controller: barterController.acceptFriendRequest()
  ↓
Actions:
1. Verify request exists and is pending
2. Check sender's credits (10 required)
3. Deduct 10 credits from sender
4. Update status to "accepted"
5. Add to friends lists
```

---

## 5. PROPOSING A BARTER

**Cost:** 10 credits (deducted from proposer)

**Prerequisites:**
- Friend request must be accepted
- You must have 10+ credits

**Flow:**
```
Step 1: User A clicks "Propose Barter" on User B's profile
  ↓
Step 2: ProposeBarter screen opens
  ├─ User A selects: "I offer: Web Development"
  ├─ User A selects: "I want: Graphic Design"
  └─ User A clicks "Propose"
  ↓
Step 3: Backend creates Barter document
  ├─ Deduct 10 credits from User A
  ├─ Set status: "proposed"
  └─ Store offered_skill and wanted_skill
  ↓
Step 4: Barter stored in database
  ↓
Step 5: User B sees barter proposal notification
```

**Database Entry:**
```javascript
Barter {
  requester: User A ID,
  accepter: User B ID,
  friendRequest: FriendRequest ID,
  offered_skill: "Web Development",
  wanted_skill: "Graphic Design",
  status: "proposed",
  createdAt: timestamp
}
```

**Code Path:**
```
Frontend: ProposeBarter.tsx → handlePropose()
  ↓
API: barterApi.proposeBarter({ friendRequestId, offered_skill, wanted_skill })
  ↓
Backend: POST /api/barter/barter
  ↓
Controller: barterController.proposeBarter()
  ↓
Actions:
1. Verify friend request is accepted
2. Check if barter already exists
3. Check credits (10 required)
4. Deduct 10 credits
5. Create Barter document
```

---

## 6. ACCEPTING A BARTER

**Cost:** 10 credits (deducted from accepter)

**Flow:**
```
Step 1: User B sees barter proposal
  ├─ Offered: Web Development
  ├─ Wanted: Graphic Design
  └─ Clicks "Accept"
  ↓
Step 2: Backend updates Barter
  ├─ Deduct 10 credits from User B
  ├─ Set status: "accepted"
  └─ Now they can message each other
  ↓
Step 3: Barter appears in "Active Trades" section
  ├─ For User A under "Ongoing"
  └─ For User B under "Ongoing"
```

**Database Changes:**
```javascript
Barter {
  requester: User A ID,
  accepter: User B ID,
  offered_skill: "Web Development",
  wanted_skill: "Graphic Design",
  status: "accepted",  // Changed from "proposed"
  createdAt: timestamp
}
```

**Code Path:**
```
Frontend: Barter details screen → Accept button
  ↓
API: barterApi.acceptBarter(barterId)
  ↓
Backend: PUT /api/barter/barter/:barterId/accept
  ↓
Controller: barterController.acceptBarter()
  ↓
Actions:
1. Verify barter exists and is proposed
2. Check accepter's credits (10 required)
3. Deduct 10 credits from accepter
4. Update status to "accepted"
```

---

## 7. VIEWING ACTIVE TRADES

**Where You See Them:**
- Home screen: "Active Trades" section
- Dedicated "Active Trades" screen with tabs

**Tabs:**
- **Ongoing:** Trades with status "accepted" (currently in progress)
- **Pending:** Trades with status "proposed" (waiting for acceptance)
- **Completed:** Trades with status "completed" (finished)

**What's Displayed:**
- Other user's profile picture, name, rating
- Skills offered and wanted
- Action buttons: "Chat", "View Trade"

**Code Path:**
```
Frontend: Home.tsx or ActiveTrade.tsx → loadTrades()
  ↓
API: barterApi.getActiveTrades(status)
  ↓
Backend: GET /api/barter/trades?status=ongoing
  ↓
Controller: barterController.getActiveTrades()
  ↓
Database Query:
  Barter.find({
    $or: [
      { requester: currentUserId },
      { accepter: currentUserId }
    ],
    status: "accepted"  // or "proposed" or "completed"
  })
  ↓
Response includes:
- otherUser (the person you're trading with)
- offered_skill
- wanted_skill
- status
```

---

## 8. COMPLETING A TRADE & LEAVING REVIEW

**Cost:** Free (no credits deducted)

**Flow:**
```
Step 1: User A clicks "Write Review" on completed trade
  ↓
Step 2: Rating screen opens
  ├─ User A rates User B (1-5 stars)
  ├─ User A writes comment
  └─ User A submits
  ↓
Step 3: Backend updates Barter
  ├─ Stores User A's review
  ├─ Sets status: "completed"
  └─ Updates User B's rating
  ↓
Step 4: Trade moves to "Completed" tab
```

**Database Changes:**
```javascript
Barter {
  requester: User A ID,
  accepter: User B ID,
  offered_skill: "Web Development",
  wanted_skill: "Graphic Design",
  status: "completed",
  requester_review: {
    rating: 5,
    comment: "Great work!"
  },
  completed_at: timestamp
}

// User B's rating updated
User B: rating = average of all reviews
```

---

## 9. MESSAGING

**When Available:**
- After barter is accepted (status: "accepted")
- Users can chat about the trade

**Flow:**
```
Step 1: User clicks "Chat" button on active trade
  ↓
Step 2: Chat screen opens with the other user
  ↓
Step 3: Users can exchange messages in real-time
  ↓
Step 4: Messages stored in Chat collection
```

---

## CREDIT SYSTEM SUMMARY

| Action | Cost | Paid By | When |
|--------|------|---------|------|
| Send Friend Request | 100 | Requester | Immediately |
| Accept Friend Request | 10 | Requester | When accepted |
| Propose Barter | 10 | Proposer | Immediately |
| Accept Barter | 10 | Accepter | When accepted |
| Complete Trade | 0 | N/A | N/A |
| Leave Review | 0 | N/A | N/A |

**Total Cost for Complete Trade:** 130 credits (100 + 10 + 10 + 10)

---

## COMPLETE EXAMPLE SCENARIO

**User A (Syed):** Wants Graphic Design, Offers Web Development
**User B (Ali):** Wants Web Development, Offers Graphic Design

### Timeline:

```
1. Syed logs in
   └─ Home screen shows Ali as suggestion (skill match)

2. Syed clicks on Ali's profile
   └─ Sees Ali's skills and rating

3. Syed clicks "Add Friend"
   └─ 100 credits deducted from Syed
   └─ Friend request sent to Ali

4. Ali logs in
   └─ Sees friend request from Syed
   └─ Clicks "Accept"
   └─ 10 credits deducted from Syed (sender)
   └─ Both are now friends

5. Syed clicks "Propose Barter"
   ├─ Offers: Web Development
   ├─ Wants: Graphic Design
   └─ 10 credits deducted from Syed

6. Ali sees barter proposal
   └─ Clicks "Accept"
   └─ 10 credits deducted from Ali

7. Both see trade in "Active Trades" → "Ongoing" tab

8. After completing the work:
   └─ Ali rates Syed (5 stars)
   └─ Syed rates Ali (5 stars)

9. Trade moves to "Completed" tab

Total Cost:
- Syed: 100 + 10 + 10 = 120 credits
- Ali: 10 credits
```

---

## KEY POINTS

✅ **Discovery:** Based on complementary skills OR manual search
✅ **Friend Request:** Required before proposing barters
✅ **Barter Proposal:** Only after friend request accepted
✅ **Credits:** Deducted at each step to prevent spam
✅ **Messaging:** Only available after barter accepted
✅ **Reviews:** Left after trade completed
✅ **No Online Status Required:** All actions work asynchronously

---

## DATABASE COLLECTIONS

```javascript
// Users
User {
  _id, name, email, password, profileImage,
  skills_offered, skills_wanted,
  credits, rating, friends,
  subscription, createdAt
}

// Friend Requests
FriendRequest {
  from, to, status ("pending"/"accepted"),
  createdAt
}

// Barters/Trades
Barter {
  requester, accepter, friendRequest,
  offered_skill, wanted_skill,
  status ("proposed"/"accepted"/"completed"),
  requester_review, accepter_review,
  completed_at, createdAt
}

// Messages
Chat {
  participants, messages, createdAt
}
```

---

## API ENDPOINTS SUMMARY

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/barter/suggestions | Get skill-based suggestions |
| GET | /api/user/search | Search users by name/email |
| POST | /api/barter/friend-request | Send friend request |
| PUT | /api/barter/friend-request/:id/accept | Accept friend request |
| POST | /api/barter/barter | Propose barter |
| PUT | /api/barter/barter/:id/accept | Accept barter |
| PUT | /api/barter/complete | Complete trade & leave review |
| GET | /api/barter/trades | Get active trades |
| POST | /api/chat/send | Send message |
| GET | /api/chat/list | Get chat list |

