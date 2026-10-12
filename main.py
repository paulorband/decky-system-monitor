import asyncio
import os
import sys
import time

import decky  # type: ignore

PLUGIN_DIR = os.path.dirname(os.path.abspath(__file__))  # no dependency on decky.DECKY_PLUGIN_DIR
sys.path.insert(0, os.path.join(PLUGIN_DIR, "py_modules"))

# Unique sm_ prefix: Decky's own flat modules (settings, updater, ...) can already be in sys.modules,
# and `import updater` would silently return Decky's instead of ours.
import sm_lang  # noqa: E402
import sm_settings as settings  # noqa: E402
import sm_updater as updater  # noqa: E402
from sm_procmon import ProcessSampler  # noqa: E402
from sm_sysmon import Sampler  # noqa: E402


# Update state lives at module level so the update methods never depend on _main having run.
try:
    _current = updater.read_version(PLUGIN_DIR)
except Exception:  # never let a version read stop the backend from loading
    _current = "0.0.0"
_update_state = {"current": _current, "available": False, "checked": False}
_installing = False


def _err(e: Exception) -> str:
    return f"{type(e).__name__}: {e}"[:200]


class Plugin:
    sampler: Sampler
    procs: ProcessSampler
    settings_path: str

    async def _main(self):
        self.sampler = Sampler()
        self.procs = ProcessSampler()
        self.settings_path = os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "settings.json")
        decky.logger.info("System Monitor %s loaded (dir=%s)", _update_state["current"], PLUGIN_DIR)

    async def _unload(self):
        decky.logger.info("System Monitor unloaded")

    async def get_stats(self):
        return self.sampler.get_stats()

    async def get_processes(self, sort="cpu", limit=15):
        return self.procs.get_processes(sort, limit)

    async def get_update_state(self):
        return _update_state

    async def check_update(self, force=False):
        global _update_state
        st = _update_state
        try:
            if not force and st.get("checked_at") and time.time() - st["checked_at"] < updater.CACHE_SECONDS:
                return st
            loop = asyncio.get_running_loop()
            _update_state = await loop.run_in_executor(None, updater.check, PLUGIN_DIR)
        except Exception as e:  # never reject: the UI shows the reason
            decky.logger.exception("check_update failed")
            _update_state = {**st, "checked": True, "available": False, "error": _err(e)}
        return _update_state

    async def install_update(self):
        global _installing
        if _installing:
            return {"ok": False, "error": "busy"}
        _installing = True
        try:
            loop = asyncio.get_running_loop()
            version = await loop.run_in_executor(None, updater.install, PLUGIN_DIR)
        except Exception as e:
            decky.logger.exception("install_update failed")
            return {"ok": False, "error": _err(e)}
        finally:
            _installing = False
        decky.logger.info("updated to %s; restarting Decky", version)
        updater.schedule_decky_restart(os.path.join(getattr(decky, "DECKY_PLUGIN_LOG_DIR", "/tmp"), "restart.log"))
        return {"ok": True, "version": version}

    async def get_language(self):
        """Steam's configured language from registry.vdf (None when unknown)."""
        try:
            home = getattr(decky, "DECKY_USER_HOME", None) or os.path.expanduser("~")
            return {"steam": sm_lang.steam_language(home)}
        except Exception:
            decky.logger.exception("get_language failed")
            return {"steam": None}

    async def get_settings(self):
        return settings.load(self.settings_path)

    async def set_settings(self, data):
        return settings.save(self.settings_path, data)
