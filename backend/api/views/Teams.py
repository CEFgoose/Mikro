#!/usr/bin/env python3
"""
Team API endpoints for Mikro.

Handles team management operations: CRUD and membership.
"""

from flask.views import MethodView
from flask import g, request

from ..utils import requires_admin
from ..database import Team, TeamUser, User, ProjectTeam, ProjectUser, Project, TeamTraining, Training


class TeamAPI(MethodView):
    """Team management API endpoints."""

    def post(self, path: str):
        if path == "fetch_teams":
            return self.fetch_teams()
        elif path == "create_team":
            return self.create_team()
        elif path == "update_team":
            return self.update_team()
        elif path == "delete_team":
            return self.delete_team()
        elif path == "fetch_team_members":
            return self.fetch_team_members()
        elif path == "assign_team_member":
            return self.assign_team_member()
        elif path == "unassign_team_member":
            return self.unassign_team_member()
        elif path == "fetch_project_teams":
            return self.fetch_project_teams()
        elif path == "assign_team_to_project":
            return self.assign_team_to_project()
        elif path == "unassign_team_from_project":
            return self.unassign_team_from_project()
        elif path == "fetch_team_trainings":
            return self.fetch_team_trainings()
        elif path == "assign_training_to_team":
            return self.assign_training_to_team()
        elif path == "unassign_training_from_team":
            return self.unassign_training_from_team()
        return {"message": "Unknown path", "status": 404}

    @requires_admin
    def fetch_teams(self):
        """List all teams for the org with member counts."""
        if not g.user:
            return {"message": "Missing user info", "status": 304}

        org_teams = Team.query.filter_by(org_id=g.user.org_id).all()

        teams = []
        for team in org_teams:
            member_count = TeamUser.query.filter_by(team_id=team.id).count()

            lead_name = None
            if team.lead_id:
                lead_user = User.query.get(team.lead_id)
                if lead_user:
                    lead_name = f"{lead_user.first_name or ''} {lead_user.last_name or ''}".strip() or lead_user.email

            teams.append({
                "id": team.id,
                "name": team.name,
                "description": team.description,
                "lead_id": team.lead_id,
                "lead_name": lead_name,
                "member_count": member_count,
                "created_at": team.created_at.isoformat() if team.created_at else None,
            })

        return {"teams": teams, "status": 200}

    @requires_admin
    def create_team(self):
        """Create a new team."""
        if not g.user:
            return {"message": "Missing user info", "status": 304}

        team_name = request.json.get("teamName")
        if not team_name:
            return {"message": "teamName required", "status": 400}

        team_description = request.json.get("teamDescription")
        lead_id = request.json.get("leadId")

        team = Team.create(
            name=team_name,
            description=team_description,
            org_id=g.user.org_id,
            lead_id=lead_id,
        )

        return {
            "message": "Team created",
            "team": {
                "id": team.id,
                "name": team.name,
                "description": team.description,
                "lead_id": team.lead_id,
            },
            "status": 200,
        }

    @requires_admin
    def update_team(self):
        """Update team name, description, or lead."""
        if not g.user:
            return {"message": "Missing user info", "status": 304}

        team_id = request.json.get("teamId")
        if not team_id:
            return {"message": "teamId required", "status": 400}

        team = Team.query.filter_by(id=team_id, org_id=g.user.org_id).first()
        if not team:
            return {"message": f"Team {team_id} not found", "status": 400}

        updates = {}
        if "teamName" in request.json:
            updates["name"] = request.json["teamName"]
        if "teamDescription" in request.json:
            updates["description"] = request.json["teamDescription"]
        if "leadId" in request.json:
            updates["lead_id"] = request.json["leadId"]

        if updates:
            team.update(**updates)

        return {"message": "Team updated", "status": 200}

    @requires_admin
    def delete_team(self):
        """Soft-delete a team and remove all member associations."""
        if not g.user:
            return {"message": "Missing user info", "status": 304}

        team_id = request.json.get("teamId")
        if not team_id:
            return {"message": "teamId required", "status": 400}

        team = Team.query.filter_by(id=team_id, org_id=g.user.org_id).first()
        if not team:
            return {"message": f"Team {team_id} not found", "status": 400}

        # Remove all team member associations
        team_users = TeamUser.query.filter_by(team_id=team_id).all()
        for tu in team_users:
            tu.delete(soft=False)

        # Soft-delete the team
        team.delete(soft=True)

        return {"message": "Team deleted", "status": 200}

    @requires_admin
    def fetch_team_members(self):
        """Get all org users with their assignment status for a team."""
        if not g.user:
            return {"message": "Missing user info", "status": 304}

        team_id = request.json.get("teamId")
        if not team_id:
            return {"message": "teamId required", "status": 400}

        team = Team.query.filter_by(id=team_id, org_id=g.user.org_id).first()
        if not team:
            return {"message": f"Team {team_id} not found", "status": 400}

        # Get all assigned user IDs for this team
        assigned_ids = {
            tu.user_id
            for tu in TeamUser.query.filter_by(team_id=team_id).all()
        }

        # Get all org users
        org_users = User.query.filter_by(org_id=g.user.org_id).all()

        users = []
        for user in org_users:
            name = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email
            users.append({
                "id": user.id,
                "name": name,
                "email": user.email,
                "role": user.role,
                "assigned": "Assigned" if user.id in assigned_ids else "Not Assigned",
            })

        return {"users": users, "status": 200}

    @requires_admin
    def assign_team_member(self):
        """Add a user to a team (idempotent)."""
        if not g.user:
            return {"message": "Missing user info", "status": 304}

        team_id = request.json.get("teamId")
        user_id = request.json.get("userId")
        if not team_id:
            return {"message": "teamId required", "status": 400}
        if not user_id:
            return {"message": "userId required", "status": 400}

        team = Team.query.filter_by(id=team_id, org_id=g.user.org_id).first()
        if not team:
            return {"message": f"Team {team_id} not found", "status": 400}

        # Check if already assigned
        existing = TeamUser.query.filter_by(
            team_id=team_id, user_id=user_id
        ).first()
        if not existing:
            TeamUser.create(team_id=team_id, user_id=user_id)

        return {"message": "User assigned to team", "status": 200}

    @requires_admin
    def unassign_team_member(self):
        """Remove a user from a team."""
        if not g.user:
            return {"message": "Missing user info", "status": 304}

        team_id = request.json.get("teamId")
        user_id = request.json.get("userId")
        if not team_id:
            return {"message": "teamId required", "status": 400}
        if not user_id:
            return {"message": "userId required", "status": 400}

        relation = TeamUser.query.filter_by(
            team_id=team_id, user_id=user_id
        ).first()
        if relation:
            relation.delete(soft=False)

        return {"message": "User removed from team", "status": 200}

    @requires_admin
    def fetch_project_teams(self):
        """Get all org teams with their assignment status for a project."""
        if not g.user:
            return {"message": "Missing user info", "status": 304}

        project_id = request.json.get("projectId")
        if not project_id:
            return {"message": "projectId required", "status": 400}

        project = Project.query.filter_by(
            id=project_id, org_id=g.user.org_id
        ).first()
        if not project:
            return {"message": f"Project {project_id} not found", "status": 400}

        org_teams = Team.query.filter_by(org_id=g.user.org_id).all()
        assigned_team_ids = {
            pt.team_id
            for pt in ProjectTeam.query.filter_by(project_id=project_id).all()
        }

        teams = []
        for team in org_teams:
            member_count = TeamUser.query.filter_by(team_id=team.id).count()
            lead_name = None
            if team.lead_id:
                lead_user = User.query.get(team.lead_id)
                if lead_user:
                    lead_name = (
                        f"{lead_user.first_name or ''} {lead_user.last_name or ''}".strip()
                        or lead_user.email
                    )
            teams.append({
                "id": team.id,
                "name": team.name,
                "member_count": member_count,
                "lead_name": lead_name,
                "assigned": "Assigned" if team.id in assigned_team_ids else "Not Assigned",
            })

        return {"teams": teams, "status": 200}

    @requires_admin
    def assign_team_to_project(self):
        """Assign a team to a project, bulk-creating ProjectUser rows."""
        if not g.user:
            return {"message": "Missing user info", "status": 304}

        team_id = request.json.get("teamId")
        project_id = request.json.get("projectId")
        if not team_id:
            return {"message": "teamId required", "status": 400}
        if not project_id:
            return {"message": "projectId required", "status": 400}

        team = Team.query.filter_by(id=team_id, org_id=g.user.org_id).first()
        if not team:
            return {"message": f"Team {team_id} not found", "status": 400}

        project = Project.query.filter_by(
            id=project_id, org_id=g.user.org_id
        ).first()
        if not project:
            return {"message": f"Project {project_id} not found", "status": 400}

        # Create ProjectTeam row if not exists (idempotent)
        existing_pt = ProjectTeam.query.filter_by(
            team_id=team_id, project_id=project_id
        ).first()
        if not existing_pt:
            ProjectTeam.create(team_id=team_id, project_id=project_id)

        # Bulk-assign all team members to the project
        team_members = TeamUser.query.filter_by(team_id=team_id).all()
        assigned = 0
        skipped = 0
        for tm in team_members:
            existing_pu = ProjectUser.query.filter_by(
                user_id=tm.user_id, project_id=project_id
            ).first()
            if existing_pu:
                skipped += 1
            else:
                ProjectUser.create(user_id=tm.user_id, project_id=project_id)
                assigned += 1

        return {
            "message": "Team assigned to project",
            "assigned": assigned,
            "skipped": skipped,
            "status": 200,
        }

    @requires_admin
    def unassign_team_from_project(self):
        """Remove a team from a project, bulk-removing ProjectUser rows."""
        if not g.user:
            return {"message": "Missing user info", "status": 304}

        team_id = request.json.get("teamId")
        project_id = request.json.get("projectId")
        if not team_id:
            return {"message": "teamId required", "status": 400}
        if not project_id:
            return {"message": "projectId required", "status": 400}

        # Remove ProjectTeam row
        pt = ProjectTeam.query.filter_by(
            team_id=team_id, project_id=project_id
        ).first()
        if pt:
            pt.delete(soft=False)

        # Bulk-remove all team members from the project
        team_members = TeamUser.query.filter_by(team_id=team_id).all()
        removed = 0
        for tm in team_members:
            pu = ProjectUser.query.filter_by(
                user_id=tm.user_id, project_id=project_id
            ).first()
            if pu:
                pu.delete(soft=False)
                removed += 1

        return {
            "message": "Team removed from project",
            "removed": removed,
            "status": 200,
        }

    @requires_admin
    def fetch_team_trainings(self):
        """Get all org trainings with their assignment status for a team."""
        if not g.user:
            return {"message": "Missing user info", "status": 304}

        team_id = request.json.get("teamId")
        if not team_id:
            return {"message": "teamId required", "status": 400}

        team = Team.query.filter_by(id=team_id, org_id=g.user.org_id).first()
        if not team:
            return {"message": f"Team {team_id} not found", "status": 400}

        assigned_ids = {
            tt.training_id
            for tt in TeamTraining.query.filter_by(team_id=team_id).all()
        }

        org_trainings = Training.query.filter_by(org_id=g.user.org_id).all()

        trainings = []
        for t in org_trainings:
            trainings.append({
                "id": t.id,
                "title": t.title,
                "training_type": t.training_type,
                "difficulty": t.difficulty,
                "point_value": t.point_value,
                "assigned": "Assigned" if t.id in assigned_ids else "Not Assigned",
            })

        return {"trainings": trainings, "status": 200}

    @requires_admin
    def assign_training_to_team(self):
        """Assign a training to a team (idempotent)."""
        if not g.user:
            return {"message": "Missing user info", "status": 304}

        team_id = request.json.get("teamId")
        training_id = request.json.get("trainingId")
        if not team_id:
            return {"message": "teamId required", "status": 400}
        if not training_id:
            return {"message": "trainingId required", "status": 400}

        team = Team.query.filter_by(id=team_id, org_id=g.user.org_id).first()
        if not team:
            return {"message": f"Team {team_id} not found", "status": 400}

        existing = TeamTraining.query.filter_by(
            team_id=team_id, training_id=training_id
        ).first()
        if not existing:
            TeamTraining.create(team_id=team_id, training_id=training_id)

        return {"message": "Training assigned to team", "status": 200}

    @requires_admin
    def unassign_training_from_team(self):
        """Remove a training from a team."""
        if not g.user:
            return {"message": "Missing user info", "status": 304}

        team_id = request.json.get("teamId")
        training_id = request.json.get("trainingId")
        if not team_id:
            return {"message": "teamId required", "status": 400}
        if not training_id:
            return {"message": "trainingId required", "status": 400}

        relation = TeamTraining.query.filter_by(
            team_id=team_id, training_id=training_id
        ).first()
        if relation:
            relation.delete(soft=False)

        return {"message": "Training removed from team", "status": 200}
