import React, { useContext, useEffect, useState } from "react";
import { DataContext } from "../../common/DataContext";
import { AuthContext } from "../../common/AuthContext";
import Sidebar from "../sidebar/sidebar";
import { Table, TableBody, TablePagination } from "@mui/material";
import "./styles.css";
import {
  ListHead,
  USER_PROJECTS_TABLE_HEADERS ,
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
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

    }

    // eslint-disable-next-line
  }, []);


  useEffect(() => {

    console.log(tasksMapped)
    // eslint-disable-next-line
  }, [tasksMapped]);


  const handleViewSidebar = () => {
    handleSetSidebarState();
  };

  const handleSetProjectSelected = (e) => {
    setProjectSelected(e);
  };

  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(e.target.value);
  };

  return (
    <>
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
              <strong>
              Dashboard:
              </strong>

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
              subtitle_text_1={"Joined:"}
              subtitle_text_2={"Available:"}
              subtitle_text_3={"Completed:"}
              value_1={activeProjectsCount&&activeProjectsCount}
              value_2={inactiveProjectsCount&&inactiveProjectsCount}
              value_3={completedProjects&&completedProjects}
            />
            <DashboardCard
              marginLeft={"3.5vw"}
              marginRight={"5.5vw"}
              width={"20vw"}
              title={"Tasks Overview"}
              subtitle_text_1={"Awaiting Approval:"}
              subtitle_text_2={"Approved:"}
              subtitle_text_3={"Invalidated:"}
              value_1={tasksMapped&&tasksMapped}
              value_2={tasksValidated&&tasksValidated}
              value_3={tasksInvalidated&&invalidated_tasks}
            />
            <DashboardCard
              marginLeft={"3.5vw"}
              width={"20vw"}
              title={"Payment Overview"}
              subtitle_text_1={"Payable Total:"}
              subtitle_text_2={"Payout Requests:"}
              subtitle_text_3={"Payouts to Date:"}
              value_1={`$${payableTotal&&payableTotal.toFixed(2)}`}
              value_2={`$${requestsTotal&&requestsTotal.toFixed(2)}`}
              value_3={`$${paidTotal&&paidTotal.toFixed(2)}`}
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
                <ListHead headLabel={USER_PROJECTS_TABLE_HEADERS} />
                <TableBody>
                  {activeProjects &&
                    activeProjects
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((row) => {
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
                            <ProjectCell entry={`$${mapping_rate_per_task&&mapping_rate_per_task.toFixed(2)}`} />
                            <ProjectCell entry={total_tasks} />

                            <ProjectCell entry={tasks_mapped} />
                            <ProjectCell entry={tasks_approved} />
                            <ProjectCell entry={tasks_unapproved} />
                            <ProjectCell entry={`$${user_earnings&&user_earnings.toFixed(2)}`} />
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
    </>
  );
};
