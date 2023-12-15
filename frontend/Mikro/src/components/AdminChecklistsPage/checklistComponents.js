import React, { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import { Modal, Card, Grid, Table, TableBody, Typography } from "@mui/material";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import {
  ASSIGN_USERS_TABLE_HEADERS,
  CancelButton,
  CloseButton,
  ConfirmButton,
  SectionTitle,
  SectionSubtitle,
  ModalWrapper,
  StyledButton,
  Divider,
  TableCard,
  ProjectRow,
  ProjectCell,
  ListHead,
  AdminCardMediaStyle,
  CardMediaStyle,
} from "../commonComponents/commonComponents";
import { TextArea } from "components/commonComponents/styles";
import "./styles.css";

export const ChecklistCardGrid = (props) => {
  return (
    <div
      style={{
        margin: "1.5vw",
      }}
    >
      <Grid container spacing={3}>
        {props.checklists &&
          props.checklists.slice().map((card) => {
            const {
              id,
              name,
              difficulty,
              visibility,
              list_items,
              total_payout,
              completion_rate,
              validation_rate,
              due_date,
              description,
              author,
              max_payment,
              user_name,
              completed,
              confirmed,
              payment_due,
              comments,
              user_id,
            } = card;
            return (
              <>
                {props.type === "Admin" ? (
                  <>
                    <ChecklistCard
                      id={id}
                      name={name}
                      description={description}
                      comments={comments}
                      role={props.role}
                      goToSource={props.goToSource}
                      handleAddComment={props.handleAddComment}
                      handleCommentOpen={props.handleCommentOpen}
                      handleSetCommentSelected={props.handleSetCommentSelected}
                      difficulty={difficulty}
                      visibility={visibility}
                      due_date={due_date}
                      list_items={list_items}
                      completion_rate={completion_rate}
                      validation_rate={validation_rate}
                      total_payout={total_payout}
                      author={author}
                      max_payment={max_payment}
                      commentSelected={props.commentSelected}
                      handleAddItemOpen={props.handleAddItemOpen}
                      checklistSelected={props.checklistSelected}
                      handleSetChecklistSelected={
                        props.handleSetChecklistSelected
                      }
                    />
                  </>
                ) : props.type === "User" ? (
                  <>
                    <ChecklistCard
                      id={id}
                      name={name}
                      user_id={user_id}
                      description={description}
                      comments={comments}
                      role={props.role}
                      goToSource={props.goToSource}
                      handleCommentOpen={props.handleCommentOpen}
                      handleAddComment={props.handleAddComment}
                      difficulty={difficulty}
                      visibility={visibility}
                      due_date={due_date}
                      list_items={list_items}
                      completion_rate={completion_rate}
                      validation_rate={validation_rate}
                      total_payout={total_payout}
                      author={author}
                      max_payment={max_payment}
                      completed={completed}
                      confirmed={confirmed}
                      checklistSelected={props.checklistSelected}
                      handleCompleteListItem={props.handleCompleteListItem}
                      handleSetChecklistSelected={
                        props.handleSetChecklistSelected
                      }
                    />
                  </>
                ) : props.type === "Validator" ? (
                  <>
                    <ValidatorChecklistCard
                      id={id}
                      name={name}
                      user_id={user_id}
                      role={props.role}
                      user_name={user_name}
                      completed={completed}
                      confirmed={confirmed}
                      description={description}
                      comments={comments}
                      commentSelected={props.commentSelected}
                      handleSetCommentSelected={props.handleSetCommentSelected}
                      goToSource={props.goToSource}
                      handleCommentOpen={props.handleCommentOpen}
                      handleDeleteComment={props.handleDeleteComment}
                      handleAddComment={props.handleAddComment}
                      difficulty={difficulty}
                      visibility={visibility}
                      due_date={due_date}
                      list_items={list_items}
                      completion_rate={completion_rate}
                      validation_rate={validation_rate}
                      user_payment_due={completion_rate}
                      validator_payment_due={validation_rate}
                      total_payment_due={completion_rate + validation_rate}
                      payment_due={payment_due}
                      author={author}
                      max_payment={max_payment}
                      handleConfirmItem={props.handleConfirmItem}
                      checklistSelected={props.checklistSelected}
                      handleCompleteListItem={props.handleCompleteListItem}
                      handleSetChecklistSelected={
                        props.handleSetChecklistSelected
                      }
                    />
                  </>
                ) : (
                  <></>
                )}
              </>
            );
          })}
      </Grid>
    </div>
  );
};

export const AddChecklistModal = (props) => {
  return (
    <Modal open={props.addOpen} key="add">
      <ModalWrapper>
        <CloseButton close_action={props.handleAddOpen} />
        <SectionTitle title_text={"Add New Checklist"} bold={true} />
        <SectionSubtitle
          bold={true}
          subtitle_text={
            props.page === 1
              ? "Enter the details about your new checklist."
              : props.page === 2
              ? "Add Items to your Checklist."
              : ""
          }
        />
        <Divider />
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* PAGE 1 */}
          {props.page === 1 ? (
            <>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  marginLeft: "1vw",
                  width: "100%",
                  marginTop: "1vh",
                  marginBottom: "1vh",
                }}
              >
                <SectionTitle title_text={"Name:"} bold={true} />
                <input
                  type="text"
                  value={props.checklistName}
                  onChange={(e) => props.handleSetChecklistName(e)}
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
                  marginTop: "1vh",
                  marginBottom: "1vh",
                  width: "100%",
                }}
              >
                <SectionTitle title_text={"Description:"} bold={true} />
                <input
                  type="text"
                  value={props.checklistDescription}
                  onChange={(e) => props.handleSetChecklistDescription(e)}
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
                  marginTop: "1vh",
                  marginBottom: "1vh",
                  width: "100%",
                }}
              >
                <SectionTitle title_text={"Due Date:"} bold={true} />
                <input
                  type="date"
                  value={props.dueDate}
                  onChange={(e) => props.handleSetDueDate(e)}
                  style={{ height: "5vh", marginRight: "3vw", width: "70%" }}
                />
              </div>
              <Divider />
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: "1vh",
                  marginBottom: "1vh",
                  marginLeft: "0vw",
                }}
              >
                <SectionTitle title_text={"Completion Rate:"} bold={true} />
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={props.completion_rate}
                  onChange={(e) => props.handleSetCompletionRate(e)}
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
              <Divider />
              <div
                style={{
                  marginTop: "1vh",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  marginLeft: "1vw",
                }}
              >
                <SectionTitle title_text={"Visibility:"} bold={true} />
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
                  style={{ marginRight: "2vw" }}
                />
                <SectionTitle title_text={"Difficulty:"} bold={true} />
                <select
                  value={props.checklistDifficulty}
                  style={{ marginRight: "0vw" }}
                  onChange={props.handleSetProjectDifficulty}
                >
                  <option
                    value="Easy"
                    onChange={(e) => props.handleSetChecklistDifficulty(e)}
                  >
                    Easy
                  </option>
                  <option
                    value="Intermediate"
                    onChange={(e) => props.handleSetChecklistDifficulty(e)}
                  >
                    Intermediate
                  </option>
                  <option
                    value="Hard"
                    onChange={(e) => props.handleSetChecklistDifficulty(e)}
                  >
                    Hard
                  </option>
                </select>
              </div>

              <Divider />
            </>
          ) : (
            <></>
          )}
          {/* PAGE 2 */}
          {props.page === 2 ? (
            <>
              <div
                style={{
                  height: "30vh",
                  overflowY: "scroll",
                }}
              >
                {props.listItems &&
                  props.listItems.slice().map((list_item) => {
                    const { action, link, number } = list_item;
                    return (
                      <>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            marginLeft: "1vw",
                            width: "100%",
                            marginTop: "1vh",
                            marginBottom: "1vh",
                          }}
                        >
                          <SectionSubtitle
                            subtitle_text={`Item ${number}:`}
                            bold={true}
                          />
                          <SectionSubtitle subtitle_text={action} />
                          <SectionSubtitle subtitle_text={link} />
                        </div>
                      </>
                    );
                  })}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  marginLeft: "1vw",
                  width: "100%",
                  marginTop: "1vh",
                  marginBottom: "1vh",
                }}
              >
                <SectionTitle title_text={"Action:"} bold={true} />
                <input
                  type="text"
                  value={props.tempAction}
                  onChange={(e) => props.handleSetTempAction(e)}
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
                  width: "100%",
                  marginTop: "1vh",
                  marginBottom: "1vh",
                }}
              >
                <SectionTitle title_text={"Link:"} bold={true} />
                <input
                  type="text"
                  value={props.tempLink}
                  onChange={(e) => props.handleSetTempLink(e)}
                  style={{
                    height: "5vh",
                    marginRight: "3vw",
                    width: "95%",
                  }}
                />
              </div>
              <Divider />
            </>
          ) : (
            <></>
          )}
          {/* BUTTON COMPONENT */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginBottom: "1vh",
              marginTop: "2vh",
              marginLeft: "1vw",
              justifyContent: "center",
            }}
          >
            {props.page !== 1 ? (
              <StyledButton
                button_text="Back"
                button_action={() => props.handleSetPage("back")}
              />
            ) : (
              <></>
            )}
            <StyledButton
              button_text={props.page === 1 ? "Next" : "Add"}
              button_action={
                props.page === 1 ? (
                  () => props.handleSetPage("next")
                ) : props.page === 2 ? (
                  () => props.handleSetTempListItem()
                ) : (
                  <></>
                )
              }
            />
            {props.page === 2 ? (
              <>
                <StyledButton
                  button_text={"Create"}
                  button_action={() => props.handleCreateChecklist(false)}
                />
              </>
            ) : (
              <></>
            )}
          </div>
        </div>
      </ModalWrapper>
    </Modal>
  );
};

// CONFIRMATION MODAL //
export const CommentModal = (props) => {
  return (
    <Modal open={props.commentOpen} key="confirm">
      <ModalWrapper>
        <CloseButton close_action={props.handleCommentOpen} />
        <SectionTitle title_text={"New Comment:"} bold={true} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "2vh",
            marginTop: "1vh",
          }}
        >
          <TextArea
            type="text"
            value={props.checklistName}
            onChange={(e) => props.handleSetComment(e)}
            style={{
              height: "15vh",
              width: "95%",
              overflowY: "scroll",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            marginBottom: "2vh",
            marginTop: "1vh",
          }}
        >
          <StyledButton
            button_text={"Add"}
            button_action={() => props.handleAddComment()}
          />
        </div>
      </ModalWrapper>
    </Modal>
  );
};

// CONFIRMATION MODAL //
export const ConfirmationModal = (props) => {
  return (
    <Modal open={props.confirmOpen} key="confirm">
      <ModalWrapper>
        <CloseButton close_action={props.handleConfirmOpen} />
        <SectionTitle title_text={props.question} />
        <SectionSubtitle subtitle_text={props.extraText} />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            marginBottom: "2vh",
          }}
        >
          <StyledButton
            button_text={"OK"}
            button_action={() => props.handleConfirmOpen()}
          />
        </div>
      </ModalWrapper>
    </Modal>
  );
};

// DELETE CHecklist MODAL //
export const DeleteChecklistModal = (props) => {
  return (
    <Modal open={props.deleteOpen} key="delete">
      <ModalWrapper>
        <CloseButton close_action={props.handleDeleteOpen} />
        <SectionTitle
          title_text={
            "Are you sure you want to delete the following checklist?"
          }
        />
        <SectionSubtitle
          subtitle_text={`checklist # ${props.checklistSelected}`}
        />
        <div style={{ marginBottom: "2vh" }}>
          <DeleteChecklistButtons
            cancel_action={props.handleDeleteOpen}
            confirm_action={props.handleDeleteChecklist}
          />
        </div>
      </ModalWrapper>
    </Modal>
  );
};

// DELETE Checklist BUTTONS //
export const DeleteChecklistButtons = (props) => {
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
        cancel_action={props.cancel_action}
        cancel_text={"Cancel"}
      />
      <ConfirmButton
        confirm_action={props.confirm_action}
        confirm_text={"Delete"}
      />
    </div>
  );
};

// DELETE PROJECT MODAL //
export const ModifyChecklistModal = (props) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    if (props.checklistSelected !== null) {
      props.fetchChecklistUsers(props.checklistSelected);
    }
    // eslint-disable-next-line
  }, [props.checklistSelected]);

  return (
    <>
      {props.checklistSelectedDetails &&
      props.checklistSelectedDetails != null ? (
        <Modal open={props.modifyOpen} key="modify">
          <ModalWrapper>
            <CloseButton close_action={props.handleModifyOpen} />
            <SectionTitle
              bold={true}
              title_text={`Edit ${props.checklistSelectedDetails.name}`}
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
                  <Tab>Details</Tab>
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
                      marginLeft: "1vw",
                      width: "100%",
                      marginTop: "1vh",
                      marginBottom: "1vh",
                    }}
                  >
                    <SectionTitle title_text={"Name:"} bold={true} />
                    <input
                      type="text"
                      value={props.checklistName}
                      onChange={(e) => props.handleSetChecklistName(e)}
                      style={{
                        height: "5vh",
                        marginRight: "3vw",
                        width: "95%",
                      }}
                    />
                  </div>
                  <Divider />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      marginLeft: "1vw",
                      marginTop: "1vh",
                      marginBottom: "1vh",
                      width: "100%",
                    }}
                  >
                    <SectionTitle title_text={"Description:"} bold={true} />
                    <input
                      type="text"
                      value={props.checklistDescription}
                      onChange={(e) => props.handleSetChecklistDescription(e)}
                      style={{
                        height: "5vh",
                        marginRight: "3vw",
                        width: "95%",
                      }}
                    />
                  </div>
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
                      subtitle_text={"Completion Rate"}
                      bold={true}
                    />
                    <input
                      type="number"
                      min="0.01"
                      step=".01"
                      value={props.completion_rate}
                      onChange={(e) => props.handleSetCompletionRate(e)}
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

                  <ModifyProjectButtons
                    handleModifyOpen={props.handleModifyOpen}
                    confirm_action={props.handleModifyChecklist}
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
                          {props.checklistUsers &&
                            props.checklistUsers
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
                    <SectionTitle title_text={"Visibility:"} bold={true} />
                    <span style={{ width: "3vw" }} />
                    <SectionSubtitle subtitle_text={"Public:"} bold={true} />
                    <input
                      type="radio"
                      value="public"
                      name="public"
                      defaultChecked={
                        props.checklistSelectedDetails.visibility === true
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
                    <SectionTitle title_text={"Status:"} bold={true} />
                    <span style={{ width: "3vw" }} />
                    <SectionSubtitle subtitle_text={"Active:"} bold={true} />
                    <input
                      type="radio"
                      value="Active"
                      name="active"
                      defaultChecked={
                        props.checklistSelectedDetails.visibility === true
                      }
                      onChange={() => props.handleSetChecklistStatus()}
                      checked={props.checklistStatus === true}
                    />
                    <span style={{ width: "5vw" }} />
                    <SectionSubtitle subtitle_text={"Inactive:"} bold={true} />
                    <input
                      type="radio"
                      value="inactive"
                      name="inactive"
                      onChange={() => props.handleSetChecklistStatus()}
                      checked={props.checklistStatus === false}
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
                      value={props.checklistDifficulty}
                      style={{ marginRight: "0vw" }}
                      onChange={props.handleSetChecklistDifficulty}
                    >
                      <option
                        value="Easy"
                        onChange={(e) => props.handleSetChecklistDifficulty(e)}
                      >
                        Easy
                      </option>
                      <option
                        value="Intermediate"
                        onChange={(e) => props.handleSetChecklistDifficulty(e)}
                      >
                        Intermediate
                      </option>
                      <option
                        value="Hard"
                        onChange={(e) => props.handleSetChecklistDifficulty(e)}
                      >
                        Hard
                      </option>
                    </select>

                    <SectionTitle title_text={"Due Date:"} bold={true} />

                    <input
                      type="date"
                      value={props.dueDate}
                      onChange={(e) => props.handleSetDueDate(e)}
                      style={{ height: "3vh" }}
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
                    confirm_action={props.handleModifyChecklist}
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

export const ChecklistCard = (props) => {
  return (
    <Card
      key={props.id}
      style={{
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 0 4px gray",
        width: "25vw",
        wordWrap: "break-word",
      }}
    >
      {props.role && props.role == "admin" ? (
        <AdminCardMediaStyle>
          <input
            type={"checkbox"}
            id={props.id}
            value={props.id}
            checked={props.id === props.checklistSelected}
            onChange={(e) => {
              if (props.id === props.checklistSelected) {
                props.handleSetChecklistSelected(null, props.name); // Uncheck the checkbox
              } else {
                props.handleSetChecklistSelected(props.id, props.name); // Check the checkbox
              }
            }}
            style={{
              marginLeft: "1vw",
              marginBottom: "1vh",
              whiteSpace: "normal",
            }}
          />
        </AdminCardMediaStyle>
      ) : (
        <CardMediaStyle />
      )}
      <div
        style={{
          margin: ".5vw",
        }}
      >
        <h3>{props.name && `${props.name}`} </h3>
        <p>{props.description}</p>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-around",
            marginRight: "10vw",
          }}
        >
          <p>Complete</p>
          <p>Confirmed</p>
        </div>
        <div
          style={{
            flex: "1",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            maxHeight: "30vh",
          }}
        >
          {props.list_items &&
            props.list_items.slice().map((item) => {
              const { number, action, link, completed, confirmed } = item;
              return (
                <>
                  <div
                    key={number}
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      height: "3vh",
                    }}
                  >
                    <input
                      type={"checkbox"}
                      id={number}
                      // value={props.id}
                      key={number}
                      checked={completed ? completed === true : false}
                      onChange={(e) => {
                        props.completed !== true ? (
                          props.handleCompleteListItem(
                            e,
                            number,
                            props.id,
                            props.user_id,
                            props.name
                          )
                        ) : (
                          <></>
                        );
                      }}
                      style={{ marginLeft: "1vw", marginRight: "6vw" }}
                    />
                    <input
                      type={"checkbox"}
                      id={number}
                      key={number + action}
                      checked={confirmed === true}
                      style={{ marginLeft: "0vw", marginRight: "1vw" }}
                    />
                    <SectionSubtitle key={action} subtitle_text={action} />
                  </div>
                </>
              );
            })}
        </div>
        {/* {props.comments && props.comments.length > 0 && (
          <>
            <p>Comments:</p>
            <div
              style={{
                flex: "1",
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
                maxHeight: `${commentsMaxHeight}vh`,
              }}
            >
              {props.comments &&
                props.comments.slice().map((item) => {
                  const { id, author, comment, role, date } = item;

                  return (
                    <>
                      <div
                        key={id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          marginBottom: "1vh",
                          backgroundColor: "lightgray",
                          borderRadius: "10px",
                          padding: "5px",
                          // height: "3vh",
                        }}
                      >
                        <p
                          key={id}
                        >{`${role} ${author} - ${date}: ${comment}`}</p>
                        <></>
                      </div>
                    </>
                  );
                })}
            </div>
          </>
        )} */}

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: "2vh",
          }}
        >
          {props.role && props.role == "admin" ? (
            <div
              onClick={() =>
                props.handleAddItemOpen(props.id, props.name, props.list_items)
              }
            >
              <StyledButton button_text={`+Add/Edit Task`} bold={true} />
            </div>
          ) : null}

          <h4>
            Rate:{" "}
            {props.completion_rate && `$${props.completion_rate.toFixed(2)}`}
          </h4>
          <h4>Due: {props.due_date}</h4>
        </div>
      </div>
    </Card>
  );
};

export const ValidatorChecklistCard = (props) => {
  return (
    <Card
      key={props.id}
      style={{
        boxShadow: "1px 1px 6px 2px gray",
        width: "25vw",
        height: "75vh",
        marginLeft: "2vw",
        marginTop: "2vh",
      }}
    >
      <CardMediaStyle>
        <>
          <div style={{ marginLeft: "1vw", marginBottom: "2vh" }} />
        </>
      </CardMediaStyle>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          height: "5vh",
        }}
      >
        <SectionTitle
          title_text={props.user_name && `${props.user_name}`}
          bold={true}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          // justifyContent:'center'
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",

            height: "15vh",
            width: "90%",
            borderStyle: "solid",
            borderWidth: "8px",
            borderColor: "lightgrey",
          }}
        >
          <SectionSubtitle subtitle_text={`Description`} bold={true} />
          <SectionSubtitle
            subtitle_text={props.description}
            margin_bottom={"0vh"}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "left",
            verticalAlign: "textTop",
            marginTop: "0vh",
            height: "4vh",
          }}
        >
          <SectionSubtitle subtitle_text={`Complete`} bold={true} />
          <SectionSubtitle subtitle_text={`Confirmed`} bold={true} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "15vh",
            overflowY: "scroll",
            overflowX: "scroll",
          }}
        >
          {props.list_items &&
            props.list_items.slice().map((item) => {
              const { number, action, link, completed, confirmed } = item;
              return (
                <>
                  <div
                    key={number}
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "left",
                      alignItems: "center",
                      verticalAlign: "textTop",
                      marginTop: "0vh",
                      marginLeft: "3vh",
                      height: "3vh",
                    }}
                  >
                    <input
                      type={"checkbox"}
                      id={number}
                      // value={props.id}
                      key={number}
                      checked={completed ? completed === true : false}
                      style={{ marginLeft: "1vw", marginRight: "6vw" }}
                    />
                    <input
                      type={"checkbox"}
                      id={number}
                      key={number + action}
                      onChange={(e) =>
                        props.handleConfirmItem(
                          e,
                          number,
                          props.id,
                          props.user_id,
                          props.name
                        )
                      }
                      checked={confirmed === true}
                      style={{ marginLeft: "0vw", marginRight: "1vw" }}
                    />
                    <SectionSubtitle
                      key={action}
                      subtitle_text={action}
                      bold={true}
                    />
                  </div>
                </>
              );
            })}
        </div>
      </div>
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
          <SectionSubtitle subtitle_text={`Comments:`} />
          <div
            style={{
              height: "13vh",
              marginRight: "0vw",
              width: "24vw",
              margin: "auto",
              marginTop: "0vh",
              marginBottom: "1vh",
              borderStyle: "solid",
              borderWidth: "2px",
              borderColor: "black",
              overflowY: "scroll",
            }}
          >
            {props.comments &&
              props.comments.slice().map((item) => {
                const { id, author, comment, role, date } = item;
                return (
                  <>
                    <div
                      key={id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "left",
                        alignItems: "center",
                        marginBottom: "2vh",
                        paddingBottom: "1vh",
                        height: "7vh",
                        // backgroundColor:"lightblue"
                        backgroundColor:
                          props.commentSelected === id ? "lightblue" : "white",
                      }}
                      onClick={() => props.handleSetCommentSelected(id)}
                    >
                      <SectionSubtitle
                        key={id}
                        subtitle_text={`${role} ${author} - ${date}: ${comment}`}
                      />
                      <Divider />
                      <></>
                    </div>
                  </>
                );
              })}
          </div>
          <div
            style={{
              height: "3vh",
              marginRight: "0vw",
              margin: "auto",
              marginTop: "0vh",
              marginBottom: "0vh",
              display: "flex",
              flexDirection: "row",
            }}
          >
            <StyledButton
              button_text={"Add"}
              button_action={() =>
                props.handleCommentOpen(props.id, props.name)
              }
            />
            {props.role === "admin" ? (
              <>
                <StyledButton
                  button_text={"Delete"}
                  button_action={() => props.handleDeleteComment()}
                />
              </>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          // justifyContent: "center",
          // alignContent:'center'
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            marginTop: "1vh",
            marginBottom: "1vh",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              margin: "auto",
            }}
          >
            <SectionSubtitle subtitle_text={"Due:"} bold={true} />
            <SectionSubtitle
              subtitle_text={
                props.role === "user"
                  ? `$${props.user_payment_due.toFixed(2)}`
                  : props.role === "validator"
                  ? `$${props.validator_payment_due.toFixed(2)}`
                  : `$${props.total_payment_due.toFixed(2)}`
              }
            />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              margin: "auto",
            }}
          >
            <SectionSubtitle subtitle_text={"Due Date:"} bold={true} />
            <SectionSubtitle subtitle_text={props.due_date} />
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              margin: "auto",
            }}
          >
            <SectionSubtitle subtitle_text={"Status:"} bold={true} />
            <SectionSubtitle
              subtitle_text={
                props.completed === true && props.confirmed === true
                  ? "Confirmed"
                  : props.completed === true && props.confirmed !== true
                  ? "Completed"
                  : "In Progress"
              }
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export const AddItemModal = (props) => {
  return (
    <Modal open={props.addItemOpen} key="add">
      <ModalWrapper>
        <CloseButton close_action={props.handleAddItemOpen} />
        <SectionTitle
          title_text={`Add New Item to ${props.name}`}
          bold={true}
        />
        <SectionSubtitle
          bold={true}
          subtitle_text={"Add Items to your Checklist."}
        />

        <Divider />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* PAGE 2 */}

          <>
            <div
              style={{
                height: "30vh",
                overflowY: "scroll",
              }}
            >
              {props.listItems &&
                props.listItems.slice().map((list_item) => {
                  const { id, action, link, number } = list_item;
                  return (
                    <>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: "1vw",
                          width: "100%",
                          marginTop: "1vh",
                          marginBottom: "1vh",
                          backgroundColor:
                            props.tempNumber === number ? "lightblue" : null,
                        }}
                        onClick={() =>
                          props.handleEditItem(id, number, action, link)
                        }
                      >
                        <SectionSubtitle
                          subtitle_text={`Item ${number}:`}
                          bold={true}
                        />
                        <SectionSubtitle subtitle_text={action} />
                        <SectionSubtitle subtitle_text={link} />
                      </div>
                    </>
                  );
                })}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                marginLeft: "1vw",
                width: "100%",
                marginTop: "1vh",
                marginBottom: "1vh",
              }}
            >
              <SectionTitle title_text={"Action:"} bold={true} />
              <input
                type="text"
                value={props.tempAction}
                onChange={(e) => props.handleSetTempAction(e)}
                style={{
                  height: "5vh",
                  marginRight: "3vw",
                  width: "95%",
                }}
              />
            </div>
            <Divider />
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                marginLeft: "1vw",
                width: "100%",
                marginTop: "1vh",
                marginBottom: "1vh",
              }}
            >
              <SectionTitle title_text={"Link:"} bold={true} />
              <input
                type="text"
                value={props.tempLink}
                onChange={(e) => props.handleSetTempLink(e)}
                style={{
                  height: "5vh",
                  marginRight: "3vw",
                  width: "95%",
                }}
              />
            </div>
            <Divider />
          </>
          {/* BUTTON COMPONENT */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              marginBottom: "1vh",
              marginTop: "2vh",
              marginLeft: "1vw",
              justifyContent: "center",
            }}
          >
            <StyledButton
              button_text={props.addButtonText}
              button_action={
                props.addButtonText === "Add"
                  ? () => props.handleSetTempListItem()
                  : () => props.handleEditTempListItem()
              }
            />
            <StyledButton
              button_text={"Delete"}
              button_action={() => props.handleDeleteItem(props.itemSelected)}
            />
            <StyledButton
              button_text={"Update"}
              button_action={() => props.handleUpdateListItems()}
            />
          </div>
        </div>
      </ModalWrapper>
    </Modal>
  );
};
