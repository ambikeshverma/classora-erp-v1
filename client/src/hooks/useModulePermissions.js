import { useState, useEffect, useCallback } from "react";
import { schoolService } from "../services/api";

export const useModulePermissions = (moduleKey) => {
  const [enabledModules, setEnabledModules] = useState(() => {
    try {
      const raw = localStorage.getItem("enabledModules");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [enabledSubModules, setEnabledSubModules] = useState(() => {
    try {
      const raw = localStorage.getItem("enabledSubModules");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [toastMessage, setToastMessage] = useState(null);

  // Sync latest permissions from server on mount
  useEffect(() => {
    let isMounted = true;
    schoolService
      .getProfile()
      .then((res) => {
        if (!isMounted) return;
        if (res.data?.success && res.data.data) {
          const freshMods = res.data.data.enabledModules;
          const freshSubs = res.data.data.enabledSubModules;

          if (freshMods) {
            setEnabledModules(freshMods);
            localStorage.setItem("enabledModules", JSON.stringify(freshMods));
          }
          if (freshSubs) {
            setEnabledSubModules(freshSubs);
            localStorage.setItem("enabledSubModules", JSON.stringify(freshSubs));
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const isModuleEnabled = useCallback(() => {
    if (!enabledModules || !Array.isArray(enabledModules)) return true;
    return enabledModules.includes(moduleKey);
  }, [enabledModules, moduleKey]);

  const isSubModuleEnabled = useCallback(
    (subModuleKey) => {
      // If parent module is disabled, all submodules are disabled
      if (enabledModules && Array.isArray(enabledModules) && !enabledModules.includes(moduleKey)) {
        return false;
      }

      // If sub-modules permissions are defined for this module, check the array
      if (enabledSubModules && typeof enabledSubModules === "object") {
        const list = enabledSubModules[moduleKey];
        if (Array.isArray(list)) {
          return list.includes(subModuleKey);
        }
      }

      // If no sub-module restrictions exist yet, default to true
      return true;
    },
    [enabledModules, enabledSubModules, moduleKey]
  );

  const showLockNotice = useCallback((cardTitle) => {
    const msg = `🔒 "${cardTitle}" is currently locked by Super Admin for your campus. Please contact Super Admin to activate this sub-module.`;
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  return {
    isModuleEnabled,
    isSubModuleEnabled,
    showLockNotice,
    toastMessage,
    setToastMessage,
  };
};

export default useModulePermissions;
