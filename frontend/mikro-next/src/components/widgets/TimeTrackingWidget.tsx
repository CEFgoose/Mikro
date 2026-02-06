"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select, SelectOption } from "@/components/ui/Select";

interface TimeTrackingWidgetProps {
  projects?: { id: number; name: string }[];
  onClockIn?: (projectId: number, taskCategory: string) => void;
  onClockOut?: () => void;
}

const TASK_CATEGORIES: SelectOption[] = [
  { value: "mapping", label: "Mapping" },
  { value: "validation", label: "Validation" },
  { value: "review", label: "Review" },
  { value: "training", label: "Training" },
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
  onClockIn,
  onClockOut,
}: TimeTrackingWidgetProps) {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState(false);

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

  const handleClockIn = useCallback(() => {
    if (!selectedProject || !selectedCategory) return;

    const now = new Date();
    setClockInTime(now);
    setIsClockedIn(true);
    setElapsedSeconds(0);

    onClockIn?.(parseInt(selectedProject), selectedCategory);
  }, [selectedProject, selectedCategory, onClockIn]);

  const handleClockOut = useCallback(() => {
    setIsClockedIn(false);
    setShowConfirmation(true);
    onClockOut?.();

    // Hide confirmation after 3 seconds
    setTimeout(() => {
      setShowConfirmation(false);
      setClockInTime(null);
      setElapsedSeconds(0);
    }, 3000);
  }, [onClockOut]);

  const projectOptions: SelectOption[] = projects.map((p) => ({
    value: p.id.toString(),
    label: p.name,
  }));

  // Clocked in state - show timer
  if (isClockedIn) {
    const selectedProjectName = projects.find(
      (p) => p.id.toString() === selectedProject
    )?.name;
    const selectedCategoryLabel = TASK_CATEGORIES.find(
      (c) => c.value === selectedCategory
    )?.label;

    return (
      <Card className="border-green-500 bg-green-50 dark:bg-green-950">
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
            <div className="text-4xl font-mono font-bold text-green-700 dark:text-green-300 mb-2">
              {formatElapsedTime(elapsedSeconds)}
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              {selectedProjectName}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {selectedCategoryLabel}
            </p>
            <Button
              variant="destructive"
              onClick={handleClockOut}
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
              Clock Out
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Confirmation state
  if (showConfirmation) {
    return (
      <Card className="border-blue-500 bg-blue-50 dark:bg-blue-900">
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
    <Card>
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
          <Select
            label="Project"
            options={projectOptions}
            value={selectedProject}
            onChange={setSelectedProject}
            placeholder="Select a project"
          />
          <Select
            label="Task Category"
            options={TASK_CATEGORIES}
            value={selectedCategory}
            onChange={setSelectedCategory}
            placeholder="Select category"
          />
          <Button
            variant="primary"
            onClick={handleClockIn}
            disabled={!selectedProject || !selectedCategory}
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
            Clock In
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
