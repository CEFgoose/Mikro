# Mikro Checklist System Documentation

*Archived documentation for potential future implementation. The checklist system was part of Mikro's training and onboarding payment workflow.*

---

## Overview

The Checklist system allows administrators to create training/onboarding checklists that users complete for payment. It's separate from task-based payments and is designed for things like:
- New mapper onboarding tasks
- Training completion verification
- Quality assurance checklists
- Certification requirements

---

## Database Models

### Checklist (Template)
```python
class Checklist:
    id: BigInteger (PK)
    name: String(255)              # Checklist title
    author: String(200)            # Creator's name
    description: Text              # Full description
    due_date: DateTime             # Optional deadline
    org_id: String(255)            # Organization ID

    # Payment rates
    completion_rate: Float         # $ paid to user upon completion
    validation_rate: Float         # $ paid to validator for confirming
    total_payout: Float            # Budget tracking

    # Metadata
    difficulty: String(50)         # "Beginner", "Intermediate", "Advanced"
    visibility: Boolean            # Public or private
    active_status: Boolean         # Available for users to start
    completed: Boolean             # Template-level flag
    confirmed: Boolean             # Template-level flag
```

### ChecklistItem (Template Item)
```python
class ChecklistItem:
    id: BigInteger (PK)
    checklist_id: BigInteger (FK)  # Parent checklist
    item_number: Integer           # Order in list (1, 2, 3...)
    item_action: Text              # Description of task to complete
    item_link: String(500)         # Optional URL resource
```

### UserChecklist (User's Instance)
```python
class UserChecklist:
    id: BigInteger (PK)
    user_id: String(255)           # User who owns this instance
    checklist_id: BigInteger       # Original template ID
    date_created: DateTime

    # Copied from template (allows template updates without affecting in-progress)
    name, author, description, due_date, org_id
    completion_rate, validation_rate, total_payout
    difficulty, visibility, active_status

    # Progress tracking
    completed: Boolean             # User finished all items
    confirmed: Boolean             # Validator approved all items

    # Timestamps
    last_completion_date: DateTime    # Last item completed
    last_confirmation_date: DateTime  # Last item confirmed
    final_completion_date: DateTime   # All items completed
    final_confirmation_date: DateTime # All items confirmed (triggers payment)
```

### UserChecklistItem (User's Item Instance)
```python
class UserChecklistItem:
    id: BigInteger (PK)
    user_id: String(255)
    checklist_id: BigInteger       # User's checklist instance ID
    item_number: Integer
    item_action: Text
    item_link: String(500)

    # Progress
    completed: Boolean             # User marked as done
    confirmed: Boolean             # Validator confirmed
    completion_date: DateTime
    confirmation_date: DateTime
```

### ChecklistComment
```python
class ChecklistComment:
    id: BigInteger (PK)
    checklist_id: BigInteger       # User's checklist instance
    comment: Text
    author: String(200)            # "FirstName (osm_username)"
    role: String(50)               # "user", "validator", "admin"
    date: DateTime
```

---

## User Payment Fields

```python
class User:
    # Checklist-specific payment tracking
    checklist_payable_total: Float      # Earnings from confirmed checklists
    total_checklists_completed: Integer # Count of completed checklists

    # Validator stats
    validator_total_checklists_confirmed: Integer

    # Combined in overall payment
    payable_total = mapping_payable_total + validation_payable_total + checklist_payable_total
```

---

## Workflow

### 1. Admin Creates Checklist Template
```
POST /api/checklist/create_checklist
{
    "checklistName": "New Mapper Onboarding",
    "checklistDescription": "Complete these tasks to start mapping",
    "completionRate": 25.00,      // User earns $25 for completing
    "validationRate": 5.00,       // Validator earns $5 for confirming
    "visibility": true,
    "checklistDifficulty": "Beginner",
    "listItems": [
        {"number": 1, "action": "Complete OSM registration", "link": "https://osm.org"},
        {"number": 2, "action": "Watch intro video", "link": "https://youtube.com/..."},
        {"number": 3, "action": "Map 10 practice buildings", "link": ""}
    ],
    "dueDate": "2024-12-31"
}
```

### 2. User Starts Checklist
```
POST /api/checklist/start_checklist
{
    "checklist_id": 123
}
```
- Creates `UserChecklist` instance (copy of template)
- Creates `UserChecklistItem` for each template item
- User can now see it in "Started Checklists"

### 3. User Completes Items
```
POST /api/checklist/complete_list_item
{
    "checklist_id": 456,  // UserChecklist ID
    "item_number": 1,
    "user_id": "auth0|abc123"
}
```
- Marks item as `completed = True`
- Sets `completion_date`
- If ALL items complete → sets `UserChecklist.completed = True`

### 4. Validator Confirms Items
```
POST /api/checklist/confirm_list_item
{
    "checklist_id": 456,
    "item_number": 1,
    "user_id": "auth0|abc123"  // User who completed it
}
```
- Marks item as `confirmed = True`
- If ALL items confirmed:
  - Sets `UserChecklist.confirmed = True`
  - **PAYMENT TRIGGERED**: Adds `completion_rate` to user's `checklist_payable_total`
  - Increments `total_checklists_completed`

### 5. Payment Request
- User's `checklist_payable_total` is included in overall `payable_total`
- When user requests payment, all earnings (mapping + validation + checklist) are bundled

---

## API Endpoints

### Admin Endpoints (requires `@requires_admin`)
| Endpoint | Purpose |
|----------|---------|
| `POST /checklist/create_checklist` | Create new template |
| `POST /checklist/update_checklist` | Update template metadata |
| `POST /checklist/update_list_items` | Add/edit/remove items |
| `POST /checklist/delete_checklist` | Delete template |
| `POST /checklist/fetch_admin_checklists` | Get all org checklists with status |
| `POST /checklist/fetch_checklist_users` | Get users assigned to a checklist |
| `POST /checklist/assign_user_checklist` | Assign checklist to user |
| `POST /checklist/unassign_user_checklist` | Remove user from checklist |

### User Endpoints
| Endpoint | Purpose |
|----------|---------|
| `POST /checklist/fetch_user_checklists` | Get user's checklists (started, completed, available) |
| `POST /checklist/start_checklist` | Begin a checklist |
| `POST /checklist/complete_list_item` | Mark item as done |
| `POST /checklist/add_checklist_comment` | Add comment |
| `POST /checklist/delete_checklist_comment` | Remove comment |

### Validator Endpoints
| Endpoint | Purpose |
|----------|---------|
| `POST /checklist/fetch_validator_checklists` | Get checklists ready for review |
| `POST /checklist/confirm_list_item` | Approve completed item |

---

## Checklist States

### Template States
- **Inactive** (`active_status = False`): Draft, not visible to users
- **Active** (`active_status = True`): Users can start it

### User Instance States
| State | completed | confirmed | Description |
|-------|-----------|-----------|-------------|
| Started | False | False | User working on it |
| Completed | True | False | All items done, awaiting validator |
| Confirmed | True | True | Validator approved, **payment triggered** |
| Stale | - | - | Started but no activity for 72+ hours |

---

## Payment Calculation

When validator confirms the **last item** of a user's checklist:

```python
# In confirm_list_item() when all items confirmed:
checklist_earnings = target_user.checklist_payable_total + target_user_checklist.completion_rate
target_user.update(
    checklist_payable_total=checklist_earnings,
    total_checklists_completed=target_user.total_checklists_completed + 1
)
```

**Note**: Validator payment for confirming checklists is tracked via `validation_rate` on the checklist but the actual validator payment logic isn't fully implemented in the current code.

---

## Frontend Components (React)

The Mikro frontend has these checklist-related pages:
- **Admin Checklists Page**: Create/manage templates
- **User Checklists Page**: View available/started/completed checklists
- **Validator Checklists Page**: Review and confirm user submissions

---

## Key Differences from Task Payments

| Aspect | Task Payments | Checklist Payments |
|--------|---------------|-------------------|
| Trigger | Task validated in TM4 | All items confirmed by validator |
| Rate Source | Project rate × task count | Checklist `completion_rate` |
| Validation | TM4 validator | Mikro validator |
| Data Source | TM4 API polling | Native Mikro workflow |
| Payment Field | `mapping_payable_total` | `checklist_payable_total` |

---

## Implementation Notes for Future Integration

If adding checklists to Tasking Manager:

1. **Database Tables Needed**:
   - `checklists` (templates)
   - `checklist_items` (template items)
   - `user_checklists` (user instances)
   - `user_checklist_items` (item progress)
   - `checklist_comments` (feedback)

2. **User Model Extensions**:
   - `checklist_payable_total: Float`
   - `total_checklists_completed: Integer`

3. **Integration Points**:
   - Link checklists to Projects (prerequisite training)
   - Link checklists to User onboarding
   - Include in payment calculation service

4. **Workflow**:
   - Admin creates checklist template
   - User starts instance (copies template)
   - User marks items complete
   - Validator confirms each item
   - Final confirmation triggers payment

5. **API Routes**:
   - `/api/v2/checklists/` (CRUD for templates)
   - `/api/v2/checklists/{id}/items/` (item management)
   - `/api/v2/users/{id}/checklists/` (user instances)
   - `/api/v2/checklists/{id}/confirm/` (validator actions)
