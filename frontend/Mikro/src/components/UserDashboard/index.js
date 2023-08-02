import React, { useContext, useEffect, useState } from "react";
import { DataContext } from "../../common/DataContext";
import { AuthContext } from "../../common/AuthContext";
import Sidebar from "../sidebar/sidebar";
import { Table, TableBody, TablePagination } from "@mui/material";
import "./styles.css";
import {
  ListHead,
  USER_PROJECTS_TABLE_HEADERS,
  DashboardCard,
  ProjectRow,
  ProjectCell,
  TableCard,
  CardMediaStyle,
} from "components/commonComponents/commonComponents";

export const UserDashboard = () => {
  const {
    sidebarOpen,
    handleSetSidebarState,
    orgProjects,
    goToSource,
    activeProjects,
    setActiveProjects,
    completedProjects,
    tasksMapped,
    mapped_tasks,
    validated_tasks,
    invalidated_tasks,
    tasksValidated,
    tasksInvalidated,
    payableTotal,
    requestsTotal,
    paidTotal,
    activeProjectsCount,
    inactiveProjectsCount,
    fetchUserDashStats,
    fetchUserProjects,
    update_user_tasks,
    history,
  } = useContext(DataContext);

  const { refresh, user } = useContext(AuthContext);

  const [projectSelected, setProjectSelected] = useState(null);

  useEffect(() => {
    if (user) {
      refresh();
    }
    if (user === null) {
      history("/login");
      return;
    }
    if (user !== null && user.role !== "user") {
      history("/login");
      return;
    }
    if (user !== null && user.role === "user") {
      update_user_tasks();
      fetchUserDashStats();
      fetchUserProjects();
    }

    // eslint-disable-next-line
  }, []);

  const handleViewSidebar = () => {
    handleSetSidebarState();
  };

  const handleSetProjectSelected = (e) => {
    setProjectSelected(e);
  };

  const updateData = (sortedData) => {
    setActiveProjects(sortedData);
  };

  const navigateToFirstTraining = () => {
   history("/UserTrainingPage")
  }

  const nextTutorialStep = () => {
    let tempStep=tutorialStep 
    tempStep+=1
    setTutorialStep(tempStep);
    setDialogContent(tempStep);
  }

  const previousTutorialStep = () => {
    let tempStep=tutorialStep 
    tempStep-=1
    setTutorialStep(tempStep);
    setDialogContent(tempStep);
  }

  const setDialogContent = (tutorialStep) => {
    if( tutorialStep == 0 ) {
      setTutorialStepTitle('Welcome to Mikro!')
      setTutorialStepContent('This is an example')
    } else if( tutorialStep == 1 ) {
      setTutorialStepTitle('Dashboard')
      setTutorialStepContent(
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lore")
      setBarOptionSelected('dashboard')
    } else if( tutorialStep == 2 ) {
      setTutorialStepTitle('Checklists')
      setTutorialStepContent('This is an example')
      setBarOptionSelected('checklist')
    } else if( tutorialStep == 3 ) {
      setTutorialStepTitle('Projects')
      setTutorialStepContent('This is an example')
      setBarOptionSelected('project')
    } else if( tutorialStep == 4 ) {
      setTutorialStepTitle('Training')
      setTutorialStepContent('This is an example')
      setBarOptionSelected('training')
    } else if( tutorialStep == 5 ) {
      setTutorialStepTitle('Payments')
      setTutorialStepContent('This is an example')
      setBarOptionSelected('payments')
    } else if( tutorialStep == 6 ) {
      setTutorialStepTitle('Account')
      setTutorialStepContent('This is an example')
      setBarOptionSelected('account')
    } else if( tutorialStep == 7 ) {
      setTutorialStepTitle('FAQ')
      setTutorialStepContent('This is an example')
      setBarOptionSelected('faq')
    } else if( tutorialStep == 8 ) {
      setTutorialStepTitle('Congrats')
      setTutorialStepContent('Welcome to the team! Complete your first training to begin mapping!')
      setBarOptionSelected('')
    }
  }

  return (
    <>
    <div style={{ width: "90%", height: "90%", float: "left" }}>
    {showTutorial && (
      <TutorialDialog
        open ={true}
        onClose = {handleDialogClose}
        title ={tutorialStepTitle}
        content = {tutorialStepContent}
        button_1_text= {tutorialStep >= 1 ? "Previous" : "Skip" }
        button_1_action ={tutorialStep === 0 ? handleDialogClose : previousTutorialStep}
        button_2_text={tutorialStep === 8 ? "Go to Training" : "Next"}
        button_2_action = {tutorialStep === 8 ? navigateToFirstTraining : nextTutorialStep}
      />
    )}
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
              <h1 style={{ marginTop: "1vw", paddingBottom: "2vh" }}>
                <strong>Dashboard:</strong>
              </h1>
              <div
                style={{
                  marginTop: "1vw",
                  position: "relative",
                  left: "37.5vw",
                }}
              ></div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",

                height: "44vh",
              }}
            >
              <DashboardCard
                marginLeft={"3.5vw"}
                marginRight={"5vw"}
                width={"20vw"}
                title={"Projects Overview"}
                subtitle_text_1={"Joined:"}
                subtitle_text_2={"Available:"}
                subtitle_text_3={"Completed:"}
                value_1={activeProjectsCount ? activeProjectsCount : "-"}
                value_2={
                  inactiveProjectsCount !== null ? inactiveProjectsCount : "-"
                }
                value_3={completedProjects !== null ? completedProjects : "-"}
              />
              <DashboardCard
                marginLeft={"3.5vw"}
                marginRight={"5.5vw"}
                width={"20vw"}
                title={"Tasks Overview"}
                subtitle_text_1={"Awaiting Approval:"}
                subtitle_text_2={"Approved:"}
                subtitle_text_3={"Invalidated:"}
                value_1={tasksMapped !== null ? tasksMapped : "-"}
                value_2={tasksValidated !== null ? tasksValidated : "-"}
                value_3={tasksInvalidated !== null ? invalidated_tasks : "-"}
              />
              <DashboardCard
                marginLeft={"3.5vw"}
                width={"20vw"}
                title={"Payment Overview"}
                subtitle_text_1={"Payable Total:"}
                subtitle_text_2={"Payout Requests:"}
                subtitle_text_3={"Payouts to Date:"}
                value_1={`$${
                  payableTotal !== null ? payableTotal.toFixed(2) : "-"
                }`}
                value_2={`$${
                  requestsTotal !== null ? requestsTotal.toFixed(2) : "-"
                }`}
                value_3={`$${paidTotal !== null ? paidTotal.toFixed(2) : "-"}`}
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                marginLeft: "3.5vw",
                height: "42vh",
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
                      overflowY: "hidden",
                    }}
                  >
                    <ListHead
                      headLabel={USER_PROJECTS_TABLE_HEADERS}
                      tableData={activeProjects}
                      updateData={setActiveProjects}
                    />
                    <TableBody>
                      {activeProjects &&
                        activeProjects.slice().map((row) => {
                          const {
                            id,
                            name,
                            difficulty,
                            mapping_rate_per_task,
                            total_tasks,
                            tasks_mapped,
                            tasks_approved,
                            tasks_unapproved,
                            url,
                            user_earnings,
                          } = row;
                          return (
                            <ProjectRow
                              sx={{
                                "&:hover": {
                                  backgroundColor: "rgba(145, 165, 172, 0.5)",
                                  cursor: "pointer",
                                },
                              }}
                              align="center"
                              key={id}
                              tabIndex={-1}
                              onClick={() => handleSetProjectSelected(id)}
                              selected={projectSelected === id}
                              onDoubleClick={() => goToSource(url)}
                            >
                              <ProjectCell entry={<strong>{name}</strong>} />
                              <ProjectCell entry={difficulty} />
                              <ProjectCell
                                entry={`$${
                                  mapping_rate_per_task &&
                                  mapping_rate_per_task.toFixed(2)
                                }`}
                              />
                              <ProjectCell entry={total_tasks} />

                              <ProjectCell entry={tasks_mapped} />
                              <ProjectCell entry={tasks_approved} />
                              <ProjectCell entry={tasks_unapproved} />
                              <ProjectCell
                                entry={`$${
                                  user_earnings && user_earnings.toFixed(2)
                                }`}
                              />
                            </ProjectRow>
                          );
                        })}
                    </TableBody>
                  </div>
                </Table>
              </TableCard>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
