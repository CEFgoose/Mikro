import React, { useContext, useState, useEffect, useRef } from "react";
import csvtojson from "csvtojson";
import { poster } from "calls";
import { DataContext } from "common/DataContext";
import { AuthContext } from "common/AuthContext";
import Sidebar from "../sidebar/sidebar";
import useToggle from "../../hooks/useToggle.js";
import "./styles.css";
import { Table, TableBody, TablePagination } from "@mui/material";
import {
  AddUserModal,
  DeleteUserModal,
  ModifyUserModal,
} from "./userComponents";
import {
  ListHead,
  USERS_TABLE_HEADERS,
  ProjectRow,
  ProjectCell,
  TableCard,
  ButtonDivComponent,
  CardMediaStyle,
} from "../commonComponents/commonComponents";

export const AdminUsersPage = () => {
  const {
    sidebarOpen,
    handleSetSidebarState,
    orgUsers,
    setOrgUsers,
    fetchOrgUsers,
    inviteUser,
    removeUser,
    modifyUser,
    history,
  } = useContext(DataContext);

  const { refresh, user } = useContext(AuthContext);
  const [addOpen, toggleAddOpen] = useToggle(false);
  const [deleteOpen, toggleDeleteOpen] = useToggle(false);
  const [modifyOpen, toggleModifyOpen] = useToggle(false);
  const [userSelected, setUserSelected] = useState(null);
  const [roleSelected, setRoleSelected] = useState(null);
  const [inviteEmail, setInviteEmail] = useState(null);
  const [form, setForm] = useState({ name: "", desc: "" });
  const [selectedFile, setSelectedFile] = useState(null);

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
    fetchOrgUsers();
    // eslint-disable-next-line
  }, []);

  const handleAddOpen = () => {
    toggleAddOpen(!addOpen);
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
      inviteUser(inviteEmail, "mikro");
      alert("Invitation Email Sent");
      toggleAddOpen();
    }
  };

  const updateData = (sortedData) => {
    setOrgUsers(sortedData);
  };

  const handleFileSelect = async (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileContents = event.target.result;
        const json = await csvtojson().fromString(fileContents);
        console.log(json);

        // Send the JSON data to the backend for user creation
        try {
          let response = poster(json, "user/import_users");
          console.log("RESPONSE!",response);
          // const response = await fetch(
          //   "../../../../backend/api/views/Users/import_users",
          //   {
          //     method: "POST",
          //     headers: {
          //       "Content-Type": "application/json",
          //     },
          //     body: JSON.stringify(json),
          //   }
          // );

          // // Handle the response from the backend
          // if (response.ok) {
          //   const data = await response.json();
          //   console.log(data);
          //   // Optionally, perform any necessary UI updates or show a success message
          // } else {
          //   console.error("Failed to import users:", response.statusText);
          //   // Optionally, show an error message or handle the error
          // }
        } catch (error) {
          console.error("Error importing users:", error);
          // Optionally, show an error message or handle the error
        }
      };
      reader.readAsText(file);
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
      <div style={{ width: "90%", float: "left" }}>
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
              marginLeft: "5vh",
              flexDirection: "row",
            }}
          >
            <h1
              style={{
                marginLeft: ".5vw",
                marginTop: "1vw",
                paddingBottom: "2vh",
              }}
            >
              <strong>Users:</strong>
            </h1>
            <div
              style={{
                marginTop: "2vw",
                position: "relative",
                left: "44vw",
              }}
            >
              <ButtonDivComponent
                handleFileSelect={handleFileSelect}
                role={"admin"}
                button1={true}
                button2={true}
                button3={true}
                button4={true}
                button1_text={"Add"}
                button2_text={"Edit"}
                button3_text={"Delete"}
                button4_text={"Import"}
                button1_action={handleAddOpen}
                button2_action={handleModifyOpen}
                button3_action={handleDeleteOpen}
                button4_action={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".csv";
                  input.onchange = handleFileSelect;
                  input.click();
                }}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              marginLeft: "3vw",
              marginTop: "1vw",
              height: "85%",
              width: "79vw",
            }}
          >
            <TableCard style={{ boxShadow: "1px 1px 6px 2px gray" }}>
              <CardMediaStyle />
              <Table style={{}}>
                <div
                  style={{
                    height: "40vh",
                    width: "77.5vw",
                    overflowY: "scroll",
                  }}
                >
                  <ListHead
                    headLabel={USERS_TABLE_HEADERS}
                    tableData={orgUsers}
                    updateData={setOrgUsers}
                  />
                  <TableBody>
                    {orgUsers &&
                      orgUsers.slice().map((row) => {
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
                          >
                            <ProjectCell entry={<strong>{name}</strong>} />
                            <ProjectCell entry={role} />
                            <ProjectCell entry={assigned_projects} />
                            <ProjectCell entry={total_tasks_mapped} />
                            <ProjectCell entry={total_tasks_validated} />
                            <ProjectCell entry={total_tasks_invalidated} />
                            <ProjectCell
                              entry={`$${
                                awaiting_payment && awaiting_payment.toFixed(2)
                              }`}
                            />
                            <ProjectCell
                              entry={`$${
                                total_payout && total_payout.toFixed(2)
                              }`}
                            />
                          </ProjectRow>
                        );
                      })}
                  </TableBody>
                </div>
              </Table>
              {/* <TablePagination
                style={{ width: "100%" }}
                rowsPerPageOptions={[5, 10, 15]}
                component="div"
                count={orgUsers ? orgUsers.length : 5}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, page) => setPage(page)}
                onRowsPerPageChange={(e) => handleChangeRowsPerPage(e)}
              /> */}
            </TableCard>
          </div>
        </div>
      </div>
    </>
  );
};
