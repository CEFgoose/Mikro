import React, { useContext, useState, useEffect } from "react";
import { DataContext } from "common/DataContext";
import { AuthContext } from "../../common/AuthContext";
import useToggle from "../../hooks/useToggle.js";
import Sidebar from "../sidebar/sidebar";
import "./styles.css";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import {
  AddChecklistModal,
  DeleteChecklistModal,
  ModifyChecklistModal,
  ChecklistCardGrid,
  AddItemModal,
  ConfirmationModal,
  CommentModal,
} from "./checklistComponents";
import { ButtonDivComponent } from "components/commonComponents/commonComponents";

export const AdminChecklistsPage = () => {
  const { refresh, user } = useContext(AuthContext);
  const {
    createChecklist,
    sidebarOpen,
    handleSetSidebarState,
    fetchAdminChecklists,
    orgActiveChecklists,
    orgInActiveChecklists,
    deleteChecklist,
    confirmListItem,
    findObjectById,
    checklistSelectedDetails,
    setChecklistSelectedDetails,
    orgUserCompletedChecklists,
    orgUserConfirmedChecklists,
    updateChecklist,
    goToSource,
    updateListItems,
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
    deleteChecklistComment,
  } = useContext(DataContext);

  const [page, setPage] = useState(1);
  const [checklistName, setChecklistName] = useState(null);
  const [checklistDescription, setChecklistDescription] = useState(null);
  const [visibility, toggleVisibility] = useToggle(true);
  const [checklistDifficulty, setChecklistDifficulty] = useState("Easy");
  const [checklistStatus, toggleChecklistStatus] = useToggle(null);
  const [completionRate, setCompletionRate] = useState(0.0);
  const [validationRate, setValidationRate] = useState(0.0);
  const [listItems, setListItems] = useState([]);
  const [tempListItem, setTempListItem] = useState({});
  const [addButtonText, setAddButtonText] = useState("Add");
  const [tempAction, setTempAction] = useState(null);
  const [tempLink, setTempLink] = useState(null);
  const [tempNumber, setTempNumber] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [itemSelected, setItemSelected] = useState(null);
  const [checklistSelected, setChecklistSelected] = useState(null);
  const [checklistSelectedName, setChecklistSelectedName] = useState(null);
  const [addOpen, toggleAddOpen] = useToggle(false);
  const [deleteOpen, toggleDeleteOpen] = useToggle(false);
  const [modifyOpen, toggleModifyOpen] = useToggle(false);
  const [addItemOpen, toggleAddItemOpen] = useToggle(false);
  const [activeTab, setActiveTab] = useState(1);
  const [commentSelected, setCommentSelected] = useState(null);

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
    fetchAdminChecklists();
    // eslint-disable-next-line
  }, []);

  const handleSetActiveTab = (e) => {
    setActiveTab(e.target.value);
  };

  const handleAddOpen = () => {
    setPage(1);
    setChecklistName("");
    setChecklistDescription("");
    setCompletionRate(0.0);
    setValidationRate(0.0);
    setChecklistDifficulty("Easy");
    setTempListItem({});
    setTempAction("");
    setTempLink("");
    setListItems([]);
    toggleAddOpen(!addOpen);
  };

  const handleDeleteOpen = () => {
    if (checklistSelected !== null) {
      toggleDeleteOpen();
    }
  };

  const handleModifyOpen = () => {
    let selectedChecklist;
    if (checklistSelected !== null) {
      if (activeTab === 1) {
        selectedChecklist = findObjectById(
          orgActiveChecklists,
          checklistSelected
        );
      } else {
        selectedChecklist = findObjectById(
          orgInActiveChecklists,
          checklistSelected
        );
      }
      handleSetChecklistStatus(selectedChecklist.active_status);
      setCompletionRate(selectedChecklist.completion_rate);
      setValidationRate(selectedChecklist.validation_rate);
      setChecklistDifficulty(selectedChecklist.difficulty);
      setChecklistSelectedDetails(selectedChecklist);
      toggleModifyOpen();
    }
  };

  const handleAddItemOpen = (id, name, listItems) => {
    setTempListItem({});
    setTempAction("");
    setTempLink("");
    setListItems([]);
    if (addItemOpen === false) {
      setChecklistName(name);
      setChecklistSelected(id);
      setListItems(listItems);
    } else {
      setChecklistName(null);
      setChecklistSelected(null);
    }
    toggleAddItemOpen(!addItemOpen);
  };

  const handleConfirmOpen = () => {
    toggleConfirmOpen();
  };

  const handleSetChecklistStatus = (e) => {
    if (e !== null) {
      toggleChecklistStatus(e);
    } else {
      toggleChecklistStatus();
    }
  };

  const handleViewSidebar = () => {
    handleSetSidebarState();
  };

  const handleSetChecklistName = (e) => {
    setChecklistName(e.target.value);
  };

  const handleSetChecklistDescription = (e) => {
    setChecklistDescription(e.target.value);
  };

  const handleSetCompletionRate = (e) => {
    setCompletionRate(e.target.value);
  };

  const handleSetDueDate = (e) => {
    setDueDate(e.target.value);
  };

  const handleSetValidationRate = (e) => {
    setValidationRate(e.target.value);
  };

  const handleSetChecklistDifficulty = (e) => {
    setChecklistDifficulty(e.target.value);
  };

  const handleToggleVisibility = (e) => {
    toggleVisibility();
  };

  const handleSetListItems = (e) => {
    setListItems(e);
  };

  const handleSetItemSelected = (id, number, action, link) => {
    if (itemSelected === null || itemSelected !== id) {
      setItemSelected(id);
      setTempNumber(number);
      setTempAction(action);
      setTempLink(link);
      setAddButtonText("Edit");
    } else {
      setItemSelected(null);
      setTempAction("");
      setTempNumber(null);
      setTempLink("");
      setAddButtonText("Add");
    }
  };

  const handleSetTempListItem = () => {
    setTempListItem({
      number: listItems.length + 1,
      action: tempAction,
      link: tempLink,
    });
    let item = {
      number: listItems.length + 1,
      action: tempAction,
      link: tempLink,
    };
    let list = listItems;
    list.push(item);
    handleSetListItems(list);
    setTempAction("");
    setTempLink("");
  };

  const handleEditTempListItem = () => {
    let item = listItems[tempNumber - 1];
    item.action = tempAction;
    item.link = tempLink;
    let list = listItems;
    list[tempNumber - 1] = item;
    handleSetListItems(list);
    setTempAction("");
    setTempLink("");
  };

  const handleSetTempAction = (e) => {
    setTempAction(e.target.value);
  };

  const handleSetTempLink = (e) => {
    setTempLink(e.target.value);
  };

  const handleSetChecklistSelected = (id, name) => {
    setChecklistSelected(parseInt(id));
    setChecklistSelectedName(name);
  };

  const handleModifyChecklist = (openModal = true) => {
    updateChecklist( 
      checklistSelected,     
      checklistName,
      checklistDescription,
      checklistDifficulty,
      visibility,
      completionRate,
      validationRate,
      listItems,
      dueDate,
      checklistStatus
      );
    if (openModal) {
      handleModifyOpen();
    } else {
      handleAddItemOpen();
    }
  };

  const handleSetPage = (e) => {
    if (e === "next") {
      setPage(page + 1);
    } else if (e === "back") {
      setPage(page - 1);
    } else {
      setPage(e);
    }
  };

  const handleCreateChecklist = () => {
    createChecklist(
      checklistName,
      checklistDescription,
      checklistDifficulty,
      visibility,
      completionRate,
      validationRate,
      listItems,
      dueDate
    );
    handleAddOpen();
  };

  const handleConfirmItem = (e, itemNumber, id) => {
    if (e.target.checked) {
      confirmListItem(id, itemNumber);
    }
  };

  const handleDeleteChecklist = () => {
    deleteChecklist(checklistSelected, checklistSelectedName);
    handleDeleteOpen();
  };

  const handleEditItem = (id, number, action, link) => {
    handleSetItemSelected(id, number, action, link);
  };

  const handleUpdateListItems = () => {
    updateListItems(checklistSelected, listItems);
    toggleAddItemOpen();
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

  const handleDeleteComment = () => {
    deleteChecklistComment(commentSelected, user.role);
    setChecklistSelected(null);
    setChecklistSelectedName(null);
    setComment("");
  };

  const handleSetCommentSelected = (id) => {
    setCommentSelected(id);
  };

  return (
    <>
      <AddChecklistModal
        addOpen={addOpen}
        handleAddOpen={handleAddOpen}
        page={page}
        handleSetPage={handleSetPage}
        checklistName={checklistName}
        checklistSelected={checklistSelected}
        handleSetChecklistSelected={handleSetChecklistSelected}
        handleSetChecklistName={handleSetChecklistName}
        checklistDescription={checklistDescription}
        handleSetChecklistDescription={handleSetChecklistDescription}
        completion_rate={completionRate}
        handleSetCompletionRate={handleSetCompletionRate}
        validation_rate={validationRate}
        handleSetValidationRate={handleSetValidationRate}
        visibility={visibility}
        handleToggleVisibility={handleToggleVisibility}
        checklistDifficulty={checklistDifficulty}
        handleSetChecklistDifficulty={handleSetChecklistDifficulty}
        listItems={listItems}
        handleSetListItems={handleSetListItems}
        handleSetTempListItem={handleSetTempListItem}
        tempAction={tempAction}
        handleSetTempAction={handleSetTempAction}
        tempLink={tempLink}
        handleSetTempLink={handleSetTempLink}
        handleCreateChecklist={handleCreateChecklist}
        dueDate={dueDate}
        handleSetDueDate={handleSetDueDate}
      />

      <DeleteChecklistModal
        deleteOpen={deleteOpen}
        handleDeleteOpen={handleDeleteOpen}
        checklistSelected={checklistSelected}
        handleDeleteChecklist={handleDeleteChecklist}
      />

      <ModifyChecklistModal
        modifyOpen={modifyOpen}
        handleModifyOpen={handleModifyOpen}
        checklistSelected={checklistSelected}
        handleSetChecklistSelected={handleSetChecklistSelected}
        checklistSelectedDetails={checklistSelectedDetails}
        checklistDifficulty={checklistDifficulty}
        handleSetChecklistDifficulty={handleSetChecklistDifficulty}
        checklistStatus={checklistStatus}
        handleSetChecklistStatus={handleSetChecklistStatus}
        dueDate={dueDate}
        handleSetDueDate={handleSetDueDate}
        checklistName={checklistName}
        handleSetChecklistName={handleSetChecklistName}
        handleSetChecklistDescription={handleSetChecklistDescription}
        visibility={visibility}
        completion_rate={completionRate}
        handleSetCompletionRate={handleSetCompletionRate}
        validation_rate={validationRate}
        handleSetValidationRate={handleSetValidationRate}
        handleToggleVisibility={handleToggleVisibility}
        handleModifyChecklist={handleModifyChecklist}
      />

      <AddItemModal
        addButtonText={addButtonText}
        addItemOpen={addItemOpen}
        handleAddItemOpen={handleAddItemOpen}
        itemSelected={itemSelected}
        name={checklistName}
        id={checklistSelected}
        listItems={listItems}
        handleSetListItems={handleSetListItems}
        handleSetTempListItem={handleSetTempListItem}
        handleEditTempListItem={handleEditTempListItem}
        tempNumber={tempNumber}
        tempAction={tempAction}
        handleSetTempAction={handleSetTempAction}
        tempLink={tempLink}
        handleSetTempLink={handleSetTempLink}
        handleEditItem={handleEditItem}
        handleModifyChecklist={handleModifyChecklist}
        handleUpdateListItems={handleUpdateListItems}
      />
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

      <div style={{ width: "100%", float: "left" }}>
        <Sidebar isOpen={sidebarOpen} toggleSidebar={handleViewSidebar} />
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
              style={{ marginTop: "1vw", position: "relative", left: "40.5vw" }}
            >
              <ButtonDivComponent
                role={"admin"}
                button1={activeTab === 3 || activeTab === 4 ? false : true}
                button2={activeTab === 3 || activeTab === 4 ? false : true}
                button3={activeTab === 3 || activeTab === 4 ? false : true}
                button1_text={"Add"}
                button2_text={"Edit"}
                button3_text={"Delete"}
                button1_action={handleAddOpen}
                button2_action={handleModifyOpen}
                button3_action={handleDeleteOpen}
              />
            </div>
          </div>
          <Tabs>
            <TabList
              style={{ marginLeft: "3vw", marginTop: "0vh", paddingTop: "0vh" }}
            >
              <Tab value={1} onClick={(e) => handleSetActiveTab(e)}>
                Active
              </Tab>

              <Tab value={2} onClick={(e) => handleSetActiveTab(e)}>
                Inactive
              </Tab>
              <Tab value={3} onClick={(e) => handleSetActiveTab(e)}>
                Ready for Confirmation
              </Tab>

              <Tab value={4} onClick={(e) => handleSetActiveTab(e)}>
                Completed & Confirmed
              </Tab>
            </TabList>
            <TabPanel>
              <ChecklistCardGrid
                type="Admin"
                key={1}
                role={user.role}
                goToSource={goToSource}
                checklists={orgActiveChecklists}
                handleSetChecklistSelected={handleSetChecklistSelected}
                handleAddItemOpen={handleAddItemOpen}
                handleCommentOpen={handleCommentOpen}
                checklistSelected={checklistSelected}
              />
            </TabPanel>
            <TabPanel>
              <ChecklistCardGrid
                type="Admin"
                role={user.role}
                key={2}
                goToSource={goToSource}
                checklists={orgInActiveChecklists}
                handleCommentOpen={handleCommentOpen}
                handleSetChecklistSelected={handleSetChecklistSelected}
                handleAddItemOpen={handleAddItemOpen}
                checklistSelected={checklistSelected}
              />
            </TabPanel>

            <TabPanel>
              <ChecklistCardGrid
                type={"Validator"}
                role={user.role}
                key={3}
                checklists={orgUserCompletedChecklists}
                handleSetComment={handleSetComment}
                handleAddComment={handleAddComment}
                handleCommentOpen={handleCommentOpen}
                commentOpen={commentOpen}
                handleDeleteComment={handleDeleteComment}
                handleConfirmItem={handleConfirmItem}
                commentSelected={commentSelected}
                handleSetCommentSelected={handleSetCommentSelected}
              />
            </TabPanel>

            <TabPanel>
              <ChecklistCardGrid
                type={"Validator"}
                role={user.role}
                key={4}
                checklists={orgUserConfirmedChecklists}
                handleCommentOpen={handleCommentOpen}
                handleSetChecklistSelected={handleSetChecklistSelected}
                handleDeleteComment={handleDeleteComment}
                commentSelected={commentSelected}
                handleSetCommentSelected={handleSetCommentSelected}
              />
            </TabPanel>
          </Tabs>
        </div>
      </div>
    </>
  );
};
