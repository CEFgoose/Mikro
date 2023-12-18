import React, { useContext, useEffect, useState } from "react";
import { DataContext } from "../../common/DataContext";
import { AuthContext } from "../../common/AuthContext";
import Sidebar from "../sidebar/sidebar";
import { Table, TableBody, TablePagination } from "@mui/material";
import "./styles.css";
import {
  ListHead,
  VALIDATOR_PROJECTS_TABLE_HEADERS,
  DashboardCard,
  ProjectRow,
  ProjectCell,
  TableCard,
  CardMediaStyle,
  TasksMappedCard,
  ValidationCard,
  PaymentCard,
} from "components/commonComponents/commonComponents";

export const ValidatorDashboard = () => {
  const {
    orgProjects,
    goToSource,
    activeProjects,
    setActiveProjects,
    completedProjects,
    tasksMapped,
    tasksValidated,
    tasksInvalidated,
    payableTotal,
    requestsTotal,
    paidTotal,
    activeProjectsCount,
    inactiveProjectsCount,
    fetchValidatorDashStats,
    fetchValidatorProjects,
    validatorTasksInvalidated,
    validatorTasksValidated,
    update_validator_tasks,
    history,
  } = useContext(DataContext);

  const { refresh, user } = useContext(AuthContext);
  const [projectSelected, setProjectSelected] = useState(null);

  useEffect(() => {
    if (user !== null && user.role !== "validator") {
      history("/login");
      return;
    } else {
      refresh();
      update_validator_tasks();
      fetchValidatorProjects();
      fetchValidatorDashStats();
    }
  }, []);

  const handleSetProjectSelected = (e) => {
    setProjectSelected(e);
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          position: "relative",
          justifyContent: "space-between",
        }}
      >
        <TasksMappedCard
          title={"Tasks Mapped"}
          tasksMapped={tasksMapped}
          lineData={[1, 1, 15, 17, 20, 3, 7, 1]}
        />

        <ValidationCard
          title={"Validation Overview"}
          progressBar={[
            {
              title: "Approved Tasks",
              total: tasksMapped,
              current: validatorTasksValidated,
              color: "#4caf50",
            },
            {
              title: "Approved Tasks",
              total: tasksMapped,
              current: validatorTasksInvalidated,
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
            overflowY: "auto",
          }}
        >
          <CardMediaStyle />
          <Table>
            <ListHead
              headLabel={VALIDATOR_PROJECTS_TABLE_HEADERS}
              tableData={activeProjects}
              updateData={setActiveProjects}
            />
            <TableBody>
              {activeProjects &&
                activeProjects.slice().map((row) => {
                  const {
                    id,
                    name,
                    mapping_rate_per_task,
                    validation_rate_per_task,
                    total_tasks,
                    tasks_mapped,
                    tasks_validated,
                    tasks_invalidated,
                    url,
                    max_payment,
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
                      <ProjectCell
                        entry={`$${
                          mapping_rate_per_task &&
                          mapping_rate_per_task.toFixed(2)
                        }`}
                      />
                      <ProjectCell
                        entry={`$${
                          validation_rate_per_task &&
                          validation_rate_per_task.toFixed(2)
                        }`}
                      />
                      <ProjectCell entry={total_tasks} />
                      <ProjectCell entry={tasks_mapped} />
                      <ProjectCell entry={tasks_validated} />
                      <ProjectCell entry={tasks_invalidated} />
                      <ProjectCell entry={tasks_validated} />
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
