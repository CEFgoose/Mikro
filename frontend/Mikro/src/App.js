import React, { useEffect, useContext } from "react";
import { DataProvider } from "common/DataContext";
import { InteractionProvider } from "common/InteractionContext";
import { AuthContext } from "common/AuthContext";
import { Login } from "components/Login";
import { AdminDash } from "components/AdminDash";
import { PageNotFound } from "components/PageNotFound";
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
import { AdminChecklistsPage } from "components/AdminChecklistsPage";
import { UserChecklistsPage } from "components/UserChecklistsPage";
import { ValidatorChecklistsPage } from "components/ValdatorChecklistsPage";
import { AdminTasksPage } from "components/AdminTasksPage";
import { FAQPage } from "components/FAQ";

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { RegisterUser } from "components/RegisterUser";
import { Root } from "root";

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

  // const googleTranslateElementInit = () => {
  //   new window.google.translate.TranslateElement(
  //     {
  //       pageLanguage: "en",
  //       autoDisplay: false,
  //     },
  //     "google_translate_element"
  //   );
  // };

  // useEffect(() => {
  //   var addScript = document.createElement("script");
  //   addScript.setAttribute(
  //     "src",
  //     "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
  //   );
  //   document.body.appendChild(addScript);
  //   window.googleTranslateElementInit = googleTranslateElementInit;
  // }, []);

  // useEffect(() => {
  //   const injectScript = document.createElement('script');
  //   injectScript.src = "https://cdn.botpress.cloud/webchat/v0/inject.js";

  //   const configScript = document.createElement('script');
  //   configScript.src = "https://mediafiles.botpress.cloud/b5e5cfc0-5667-4616-a753-06d7b89006d5/webchat/config.js";
  //   configScript.defer = true;

  //   // const botStyleSheet = document.createElement('script');
  //   // styleScript.

  //   document.head.appendChild(injectScript);
  //   document.head.appendChild(configScript);

  //   return () => {
  //     document.head.removeChild(injectScript);
  //     document.head.removeChild(configScript);
  //   };
  // }, []);

  // // //BOTPRESS STUDIO CHATBOT
  // const injectLoaded = useScript("https://cdn.botpress.cloud/webchat/v0/inject.js");
  // useScript("https://mediafiles.botpress.cloud/b5e5cfc0-5667-4616-a753-06d7b89006d5/webchat/config.js", [injectLoaded]);

  // COMPONENT RENDER - APP PAGE ROUTER
  return (
    <>
      <Router>
        <InteractionProvider>
          <DataProvider>
            <Routes>
              {/* Public Pages */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/welcome" element={<WelcomeUserPage />} />
              <Route path="/FAQPage" element={<FAQPage />} />

              {/* Admin Pages */}
              <Route path="/admindash" element={<Root />}>
                <Route index element={<Private Component={AdminDash} />} />
              </Route>
              <Route path="/AdminChecklistsPage" element={<Root />}>
                <Route
                  index
                  element={<Private Component={AdminChecklistsPage} />}
                />
              </Route>
              <Route path="/AdminProjectsPage" element={<Root />}>
                <Route
                  index
                  element={<Private Component={AdminProjectsPage} />}
                />
              </Route>
              <Route path="/AdminTasksPage" element={<Root />}>
                <Route index element={<Private Component={AdminTasksPage} />} />
              </Route>
              <Route path="/AdminUsersPage" element={<Root />}>
                <Route index element={<Private Component={AdminUsersPage} />} />
              </Route>
              <Route path="/AdminPaymentsPage" element={<Root />}>
                <Route
                  index
                  element={<Private Component={AdminPaymentsPage} />}
                />
              </Route>
              <Route path="/AdminTrainingPage" element={<Root />}>
                <Route
                  index
                  element={<Private Component={AdminTrainingPage} />}
                />
              </Route>
              <Route path="/AdminAccountPage" element={<Root />}>
                <Route
                  index
                  element={<Private Component={AdminAccountPage} />}
                />
              </Route>

              {/* Validator Pages */}
              <Route path="/validatordash" element={<Root />}>
                <Route
                  index
                  element={<Private Component={ValidatorDashboard} />}
                />
              </Route>
              <Route path="/validatorChecklistsPage" element={<Root />}>
                <Route
                  index
                  element={<Private Component={ValidatorChecklistsPage} />}
                />
              </Route>

              {/* User Pages */}
              <Route path="/dashboard" element={<Root />}>
                <Route index element={<UserDashboard />} />
              </Route>
              <Route path="/UserChecklistsPage" element={<Root />}>
                <Route index element={<UserChecklistsPage />} />
              </Route>
              <Route path="/UserProjectsPage" element={<Root />}>
                <Route index element={<UserProjectsPage />} />
              </Route>
              <Route path="/UserPaymentsPage" element={<Root />}>
                <Route index element={<UserPaymentsPage />} />
              </Route>
              <Route path="/UserTrainingPage" element={<Root />}>
                <Route index element={<UserTrainingPage />} />
              </Route>
              <Route path="/UserAccountPage" element={<Root />}>
                <Route index element={<UserAccountPage />} />
              </Route>

              {/* Other Routes */}
              <Route path="/registerUser" element={<RegisterUser />} />

              {/* 404 Page */}
              <Route element={PageNotFound} />
            </Routes>
          </DataProvider>
        </InteractionProvider>
      </Router>
    </>
  );
}

export default App;
