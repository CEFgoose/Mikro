import React, { useContext, useEffect, useState } from "react";
import { DataContext } from "../../common/DataContext";
import { AuthContext } from "../../common/AuthContext";
import Sidebar from "../sidebar/sidebar";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import useToggle from "../../hooks/useToggle.js";
import { ButtonDivComponent } from "components/commonComponents/commonComponents";
import "./styles.css";
import {
  AdminTrainingTable,
  AddTrainingModal,
  DeleteTrainingModal,
  ModifyTrainingModal,
} from "./trainingComponents";

export const AdminTrainingPage = () => {
  const {
    sidebarOpen,
    handleSetSidebarState,
    createTraining,
    orgMappingTrainings,
    setOrgMappingTrainings,
    orgValidationTrainings,
    setOrgValidationTrainings,
    orgProjectTrainings,
    setOrgProjectTrainings,
    fetchOrgTrainings,
    orgTrainings,
    setOrgTrainings,
    deleteTraining,
    modifyTraining,
    history,
  } = useContext(DataContext);

  const { refresh, user } = useContext(AuthContext);
  const [page, setPage] = useState(0);
  const [modalPage, setModalPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [addOpen, toggleAddOpen] = useToggle(false);
  const [deleteOpen, toggleDeleteOpen] = useToggle(false);
  const [modifyOpen, toggleModifyOpen] = useToggle(false);
  const [trainingSelected, setTrainingSelected] = useState();
  const [training_url, setURL] = useState(null);
  const [training_type, setTrainingType] = useState("Mapping");
  const [point_value, setPointValue] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [title, setTitle] = useState(null);
  const [question1, setQuestion1] = useState(null);
  const [answer1, setAnswer1] = useState(null);
  const [incorrect1_1, setIncorrect1_1] = useState(null);
  const [incorrect1_2, setIncorrect1_2] = useState(null);
  const [incorrect1_3, setIncorrect1_3] = useState(null);
  const [question2, setQuestion2] = useState(null);
  const [answer2, setAnswer2] = useState(null);
  const [incorrect2_1, setIncorrect2_1] = useState(null);
  const [incorrect2_2, setIncorrect2_2] = useState(null);
  const [incorrect2_3, setIncorrect2_3] = useState(null);
  const [question3, setQuestion3] = useState(null);
  const [answer3, setAnswer3] = useState(null);
  const [incorrect3_1, setIncorrect3_1] = useState(null);
  const [incorrect3_2, setIncorrect3_2] = useState(null);
  const [incorrect3_3, setIncorrect3_3] = useState(null);
  const [activeTab, setActiveTab] = useState(1);

  useEffect(() => {
    if (user) {
      refresh();
    }
    if (user === null) {
      history("/login");
    }
    if (user !== null && user.role !== "admin") {
      history("/login");
    }
    fetchOrgTrainings();
    // eslint-disable-next-line
  }, [activeTab]);

  const handleSetQuestion = (number, e) => {
    if (number === 1) {
      setQuestion1(e.target.value);
    }
    if (number === 2) {
      setQuestion2(e.target.value);
    }
    if (number === 3) {
      setQuestion3(e.target.value);
    }
  };

  const handleSetAnswer = (number, e) => {
    if (number === 1) {
      setAnswer1(e.target.value);
    }
    if (number === 2) {
      setAnswer2(e.target.value);
    }
    if (number === 3) {
      setAnswer3(e.target.value);
    }
  };

  const handleSetIncorrect = (number, count, e) => {
    if (number === 1) {
      if (count === 1) {
        setIncorrect1_1(e.target.value);
      }
      if (count === 2) {
        setIncorrect1_2(e.target.value);
      }
      if (count === 3) {
        setIncorrect1_3(e.target.value);
      }
    }
    if (number === 2) {
      if (count === 1) {
        setIncorrect2_1(e.target.value);
      }
      if (count === 2) {
        setIncorrect2_2(e.target.value);
      }
      if (count === 3) {
        setIncorrect2_3(e.target.value);
      }
    }
    if (number === 3) {
      if (count === 1) {
        setIncorrect3_1(e.target.value);
      }
      if (count === 2) {
        setIncorrect3_2(e.target.value);
      }
      if (count === 3) {
        setIncorrect3_3(e.target.value);
      }
    }
  };

  const handleSetModalPage = () => {
    if (modalPage === 1) {
      if (URL && difficulty && point_value) {
        setModalPage(2);
        return;
      }
    }
    if (modalPage === 2) {
      if (
        question1 &&
        answer1 &&
        incorrect1_1 &&
        incorrect1_2 &&
        incorrect1_3
      ) {
        setModalPage(3);
        return;
      }
    }
    if (modalPage === 3) {
      if (
        question2 &&
        answer2 &&
        incorrect2_1 &&
        incorrect2_2 &&
        incorrect2_3
      ) {
        setModalPage(4);
        return;
      }
    } else {
      if (
        question3 &&
        answer3 &&
        incorrect3_1 &&
        incorrect3_2 &&
        incorrect3_3
      ) {
        if (addOpen) {
          handleCreateTraining();
          return;
        } else if (modifyOpen) {
          handleModifyTraining();
          return;
        }
      }
    }
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

  const handleSetTitle = (e) => {
    setTitle(e.target.value);
  };

  const handleSetURL = (e) => {
    setURL(e.target.value);
  };

  const handleSetPointValue = (e) => {
    setPointValue(e.target.value);
  };

  const handleSetDifficulty = (e) => {
    setDifficulty(e.target.value);
  };

  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(e.target.value);
  };

  const handleViewSidebar = () => {
    handleSetSidebarState();
  };

  const handleModifyOpen = () => {
    if (trainingSelected) {
      setModalPage(1);
      toggleModifyOpen();
    }
  };

  const handleAddOpen = () => {
    setModalPage(1);
    setTrainingSelected(null);
    setTitle(null);
    setURL(null);
    setPointValue(null);
    setDifficulty(null);
    setQuestion1(null);
    setQuestion2(null);
    setQuestion3(null);
    setAnswer1(null);
    setAnswer2(null);
    setAnswer3(null);
    setIncorrect1_1(null);
    setIncorrect1_2(null);
    setIncorrect1_3(null);
    setIncorrect2_1(null);
    setIncorrect2_2(null);
    setIncorrect2_3(null);
    setIncorrect3_1(null);
    setIncorrect3_2(null);
    setIncorrect3_3(null);
    toggleAddOpen();
  };

  const handleDeleteOpen = () => {
    toggleDeleteOpen();
  };

  const handleDeleteTraining = () => {
    deleteTraining(trainingSelected, title);
    handleDeleteOpen();
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

  const handleCreateTraining = () => {
    createTraining(
      title,
      training_url,
      training_type,
      point_value,
      difficulty,
      question1,
      answer1,
      incorrect1_1,
      incorrect1_2,
      incorrect1_3,
      question2,
      answer2,
      incorrect2_1,
      incorrect2_2,
      incorrect2_3,
      question3,
      answer3,
      incorrect3_1,
      incorrect3_2,
      incorrect3_3
    );
    handleAddOpen();
  };
  const handleModifyTraining = () => {
    modifyTraining(
      trainingSelected,
      title,
      training_url,
      training_type,
      point_value,
      difficulty,
      question1,
      answer1,
      incorrect1_1,
      incorrect1_2,
      incorrect1_3,
      question2,
      answer2,
      incorrect2_1,
      incorrect2_2,
      incorrect2_3,
      question3,
      answer3,
      incorrect3_1,
      incorrect3_2,
      incorrect3_3
    );
    handleModifyOpen();
  };

  return (
    <>
      <AddTrainingModal
        addOpen={addOpen}
        handleAddOpen={handleAddOpen}
        URL={training_url}
        handleSetURL={handleSetURL}
        pointValue={point_value}
        handleSetPointValue={handleSetPointValue}
        difficulty={difficulty}
        handleSetDifficulty={handleSetDifficulty}
        title={title}
        handleSetTitle={handleSetTitle}
        modalPage={modalPage}
        handleSetModalPage={handleSetModalPage}
        question1={question1}
        answer1={answer1}
        incorrect1_1={incorrect1_1}
        incorrect1_2={incorrect1_2}
        incorrect1_3={incorrect1_3}
        question2={question2}
        answer2={answer2}
        incorrect2_1={incorrect2_1}
        incorrect2_2={incorrect2_2}
        incorrect2_3={incorrect2_3}
        question3={question3}
        answer3={answer3}
        incorrect3_1={incorrect3_1}
        incorrect3_2={incorrect3_2}
        incorrect3_3={incorrect3_3}
        handleSetQuestion={handleSetQuestion}
        handleSetAnswer={handleSetAnswer}
        handleSetIncorrect={handleSetIncorrect}
        handleCreateTraining={handleCreateTraining}
      />
      <ModifyTrainingModal
        modifyOpen={modifyOpen}
        handleModifyOpen={handleModifyOpen}
        URL={training_url}
        handleSetURL={handleSetURL}
        pointValue={point_value}
        handleSetPointValue={handleSetPointValue}
        difficulty={difficulty}
        handleSetDifficulty={handleSetDifficulty}
        title={title}
        handleSetTitle={handleSetTitle}
        modalPage={modalPage}
        handleSetModalPage={handleSetModalPage}
        question1={question1}
        answer1={answer1}
        incorrect1_1={incorrect1_1}
        incorrect1_2={incorrect1_2}
        incorrect1_3={incorrect1_3}
        question2={question2}
        answer2={answer2}
        incorrect2_1={incorrect2_1}
        incorrect2_2={incorrect2_2}
        incorrect2_3={incorrect2_3}
        question3={question3}
        answer3={answer3}
        incorrect3_1={incorrect3_1}
        incorrect3_2={incorrect3_2}
        incorrect3_3={incorrect3_3}
        handleSetQuestion={handleSetQuestion}
        handleSetAnswer={handleSetAnswer}
        handleSetIncorrect={handleSetIncorrect}
        handleModifyTraining={handleModifyTraining}
      />
      <DeleteTrainingModal
        deleteOpen={deleteOpen}
        handleDeleteOpen={handleDeleteOpen}
        training_title={title}
        handleDeleteTraining={handleDeleteTraining}
      />
      <div style={{ width: "90%", float: "left" }}>
        <Sidebar isOpen={sidebarOpen} toggleSidebar={handleViewSidebar} />
        <div
          style={{
            display: "flex",
            position: "relative",
            left: "5vw",
            flexDirection: "column",
            height: "100vh",
          }}
        >
          <div
            style={{ 
              display: "flex", 
              marginLeft: "6vh", 
              flexDirection: "row" 
            }}
          >
            <h1 
              style={{ 
                marginTop: "1vw", 
                paddingBottom: "2vh" 
              }}
            >
              <strong>Training:</strong>
            </h1>
            <div 
              style={{ 
                marginLeft: "40vw", 
                marginTop: "1vh" 
              }}
            >
              <ButtonDivComponent
                button1={true}
                button1_text={"Add"}
                button1_action={handleAddOpen}
                button2={true}
                button2_text={"Edit"}
                button2_action={handleModifyOpen}
                button3={true}
                button3_text={"Delete"}
                button3_action={handleDeleteOpen}
              />
            </div>
          </div>
          <Tabs>
            <TabList
              style={{ 
                marginLeft: "3vw", 
                marginTop: "0vh", 
                paddingTop: "0vh" 
              }}
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
            </TabList>
            <TabPanel>
              <AdminTrainingTable
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
              <AdminTrainingTable
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
              <AdminTrainingTable
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
          </Tabs>
        </div>
      </div>
    </>
  );
};
