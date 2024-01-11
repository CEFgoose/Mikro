import React, { useContext, useEffect } from "react";
import { DataContext } from "common/DataContext";
import { AuthContext } from "common/AuthContext";
import useToggle from "../../hooks/useToggle.js";
import {
  TableCard,
  CardMediaStyle,
  SectionTitle,
  StyledButton,
  ConfirmModalCommon,
  InputWithLabel,
} from "components/commonComponents/commonComponents";
import "../../App.css";

export const UserAccountPage = () => {
  const {
    firstName,
    lastName,
    OSMname,
    city,
    country,
    email,
    payEmail,
    fetchUserDetails,
    updateUserDetails,
    handleUserDetailsStates,
    history,
  } = useContext(DataContext);

  const { refresh, user } = useContext(AuthContext);
  const [modalOpen, toggleModalOpen] = useToggle(false);

  useEffect(() => {
    if (user) {
      refresh();
    }
    if (user === null || (user.role !== "user" && user.role !== "validator")) {
      history("/login");
    }
    fetchUserDetails();
    // eslint-disable-next-line
  }, []);

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

      <TableCard>
        <CardMediaStyle />

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <InputWithLabel
            label="First Name:"
            type="text"
            value={firstName}
            onChange={(e) => handleUserDetailsStates("first_name", e)}
          />
          <InputWithLabel
            label="Last Name:"
            type="text"
            value={lastName}
            onChange={(e) => handleUserDetailsStates("last_name", e)}
          />
          <InputWithLabel
            label="OSM Username:"
            type="text"
            value={OSMname}
            onChange={(e) => handleUserDetailsStates("osm_name", e)}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <InputWithLabel
            label="City:"
            type="text"
            value={city}
            onChange={(e) => handleUserDetailsStates("city", e)}
          />
          <InputWithLabel
            label="Country:"
            type="text"
            value={country}
            onChange={(e) => handleUserDetailsStates("country", e)}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <InputWithLabel
            label="Email:"
            type="text"
            value={email}
            onChange={(e) => handleUserDetailsStates("email", e)}
          />
          <InputWithLabel
            label="Payment Email:"
            type="text"
            value={payEmail}
            onChange={(e) => handleUserDetailsStates("pay_email", e)}
          />
        </div>

        <StyledButton
          button_text={"submit"}
          button_action={handleConfirmUpdateUserDetails}
        />
      </TableCard>
    </>
  );
};
