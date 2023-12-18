import React, { useContext, useEffect, useState } from "react";
import { DataContext } from "../../common/DataContext";
import { AuthContext } from "../../common/AuthContext";
import { Table, TableBody } from "@mui/material";
import { ConfirmationModal } from "components/AdminChecklistsPage/checklistComponents";
import {
  ListHead,
  CardMediaStyle,
  ADMIN_PROJECTS_TABLE_HEADERS,
  DashboardCard,
  ProjectRow,
  ProjectCell,
  TableCard,
  TasksMappedCard,
  ValidationCard,
  PaymentCard,
} from "components/commonComponents/commonComponents";

import "./styles.css";

export const AdminDash = () => {
  // DATA CONTEXT STATES AND FUNCTIONS //
  const {
    orgProjects,
    fetchOrgProjects,
    goToSource,
    fetchAdminDashStats,
    activeProjects,
    setActiveProjects,
    completedProjects,
    tasksMapped,
    tasksValidated,
    tasksInvalidated,
    payableTotal,
    requestsTotal,
    paidTotal,
    contributionsOvertime,
    contributionsForMonth,
    monthlyContributionChange,
    setConfirmQuestion,
    confirmQuestion,
    toggleConfirmOpen,
    confirmOpen,
    confirmText,
    admin_update_all_user_tasks,
    history,
    externalValidations,
    fetchExternalValidations,
  } = useContext(DataContext);

  const { refresh, user } = useContext(AuthContext);
  const [projectSelected, setProjectSelected] = useState(null);
  // SETS STATE OF CONTROL SIDEBAR OPEN / COLLAPSED //

  useEffect(() => {
    if (user) {
      refresh();
    }
    if (user !== null && user.role === "admin") {
      admin_update_all_user_tasks();
      fetchOrgProjects();
      fetchAdminDashStats();
      fetchExternalValidations();
    } else {
      history("/login");
      return;
    }
  }, []);

  useEffect(() => {
    if (externalValidations.length > 0) {
      setConfirmQuestion(
        `You have ${externalValidations.length} tasks with unknown validators to confirm on the Tasks page`
      );
      toggleConfirmOpen();
    }
  }, [externalValidations]);

  const handleConfirmOpen = () => {
    toggleConfirmOpen();
  };

  const handleSetProjectSelected = (e) => {
    setProjectSelected(e);
  };

  return (
    <>
      <ConfirmationModal
        confirmOpen={confirmOpen}
        handleConfirmOpen={handleConfirmOpen}
        question={confirmQuestion}
        extraText={confirmText}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          position: "relative",
          justifyContent: "space-between",
          marginBottom: "1vh",
        }}
      >
        <TasksMappedCard
          title={"Tasks Mapped This Month"}
          tasksMapped={contributionsForMonth}
          lineData={contributionsOvertime}
          change={monthlyContributionChange}
          width={"22vw"}
        />

        <ValidationCard
          title={"Validation Overview"}
          progressBar={[
            {
              title: "Tasks Needing Vaidation",
              total: tasksMapped,
              current: tasksMapped - tasksValidated - tasksInvalidated,
              color: "#4caf50",
            },
            {
              title: "Approved Tasks",
              total: tasksMapped,
              current: tasksValidated,
              color: "#34abeb",
            },
            {
              title: "Invalidated Tasks",
              total: tasksMapped,
              current: tasksInvalidated,
              color: "#eb3434",
            },
          ]}
        />

        <PaymentCard
          title={"Queued Payment Total"}
          subtitle={"Overall Paid Amount"}
          role={user.role}
          currentBalance={
            requestsTotal !== null ? requestsTotal.toFixed(2) : "-"
          }
          overallAccountPayment={`$${
            payableTotal !== null ? payableTotal.toFixed(2) : "-"
          }`}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          height: "67vh",
        }}
      >
        <TableCard
          style={{
            boxShadow: "1px 1px 6px 2px gray",
            overflow: "auto",
          }}
        >
          <CardMediaStyle />
          <Table>
            <ListHead
              headLabel={ADMIN_PROJECTS_TABLE_HEADERS}
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
                    total_mapped,
                    total_validated,
                    total_invalidated,
                    url,
                    max_payment,
                    payment_due,
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
                      {/* <ProjectCell entry={difficulty} /> */}
                      <ProjectCell
                        entry={`$${max_payment && max_payment.toFixed(2)}`}
                      />
                      <ProjectCell
                        entry={`$${payment_due && payment_due.toFixed(2)}`}
                      />
                      <ProjectCell
                        entry={`${total_validated}/${total_mapped}`}
                      />
                      <ProjectCell entry={total_invalidated} />
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
