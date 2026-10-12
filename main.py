import asyncio
import os
import sys
import time

import decky  # type: ignore

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "py_modules"))

import settings  # noqa: E402
import updater  # noqa: E402
from procmon import ProcessSampler  # noqa: E402
from sysmon import Sampler  # noqa: E402


class Plugin:
    sampler: Sampler
    procs: ProcessSampler
    settings_path: str
    update_state: dict
    installing: bool

    async def _main(self):
        self.sampler = Sampler()
        self.procs = ProcessSampler()
        self.settings_path = os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "settings.json")
        self.update_state = {"current": updater.read_version(decky.DECKY_PLUGIN_DIR), "available": False, "checked": False}
        self.installing = False
        decky.logger.info("System Monitor %s loaded", self.update_state["current"])

    async def _unload(self):
        decky.logger.info("System Monitor unloaded")

    async def get_stats(self):
        return self.sampler.get_stats()

    async def get_processes(self, sort="cpu", limit=15):
        return self.procs.get_processes(sort, limit)

    async def get_update_state(self):
        return self.update_state

    async def check_update(self, force=False):
        st = self.update_state
        if not force and st.get("checked_at") and time.time() - st["checked_at"] < updater.CACHE_SECONDS:
            return st
        loop = asyncio.get_running_loop()
        self.update_state = await loop.run_in_executor(None, updater.check, decky.DECKY_PLUGIN_DIR)
        return self.update_state

    async def install_update(self):
        if self.installing:
            return {"ok": False, "error": "busy"}
        self.installing = True
        try:
            loop = asyncio.get_running_loop()
            version = await loop.run_in_executor(None, updater.install, decky.DECKY_PLUGIN_DIR)
        except Exception as e:
            decky.logger.error("update failed: %s", e)
            return {"ok": False, "error": str(e)[:200]}
        finally:
            self.installing = False
        decky.logger.info("updated to %s; restarting Decky", version)
        updater.schedule_decky_restart()
        return {"ok": True, "version": version}

    async def get_settings(self):
        return settings.load(self.settings_path)

    async def set_settings(self, data):
        return settings.save(self.settings_path, data)
