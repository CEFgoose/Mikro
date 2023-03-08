import React, { useContext, useEffect, useState } from "react";
import { DataContext } from "../../common/DataContext";
import { AuthContext } from "../../common/AuthContext";
import Sidebar from "../sidebar/sidebar";
import { Redirect } from "react-router-dom";
import { Table, TableBody, TablePagination } from "@mui/material";
import {
  ListHead,
  PROJECTS_TABLE_HEADERS,
  DashboardCard,
  ProjectRow,
  ProjectCell,
  TableCard,
  CardMediaStyle,
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
    admin_update_all_user_tasks,
  } =useContext(DataContext);

  const { refresh, user } = useContext(AuthContext);
  const [redirect, setRedirect] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [projectSelected,setProjectSelected]=useState(null)
  // SETS STATE OF CONTROL SIDEBAR OPEN / COLLAPSED //
  const handleViewSidebar = () => {
    handleSetSidebarState();
  };
  useEffect(() => {
    if (user) {
      refresh();
    }
    if (user === null) {
      setRedirect(true);
    }
    if (user !== null && user.role !== "admin") {
      setRedirect(true);
    }
    fetchOrgProjects()
    fetchAdminDashStats()
    admin_update_all_user_tasks()
    // eslint-disable-next-line
  }, []);

  const handleSetProjectSelected =(e)=>{
    setProjectSelected(e)
  }

  const handleChangeRowsPerPage=(e)=>{
    setRowsPerPage(e.target.value)
  }

  return (
    <>
    <div style={{ width: "100%", float: "left"}}>
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
          <h1 style={{ marginTop: "1vw", paddingBottom: "2vh" }}>Dashboard:</h1>
          <div
            style={{ marginTop: "1vw", position: "relative", left: "37.5vw" }}
          >
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            height: "44vh",
          }}
        >
          <DashboardCard
            title={"Projects Overview"}
            subtitle_text_1={"Active:"}
            subtitle_text_2={"Inactive:"}
            subtitle_text_3={"Completed:"}
            value_1={activeProjectsCount}
            value_2={inactiveProjectsCount}
            value_3={completedProjects}
          />
          <DashboardCard
            title={"Tasks Overview"}
            subtitle_text_1={"Awaiting Approval:"}
            subtitle_text_2={"Approved:"}
            subtitle_text_3={"Invalidated:"}
            value_1={tasksMapped}
            value_2={tasksValidated}
            value_3={tasksInvalidated}
          />
          <DashboardCard
            title={"Payment Overview"}
            subtitle_text_1={"Payable Total:"}
            subtitle_text_2={"Payout Requests:"}
            subtitle_text_3={"Payouts to Date:"}
            value_1={`$${payableTotal}`}
            value_2={`$${requestsTotal}`}
            value_3={`$${paidTotal}`}
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
              <ListHead headLabel={PROJECTS_TABLE_HEADERS} />
              <TableBody>
                {activeProjects &&
                  activeProjects
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => {
                      const {
                        id,
                        name,
                        difficulty,
                        rate_per_task,
                        total_tasks,
                        tasks_mapped,
                        tasks_validated,
                        tasks_invalidated,
                        url,
                        source,
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
                          <ProjectCell entry={name} />
                          <ProjectCell entry={`$${rate_per_task}`} />
                          <ProjectCell entry={total_tasks} />
                          <ProjectCell entry={difficulty} />
                          <ProjectCell entry={`$${max_payment}`} />
                          <ProjectCell entry={`$${payment_due}`} />
                          <ProjectCell entry={`${tasks_validated}/${tasks_mapped}`} />
                          <ProjectCell entry={tasks_invalidated} />
                        </ProjectRow>
                      );
                    })}
              </TableBody>
            </Table>
            <TablePagination
            style={{ width: "100%" }}
            rowsPerPageOptions={[5, 10, 15]}
            component="div"
            count={orgProjects ? orgProjects.length : 5}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, page) => setPage(page)}
            onRowsPerPageChange={(e) => handleChangeRowsPerPage(e)}
          />
          </TableCard>
        </div>
      </div>
    </div>
    {!redirect ? <></> : <Redirect push to="/login" />}
    </>
  );
};
