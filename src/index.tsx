import { definePlugin, routerHook } from "@decky/api";
import { staticClasses } from "@decky/ui";
import { FaMicrochip } from "react-icons/fa";
import { t } from "./i18n";
import { Overlay } from "./Overlay";
import { Panel } from "./Panel";
import { PROCESS_ROUTE, ProcessPage } from "./ProcessPage";

export default definePlugin(() => {
  routerHook.addRoute(PROCESS_ROUTE, ProcessPage);
  routerHook.addGlobalComponent("SystemMonitorOverlay", Overlay);
  return {
    name: t("title"),
    titleView: <div className={staticClasses.Title}>{t("title")}</div>,
    content: <Panel />,
    icon: <FaMicrochip />,
    onDismount() {
      routerHook.removeRoute(PROCESS_ROUTE);
      routerHook.removeGlobalComponent("SystemMonitorOverlay");
    },
  };
});
