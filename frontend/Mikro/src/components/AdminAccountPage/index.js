import React, { useContext, useEffect } from "react";
import { DataContext } from "common/DataContext";
import { AuthContext } from "common/AuthContext";
import { Divider } from "@mui/material";
import useToggle from "../../hooks/useToggle.js";
import Sidebar from "../sidebar/sidebar";
import {
  TableCard,
  CardMediaStyle,
  SectionTitle,
  StyledButton,
  ConfirmModalCommon,
} from "components/commonComponents/commonComponents";
import "./styles.css";

export const AdminAccountPage = () => {
  const {
    firstName,
    lastName,
    OSMname,
    city,
    country,
    email,
    payEmail,
    sidebarOpen,
    fetchUserDetails,
    updateUserDetails,
    handleUserDetailsStates,
    handleSetSidebarState,
    history,
  } = useContext(DataContext);

  const { refresh, user } = useContext(AuthContext);
  const [modalOpen, toggleModalOpen] = useToggle(false);

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
    fetchUserDetails();
    // eslint-disable-next-line
  }, []);

  const handleViewSidebar = () => {
    handleSetSidebarState();
  };

  const handleModalOpen = () => {
    toggleModalOpen();
  };

  const handleConfirmUpdateUserDetails = () => {
    handleModalOpen();
  };

  const handleUpdateUserDetails = () => {
    updateUserDetails();
    handleModalOpen();
  };

  return (
    <>
      <ConfirmModalCommon
        modal_open={modalOpen}
        handleOpenCloseModal={handleModalOpen}
        interrogative={"Are you sure you want to update these details?"}
        button_1_text="Confirm"
        button_1_action={handleUpdateUserDetails}
        button_2_text="Cancel"
        button_2_action={handleModalOpen}
      />
      <div 
        style={{ 
          width: "90%", 
          float: "left" 
          }}
        >
        <Sidebar isOpen={sidebarOpen} toggleSidebar={handleViewSidebar} />
        <div
          style={{
            display: "flex",
            position: "relative",
            left: "5vw",
            flexDirection: "column",
            height: "100vh",
          }}
        >
          <div
            style={{ 
              display: "flex", 
              marginLeft: "5vh", 
              flexDirection: "row" 
            }}
          >
            <h1
              style={{
                marginLeft: ".5vw",
                marginTop: "1vw",
                paddingBottom: "2vh",
              }}
            >
              <strong>Account:</strong>
            </h1>
            <div
              style={{
                marginTop: "2vw",
                position: "relative",
                top: "2vh",
                left: "65.7vw",
              }}
            >
              <StyledButton
                button_text={"submit"}
                button_action={handleConfirmUpdateUserDetails}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              marginLeft: "3vw",
              marginTop: "1vw",
              height: "50%",
              width: "79vw",
            }}
          >
            <TableCard 
              style={{ 
                boxShadow: "1px 1px 6px 2px gray" 
              }}
            >
              <CardMediaStyle />

              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  height: "15vh",
                  marginTop: "0vh",
                  marginBottom: "0vh",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <SectionTitle title_text={"First Name:"} bold={true} />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => handleUserDetailsStates("first_name", e)}
                    style={{ height: "5vh", marginRight: "2vw", width: "13vw" }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <SectionTitle title_text={"Last Name:"} bold={true} />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => handleUserDetailsStates("last_name", e)}
                    style={{ height: "5vh", marginRight: "2vw", width: "13vw" }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <SectionTitle title_text={"OSM Username:"} bold={true} />
                  <input
                    type="text"
                    value={OSMname}
                    onChange={(e) => handleUserDetailsStates("osm_name", e)}
                    style={{ height: "5vh", marginRight: "2vw", width: "13vw" }}
                  />
                </div>
              </div>

              <div
                style={{
                  width: "100%",
                  backgroundColor: "black",
                  height: ".05vh",
                }}
              />

              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  height: "15vh",
                  marginTop: "0vh",
                  marginBottom: "0vh",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <SectionTitle title_text={"City:"} bold={true} />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => handleUserDetailsStates("city", e)}
                    style={{ 
                      height: "5vh", 
                      marginRight: "5vw", 
                      width: "15vw" 
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <SectionTitle title_text={"Country:"} bold={true} />
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => handleUserDetailsStates("country", e)}
                    style={{ 
                      height: "5vh", 
                      marginRight: "5vw", 
                      width: "15vw" 
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  width: "100%",
                  backgroundColor: "black",
                  height: ".05vh",
                }}
              />

              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  height: "15vh",
                  justifyContent: "center",
                  marginTop: "0vh",
                  marginBottom: "0vh",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <SectionTitle title_text={"Personal Email:"} bold={true} />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => handleUserDetailsStates("email", e)}
                    style={{ 
                      height: "5vh", 
                      marginRight: "5vw", 
                      width: "20vw" 
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <SectionTitle title_text={"Payment Email:"} bold={true} />
                  <input
                    type="text"
                    value={payEmail}
                    onChange={(e) => handleUserDetailsStates("pay_email", e)}
                    style={{ 
                      height: "5vh", 
                      marginRight: "5vw", 
                      width: "20vw" 
                    }}
                  />
                </div>
              </div>
            </TableCard>
          </div>
        </div>
      </div>
    </>
  );
};
