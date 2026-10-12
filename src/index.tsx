import { definePlugin, routerHook } from "@decky/api";
import { staticClasses } from "@decky/ui";
import { FC } from "react";
import { FaMicrochip } from "react-icons/fa";
import { useSettings } from "./hooks";
import { t } from "./i18n";
import { startupUpdateCheck } from "./updates";
import { Panel } from "./Panel";
import { PROCESS_ROUTE, ProcessPage } from "./ProcessPage";

/** A component, not a fixed element: it re-renders when the language setting changes (REQ-512). */
const Title: FC = () => {
  useSettings();
  return <div className={staticClasses.Title}>{t("title")}</div>;
};

export default definePlugin(() => {
  startupUpdateCheck();
  routerHook.addRoute(PROCESS_ROUTE, ProcessPage);
  return {
    name: "System Monitor", // must match plugin.json: Decky identifies the plugin (and its list entry) by it (REQ-512)
    titleView: <Title />,
    content: <Panel />,
    icon: <FaMicrochip />,
    onDismount() {
      routerHook.removeRoute(PROCESS_ROUTE);
    },
  };
});
