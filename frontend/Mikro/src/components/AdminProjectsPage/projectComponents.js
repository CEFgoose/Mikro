import React, { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import { Modal, Divider,Table, TableBody, Card,Grid } from "@mui/material";
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
        <SectionTitle title_text={"Add New Project"} />
        <SectionSubtitle
          subtitle_text={
            "Enter the project URL from the OSM tasking manager, the max number of editors and rate per task or total project budget."
          }
        />
        <Divider />
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
            <SectionTitle title_text={"URL:"} />
            <input
              type="text"
              value={props.url}
              onChange={(e) => props.handleSetUrl(e)}
              style={{ height: "5vh", marginRight: "3vw", width: "95%" }}
            />
          </div>
          <Divider />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginLeft: "1vw",
            }}
          >
            <SectionTitle title_text={"Budget:"} />
            <SectionTitle title_text={"$"} />
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={props.rate}
              onChange={(e) => props.handleSetRate(e)}
              style={{ height: "5vh", marginRight: "1vw" }}
            />
            <SectionTitle title_text={"Type:"} />
            <SectionSubtitle subtitle_text={"rate per task:"} />
            <input
              type="radio"
              value="rate per task"
              name="rate per task"
              onChange={() => props.handleToggleRateMethod()}
              checked={props.rateMethod === true}
            />
            <span style={{ width: "2vw" }} />
            <SectionSubtitle subtitle_text={"Total Budget:"} />
            <input
              type="radio"
              value="Total Budget"
              name="Total Budget"
              onChange={() => props.handleToggleRateMethod()}
              checked={props.rateMethod === false}
              style={{ marginRight: "2%" }}
            />
          </div>
          <Divider />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginLeft: "1vw",
            }}
          >
            <SectionTitle title_text={"Project Visibility:"} />
            <span style={{ width: "3vw" }} />
            <SectionSubtitle subtitle_text={"Public:"} />
            <input
              type="radio"
              value="public"
              name="public"
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
            <StyledButton
              button_text="Create Project"
              button_action={props.handleCreateProject}
            />
          </div>
          <Divider />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginBottom: "2vh",
              marginLeft: "1vw",
            }}
          >
            <SectionTitle title_text={"Budget Calculator:"} />
            <input
              type="text"
              value={props.outputRate}
              onChange={(e) => props.handleOutputRate(e)}
              style={{ height: "5vh", width: "24vw", marginRight: "1.25vw" }}
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

// DELETE PROJECT MODAL //
export const ModifyProjectModal = (props) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    useEffect(() => {
        if (props.projectSelected !== null){
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
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        marginLeft: "1vw",
                        width: "100%",
                        }}
                    ></div>
                    <Divider />
                    <div
                        style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        marginLeft: "1vw",
                        }}
                    >
                        <SectionTitle title_text={"Budget:"} />
                        <SectionTitle title_text={"$"} />
                        <input
                        type="number"
                        min="0.01"
                        step=".01"
                        value={props.rate}
                        onChange={(e) => props.handleSetRate(e)}
                        style={{ height: "5vh", marginRight: "1vw" }}
                        />
                        <SectionTitle title_text={"Type:"} />
                        <SectionSubtitle subtitle_text={"rate per task:"} />
                        <input
                        type="radio"
                        value="rate per task"
                        name="rate per task"
                        onChange={() => props.handleToggleRateMethod()}
                        checked={props.rateMethod === true}
                        />
                        <span style={{ width: "2vw" }} />
                        <SectionSubtitle subtitle_text={"Total Budget:"} />
                        <input
                        type="radio"
                        value="Total Budget"
                        name="Total Budget"
                        onChange={() => props.handleToggleRateMethod()}
                        checked={props.rateMethod === false}
                        style={{ marginRight: "2%" }}
                        />
                    </div>
                    <Divider />
                    <div
                        style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: "2vh",
                        marginLeft: "1vw",
                        }}
                    >
                        <SectionTitle title_text={"Budget Calculator:"} />
                        <input
                        type="text"
                        defaultValue={""}
                        value={props.outputRate}
                        onChange={(e) => props.handleOutputRate(e)}
                        style={{
                            height: "5vh",
                            width: "24vw",
                            marginRight: "1.25vw",
                        }}
                        />
                        <StyledButton
                        button_text="Calculate"
                        button_action={props.handleCalculateRate}
                        />
                    </div>
                    <ModifyProjectButtons
                        handleModifyOpen={props.handleModifyOpen}
                        confirm_action={props.handleModifyProject}
                        confirm_text={'Update'}
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
                        marginBottom:'2vh',
                        width: "100%",
                        }}
                    >
                    <TableCard   TableCard style={{ boxShadow: "1px 1px 6px 2px gray", width:'45vw' }}>
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
                                assigned
                                } = row;
                                console.log(id, props.userSelected);
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
                                    onClick={() => props.handleSetUserSelected(id,assigned)}
                                    selected={props.userSelected === id}
                                    // onDoubleClick={() => view_all_project_sequences(value)}
                                >
                                    <ProjectCell key={name} entry={name} />
                                    <ProjectCell key={role} entry={role} />
                                    <ProjectCell key={assigned} entry={assigned} />
                                    <ProjectCell key={assigned_projects} entry={assigned_projects} />
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
                    <TabPanel>
                    <div
                        style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        marginLeft: "1vw",
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
                        marginLeft: "1vw",
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
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        marginLeft: "1vw",
                        }}
                    >

                        <SectionTitle title_text={"Difficulty:"} />
                        <select
                        value={props.projectDifficulty}
                        style={{ marginRight: "1vw" }}
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
                        <SectionTitle title_text={"Max Editors:"} />
                        <input
                        type={"number"}
                        min="1"
                        step="1"
                        value={props.maxEditors}
                        onChange={props.handleSetMaxEditors}
                        />
                    </div>
                    <ModifyProjectButtons
                    handleModifyOpen={props.handleModifyOpen}
                    confirm_action={props.handleModifyProject}
                    confirm_text={'Update'}
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


export const ProjectCardGrid = (props) => {
  return (

  <div style={{ overflowY: "scroll", width: "85vw", height: "83vh" }}>
              <Grid
                sx={{
                  height: "auto",
                  position: "relative",
                  top: "3vh",
                  left: "3vw",
                }}
                container
                spacing={3}
              >
                {props.projects &&
                  props.projects.slice().map((card) => {
                    const {
                      id,
                      name,
                      difficulty,
                      visibility,
                      total_payout,
                      rate_per_task,
                      max_editors,
                      total_editors,
                      total_tasks,
                      tasks_mapped,
                      tasks_validated,
                      tasks_invalidated,
                      url,
                      source,
                      max_payment,
                    } = card;
                    return (
                      <AdminProjectCard
                        id={id}
                        url={url}
                        name={name}
                        difficulty={difficulty}
                        visibility={visibility}
                        max_editors={max_editors}
                        total_editors={total_editors}
                        total_tasks={total_tasks}
                        rate_per_task={rate_per_task}
                        tasks_mapped={tasks_mapped}
                        tasks_validated={tasks_validated}
                        tasks_invalidated={tasks_invalidated}
                        total_payout={total_payout}
                        max_payment={max_payment}
                        projectSelected={props.projectSelected}
                        source={source}
                        goToSource={props.goToSource}
                        handleSetProjectSelected={props.handleSetProjectSelected}
                      />
                    );
                  })}
              </Grid>
              </div>
  );
};




export const AdminProjectCard = (props) => {

  return (
    <Card
      key={props.id}
      style={{
        boxShadow: "1px 1px 6px 2px gray",
        width: "25vw",
        height: "56vh",
        marginLeft: "2vw",
        marginTop: "2vh",
      }}
      onDoubleClick={() => props.goToSource(props.url)}
    >
      <AdminCardMediaStyle>
        <input
          type={"checkbox"}
          id={props.id}
          value={props.id}
          checked={props.id === props.projectSelected}
          onChange={(e) => props.handleSetProjectSelected(e)}
          style={{ marginLeft: "1vw", marginBottom: "1vh" }}
        />
      </AdminCardMediaStyle>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          height: "10vh",
        }}
      >
        <SectionTitle title_text={props.name} />
      </div>
      <Divider />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <SectionSubtitle subtitle_text={`Difficulty: ${props.difficulty}`} />
        <SectionSubtitle
          subtitle_text={`Visibility: ${
            props.visibility === true ? `Public` : `Private`
          }`}
        />
      </div>
      <SectionSubtitle
          subtitle_text={`Source: ${
            props.source === 'tasks' ? `TM4` : `TM3`
          }`}
        />
      <Divider />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle subtitle_text={"Mapped %:"} />
          <SectionSubtitle
            subtitle_text={`${(props.total_tasks / 100) * props.tasks_mapped}%`}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle subtitle_text={"Validated %:"} />
          <SectionSubtitle
            subtitle_text={`${
              (props.total_tasks / 100) * props.tasks_validated
            }%`}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle subtitle_text={"Editors:"} />
          <SectionSubtitle
            subtitle_text={`${props.total_editors}/${props.max_editors}`}
          />
        </div>
      </div>
      <Divider />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle subtitle_text={"Tasks Mapped:"} />
          <SectionSubtitle subtitle_text={props.tasks_mapped} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle subtitle_text={"Tasks Validated:"} />
          <SectionSubtitle subtitle_text={props.tasks_validated} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle subtitle_text={"Current Payout:"} />
          <SectionSubtitle subtitle_text={`$${props.total_payout}`} />
        </div>
      </div>
      <Divider />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle subtitle_text={"Total Tasks:"} />
          <SectionSubtitle subtitle_text={props.total_tasks} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle subtitle_text={"Rate/Task:"} />
          <SectionSubtitle subtitle_text={`$${props.rate_per_task}`} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <SectionSubtitle subtitle_text={"Total Budget:"} />
          <SectionSubtitle subtitle_text={`$${props.max_payment}`} />
        </div>
      </div>
    </Card>
  );
};