import React, { useState, useContext, useEffect } from "react";
import "./styles.css";

export const Accordions = ({ tabTitle }) => {
  const accordionDataMap = {
    "General FAQ": [
      {
        title: "General FAQ 1",
        content: `Answer`,
      },
      {
        title: "General FAQ 2",
        content: `Answer`,
      },
      {
        title: "General FAQ 3",
        content: `Answer`,
      },
      {
        title: "General FAQ 4",
        content: `Answer`,
      },
      {
        title: "General FAQ 5",
        content: `Answer`,
      },
      {
        title: "General FAQ 6",
        content: `Answer`,
      },
    ],

    "Dashboard Page": [
      {
        title: "Dashboard FAQ 1",
        content: `Answer`,
      },
      {
        title: "Dashboard FAQ 2",
        content: `Answer`,
      },
      {
        title: "Dashboard FAQ 3",
        content: `Answer`,
      },
      {
        title: "Dashboard FAQ 4",
        content: `Answer`,
      },
      {
        title: "Dashboard FAQ 5",
        content: `Answer`,
      },
      {
        title: "Dashboard FAQ 6",
        content: `Answer`,
      },
    ],

    "Checklists Page": [
      {
        title: "Checklist FAQ 1",
        content: `Answer`,
      },
      {
        title: "Checklist FAQ 2",
        content: `Answer`,
      },
      {
        title: "Checklist FAQ 3",
        content: `Answer`,
      },
      {
        title: "Checklist FAQ 4",
        content: `Answer`,
      },
      {
        title: "Checklist FAQ 5",
        content: `Answer`,
      },
      {
        title: "Checklist FAQ 6",
        content: `Answer`,
      },
    ],

    "Projects Page": [
      {
        title: "Projects FAQ 1",
        content: `Answer`,
      },
      {
        title: "Projects FAQ 2",
        content: `Answer`,
      },
      {
        title: "Projects FAQ 3",
        content: `Answer`,
      },
      {
        title: "Projects FAQ 4",
        content: `Answer`,
      },
      {
        title: "Projects FAQ 5",
        content: `Answer`,
      },
      {
        title: "Projects FAQ 6",
        content: `Answer`,
      },
    ],

    "Training Page": [
      {
        title: "Training FAQ 1",
        content: `Answer`,
      },
      {
        title: "Training FAQ 2",
        content: `Answer`,
      },
      {
        title: "Training FAQ 3",
        content: `Answer`,
      },
      {
        title: "Training FAQ 4",
        content: `Answer`,
      },
      {
        title: "Training FAQ 5",
        content: `Answer`,
      },
      {
        title: "Training FAQ 6",
        content: `Answer`,
      },
    ],

    "Account Page": [
      {
        title: "Account FAQ 1",
        content: `Answer`,
      },
      {
        title: "Account FAQ 2",
        content: `Answer`,
      },
      {
        title: "Account FAQ 3",
        content: `Answer`,
      },
      {
        title: "Account FAQ 4",
        content: `Answer`,
      },
      {
        title: "Account FAQ 5",
        content: `Answer`,
      },
      {
        title: "Account FAQ 6",
        content: `Answer`,
      },
    ],
  };

  const accordionData = accordionDataMap[tabTitle] || [];

  const Accordion = ({ title, content }) => {
    const [isActive, setIsActive] = useState(false);

    const handleToggleAccordion = () => {
      setIsActive(!isActive);
    };

    return (
      <div className="accordion-item">
        <div
          className={`accordion-title ${isActive ? "active" : ""}`}
          onClick={handleToggleAccordion}
        >
          <div>{title}</div>
          <div>{isActive ? "-" : "+"}</div>
        </div>
        {isActive && <div className="accordion-content">{content}</div>}
      </div>
    );
  };

  return (
    <div className="accordion">
      {accordionData.map(({ title, content }, index) => (
        <Accordion key={index} title={title} content={content} />
      ))}
    </div>
  );
};
