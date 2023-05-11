import React, { useContext, useState, useEffect } from "react";
import { DataContext } from "common/DataContext";
import { AuthContext } from "../../common/AuthContext";
import Sidebar from "../sidebar/sidebar";
import "./styles.css";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { ButtonDivComponent } from "components/commonComponents/commonComponents";
import {
  ConfirmationModal,
  ChecklistCardGrid,
  CommentModal,
} from "../AdminChecklistsPage/checklistComponents";

export const ValidatorChecklistsPage = () => {
  const { refresh, user } = useContext(AuthContext);
  const {
    userAvailableChecklists,
    userCompletedChecklists,
    userConfirmedChecklists,
    userStartedChecklists,
    confirmListItem,
    orgUserCompletedChecklists,
    orgUserConfirmedChecklists,
    fetchValidatorChecklists,
    goToSource,
    completeListItem,
    startChecklist,
    history,
    confirmOpen,
    toggleConfirmOpen,
    confirmQuestion,
    confirmText,
    commentOpen,
    toggleCommentOpen,
    comment,
    setComment,
    addChecklistComment,
  } = useContext(DataContext);

  const [checklistSelected, setChecklistSelected] = useState(null);
  const [checklistSelectedName, setChecklistSelectedName] = useState(null);
  const [activeTab, setActiveTab] = useState(1);

  useEffect(() => {
    if (user) {
      refresh();
    }
    if (user === null) {
      history("/login");
    }
    if (user !== null && user.role !== "validator") {
      history("/login");
    }
    fetchValidatorChecklists();
    // eslint-disable-next-line
  }, []);

  const handleSetActiveTab = (e) => {
    setActiveTab(e.target.value);
  };

  const handleConfirmOpen = () => {
    toggleConfirmOpen();
  };

  const handleSetChecklistSelected = (id, name) => {
    setChecklistSelected(parseInt(id));
    setChecklistSelectedName(name);
  };

  const handleConfirmItem = (e, itemNumber, id, userID, name) => {
    if (e.target.checked) {
      confirmListItem(id, itemNumber, userID, name);
    }
  };

  const handleStartChecklist = () => {
    startChecklist(checklistSelected);
  };

  const handleCompleteListItem = (e, itemNumber, id, userID, name) => {
    if (e.target.checked) {
      completeListItem(id, itemNumber, userID, name);
    }
  };

  const handleCommentOpen = (id, name) => {
    setChecklistSelected(id);
    setChecklistSelectedName(name);
    setComment("");
    toggleCommentOpen();
  };

  const handleSetComment = (e) => {
    setComment(e.target.value);
  };

  const handleAddComment = () => {
    addChecklistComment(
      checklistSelected,
      checklistSelectedName,
      comment,
      user.role
    );
    setChecklistSelected(null);
    setChecklistSelectedName(null);
    setComment("");
    handleCommentOpen();
  };

  return (
    <>
      <CommentModal
        commentOpen={commentOpen}
        handleCommentOpen={handleCommentOpen}
        comment={comment}
        handleSetComment={handleSetComment}
        handleAddComment={handleAddComment}
      />

      <ConfirmationModal
        confirmOpen={confirmOpen}
        handleConfirmOpen={handleConfirmOpen}
        question={confirmQuestion}
        extraText={confirmText}
      />

      <div style={{ width: "100%", float: "left" }}>
        <Sidebar isOpen={true} />
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
              <strong>Checklists:</strong>
            </h1>
            <div
              style={{
                marginTop: "1vw",
                position: "relative",
                left: activeTab !== 4 ? "40.5vw" : "60vw",
              }}
            >
              <ButtonDivComponent
                role={"admin"}
                button1={activeTab !== 5 ? false : false}
                button2={activeTab !== 5 ? false : false}
                button3={activeTab !== 4 ? false : true}
                button1_text={"Add"}
                button2_text={"Edit"}
                button3_text={activeTab !== 4 ? "Delete" : "Start"}
                button3_action={activeTab !== 4 ? <></> : handleStartChecklist}
              />
            </div>
          </div>
          <Tabs>
            <TabList
              style={{ marginLeft: "0vw", marginTop: "0vh", paddingTop: "0vh" }}
            >
              <Tab value={1} onClick={(e) => handleSetActiveTab(e)}>
                Started
              </Tab>
              <Tab value={2} onClick={(e) => handleSetActiveTab(e)}>
                Completed
              </Tab>
              <Tab value={3} onClick={(e) => handleSetActiveTab(e)}>
                Confirmed
              </Tab>
              <Tab value={4} onClick={(e) => handleSetActiveTab(e)}>
                New
              </Tab>
              <Tab value={5} onClick={(e) => handleSetActiveTab(e)}>
                Ready for Confirmation
              </Tab>

              <Tab value={6} onClick={(e) => handleSetActiveTab(e)}>
                Confirmed by you
              </Tab>
            </TabList>
            <TabPanel>
              <ChecklistCardGrid
                type="User"
                key={1}
                role={user.role}
                goToSource={goToSource}
                checklists={userStartedChecklists}
                handleCompleteListItem={handleCompleteListItem}
                handleSetChecklistSelected={handleSetChecklistSelected}
                checklistSelected={checklistSelected}
                handleCommentOpen={handleCommentOpen}
                handleAddComment={handleAddComment}
              />
            </TabPanel>
            <TabPanel>
              <ChecklistCardGrid
                type="User"
                role={user.role}
                key={1}
                completed={true}
                goToSource={goToSource}
                checklists={userCompletedChecklists}
                handleSetChecklistSelected={handleSetChecklistSelected}
                checklistSelected={checklistSelected}
                handleCommentOpen={handleCommentOpen}
                handleAddComment={handleAddComment}
              />
            </TabPanel>
            <TabPanel>
              <ChecklistCardGrid
                type={"User"}
                role={user.role}
                key={1}
                checklists={userConfirmedChecklists}
                handleSetChecklistSelected={handleSetChecklistSelected}
                checklistSelected={checklistSelected}
                handleCommentOpen={handleCommentOpen}
                handleAddComment={handleAddComment}
              />
            </TabPanel>
            <TabPanel>
              <ChecklistCardGrid
                type={"New"}
                role={user.role}
                key={1}
                checklists={userAvailableChecklists}
                handleSetChecklistSelected={handleSetChecklistSelected}
                handleConfirmItem={handleConfirmItem}
                checklistSelected={checklistSelected}
              />
            </TabPanel>
            <TabPanel>
              <ChecklistCardGrid
                type={"Validator"}
                role={user.role}
                key={1}
                checklists={orgUserCompletedChecklists}
                handleSetChecklistSelected={handleSetChecklistSelected}
                handleConfirmItem={handleConfirmItem}
                handleAddComment={handleAddComment}
                handleCommentOpen={handleCommentOpen}
              />
            </TabPanel>
            <TabPanel>
              <ChecklistCardGrid
                type={"Validator"}
                role={user.role}
                key={1}
                checklists={orgUserConfirmedChecklists}
                handleSetChecklistSelected={handleSetChecklistSelected}
                handleConfirmItem={handleConfirmItem}
                handleAddComment={handleAddComment}
                handleCommentOpen={handleCommentOpen}
              />
            </TabPanel>
          </Tabs>
        </div>
      </div>
    </>
  );
};
