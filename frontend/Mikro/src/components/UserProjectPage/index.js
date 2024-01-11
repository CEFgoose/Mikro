import React, { useContext, useState, useEffect } from "react";
import { DataContext } from "common/DataContext";
import { AuthContext } from "../../common/AuthContext";
import "./styles.css";
import { ProjectCardGrid } from "components/commonComponents/commonComponents";
export const UserProjectsPage = () => {
  const {
    fetchUserProjects,
    userProjects,
    userJoinProject,
    goToSource,
    history,
  } = useContext(DataContext);

  const { refresh, user } = useContext(AuthContext);
  const [projectSelected, setProjectSelected] = useState(null);

  useEffect(() => {
    if (user) {
      refresh();
    }
    if (user === null) {
      history("/login");
    }
    if (user !== null) {
      if (user.role !== "user" && user.role !== "validator") {
        history("/login");
      }
    }
    fetchUserProjects();
    // eslint-disable-next-line
  }, []);

  const handleSetProjectSelected = (projectID) => {
    setProjectSelected(parseInt(projectID));
    handleUserJoinProject();
  };

  const handleUserJoinProject = () => {
    userJoinProject(projectSelected);
  };

  return (
    <>
      <ProjectCardGrid
        key={1}
        goToSource={goToSource}
        projects={userProjects}
        handleSetProjectSelected={handleSetProjectSelected}
        projectSelected={projectSelected}
      />
    </>
  );
};
