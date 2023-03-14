// IMPORTS
import React, { useEffect, useContext } from "react";
import { DataProvider } from "common/DataContext";
import { InteractionProvider } from "common/InteractionContext";
import { PrivateRoute } from "common/PrivateRoute";
import { AuthContext } from "common/AuthContext";
import { Login } from "components/Login";
import { AdminDash } from "components/AdminDash";
import { PageNotFound } from "components/PageNotFound";
// import { NotificationCenter } from "components/NotificationCenter";
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
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { RegisterUser } from "components/RegisterUser";

// APP DECLARATION
function App() {
  const { refresh, user } = useContext(AuthContext);

  //INITIAL USE EFFECT
  useEffect(() => {
    //JWT REFRESH INTERVAL SETUP
    // if (user) refresh();
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
            <Switch>
              <Route exact={true} path="/">
                <LandingPage />
              </Route>

              <Route path="/login">
                <Login />
              </Route>

              <Route path="/welcome">
                <WelcomeUserPage />
              </Route>

              <PrivateRoute path="/dashboard">
                <UserDashboard />
              </PrivateRoute>

              <PrivateRoute path="/admindash" admin>
                <AdminDash />
              </PrivateRoute>

              <PrivateRoute path="/AdminProjectsPage" admin>
                <AdminProjectsPage />
              </PrivateRoute>

              <PrivateRoute path="/UserProjectsPage">
                <UserProjectsPage />
              </PrivateRoute>

              <PrivateRoute path="/AdminUsersPage" admin>
                <AdminUsersPage />
              </PrivateRoute>

              <PrivateRoute path="/AdminPaymentsPage" admin>
                <AdminPaymentsPage />
              </PrivateRoute>

              <PrivateRoute path="/UserPaymentsPage">
                <UserPaymentsPage />
              </PrivateRoute>

              <PrivateRoute path="/AdminAccountPage" admin>
                <AdminAccountPage />
              </PrivateRoute>

              <PrivateRoute path="/UserAccountPage">
                <UserAccountPage />
              </PrivateRoute>

              <Route path="/registerUser">
                <RegisterUser />
              </Route>

              <Route exact={true} path="/hotkeys" component={HotkeysTable} />

              <Route component={PageNotFound} />
            </Switch>
          </DataProvider>
        </InteractionProvider>
      </Router>
    </>
  );
}

export default App;
