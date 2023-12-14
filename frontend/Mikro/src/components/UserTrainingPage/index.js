import React, { useContext, useEffect, useState } from "react";
import { DataContext } from "../../common/DataContext";
import { AuthContext } from "../../common/AuthContext";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import useToggle from "../../hooks/useToggle.js";
import { ButtonDivComponent } from "components/commonComponents/commonComponents";
import "./styles.css";
import { UserTrainingTable, TrainingQuizModal } from "./trainingComponents";
import { CompleteQuizModal } from "components/commonComponents/commonComponents";
export const UserTrainingPage = () => {
  const {
    handleSetSidebarState,
    orgMappingTrainings,
    setOrgMappingTrainings,
    orgValidationTrainings,
    setOrgValidationTrainings,
    orgProjectTrainings,
    setOrgProjectTrainings,
    userCompletedTrainings,
    setUserCompletedTrainings,
    fetchUserTrainings,
    shuffleArray,
    history,
    completeTraining,
  } = useContext(DataContext);

  const { refresh, user } = useContext(AuthContext);
  const [page, setPage] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [quizOpen, toggleQuizOpen] = useToggle(false);
  const [quizResultsText, setQuizResultsText] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [trainingSelected, setTrainingSelected] = useState();
  const [training_url, setURL] = useState(null);
  const [training_type, setTrainingType] = useState("Mapping");
  const [point_value, setPointValue] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [title, setTitle] = useState(null);
  const [confirmButtonText, setconfirmButtonText] = useState("Next");
  const [currentSelectedTrainings, setCurrentSelectedTrainings] = useState([]);
  const [quizStatus, setQuizStatus] = useState(null);
  const [quizStatusText, setQuizStatusText] = useState(null);
  const [activeTab, setActiveTab] = useState(1);
  const [results, setResults] = useState([]);
  const [modalButton1Text, setModalButton1Text] = useState(null);
  const [modalButton2Text, setModalButton2Text] = useState(null);
  const [modalButton1, toggleModalButton1] = useToggle(true);
  const [modalButton2, toggleModalButton2] = useToggle(false);
  const [button1action, setButton1action] = useState(null);
  const [button2action, setButton2action] = useState(null);
  const [successModalOpen, toggleSuccessModalOpen] = useToggle(false);
  useEffect(() => {
    if (user) {
      refresh();
    }
    if (user === null) {
      history("/login");
    }
    if (user !== null) {
      if (user.role !== "user" && user.role !== "validator") {
        history("/login");
      }
    }
    fetchUserTrainings();
    // eslint-disable-next-line
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 1) {
      setCurrentSelectedTrainings(orgMappingTrainings);
    }
    if (activeTab === 2) {
      setCurrentSelectedTrainings(orgValidationTrainings);
    }
    if (activeTab === 3) {
      setCurrentSelectedTrainings(orgProjectTrainings);
    }
    // eslint-disable-next-line
  }, [
    activeTab,
    orgProjectTrainings,
    orgValidationTrainings,
    orgMappingTrainings,
  ]);

  const handleOpenResultsModal = () => {
    toggleSuccessModalOpen();
  };

  const handleChangeQuestionIndex = () => {
    if (questionIndex <= currentSelectedTrainings.length) {
      setQuestionIndex((prevCount) => prevCount + 1);
    } else {
      handleCompleteQuiz();
    }
  };

  const handleAnswerSelected = (e) => {
    setSelectedAnswer(e);
  };

  const handleSetTrainingSelected = (training) => {
    setTrainingSelected(training.id);
    setTitle(training.title);
    setURL(training.training_url);
    setPointValue(training.point_value);
    setDifficulty(training.difficulty);
  };

  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(e.target.value);
  };

  const handleQuizOpen = () => {
    if (trainingSelected) {
      setconfirmButtonText("Next");
      toggleQuizOpen();
    }
  };

  const handleSetActiveTab = (e) => {
    if (e.target.value === 1) {
      setTrainingType("Mapping");
      setCurrentSelectedTrainings(orgMappingTrainings);
    }
    if (e.target.value === 2) {
      setTrainingType("Validation");
      setCurrentSelectedTrainings(orgValidationTrainings);
    }
    if (e.target.value === 3) {
      setTrainingType("Project");
      setCurrentSelectedTrainings(orgProjectTrainings);
    }
    // if (e.target.value === 4) {
    //   setTrainingType("Completed");
    //   setCurrentSelectedTrainings(orgC)
    // }
    setActiveTab(e.target.value);
  };
  const handleViewTraining = () => {
    window.open(training_url, "_blank", "width=720, height=800");
  };

  const handleCompleteTraining = () => {
    completeTraining(trainingSelected);
    handleOpenResultsModal();
  };

  const handleCompleteQuiz = () => {
    handleQuizOpen();
    if (results.includes(false)) {
      setQuizStatus("Failed");
      setQuizStatusText(`Would you like to try again?`);
      setModalButton1Text("Quit");
      setModalButton2Text("Retry");
      toggleModalButton1(true);
      toggleModalButton2(true);
    } else {
      setQuizStatus("Passed");
      setQuizStatusText(
        `You have been awarded ${point_value} ${training_type} points!`
      );
      setModalButton1Text("Continue");
      toggleModalButton1(true);
      toggleModalButton2(false);
    }
    handleOpenResultsModal();
    setResults([]);
    setQuestionIndex(0);
  };

  return (
    <>
      <TrainingQuizModal
        quizOpen={quizOpen}
        handleQuizOpen={handleQuizOpen}
        URL={training_url}
        pointValue={point_value}
        difficulty={difficulty}
        title={title}
        questionIndex={questionIndex}
        selectedAnswer={selectedAnswer}
        handleAnswerSelected={handleAnswerSelected}
        handleChangeQuestionIndex={handleChangeQuestionIndex}
        questions={currentSelectedTrainings}
        quizResultsText={quizResultsText}
        confirmButtonText={confirmButtonText}
        handleCompleteQuiz={handleCompleteQuiz}
        results={results}
        setResults={setResults}
      />
      <CompleteQuizModal
        modal_open={successModalOpen}
        quizStatus={quizStatus}
        quizStatusText={quizStatusText}
        button1={modalButton1}
        button_1_text={modalButton1Text}
        button_1_action={
          quizStatus === "Failed"
            ? handleOpenResultsModal
            : handleCompleteTraining
        }
        button2={modalButton2}
        button_2_text={modalButton2Text}
      />
      <Tabs>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <TabList>
            <Tab value={1} onClick={(e) => handleSetActiveTab(e)}>
              Mapping
            </Tab>
            <Tab value={2} onClick={(e) => handleSetActiveTab(e)}>
              Validation
            </Tab>
            <Tab value={3} onClick={(e) => handleSetActiveTab(e)}>
              Project Specific
            </Tab>
            <Tab value={4} onClick={(e) => handleSetActiveTab(e)}>
              Completed
            </Tab>
          </TabList>

          <ButtonDivComponent
            button1={true}
            button1_text={"View"}
            button1_action={handleViewTraining}
            button2={activeTab !== 4 ? true : false}
            button2_text={"Test Out"}
            button2_action={handleQuizOpen}
            button3={false}
          />
        </div>

        <TabPanel>
          <UserTrainingTable
            rowsPerPage={rowsPerPage}
            page={page}
            setPage={setPage}
            handleChangeRowsPerPage={handleChangeRowsPerPage}
            orgTrainings={orgMappingTrainings}
            setOrgTrainings={setOrgMappingTrainings}
            trainingSelected={trainingSelected}
            handleSetTrainingSelected={handleSetTrainingSelected}
          />
        </TabPanel>
        <TabPanel>
          <UserTrainingTable
            rowsPerPage={rowsPerPage}
            page={page}
            setPage={setPage}
            handleChangeRowsPerPage={handleChangeRowsPerPage}
            trainingSelected={trainingSelected}
            orgTrainings={orgValidationTrainings}
            setOrgTrainings={setOrgValidationTrainings}
            handleSetTrainingSelected={handleSetTrainingSelected}
          />
        </TabPanel>
        <TabPanel>
          <UserTrainingTable
            rowsPerPage={rowsPerPage}
            page={page}
            setPage={setPage}
            handleChangeRowsPerPage={handleChangeRowsPerPage}
            trainingSelected={trainingSelected}
            handleSetTrainingSelected={handleSetTrainingSelected}
            orgTrainings={orgProjectTrainings}
            setOrgTrainings={setOrgProjectTrainings}
          />
        </TabPanel>
        <TabPanel>
          <UserTrainingTable
            rowsPerPage={rowsPerPage}
            page={page}
            setPage={setPage}
            handleChangeRowsPerPage={handleChangeRowsPerPage}
            trainingSelected={trainingSelected}
            handleSetTrainingSelected={handleSetTrainingSelected}
            orgTrainings={userCompletedTrainings}
            setOrgTrainings={setUserCompletedTrainings}
          />
        </TabPanel>
      </Tabs>
    </>
  );
};
