import React, { useContext, useState, useEffect } from "react";
import { DataContext } from "common/DataContext";
import { AuthContext } from "../../common/AuthContext";
import useToggle from "../../hooks/useToggle.js";
import Sidebar from "../sidebar/sidebar";
import "./styles.css";
import { Table, TableBody, TablePagination } from "@mui/material";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import {
  ProjectRow,
  ProjectCell,
  TableCard,
  ListHead,
  CardMediaStyle,
  EXTERNAL_VALIDATIONS_HEADERS,
} from "components/commonComponents/commonComponents";
import {
  AddProjectModal,
  DeleteProjectModal,
  ModifyProjectModal,
} from "./taskComponents";

import { ButtonDivComponent } from "components/commonComponents/commonComponents";

export const AdminTasksPage = () => {
  const { refresh, user } = useContext(AuthContext);

  const {
    calculateProjectBudget,
    createProject,
    sidebarOpen,
    handleSetSidebarState,
    outputRate,
    externalValidations,
    setExternalValidations,
    fetchProjectUsers,
    projectUsers,
    deleteProject,
    projectSelectedDetails,
    updateTask,
    handleOutputRate,
    goToSource,
    userSelected,
    setUserSelected,
    generateRandomKey,
    fetchExternalValidations,
    assignUserProject,
    unassignUserProject,
    history,
  } = useContext(DataContext);

  const [url, setUrl] = useState(null);
  const [mappingRate, setMappingRate] = useState(0.0);
  const [validationRate, setValidationRate] = useState(0.0);
  const [maxEditors, setMaxEditors] = useState(1);
  const [maxValidators, setMaxValidators] = useState(1);
  const [visibility, toggleVisibility] = useToggle(true);
  const [addOpen, toggleAddOpen] = useToggle(false);
  const [deleteOpen, toggleDeleteOpen] = useToggle(false);
  const [modifyOpen, toggleModifyOpen] = useToggle(false);
  const [rateMethod, toggleRateMethod] = useToggle(true);
  const [projectSelected, setProjectSelected] = useState(null);
  const [projectSelectedName, setProjectSelectedName] = useState(null);
  const [projectDifficulty, setProjectDifficulty] = useState(null);
  const [assignmentStatus, setAssignmentStatus] = useState(null);
  const [projectStatus, toggleProjectStatus] = useToggle(false);
  const [activeTab, setActiveTab] = useState(1);
  const [assignmentButtonText, setAssignmentButtonText] = useState("Assign");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
    fetchExternalValidations();
    // eslint-disable-next-line
  }, []);
  useEffect(() => {
    // eslint-disable-next-line
  }, [externalValidations]);

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

  const handleSetMaxValidators = (e) => {
    setMaxValidators(e.target.value);
  };

  const handleSetProjectDifficulty = (e) => {
    setProjectDifficulty(e.target.value);
  };

  const handleSetValidationRate = (e) => {
    setValidationRate(e.target.value);
  };

  const handleSetMappingRate = (e) => {
    setMappingRate(e.target.value);
  };

  const handleToggleVisibility = (e) => {
    toggleVisibility();
  };

  const handleToggleRateMethod = (e) => {
    toggleRateMethod();
  };

  const handleCalculateRate = (e) => {
    calculateProjectBudget(
      url,
      rateMethod,
      mappingRate,
      validationRate,
      projectSelected
    );
  };

  const handleCreateProject = (e) => {
    createProject(
      url,
      rateMethod,
      mappingRate,
      validationRate,
      maxEditors,
      maxValidators,
      visibility
    );
    handleAddOpen();
  };

  const handleSetProjectSelected = (id, name) => {
    setProjectSelected(parseInt(id));
    setProjectSelectedName(name);
  };

  const handleDeleteProject = () => {
    deleteProject(projectSelected);
    handleDeleteOpen();
  };

  const handleAssignUser = () => {
    if (assignmentStatus === "No") {
      assignUserProject(projectSelected, userSelected);
    } else {
      unassignUserProject(projectSelected, userSelected);
    }
  };

  const handleValidateTask = () => {
    updateTask(projectSelected, "Validate");
  };
  const handleInvalidateTask = () => {
    updateTask(projectSelected, "Invalidate");
  };

  return (
    <>
      <AddProjectModal
        addOpen={addOpen}
        handleAddOpen={handleAddOpen}
        url={url}
        handleSetUrl={handleSetUrl}
        mapping_rate={mappingRate}
        handleSetMappingRate={handleSetMappingRate}
        validation_rate={validationRate}
        handleSetValidationRate={handleSetValidationRate}
        maxEditors={maxEditors}
        handleSetMaxEditors={handleSetMaxEditors}
        maxValidators={maxValidators}
        handleSetMaxValidators={handleSetMaxValidators}
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
        projectSelected={projectSelected}
        projectDifficulty={projectDifficulty}
        setProjectDifficulty={setProjectDifficulty}
        rateMethod={rateMethod}
        handleToggleRateMethod={handleToggleRateMethod}
        outputRate={outputRate}
        visibility={visibility}
        handleCalculateRate={handleCalculateRate}
        handleCreateProject={handleCreateProject}
        mapping_rate={mappingRate}
        handleSetMappingRate={handleSetMappingRate}
        validation_rate={validationRate}
        handleSetValidationRate={handleSetValidationRate}
        maxEditors={maxEditors}
        handleSetMaxEditors={handleSetMaxEditors}
        maxValidators={maxValidators}
        handleSetMaxValidators={handleSetMaxValidators}
        projectSelectedDetails={projectSelectedDetails}
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
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          height: "100%",
          float: "left",
        }}
      >
        <Sidebar isOpen={sidebarOpen} toggleSidebar={handleViewSidebar} />
        <div style={{ width: "100%", height: "100%" }}>
          <div
            style={{
              display: "flex",
              position: "relative",
              marginLeft: ".5vw",
              flexDirection: "column",
              height: "100vh",
            }}
          >
            <div
              style={{
                display: "flex",
                marginLeft: "6vh",
                flexDirection: "row",
              }}
            >
              <h1
                style={{
                  marginTop: "1vw",
                  paddingBottom: "2vh",
                }}
              >
                <strong>Tasks:</strong>
              </h1>
              <div
                style={{
                  marginTop: "2vw",
                  position: "relative",
                  left: "52vw",
                }}
              >
                <ButtonDivComponent
                  role={"admin"}
                  button1={true}
                  button2={true}
                  button1_text={"Validate"}
                  button2_text={"Invalidate"}
                  button1_action={handleValidateTask}
                  button2_action={handleInvalidateTask}
                />
              </div>
            </div>
            <Tabs>
              <TabList
                style={{
                  marginLeft: "3vw",
                  marginTop: "0vh",
                  paddingTop: "0vh",
                }}
              >
                <Tab value={1} onClick={(e) => handleSetActiveTab(e)}>
                  External Validations:
                </Tab>
              </TabList>

              <TabPanel>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    marginLeft: "3.5vw",
                    height: "79vh",
                    width: "77.5vw",
                  }}
                >
                  <TableCard style={{ boxShadow: "1px 1px 6px 2px gray" }}>
                    <CardMediaStyle />
                    <Table>
                      <div
                        style={{
                          height: "40vh",
                          width: "77.5vw",
                          overflowY: "scroll",
                        }}
                      >
                        <ListHead
                          headLabel={EXTERNAL_VALIDATIONS_HEADERS}
                          tableData={externalValidations}
                          updateData={setExternalValidations}
                        />
                        <TableBody>
                          {externalValidations &&
                            externalValidations
                              .slice(
                                page * rowsPerPage,
                                page * rowsPerPage + rowsPerPage
                              )
                              .map((row) => {
                                const {
                                  id,
                                  project_id,
                                  project_name,
                                  project_url,
                                  mapped_by,
                                  validated_by,
                                } = row;
                                return (
                                  <ProjectRow
                                    sx={{
                                      "&:hover": {
                                        backgroundColor:
                                          "rgba(145, 165, 172, 0.5)",
                                        cursor: "pointer",
                                      },
                                    }}
                                    align="center"
                                    key={id}
                                    tabIndex={-1}
                                    onClick={() => handleSetProjectSelected(id)}
                                    selected={projectSelected === id}
                                    onDoubleClick={() =>
                                      goToSource(project_url)
                                    }
                                  >
                                    <ProjectCell entry={id} />
                                    <ProjectCell entry={project_name} />
                                    <ProjectCell entry={project_id} />
                                    <ProjectCell entry={mapped_by} />
                                    <ProjectCell entry={validated_by} />
                                  </ProjectRow>
                                );
                              })}
                        </TableBody>
                      </div>
                    </Table>
                  </TableCard>
                </div>
              </TabPanel>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
};
