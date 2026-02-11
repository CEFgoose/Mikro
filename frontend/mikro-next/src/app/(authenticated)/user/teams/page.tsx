"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Input, Skeleton } from "@/components/ui";
import { useFetchUserTeams } from "@/hooks/useApi";

export default function UserTeamsPage() {
  const { data, loading } = useFetchUserTeams();
  const [search, setSearch] = useState("");

  const teams = data?.teams ?? [];
  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Teams</h1>
        <p className="text-muted-foreground">
          Teams you are a member of
        </p>
      </div>

      <Card>
        <CardHeader>
          <Input
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Lead</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Members</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {filteredTeams.map((team) => (
                  <tr key={team.id}>
                    <td className="px-6 py-4">
                      <Link
                        href={`/user/teams/${team.id}`}
                        className="font-medium text-kaart-orange hover:underline"
                      >
                        {team.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">
                      {team.description || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {team.lead_name || <span className="text-muted-foreground">None</span>}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-700">{team.member_count}</td>
                  </tr>
                ))}
                {filteredTeams.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      {search
                        ? "No teams match your search"
                        : "You haven't been assigned to any teams yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
