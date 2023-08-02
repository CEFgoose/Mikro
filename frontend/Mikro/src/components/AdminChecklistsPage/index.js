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
    setConfirmQuestion,
    confirmText,
    commentOpen,
    toggleCommentOpen,
    comment,
    setComment,
    addChecklistComment,
    deleteChecklistComment,
    deleteChecklistItem,
    spliceArray,
    checklistUsers,
    setChecklistUsers,
    fetchChecklistUsers,
    userSelected,
    setUserSelected,
    assignUserChecklist,
    unassignUserChecklist,
    orgStaleChecklists,
    findIndexById,
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
  const [deleteListItems, setDeleteListItems] = useState([]);
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
  const [assignmentStatus, setAssignmentStatus] = useState(null);
  const [assignmentButtonText, setAssignmentButtonText] = useState("Assign");

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
    setItemSelected(null);
    setTempListItem({});
    setTempNumber(null);
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

  const handleSetUserSelected = (user_id, assignment_status) => {
    setUserSelected(user_id);
    setAssignmentStatus(assignment_status);
    if (assignment_status === "Yes") {
      setAssignmentButtonText("Unassign");
    } else {
      setAssignmentButtonText("Assign");
    }
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

  const handleSetTempListItem = (update) => {
    let index = listItems.length + 1;
    setTempListItem({
      number: index,
      action: tempAction,
      link: tempLink,
    });
    let item = {
      number: index,
      action: tempAction,
      link: tempLink,
    };
    let list = listItems;
    list.push(item);
    handleSetListItems(list);
    if (update) {
      handleUpdateListItems(true);
    }
    setTempAction("");
    setTempLink("");
  };

  const handleEditTempListItem = () => {
    let item_index = findIndexById(listItems, itemSelected);
    let item = listItems[item_index];
    item.action = tempAction;
    item.link = tempLink;
    let list = listItems;
    list[item_index] = item;
    handleSetListItems(list);
    setTempAction("");
    setTempLink("");
    setTempNumber(null);
    setAddButtonText("Add");
  };

  const handleSetTempAction = (e) => {
    setTempAction(e.target.value);
  };

  const handleSetTempLink = (e) => {
    setTempLink(e.target.value);
  };

  const handleSetChecklistSelected = (id, name) => {
    if (id !== null && id !== undefined) {
      setChecklistSelected(parseInt(id));
      setChecklistSelectedName(name);
    } else {
      setChecklistSelected(null);
      setChecklistSelectedName("");
    }
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

  const handleConfirmItem = (e, itemNumber, id, user_id) => {
    if (e.target.checked) {
      confirmListItem(id, itemNumber, user_id);
    }
  };

  const handleDeleteChecklist = () => {
    deleteChecklist(checklistSelected, checklistSelectedName);
    handleDeleteOpen();
  };

  const handleEditItem = (id, number, action, link) => {
    handleSetItemSelected(id, number, action, link);
  };

  const handleUpdateListItems = (stopToggle = false, list = null) => {
    if (stopToggle) {
      updateListItems(checklistSelected, listItems, deleteListItems);
    }
    if (!stopToggle) {
      updateListItems(checklistSelected, listItems, deleteListItems);
      toggleAddItemOpen();
      handleAddItemOpen();
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

  const handleDeleteComment = () => {
    deleteChecklistComment(commentSelected, user.role);
    setChecklistSelected(null);
    setChecklistSelectedName(null);
    setComment("");
  };

  const handleDeleteItem = (selectedItem) => {
    let targetList = listItems;
    let index = findIndexById(targetList, selectedItem);
    let delete_item = targetList[index];
    let deletionList = deleteListItems;
    deletionList.push(delete_item);
    setDeleteListItems(deletionList);
    targetList = spliceArray(targetList, index);
    handleSetListItems(targetList);
    handleUpdateListItems(true);
    setTempAction("");
    setTempLink("");
    setTempNumber(null);
    setAddButtonText("Add");
  };

  const handleSetCommentSelected = (id) => {
    setCommentSelected(id);
  };

  const handleAssignUser = () => {
    if (assignmentStatus === "No") {
      assignUserChecklist(checklistSelected, userSelected);
    } else {
      unassignUserChecklist(checklistSelected, userSelected);
    }
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
        checklistUsers={checklistUsers}
        setChecklistUsers={setChecklistUsers}
        fetchChecklistUsers={fetchChecklistUsers}
        userSelected={userSelected}
        handleSetUserSelected={handleSetUserSelected}
        assignmentButtonText={assignmentButtonText}
        handleAssignUser={handleAssignUser}
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
        handleDeleteItem={handleDeleteItem}
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

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          height: "100%",
          float: "left",
          // backgroundColor:'lightgrey'
        }}
      >
        <Sidebar isOpen={sidebarOpen} />
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            // backgroundColor:'lightsalmon'
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              // backgroundColor:'lightseagreen'
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                height: "6rem",
                width: "100%",
                // backgroundColor:'lightgoldenrodyellow'
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  height: "6rem",
                  width: "56rem",
                  // backgroundColor:'burlywood'
                }}
              >
                <h1
                  style={{
                    marginLeft: "2rem",
                    marginTop: "1vw",
                    paddingBottom: "2vh",
                  }}
                >
                  <strong>Checklists:</strong>
                </h1>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  width: "100%",
                  justifyContent: "right",
                  marginTop: "2vw",
                  position: "relative",
                  // left: "38vw",
                  // backgroundColor:'lightgrey'
                }}
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

            <div
              style={{
                width: "100%",
                height: "100%",
                // backgroundColor:'lawngreen'
              }}
            >
              <Tabs style={{ height: "100%" }}>
                <TabList
                  style={{
                    marginLeft: "3vw",
                    marginTop: "0vh",
                    paddingTop: "0vh",
                  }}
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

                  <Tab value={5} onClick={(e) => handleSetActiveTab(e)}>
                    Stale
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

                <TabPanel>
                  <ChecklistCardGrid
                    type={"Validator"}
                    role={user.role}
                    key={5}
                    checklists={orgStaleChecklists}
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
        </div>
      </div>
    </>
  );
};
