import React, { useContext, useState, useEffect, useRef } from "react";
import csvtojson from "csvtojson";
import { poster } from "calls";
import { DataContext } from "common/DataContext";
import { AuthContext } from "common/AuthContext";
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
  const [userSelectedName, setUserSelectedName] = useState("");
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
    } else {
      alert("No user selected");
    }
  };

  const handleSetUserSelected = (id, name) => {
    setUserSelected(id);
    setUserSelectedName(name);
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

        // Send the JSON data to the backend for user creation
        try {
          let response = poster(json, "user/import_users");
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
        selected_user_name={userSelectedName}
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

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: "1vh",
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
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          height: "87vh",
        }}
      >
        <TableCard
          style={{
            overflowY: "scroll",
          }}
        >
          <CardMediaStyle />
          <Table>
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
                      onClick={() => handleSetUserSelected(id, name)}
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
                        entry={`$${total_payout && total_payout.toFixed(2)}`}
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
