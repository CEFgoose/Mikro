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
  const [projectSelectedDetails, setProjectSelectedDetails] = useState(null);
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
  const [orgProjects, setorgProjects] = useState([]);
  const [orgMappingTrainings, setorgMappingTrainings] = useState([]);
  const [orgValidationTrainings, setorgValidationTrainings] = useState([]);
  const [orgProjectTrainings, setorgProjectTrainings] = useState([]);
  const [userCompletedTrainings, setUserCompletedTrainings] = useState([]);
  const [activeProjects, setActiveProjects] = useState(null);
  const [inactiveProjects, setInactiveProjects] = useState(null);
  const [activeProjectsCount, setActiveProjectsCount] = useState(null);
  const [inactiveProjectsCount, setInactiveProjectsCount] = useState(null);
  const [completedProjects, setCompletedProjects] = useState(null);
  const [tasksMapped, setTasksMapped] = useState(null);
  const [tasksValidated, setTasksValidated] = useState(null);
  const [tasksInvalidated, setTasksInvalidated] = useState(null);
  const [payableTotal, setPayableTotal] = useState(null);
  const [requestsTotal, setRequestsTotal] = useState(null);
  const [paidTotal, setPaidTotal] = useState(null);
  const [CSVdata, setCSVdata] = useState([]);

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
    setPayableTotal(e.payable_total > 0 ? e.payable_total : 0);
    setRequestsTotal(e.requests_total > 0 ? e.requests_total : 0);
    setPaidTotal(e.payouts_total > 0 ? e.payouts_total : 0);
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

  const inviteUser = (email) => {
    let inviteUserURL = "user/invite_user";
    let outpack = {
      email: email,
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

  const createProject = (url, rate_type, rate, max_editors, visibility) => {
    let createProjectURL = "project/create_project";
    let outpack = {
      url: url,
      rate_type: rate_type,
      rate: rate,
      max_editors: max_editors,
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
    rate,
    maxEditors,
    visibility,
    projectDifficulty,
    projectStatus
  ) => {
    let updateProjectURL = "project/update_project";
    let outpack = {
      project_id: projectSelected,
      rate_type: rateMethod,
      rate: rate,
      max_editors: maxEditors,
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

  const calculateProjectBudget = (url, rate_type, rate, project_id = null) => {
    let calculateProjectBudgetURL = "project/calculate_budget";
    let outpack = {
      url: url,
      rate_type: rate_type,
      rate: rate,
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
        setorgMappingTrainings(response.org_mapping_trainings);
        setorgValidationTrainings(response.org_validation_trainings);
        setorgProjectTrainings(response.org_project_trainings);
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
        setorgMappingTrainings(response.org_mapping_trainings);
        setorgValidationTrainings(response.org_validation_trainings);
        setorgProjectTrainings(response.org_project_trainings);
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
        return;
      } else if (response.status === 304) {
        history("/login");
      } else {
        alert(response.message);
      }
    });
  };

  const fetchUserPayable = (setter) => {
    let fetchUserPayableURL = "transaction/fetch_user_payable";
    fetcher(fetchUserPayableURL).then((response) => {
      if (response.status === 200) {
        setter(response.payable_total);
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
    //STATE SETTERS
    setActiveProjectsCount,
    setInactiveProjectsCount,
    setorgProjects,
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
    //project
    fetchProjectUsers,
    fetchOrgProjects,
    deleteProject,
    calculateProjectBudget,
    createProject,
    updateProject,
    fetchAdminDashStats,
    fetchUserDashStats,
    //Transaction
    fetchOrgTransactions,
    createTransaction,
    deleteTransaction,
    processPayRequest,
    submitPayRequest,
    fetchUserPayable,
    fetchUserTransactions,
    update_user_tasks,
    admin_update_all_user_tasks,
    //Training
    fetchOrgTrainings,
    fetchUserTrainings,
    setorgMappingTrainings,
    setorgValidationTrainings,
    setorgProjectTrainings,
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
  };

  return value ? (
    <DataContext.Provider value={value}>{children}</DataContext.Provider>
  ) : null;
};
