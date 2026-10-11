"""Lightweight hardware sampler reading /proc and /sys only (specs/001)."""
import glob
import os
from typing import Any, Dict, List, Optional

CPU_TEMP_DRIVERS = ("k10temp", "coretemp", "zenpower")


def _read(path: str) -> Optional[str]:
    try:
        with open(path, "r") as f:
            return f.read().strip()
    except (OSError, ValueError):
        return None


def _read_int(path: str) -> Optional[int]:
    v = _read(path)
    try:
        return int(v) if v is not None else None
    except ValueError:
        return None


class Sampler:
    def __init__(self, root: str = "/"):
        self.root = root
        self._prev_cpu: Optional[tuple] = None
        self._hwmon: Optional[Dict[str, List[str]]] = None
        self._drm: Optional[str] = None
        self._drm_done = False
        self._bat: Optional[str] = None
        self._bat_done = False

    def _p(self, path: str) -> str:
        return os.path.join(self.root, path.lstrip("/"))

    # --- discovery (cached, REQ-009) ---
    def _hwmons(self) -> Dict[str, List[str]]:
        if self._hwmon is None:
            found: Dict[str, List[str]] = {}
            for d in sorted(glob.glob(self._p("/sys/class/hwmon/hwmon*"))):
                name = _read(os.path.join(d, "name"))
                if name:
                    found.setdefault(name, []).append(d)
            self._hwmon = found
        return self._hwmon

    def _amd_card(self) -> Optional[str]:
        if not self._drm_done:
            self._drm_done = True
            for d in sorted(glob.glob(self._p("/sys/class/drm/card[0-9]*/device"))):
                if _read(os.path.join(d, "vendor")) == "0x1002":
                    self._drm = d
                    break
        return self._drm

    def _battery(self) -> Optional[str]:
        if not self._bat_done:
            self._bat_done = True
            for d in sorted(glob.glob(self._p("/sys/class/power_supply/*"))):
                if _read(os.path.join(d, "type")) == "Battery":
                    self._bat = d
                    break
        return self._bat

    def rediscover(self) -> None:
        self._hwmon = None
        self._drm_done = False
        self._bat_done = False

    # --- collectors ---
    def _cpu(self) -> Dict[str, Any]:
        out: Dict[str, Any] = {}
        line = (_read(self._p("/proc/stat")) or "").split("\n", 1)[0].split()
        if len(line) >= 5 and line[0] == "cpu":
            vals = [int(x) for x in line[1:9]] + [0] * max(0, 8 - len(line[1:9]))
            idle = vals[3] + vals[4]
            total = sum(vals)
            if self._prev_cpu:
                dt = total - self._prev_cpu[1]
                di = idle - self._prev_cpu[0]
                if dt > 0:
                    out["usage"] = round(100.0 * (dt - di) / dt, 1)
            self._prev_cpu = (idle, total)
        freqs = [
            _read_int(f)
            for f in glob.glob(self._p("/sys/devices/system/cpu/cpu[0-9]*/cpufreq/scaling_cur_freq"))
        ]
        freqs = [f for f in freqs if f]
        if freqs:
            out["freq_mhz"] = round(sum(freqs) / len(freqs) / 1000)
        for drv in CPU_TEMP_DRIVERS:
            for d in self._hwmons().get(drv, []):
                t = _read_int(os.path.join(d, "temp1_input"))
                if t is not None:
                    out["temp_c"] = round(t / 1000, 1)
                    return out
        for z in sorted(glob.glob(self._p("/sys/class/thermal/thermal_zone*"))):
            if _read(os.path.join(z, "type")) == "x86_pkg_temp":
                t = _read_int(os.path.join(z, "temp"))
                if t is not None:
                    out["temp_c"] = round(t / 1000, 1)
                    break
        return out

    def _mem(self) -> Dict[str, Any]:
        info: Dict[str, int] = {}
        for ln in (_read(self._p("/proc/meminfo")) or "").splitlines():
            k, _, v = ln.partition(":")
            parts = v.split()
            if parts and parts[0].isdigit():
                info[k] = int(parts[0])
        out: Dict[str, Any] = {}
        if "MemTotal" in info and "MemAvailable" in info:
            total, used = info["MemTotal"], info["MemTotal"] - info["MemAvailable"]
            out["mem"] = {
                "used_mb": used // 1024,
                "total_mb": total // 1024,
                "percent": round(100.0 * used / total, 1) if total else 0.0,
            }
        if info.get("SwapTotal"):
            out["swap"] = {
                "used_mb": (info["SwapTotal"] - info.get("SwapFree", 0)) // 1024,
                "total_mb": info["SwapTotal"] // 1024,
            }
        return out

    def _gpu(self) -> Dict[str, Any]:
        d = self._amd_card()
        if not d:
            return {}
        out: Dict[str, Any] = {}
        busy = _read_int(os.path.join(d, "gpu_busy_percent"))
        if busy is not None:
            out["usage"] = busy
        for ln in (_read(os.path.join(d, "pp_dpm_sclk")) or "").splitlines():
            if ln.rstrip().endswith("*"):
                digits = "".join(c for c in ln.split(":", 1)[-1].split("M")[0] if c.isdigit())
                if digits:
                    out["freq_mhz"] = int(digits)
        vu, vt = _read_int(os.path.join(d, "mem_info_vram_used")), _read_int(os.path.join(d, "mem_info_vram_total"))
        if vu is not None and vt:
            out["vram_used_mb"], out["vram_total_mb"] = vu // 1048576, vt // 1048576
        for h in self._hwmons().get("amdgpu", []):
            t = _read_int(os.path.join(h, "temp1_input"))
            if t is not None:
                out["temp_c"] = round(t / 1000, 1)
            p = _read_int(os.path.join(h, "power1_average"))
            if p is None:
                p = _read_int(os.path.join(h, "power1_input"))
            if p is not None:
                out["power_w"] = round(p / 1e6, 1)
            break
        return out

    def _bat_info(self) -> Dict[str, Any]:
        d = self._battery()
        if not d:
            return {}
        out: Dict[str, Any] = {}
        cap = _read_int(os.path.join(d, "capacity"))
        if cap is not None:
            out["percent"] = cap
        st = _read(os.path.join(d, "status"))
        if st:
            out["status"] = st
        pw = _read_int(os.path.join(d, "power_now"))
        if pw is None:
            cur, volt = _read_int(os.path.join(d, "current_now")), _read_int(os.path.join(d, "voltage_now"))
            if cur is not None and volt is not None:
                pw = abs(cur) * volt // 1_000_000
        if pw is not None:
            out["power_w"] = round(abs(pw) / 1e6, 1)
        return out

    def _fan(self) -> Dict[str, Any]:
        for f in sorted(glob.glob(self._p("/sys/class/hwmon/hwmon*/fan*_input"))):
            v = _read_int(f)
            if v:
                return {"rpm": v}
        return {}

    def get_stats(self) -> Dict[str, Any]:
        stats: Dict[str, Any] = {}
        for key, fn in (("cpu", self._cpu), ("gpu", self._gpu), ("battery", self._bat_info), ("fan", self._fan)):
            try:
                data = fn()
                if data:
                    stats[key] = data
            except Exception:
                pass
        try:
            stats.update(self._mem())
        except Exception:
            pass
        return stats
