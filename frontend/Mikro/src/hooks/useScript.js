import { useEffect, useState } from 'react';

/**
 * A custom React Hook that allows loading an external script dynamically and waits for it to be loaded before performing any actions.
 * with a dependency option incase you are trying to mount more than one script and they rely on each other
 * 
 * Example:
 * 
 * const injectLoaded = useScript("https://cdn.botpress.cloud/webchat/v0/inject.js");
 * useScript("https://mediafiles.botpress.cloud/b5e5cfc0-5667-4616-a753-06d7b89006d5/webchat/config.js", [injectLoaded]);
 *
 * @param {string} url - The URL of the script to be loaded dynamically.
 * @param {Array<any>} deps - Optional dependencies to trigger the script loading, similar to React's useEffect dependencies.
 * @returns {boolean} - A boolean value representing whether the script has been successfully loaded (true) or not (false).
 */
const useScript = (url, deps = []) => {
    const [loaded, setLoaded] = useState(false);
  
    useEffect(() => {
      if (deps.every(Boolean)) {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
  
        const onLoad = () => setLoaded(true);
  
        script.addEventListener('load', onLoad);
  
        document.body.appendChild(script);
  
        return () => {
          script.removeEventListener('load', onLoad);
          document.body.removeChild(script);
        };
      }
    }, [url, ...deps]);
  
    return loaded;
  };

export default useScript;


