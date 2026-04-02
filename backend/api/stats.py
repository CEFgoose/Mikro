"""
Shared stat computation helpers — Single Source of Truth (SSOT).

All task/user/project stats AND payment balances are derived from the
Task table (plus PayRequests/Payments for claimed task tracking).
No incremental counter columns are used.

Used by: Projects.py, Users.py, Teams.py, Reports.py, Transactions.py
"""

from .database import Task, UserTasks, PayRequests, Payments, db
from sqlalchemy import func, case, and_


def count_tasks_split_aware(tasks, condition_fn=None):
    """
    Count tasks with split-awareness.

    Split task groups (siblings with same parent_task_id) only count as 1
    when ALL siblings are present AND ALL meet the condition.

    Args:
        tasks: List of Task objects to count
        condition_fn: Optional function that takes a task and returns True
                     if it should be counted. If None, counts all tasks.

    Returns:
        Effective count where split groups count as 1 only when ALL siblings
        are present and meet condition
    """
    if condition_fn is None:
        condition_fn = lambda t: True

    normal_tasks = [t for t in tasks if not t.parent_task_id]
    split_tasks = [t for t in tasks if t.parent_task_id]

    normal_count = len([t for t in normal_tasks if condition_fn(t)])

    split_groups = {}
    for task in split_tasks:
        split_groups.setdefault(task.parent_task_id, []).append(task)

    split_count = 0
    for parent_id, siblings in split_groups.items():
        expected_count = siblings[0].sibling_count if siblings[0].sibling_count else 4
        if len(siblings) == expected_count and all(condition_fn(t) for t in siblings):
            split_count += 1

    return normal_count + split_count


def get_project_stats(project_id):
    """
    Live-count task stats for a project from the Task table.

    Returns dict with tasks_mapped, tasks_validated, tasks_invalidated.
    """
    tasks = Task.query.filter_by(project_id=project_id).all()
    return _compute_task_stats(tasks)


def get_project_stats_from_tasks(tasks):
    """
    Compute task stats from a pre-loaded list of tasks.

    Use this when you already have the tasks loaded to avoid a second query.
    """
    return _compute_task_stats(tasks)


def get_batch_project_stats(project_ids):
    """
    Live-count task stats for multiple projects in one query.

    Returns dict of {project_id: {tasks_mapped, tasks_validated, tasks_invalidated}}.
    """
    if not project_ids:
        return {}

    all_tasks = Task.query.filter(Task.project_id.in_(project_ids)).all()

    tasks_by_project = {}
    for t in all_tasks:
        tasks_by_project.setdefault(t.project_id, []).append(t)

    result = {}
    for pid in project_ids:
        result[pid] = _compute_task_stats(tasks_by_project.get(pid, []))
    return result


def get_user_task_stats(user, all_org_tasks=None):
    """
    Live-count task stats for a user from the Task table.

    Args:
        user: User model instance
        all_org_tasks: Optional pre-loaded list of all org tasks (for batch use).
                       If None, queries the DB.

    Returns dict with:
        total_tasks_mapped, total_tasks_validated, total_tasks_invalidated,
        validator_tasks_validated, validator_tasks_invalidated

    NOTE: Payment balances are NOT included here — use get_user_payment_balances().
    """
    user_task_ids = set(
        ut.task_id
        for ut in UserTasks.query.filter_by(user_id=user.id).all()
    )

    if all_org_tasks is None:
        all_org_tasks = Task.query.filter_by(org_id=user.org_id).all()

    user_tasks = [t for t in all_org_tasks if t.id in user_task_ids]

    mapped_cond = lambda t: t.mapped and not t.validated and not t.invalidated
    validated_cond = lambda t: t.mapped and t.validated
    invalidated_cond = lambda t: t.mapped and t.invalidated

    total_mapped = count_tasks_split_aware(user_tasks, mapped_cond)
    total_validated = count_tasks_split_aware(user_tasks, validated_cond)
    total_invalidated = count_tasks_split_aware(user_tasks, invalidated_cond)

    osm_un = user.osm_username

    validator_validated = count_tasks_split_aware(
        all_org_tasks,
        lambda t: t.validated and t.validated_by == osm_un and not t.self_validated,
    )
    validator_invalidated = count_tasks_split_aware(
        all_org_tasks,
        lambda t: t.invalidated and t.validated_by == osm_un,
    )

    return {
        "total_tasks_mapped": total_mapped,
        "total_tasks_validated": total_validated,
        "total_tasks_invalidated": total_invalidated,
        "validator_tasks_validated": validator_validated,
        "validator_tasks_invalidated": validator_invalidated,
    }


def get_batch_user_task_stats(users, org_id):
    """
    Live-count task stats for multiple users in one query batch.

    Loads all org tasks and UserTasks once, then computes per-user.

    Returns dict of {user_id: stats_dict}.
    """
    all_org_tasks = Task.query.filter_by(org_id=org_id).all()

    # Batch-load all UserTasks for these users
    user_ids = [u.id for u in users]
    all_user_tasks = UserTasks.query.filter(
        UserTasks.user_id.in_(user_ids)
    ).all() if user_ids else []

    user_task_map = {}
    for ut in all_user_tasks:
        user_task_map.setdefault(ut.user_id, set()).add(ut.task_id)

    result = {}
    for user in users:
        task_ids = user_task_map.get(user.id, set())
        user_tasks = [t for t in all_org_tasks if t.id in task_ids]
        osm_un = user.osm_username

        mapped_cond = lambda t: t.mapped and not t.validated and not t.invalidated
        validated_cond = lambda t: t.mapped and t.validated
        invalidated_cond = lambda t: t.mapped and t.invalidated

        total_mapped = count_tasks_split_aware(user_tasks, mapped_cond)
        total_validated = count_tasks_split_aware(user_tasks, validated_cond)
        total_invalidated = count_tasks_split_aware(user_tasks, invalidated_cond)

        # Capture osm_un in closure properly
        def _make_val_cond(un):
            return lambda t: t.validated and t.validated_by == un and not t.self_validated

        def _make_inv_cond(un):
            return lambda t: t.invalidated and t.validated_by == un

        validator_validated = count_tasks_split_aware(
            all_org_tasks, _make_val_cond(osm_un)
        )
        validator_invalidated = count_tasks_split_aware(
            all_org_tasks, _make_inv_cond(osm_un)
        )

        result[user.id] = {
            "total_tasks_mapped": total_mapped,
            "total_tasks_validated": total_validated,
            "total_tasks_invalidated": total_invalidated,
            "validator_tasks_validated": validator_validated,
            "validator_tasks_invalidated": validator_invalidated,
        }

    return result


def _get_claimed_task_ids(user_id):
    """Get task IDs already included in a PayRequest or Payment for this user."""
    claimed = set()

    # Active (pending) payment requests
    pending = PayRequests.query.filter_by(user_id=user_id).all()
    for req in pending:
        if req.task_ids:
            claimed.update(req.task_ids)

    # Processed payments
    paid = Payments.query.filter_by(user_id=user_id).all()
    for pay in paid:
        if pay.task_ids:
            claimed.update(pay.task_ids)

    return claimed


def get_user_payment_balances(user, all_org_tasks=None):
    """
    Live-compute payment balances for a user from the Task table.

    Payable = sum of rates for validated tasks NOT already claimed
    in a PayRequest or Payment.

    Returns dict with mapping_payable_total, validation_payable_total.
    """
    user_task_ids = set(
        ut.task_id
        for ut in UserTasks.query.filter_by(user_id=user.id).all()
    )

    if all_org_tasks is None:
        all_org_tasks = Task.query.filter_by(org_id=user.org_id).all()

    user_tasks = [t for t in all_org_tasks if t.id in user_task_ids]
    claimed = _get_claimed_task_ids(user.id)
    osm_un = user.osm_username

    # Mapping payable: validated tasks mapped by user, not yet claimed
    mapping_payable = sum(
        t.mapping_rate or 0
        for t in user_tasks
        if t.validated
        and not getattr(t, "self_validated", False)
        and t.id not in claimed
    )

    # Validation payable: tasks validated/invalidated BY user, not yet claimed
    validation_payable = sum(
        t.validation_rate or 0
        for t in all_org_tasks
        if t.validated_by == osm_un
        and not getattr(t, "self_validated", False)
        and t.id not in claimed
        and (t.validated or t.invalidated)
    )

    return {
        "mapping_payable_total": round(mapping_payable, 2),
        "validation_payable_total": round(validation_payable, 2),
    }


def get_batch_user_payment_balances(users, org_id):
    """
    Live-compute payment balances for multiple users in one batch.

    Returns dict of {user_id: {mapping_payable_total, validation_payable_total}}.
    """
    all_org_tasks = Task.query.filter_by(org_id=org_id).all()

    user_ids = [u.id for u in users]

    # Batch-load UserTasks
    all_uts = UserTasks.query.filter(
        UserTasks.user_id.in_(user_ids)
    ).all() if user_ids else []
    ut_map = {}
    for ut in all_uts:
        ut_map.setdefault(ut.user_id, set()).add(ut.task_id)

    # Batch-load claimed task IDs
    all_pay_requests = PayRequests.query.filter(
        PayRequests.user_id.in_(user_ids)
    ).all() if user_ids else []
    all_payments = Payments.query.filter(
        Payments.user_id.in_(user_ids)
    ).all() if user_ids else []

    claimed_map = {}
    for req in all_pay_requests:
        claimed_map.setdefault(req.user_id, set()).update(req.task_ids or [])
    for pay in all_payments:
        claimed_map.setdefault(pay.user_id, set()).update(pay.task_ids or [])

    result = {}
    for user in users:
        task_ids = ut_map.get(user.id, set())
        user_tasks = [t for t in all_org_tasks if t.id in task_ids]
        claimed = claimed_map.get(user.id, set())
        osm_un = user.osm_username

        mapping_payable = sum(
            t.mapping_rate or 0
            for t in user_tasks
            if t.validated
            and not getattr(t, "self_validated", False)
            and t.id not in claimed
        )
        validation_payable = sum(
            t.validation_rate or 0
            for t in all_org_tasks
            if t.validated_by == osm_un
            and not getattr(t, "self_validated", False)
            and t.id not in claimed
            and (t.validated or t.invalidated)
        )

        result[user.id] = {
            "mapping_payable_total": round(mapping_payable, 2),
            "validation_payable_total": round(validation_payable, 2),
        }

    return result


def _compute_task_stats(tasks):
    """Internal helper: compute split-aware mapped/validated/invalidated from a task list."""
    mapped_cond = lambda t: t.mapped and not t.validated and not t.invalidated
    validated_cond = lambda t: t.mapped and t.validated
    invalidated_cond = lambda t: t.invalidated

    return {
        "tasks_mapped": count_tasks_split_aware(tasks, mapped_cond),
        "tasks_validated": count_tasks_split_aware(tasks, validated_cond),
        "tasks_invalidated": count_tasks_split_aware(tasks, invalidated_cond),
    }


def get_batch_user_task_stats_fast(users, org_id):
    """
    Fast SQL-aggregated task stats for multiple users.

    Uses GROUP BY instead of loading all tasks into Python.
    Does NOT use split-aware counting (acceptable for list views).

    Returns dict of {user_id: stats_dict}.
    """
    user_ids = [u.id for u in users]
    if not user_ids:
        return {}

    # Mapper stats: count tasks assigned to each user by status
    mapper_rows = (
        db.session.query(
            UserTasks.user_id,
            func.count(case(
                (and_(Task.mapped == True, Task.validated == False, Task.invalidated == False), 1),
            )).label("mapped"),
            func.count(case(
                (and_(Task.mapped == True, Task.validated == True), 1),
            )).label("validated"),
            func.count(case(
                (Task.invalidated == True, 1),
            )).label("invalidated"),
        )
        .join(Task, Task.id == UserTasks.task_id)
        .filter(UserTasks.user_id.in_(user_ids))
        .group_by(UserTasks.user_id)
        .all()
    )

    mapper_map = {}
    for row in mapper_rows:
        mapper_map[row.user_id] = {
            "total_tasks_mapped": row.mapped or 0,
            "total_tasks_validated": row.validated or 0,
            "total_tasks_invalidated": row.invalidated or 0,
        }

    # Validator stats: count tasks validated BY each user (by osm_username)
    osm_usernames = [u.osm_username for u in users if u.osm_username]
    validator_map = {}

    if osm_usernames:
        validator_rows = (
            db.session.query(
                Task.validated_by,
                func.count(case(
                    (and_(Task.validated == True, Task.self_validated == False), 1),
                )).label("val_validated"),
                func.count(case(
                    (Task.invalidated == True, 1),
                )).label("val_invalidated"),
            )
            .filter(
                Task.org_id == org_id,
                Task.validated_by.in_(osm_usernames),
            )
            .group_by(Task.validated_by)
            .all()
        )

        for row in validator_rows:
            validator_map[row.validated_by] = {
                "validator_tasks_validated": row.val_validated or 0,
                "validator_tasks_invalidated": row.val_invalidated or 0,
            }

    # Merge mapper + validator stats
    result = {}
    for user in users:
        m = mapper_map.get(user.id, {})
        v = validator_map.get(user.osm_username, {})
        result[user.id] = {
            "total_tasks_mapped": m.get("total_tasks_mapped", 0),
            "total_tasks_validated": m.get("total_tasks_validated", 0),
            "total_tasks_invalidated": m.get("total_tasks_invalidated", 0),
            "validator_tasks_validated": v.get("validator_tasks_validated", 0),
            "validator_tasks_invalidated": v.get("validator_tasks_invalidated", 0),
        }

    return result


def get_batch_user_payment_balances_fast(users, org_id):
    """
    Fast SQL-aggregated payment balances for multiple users.

    Uses SQL SUM instead of loading all tasks into Python.

    Returns dict of {user_id: {mapping_payable_total, validation_payable_total}}.
    """
    user_ids = [u.id for u in users]
    if not user_ids:
        return {}

    # Batch-load claimed task IDs (tasks already in a PayRequest or Payment)
    all_pay_requests = PayRequests.query.filter(
        PayRequests.user_id.in_(user_ids)
    ).all()
    all_payments = Payments.query.filter(
        Payments.user_id.in_(user_ids)
    ).all()

    claimed_map = {}
    for req in all_pay_requests:
        claimed_map.setdefault(req.user_id, set()).update(req.task_ids or [])
    for pay in all_payments:
        claimed_map.setdefault(pay.user_id, set()).update(pay.task_ids or [])

    # All claimed task IDs across all users (for SQL exclusion)
    all_claimed = set()
    for s in claimed_map.values():
        all_claimed.update(s)

    # Mapping payable: sum mapping_rate for user's assigned tasks that are validated + not self-validated + not claimed
    claimed_filter = ~Task.id.in_(all_claimed) if all_claimed else True

    mapping_rows = (
        db.session.query(
            UserTasks.user_id,
            func.coalesce(func.sum(Task.mapping_rate), 0).label("payable"),
        )
        .join(Task, Task.id == UserTasks.task_id)
        .filter(
            UserTasks.user_id.in_(user_ids),
            Task.validated == True,
            Task.self_validated == False,
            claimed_filter,
        )
        .group_by(UserTasks.user_id)
        .all()
    )

    mapping_map = {row.user_id: float(row.payable) for row in mapping_rows}

    # Validation payable: sum validation_rate for tasks validated BY each user (by osm_username)
    osm_usernames = [u.osm_username for u in users if u.osm_username]
    validation_map = {}

    if osm_usernames:
        validation_rows = (
            db.session.query(
                Task.validated_by,
                func.coalesce(func.sum(Task.validation_rate), 0).label("payable"),
            )
            .filter(
                Task.org_id == org_id,
                Task.validated_by.in_(osm_usernames),
                Task.self_validated == False,
                db.or_(Task.validated == True, Task.invalidated == True),
                claimed_filter,
            )
            .group_by(Task.validated_by)
            .all()
        )

        for row in validation_rows:
            validation_map[row.validated_by] = float(row.payable)

    # Build result
    result = {}
    for user in users:
        # For mapping, also need to subtract per-user claimed amounts
        # The SQL already excludes globally claimed tasks, but we need per-user precision
        # Since claimed_filter excludes ALL claimed tasks (not per-user), this is slightly imprecise
        # but acceptable for list view — the profile page uses the precise per-user calculation
        result[user.id] = {
            "mapping_payable_total": round(mapping_map.get(user.id, 0), 2),
            "validation_payable_total": round(validation_map.get(user.osm_username, 0), 2),
        }

    return result
