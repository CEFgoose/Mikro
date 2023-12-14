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
} from "components/commonComponents/commonComponents";

import "./styles.css";
import Sidebar from "components/sidebar/sidebar";

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
    activeProjectsCount,
    inactiveProjectsCount,
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

  const updateData = (sortedData) => {
    setActiveProjects(sortedData);
  };

  return (
    <>
      <ConfirmationModal
        confirmOpen={confirmOpen}
        handleConfirmOpen={handleConfirmOpen}
        question={confirmQuestion}
        extraText={confirmText}
      />
      <div>
        <h1>
          <strong>Dashboard:</strong>
        </h1>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          height: "44vh",
        }}
      >
        <DashboardCard
          marginRight={"5vw"}
          width={"20vw"}
          title={"Projects Overview"}
          subtitle_text_1={"Active:"}
          subtitle_text_2={"Inactive:"}
          subtitle_text_3={"Completed:"}
          value_1={activeProjectsCount !== null ? activeProjectsCount : "-"}
          value_2={inactiveProjectsCount !== null ? inactiveProjectsCount : "-"}
          value_3={completedProjects !== null ? completedProjects : "-"}
        />
        <DashboardCard
          marginRight={"5.5vw"}
          width={"20vw"}
          title={"Tasks Overview"}
          subtitle_text_1={"Awaiting Approval:"}
          subtitle_text_2={"Approved:"}
          subtitle_text_3={"Invalidated:"}
          value_1={tasksMapped !== null ? tasksMapped : "-"}
          value_2={tasksValidated !== null ? tasksValidated : "-"}
          value_3={tasksInvalidated !== null ? tasksInvalidated : "-"}
        />
        <DashboardCard
          width={"20vw"}
          title={"Payment Overview"}
          subtitle_text_1={"Payable Total:"}
          subtitle_text_2={"Payout Requests:"}
          subtitle_text_3={"Payouts to Date:"}
          value_1={`$${payableTotal !== null ? payableTotal.toFixed(2) : "-"}`}
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
          height: "42vh",
          width: "77.5vw",
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
