import React, { useState, useEffect } from "react";
import { Modal, Card, Grid, Table, TableBody } from "@mui/material";
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
  TableCard,
  ProjectRow,
  ProjectCell,
  ListHead,
  AdminCardMediaStyle,
  CardMediaStyle,
  ModalHeader,
  InputWithLabel,
  DifficultySelector,
  ModalButtons,
} from "../commonComponents/commonComponents";
import { TextArea } from "components/commonComponents/styles";
import "./styles.css";
import "../../App.css";

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
            console.log(props.checklists);
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
                    <Grid item xs={4}>
                      <ChecklistCard
                        name={name}
                        id={id}
                        user_id={user_id}
                        role={props.role}
                        user_name={user_name}
                        completed={completed}
                        confirmed={confirmed}
                        description={description}
                        comments={comments}
                        commentSelected={props.commentSelected}
                        handleSetCommentSelected={
                          props.handleSetCommentSelected
                        }
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
                        handleSetChecklistSelected={
                          props.handleSetChecklistSelected
                        }
                        handleAddItemOpen={props.handleAddItemOpen}
                      />
                    </Grid>
                  </>
                ) : props.type === "User" ? (
                  <>
                    <Grid item xs={4}>
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
                    </Grid>
                  </>
                ) : props.type === "Validator" ? (
                  <Grid item xs={4}>
                    <ChecklistCard
                      name={name}
                      id={id}
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
                      handleSetChecklistSelected={
                        props.handleSetChecklistSelected
                      }
                    />
                  </Grid>
                ) : props.type === "New" ? (
                  <>
                    <Grid item xs={4}>
                      <ChecklistCard
                        id={id}
                        name={name}
                        description={description}
                        comments={comments}
                        role={props.role}
                        type={props.type}
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
                        checklistSelected={props.checklistSelected}
                        handleSetChecklistSelected={
                          props.handleSetChecklistSelected
                        }
                      />
                    </Grid>
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
        <ModalHeader
          title={"Add New Checklist"}
          close_action={props.handleAddOpen}
        />
        <SectionSubtitle
          subtitle_text={
            props.page === 1
              ? "Enter the details about your new checklist."
              : props.page === 2
              ? "Add Items to your Checklist."
              : ""
          }
        />

        {/* PAGE 1 */}
        {props.page === 1 ? (
          <>
            <input
              type="text"
              value={props.checklistName}
              onChange={(e) => props.handleSetChecklistName(e)}
              placeholder="Name"
            />

            <input
              type="text"
              value={props.checklistDescription}
              onChange={(e) => props.handleSetChecklistDescription(e)}
              placeholder="Description"
            />
            <InputWithLabel
              label="Due Date:"
              type="date"
              value={props.dueDate}
              onChange={(e) => props.handleSetDueDate(e)}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                columnGap: "1vw",
              }}
            >
              <InputWithLabel
                label="Completion Rate:"
                type="number"
                min="0.01"
                step="0.01"
                value={props.completion_rate}
                onChange={(e) => props.handleSetCompletionRate(e)}
              />
              <InputWithLabel
                label="Validation Rate:"
                type="number"
                min="0.01"
                step="0.01"
                value={props.validation_rate}
                onChange={(e) => props.handleSetValidationRate(e)}
              />

              <DifficultySelector
                value={props.checklistDifficulty}
                handleSetDifficulty={(e) =>
                  props.handleSetChecklistDifficulty(e)
                }
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
              }}
            >
              <SectionTitle title_text={"Visibility:"} />
              <SectionSubtitle subtitle_text={"Public:"} />
              <input
                type="radio"
                value="public"
                name="public"
                onChange={() => props.handleToggleVisibility()}
                checked={props.visibility === true}
              />
              <SectionSubtitle subtitle_text={"Private:"} />
              <input
                type="radio"
                value="private"
                name="private"
                onChange={() => props.handleToggleVisibility()}
                checked={props.visibility === false}
              />
            </div>
          </>
        ) : (
          <></>
        )}
        {/* PAGE 2 */}
        {props.page === 2 ? (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                height: "30vh",
                overflowY: "scroll",
                gap: "1vh",
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
            <InputWithLabel
              label="Action:"
              type="text"
              value={props.tempAction}
              onChange={(e) => props.handleSetTempAction(e)}
            />
            <InputWithLabel
              label="Link:"
              type="text"
              value={props.tempLink}
              onChange={(e) => props.handleSetTempLink(e)}
            />
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
  const projectName = props.projectSelectedDetails?.name || "Unknown";
  return (
    <Modal open={props.deleteOpen} key="delete">
      <ModalWrapper>
        <ModalHeader
          close_action={props.handleDeleteOpen}
          title={"Are you sure you want to delete the following checklist?"}
        />
        <SectionSubtitle subtitle_text={`${props.projectName}`} />
        <div style={{ marginBottom: "2vh" }}>
          <ModalButtons
            cancel_action={props.handleDeleteOpen}
            cancel_text={"Cancel"}
            confirm_action={props.handleDeleteChecklist}
            confirm_text={"Delete"}
          />
        </div>
      </ModalWrapper>
    </Modal>
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
            <ModalHeader
              title={`Edit ${props.checklistSelectedDetails.name}`}
              close_action={props.handleModifyOpen}
            />
            <Tabs>
              <TabList>
                <Tab>Details</Tab>
                <Tab>Users</Tab>
              </TabList>
              {/* Details Tab */}
              <TabPanel>
                <InputWithLabel
                  label="Name:"
                  type="text"
                  value={props.checklistSelectedDetails.name}
                  onChange={(e) => props.handleSetChecklistName(e)}
                />
                <InputWithLabel
                  label="Description:"
                  type="text"
                  value={props.checklistSelectedDetails.description}
                  onChange={(e) => props.handleSetChecklistDescription(e)}
                />
                <InputWithLabel
                  label="Due Date:"
                  type="date"
                  value={props.checklistSelectedDetails.due_date}
                  onChange={(e) => props.handleSetDueDate(e)}
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    columnGap: "1vw",
                  }}
                >
                  <InputWithLabel
                    label="Completion Rate"
                    type="number"
                    value={props.completion_rate}
                    min={0.01}
                    max={1.0}
                    onChange={(e) => props.handleSetCompletionRate(e)}
                  />
                  <InputWithLabel
                    label="Validation Rate"
                    type="number"
                    value={props.validation_rate}
                    min={0.01}
                    step={0.01}
                    onChange={(e) => props.handleSetValidationRate(e)}
                  />
                  <DifficultySelector
                    checklistDifficulty={props.checklistDifficulty}
                    handleSetDifficulty={(value) =>
                      props.handleSetChecklistDifficulty(value)
                    }
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <SectionTitle title_text={"Visibility:"} />
                  <SectionSubtitle subtitle_text={"Public:"} />
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
                  <SectionSubtitle subtitle_text={"Private:"} />
                  <input
                    type="radio"
                    value="private"
                    name="private"
                    onChange={() => props.handleToggleVisibility()}
                    checked={props.visibility === false}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <SectionTitle title_text={"Status:"} />
                  <SectionSubtitle subtitle_text={"Active:"} />
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
                  <SectionSubtitle subtitle_text={"Inactive:"} />
                  <input
                    type="radio"
                    value="inactive"
                    name="inactive"
                    onChange={() => props.handleSetChecklistStatus()}
                    checked={props.checklistStatus === false}
                    style={{ marginRight: "6.5vw" }}
                  />
                </div>

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
        wordWrap: "break-word",
      }}
    >
      {(props.role && props.role == "admin") || props.type == "New" ? (
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
        <p>{props.description ? props.description : "No Description"}</p>
      </div>
      <div
        style={{
          flex: "1",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          maxHeight: "37vh",
        }}
      >
        {props.list_items &&
          props.list_items.slice().map((item) => {
            const { number, action, link, completed, confirmed } = item;
            return (
              <>
                {!completed ? (
                  <div
                    key={number}
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      borderBottomStyle: "solid",
                      borderColor: "#d4d9d8",
                      borderWidth: "1px",
                      padding: "5px",
                      margin: "5px",
                    }}
                  >
                    <input
                      type="checkbox"
                      id={number}
                      key={number}
                      checked={completed === true}
                      onChange={(e) => {
                        if (props.handleCompleteListItem && !props.completed) {
                          props.handleCompleteListItem(
                            e,
                            number,
                            props.id,
                            props.user_id,
                            props.name
                          );
                        } else {
                          alert("Admin cannot complete tasks");
                        }
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignContent: "left",
                      }}
                    >
                      <SectionSubtitle
                        align={"left"}
                        key={action}
                        subtitle_text={action}
                      />
                      <a
                        href={link}
                        target="_blank" // This opens the link in a new tab
                        rel="noopener noreferrer" // Recommended for security
                        style={{
                          textDecoration: "none",
                          color: "blue",
                          paddingLeft: "1vw",
                        }}
                      >
                        {link}
                      </a>
                    </div>
                  </div>
                ) : (
                  ""
                )}
              </>
            );
          })}
      </div>
      <div
        style={{
          flex: "1",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          maxHeight: "37vh",
        }}
      >
        <div>
          <p
            style={{
              margin: "5px",
            }}
          >
            Awaiting Confirmation
          </p>
          {props.list_items &&
            props.list_items.map((item) => {
              const { number, action, link, completed, confirmed } = item;

              // Render items not completed and not confirmed
              if (completed && !confirmed) {
                return (
                  <div
                    key={number}
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      borderBottomStyle: "solid",
                      borderColor: "#d4d9d8",
                      borderWidth: "1px",
                      padding: "5px",
                      margin: "5px",
                    }}
                  >
                    <input
                      type="checkbox"
                      id={number}
                      key={number}
                      checked={confirmed === true}
                      onChange={(e) => {
                        if (!props.confirmed && props.handleConfirmItem) {
                          props.handleConfirmItem(
                            e,
                            number,
                            props.id,
                            props.user_id,
                            props.name
                          );
                        } else {
                          alert("You cannot confirm this task");
                        }
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <SectionSubtitle
                        align={"left"}
                        key={action}
                        subtitle_text={action}
                      />
                      <a
                        href={link}
                        target="_blank" // This opens the link in a new tab
                        rel="noopener noreferrer" // Recommended for security
                        style={{
                          textDecoration: "none",
                          color: "blue",
                          paddingLeft: "1vw",
                        }}
                      >
                        {link}
                      </a>
                    </div>
                  </div>
                );
              }
              return null;
            })}
        </div>
      </div>
      <div
        style={{
          margin: ".5vw",
        }}
      >
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
