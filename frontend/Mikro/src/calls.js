import Cookie from "js-cookie";
import { API_URL } from "./components/constants";
var obj;

//--------------poster----------
export async function poster(info, route, concat = false) {
  const response = await fetch(API_URL.concat(route), {
    method: "POST",
    body: JSON.stringify(info),
    headers: {
      "Content-Type": "application/json",
      mode: "cors",
      "X-CSRF-TOKEN": `${Cookie.get("csrf_access_token")}`,
    },
  });
  if (response.ok) {
    obj = await response.json();
  } else if (!response.ok) {
    obj = { response: "error" };
  }
  return obj;
}
//--------------fetcher---------
export async function fetcher(route) {
  const response = await fetch(API_URL.concat(route), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      mode: "cors",
      "X-CSRF-TOKEN": `${Cookie.get("csrf_access_token")}`,
    },
  });
  if (response.ok) {
    obj = await response.json();
  } else if (!response.ok) {
    obj = { response: "Error" };
  }

  return obj;
}
