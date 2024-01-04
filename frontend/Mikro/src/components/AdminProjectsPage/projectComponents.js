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
  InputWithLabel,
  ModalHeader,
  DifficultySelector,
} from "../commonComponents/commonComponents";
// import { ModalHeader } from "react-bootstrap";

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
        <ModalHeader
          title={"Add New Project"}
          close_action={props.handleAddOpen}
        />
        {/* <CloseButton close_action={props.handleAddOpen} />
        <SectionTitle title_text={"Add New Project"} bold={true} /> */}
        <SectionSubtitle
          subtitle_text={"Enter the details about your new project."}
        />
        <p>
          <strong>Disclaimer</strong>: The Budget calculator assumes each task
          in the project will only need to be validated once. Validators earn
          the validation rate for the task regardless of the outcome of the
          validation, so the final total budget may be higher if some tasks are
          invalidated, corrected, and later approved.
        </p>
        <InputWithLabel
          label="URL:"
          type="text"
          value={props.url}
          onChange={(e) => props.handleSetUrl(e)}
          style={{ height: "5vh", marginRight: "3vw", width: "95%" }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "1vw",
          }}
        >
          <InputWithLabel
            label="Mapping Rate:"
            type="number"
            min="0.01"
            step="0.01"
            value={props.mapping_rate}
            onChange={(e) => props.handleSetMappingRate(e)}
          />
          <InputWithLabel
            label="Validation Rate:"
            type="number"
            min="0.01"
            step="0.01"
            value={props.validation_rate}
            onChange={(e) => props.handleSetValidationRate(e)}
          />
          <InputWithLabel
            label="Max Editors:"
            type="number"
            min="1"
            step="1"
            value={props.maxEditors}
            onChange={(e) => props.handleSetMaxEditors(e)}
          />
          <InputWithLabel
            label="Max Validators:"
            type="number"
            min="1"
            step="1"
            value={props.maxValidators}
            onChange={(e) => props.handleSetMaxValidators(e)}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <SectionTitle title_text={"Project Visibility:"} />
          <SectionSubtitle subtitle_text={"Public:"} />
          <input
            type="radio"
            value="public"
            name="public"
            onChange={() => props.handleToggleVisibility()}
            checked={props.visibility === true}
          />
          <span style={{ width: "3vw" }} />
          <SectionSubtitle subtitle_text={"Private:"} />
          <input
            type="radio"
            value="private"
            name="private"
            onChange={() => props.handleToggleVisibility()}
            checked={props.visibility === false}
            style={{ marginRight: "6.5vw" }}
          />
        </div>
        <InputWithLabel
          label="Budget Calculator:"
          type="text"
          value={props.outputRate}
          onChange={(e) => props.handleOutputRate(e)}
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
      </ModalWrapper>
    </Modal>
  );
};

// DELETE PROJECT MODAL //
export const DeleteProjectModal = (props) => {
  const projectName = props.projectSelectedDetails?.name || "Unknown";
  return (
    <Modal open={props.deleteOpen} key="delete">
      <ModalWrapper>
        <ModalHeader
          close_action={props.handleDeleteOpen}
          title={"Are you sure you want to delete the following project?"}
        />
        <SectionSubtitle subtitle_text={`${projectName}`} />
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
            <ModalHeader
              title={`Edit Project ${props.projectSelectedDetails.name}`}
              close_action={props.handleModifyOpen}
            />
            <Tabs>
              <TabList>
                <Tab>Budget</Tab>
                <Tab>Users</Tab>
              </TabList>
              <TabPanel style={{ width: "100%" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    columnGap: "1vw",
                  }}
                >
                  <InputWithLabel
                    label="Mapping Rate"
                    type="number"
                    min="0.01"
                    step=".01"
                    value={props.mapping_rate}
                    onChange={(e) => props.handleSetMappingRate(e)}
                  />
                  <InputWithLabel
                    label="Validation Rate"
                    type="number"
                    min="0.01"
                    step=".01"
                    value={props.validation_rate}
                    onChange={(e) => props.handleSetValidationRate(e)}
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "6fr 1fr",
                    columnGap: "1vw",
                  }}
                >
                  <InputWithLabel
                    label="Budget Calculator:"
                    type="text"
                    defaultValue={props.outputRate}
                    value={props.outputRate}
                    onChange={(e) => props.handleOutputRate(e)}
                  />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <StyledButton
                      style={{ marginRight: "0px !important" }}
                      button_text="Calculate"
                      button_action={props.handleCalculateRate}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <SectionTitle title_text={"Project Visibility:"} />
                  <span style={{ width: "3vw" }} />
                  <SectionSubtitle subtitle_text={"Public:"} />
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
                  <SectionSubtitle subtitle_text={"Private:"} />
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
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <SectionTitle title_text={"Project Status:"} />
                  <span style={{ width: "3vw" }} />
                  <SectionSubtitle subtitle_text={"Active:"} />
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
                  <SectionSubtitle subtitle_text={"Inactive:"} />
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
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    columnGap: "1vw",
                  }}
                >
                  <DifficultySelector
                    value={props.projectDifficulty}
                    handleSetDifficulty={(e) =>
                      props.handleSetProjectDifficulty(e)
                    }
                  />
                  <InputWithLabel
                    label="Max Editors:"
                    type={"number"}
                    min="1"
                    step="1"
                    value={props.maxEditors}
                    onChange={props.handleSetMaxEditors}
                  />
                  <InputWithLabel
                    label="Max Validators:"
                    type={"number"}
                    min="1"
                    step="1"
                    value={props.maxValidators}
                    onChange={props.handleSetMaxValidators}
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
                <TableCard
                  style={{
                    boxShadow: "1px 1px 6px 2px gray",
                    marginBottom: "2vh",
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
                                    backgroundColor: "rgba(145, 165, 172, 0.5)",
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
                                <ProjectCell key={assigned} entry={assigned} />
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

                <ModifyProjectButtons
                  handleModifyOpen={props.handleModifyOpen}
                  confirm_action={props.handleAssignUser}
                  confirm_text={props.assignmentButtonText}
                />
              </TabPanel>
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
