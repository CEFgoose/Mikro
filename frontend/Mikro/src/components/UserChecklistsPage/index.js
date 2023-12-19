import React, { useContext, useState, useEffect } from "react";
import { DataContext } from "common/DataContext";
import { AuthContext } from "../../common/AuthContext";
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
      <Tabs>
        <TabList>
          <Tab value={1} onClick={(e) => handleSetActiveTab(e)}>
            In Progress
          </Tab>
          <Tab value={2} onClick={(e) => handleSetActiveTab(e)}>
            Completed
          </Tab>
          <Tab value={3} onClick={(e) => handleSetActiveTab(e)}>
            Confirmed
          </Tab>
        </TabList>

        <TabPanel value={activeTab}>
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
        <TabPanel value={activeTab}>
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
        <TabPanel value={activeTab}>
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
      </Tabs>
    </>
  );
};
