import React, { useContext, useState, useEffect } from "react";
import { DataContext } from "common/DataContext";
import { AuthContext } from "../../common/AuthContext";
import Sidebar from "../sidebar/sidebar";
import "./styles.css";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import {
  ChecklistCardGrid,
  ConfirmationModal,
  CommentModal,
} from "../AdminChecklistsPage/checklistComponents";
import { ButtonDivComponent } from "components/commonComponents/commonComponents";

export const UserChecklistsPage = () => {
  const { refresh, user } = useContext(AuthContext);
  const {
    sideBarOpen,
    handleSetSidebarState,
    userAvailableChecklists,
    userCompletedChecklists,
    userConfirmedChecklists,
    userStartedChecklists,
    fetchUserChecklists,
    startChecklist,
    goToSource,
    completeListItem,
    history,
    confirmOpen,
    toggleConfirmOpen,
    confirmQuestion,
    setConfirmQuestion,
    confirmText,
    commentOpen,
    addChecklistComment,
    toggleCommentOpen,
    comment,
    setComment,
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
    if (user !== null && user.role !== "user") {
      history("/login");
    }
    fetchUserChecklists();
    // eslint-disable-next-line
  }, []);

  const handleSetActiveTab = (e) => {
    setActiveTab(e.target.value);
  };

  const handleStartChecklist = () => {
    startChecklist(checklistSelected);
    setConfirmQuestion(`${checklistSelectedName} started!`);
    handleConfirmOpen();
  };

  const handleSetChecklistSelected = (id, name) => {
    setChecklistSelected(parseInt(id));
    setChecklistSelectedName(name);
  };

  const handleConfirmOpen = () => {
    toggleConfirmOpen();
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

  const handleViewSidebar = () => {
    handleSetSidebarState();
  };

  return (
    <>
      <ConfirmationModal
        confirmOpen={confirmOpen}
        handleConfirmOpen={handleConfirmOpen}
        question={confirmQuestion}
        extraText={confirmText}
      />
      <CommentModal
        commentOpen={commentOpen}
        handleCommentOpen={handleCommentOpen}
        comment={comment}
        handleSetComment={handleSetComment}
        handleAddComment={handleAddComment}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          height: "100%",
          float: "left",
        }}
      >
        <Sidebar isOpen={sideBarOpen} />
        <div style={{ width: "100%", height: "100%" }}>
          <div
            style={{
              display: "flex",
              position: "relative",
              marginLeft: ".5vw",
              flexDirection: "column",
              height: "100vh",
            }}
          >
            <div
              style={{
                display: "flex",
                marginLeft: "6vh",
                flexDirection: "row",
              }}
            >
              <h1
                style={{
                  // marginLeft: "3vw",
                  marginTop: "1vw",
                  paddingBottom: "2vh",
                }}
              >
                <strong>Checklists:</strong>
              </h1>
              <div
                style={{
                  marginTop: "2vw",
                  position: "relative",
                  left: activeTab !== 4 ? "38.5vw" : "58.5vw",
                }}
              >
                <ButtonDivComponent
                  role={"admin"}
                  button1={false}
                  button2={false}
                  button3={activeTab !== 4 ? false : true}
                  button3_text={"Start"}
                  button3_action={handleStartChecklist}
                />
              </div>
            </div>
            <Tabs>
              <TabList
                style={{
                  marginLeft: "vw",
                  marginTop: "0vh",
                  paddingTop: "0vh",
                }}
              >
                <Tab value={1} onClick={(e) => handleSetActiveTab(e)}>
                  In Progress
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
              </TabList>
              <TabPanel>
                <ChecklistCardGrid
                  handleCompleteListItem={handleCompleteListItem}
                  key={1}
                  type="User"
                  role={user.role}
                  goToSource={goToSource}
                  checklists={userStartedChecklists}
                  handleCommentOpen={handleCommentOpen}
                  handleSetChecklistSelected={handleSetChecklistSelected}
                  checklistSelected={checklistSelected}
                />
              </TabPanel>
              <TabPanel>
                <ChecklistCardGrid
                  role={user.role}
                  key={1}
                  type="User"
                  completed={true}
                  goToSource={goToSource}
                  checklists={userCompletedChecklists}
                  handleCommentOpen={handleCommentOpen}
                  handleSetChecklistSelected={handleSetChecklistSelected}
                  checklistSelected={checklistSelected}
                />
              </TabPanel>
              <TabPanel>
                <ChecklistCardGrid
                  role={user.role}
                  type="User"
                  key={1}
                  goToSource={goToSource}
                  checklists={userConfirmedChecklists}
                  handleCommentOpen={handleCommentOpen}
                  handleSetChecklistSelected={handleSetChecklistSelected}
                  checklistSelected={checklistSelected}
                />
              </TabPanel>
              <TabPanel>
                <ChecklistCardGrid
                  type="New"
                  role={user.role}
                  key={1}
                  checklists={userAvailableChecklists}
                  handleSetChecklistSelected={handleSetChecklistSelected}
                  checklistSelected={checklistSelected}
                />
              </TabPanel>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
};
