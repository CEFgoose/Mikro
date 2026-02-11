"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useFetchTeamProfile } from "@/hooks/useApi";
import type { TeamProfileData } from "@/types";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminTeamProfilePage() {
  const params = useParams();
  const teamId = Number(params.id);

  const { mutate: fetchProfile, loading: profileLoading, error: profileError } =
    useFetchTeamProfile();

  const [profile, setProfile] = useState<TeamProfileData | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (teamId) {
      fetchProfile({ teamId })
        .then((res) => {
          if (res?.team) setProfile(res);
        })
        .catch(() => {})
        .finally(() => setPageLoading(false));
    }
  }, [teamId, fetchProfile]);

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kaart-orange" />
      </div>
    );
  }

  if (profileError && !profile) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/teams"
          className="text-kaart-orange hover:underline text-sm"
        >
          &larr; Back to Teams
        </Link>
        <Card>
          <CardContent className="p-8 text-center text-red-500">
            Failed to load team profile: {profileError}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) return null;

  const { team, members, aggregated_stats, projects, assigned_trainings, assigned_checklists } = profile;

  return (
    <div className="space-y-6">
      {/* Section 1: Header */}
      <Card>
        <CardContent className="p-6">
          <Link
            href="/admin/teams"
            className="text-kaart-orange hover:underline text-sm mb-4 inline-block"
          >
            &larr; Back to Teams
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-kaart-orange/20 flex items-center justify-center text-kaart-orange text-xl font-bold shrink-0">
              {team.name?.[0]?.toUpperCase() || "T"}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
              {team.description && (
                <p className="text-muted-foreground mt-1">{team.description}</p>
              )}
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2 flex-wrap">
                {team.lead_name && (
                  <span>
                    Lead: <span className="font-medium text-foreground">{team.lead_name}</span>
                  </span>
                )}
                <span>
                  Members: <span className="font-medium text-foreground">{team.member_count}</span>
                </span>
                {team.created_at && (
                  <span>Created: {formatDate(team.created_at)}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Aggregated All-Time Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Tasks Mapped" value={aggregated_stats.total_tasks_mapped} />
        <StatCard label="Tasks Validated" value={aggregated_stats.total_tasks_validated} />
        <StatCard label="Tasks Invalidated" value={aggregated_stats.total_tasks_invalidated} />
        <StatCard label="Checklists Completed" value={aggregated_stats.total_checklists_completed} />
      </div>

      {/* Section 3: Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Mapping</p>
              <p className="text-lg font-semibold">
                ${(aggregated_stats.mapping_payable_total ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Validation</p>
              <p className="text-lg font-semibold">
                ${(aggregated_stats.validation_payable_total ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Checklists</p>
              <p className="text-lg font-semibold">
                ${(aggregated_stats.checklist_payable_total ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Payable</p>
              <p className="text-lg font-semibold text-green-600">
                ${(aggregated_stats.payable_total ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Requested</p>
              <p className="text-lg font-semibold text-yellow-600">
                ${(aggregated_stats.requested_total ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-lg font-semibold text-blue-600">
                ${(aggregated_stats.paid_total ?? 0).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Members Table */}
      {members.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Members ({members.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">OSM Username</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Mapped</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Validated</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Invalidated</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/users/${encodeURIComponent(member.id)}`}
                          className="font-medium text-kaart-orange hover:underline"
                        >
                          {member.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            member.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : member.role === "validator"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {member.osm_username || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{member.total_tasks_mapped}</td>
                      <td className="px-6 py-4 text-gray-700">{member.total_tasks_validated}</td>
                      <td className="px-6 py-4 text-gray-700">{member.total_tasks_invalidated ?? 0}</td>
                      <td className="px-6 py-4 text-gray-700">
                        ${(member.payable_total ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 5: Team Projects Table */}
      {projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Projects ({projects.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Project</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Team Mapped</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Team Validated</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Team Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {projects.map((proj) => (
                    <tr key={proj.id}>
                      <td className="px-6 py-4">
                        {proj.url ? (
                          <a
                            href={proj.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-kaart-orange hover:underline"
                          >
                            {proj.name}
                          </a>
                        ) : (
                          <span className="font-medium text-gray-900">{proj.name}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{proj.team_tasks_mapped}</td>
                      <td className="px-6 py-4 text-gray-700">{proj.team_tasks_validated}</td>
                      <td className="px-6 py-4 text-gray-700">
                        ${(proj.team_earnings ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 6: Assigned Trainings */}
      {assigned_trainings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assigned Trainings ({assigned_trainings.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Difficulty</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {assigned_trainings.map((training) => (
                    <tr key={training.id}>
                      <td className="px-6 py-4 font-medium text-gray-900">{training.title}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {training.training_type || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            training.difficulty === "Hard"
                              ? "bg-red-100 text-red-800"
                              : training.difficulty === "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {training.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{training.point_value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 7: Assigned Checklists */}
      {assigned_checklists.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assigned Checklists ({assigned_checklists.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Difficulty</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {assigned_checklists.map((checklist) => (
                    <tr key={checklist.id}>
                      <td className="px-6 py-4 font-medium text-gray-900">{checklist.name}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            checklist.difficulty === "Hard"
                              ? "bg-red-100 text-red-800"
                              : checklist.difficulty === "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {checklist.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            checklist.active_status
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {checklist.active_status ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
