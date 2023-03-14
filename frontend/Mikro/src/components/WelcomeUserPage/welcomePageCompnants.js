import React, { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import { Modal, Divider, Table, TableBody, Card, Grid } from "@mui/material";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import {
  CancelButton,
  CloseButton,
  ConfirmButton,
  SectionTitle,
  SectionSubtitle,
  ModalWrapper,
  StyledButton,
  ASSIGN_USERS_TABLE_HEADERS,
  ProjectRow,
  ProjectCell,
  TableCard,
  ListHead,
} from "../commonComponents/commonComponents";

// DELETE PROJECT MODAL //
export const FirstLoginModal = (props) => {
  return (
    <Modal open={props.modalOpen} key="firstLogin">
      <ModalWrapper>
        <CloseButton close_action={props.handleModalOpen} />

        {props.modalPage === 1 ? (
          <>
            <SectionTitle title_text={"Step 1: OSM Username"} />
            <Divider />
            <SectionSubtitle
              subtitle_text={
                "Mikro needs your OSM username to track your task completion."
              }
            />
            <SectionSubtitle
              subtitle_text={
                'Please enter your username below and press "ok" to proceed'
              }
            />
            <Divider />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "1vh",
                marginBottom: "2vh",
              }}
            >
              <input
                type="text"
                value={props.OSMusername}
                placeholder="OSM username"
                onChange={(e) => props.handleSetOSMusername(e)}
                style={{
                  height: "5vh",
                  width: "80%",
                  marginRight: "1.25vw",
                  marginBottom: "2vh",
                }}
              />
              <StyledButton
                button_text={"ok"}
                button_action={() => props.handleSetModalPage(2)}
              />
            </div>
          </>
        ) : props.modalPage === 2 ? (
          <>
            <SectionTitle title_text={"Step 2: Payment Email"} />
            <Divider />
            <SectionSubtitle
              subtitle_text={
                "Mikro needs your Payoneer email address in order to make payments."
              }
            />
            <SectionSubtitle
              subtitle_text={
                'Please enter your Payoneer email below and press "ok" to proceed'
              }
            />
            <Divider />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "1vh",
                marginBottom: "2vh",
              }}
            >
              <input
                type="text"
                value={props.payoneerEmail}
                placeholder="Payoneer Email"
                onChange={(e) => props.handleSetPayoneerEmail(e)}
                style={{
                  height: "5vh",
                  width: "80%",
                  marginRight: "1.25vw",
                  marginBottom: "2vh",
                }}
              />
              <StyledButton
                button_text={"ok"}
                button_action={() => props.handleSetModalPage(3)}
              />
            </div>
          </>
        ) : props.modalPage === 3 ? (
          <>
            <SectionTitle title_text={"Step 3: Location"} />
            <Divider />
            <SectionSubtitle
              subtitle_text={
                "Mikro needs to know your area of residence to be in compliance with payment regulations."
              }
            />
            <SectionSubtitle
              subtitle_text={
                'Please enter your Country and City of residence below and press "ok" to proceed'
              }
            />
            <Divider />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "1vh",
                marginBottom: "2vh",
              }}
            >
              <input
                type="text"
                value={props.country && props.country ? props.country : ""}
                placeholder="Country"
                onChange={(e) => props.handleSetCountry(e)}
                style={{
                  height: "5vh",
                  width: "80%",
                  marginRight: "1.25vw",
                  marginBottom: "2vh",
                }}
              />
              <input
                type="text"
                value={props.city && props.city ? props.city : ""}
                placeholder="City"
                onChange={(e) => props.handleSetCity(e)}
                style={{
                  height: "5vh",
                  width: "80%",
                  marginRight: "1.25vw",
                  marginBottom: "2vh",
                }}
              />
              <StyledButton
                button_text={"ok"}
                button_action={() => props.handleSetModalPage(4)}
              />
            </div>
          </>
        ) : props.modalPage === 4 ? (
          <>
            <SectionTitle title_text={"Step 4: Terms of Service"} />
            <Divider />
            <SectionSubtitle
              subtitle_text={
                "Mikro has a few terms and conditions which need your approval."
              }
            />
            <SectionSubtitle
              subtitle_text={
                'Please read the terms and conditions. If you agree, press "ok" to proceed'
              }
            />
            <Divider />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                height: "30vh",
                backgroundColor: "white",
              }}
            >
              <div
                style={{
                  width: "90%",
                  height: "25vh",
                  backgroundColor: "AliceBlue",
                  overflowY: "scroll",
                }}
              >
                What is Lorem Ipsum?
                <br />
                <br />
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
                <br />
                <br />
                Lorem Ipsum has been the industry's standard dummy text ever
                since the 1500s, when an unknown printer took a galley of type
                and scrambled it to make a type specimen book.
                <br />
                <br />
                It has survived not only five centuries, but also the leap into
                electronic typesetting, remaining essentially unchanged.
                <br />
                <br />
                It was popularised in the 1960s with the release of Letraset
                sheets containing Lorem Ipsum passages, and more recently with
                desktop publishing software like Aldus PageMaker including
                versions of Lorem Ipsum. Why do we use it? It is a long
                established fact that a reader will be distracted by the
                readable content of a page when looking at its layout. The point
                of using Lorem Ipsum is that it has a more-or-less normal
                distribution of letters, as opposed to using 'Content here,
                content here', making it look like readable English.
                <br />
                <br />
                Many desktop publishing packages and web page editors now use
                Lorem Ipsum as their default model text, and a search for 'lorem
                ipsum' will uncover many web sites still in their infancy.
                <br />
                <br />
                Various versions have evolved over the years, sometimes by
                accident, sometimes on purpose (injected humour and the like).
                <br />
                <br />
                Where does it come from?
                <br />
                <br />
                Contrary to popular belief, Lorem Ipsum is not simply random
                text.
                <br />
                <br />
                It has roots in a piece of classical Latin literature from 45
                BC, making it over 2000 years old.
                <br />
                <br />
                Richard McClintock, a Latin professor at Hampden-Sydney College
                in Virginia, looked up one of the more obscure Latin words,
                consectetur, from a Lorem Ipsum passage, and going through the
                cites of the word in classical literature, discovered the
                undoubtable source.
                <br />
                <br />
                Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de
                Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by
                Cicero, written in 45 BC.
                <br />
                <br />
                This book is a treatise on the theory of ethics, very popular
                during the Renaissance.
                <br />
                <br />
                The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..",
                comes from a line in section 1.10.32.
                <br />
                <br />
                The standard chunk of Lorem Ipsum used since the 1500s is
                reproduced below for those interested.
                <br />
                <br />
                Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et
                Malorum" by Cicero are also reproduced in their exact original
                form, accompanied by English versions from the 1914 translation
                by H. Rackham.
                <br />
                <br />
                Where can I get some?
                <br />
                <br />
                There are many variations of passages of Lorem Ipsum available,
                but the majority have suffered alteration in some form, by
                injected humour, or randomised words which don't look even
                slightly believable.
                <br />
                <br />
                If you are going to use a passage of Lorem Ipsum, you need to be
                sure there isn't anything embarrassing hidden in the middle of
                text.
                <br />
                <br />
                All the Lorem Ipsum generators on the Internet tend to repeat
                predefined chunks as necessary, making this the first true
                generator on the Internet.
                <br />
                <br />
                It uses a dictionary of over 200 Latin words, combined with a
                handful of model sentence structures, to generate Lorem Ipsum
                which looks reasonable.
                <br />
                <br />
                The generated Lorem Ipsum is therefore always free from
                repetition, injected humour, or non-characteristic words etc.
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  marginTop: "1vh",
                }}
              >
                <SectionSubtitle subtitle_text="I agree to the terms and conditions" />
                <input
                  type="checkbox"
                  value="public"
                  name="public"
                  onChange={() => props.handleSetTermsAgreement()}
                  checked={props.termsAgreement === true}
                />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                marginTop: "1vh",
                marginBottom: "2vh",
              }}
            >
              <StyledButton
                button_text={"cancel"}
                button_action={() => props.handleModalOpen()}
              />
              <StyledButton
                button_text={"ok"}
                button_action={() => props.handleSetModalPage(5)}
              />
            </div>
          </>
        ) : (
          <>
            <SectionTitle title_text={"Step 4: Start Mapping!"} />
            <Divider />
            <SectionSubtitle
              subtitle_text={"Registration with Mikro is complete."}
            />
            <SectionSubtitle
              subtitle_text={
                "Press the button below to proceed to your user dashboard and start making money!"
              }
            />
            <Divider />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "1vh",
                marginBottom: "2vh",
              }}
            >
              <StyledButton
                button_text={"ok"}
                button_action={() => props.handleSetModalPage(0)}
              />
            </div>
          </>
        )}
      </ModalWrapper>
    </Modal>
  );
};
