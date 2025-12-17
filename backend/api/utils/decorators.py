#!/usr/bin/env python3
"""
Decorators for Mikro API.

These decorators provide role-based access control and utility functions.
Authentication is handled by the before_request hook in app.py.
"""

import cProfile
import pstats
from functools import wraps
from enum import IntFlag

from flask import g, request, jsonify


class TeamRole(IntFlag):
    """Describes a role a team can have for a project."""

    VIEWER = 2
    CREATOR = 4
    VIEW_CREATE = 8


class TeamMemberFunction(IntFlag):
    """Describes a role a user can have within a team."""

    MEMBER = 1
    MANAGER = 2


def profile(func):  # pragma: no cover
    """
    Profile a function.

    A file with the name of profile_<function_name>.out
    will be written to the current directory.
    """

    @wraps(func)
    def inner(*args, **kwargs):
        profiler = cProfile.Profile()
        profiler.enable()
        try:
            return_value = func(*args, **kwargs)
        finally:
            profiler.disable()
            filename = "".join(["profile_", func.__qualname__])
            with open(filename + ".print.profile", "w") as profile_file:
                stats = pstats.Stats(profiler, stream=profile_file)
                stats.dump_stats(filename + ".pstat")
                stats.print_stats()
        return return_value

    return inner


def requires_auth(f):
    """
    Decorator to require authenticated user.

    The actual JWT validation is done by the before_request hook.
    This decorator checks that g.user was set.
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(g, "user") or not g.user:
            return jsonify({"message": "Unauthorized", "status": 401}), 401
        return f(*args, **kwargs)

    return decorated_function


def requires_admin(f):
    """
    Decorator to require admin role.

    The user must be authenticated and have the 'admin' role.
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(g, "user") or not g.user:
            return jsonify({"message": "Unauthorized", "status": 401}), 401
        if g.user.role != "admin":
            return (
                jsonify(
                    {
                        "message": "Admin access required",
                        "status": 403,
                    }
                ),
                403,
            )
        return f(*args, **kwargs)

    return decorated_function


def requires_validator(f):
    """
    Decorator to require validator or admin role.

    The user must be authenticated and have either 'validator' or 'admin' role.
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(g, "user") or not g.user:
            return jsonify({"message": "Unauthorized", "status": 401}), 401
        if g.user.role not in ["admin", "validator"]:
            return (
                jsonify(
                    {
                        "message": "Validator access required",
                        "status": 403,
                    }
                ),
                403,
            )
        return f(*args, **kwargs)

    return decorated_function


def verify_access_to_resources(f):
    """
    Decorator to verify user has access to the requested project.

    Checks that the project exists.
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        from ..database import Project

        project_id = request.args.get("project")
        if not project_id or not project_id.isdigit():
            return jsonify({"message": "Project id is required!", "status": 400}), 400

        project = Project.get_by_id(project_id)
        if not project:
            return jsonify({"message": "Project does not exist!", "status": 404}), 404

        return f(*args, **kwargs)

    return decorated_function


# Legacy compatibility - jwt_verification is no longer needed
# Auth is now handled by before_request hook
def jwt_verification(f):
    """
    Legacy decorator - no longer needed.

    JWT verification is now handled by the before_request hook in app.py.
    This decorator is kept for backwards compatibility but does nothing.
    """

    @wraps(f)
    def wrapper(*args, **kwargs):
        return f(*args, **kwargs)

    return wrapper
