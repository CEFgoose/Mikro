"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import {
  useSyncCommunitySheet,
  useFetchCommunityEntries,
  useFetchChannels,
  useAddChannel,
  useRemoveChannel,
  useFetchChannelContent,
  useSummarizeChannel,
  useFetchAllSummaries,
} from "@/hooks/useApi";
import type { CommunityEntry } from "@/types";
import { StatCard } from "./StatCard";

export function CommunityTab() {
  const [communityEntries, setCommunityEntries] = useState<CommunityEntry[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
  const [channelSummaries, setChannelSummaries] = useState<
    Array<{
      id: number;
      name: string;
      summary: string | null;
      summary_date: string | null;
      post_count: number;
      last_fetched: string | null;
    }>
  >([]);
  const [refreshingChannelId, setRefreshingChannelId] = useState<number | null>(null);
  const [showManageChannels, setShowManageChannels] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelUrl, setNewChannelUrl] = useState("");

  const { mutate: syncCommunitySheet, loading: communitySyncLoading } = useSyncCommunitySheet();
  const { mutate: fetchCommunityEntries } = useFetchCommunityEntries();
  const { data: channelsData, refetch: refetchChannels } = useFetchChannels();
  const { mutate: addChannel } = useAddChannel();
  const { mutate: removeChannel } = useRemoveChannel();
  const { mutate: fetchChannelContent } = useFetchChannelContent();
  const { mutate: summarizeChannel } = useSummarizeChannel();
  const { mutate: fetchAllSummaries } = useFetchAllSummaries();

  const handleSync = async () => {
    try {
      await syncCommunitySheet({});
      setCommunityLoading(true);
      const result = await fetchCommunityEntries({});
      if (result?.entries) setCommunityEntries(result.entries);
      setCommunityLoading(false);
    } catch {
      setCommunityLoading(false);
    }
  };

  const handleRefreshEntries = async () => {
    setCommunityLoading(true);
    try {
      const result = await fetchCommunityEntries({});
      if (result?.entries) setCommunityEntries(result.entries);
    } catch { /* ignore */ }
    setCommunityLoading(false);
  };

  const handleLoadSummaries = async () => {
    try {
      const result = await fetchAllSummaries({});
      if (result?.summaries) setChannelSummaries(result.summaries);
    } catch { /* ignore */ }
  };

  const handleAddChannel = async () => {
    if (!newChannelName || !newChannelUrl) return;
    try {
      await addChannel({ name: newChannelName, url: newChannelUrl, channel_type: "rss" });
      setNewChannelName("");
      setNewChannelUrl("");
      refetchChannels();
    } catch { /* ignore */ }
  };

  const handleRemoveChannel = async (channelId: number) => {
    try {
      await removeChannel({ channel_id: channelId });
      refetchChannels();
    } catch { /* ignore */ }
  };

  const handleRefreshChannel = async (channelId: number) => {
    setRefreshingChannelId(channelId);
    try {
      await fetchChannelContent({ channel_id: channelId });
      await summarizeChannel({ channel_id: channelId });
      const result = await fetchAllSummaries({});
      if (result?.summaries) setChannelSummaries(result.summaries);
    } catch { /* ignore */ }
    setRefreshingChannelId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header with sync controls */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {communityEntries.length > 0
            ? `${communityEntries.length} entries synced from Google Sheet`
            : "No community data synced yet — click Sync to pull from Google Sheet"}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={communitySyncLoading}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {communitySyncLoading ? "Syncing..." : "Sync from Sheet"}
          </button>
          <button
            onClick={handleRefreshEntries}
            disabled={communityLoading}
            className="px-3 py-1.5 rounded-lg bg-muted text-sm font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
          >
            {communityLoading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Entries" value={communityEntries.length} />
        <StatCard label="Edited" value={communityEntries.filter((e) => e.is_edited).length} />
        <StatCard
          label="Entry Types"
          value={[...new Set(communityEntries.map((e) => e.entry_type))].length}
        />
      </div>

      {/* Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Community Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {communityEntries.length > 0 ? (
            <div className="space-y-2" style={{ maxHeight: 600, overflowY: "auto" }}>
              {communityEntries.map((entry) => {
                const data = entry.edited_data || entry.original_data;
                const isExpanded = expandedEvents.has(entry.id);
                return (
                  <div
                    key={entry.id}
                    className={`border rounded-lg p-3 ${entry.is_edited ? "border-l-4 border-l-blue-500" : "border-border"}`}
                  >
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => {
                        const next = new Set(expandedEvents);
                        if (isExpanded) next.delete(entry.id);
                        else next.add(entry.id);
                        setExpandedEvents(next);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">
                          {isExpanded ? "▼" : "▶"}
                        </span>
                        <span className="text-sm font-medium">
                          {Object.values(data)[1] || Object.values(data)[0] || "Entry"}
                        </span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {entry.entry_type}
                        </span>
                        {entry.is_edited && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            Edited
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {entry.submitted_at
                          ? new Date(entry.submitted_at).toLocaleDateString()
                          : "No date"}
                      </span>
                    </div>
                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(data).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-xs text-muted-foreground">{key}:</span>
                              <p className="text-sm">{value || "—"}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No community entries. Click &quot;Sync from Sheet&quot; to import data from Google Sheets.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Channel Summaries */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Channel Summaries</CardTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadSummaries}
                className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
              >
                Load Summaries
              </button>
              <button
                onClick={() => setShowManageChannels(true)}
                className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
                title="Manage Channels"
              >
                Manage Channels
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {channelSummaries.length > 0 ? (
            <div className="space-y-3">
              {channelSummaries.map((ch) => (
                <div key={ch.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{ch.name}</span>
                      <span className="text-xs text-muted-foreground">{ch.post_count} posts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {ch.summary_date
                          ? `Summarized ${new Date(ch.summary_date).toLocaleDateString()}`
                          : "Not yet summarized"}
                      </span>
                      <button
                        onClick={() => handleRefreshChannel(ch.id)}
                        disabled={refreshingChannelId === ch.id}
                        className="text-xs px-2 py-1 rounded bg-kaart-orange text-white hover:bg-kaart-orange-dark transition-colors disabled:opacity-50"
                      >
                        {refreshingChannelId === ch.id ? "..." : "Refresh"}
                      </button>
                    </div>
                  </div>
                  {ch.summary ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{ch.summary}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No summary yet — click Refresh to fetch and summarize
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4 text-sm">
              {channelsData?.channels?.length
                ? "Click \"Load Summaries\" to view channel summaries"
                : "No channels configured. Click \"Manage Channels\" to add OSM channels to monitor."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Manage Channels Modal */}
      {showManageChannels && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Manage Channels</h3>
                <button
                  onClick={() => setShowManageChannels(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  &times;
                </button>
              </div>

              {/* Add channel form */}
              <div className="border border-border rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Add Channel</p>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="Channel name (e.g. OSM Forum - Albania)"
                  className="w-full px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-kaart-orange"
                />
                <input
                  type="text"
                  value={newChannelUrl}
                  onChange={(e) => setNewChannelUrl(e.target.value)}
                  placeholder="RSS feed URL"
                  className="w-full px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-kaart-orange"
                />
                <button
                  onClick={handleAddChannel}
                  className="px-3 py-1.5 text-sm rounded-lg bg-kaart-orange text-white hover:bg-kaart-orange-dark transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Channel list */}
              <div className="space-y-2">
                {channelsData?.channels?.map((ch) => (
                  <div
                    key={ch.id}
                    className="flex items-center justify-between p-2 border border-border rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">{ch.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-xs">{ch.url}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRemoveChannel(ch.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {(!channelsData?.channels || channelsData.channels.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No channels configured yet
                  </p>
                )}
              </div>

              <button
                onClick={() => setShowManageChannels(false)}
                className="w-full px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
