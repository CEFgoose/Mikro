"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Modal,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Skeleton,
} from "@/components/ui";
import { useToastActions } from "@/components/ui";
import {
  useUserTrainings,
  useSubmitTrainingQuiz,
} from "@/hooks";
import type { Training } from "@/types";

interface UserTraining extends Training {
  completed?: boolean;
  score?: number;
}

export default function UserTrainingPage() {
  const { data: trainings, loading, refetch } = useUserTrainings();
  const { mutate: submitQuiz, loading: submitting } = useSubmitTrainingQuiz();
  const toast = useToastActions();

  const [selectedTraining, setSelectedTraining] = useState<UserTraining | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);

  const mappingTrainings = (trainings?.mapping_trainings ?? []) as UserTraining[];
  const validationTrainings = (trainings?.validation_trainings ?? []) as UserTraining[];
  const projectTrainings = (trainings?.project_trainings ?? []) as UserTraining[];
  const completedTrainings = (trainings?.user_completed_trainings ?? []) as UserTraining[];

  // Calculate stats
  const stats = useMemo(() => {
    const pending = [...mappingTrainings, ...validationTrainings, ...projectTrainings];
    const totalPoints = completedTrainings.reduce((sum, t) => sum + t.point_value, 0);
    return {
      total: pending.length + completedTrainings.length,
      completed: completedTrainings.length,
      pending: pending.length,
      totalPoints,
    };
  }, [mappingTrainings, validationTrainings, projectTrainings, completedTrainings]);

  const handleStartQuiz = (training: UserTraining) => {
    setSelectedTraining(training);
    setAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
    setShowQuizModal(true);
  };

  const handleAnswerSelect = (questionId: number, answerId: number) => {
    if (quizSubmitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: answerId }));
  };

  const handleSubmitQuiz = async () => {
    if (!selectedTraining || !selectedTraining.questions) return;

    // Check if all questions are answered
    const unanswered = selectedTraining.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Please answer all ${unanswered.length} remaining questions`);
      return;
    }

    try {
      const result = await submitQuiz({
        training_id: selectedTraining.id,
        answers: Object.entries(answers).map(([questionId, answerId]) => ({
          question_id: parseInt(questionId),
          answer_id: answerId,
        })),
      });
      setQuizResult({
        score: result.score ?? 0,
        passed: result.passed ?? false,
      });
      setQuizSubmitted(true);
      if (result.passed) {
        toast.success(`Congratulations! You passed with ${result.score}%`);
      } else {
        toast.warning(`You scored ${result.score}%. You need 70% to pass.`);
      }
      refetch();
    } catch {
      toast.error("Failed to submit quiz");
    }
  };

  const closeQuizModal = () => {
    setShowQuizModal(false);
    setSelectedTraining(null);
    setAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
  };

  const TrainingCard = ({ training }: { training: UserTraining }) => (
    <Card
      className={`transition-all hover:shadow-md ${
        training.completed ? "border-green-500 bg-green-50/50 dark:bg-green-950/20" : ""
      }`}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{training.title}</CardTitle>
          {training.completed && (
            <Badge variant="success">Completed</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Difficulty:</span>
            <Badge
              variant={
                training.difficulty === "Easy"
                  ? "success"
                  : training.difficulty === "Medium"
                  ? "warning"
                  : "destructive"
              }
            >
              {training.difficulty}
            </Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Points:</span>
            <span className="font-medium">{training.point_value}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Questions:</span>
            <span>{training.questions?.length ?? 0}</span>
          </div>
          {training.completed && training.score !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your Score:</span>
              <span className="font-medium text-green-600">{training.score}%</span>
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <a
            href={training.training_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-2 px-4 border border-input rounded-lg hover:bg-muted transition-colors text-sm font-medium"
          >
            View Material
          </a>
          <Button
            onClick={() => handleStartQuiz(training)}
            className="flex-1"
            disabled={training.completed || !training.questions?.length}
          >
            {training.completed ? "Completed" : "Take Quiz"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <Skeleton className="h-8 w-48" />
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(4, 1fr)" }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <h1 className="text-3xl font-bold tracking-tight">Training</h1>
        <p className="text-muted-foreground" style={{ marginTop: 8 }}>
          Complete training modules to earn points and improve your skills
        </p>
      </div>

      {/* Stats Cards - Compact Row */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(4, 1fr)" }} className="grid-stats">
        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Total Trainings</p>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.total}</div>
          </div>
        </Card>
        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Completed</p>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#16a34a" }}>{stats.completed}</div>
            <div style={{ width: "100%", backgroundColor: "#e5e7eb", borderRadius: 4, height: 4, marginTop: 8 }}>
              <div
                style={{
                  backgroundColor: "#16a34a",
                  height: 4,
                  borderRadius: 4,
                  width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`,
                  transition: "width 0.3s"
                }}
              />
            </div>
          </div>
        </Card>
        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Pending</p>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#ca8a04" }}>{stats.pending}</div>
          </div>
        </Card>
        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Points Earned</p>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#ff6b35" }}>{stats.totalPoints}</div>
          </div>
        </Card>
      </div>

      {/* Trainings Tabs */}
      <Tabs defaultValue="mapping">
        <TabsList>
          <TabsTrigger value="mapping">Mapping ({mappingTrainings.length})</TabsTrigger>
          <TabsTrigger value="validation">Validation ({validationTrainings.length})</TabsTrigger>
          <TabsTrigger value="project">Project ({projectTrainings.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTrainings.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="mapping">
          {mappingTrainings.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mappingTrainings.map((training) => (
                <TrainingCard key={training.id} training={training} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent style={{ padding: "48px 24px", textAlign: "center", color: "#6b7280" }}>
                No mapping trainings available
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="validation">
          {validationTrainings.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {validationTrainings.map((training) => (
                <TrainingCard key={training.id} training={training} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent style={{ padding: "48px 24px", textAlign: "center", color: "#6b7280" }}>
                No validation trainings available
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="project">
          {projectTrainings.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projectTrainings.map((training) => (
                <TrainingCard key={training.id} training={training} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent style={{ padding: "48px 24px", textAlign: "center", color: "#6b7280" }}>
                No project-specific trainings available
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="completed">
          {completedTrainings.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedTrainings.map((training) => (
                <TrainingCard key={training.id} training={{ ...training, completed: true }} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent style={{ padding: "48px 24px", textAlign: "center", color: "#6b7280" }}>
                No completed trainings yet
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Quiz Modal */}
      <Modal
        isOpen={showQuizModal}
        onClose={closeQuizModal}
        title={selectedTraining?.title ?? "Quiz"}
        description={`${selectedTraining?.questions?.length ?? 0} questions • ${selectedTraining?.point_value ?? 0} points`}
        size="lg"
        footer={
          quizSubmitted ? (
            <Button onClick={closeQuizModal}>Close</Button>
          ) : (
            <>
              <Button variant="outline" onClick={closeQuizModal}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitQuiz}
                isLoading={submitting}
                disabled={Object.keys(answers).length !== (selectedTraining?.questions?.length ?? 0)}
              >
                Submit Quiz
              </Button>
            </>
          )
        }
      >
        <div className="space-y-6">
          {/* Training Material Link */}
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground mb-2">
              Make sure you review the training material before taking the quiz:
            </p>
            <a
              href={selectedTraining?.training_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-kaart-orange hover:underline font-medium"
            >
              Open Training Material
            </a>
          </div>

          {/* Quiz Result */}
          {quizSubmitted && quizResult && (
            <div
              className={`rounded-lg p-4 ${
                quizResult.passed
                  ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
              }`}
            >
              <div className="text-center">
                <p className={`text-3xl font-bold ${quizResult.passed ? "text-green-600" : "text-red-600"}`}>
                  {quizResult.score}%
                </p>
                <p className={`font-medium ${quizResult.passed ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                  {quizResult.passed ? "Congratulations! You passed!" : "You need 70% to pass. Try again!"}
                </p>
                {quizResult.passed && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    +{selectedTraining?.point_value} points earned
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Questions */}
          <div className="space-y-6">
            {selectedTraining?.questions?.map((question, qIndex) => {
              const selectedAnswer = answers[question.id];
              const isCorrect = quizSubmitted && question.answers.find((a) => a.id === selectedAnswer)?.correct;
              const correctAnswer = question.answers.find((a) => a.correct);

              return (
                <div key={question.id} className="border border-border rounded-lg p-4">
                  <p className="font-medium mb-3">
                    {qIndex + 1}. {question.question}
                  </p>
                  <div className="space-y-2">
                    {question.answers.map((answer) => {
                      const isSelected = selectedAnswer === answer.id;
                      let className = "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ";

                      if (quizSubmitted) {
                        if (answer.correct) {
                          className += "border-green-500 bg-green-50 dark:bg-green-950";
                        } else if (isSelected && !answer.correct) {
                          className += "border-red-500 bg-red-50 dark:bg-red-950";
                        } else {
                          className += "border-border opacity-50";
                        }
                      } else {
                        className += isSelected
                          ? "border-kaart-orange bg-kaart-orange/10"
                          : "border-border hover:border-muted-foreground";
                      }

                      return (
                        <div
                          key={answer.id}
                          className={className}
                          onClick={() => handleAnswerSelect(question.id, answer.id)}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? "border-kaart-orange" : "border-muted-foreground"
                            }`}
                          >
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-kaart-orange" />
                            )}
                          </div>
                          <span className={quizSubmitted && answer.correct ? "font-medium text-green-700 dark:text-green-300" : ""}>
                            {answer.answer}
                          </span>
                          {quizSubmitted && answer.correct && (
                            <span className="ml-auto text-green-600 text-sm">Correct</span>
                          )}
                          {quizSubmitted && isSelected && !answer.correct && (
                            <span className="ml-auto text-red-600 text-sm">Incorrect</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress indicator */}
          {!quizSubmitted && selectedTraining?.questions && (
            <div className="text-sm text-muted-foreground text-center">
              {Object.keys(answers).length} of {selectedTraining.questions.length} questions answered
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
