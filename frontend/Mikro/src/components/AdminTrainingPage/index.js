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
  const [addOpen, toggleAddOpen] = useToggle(false);
  const [deleteOpen, toggleDeleteOpen] = useToggle(false);
  const [modifyOpen, toggleModifyOpen] = useToggle(false);

  const [trainingSelected, setTrainingSelected] = useState(null);
  const [trainingSelectedTitle, setTrainingSelectedTitle] = useState(null);
  const [trainingSelectedURL, setTrainingSelectedURL] = useState(null);
  const [trainingSelectedValue, setTrainingSelectedValue] = useState(null);
  const [trainingSelectedQuestions, setTrainingSelectedQuestions] =
    useState(null);
  const [trainingSelectedDifficulty, setTrainingSelectedDifficulty] =
    useState(null);

  const [training_type, setTrainingType] = useState("Mapping");

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

  const handleSetTrainingSelected = (training) => {
    setTrainingSelected(training.id);
    setTrainingSelectedTitle(training.title);
    setTrainingSelectedURL(training.training_url);
    setTrainingSelectedValue(training.point_value);
    setTrainingSelectedQuestions(training.questions);
    setTrainingSelectedDifficulty(training.difficulty);
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

    toggleAddOpen();
  };

  const handleDeleteOpen = () => {
    toggleDeleteOpen();
  };

  const handleDeleteTraining = () => {
    deleteTraining(trainingSelected, trainingSelectedTitle);
    handleDeleteOpen();
  };

  const handleSetTitle = (e) => {
    setTrainingSelectedTitle(e.target.value);
  };

  const handleSetURL = (e) => {
    setTrainingSelectedURL(e.target.value);
  };

  const handleSetPointValue = (e) => {
    setTrainingSelectedValue(e.target.value);
  };

  const handleSetDifficulty = (e) => {
    setTrainingSelectedDifficulty(e.target.value);
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

  const handleModifyTraining = () => {
    modifyTraining();
    handleModifyOpen();
  };

  return (
    <>
      <AddTrainingModal
        addOpen={addOpen}
        handleAddOpen={handleAddOpen}
        trainingType={"Mapping"}
        modalPage={modalPage}
      />
      <ModifyTrainingModal
        modifyOpen={modifyOpen}
        handleModifyOpen={handleModifyOpen}
        handleModifyTraining={handleModifyTraining}
        difficulty={trainingSelectedDifficulty}
        title={trainingSelectedTitle}
        training_url={trainingSelectedURL}
        pointValue={trainingSelectedValue}
        questions={trainingSelectedQuestions}
        trainingSelectedQuestions={trainingSelectedQuestions}
        trainingSelected={trainingSelected}
        trainingType={"Mapping"}
        handleSetTitle={handleSetTitle}
        handleSetURL={handleSetURL}
        handleSetPointValue={handleSetPointValue}
        setTrainingSelectedQuestions={setTrainingSelectedQuestions}
        handleSetDifficulty={handleSetDifficulty}
      />
      <DeleteTrainingModal
        deleteOpen={deleteOpen}
        handleDeleteOpen={handleDeleteOpen}
        training_title={trainingSelectedTitle}
        handleDeleteTraining={handleDeleteTraining}
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
          </TabList>
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
        <TabPanel>
          <AdminTrainingTable
            training_type={training_type}
            orgTrainings={orgMappingTrainings}
            setOrgTrainings={setOrgMappingTrainings}
            trainingSelected={trainingSelected}
            handleSetTrainingSelected={handleSetTrainingSelected}
          />
        </TabPanel>
        <TabPanel>
          <AdminTrainingTable
            trainingSelected={trainingSelected}
            orgTrainings={orgValidationTrainings}
            setOrgTrainings={setOrgValidationTrainings}
            handleSetTrainingSelected={handleSetTrainingSelected}
          />
        </TabPanel>
        <TabPanel>
          <AdminTrainingTable
            trainingSelected={trainingSelected}
            handleSetTrainingSelected={handleSetTrainingSelected}
            orgTrainings={orgProjectTrainings}
            setOrgTrainings={setOrgProjectTrainings}
          />
        </TabPanel>
      </Tabs>
    </>
  );
};
