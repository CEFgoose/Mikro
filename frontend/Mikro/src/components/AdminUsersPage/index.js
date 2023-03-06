import React, { useContext, useState, useEffect } from "react";
import { InteractionContext } from "common/InteractionContext";
import { DataContext } from "common/DataContext";
import { AuthContext } from "common/AuthContext";
import { Table, TableBody, TablePagination } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  AddUserModal,
  DeleteUserModal,
  ModifyUserModal,
} from "./userComponents";
import Sidebar from "../sidebar/sidebar";
import useToggle from "../../hooks/useToggle.js";
import {
  ListHead,
  USERS_TABLE_HEADERS,
  ProjectRow,
  ProjectCell,
  TableCard,
  ButtonDivComponent,
  CardMediaStyle,
} from "../commonComponents/commonComponents";
import "./styles.css";

export const AdminUsersPage = () => {
  const { 
    orgUsers, 
    fetchOrgUsers, 
    inviteUser, 
    removeUser, 
    modifyUser 
  } = useContext(DataContext);

  const { sidebarOpen, handleSetSidebarState } = useContext(DataContext);
  const { refresh, user } = useContext(AuthContext);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [addOpen, toggleAddOpen] = useToggle(false);
  const [deleteOpen, toggleDeleteOpen] = useToggle(false);
  const [modifyOpen, toggleModifyOpen] = useToggle(false);
  const [userSelected, setUserSelected] = useState(null);
  const [roleSelected, setRoleSelected] = useState(null);
  const [inviteEmail, setInviteEmail] = useState(null);
  const [form, setForm] = useState({ name: "", desc: "" });

  useEffect(() => {
    fetchOrgUsers();
    // eslint-disable-next-line
  }, []);

  const handleChangeRowsPerPage = (e)=>{
    setRowsPerPage(e.target.value)
  }


  const handleAddOpen = () => {
    toggleAddOpen(!addOpen);
    // setForm({ name: "", desc: "" });
  };

  const handleDeleteOpen = () => {
    if (userSelected !== null) {
      toggleDeleteOpen();
    }
  };

  const handleModifyOpen = () => {
    if (userSelected !== null) {
      toggleModifyOpen();
    }
  };

  const handleSetUserSelected = (id) => {
    setUserSelected(id);
  };

  const handleViewSidebar = () => {
    handleSetSidebarState();
  };

  const handleRoleSelected = (e) => {
    setRoleSelected(e);
  };

  const handleSetInviteEmail = (e) => {
    setInviteEmail(e);
  };

  const do_modify_user = () => {
    if (userSelected) {
      modifyUser(userSelected, roleSelected);
      toggleModifyOpen();
    }
  };

  const do_remove_user = () => {
    if (userSelected) {
      removeUser(userSelected);
      toggleDeleteOpen();
    }
  };

  const do_invite_user = () => {
    if (inviteEmail) {
      inviteUser(inviteEmail);
      alert("Invitation Email Sent");
      toggleAddOpen();
    }
  };

  return (
    <>
      <AddUserModal
        addOpen={addOpen}
        form={form}
        handleAddOpen={handleAddOpen}
        handleSetInviteEmail={handleSetInviteEmail}
        setForm={setForm}
        do_invite_user={do_invite_user}
      />
      <DeleteUserModal
        deleteOpen={deleteOpen}
        selected_user={userSelected}
        handleDeleteOpen={handleDeleteOpen}
        do_remove_user={do_remove_user}
      />
      <ModifyUserModal
        modifyOpen={modifyOpen}
        roleSelected={roleSelected}
        handleModifyOpen={handleModifyOpen}
        handleRoleSelected={handleRoleSelected}
        do_modify_user={do_modify_user}
      />
      <div style={{ width: "100%", float: "left", backgroundColor: "Beige" }}>
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
            style={{ display: "flex", marginLeft: "5vh", flexDirection: "row" }}
          >
            <h1
              style={{
                marginLeft: ".5vw",
                marginTop: "1vw",
                paddingBottom: "2vh",
              }}
            >
              Users:
            </h1>

            <div
              style={{ marginTop: "1vw", position: "relative", left: "44vw" }}
            >
              {/* <ButtonDivComponent
                role={"admin"}
                handleAddOpen={handleAddOpen}
                handleDeleteOpen={handleDeleteOpen}
                modify_action={handleModifyOpen}
                // assign_action={handleShareOpen}
                assignText={"Share"}
                modifyText={"Edit"}
                userText={"Sequences"}
                page={"projects"}
              /> */}
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

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              marginLeft: "3vw",
              marginTop: "1vw",
              height: "82%",
              width: "79vw",
            }}
          >
            <TableCard style={{ boxShadow: "1px 1px 6px 2px gray" }}>
              <CardMediaStyle />
              <Table>
                <ListHead headLabel={USERS_TABLE_HEADERS} />
                <TableBody>
                  {orgUsers &&
                    orgUsers
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((row) => {
                        const {
                          id,
                          name,
                          role,
                          assigned_projects,
                          total_tasks_mapped,
                          total_tasks_validated,
                          total_tasks_invalidated,
                          awaiting_payment,
                          total_payout,
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
                            key={row}
                            tabIndex={-1}
                            onClick={() => handleSetUserSelected(id)}
                            selected={userSelected === id}
                            // onDoubleClick={() => view_all_project_sequences(value)}
                          >
                            <ProjectCell entry={name} />
                            <ProjectCell entry={role} />
                            <ProjectCell entry={assigned_projects} />
                            <ProjectCell entry={total_tasks_mapped} />
                            <ProjectCell entry={total_tasks_validated} />
                            <ProjectCell entry={total_tasks_invalidated} />
                            <ProjectCell entry={awaiting_payment} />
                            <ProjectCell entry={total_payout} />
                          </ProjectRow>
                        );
                      })}
                </TableBody>
              </Table>
              <TablePagination
                style={{ width: "100%" }}
                rowsPerPageOptions={[5, 10, 15]}
                component="div"
                count={orgUsers ? orgUsers.length : 5}
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
