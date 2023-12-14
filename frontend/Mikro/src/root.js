import React, { useContext, useEffect, useState } from "react";
import Sidebar from "components/sidebar/sidebar";
import { Outlet } from "react-router-dom";

export const Root = () => {
  return (
    <>
      <div style={{ display: "flex", width: "100%", height: "1000%" }}>
        <Sidebar />

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            margin: "1.5vw",
          }}
        >
          <Outlet />
        </div>
      </div>
    </>
  );
};
