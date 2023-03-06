import qs from "query-string";
import AwesomeDebouncePromise from "awesome-debounce-promise";

// TODO: would be preferable to use the useLocation and useHistory hooks from
// react-router-dom instead but it works
/**
 * Set a query string without reload. Use the debounced method preferentially.
 */
const setQueryStringWithoutReloadReal = (qsValue) => {
  const newUrl =
    window.location.protocol +
    "//" +
    window.location.host +
    window.location.pathname +
    qsValue;

  window.history.pushState({ path: newUrl }, "", newUrl);
};

export const setQueryStringWithoutReload = AwesomeDebouncePromise(
  setQueryStringWithoutReloadReal,
  500
);

export const getQueryParameterValue = (
  key,
  queryString = window.location.search
) => {
  const values = qs.parse(queryString);
  return values[key];
};

/**
 * Set a query string. Use the debounced method preferentially.
 */
const setQueryParameterValueReal = (
  key,
  value,
  queryString = window.location.search
) => {
  const values = qs.parse(queryString);
  const newQsValue = qs.stringify({
    ...values,
    [key]: value,
  });
  setQueryStringWithoutReloadReal(`?${newQsValue}`);
};

export const setQueryParameterValue = AwesomeDebouncePromise(
  setQueryParameterValueReal,
  500,
  { key: (key, value, queryString) => key }
);
