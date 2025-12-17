"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { Training } from "@/types";

interface UserTraining extends Training {
  completed?: boolean;
  score?: number;
}

export default function UserTrainingPage() {
  const [mappingTrainings, setMappingTrainings] = useState<UserTraining[]>([]);
  const [validationTrainings, setValidationTrainings] = useState<UserTraining[]>([]);
  const [projectTrainings, setProjectTrainings] = useState<UserTraining[]>([]);
  const [selectedTraining, setSelectedTraining] = useState<UserTraining | null>(null);
  const [activeTab, setActiveTab] = useState<"mapping" | "validation" | "project">("mapping");
  const [isLoading, setIsLoading] = useState(true);
  const [showTrainingModal, setShowTrainingModal] = useState(false);

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      const response = await fetch("/api/backend/training/fetch_user_trainings");
      if (response.ok) {
        const data = await response.json();
        setMappingTrainings(data.mapping_trainings || []);
        setValidationTrainings(data.validation_trainings || []);
        setProjectTrainings(data.project_trainings || []);
      }
    } catch (error) {
      console.error("Failed to fetch trainings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTraining = (training: UserTraining) => {
    setSelectedTraining(training);
    setShowTrainingModal(true);
  };

  const getCurrentTrainings = (): UserTraining[] => {
    switch (activeTab) {
      case "mapping":
        return mappingTrainings;
      case "validation":
        return validationTrainings;
      case "project":
        return projectTrainings;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kaart-orange" />
      </div>
    );
  }

  const currentTrainings = getCurrentTrainings();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Training</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("mapping")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "mapping"
              ? "text-kaart-orange border-b-2 border-kaart-orange"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Mapping ({mappingTrainings.length})
        </button>
        <button
          onClick={() => setActiveTab("validation")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "validation"
              ? "text-kaart-orange border-b-2 border-kaart-orange"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Validation ({validationTrainings.length})
        </button>
        <button
          onClick={() => setActiveTab("project")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "project"
              ? "text-kaart-orange border-b-2 border-kaart-orange"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Project Specific ({projectTrainings.length})
        </button>
      </div>

      {/* Training Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {currentTrainings.map((training) => (
          <Card
            key={training.id}
            className={`transition-all ${
              training.completed ? "border-green-500 bg-green-50/50" : ""
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{training.title}</CardTitle>
                {training.completed && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                    Completed
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Difficulty:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      training.difficulty === "Easy"
                        ? "bg-green-100 text-green-800"
                        : training.difficulty === "Medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {training.difficulty}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Points:</span>
                  <span>{training.point_value}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Questions:</span>
                  <span>{training.questions?.length ?? 0}</span>
                </div>
                {training.completed && training.score !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your Score:</span>
                    <span className="font-medium">{training.score}%</span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <a
                  href={training.training_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-2 px-4 border border-input rounded-lg hover:bg-muted transition-colors text-sm"
                >
                  View Material
                </a>
                <Button
                  onClick={() => handleStartTraining(training)}
                  className="flex-1"
                  disabled={training.completed}
                >
                  {training.completed ? "Completed" : "Take Quiz"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {currentTrainings.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No {activeTab} trainings available
          </div>
        )}
      </div>

      {/* Training Modal */}
      {showTrainingModal && selectedTraining && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{selectedTraining.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Complete the training material before taking the quiz.
              </p>
              <a
                href={selectedTraining.training_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center py-2 px-4 border border-input rounded-lg hover:bg-muted transition-colors"
              >
                Open Training Material
              </a>
              <div className="border-t border-border pt-4">
                <h3 className="font-medium mb-4">Quiz</h3>
                {selectedTraining.questions?.map((question, qIndex) => (
                  <div key={question.id} className="mb-4">
                    <p className="font-medium mb-2">
                      {qIndex + 1}. {question.question}
                    </p>
                    <div className="space-y-2 ml-4">
                      {question.answers.map((answer) => (
                        <label
                          key={answer.id}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            className="h-4 w-4 text-kaart-orange focus:ring-kaart-orange"
                          />
                          <span>{answer.answer}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {(!selectedTraining.questions || selectedTraining.questions.length === 0) && (
                  <p className="text-muted-foreground">No quiz questions for this training.</p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowTrainingModal(false)}>
                  Cancel
                </Button>
                <Button>Submit Quiz</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
