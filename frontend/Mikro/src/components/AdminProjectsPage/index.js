import React, { useContext, useState, useEffect } from "react";
import { DataContext } from "common/DataContext";
import { AuthContext } from "../../common/AuthContext";
import useToggle from "../../hooks/useToggle.js";
import Sidebar from "../sidebar/sidebar";
import "./styles.css";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import {
  AddProjectModal,
  DeleteProjectModal,
  ModifyProjectModal,
  ProjectCardGrid,
} from "./projectComponents";

import { ButtonDivComponent } from "components/commonComponents/commonComponents";

export const AdminProjectsPage = () => {
  const { refresh, user } = useContext(AuthContext);

  const {
    calculateProjectBudget,
    createProject,
    sidebarOpen,
    handleSetSidebarState,
    outputRate,
    fetchOrgProjects,
    activeProjects,
    inactiveProjects,
    fetchProjectUsers,
    projectUsers,
    deleteProject,
    findObjectById,
    projectSelectedDetails,
    setProjectSelectedDetails,
    handleOutputRate,
    updateProject,
    userSelected,
    setUserSelected,
    generateRandomKey,
    goToSource,
    assignUserProject,
    unassignUserProject,
    history,
  } = useContext(DataContext);

  const [url, setUrl] = useState(null);
  const [rate, setRate] = useState(0.0);
  const [maxEditors, setMaxEditors] = useState(1);
  const [visibility, toggleVisibility] = useToggle(true);
  const [addOpen, toggleAddOpen] = useToggle(false);
  const [deleteOpen, toggleDeleteOpen] = useToggle(false);
  const [modifyOpen, toggleModifyOpen] = useToggle(false);
  const [rateMethod, toggleRateMethod] = useToggle(true);
  const [projectSelected, setProjectSelected] = useState(null);
  const [projectDifficulty, setProjectDifficulty] = useState(null);
  const [assignmentStatus, setAssignmentStatus] = useState(null);
  const [projectStatus, toggleProjectStatus] = useToggle(false);
  const [activeTab, setActiveTab] = useState(1);
  const [assignmentButtonText, setAssignmentButtonText] = useState("Assign");

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
    fetchOrgProjects();
    // eslint-disable-next-line
  }, []);

  const handleSetActiveTab = (e) => {
    setActiveTab(e.target.value);
  };

  const handleAddOpen = () => {
    toggleAddOpen(!addOpen);
  };

  const handleDeleteOpen = () => {
    if (projectSelected !== null) {
      toggleDeleteOpen();
    }
  };

  const handleModifyOpen = () => {
    let selectedProject;
    if (projectSelected !== null) {
      if (activeTab === 1) {
        selectedProject = findObjectById(activeProjects, projectSelected);
      } else {
        selectedProject = findObjectById(inactiveProjects, projectSelected);
      }
      handleSetProjectStatus(selectedProject.status);
      setRate(selectedProject.rate_per_task);
      setMaxEditors(selectedProject.max_editors);
      setProjectDifficulty(selectedProject.difficulty);
      setProjectSelectedDetails(selectedProject);
      toggleModifyOpen();
    }
  };

  const handleSetUserSelected = (user_id, assignment_status) => {
    setUserSelected(user_id);
    setAssignmentStatus(assignment_status);
    if (assignment_status === "Yes") {
      setAssignmentButtonText("Unassign");
    } else {
      setAssignmentButtonText("Assign");
    }
  };

  const handleSetProjectStatus = (e) => {
    if (e !== null) {
      toggleProjectStatus(e);
    } else {
      toggleProjectStatus();
    }
  };

  const handleViewSidebar = () => {
    handleSetSidebarState();
  };

  const handleSetUrl = (e) => {
    setUrl(e.target.value);
  };

  const handleSetMaxEditors = (e) => {
    setMaxEditors(e.target.value);
  };

  const handleSetProjectDifficulty = (e) => {
    setProjectDifficulty(e.target.value);
  };

  const handleSetRate = (e) => {
    setRate(e.target.value);
  };

  const handleToggleVisibility = (e) => {
    toggleVisibility();
  };

  const handleToggleRateMethod = (e) => {
    toggleRateMethod();
  };

  const handleCalculateRate = (e) => {
    calculateProjectBudget(url, rateMethod, rate, projectSelected);
  };

  const handleCreateProject = (e) => {
    createProject(url, rateMethod, rate, maxEditors, visibility);
    handleAddOpen();
  };

  const handleSetProjectSelected = (e) => {
    setProjectSelected(parseInt(e.target.value));
  };

  const handleDeleteProject = () => {
    deleteProject(projectSelected);
    handleDeleteOpen();
  };

  const handleModifyProject = () => {
    updateProject(
      projectSelected,
      rateMethod,
      rate,
      maxEditors,
      visibility,
      projectDifficulty,
      projectStatus
    );
    handleModifyOpen();
  };

  const handleAssignUser = () => {
    if (assignmentStatus === "No") {
      assignUserProject(projectSelected, userSelected);
    } else {
      console.log("unassign");
      unassignUserProject(projectSelected, userSelected);
    }
  };

  return (
    <>
      <AddProjectModal
        addOpen={addOpen}
        handleAddOpen={handleAddOpen}
        url={url}
        handleSetUrl={handleSetUrl}
        rate={rate}
        handleSetRate={handleSetRate}
        maxEditors={maxEditors}
        handleSetMaxEditors={handleSetMaxEditors}
        visibility={visibility}
        handleToggleVisibility={handleToggleVisibility}
        rateMethod={rateMethod}
        handleToggleRateMethod={handleToggleRateMethod}
        outputRate={outputRate}
        handleCalculateRate={handleCalculateRate}
        handleCreateProject={handleCreateProject}
      />
      <DeleteProjectModal
        deleteOpen={deleteOpen}
        handleDeleteOpen={handleDeleteOpen}
        projectSelected={projectSelected}
        handleDeleteProject={handleDeleteProject}
      />
      <ModifyProjectModal
        modifyOpen={modifyOpen}
        handleModifyOpen={handleModifyOpen}
        projectSelected={projectSelected}
        projectDifficulty={projectDifficulty}
        setProjectDifficulty={setProjectDifficulty}
        rateMethod={rateMethod}
        handleToggleRateMethod={handleToggleRateMethod}
        outputRate={outputRate}
        visibility={visibility}
        handleCalculateRate={handleCalculateRate}
        handleCreateProject={handleCreateProject}
        rate={rate}
        maxEditors={maxEditors}
        handleSetRate={handleSetRate}
        handleModifyProject={handleModifyProject}
        projectSelectedDetails={projectSelectedDetails}
        handleSetMaxEditors={handleSetMaxEditors}
        handleSetProjectDifficulty={handleSetProjectDifficulty}
        handleToggleVisibility={handleToggleVisibility}
        handleOutputRate={handleOutputRate}
        fetchProjectUsers={fetchProjectUsers}
        projectUsers={projectUsers}
        userSelected={userSelected}
        handleSetUserSelected={handleSetUserSelected}
        generateRandomKey={generateRandomKey}
        assignmentButtonText={assignmentButtonText}
        assignmentStatus={assignmentStatus}
        handleAssignUser={handleAssignUser}
        projectStatus={projectStatus}
        handleSetProjectStatus={handleSetProjectStatus}
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
              Projects:
            </h1>
            <div
              style={{ marginTop: "1vw", position: "relative", left: "41.5vw" }}
            >
              <ButtonDivComponent
                role={"admin"}
                button1={true}
                button2={true}
                button3={true}
                button1_text={"Add"}
                button2_text={"Edit"}
                button3_text={"Delete"}
                button1_action={handleAddOpen}
                button2_action={handleModifyOpen}
                button3_action={handleDeleteOpen}
              />
            </div>
          </div>
          <Tabs>
            <TabList
              style={{ marginLeft: "3vw", marginTop: "0vh", paddingTop: "0vh" }}
            >
              <Tab value={1} onClick={(e) => handleSetActiveTab(e)}>
                Active
              </Tab>
              <Tab value={2} onClick={(e) => handleSetActiveTab(e)}>
                Inactive
              </Tab>
            </TabList>
            <TabPanel>
              <ProjectCardGrid
                key={1}
                goToSource={goToSource}
                projects={activeProjects}
                handleSetProjectSelected={handleSetProjectSelected}
                projectSelected={projectSelected}
              />
            </TabPanel>
            <TabPanel>
              <ProjectCardGrid
                key={1}
                goToSource={goToSource}
                projects={inactiveProjects}
                handleSetProjectSelected={handleSetProjectSelected}
                projectSelected={projectSelected}
              />
            </TabPanel>
          </Tabs>
        </div>
      </div>
    </>
  );
};
