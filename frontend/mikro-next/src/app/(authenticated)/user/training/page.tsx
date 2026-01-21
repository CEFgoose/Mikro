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

  // Calculate stats
  const stats = useMemo(() => {
    const all = [...mappingTrainings, ...validationTrainings, ...projectTrainings];
    const completed = all.filter((t) => t.completed);
    const totalPoints = completed.reduce((sum, t) => sum + t.point_value, 0);
    return {
      total: all.length,
      completed: completed.length,
      pending: all.length - completed.length,
      totalPoints,
    };
  }, [mappingTrainings, validationTrainings, projectTrainings]);

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
      <CardHeader className="pb-2">
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
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Training</h1>
        <p className="text-muted-foreground">
          Complete training modules to earn points and improve your skills
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Trainings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-kaart-orange">{stats.totalPoints}</div>
          </CardContent>
        </Card>
      </div>

      {/* Trainings Tabs */}
      <Tabs defaultValue="mapping">
        <TabsList>
          <TabsTrigger value="mapping">Mapping ({mappingTrainings.length})</TabsTrigger>
          <TabsTrigger value="validation">Validation ({validationTrainings.length})</TabsTrigger>
          <TabsTrigger value="project">Project Specific ({projectTrainings.length})</TabsTrigger>
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
              <CardContent className="py-12 text-center text-muted-foreground">
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
              <CardContent className="py-12 text-center text-muted-foreground">
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
              <CardContent className="py-12 text-center text-muted-foreground">
                No project-specific trainings available
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
