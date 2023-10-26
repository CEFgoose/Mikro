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
import { ValidatorChecklistsPage } from "components/ValdatorChecklistsPage";
import { AdminTasksPage } from "components/AdminTasksPage";
import { FAQPage } from "components/FAQ";
import useScript from 'hooks/useScript';
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

  const googleTranslateElementInit = () => {
    new window.google.translate.TranslateElement(
      {
        pageLanguage: "en",
        autoDisplay: false,
      },
      "google_translate_element"
    );
  };

  useEffect(() => {
    var addScript = document.createElement("script");
    addScript.setAttribute(
      "src",
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
    );
    document.body.appendChild(addScript);
    window.googleTranslateElementInit = googleTranslateElementInit;
  }, []);


  useEffect(() => {
    const injectScript = document.createElement('script');
    injectScript.src = "https://cdn.botpress.cloud/webchat/v0/inject.js";

    const configScript = document.createElement('script');
    configScript.src = "https://mediafiles.botpress.cloud/b5e5cfc0-5667-4616-a753-06d7b89006d5/webchat/config.js";
    configScript.defer = true;

    // const botStyleSheet = document.createElement('script');
    // styleScript.

    document.head.appendChild(injectScript);
    document.head.appendChild(configScript);

    return () => {
      document.head.removeChild(injectScript);
      document.head.removeChild(configScript);
    };
  }, []);
  
  // //BOTPRESS STUDIO CHATBOT 
  const injectLoaded = useScript("https://cdn.botpress.cloud/webchat/v0/inject.js");
  useScript("https://mediafiles.botpress.cloud/b5e5cfc0-5667-4616-a753-06d7b89006d5/webchat/config.js", [injectLoaded]);

  // COMPONENT RENDER - APP PAGE ROUTER
  return (
    <>
      <div
        id="google_translate_element"
        style={{
          position: "fixed",
          right: "10vw",
          zIndex: "1",
        }}
      ></div>

      <Router>
        <InteractionProvider>
          <DataProvider>
            <Routes>
              <Route path="/" exact={true} element={<LandingPage />} />

              <Route path="/login" element={<Login />} />

              <Route path="/welcome" element={<WelcomeUserPage />} />

              <Route path="/FAQPage" element={<FAQPage />} />

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
                element={<UserChecklistsPage />}
              />

              <Route
                path="/validatorChecklistsPage"
                element={<Private Component={ValidatorChecklistsPage} />}
              />

              <Route path="/UserProjectsPage" element={<UserProjectsPage />} />

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
                path="/AdminTasksPage"
                element={<Private Component={AdminTasksPage} />}
              />

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
