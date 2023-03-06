import { React } from "react";

// OLD HOTKEY SETUP - MAYBE NOT NEEDED NOW
function icon_card(icons) {
  let leaders = icons.leaders.map((i) => {
    return (
      <>
        <h5
          style={{
            padding: "5px",
            border: "1px solid grey",
            backgroundColor: "white",
            fontWeight: "bolder",
            display: "inline",
            marginRight: "0.25em",
            marginLeft: "0.25em",
          }}
        >
          {/^U\+[a-z0-9]+$/.test(i)
            ? String.fromCharCode("0x" + i.substring(2, i.length))
            : i}
        </h5>
        {"+"}
      </>
    );
  });

  let keys = icons.keys.map((i, index) => {
    return (
      <>
        <h5
          style={{
            padding: "5px",
            border: "1px solid grey",
            backgroundColor: "white",
            fontWeight: "bolder",
            display: "inline",
            marginRight: "0.25em",
            marginLeft: "0.25em",
          }}
        >
          {/^U\+[a-z0-9]+$/.test(i)
            ? String.fromCharCode("0x" + i.substring(2, i.length))
            : i}
        </h5>
        {index === icons.keys.length - 1 ? "" : "/"}
      </>
    );
  });
  return (
    <>
      {leaders} {keys}
    </>
  );
}

export const HotkeysTable = () => {
  let hotkey_info = [
    {
      icon: icon_card({ leaders: [], keys: ["q"] }),
      desc: "Action 1",
    },
    {
      icon: icon_card({ leaders: [], keys: ["e"] }),
      desc: "Action 2",
    },
    {
      icon: icon_card({ leaders: [], keys: ["SPACE"] }),
      desc: "Action 3",
    },
    {
      icon: icon_card({ leaders: [], keys: ["a", "U+2190"] }),
      desc: "Action 4",
    },
    {
      icon: icon_card({ leaders: [], keys: ["d", "U+2192"] }),
      desc: "Action 5",
    },
    {
      icon: icon_card({ leaders: ["SHIFT"], keys: ["a", "U+2190"] }),
      desc: "Action 6",
    },
    {
      icon: icon_card({ leaders: ["SHIFT"], keys: ["d", "U+2192"] }),
      desc: "Action 7",
    },
    {
      icon: icon_card({ leaders: ["U+02303", "SHIFT"], keys: ["a", "U+2190"] }),
      desc: "Action 8",
    },
    {
      icon: icon_card({ leaders: ["U+02303", "SHIFT"], keys: ["d", "U+2192"] }),
      desc: "Action 9",
    },
  ];

  return (
    <div
      style={{
        textAlign: "center",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        position: "absolute",
      }}
    >
      <h1>Hotkeys</h1>
      <table style={{ border: "2px solid grey" }}>
        {hotkey_info.map((i) => (
          <tr
            style={{
              borderBottom: "2px dotted grey",
            }}
          >
            <td
              style={{
                padding: "15px 15px",
                display: "inline-block",
                width: "100%",
              }}
            >
              {i.icon}
            </td>
            <td style={{ padding: "15px 15px", borderLeft: "2px dotted grey" }}>
              {i.desc}
            </td>
          </tr>
        ))}
      </table>
    </div>
  );
};
