import React, { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import { Modal, Table, TableBody } from "@mui/material";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import {
  CancelButton,
  CloseButton,
  ConfirmButton,
  SectionTitle,
  SectionSubtitle,
  ModalWrapper,
  StyledButton,
  ASSIGN_USERS_TABLE_HEADERS,
  ProjectRow,
  ProjectCell,
  TableCard,
  ListHead,
} from "../commonComponents/commonComponents";

export const AdminCardMediaStyle = styled("div")(({ theme }) => ({
  display: "flex",
  position: "relative",
  backgroundColor: "#f4753c",
  paddingTop: "1vh",
  "&:before": {
    top: 0,
    width: "100%",
    height: "100%",
    position: "absolute",
    WebkitBackdropFilter: "blur(3px)", // Fix on Mobile
    fontWeight: "400",
  },
}));

export const AddProjectModal = (props) => {
  return (
    <Modal open={props.addOpen} key="add">
      <ModalWrapper>
        <CloseButton close_action={props.handleAddOpen} />
        <SectionTitle title_text={"Add New Project"} bold={true} />
        <SectionSubtitle
          bold={true}
          subtitle_text={"Enter the details about your new project."}
        />
        <SectionSubtitle
          subtitle_text={
            "Disclaimer: The Budget calculator assumes each task in the project will only need to be validated once. Validators earn the validation rate for the task regardless of the outcome of the validation, so the final total budget may be higher if some tasks are invalidated, corrected, and later approved."
          }
        />
        <div
          style={{
            width: "100%",
            backgroundColor: "black",
            height: ".05vh",
            marginTop: ".5vh",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginLeft: "1vw",
              width: "100%",
            }}
          >
            <SectionTitle title_text={"URL:"} bold={true} />
            <input
              type="text"
              value={props.url}
              onChange={(e) => props.handleSetUrl(e)}
              style={{ height: "5vh", marginRight: "3vw", width: "95%" }}
            />
          </div>
          <div
            style={{
              width: "100%",
              backgroundColor: "black",
              height: ".05vh",
              marginTop: ".5vh",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: "0vw",
            }}
          >
            <SectionTitle title_text={"Mapping Rate:"} bold={true} />
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={props.mapping_rate}
              onChange={(e) => props.handleSetMappingRate(e)}
              style={{ height: "5vh", marginRight: "0vw", width: "5vw" }}
            />
            <SectionTitle title_text={"Validation Rate:"} bold={true} />
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={props.validation_rate}
              onChange={(e) => props.handleSetValidationRate(e)}
              style={{ height: "5vh", marginRight: "0vw", width: "5vw" }}
            />
          </div>

          <div
            style={{
              width: "100%",
              backgroundColor: "black",
              height: ".05vh",
              marginTop: ".5vh",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: "1vw",
            }}
          >
            <SectionTitle title_text={"Max Editors:"} bold={true} />
            <input
              type="number"
              min="1"
              step="1"
              value={props.maxEditors}
              onChange={(e) => props.handleSetMaxEditors(e)}
              style={{ height: "5vh", marginRight: "0vw", width: "5vw" }}
            />
            <SectionTitle title_text={"Max Validators:"} bold={true} />
            <input
              type="number"
              min="1"
              step="1"
              value={props.maxValidators}
              onChange={(e) => props.handleSetMaxValidators(e)}
              style={{ height: "5vh", marginRight: "0vw", width: "5vw" }}
            />
          </div>
          <div
            style={{
              width: "100%",
              backgroundColor: "black",
              height: ".05vh",
              marginTop: ".5vh",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginLeft: "1vw",
            }}
          >
            <SectionTitle title_text={"Project Visibility:"} bold={true} />
            <span style={{ width: "3vw" }} />
            <SectionSubtitle subtitle_text={"Public:"} bold={true} />
            <input
              type="radio"
              value="public"
              name="public"
              onChange={() => props.handleToggleVisibility()}
              checked={props.visibility === true}
            />
            <span style={{ width: "5vw" }} />
            <SectionSubtitle subtitle_text={"Private:"} bold={true} />
            <input
              type="radio"
              value="private"
              name="private"
              onChange={() => props.handleToggleVisibility()}
              checked={props.visibility === false}
              style={{ marginRight: "6.5vw" }}
            />
          </div>
          <div
            style={{
              width: "100%",
              backgroundColor: "black",
              height: ".05vh",
              marginTop: ".5vh",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginBottom: "2vh",
              marginLeft: "0vw",
            }}
          >
            <SectionTitle title_text={"Budget Calculator:"} bold={true} />
            <input
              type="text"
              value={props.outputRate}
              onChange={(e) => props.handleOutputRate(e)}
              style={{ height: "5vh", width: "55vw", marginRight: "1.25vw" }}
            />
          </div>

          <div
            style={{
              width: "100%",
              backgroundColor: "black",
              height: ".05vh",
              marginTop: ".5vh",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginBottom: "1vh",
              marginTop: "1vh",
              marginLeft: "1vw",
              justifyContent: "center",
            }}
          >
            <StyledButton
              button_text="Create Project"
              button_action={props.handleCreateProject}
            />

            <StyledButton
              button_text="Calculate"
              button_action={props.handleCalculateRate}
            />
          </div>
        </div>
      </ModalWrapper>
    </Modal>
  );
};

// DELETE PROJECT MODAL //
export const DeleteProjectModal = (props) => {
  return (
    <Modal open={props.deleteOpen} key="delete">
      <ModalWrapper>
        <CloseButton close_action={props.handleDeleteOpen} />
        <SectionTitle
          title_text={"Are you sure you want to delete the following project?"}
        />
        <SectionSubtitle subtitle_text={`PROJECT # ${props.projectSelected}`} />
        <DeleteProjectButtons
          handleDeleteOpen={props.handleDeleteOpen}
          do_delete_project={props.handleDeleteProject}
        />
      </ModalWrapper>
    </Modal>
  );
};

// DELETE PROJECT BUTTONS //
export const DeleteProjectButtons = (props) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        textAlign: "center",
        justifyContent: "center",
      }}
    >
      <CancelButton
        cancel_action={props.handleDeleteOpen}
        cancel_text={"Cancel"}
      />
      <ConfirmButton
        confirm_action={props.do_delete_project}
        confirm_text={"Delete"}
      />
    </div>
  );
};

// MODIFY PROJECT MODAL //
export const ModifyProjectModal = (props) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  useEffect(() => {
    if (props.projectSelected !== null) {
      props.fetchProjectUsers(props.projectSelected);
    }
    // eslint-disable-next-line
  }, [props.projectSelected]);
  return (
    <>
      {props.projectSelectedDetails && props.projectSelectedDetails != null ? (
        <Modal open={props.modifyOpen} key="modify">
          <ModalWrapper>
            <CloseButton close_action={props.handleModifyOpen} />
            <SectionTitle
              bold={true}
              title_text={`Edit Project ${props.projectSelectedDetails.name}`}
            />
            <Tabs>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <TabList>
                  <Tab>Budget</Tab>
                  <Tab>Users</Tab>
                  <Tab>Settings</Tab>
                </TabList>
                {/* BUDGET TAB */}
                <TabPanel>
                  <div
                    style={{
                      width: "90%",
                      backgroundColor: "black",
                      height: ".05vh",
                      margin: "auto",
                      marginBottom: "1vh",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: "1vw",
                    }}
                  >
                    <SectionTitle title_text={"Budget:"} bold={true} ma />
                    <SectionSubtitle
                      subtitle_text={"Mapping Rate"}
                      bold={true}
                    />
                    <input
                      type="number"
                      min="0.01"
                      step=".01"
                      value={props.mapping_rate}
                      onChange={(e) => props.handleSetMappingRate(e)}
                      style={{
                        height: "5vh",
                        marginRight: "1vw",
                        width: "5vw",
                      }}
                    />
                    <SectionSubtitle
                      subtitle_text={"Validation Rate"}
                      bold={true}
                    />
                    <input
                      type="number"
                      min="0.01"
                      step=".01"
                      value={props.validation_rate}
                      onChange={(e) => props.handleSetValidationRate(e)}
                      style={{
                        height: "5vh",
                        marginRight: "1vw",
                        width: "5vw",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      width: "90%",
                      backgroundColor: "black",
                      height: ".05vh",
                      margin: "auto",
                      marginTop: "1vh",
                      marginBottom: "1vh",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: "0vh",
                      marginLeft: "0vw",
                    }}
                  >
                    <SectionTitle
                      title_text={"Budget Calculator:"}
                      bold={true}
                    />
                    <input
                      type="text"
                      defaultValue={""}
                      value={props.outputRate}
                      onChange={(e) => props.handleOutputRate(e)}
                      style={{
                        height: "5vh",
                        width: "40vw",
                        marginRight: "2vw",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      width: "90%",
                      backgroundColor: "black",
                      height: ".05vh",
                      margin: "auto",
                      marginBottom: "2vh",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      float: "bottom",
                      left: "34vw",
                    }}
                  >
                    <StyledButton
                      button_text="Calculate"
                      button_action={props.handleCalculateRate}
                    />
                  </div>

                  <ModifyProjectButtons
                    handleModifyOpen={props.handleModifyOpen}
                    confirm_action={props.handleModifyProject}
                    confirm_text={"Update"}
                  />
                </TabPanel>
                {/* USERS TAB */}
                <TabPanel>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      marginLeft: "1vw",
                      marginBottom: "2vh",
                      width: "100%",
                    }}
                  >
                    <TableCard
                      TableCard
                      style={{
                        boxShadow: "1px 1px 6px 2px gray",
                        width: "45vw",
                      }}
                    >
                      <Table>
                        <ListHead headLabel={ASSIGN_USERS_TABLE_HEADERS} />
                        <TableBody>
                          {props.projectUsers &&
                            props.projectUsers
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
                                  assigned,
                                } = row;
                                return (
                                  <ProjectRow
                                    sx={{
                                      "&:hover": {
                                        backgroundColor:
                                          "rgba(145, 165, 172, 0.5)",
                                        cursor: "pointer",
                                      },
                                    }}
                                    align="center"
                                    key={id}
                                    tabIndex={-1}
                                    onClick={() =>
                                      props.handleSetUserSelected(id, assigned)
                                    }
                                    selected={props.userSelected === id}
                                  >
                                    <ProjectCell
                                      key={name}
                                      entry={<strong>{name}</strong>}
                                    />
                                    <ProjectCell key={role} entry={role} />
                                    <ProjectCell
                                      key={assigned}
                                      entry={assigned}
                                    />
                                    <ProjectCell
                                      key={assigned_projects}
                                      entry={assigned_projects}
                                    />
                                  </ProjectRow>
                                );
                              })}
                        </TableBody>
                      </Table>
                    </TableCard>
                  </div>
                  <ModifyProjectButtons
                    handleModifyOpen={props.handleModifyOpen}
                    confirm_action={props.handleAssignUser}
                    confirm_text={props.assignmentButtonText}
                  />
                </TabPanel>
                {/* SETTINGS TAB */}
                <div
                  style={{
                    width: "100%",
                    backgroundColor: "black",
                    height: ".05vh",
                  }}
                />
                <TabPanel>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      marginLeft: "1vw",
                    }}
                  >
                    <SectionTitle
                      title_text={"Project Visibility:"}
                      bold={true}
                    />
                    <span style={{ width: "3vw" }} />
                    <SectionSubtitle subtitle_text={"Public:"} bold={true} />
                    <input
                      type="radio"
                      value="public"
                      name="public"
                      defaultChecked={
                        props.projectSelectedDetails.visibility === true
                      }
                      onChange={() => props.handleToggleVisibility()}
                      checked={props.visibility === true}
                    />
                    <span style={{ width: "5vw" }} />
                    <SectionSubtitle subtitle_text={"Private:"} bold={true} />
                    <input
                      type="radio"
                      value="private"
                      name="private"
                      onChange={() => props.handleToggleVisibility()}
                      checked={props.visibility === false}
                      style={{ marginRight: "6.5vw" }}
                    />
                  </div>

                  <div
                    style={{
                      width: "100%",
                      backgroundColor: "black",
                      height: ".05vh",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      marginLeft: "1vw",
                    }}
                  >
                    <SectionTitle title_text={"Project Status:"} bold={true} />
                    <span style={{ width: "3vw" }} />
                    <SectionSubtitle subtitle_text={"Active:"} bold={true} />
                    <input
                      type="radio"
                      value="Active"
                      name="active"
                      defaultChecked={
                        props.projectSelectedDetails.visibility === true
                      }
                      onChange={() => props.handleSetProjectStatus()}
                      checked={props.projectStatus === true}
                    />
                    <span style={{ width: "5vw" }} />
                    <SectionSubtitle subtitle_text={"Inactive:"} bold={true} />
                    <input
                      type="radio"
                      value="inactive"
                      name="inactive"
                      onChange={() => props.handleSetProjectStatus()}
                      checked={props.projectStatus === false}
                      style={{ marginRight: "6.5vw" }}
                    />
                  </div>
                  <div
                    style={{
                      width: "100%",
                      backgroundColor: "black",
                      height: ".05vh",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      marginLeft: "1vw",
                    }}
                  >
                    <SectionTitle title_text={"Difficulty:"} bold={true} />
                    <select
                      value={props.projectDifficulty}
                      style={{ marginRight: "0vw" }}
                      onChange={props.handleSetProjectDifficulty}
                    >
                      <option
                        value="Easy"
                        onChange={(e) => props.setProjectDifficulty(e)}
                      >
                        Easy
                      </option>
                      <option
                        value="Intermediate"
                        onChange={(e) => props.setProjectDifficulty(e)}
                      >
                        Intermediate
                      </option>
                      <option
                        value="Hard"
                        onChange={(e) => props.setProjectDifficulty(e)}
                      >
                        Hard
                      </option>
                    </select>
                    <SectionTitle title_text={"Max Editors:"} bold={true} />
                    <input
                      type={"number"}
                      min="1"
                      step="1"
                      value={props.maxEditors}
                      onChange={props.handleSetMaxEditors}
                      style={{ width: "4vw" }}
                    />
                    <SectionTitle title_text={"Max Validators:"} bold={true} />
                    <input
                      type={"number"}
                      min="1"
                      step="1"
                      value={props.maxValidators}
                      onChange={props.handleSetMaxValidators}
                      style={{ width: "4vw" }}
                    />
                  </div>
                  <div
                    style={{
                      width: "100%",
                      backgroundColor: "black",
                      height: ".05vh",
                      marginBottom: "1vh",
                    }}
                  />
                  <ModifyProjectButtons
                    handleModifyOpen={props.handleModifyOpen}
                    confirm_action={props.handleModifyProject}
                    confirm_text={"Update"}
                  />
                </TabPanel>
              </div>
            </Tabs>
          </ModalWrapper>
        </Modal>
      ) : (
        <></>
      )}
    </>
  );
};

export const ModifyProjectButtons = (props) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        textAlign: "center",
        justifyContent: "center",
      }}
    >
      <CancelButton
        cancel_action={props.handleModifyOpen}
        cancel_text={"Cancel"}
      />
      <ConfirmButton
        confirm_action={props.confirm_action}
        confirm_text={props.confirm_text}
      />
    </div>
  );
};
