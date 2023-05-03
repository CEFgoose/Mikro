import React, { useContext, useEffect, useState } from "react";
import { DataContext } from "../../common/DataContext";
import { AuthContext } from "../../common/AuthContext";
import Sidebar from "../sidebar/sidebar";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import useToggle from "../../hooks/useToggle.js";
import { ButtonDivComponent } from "components/commonComponents/commonComponents";
import "./styles.css";
import { UserTrainingTable, TrainingQuizModal } from "./trainingComponents";

export const UserTrainingPage = () => {
  const {
    sidebarOpen,
    handleSetSidebarState,
    orgMappingTrainings,
    orgValidationTrainings,
    orgProjectTrainings,
    userCompletedTrainings,
    fetchUserTrainings,
    shuffleArray,
    history,
    completeTraining,
  } = useContext(DataContext);

  const { refresh, user } = useContext(AuthContext);
  const [page, setPage] = useState(0);
  const [modalPage, setModalPage] = useState(1);
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
  const [incorrect1_1, setIncorrect1_1] = useState(null);
  const [incorrect1_2, setIncorrect1_2] = useState(null);
  const [incorrect1_3, setIncorrect1_3] = useState(null);
  const [question1, setQuestion1] = useState(null);
  const [question2, setQuestion2] = useState(null);
  const [question3, setQuestion3] = useState(null);
  const [incorrect2_1, setIncorrect2_1] = useState(null);
  const [incorrect2_2, setIncorrect2_2] = useState(null);
  const [incorrect2_3, setIncorrect2_3] = useState(null);
  const [answer1, setAnswer1] = useState(null);
  const [answer2, setAnswer2] = useState(null);
  const [answer3, setAnswer3] = useState(null);
  const [incorrect3_1, setIncorrect3_1] = useState(null);
  const [incorrect3_2, setIncorrect3_2] = useState(null);
  const [incorrect3_3, setIncorrect3_3] = useState(null);
  const [result1, setResult1] = useState(false);
  const [result2, setResult2] = useState(false);
  const [result3, setResult3] = useState(false);
  const [activeTab, setActiveTab] = useState(1);
  const [answers1, setAnswers1] = useState([]);
  const [answers2, setAnswers2] = useState([]);
  const [answers3, setAnswers3] = useState([]);

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

  const handleResults = () => {
    if (result1 && result2 && result3) {
      setQuizResultsText(
        `You passed the ${title} quiz!
        You have earned ${point_value} mapper points!`
      );
      return true;
    } else {
      setQuizResultsText(
        `Sorry, you failed the ${title} quiz.
        Would you like to try again?`
      );
      return false;
    }
  };

  const handleSetModalPage = () => {
    if (modalPage === 1) {
      if (selectedAnswer) {
        if (selectedAnswer === answer1) {
          setResult1(true);
        } else {
          setResult1(false);
        }
        setModalPage(2);
        return;
      }
    }
    if (modalPage === 2) {
      if (selectedAnswer) {
        if (selectedAnswer === answer2) {
          setResult2(true);
        } else {
          setResult2(false);
        }
        setModalPage(3);
        return;
      }
    }
    if (modalPage === 3) {
      if (selectedAnswer) {
        setconfirmButtonText("Submit");
        if (selectedAnswer === answer3) {
          setResult3(true);
        } else {
          setResult3(false);
        }
        setModalPage(4);
        return;
      }
    }
    if (modalPage === 4) {
      let results = handleResults();
      handleCompleteTraining(results);
      setModalPage(5);
      return;
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
    setQuestion1(training.question1);
    setQuestion2(training.question2);
    setQuestion3(training.question3);
    setAnswer1(training.answer1);
    setAnswer2(training.answer2);
    setAnswer3(training.answer3);
    setIncorrect1_1(training.incorrect1_1);
    setIncorrect1_2(training.incorrect1_2);
    setIncorrect1_3(training.incorrect1_3);
    setIncorrect2_1(training.incorrect2_1);
    setIncorrect2_2(training.incorrect2_2);
    setIncorrect2_3(training.incorrect2_3);
    setIncorrect3_1(training.incorrect3_1);
    setIncorrect3_2(training.incorrect3_2);
    setIncorrect3_3(training.incorrect3_3);
  };

  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(e.target.value);
  };

  const handleViewSidebar = () => {
    handleSetSidebarState();
  };

  const handleQuizOpen = () => {
    if (trainingSelected) {
      setconfirmButtonText("Next");
      setAnswers1(
        shuffleArray([answer1, incorrect1_1, incorrect1_2, incorrect1_3])
      );
      setAnswers2(
        shuffleArray([answer2, incorrect2_1, incorrect2_2, incorrect2_3])
      );
      setAnswers3(
        shuffleArray([answer3, incorrect3_1, incorrect3_2, incorrect3_3])
      );
      setModalPage(1);
      toggleQuizOpen();
    }
  };

  const handleSetActiveTab = (e) => {
    if (e.target.value === 1) {
      setTrainingType("Mapping");
    }
    if (e.target.value === 2) {
      setTrainingType("Validation");
    }
    if (e.target.value === 3) {
      setTrainingType("Project");
    }
    setActiveTab(e.target.value);
  };
  const handleViewTraining = () => {
    window.open(training_url, "_blank", "width=720, height=800");
  };

  const handleCompleteTraining = (passed) => {
    if (passed) {
      completeTraining(trainingSelected, title);
    }
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
        modalPage={modalPage}
        selectedAnswer={selectedAnswer}
        handleAnswerSelected={handleAnswerSelected}
        handleSetModalPage={handleSetModalPage}
        question1={question1}
        answer1={answer1}
        answer2={answer2}
        answer3={answer3}
        answers1={answers1}
        question2={question2}
        answers2={answers2}
        question3={question3}
        answers3={answers3}
        quizResultsText={quizResultsText}
        confirmButtonText={confirmButtonText}
        handleCompleteTraining={handleCompleteTraining}
      />
      <div style={{ width: "100%", float: "left" }}>
        <Sidebar isOpen={sidebarOpen} toggleSidebar={handleViewSidebar} />
        <div
          style={{
            display: "flex",
            position: "relative",
            left: "15vw",
            flexDirection: "column",
            height: "100vh",
          }}
        >
          <div
            style={{ display: "flex", marginLeft: "6vh", flexDirection: "row" }}
          >
            <h1 style={{ marginTop: "1vw", paddingBottom: "2vh" }}>
              <strong>Training:</strong>
            </h1>
            <div style={{ marginLeft: "50vw", marginTop: "1vh" }}>
              <ButtonDivComponent
                button1={true}
                button1_text={"View"}
                button1_action={handleViewTraining}
                button2={true}
                button2_text={"Test Out"}
                button2_action={handleQuizOpen}
                button3={false}
              />
            </div>
          </div>
          <Tabs>
            <TabList
              style={{ marginLeft: "3vw", marginTop: "0vh", paddingTop: "0vh" }}
            >
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
            <TabPanel>
              <UserTrainingTable
                rowsPerPage={rowsPerPage}
                page={page}
                setPage={setPage}
                handleChangeRowsPerPage={handleChangeRowsPerPage}
                orgTrainings={orgMappingTrainings}
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
              />
            </TabPanel>
          </Tabs>
        </div>
      </div>
    </>
  );
};
