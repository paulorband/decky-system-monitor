import { definePlugin, routerHook } from "@decky/api";
import { staticClasses } from "@decky/ui";
import { FaMicrochip } from "react-icons/fa";
import { Overlay } from "./Overlay";
import { Panel } from "./Panel";

export default definePlugin(() => {
  routerHook.addGlobalComponent("SystemMonitorOverlay", Overlay);
  return {
    name: "System Monitor",
    titleView: <div className={staticClasses.Title}>Monitor do Sistema</div>,
    content: <Panel />,
    icon: <FaMicrochip />,
    onDismount() {
      routerHook.removeGlobalComponent("SystemMonitorOverlay");
    },
  };
});
