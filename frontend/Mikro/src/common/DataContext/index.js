import { useNavigate } from "react-router-dom";
import { InteractionContext } from "common/InteractionContext";
import { AuthContext } from "common/AuthContext";
import { fetcher, poster } from "../../calls";
import useToggle from "../../hooks/useToggle";
import React, { createContext, useContext, useState } from "react";

// CONTEXT IMPORTS //
export const DataContext = createContext({});
export const DataProvider = ({ children }) => {
  const {} = useContext(InteractionContext);
  const {} = useContext(AuthContext);
  const history = useNavigate();
  const [sidebarOpen, toggleSidebarOpen] = useToggle(true);
  const [orgUsers, setOrgUsers] = useState([]);
  const [projectUsers, setProjectUsers] = useState([]);
  const [checklistUsers, setChecklistUsers] = useState([]);
  const [projectSelectedDetails, setProjectSelectedDetails] = useState(null);
  const [checklistSelectedDetails, setChecklistSelectedDetails] =
    useState(null);
  const [firstName, setFirstName] = useState(null);
  const [lastName, setLastName] = useState(null);
  const [fullName, setFullName] = useState(null);
  const [OSMname, setOSMname] = useState(null);
  const [city, setCity] = useState(null);
  const [country, setCountry] = useState(null);
  const [email, setEmail] = useState(null);
  const [payEmail, setPayEmail] = useState(null);
  const [outputRate, setOutputRate] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [userSelected, setUserSelected] = useState(null);
  const [orgRequests, setOrgRequests] = useState([]);
  const [orgPayments, setOrgPayments] = useState([]);
  const [orgProjects, setOrgProjects] = useState([]);
  const [externalValidations, setExternalValidations] = useState([]);
  const [orgActiveChecklists, setorgActiveChecklists] = useState([]);
  const [orgInActiveChecklists, setorgInactiveChecklists] = useState([]);
  const [orgStaleChecklists, setOrgStaleChecklists] = useState([]);
  const [orgUserCompletedChecklists, setorgUserCompletedChecklists] = useState(
    []
  );
  const [orgUserConfirmedChecklists, setorgUserConfirmedChecklists] = useState(
    []
  );
  const [userAvailableChecklists, setUserAvailableChecklists] = useState([]);
  const [userCompletedChecklists, setUserCompletedChecklists] = useState([]);
  const [userConfirmedChecklists, setUserConfirmedChecklists] = useState([]);
  const [userStartedChecklists, setUserStartedChecklists] = useState([]);
  const [commentOpen, toggleCommentOpen] = useToggle(false);
  const [comment, setComment] = useState(null);
  const [orgTrainings, setOrgTrainings] = useState([]);
  const [orgMappingTrainings, setOrgMappingTrainings] = useState([]);
  const [orgValidationTrainings, setOrgValidationTrainings] = useState([]);
  const [orgProjectTrainings, setOrgProjectTrainings] = useState([]);
  const [userCompletedTrainings, setUserCompletedTrainings] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [inactiveProjects, setInactiveProjects] = useState(null);
  const [activeProjectsCount, setActiveProjectsCount] = useState(null);
  const [inactiveProjectsCount, setInactiveProjectsCount] = useState(null);
  const [completedProjects, setCompletedProjects] = useState(null);
  const [tasksMapped, setTasksMapped] = useState(null);
  const [tasksValidated, setTasksValidated] = useState(null);
  const [tasksInvalidated, setTasksInvalidated] = useState(null);
  const [validatorTasksValidated, setValidatorTasksValidated] = useState(null);
  const [validatorTasksInvalidated, setValidatorTasksInvalidated] =
    useState(null);
  const [payableTotal, setPayableTotal] = useState(null);
  const [requestsTotal, setRequestsTotal] = useState(null);
  const [paidTotal, setPaidTotal] = useState(null);
  const [CSVdata, setCSVdata] = useState([]);
  const [mappingEarnings, setMappingEarnings] = useState(null);
  const [validationEarnings, setValidationEarnings] = useState(null);
  const [checklistsEarnings, setChecklistsEarnings] = useState(null);
  const [totalEarnings, setTotalEarnings] = useState(null);
  const [confirmOpen, toggleConfirmOpen] = useToggle(false);
  const [confirmQuestion, setConfirmQuestion] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const handleSetSidebarState = () => {
    toggleSidebarOpen();
  };

  const handleOutputRate = (e) => {
    setOutputRate(e.target.value);
  };

  const handleAdminDashStates = (e) => {
    setActiveProjectsCount(e.active_projects);
    setInactiveProjectsCount(e.inactive_projects);
    setCompletedProjects(e.completed_projects);
    setTasksMapped(e.mapped_tasks);
    setTasksValidated(e.validated_tasks);
    setTasksInvalidated(e.invalidated_tasks);
    setValidatorTasksValidated(e.validator_validated);
    setValidatorTasksInvalidated(e.validator_invalidated);
    setPayableTotal(e.payable_total > 0 ? e.payable_total : 0);
    setRequestsTotal(e.requests_total > 0 ? e.requests_total : 0);
    setPaidTotal(e.payouts_total > 0 ? e.payouts_total : 0);
  };

  //CHECKLISTS ORIENTED CALLS & FUNCTIONS
  const createChecklist = (
    checklistName,
    checklistDescription,
    checklistDifficulty,
    visibility,
    completionRate,
    validationRate,
    listItems,
    dueDate
  ) => {
    let outpack = {
      checklistName: checklistName,
      checklistDescription: checklistDescription,
      checklistDifficulty: checklistDifficulty,
      visibility: visibility,
      completionRate: completionRate,
      validationRate: validationRate,
      listItems: listItems,
      dueDate: dueDate,
    };
    let createChecklistUrl = "checklist/create_checklist";
    poster(outpack, createChecklistUrl).then((response) => {
      if (response.status === 200) {
        if (response.created === true) {
          setConfirmQuestion(`${checklistName} has been Created`);
          toggleConfirmOpen();
        }
        fetchAdminChecklists();

        return true;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
        return;
      }
    });
  };

  const updateChecklist = (
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
  ) => {
    let outpack = {
      checklistSelected: checklistSelected,
      checklistName: checklistName,
      checklistDescription: checklistDescription,
      checklistDifficulty: checklistDifficulty,
      visibility: visibility,
      completionRate: completionRate,
      validationRate: validationRate,
      listItems: listItems,
      dueDate: dueDate,
      checklistStatus: checklistStatus,
    };
    let updateChecklistUrl = "checklist/update_checklist";
    poster(outpack, updateChecklistUrl).then((response) => {
      if (response.status === 200) {
        if (response.created === true) {
          setConfirmQuestion(`${checklistName} has been Updated`);
          toggleConfirmOpen();
        }
        fetchAdminChecklists();
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const deleteChecklist = (checklistSelected, checklistName) => {
    let outpack = {
      checklist_id: checklistSelected,
    };
    let deleteChecklistUrl = "checklist/delete_checklist";
    poster(outpack, deleteChecklistUrl).then((response) => {
      if (response.status === 200) {
        if (response.deleted === true) {
          setConfirmQuestion(`${checklistName} has been Deleted`);
          toggleConfirmOpen();
        }
        fetchAdminChecklists();
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const startChecklist = (checklistSelected) => {
    let outpack = {
      checklist_id: checklistSelected,
    };
    let startChecklistUrl = "checklist/start_checklist";
    poster(outpack, startChecklistUrl).then((response) => {
      if (response.status === 200) {
        if (response.started === true) {
          setConfirmQuestion(response.message);
          toggleConfirmOpen();
        }
        fetchUserChecklists();
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const completeListItem = (
    checklistSelected,
    itemNumber,
    userID,
    checklistName
  ) => {
    let outpack = {
      checklist_id: checklistSelected,
      item_number: itemNumber,
      user_id: userID,
    };
    let completeItemUrl = "checklist/complete_list_item";
    poster(outpack, completeItemUrl).then((response) => {
      if (response.status === 200) {
        fetchUserChecklists();
        if (response.checklist_completed === true) {
          setConfirmQuestion(`${checklistName} Completed!`);
          toggleConfirmOpen();
        }
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const confirmListItem = (
    checklistSelected,
    itemNumber,
    userID,
    checklistName
  ) => {
    let outpack = {
      checklist_id: checklistSelected,
      item_number: itemNumber,
      user_id: userID,
    };

    let confirmItemUrl = "checklist/confirm_list_item";
    poster(outpack, confirmItemUrl).then((response) => {
      if (response.status === 200) {
        fetchAdminChecklists();
        if (response.checklist_confirmed === true) {
          setConfirmQuestion(`${checklistName} Confirmed!`);
          toggleConfirmOpen();
        }
        return response.message;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const updateListItems = (checklistSelected, listItems, deleteListItems) => {
    let outpack = {
      checklist_id: checklistSelected,
      list_items: listItems,
      delete_list_items: deleteListItems,
    };
    let updateListItemsUrl = "checklist/update_list_items";
    poster(outpack, updateListItemsUrl).then((response) => {
      if (response.status === 200) {
        fetchAdminChecklists();
        if (response.checklist_completed === true) {
          setConfirmQuestion(response.message);
          toggleConfirmOpen();
        }
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const addChecklistComment = (
    checklistSelected,
    checklistName,
    comment,
    role
  ) => {
    let outpack = {
      checklist_id: checklistSelected,
      comment: comment,
    };
    let addChecklistCommentUrl = "checklist/add_checklist_comment";
    poster(outpack, addChecklistCommentUrl).then((response) => {
      if (response.status === 200) {
        if (response.comment_added === true) {
          setConfirmQuestion(response.message);
          toggleConfirmOpen();
        }
        if (role === "admin") {
          fetchAdminChecklists();
        }
        if (role === "validator") {
          fetchValidatorChecklists();
        } else {
          fetchUserChecklists();
        }
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const deleteChecklistItem = (itemSelected, role, checklistSelected) => {
    let outpack = {
      item_id: itemSelected,
      checklist_id: checklistSelected,
    };
    let deleteChecklistItemUrl = "checklist/delete_checklist_item";
    poster(outpack, deleteChecklistItemUrl).then((response) => {
      if (response.status === 200) {
        if (response.item_deleted === true) {
          setConfirmQuestion(response.message);
          toggleConfirmOpen();
        }
        if (role === "admin") {
          fetchAdminChecklists();
        }
        if (role === "validator") {
          fetchValidatorChecklists();
        } else {
          fetchUserChecklists();
        }
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const deleteChecklistComment = (commentSelected, role) => {
    let outpack = {
      comment_id: commentSelected,
    };
    let deleteChecklistCommentUrl = "checklist/delete_checklist_comment";
    poster(outpack, deleteChecklistCommentUrl).then((response) => {
      if (response.status === 200) {
        if (response.comment_deleted === true) {
          setConfirmQuestion(response.message);
          toggleConfirmOpen();
        }
        if (role === "admin") {
          fetchAdminChecklists();
        }
        if (role === "validator") {
          fetchValidatorChecklists();
        } else {
          fetchUserChecklists();
        }
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const fetchUserChecklists = () => {
    let fetchUserChecklistsUrl = "checklist/fetch_user_checklists";
    fetcher(fetchUserChecklistsUrl).then((response) => {
      if (response.status === 200) {
        setUserAvailableChecklists(response.user_available_checklists);
        setUserCompletedChecklists(response.user_completed_checklists);
        setUserConfirmedChecklists(response.user_confirmed_checklists);
        setUserStartedChecklists(response.user_started_checklists);
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const fetchValidatorChecklists = () => {
    let fetchValidatorChecklistsUrl = "checklist/fetch_validator_checklists";
    fetcher(fetchValidatorChecklistsUrl).then((response) => {
      if (response.status === 200) {
        setUserAvailableChecklists(response.user_available_checklists);
        setUserCompletedChecklists(response.user_completed_checklists);
        setUserConfirmedChecklists(response.user_confirmed_checklists);
        setUserStartedChecklists(response.user_started_checklists);

        setorgUserCompletedChecklists(response.ready_for_confirmation);
        setorgUserConfirmedChecklists(response.confirmed_and_completed);
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const fetchAdminChecklists = () => {
    let fetchAdminChecklistsUrl = "checklist/fetch_admin_checklists";
    fetcher(fetchAdminChecklistsUrl).then((response) => {
      if (response.status === 200) {
        setorgActiveChecklists(response.active_checklists);
        setorgInactiveChecklists(response.inactive_checklists);
        setorgUserCompletedChecklists(response.ready_for_confirmation);
        setorgUserConfirmedChecklists(response.confirmed_and_completed);
        setOrgStaleChecklists(response.stale_started_checklists);
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const assignUserChecklist = (checklist_id, user_id) => {
    let assignChecklistURL = "checklist/assign_user_checklist";
    let outpack = {
      checklist_id: checklist_id,
      user_id: user_id,
    };
    poster(outpack, assignChecklistURL).then((response) => {
      if (response.status === 200) {
        fetchAdminChecklists(checklist_id);
        fetchChecklistUsers(checklist_id);
        setConfirmQuestion(response.message);
        toggleConfirmOpen();
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const unassignUserChecklist = (checklist_id, user_id) => {
    let unassignChecklistURL = "checklist/unassign_user_checklist";
    let outpack = {
      checklist_id: checklist_id,
      user_id: user_id,
    };
    poster(outpack, unassignChecklistURL).then((response) => {
      if (response.status === 200) {
        fetchAdminChecklists(checklist_id);
        fetchChecklistUsers(checklist_id);
        setConfirmQuestion(response.message);
        toggleConfirmOpen();
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const fetchChecklistUsers = (checklistSelected) => {
    let fetchChecklistUsersURL = "checklist/fetch_checklist_users";
    let outpack = {
      checklist_id: checklistSelected,
    };
    poster(outpack, fetchChecklistUsersURL).then((response) => {
      if (response.status === 200) {
        setChecklistUsers(response.users);
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  //USER ORIENTED API CALLS AND HANDLERS
  const handleUserDetailsStates = (state, e) => {
    switch (state) {
      case "first_name":
        setFirstName(e.target.value);
        break;
      case "last_name":
        setLastName(e.target.value);
        break;
      case "osm_name":
        setOSMname(e.target.value);
        break;
      case "city":
        setCity(e.target.value);
        break;
      case "country":
        setCountry(e.target.value);
        break;
      case "email":
        setEmail(e.target.value);
        break;
      case "pay_email":
        setPayEmail(e.target.value);
        break;
      case "response":
        setFirstName(e.first_name);
        setLastName(e.last_name);
        setFullName(e.full_name);
        setOSMname(e.osm_username);
        setCity(e.city);
        setCountry(e.country);
        setEmail(e.email);
        setPayEmail(e.payment_email);
        break;
      default:
        break;
    }
  };

  const fetchUserDetails = () => {
    let fetchUserDetailsURL = "user/fetch_user_details";
    fetcher(fetchUserDetailsURL).then((response) => {
      if (response.status === 200) {
        handleUserDetailsStates("response", response);
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const updateUserDetails = () => {
    let outpack = {
      first_name: firstName,
      last_name: lastName,
      osm_username: OSMname,
      city: city,
      country: country,
      email: email,
      payment_email: payEmail,
    };
    let updateUserDetailsURL = "user/update_user_details";
    poster(outpack, updateUserDetailsURL).then((response) => {
      if (response.status === 200) {
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const firstLoginUpdate = (
    osm_username,
    payment_email,
    country,
    city,
    terms_agreement
  ) => {
    let outpack = {
      osm_username: osm_username,
      payment_email: payment_email,
      country: country,
      city: city,
      terms_agreement: terms_agreement,
    };
    let firstLoginURL = "user/first_login_update";
    poster(outpack, firstLoginURL).then((response) => {
      if (response.status === 200) {
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const fetchOrgUsers = () => {
    let fetchUsersURL = "user/fetch_users";
    fetcher(fetchUsersURL).then((response) => {
      if (response.status === 200) {
        setOrgUsers(response.users);
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const fetchProjectUsers = (project_id) => {
    let fetchProjectUsersURL = "user/fetch_project_users";
    let outpack = {
      project_id: project_id,
    };
    poster(outpack, fetchProjectUsersURL).then((response) => {
      if (response.status === 200) {
        setProjectUsers(response.users);
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const modifyUser = (id, role) => {
    let modifyUsersURL = "user/modify_users";
    let outpack = {
      user_id: id,
      role: role,
    };
    poster(outpack, modifyUsersURL).then((response) => {
      if (response.status === 200) {
        fetchOrgUsers();
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const resetUserStats = () => {
    let resetUsersURL = "user/reset_test_user_stats";
    fetcher(resetUsersURL).then((response) => {
      if (response.status === 200) {
        fetchOrgUsers();
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const removeUser = (id) => {
    let removeUsersURL = "user/remove_users";
    let outpack = {
      user_id: id,
    };
    poster(outpack, removeUsersURL).then((response) => {
      if (response.status === 200) {
        fetchOrgUsers();
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const inviteUser = (email, app) => {
    let inviteUserURL = "user/invite_user";
    let outpack = {
      email: email,
      app: app,
    };
    poster(outpack, inviteUserURL).then((response) => {
      if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const userJoinProject = (project_id) => {
    let assignUserURL = "project/user_join_project";
    let outpack = {
      project_id: project_id,
    };
    poster(outpack, assignUserURL).then((response) => {
      if (response.status === 200) {
        alert(response.message);
        fetchUserProjects();
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const userLeaveProject = (project_id) => {
    let unassignUserURL = "project/user_leave_project";
    let outpack = {
      project_id: project_id,
    };
    poster(outpack, unassignUserURL).then((response) => {
      if (response.status === 200) {
        alert(response.message);
        fetchUserProjects();
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const assignUserProject = (project_id, user_id) => {
    let assignUserURL = "project/assign_user_project";
    let outpack = {
      project_id: project_id,
      user_id: user_id,
    };
    poster(outpack, assignUserURL).then((response) => {
      if (response.status === 200) {
        alert(response.message);
        fetchProjectUsers(project_id);
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const unassignUserProject = (project_id, user_id) => {
    let unassignUserURL = "project/unassign_user_project";
    let outpack = {
      project_id: project_id,
      user_id: user_id,
    };
    poster(outpack, unassignUserURL).then((response) => {
      if (response.status === 200) {
        alert(response.message);
        fetchProjectUsers(project_id);
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };
  //PROJECT ORIENTED API CALLS AND HANDLERS

  const createProject = (
    url,
    rate_type,
    mapping_rate,
    validation_rate,
    max_editors,
    max_validators,
    visibility
  ) => {
    let createProjectURL = "project/create_project";
    let outpack = {
      url: url,
      rate_type: rate_type,
      validation_rate: validation_rate,
      mapping_rate: mapping_rate,
      max_editors: max_editors,
      max_validators: max_validators,
      visibility: visibility,
    };
    poster(outpack, createProjectURL).then((response) => {
      if (response.status === 200) {
        alert("New Project Created");
        fetchOrgProjects();
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const deleteProject = (project_id) => {
    let deleteProjectURL = "project/delete_project";
    let outpack = {
      project_id: project_id,
    };
    poster(outpack, deleteProjectURL).then((response) => {
      if (response.status === 200) {
        alert(`Project ${project_id} has been deleted.`);
        fetchOrgProjects();
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const updateProject = (
    projectSelected,
    rateMethod,
    mappingRate,
    validaionRate,
    maxEditors,
    maxValidators,
    visibility,
    projectDifficulty,
    projectStatus
  ) => {
    let updateProjectURL = "project/update_project";
    let outpack = {
      project_id: projectSelected,
      rate_type: rateMethod,
      mapping_rate: mappingRate,
      validation_rate: validaionRate,
      max_editors: maxEditors,
      max_validators: maxValidators,
      visibility: visibility,
      difficulty: projectDifficulty,
      project_status: projectStatus,
    };
    poster(outpack, updateProjectURL).then((response) => {
      if (response.status === 200) {
        alert(`Project ${projectSelected} has been Updated.`);
        fetchOrgProjects();
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const calculateProjectBudget = (
    url,
    rate_type,
    mapping_rate,
    validation_rate,
    project_id = null
  ) => {
    let calculateProjectBudgetURL = "project/calculate_budget";
    let outpack = {
      url: url,
      rate_type: rate_type,
      validation_rate: validation_rate,
      mapping_rate: mapping_rate,
      project_id: project_id,
    };
    poster(outpack, calculateProjectBudgetURL).then((response) => {
      if (response.status === 200) {
        setOutputRate(response.calculation);
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const fetchOrgProjects = () => {
    let fetchProjectsURL = "project/fetch_org_projects";
    fetcher(fetchProjectsURL).then((response) => {
      if (response.status === 200) {
        setActiveProjects(response.org_active_projects);
        setInactiveProjects(response.org_inactive_projects);
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const fetchUserProjects = () => {
    let fetchUserURL = "project/fetch_user_projects";
    fetcher(fetchUserURL).then((response) => {
      if (response.status === 200) {
        setActiveProjects(response.org_active_projects);
        setInactiveProjects(response.org_inactive_projects);
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const fetchValidatorProjects = () => {
    let fetchUserURL = "project/fetch_validator_projects";
    fetcher(fetchUserURL).then((response) => {
      if (response.status === 200) {
        setActiveProjects(response.org_active_projects);
        setInactiveProjects(response.org_inactive_projects);
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };
  //Task oriented functions
  //Task oriented functions

  const checkUserStats = () => {
    let fetchUserURL = "project/TM4_payment_call";
    fetcher(fetchUserURL).then((response) => {
      if (response.status === 200) {
        // setActiveProjects(response.org_active_projects);
        // setInactiveProjects(response.org_inactive_projects);
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  // TRAINING FUNCTIONS

  const createTraining = (
    title,
    training_url,
    training_type,
    point_value,
    difficulty,
    question1,
    answer1,
    incorrect1_1,
    incorrect1_2,
    incorrect1_3,
    question2,
    answer2,
    incorrect2_1,
    incorrect2_2,
    incorrect2_3,
    question3,
    answer3,
    incorrect3_1,
    incorrect3_2,
    incorrect3_3
  ) => {
    let createTrainingURL = "training/create_training";
    let outpack = {
      title: title,
      question1: question1,
      question2: question2,
      question3: question3,
      answer1: answer1,
      answer2: answer2,
      answer3: answer3,
      incorrect1_1: incorrect1_1,
      incorrect1_2: incorrect1_2,
      incorrect1_3: incorrect1_3,
      incorrect2_1: incorrect2_1,
      incorrect2_2: incorrect2_2,
      incorrect2_3: incorrect2_3,
      incorrect3_1: incorrect3_1,
      incorrect3_2: incorrect3_2,
      incorrect3_3: incorrect3_3,
      point_value: point_value,
      difficulty: difficulty,
      training_url: training_url,
      training_type: training_type,
    };
    poster(outpack, createTrainingURL).then((response) => {
      if (response.status === 200) {
        fetchOrgTrainings();
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const modifyTraining = (
    training_id,
    title,
    training_url,
    training_type,
    point_value,
    difficulty,
    question1,
    answer1,
    incorrect1_1,
    incorrect1_2,
    incorrect1_3,
    question2,
    answer2,
    incorrect2_1,
    incorrect2_2,
    incorrect2_3,
    question3,
    answer3,
    incorrect3_1,
    incorrect3_2,
    incorrect3_3
  ) => {
    let modifyTrainingURL = "training/modify_training";
    let outpack = {
      training_id: training_id,
      title: title,
      question1: question1,
      question2: question2,
      question3: question3,
      answer1: answer1,
      answer2: answer2,
      answer3: answer3,
      incorrect1_1: incorrect1_1,
      incorrect1_2: incorrect1_2,
      incorrect1_3: incorrect1_3,
      incorrect2_1: incorrect2_1,
      incorrect2_2: incorrect2_2,
      incorrect2_3: incorrect2_3,
      incorrect3_1: incorrect3_1,
      incorrect3_2: incorrect3_2,
      incorrect3_3: incorrect3_3,
      point_value: point_value,
      difficulty: difficulty,
      training_url: training_url,
      training_type: training_type,
    };
    poster(outpack, modifyTrainingURL).then((response) => {
      if (response.status === 200) {
        fetchOrgTrainings();
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const fetchOrgTrainings = () => {
    let fetchTrainingsURL = "training/fetch_org_trainings";
    fetcher(fetchTrainingsURL).then((response) => {
      if (response.status === 200) {
        setOrgMappingTrainings(response.org_mapping_trainings);
        setOrgValidationTrainings(response.org_validation_trainings);
        setOrgProjectTrainings(response.org_project_trainings);
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const fetchUserTrainings = () => {
    let fetchTrainingsURL = "training/fetch_user_trainings";
    fetcher(fetchTrainingsURL).then((response) => {
      if (response.status === 200) {
        setOrgMappingTrainings(response.org_mapping_trainings);
        setOrgValidationTrainings(response.org_validation_trainings);
        setOrgProjectTrainings(response.org_project_trainings);
        setUserCompletedTrainings(response.user_completed_trainings);
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const deleteTraining = (training_id, training_title) => {
    let deleteTrainingURL = "training/delete_training";
    let outpack = {
      training_id: training_id,
    };
    poster(outpack, deleteTrainingURL).then((response) => {
      if (response.status === 200) {
        alert(`Training ${training_title} has been deleted.`);
        fetchOrgTrainings();
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };
  const completeTraining = (training_id, training_title) => {
    let completeTrainingURL = "training/complete_training";
    let outpack = {
      training_id: training_id,
    };
    poster(outpack, completeTrainingURL).then((response) => {
      if (response.status === 200) {
        fetchUserTrainings();
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };
  // TRANSACTION ORIENTED FUNCTIONS

  const fetchOrgTransactions = () => {
    let fetchTransactionsURL = "transaction/fetch_org_transactions";
    fetcher(fetchTransactionsURL).then((response) => {
      if (response.status === 200) {
        setOrgRequests(response.requests);
        setOrgPayments(response.payments);
        handleSetCSVdata(response.payments);
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const fetchUserTransactions = () => {
    let fetchUserTransactionsURL = "transaction/fetch_user_transactions";
    fetcher(fetchUserTransactionsURL).then((response) => {
      if (response.status === 200) {
        setOrgRequests(response.requests);
        setOrgPayments(response.payments);
        handleSetCSVdata(response.payments);
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const createTransaction = (user_id, amount, payment_email, task_ids) => {
    let createTransactionsURL = "transaction/create_transaction";
    let outpack = {
      user_id: user_id,
      amount: amount,
      task_ids: task_ids,
      transaction_type: "request",
    };
    poster(outpack, createTransactionsURL).then((response) => {
      if (response.status === 200) {
        fetchOrgTransactions();
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const deleteTransaction = (transaction_id, transaction_type) => {
    let deleteTransactionsURL = "transaction/delete_transaction";
    let outpack = {
      transaction_id: transaction_id,
      transaction_type: transaction_type,
    };
    poster(outpack, deleteTransactionsURL).then((response) => {
      if (response.status === 200) {
        fetchOrgTransactions();
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const processPayRequest = (
    request_id,
    user_id,
    request_amount,
    task_ids,
    payoneer_id,
    notes
  ) => {
    let processPayRequestURL = "transaction/process_payment_request";
    let outpack = {
      request_id,
      user_id,
      request_amount,
      task_ids,
      payoneer_id,
      notes,
    };
    poster(outpack, processPayRequestURL).then((response) => {
      if (response.status === 200) {
        alert(response.message);
        fetchOrgTransactions();
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const submitPayRequest = (notes) => {
    let submitPayRequestURL = "transaction/submit_payment_request";
    let outpack = {
      notes,
    };
    poster(outpack, submitPayRequestURL).then((response) => {
      if (response.status === 200) {
        alert(response.message);
        fetchUserTransactions();
        fetchUserPayable();
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const fetchUserPayable = (setter = null) => {
    let fetchUserPayableURL = "transaction/fetch_user_payable";
    fetcher(fetchUserPayableURL).then((response) => {
      if (response.status === 200) {
        if (setter) {
          setter(response.payable_total);
        }
        setChecklistsEarnings(response.checklist_earnings);
        setMappingEarnings(response.mapping_earnings);
        setValidationEarnings(response.validation_earnings);
        setTotalEarnings(response.payable_total);
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const fetchAdminDashStats = () => {
    let adminDashStats = "project/fetch_admin_dash_stats";
    fetcher(adminDashStats).then((response) => {
      if (response.status === 200) {
        handleAdminDashStates(response);
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const fetchExternalValidations = () => {
    let ExternalValidationsURL = "task/fetch_external_validations";
    fetcher(ExternalValidationsURL).then((response) => {
      if (response.status === 200) {
        setExternalValidations(response.external_validations);
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const updateTask = (taskID, taskAction) => {
    let outpack = {
      task_id: taskID,
      task_action: taskAction,
    };
    let updateTaskURL = "task/update_task";
    poster(outpack, updateTaskURL).then((response) => {
      if (response.status === 200) {
        fetchAdminDashStats();
        fetchExternalValidations();
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const fetchUserDashStats = () => {
    let userDashStats = "project/fetch_user_dash_stats";
    fetcher(userDashStats).then((response) => {
      if (response.status === 200) {
        handleAdminDashStates(response);
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const fetchValidatorDashStats = () => {
    let userDashStats = "project/fetch_validator_dash_stats";
    fetcher(userDashStats).then((response) => {
      if (response.status === 200) {
        handleAdminDashStates(response);
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const update_user_tasks = (project_id) => {
    let userTaskStatsURL = "task/update_user_tasks";
    fetcher(userTaskStatsURL).then((response) => {
      if (response.status === 200) {
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const update_validator_tasks = (project_id) => {
    let userTaskStatsURL = "task/update_user_tasks";
    fetcher(userTaskStatsURL).then((response) => {
      if (response.status === 200) {
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const admin_update_all_user_tasks = (project_id) => {
    let userTaskStatsURL = "task/admin_update_all_user_tasks";
    fetcher(userTaskStatsURL).then((response) => {
      if (response.status === 200) {
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const spliceArray = (inlist, index) => {
    if (index > -1) {
      inlist.splice(index, 1);
    }
    return inlist;
  };

  const generateRandomKey = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const goToSource = (project_url) => {
    window.open(project_url, "_blank")?.focus();
  };

  const findObjectById = (array, id) => {
    return array.find((obj) => obj.id === id);
  };

  const isValidEmail = (email) => {
    // Regex pattern for validating email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Test if input matches the email regex pattern
    return emailRegex.test(email);
  };

  const shuffleArray = (array) => {
    const newArray = [...array];
    newArray.sort(() => Math.random() - 0.5);
    return newArray;
  };

  const handleSetCSVdata = (e) => {
    const csvData = [];
    if (Object.keys(e).length > 0) {
      const headers = Object.keys(e[0]);
      csvData.push(headers);
      e.forEach((item) => {
        const row = [];
        headers.forEach((header) => {
          row.push(item[header]);
        });
        csvData.push(row);
      });
      setCSVdata(csvData);
    }
  };

  const findIndexById = (list, id) => {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        return i;
      }
    }
    return -1;
  };

  const value = {
    //REFS
    history,
    //STATES
    userSelected,
    orgUsers,
    sidebarOpen,
    fetching,
    firstName,
    lastName,
    OSMname,
    city,
    country,
    email,
    payEmail,
    fullName,
    outputRate,
    projectUsers,
    activeProjects,
    inactiveProjects,
    completedProjects,
    tasksMapped,
    tasksValidated,
    tasksInvalidated,
    payableTotal,
    requestsTotal,
    paidTotal,
    projectSelectedDetails,
    orgPayments,
    orgRequests,
    CSVdata,
    orgProjects,
    activeProjectsCount,
    inactiveProjectsCount,
    orgMappingTrainings,
    orgValidationTrainings,
    orgProjectTrainings,
    userCompletedTrainings,
    mappingEarnings,
    validationEarnings,
    totalEarnings,
    validatorTasksInvalidated,
    validatorTasksValidated,
    //checklists
    orgActiveChecklists,
    orgInActiveChecklists,
    checklistSelectedDetails,
    userAvailableChecklists,
    userCompletedChecklists,
    userConfirmedChecklists,
    userStartedChecklists,
    orgUserCompletedChecklists,
    orgUserConfirmedChecklists,
    orgStaleChecklists,
    checklistsEarnings,
    confirmOpen,
    toggleConfirmOpen,
    confirmQuestion,
    confirmText,
    commentOpen,
    toggleCommentOpen,
    comment,
    checklistUsers,
    externalValidations,
    orgTrainings,
    //STATE SETTERS
    setValidatorTasksValidated,
    setValidatorTasksInvalidated,
    setActiveProjects,
    setActiveProjectsCount,
    setInactiveProjectsCount,
    setOrgProjects,
    setCSVdata,
    setOrgRequests,
    setOrgPayments,
    setProjectSelectedDetails,
    setProjectUsers,
    setFullName,
    setFirstName,
    setLastName,
    setOSMname,
    setCity,
    setCountry,
    setEmail,
    setPayEmail,
    setUserSelected,
    setFetching,
    //HANDLERS
    handleUserDetailsStates,
    handleSetSidebarState,
    handleOutputRate,
    //API CALLS:
    //user
    firstLoginUpdate,
    fetchOrgUsers,
    fetchUserDetails,
    updateUserDetails,
    inviteUser,
    removeUser,
    modifyUser,
    userJoinProject,
    userLeaveProject,
    assignUserProject,
    unassignUserProject,
    fetchUserProjects,
    fetchValidatorDashStats,
    //project
    fetchProjectUsers,
    fetchOrgProjects,
    deleteProject,
    calculateProjectBudget,
    createProject,
    updateProject,
    fetchAdminDashStats,
    fetchUserDashStats,
    fetchValidatorProjects,
    fetchExternalValidations,
    updateTask,
    //Transaction
    fetchOrgTransactions,
    createTransaction,
    deleteTransaction,
    processPayRequest,
    submitPayRequest,
    fetchUserPayable,
    fetchUserTransactions,
    update_user_tasks,
    update_validator_tasks,
    admin_update_all_user_tasks,
    //Training
    setOrgTrainings,
    fetchOrgTrainings,
    fetchUserTrainings,
    setOrgMappingTrainings,
    setOrgValidationTrainings,
    setOrgProjectTrainings,
    createTraining,
    deleteTraining,
    modifyTraining,
    completeTraining,
    setUserCompletedTrainings,
    //Task
    checkUserStats,
    //general functions
    generateRandomKey,
    findObjectById,
    goToSource,
    isValidEmail,
    shuffleArray,
    setMappingEarnings,
    setValidationEarnings,
    setTotalEarnings,
    resetUserStats,
    //checklists
    createChecklist,
    fetchAdminChecklists,
    fetchValidatorChecklists,
    setChecklistSelectedDetails,
    updateChecklist,
    setUserAvailableChecklists,
    setUserCompletedChecklists,
    setUserConfirmedChecklists,
    setUserStartedChecklists,
    fetchUserChecklists,
    startChecklist,
    completeListItem,
    confirmListItem,
    setorgUserCompletedChecklists,
    setorgUserConfirmedChecklists,
    deleteChecklist,
    updateListItems,
    setChecklistsEarnings,
    setConfirmQuestion,
    setConfirmText,
    addChecklistComment,
    setComment,
    deleteChecklistComment,
    deleteChecklistItem,
    spliceArray,
    setChecklistUsers,
    fetchChecklistUsers,
    assignUserChecklist,
    unassignUserChecklist,
    findIndexById,
    setExternalValidations,
    setOrgUsers,
  };

  return value ? (
    <DataContext.Provider value={value}>{children}</DataContext.Provider>
  ) : null;
};
