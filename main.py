import os
import sys

import decky  # type: ignore

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "py_modules"))

import settings  # noqa: E402
from sysmon import Sampler  # noqa: E402


class Plugin:
    sampler: Sampler
    settings_path: str

    async def _main(self):
        self.sampler = Sampler()
        self.settings_path = os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "settings.json")
        decky.logger.info("System Monitor loaded")

    async def _unload(self):
        decky.logger.info("System Monitor unloaded")

    async def get_stats(self):
        return self.sampler.get_stats()

    async def get_settings(self):
        return settings.load(self.settings_path)

    async def set_settings(self, data):
        return settings.save(self.settings_path, data)
