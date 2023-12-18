import React, { useContext, useEffect, useState } from "react";
import { DataContext } from "../../common/DataContext";
import { AuthContext } from "../../common/AuthContext";
import { Table, TableBody, TablePagination } from "@mui/material";
import useToggle from "../../hooks/useToggle.js";
import "./styles.css";
import {
  ListHead,
  USER_PROJECTS_TABLE_HEADERS,
  DashboardCard,
  ProjectRow,
  ProjectCell,
  TableCard,
  CardMediaStyle,
  TutorialDialog,
  TasksMappedCard,
  ValidationCard,
  PaymentCard,
} from "components/commonComponents/commonComponents";

export const UserDashboard = () => {
  const {
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
    BarOptionSelected,
    setBarOptionSelected,
    tutorialStepTitle,
    setTutorialStepTitle,
    tutorialStepContent,
    setTutorialStepContent,
    contributionsForMonth,
    contributionsOvertime,
    monthlyContributionChange,
  } = useContext(DataContext);

  const { refresh, user } = useContext(AuthContext);

  const [projectSelected, setProjectSelected] = useState(null);
  const [showTutorial, setShowTutorial] = useToggle(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    if (user !== null && user.role !== "user") {
      history("/login");
      return;
    } else {
      refresh();
      update_user_tasks();
      fetchUserDashStats();
      fetchUserProjects();
    }

    // Check if it's user's first login from local storage
    if (localStorage.getItem("firstLogin") === "true") {
      // Set showTutorial to true to display tutorial
      setShowTutorial(true);
      setTutorialStepTitle("Welcome to Mikro!");
      setTutorialStepContent("This is an example");
      setTutorialStep(0);
      localStorage.setItem("firstLogin", "false");
    }
  }, []);

  const handleSetProjectSelected = (e) => {
    setProjectSelected(e);
  };

  const handleDialogClose = () => {
    setBarOptionSelected("");
    setShowTutorial(false);
  };

  const navigateToFirstTraining = () => {
    history("/UserTrainingPage");
  };

  const nextTutorialStep = () => {
    let tempStep = tutorialStep;
    tempStep += 1;
    setTutorialStep(tempStep);
    setDialogContent(tempStep);
  };

  const previousTutorialStep = () => {
    let tempStep = tutorialStep;
    tempStep -= 1;
    setTutorialStep(tempStep);
    setDialogContent(tempStep);
  };

  const setDialogContent = (tutorialStep) => {
    if (tutorialStep == 0) {
      setTutorialStepTitle("Welcome to Mikro!");
      setTutorialStepContent("");
    } else if (tutorialStep == 1) {
      setTutorialStepTitle("Dashboard");
      setTutorialStepContent(
        "On the dashboard page you'll find a summary of your mapping activity and a payment overview"
      );
      setBarOptionSelected("dashboard");
    } else if (tutorialStep == 2) {
      setTutorialStepTitle("Checklists");
      setTutorialStepContent(
        "On the checklist page you'll be able to see avaliable and assigned non-mapping projects"
      );
      setBarOptionSelected("checklist");
    } else if (tutorialStep == 3) {
      setTutorialStepTitle("Projects");
      setTutorialStepContent(
        "On the project page page you'll be able to see avaliable and assigned mapping projects"
      );
      setBarOptionSelected("project");
    } else if (tutorialStep == 4) {
      setTutorialStepTitle("Training");
      setTutorialStepContent(
        "You must complete quizzes on the training page to begin mapping and level up your SOME LANGUAGE HERE ABOUT BECOMING A HIGHER LEVEL MAPPER."
      );
      setBarOptionSelected("training");
    } else if (tutorialStep == 5) {
      setTutorialStepTitle("Payments");
      setTutorialStepContent(
        "summary of past and potential payments and the ability to request a payment"
      );
      setBarOptionSelected("payments");
    } else if (tutorialStep == 6) {
      setTutorialStepTitle("Account");
      setTutorialStepContent(
        "If you ever want to change any of your account information this is the page for you"
      );
      setBarOptionSelected("account");
    } else if (tutorialStep == 7) {
      setTutorialStepTitle("FAQ");
      setTutorialStepContent(
        "I'm sure many of your questions still need to be answered here. The FAQ will go into more depth. Interact with our chatbot to have your questions answered fast."
      );
      setBarOptionSelected("faq");
    } else if (tutorialStep == 8) {
      setTutorialStepTitle("Congrats");
      setTutorialStepContent(
        "Welcome to the team! Complete your first training to begin mapping!"
      );
      setBarOptionSelected("");
    }
  };

  return (
    <>
      {showTutorial && (
        <TutorialDialog
          open={true}
          onClose={handleDialogClose}
          title={tutorialStepTitle}
          content={tutorialStepContent}
          button_1_text={tutorialStep >= 1 ? "Previous" : "Skip"}
          button_1_action={
            tutorialStep === 0 ? handleDialogClose : previousTutorialStep
          }
          button_2_text={tutorialStep === 8 ? "Go to Training" : "Next"}
          button_2_action={
            tutorialStep === 8 ? navigateToFirstTraining : nextTutorialStep
          }
        />
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          position: "relative",
          justifyContent: "space-between",
        }}
      >
        <TasksMappedCard
          title={"Tasks Mapped This Month"}
          tasksMapped={contributionsForMonth}
          lineData={contributionsOvertime}
          change={monthlyContributionChange}
        />

        <ValidationCard
          title={"Validation Overview"}
          progressBar={[
            {
              title: "Approved Tasks",
              total: tasksMapped,
              current: tasksValidated,
              color: "#4caf50",
            },
            {
              title: "Invalidated Tasks",
              total: tasksMapped,
              current: tasksInvalidated,
              color: "#34abeb",
            },
          ]}
        />
        <PaymentCard
          title={"Your Current Balance"}
          currentBalance={payableTotal !== null ? payableTotal.toFixed(2) : "-"}
          overallAccountPayment={`$${
            paidTotal !== null ? paidTotal.toFixed(2) : "-"
          }`}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          height: "66vh",
        }}
      >
        <TableCard
          style={{
            overflow: "auto",
          }}
        >
          <CardMediaStyle />
          <Table>
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
                        entry={`$${user_earnings && user_earnings.toFixed(2)}`}
                      />
                    </ProjectRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableCard>
      </div>
    </>
  );
};
