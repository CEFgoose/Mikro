import React, { useState, useContext, useEffect } from "react";
import { DataContext } from "common/DataContext";
import Sidebar from "../sidebar/sidebar.js";
import "./styles.css";
import { Accordions } from "./faqComponents.js";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";

export const FAQPage = () => {
  const { sidebarOpen, handleSetSidebarState } = useContext(DataContext);

  const [activeTab, setActiveTab] = useState(1);

  const handleViewSidebar = () => {
    handleSetSidebarState();
  };

  const handleSetActiveTab = (tabIndex) => {
    setActiveTab(tabIndex);
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          height: "100%",
          float: "left",
        }}
      >
        <Sidebar isOpen={sidebarOpen} />
        <div style={{ width: "100%", height: "100%" }}>
          <div
            style={{
              display: "flex",
              position: "relative",
              marginLeft: ".5vw",
              flexDirection: "column",
              height: "100vh",
            }}
          >
            <h1
              style={{
                marginLeft: "3vw",
                marginTop: "1vw",
                paddingBottom: "2vh",
              }}
            >
              <strong>Frequently Asked Questions:</strong>
            </h1>

            <Tabs>
              <TabList
                style={{
                  marginLeft: "3vw",
                  marginTop: "0vh",
                  paddingTop: "0vh",
                }}
              >
                <Tab value={1} onClick={(e) => handleSetActiveTab(e)}>
                  General FAQ
                </Tab>
                <Tab value={2} onClick={(e) => handleSetActiveTab(e)}>
                  Dashboard Page
                </Tab>
                <Tab value={3} onClick={(e) => handleSetActiveTab(e)}>
                  Checklists Page
                </Tab>
                <Tab value={4} onClick={(e) => handleSetActiveTab(e)}>
                  Projects Page
                </Tab>
                <Tab value={5} onClick={(e) => handleSetActiveTab(e)}>
                  Training Page
                </Tab>
                <Tab value={6} onClick={(e) => handleSetActiveTab(e)}>
                  Account Page
                </Tab>
              </TabList>
              <TabPanel>
                <Accordions tabTitle="General FAQ" />
              </TabPanel>
              <TabPanel>
                <Accordions tabTitle="Dashboard Page" />
              </TabPanel>
              <TabPanel>
                <Accordions tabTitle="Checklists Page" />
              </TabPanel>
              <TabPanel>
                <Accordions tabTitle="Projects Page" />
              </TabPanel>
              <TabPanel>
                <Accordions tabTitle="Training Page" />
              </TabPanel>
              <TabPanel>
                <Accordions tabTitle="Account Page" />
              </TabPanel>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
};
