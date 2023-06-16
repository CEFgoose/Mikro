import React, { useContext, useEffect, useState } from "react";
import { DataContext } from "../../common/DataContext";
import { AuthContext } from "../../common/AuthContext";
import Sidebar from "../sidebar/sidebar";
import { Table, TableBody} from "@mui/material";
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

export const AdminDash = () => {
  // DATA CONTEXT STATES AND FUNCTIONS //

  const {
    sidebarOpen,
    handleSetSidebarState,
    orgProjects,
    fetchOrgProjects,
    goToSource,
    fetchAdminDashStats,
    activeProjects,
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
  const handleViewSidebar = () => {
    handleSetSidebarState();
  };
  useEffect(() => {
    if (user) {
      refresh();
    }
    if (user === null) {
      history("/login");
      return;
    }
    if (user !== null && user.role !== "admin") {
      history("/login");
      return;
    }
    if (user !== null && user.role === "admin") {
      admin_update_all_user_tasks();
      fetchOrgProjects();
      fetchAdminDashStats();
      fetchExternalValidations();
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if(externalValidations.length > 0){
      setConfirmQuestion(`You have ${externalValidations.length} tasks with unknown validators to confirm on the Tasks page`)
      toggleConfirmOpen()
    }
    // eslint-disable-next-line
  }, [externalValidations]);

  const handleConfirmOpen=()=>{
    toggleConfirmOpen()
  }


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
              <strong>Dashboard:</strong>
            </h1>
            <div
              style={{ marginTop: "1vw", position: "relative", left: "37.5vw" }}
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
              subtitle_text_1={"Active:"}
              subtitle_text_2={"Inactive:"}
              subtitle_text_3={"Completed:"}
              value_1={activeProjectsCount !== null ? activeProjectsCount : "-"}
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
              value_3={tasksInvalidated !== null ? tasksInvalidated : "-"}
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
              <Table style={{}}>
                <div style={{height:'40vh', width:'77.5vw',overflowY:'scroll'}}>
                <ListHead headLabel={ADMIN_PROJECTS_TABLE_HEADERS} />
                <TableBody >
                  {activeProjects &&
                    activeProjects
                      .slice()
                      .map((row) => {
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
                              entry={`$${
                                max_payment && max_payment.toFixed(2)
                              }`}
                            />
                            <ProjectCell
                              entry={`$${
                                payment_due && payment_due.toFixed(2)
                              }`}
                            />
                            <ProjectCell
                              entry={`${total_validated}/${total_mapped}`}
                            />
                            <ProjectCell entry={total_invalidated} />
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
    </>
  );
};
