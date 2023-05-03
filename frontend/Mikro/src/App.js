import React, { useEffect, useContext } from "react";
import { DataProvider } from "common/DataContext";
import { InteractionProvider } from "common/InteractionContext";
import { AuthContext } from "common/AuthContext";
import { Login } from "components/Login";
import { AdminDash } from "components/AdminDash";
import { PageNotFound } from "components/PageNotFound";
import { HotkeysTable } from "components/Hotkeys";
import { LandingPage } from "components/landingPage/LandingPage";
import { AdminProjectsPage } from "components/AdminProjectsPage";
import { AdminUsersPage } from "components/AdminUsersPage";
import { AdminPaymentsPage } from "components/AdminPaymentsPage";
import { AdminAccountPage } from "components/AdminAccountPage";
import { UserDashboard } from "components/UserDashboard";
import { UserProjectsPage } from "components/UserProjectPage";
import { UserAccountPage } from "components/UserAccountPage";
import { UserPaymentsPage } from "components/UserPaymentsPage";
import { WelcomeUserPage } from "components/WelcomeUserPage";
import { UserTrainingPage } from "components/UserTrainingPage";
import { AdminTrainingPage } from "components/AdminTrainingPage";
import { ValidatorDashboard } from "components/ValidatorDashboard";
import { ValidatorPaymentsPage } from "components/ValidatorPaymentsPage";
import { ValidatorProjectsPage } from "components/ValidatorProjectPage";
import { AdminChecklistsPage } from "components/AdminChecklistsPage";
import { UserChecklistsPage } from "components/UserChecklistsPage";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { RegisterUser } from "components/RegisterUser";

// APP DECLARATION
function App() {
  const { refresh, user } = useContext(AuthContext);

  const Private = ({ Component }) => {
    const auth = user.role === "admin" || user.role === "validator";
    return auth ? <Component /> : <Navigate to="/login" />;
  };

  //INITIAL USE EFFECT
  useEffect(() => {
    //JWT REFRESH INTERVAL SETUP
    if (user) refresh();
    const interval = setInterval(() => {
      refresh();
    }, 1170000);
    return () => clearInterval(interval);
    //eslint-disable-next-line
  }, []);

  // COMPONENT RENDER - APP PAGE ROUTER
  return (
    <>
      <Router>
        <InteractionProvider>
          <DataProvider>
            <Routes>
              <Route path="/" exact={true} element={<LandingPage />} />

              <Route path="/login" element={<Login />} />

              <Route path="/welcome" element={<WelcomeUserPage />} />

              {/* DASHBOARDS */}

              <Route path="/dashboard" element={<UserDashboard />} />

              <Route
                path="/validatordash"
                element={<Private Component={ValidatorDashboard} />}
              />

              <Route
                path="/admindash"
                element={<Private Component={AdminDash} />}
              />

              {/* CHECKLISTS PAGES */}

              <Route
                path="/AdminChecklistsPage"
                element={<Private Component={AdminChecklistsPage} />}
              />

              <Route
                path="/UserChecklistsPage"
                element={<UserChecklistsPage/>}
              />
              {/* <Route
                path="/validatorProjectsPage"
                element={<Private Component={ValidatorProjectsPage} />}
              />

              <Route path="/UserProjectsPage" element={<UserProjectsPage />} />
 */}

              {/* PROJECTS PAGES */}
              <Route
                path="/AdminProjectsPage"
                element={<Private Component={AdminProjectsPage} />}
              />

              <Route
                path="/validatorProjectsPage"
                element={<Private Component={ValidatorProjectsPage} />}
              />

              <Route path="/UserProjectsPage" element={<UserProjectsPage />} />

              <Route
                path="/AdminUsersPage"
                element={<Private Component={AdminUsersPage} />}
              />

              <Route
                path="/AdminPaymentsPage"
                element={<Private Component={AdminPaymentsPage} />}
              />

              <Route
                path="/ValidatorPaymentsPage"
                element={<Private Component={ValidatorPaymentsPage} />}
              />

              <Route
                path="/AdminTrainingPage"
                element={<Private Component={AdminTrainingPage} />}
              />

              <Route
                path="/AdminAccountPage"
                element={<Private Component={AdminAccountPage} />}
              />

              <Route path="/UserPaymentsPage" element={<UserPaymentsPage />} />

              <Route path="/UserTrainingPage" element={<UserTrainingPage />} />

              <Route path="/UserAccountPage" element={<UserAccountPage />} />

              <Route path="/registerUser" element={<RegisterUser />} />

              <Route path="/hotkeys" element={HotkeysTable} />

              <Route element={PageNotFound} />
            </Routes>
          </DataProvider>
        </InteractionProvider>
      </Router>
    </>
  );
}

export default App;
