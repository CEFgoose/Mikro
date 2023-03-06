import { useState, useCallback } from "react";
import {
  getQueryParameterValue,
  setQueryParameterValue,
} from "./queryParameter";
import AwesomeDebouncePromise from "awesome-debounce-promise";

export const useQueryString = (key, initialValue) => {
  const [value, setValue] = useState(
    getQueryParameterValue(key) || initialValue
  );
  const onSetValue = useCallback(
    (newValue) => {
      setValue(newValue);
      setQueryParameterValue(key, newValue);
    },
    [key]
  );
  const onSetValueDebounced = AwesomeDebouncePromise(onSetValue, 500);
  return [value, onSetValueDebounced];
};
