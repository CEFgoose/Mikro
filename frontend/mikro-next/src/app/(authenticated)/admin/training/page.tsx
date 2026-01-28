"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Modal,
  ConfirmDialog,
  Input,
  Select,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Skeleton,
} from "@/components/ui";
import { useToastActions } from "@/components/ui";
import {
  useOrgTrainings,
  useCreateTraining,
  useUpdateTraining,
  useDeleteTraining,
} from "@/hooks";
import type { Training, TrainingQuestion } from "@/types";

interface TrainingFormData {
  title: string;
  training_url: string;
  point_value: string;
  difficulty: string;
  training_type: string;
  project_id: string;
}

const defaultFormData: TrainingFormData = {
  title: "",
  training_url: "",
  point_value: "10",
  difficulty: "Medium",
  training_type: "Mapping",
  project_id: "",
};

interface QuestionFormData {
  question: string;
  answers: { answer: string; correct: boolean }[];
}

export default function AdminTrainingPage() {
  const { data: trainings, loading, refetch } = useOrgTrainings();
  const { mutate: createTraining, loading: creating } = useCreateTraining();
  const { mutate: updateTraining, loading: updating } = useUpdateTraining();
  const { mutate: deleteTraining, loading: deleting } = useDeleteTraining();
  const toast = useToastActions();

  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [formData, setFormData] = useState<TrainingFormData>(defaultFormData);
  const [questions, setQuestions] = useState<QuestionFormData[]>([]);

  const mappingTrainings = trainings?.org_mapping_trainings ?? [];
  const validationTrainings = trainings?.org_validation_trainings ?? [];
  const projectTrainings = trainings?.org_project_trainings ?? [];

  const handleInputChange = (field: keyof TrainingFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateTraining = async () => {
    if (!formData.title || !formData.training_url) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Transform questions to backend format
      const formattedQuestions = questions.map((q) => {
        const correctAnswer = q.answers.find((a) => a.correct);
        const incorrectAnswers = q.answers.filter((a) => !a.correct);
        return {
          question: q.question,
          correct: correctAnswer?.answer || "",
          incorrect: incorrectAnswers.map((a) => ({ answer: a.answer })),
        };
      });

      await createTraining({
        title: formData.title,
        training_url: formData.training_url,
        point_value: parseInt(formData.point_value),
        difficulty: formData.difficulty,
        training_type: formData.training_type,
        project_id: formData.project_id ? parseInt(formData.project_id) : undefined,
        questions: formattedQuestions,
      });
      toast.success("Training created successfully");
      setShowAddModal(false);
      setFormData(defaultFormData);
      setQuestions([]);
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create training";
      toast.error(message);
    }
  };

  const handleUpdateTraining = async () => {
    if (!selectedTraining) return;

    try {
      await updateTraining({
        training_id: selectedTraining.id,
        title: formData.title,
        training_url: formData.training_url,
        point_value: parseInt(formData.point_value),
        difficulty: formData.difficulty,
      });
      toast.success("Training updated successfully");
      setShowEditModal(false);
      setSelectedTraining(null);
      refetch();
    } catch {
      toast.error("Failed to update training");
    }
  };

  const handleDeleteTraining = async () => {
    if (!selectedTraining) return;

    try {
      await deleteTraining({ training_id: selectedTraining.id });
      toast.success("Training deleted successfully");
      setShowDeleteModal(false);
      setSelectedTraining(null);
      refetch();
    } catch {
      toast.error("Failed to delete training");
    }
  };

  const openEditModal = (training: Training) => {
    setSelectedTraining(training);
    setFormData({
      title: training.title,
      training_url: training.training_url,
      point_value: training.point_value.toString(),
      difficulty: training.difficulty,
      training_type: training.training_type ?? "Mapping",
      project_id: training.project_id?.toString() ?? "",
    });
    setShowEditModal(true);
  };

  const openQuestionsModal = (training: Training) => {
    setSelectedTraining(training);
    setQuestions(
      training.questions?.map((q) => ({
        question: q.question,
        answers: q.answers.map((a) => ({ answer: a.answer, correct: a.correct })),
      })) ?? []
    );
    setShowQuestionsModal(true);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        answers: [
          { answer: "", correct: true },
          { answer: "", correct: false },
          { answer: "", correct: false },
          { answer: "", correct: false },
        ],
      },
    ]);
  };

  const updateQuestion = (index: number, field: string, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateAnswer = (qIndex: number, aIndex: number, field: string, value: string | boolean) => {
    const updated = [...questions];
    updated[qIndex].answers[aIndex] = { ...updated[qIndex].answers[aIndex], [field]: value };
    if (field === "correct" && value === true) {
      // Only one correct answer per question
      updated[qIndex].answers = updated[qIndex].answers.map((a, i) => ({
        ...a,
        correct: i === aIndex,
      }));
    }
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const TrainingTable = ({ trainingList }: { trainingList: Training[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Difficulty</TableHead>
          <TableHead>Points</TableHead>
          <TableHead>Questions</TableHead>
          <TableHead>URL</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trainingList.map((training) => (
          <TableRow key={training.id}>
            <TableCell className="font-medium">{training.title}</TableCell>
            <TableCell>
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
            </TableCell>
            <TableCell>{training.point_value}</TableCell>
            <TableCell>{training.questions?.length ?? 0}</TableCell>
            <TableCell>
              <a
                href={training.training_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-kaart-orange hover:underline"
              >
                View
              </a>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => openQuestionsModal(training)}>
                  Questions
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEditModal(training)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setSelectedTraining(training);
                    setShowDeleteModal(true);
                  }}
                >
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {trainingList.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              No trainings found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training</h1>
          <p className="text-muted-foreground">
            Manage training modules and quizzes
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>Add Training</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Trainings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mappingTrainings.length + validationTrainings.length + projectTrainings.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mapping</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-kaart-orange">{mappingTrainings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{validationTrainings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Project Specific</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{projectTrainings.length}</div>
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
          <Card>
            <CardContent className="p-0">
              <TrainingTable trainingList={mappingTrainings} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="validation">
          <Card>
            <CardContent className="p-0">
              <TrainingTable trainingList={validationTrainings} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="project">
          <Card>
            <CardContent className="p-0">
              <TrainingTable trainingList={projectTrainings} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Training Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormData(defaultFormData);
          setQuestions([]);
        }}
        title="Add New Training"
        description="Create a new training module with quiz questions"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTraining} isLoading={creating}>
              Create Training
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="Training title"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
          />
          <Input
            label="Training URL"
            placeholder="https://..."
            value={formData.training_url}
            onChange={(e) => handleInputChange("training_url", e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Point Value"
              type="number"
              value={formData.point_value}
              onChange={(e) => handleInputChange("point_value", e.target.value)}
            />
            <Select
              label="Difficulty"
              value={formData.difficulty}
              onChange={(value) => handleInputChange("difficulty", value)}
              options={[
                { value: "Easy", label: "Easy" },
                { value: "Medium", label: "Medium" },
                { value: "Hard", label: "Hard" },
              ]}
            />
          </div>
          <Select
            label="Training Type"
            value={formData.training_type}
            onChange={(value) => handleInputChange("training_type", value)}
            options={[
              { value: "Mapping", label: "Mapping" },
              { value: "Validation", label: "Validation" },
              { value: "Project", label: "Project Specific" },
            ]}
          />
          {formData.training_type === "Project" && (
            <Input
              label="Project ID"
              type="number"
              placeholder="Enter project ID"
              value={formData.project_id}
              onChange={(e) => handleInputChange("project_id", e.target.value)}
            />
          )}

          {/* Questions Section */}
          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Quiz Questions ({questions.length})</h3>
              <Button size="sm" variant="outline" onClick={addQuestion}>
                Add Question
              </Button>
            </div>
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="border border-border rounded-lg p-4 mb-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium">Question {qIndex + 1}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-600"
                  >
                    Remove
                  </Button>
                </div>
                <Input
                  placeholder="Enter question"
                  value={q.question}
                  onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                  className="mb-2"
                />
                <div className="space-y-2">
                  {q.answers.map((a, aIndex) => (
                    <div key={aIndex} className="flex gap-2 items-center">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={a.correct}
                        onChange={() => updateAnswer(qIndex, aIndex, "correct", true)}
                        className="h-4 w-4"
                      />
                      <Input
                        placeholder={`Answer ${aIndex + 1}`}
                        value={a.answer}
                        onChange={(e) => updateAnswer(qIndex, aIndex, "answer", e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Select the radio button to mark the correct answer
                </p>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Edit Training Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTraining(null);
        }}
        title="Edit Training"
        description={`Editing ${selectedTraining?.title}`}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTraining} isLoading={updating}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
          />
          <Input
            label="Training URL"
            value={formData.training_url}
            onChange={(e) => handleInputChange("training_url", e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Point Value"
              type="number"
              value={formData.point_value}
              onChange={(e) => handleInputChange("point_value", e.target.value)}
            />
            <Select
              label="Difficulty"
              value={formData.difficulty}
              onChange={(value) => handleInputChange("difficulty", value)}
              options={[
                { value: "Easy", label: "Easy" },
                { value: "Medium", label: "Medium" },
                { value: "Hard", label: "Hard" },
              ]}
            />
          </div>
        </div>
      </Modal>

      {/* Questions Modal */}
      <Modal
        isOpen={showQuestionsModal}
        onClose={() => {
          setShowQuestionsModal(false);
          setSelectedTraining(null);
        }}
        title="Quiz Questions"
        description={`Questions for ${selectedTraining?.title}`}
        size="lg"
        footer={
          <Button onClick={() => setShowQuestionsModal(false)}>Close</Button>
        }
      >
        <div className="space-y-4">
          {selectedTraining?.questions?.map((q, qIndex) => (
            <div key={q.id} className="border border-border rounded-lg p-4">
              <p className="font-medium mb-2">
                {qIndex + 1}. {q.question}
              </p>
              <div className="space-y-1 ml-4">
                {q.answers.map((a) => (
                  <div
                    key={a.id}
                    className={`text-sm ${a.correct ? "text-green-600 font-medium" : ""}`}
                  >
                    {a.correct ? "✓ " : "○ "}
                    {a.answer}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {(!selectedTraining?.questions || selectedTraining.questions.length === 0) && (
            <p className="text-muted-foreground text-center py-4">
              No questions for this training
            </p>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedTraining(null);
        }}
        onConfirm={handleDeleteTraining}
        title="Delete Training"
        message={`Are you sure you want to delete "${selectedTraining?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        isLoading={deleting}
      />
    </div>
  );
}
