#!/usr/bin/env python3
import cProfile
import pstats
from functools import wraps
from enum import IntFlag
from flask import g, request
from flask_jwt_extended import verify_jwt_in_request

from ..static_variables import DISABLE_ADMIN_VERIFICATION, DISABLE_JWT_VERIFICATION

"""
If these enums/intflags are modified, please update relevant
enums in frontend/Mikro/src/components/constants.js
"""


class TeamRole(IntFlag):
    """Describes a role a team can have for a project"""

    VIEWER = 2
    CREATOR = 4
    VIEW_CREATE = 8


class TeamMemberFunction(IntFlag):
    """Describes a role a user can have within a team"""

    MEMBER = 1
    MANAGER = 2


def profile(func):  # pragma: no cover
    """
    Profile a function. A file with the name of profile_<function_name>.out
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


def requires_admin(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if DISABLE_ADMIN_VERIFICATION:
            return f(*args, **kwargs)
        if g.user.role != "admin":
            return {"message": "You must be an admin to perform this action."}, 401
        return f(*args, **kwargs)

    return decorated_function


def jwt_verification(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if (
            not DISABLE_JWT_VERIFICATION
        ):  # Make sure to define DISABLE_JWT_VERIFICATION in your code
            verify_jwt_in_request()
        return f(*args, **kwargs)

    return wrapper


def verify_access_to_resources(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from ..database import Project

        # I should be able to use:
        # user_teams = [t.team_id for t in g.user.teams]
        # However it does not seem to update, if you uncomment the above
        # line and comment out the below line
        # backend.tests.views.test_Sequence will fail
        # user_teams = [
        #     t.team_id
        #     for t in TeamMember.query.filter(
        #         TeamMember.user_id == g.user.id
        #     ).all()
        # ]
        project_id = request.args.get("project")
        if not project_id or not project_id.isdigit():
            return {"message": "Project id is required!"}, 400

        project = Project.get_by_id(project_id)
        if not project:
            return {"message": "Project does not exist!"}, 404
        # checklist = [
        #     p.project_id for p in project.teams if p.team_id in user_teams
        # ]
        # if int(project_id) not in checklist:
        #     return {"message": "Not authorized"}, 401

        return f(*args, **kwargs)

    return decorated_function
