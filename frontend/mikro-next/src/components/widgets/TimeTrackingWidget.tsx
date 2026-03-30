"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select, SelectOption } from "@/components/ui/Select";
import {
  useClockIn,
  useClockOut,
  useActiveTimeSession,
  useApiCall,
  useCustomTopics,
} from "@/hooks";

interface TimeTrackingWidgetProps {
  projects?: { id: number; name: string; short_name?: string }[];
}

const TOPIC_OPTIONS: SelectOption[] = [
  { value: "editing", label: "Editing" },
  { value: "validating", label: "Validating" },
  { value: "training", label: "Training" },
  { value: "checklist", label: "Checklist" },
  { value: "qc_review", label: "QC / Review" },
  { value: "meeting", label: "Meeting" },
  { value: "documentation", label: "Documentation" },
  { value: "imagery_capture", label: "Imagery Capture" },
  { value: "other", label: "Other" },
];

function formatElapsedTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function TimeTrackingWidget({
  projects = [],
}: TimeTrackingWidgetProps) {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [taskName, setTaskName] = useState<string>("");
  const [taskRefType, setTaskRefType] = useState<string | null>(null);
  const [taskRefId, setTaskRefId] = useState<number | null>(null);
  const [customTopicInput, setCustomTopicInput] = useState<string>("");
  const [isAddingCustomTopic, setIsAddingCustomTopic] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeSessionProjectName, setActiveSessionProjectName] = useState<string>("");
  const [activeSessionTopic, setActiveSessionTopic] = useState<string>("");
  const [activeSessionTaskName, setActiveSessionTaskName] = useState<string>("");

  const { data: activeSession, loading: sessionLoading, refetch: refetchSession } = useActiveTimeSession();
  const { mutate: clockIn, loading: clockingIn } = useClockIn();
  const { mutate: clockOut, loading: clockingOut } = useClockOut();

  // Lazy-loaded data for training and checklist topics
  const {
    data: trainingData,
    refetch: fetchTrainings,
  } = useApiCall<{
    status: number;
    mapping_trainings: Array<{ id: number; title: string }>;
    validation_trainings: Array<{ id: number; title: string }>;
    project_trainings: Array<{ id: number; title: string }>;
  }>("/training/fetch_user_trainings", { immediate: false });

  const {
    data: checklistData,
    refetch: fetchChecklists,
  } = useApiCall<{
    status: number;
    user_started_checklists: Array<{ id: number; name: string }>;
    user_available_checklists: Array<{ id: number; name: string }>;
  }>("/checklist/fetch_user_checklists", { immediate: false });

  const { data: customTopicsData } = useCustomTopics();

  // Listen for sync events from sidebar clock or other instances
  useEffect(() => {
    const handler = () => {
      refetchSession().catch(() => {});
    };
    window.addEventListener("clock-state-changed", handler);
    return () => window.removeEventListener("clock-state-changed", handler);
  }, [refetchSession]);

  // Restore active session on mount
  useEffect(() => {
    if (activeSession?.session) {
      const session = activeSession.session;
      setIsClockedIn(true);
      setClockInTime(new Date(session.clockIn!));
      setActiveSessionProjectName(session.projectName || "");
      setActiveSessionTopic(session.category || "");
      setActiveSessionTaskName(session.taskName || "");
      if (session.projectId) {
        setSelectedProject(session.projectId.toString());
      }
    }
  }, [activeSession]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isClockedIn && clockInTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - clockInTime.getTime()) / 1000);
        setElapsedSeconds(diff);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isClockedIn, clockInTime]);

  // Lazy-load training/checklist data when topic changes
  useEffect(() => {
    if (selectedTopic === "training") {
      fetchTrainings().catch(() => {});
    } else if (selectedTopic === "checklist") {
      fetchChecklists().catch(() => {});
    }
  }, [selectedTopic, fetchTrainings, fetchChecklists]);

  // Reset task and project fields when topic changes
  useEffect(() => {
    setTaskName("");
    setTaskRefType(null);
    setTaskRefId(null);
    setCustomTopicInput("");
    setIsAddingCustomTopic(false);
    if (!["editing", "validating", "qc_review"].includes(selectedTopic)) {
      setSelectedProject("");
    }
  }, [selectedTopic]);

  const handleClockIn = useCallback(async () => {
    if (!selectedTopic) return;
    const needsProject = ["editing", "validating", "qc_review"].includes(selectedTopic);
    if (needsProject && !selectedProject) return;
    setApiError(null);

    try {
      await clockIn({
        project_id: selectedProject ? parseInt(selectedProject) : null,
        category: selectedTopic,
        task_name: taskName || null,
        task_ref_type: taskRefType || null,
        task_ref_id: taskRefId || null,
      });

      const now = new Date();
      setClockInTime(now);
      setIsClockedIn(true);
      setElapsedSeconds(0);
      setActiveSessionProjectName(
        projects.find((p) => p.id.toString() === selectedProject)?.name || ""
      );
      setActiveSessionTopic(
        TOPIC_OPTIONS.find((t) => t.value === selectedTopic)?.label || ""
      );
      setActiveSessionTaskName(taskName || "");
      window.dispatchEvent(new Event("clock-state-changed"));
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to clock in");
    }
  }, [selectedProject, selectedTopic, taskName, taskRefType, taskRefId, clockIn, projects]);

  const handleClockOut = useCallback(async () => {
    setApiError(null);

    try {
      await clockOut({});

      setIsClockedIn(false);
      setShowConfirmation(true);
      window.dispatchEvent(new Event("clock-state-changed"));

      // Hide confirmation after 3 seconds
      setTimeout(() => {
        setShowConfirmation(false);
        setClockInTime(null);
        setElapsedSeconds(0);
      }, 3000);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to clock out");
    }
  }, [clockOut]);

  // Handle task selection for training
  const handleTrainingSelect = useCallback(
    (trainingId: string) => {
      const allTrainings = [
        ...(trainingData?.mapping_trainings || []),
        ...(trainingData?.validation_trainings || []),
        ...(trainingData?.project_trainings || []),
      ];
      const training = allTrainings.find(
        (t) => t.id.toString() === trainingId
      );
      setTaskRefType("training");
      setTaskRefId(training ? training.id : null);
      setTaskName(training ? training.title : "");
    },
    [trainingData]
  );

  // Handle task selection for checklist
  const handleChecklistSelect = useCallback(
    (checklistId: string) => {
      const allChecklists = [
        ...(checklistData?.user_started_checklists || []),
        ...(checklistData?.user_available_checklists || []),
      ];
      const checklist = allChecklists.find(
        (c) => c.id.toString() === checklistId
      );
      setTaskRefType("checklist");
      setTaskRefId(checklist ? checklist.id : null);
      setTaskName(checklist ? checklist.name : "");
    },
    [checklistData]
  );

  // Handle custom topic selection
  const handleCustomTopicSelect = useCallback(
    (value: string) => {
      if (value === "__add_new__") {
        setIsAddingCustomTopic(true);
        setTaskName("");
        setTaskRefType(null);
        setTaskRefId(null);
      } else {
        setIsAddingCustomTopic(false);
        const topic = customTopicsData?.topics?.find(
          (t) => t.id.toString() === value
        );
        setTaskName(topic ? topic.name : "");
        setTaskRefType(null);
        setTaskRefId(topic ? topic.id : null);
      }
    },
    [customTopicsData]
  );

  const projectOptions: SelectOption[] = projects.map((p) => ({
    value: p.id.toString(),
    label: p.short_name || p.name,
  }));

  const trainingOptions: SelectOption[] = [
    ...(trainingData?.mapping_trainings || []),
    ...(trainingData?.validation_trainings || []),
    ...(trainingData?.project_trainings || []),
  ].map((t) => ({
    value: t.id.toString(),
    label: t.title,
  }));

  const checklistOptions: SelectOption[] = [
    ...(checklistData?.user_started_checklists || []),
    ...(checklistData?.user_available_checklists || []),
  ].map((c) => ({
    value: c.id.toString(),
    label: c.name,
  }));

  const customTopicOptions: SelectOption[] = [
    ...(customTopicsData?.topics || []).map((t) => ({
      value: t.id.toString(),
      label: t.name,
    })),
    { value: "__add_new__", label: "Add new..." },
  ];

  // Render the task selector based on the selected topic
  const renderTaskSelector = () => {
    if (!selectedTopic) return null;

    // Project-based topics — no task selector needed, project already selected above
    if (["editing", "validating", "qc_review"].includes(selectedTopic)) {
      return null;
    }

    // Training
    if (selectedTopic === "training") {
      return (
        <Select
          label="Training Module"
          options={trainingOptions}
          value={taskRefId ? taskRefId.toString() : ""}
          onChange={handleTrainingSelect}
          placeholder="Select training (optional)"
        />
      );
    }

    // Checklist
    if (selectedTopic === "checklist") {
      return (
        <Select
          label="Checklist"
          options={checklistOptions}
          value={taskRefId ? taskRefId.toString() : ""}
          onChange={handleChecklistSelect}
          placeholder="Select checklist (optional)"
        />
      );
    }

    // Free-text topics
    if (["meeting", "documentation", "imagery_capture"].includes(selectedTopic)) {
      return (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Task Name
          </label>
          <input
            type="text"
            value={taskName}
            onChange={(e) => {
              setTaskName(e.target.value);
              setTaskRefType(null);
              setTaskRefId(null);
            }}
            placeholder="Describe the task (optional)"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      );
    }

    // Other - custom topics
    if (selectedTopic === "other") {
      return (
        <div>
          {!isAddingCustomTopic ? (
            <Select
              label="Custom Topic"
              options={customTopicOptions}
              value={taskRefId ? taskRefId.toString() : ""}
              onChange={handleCustomTopicSelect}
              placeholder="Select topic or add new (optional)"
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                New Topic
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTopicInput}
                  onChange={(e) => {
                    setCustomTopicInput(e.target.value);
                    setTaskName(e.target.value);
                    setTaskRefType(null);
                    setTaskRefId(null);
                  }}
                  placeholder="Enter topic name"
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCustomTopic(false);
                    setCustomTopicInput("");
                    setTaskName("");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // Loading state while checking for active session
  if (sessionLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <svg
              className="w-5 h-5 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Time Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  // Clocked in state - show timer
  if (isClockedIn) {
    return (
      <Card className="border-green-500 border-2 h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Time Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-green-600 dark:text-green-400 mb-2">
              {formatElapsedTime(elapsedSeconds)}
            </div>
            <p className="text-sm font-medium mb-1">
              {activeSessionProjectName}
            </p>
            <p className="text-xs text-muted-foreground mb-1">
              {activeSessionTopic}
            </p>
            {activeSessionTaskName && (
              <p className="text-xs text-muted-foreground mb-4">
                {activeSessionTaskName}
              </p>
            )}
            {!activeSessionTaskName && <div className="mb-4" />}
            {apiError && (
              <p className="text-xs text-red-600 mb-2">{apiError}</p>
            )}
            <Button
              variant="destructive"
              onClick={handleClockOut}
              disabled={clockingOut}
              className="w-full"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 10h6v4H9z"
                />
              </svg>
              {clockingOut ? "Clocking Out..." : "Clock Out"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Confirmation state
  if (showConfirmation) {
    return (
      <Card className="border-blue-500 bg-blue-50 dark:bg-blue-900 h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-blue-900 dark:text-blue-100">Time Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <svg
              className="w-12 h-12 mx-auto text-blue-600 dark:text-blue-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="font-medium text-blue-800 dark:text-blue-100">
              Time logged successfully!
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
              Total: {formatElapsedTime(elapsedSeconds)}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default state - clock in form
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <svg
            className="w-5 h-5 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Time Tracking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {apiError && (
            <p className="text-xs text-red-600">{apiError}</p>
          )}
          <Select
            label="Topic"
            options={TOPIC_OPTIONS}
            value={selectedTopic}
            onChange={setSelectedTopic}
            placeholder="Select topic"
          />
          {selectedTopic && ["editing", "validating", "qc_review"].includes(selectedTopic) && (
            <Select
              label="Project"
              options={projectOptions}
              value={selectedProject}
              onChange={setSelectedProject}
              placeholder="Select a project"
            />
          )}
          {renderTaskSelector()}
          <Button
            variant="primary"
            onClick={handleClockIn}
            disabled={!selectedTopic || (["editing", "validating", "qc_review"].includes(selectedTopic) && !selectedProject) || clockingIn}
            className="w-full mt-2"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {clockingIn ? "Clocking In..." : "Clock In"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
