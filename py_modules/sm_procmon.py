"""Per-process CPU/RAM sampler grouped by Steam app (specs/007)."""
import os
import time
from typing import Any, Dict, List, Optional, Tuple

PF_KTHREAD = 0x00200000
STALE_S = 10.0
MAX_LIMIT = 50


def _read(path: str, mode: str = "r") -> Optional[Any]:
    try:
        with open(path, mode) as f:
            return f.read()
    except OSError:
        return None


class ProcessSampler:
    def __init__(self, root: str = "/", clock=time.monotonic):
        self.root = root
        self._clock = clock
        self._prev: Dict[int, int] = {}  # pid -> cpu ticks
        self._prev_total: Optional[int] = None
        self._prev_at = 0.0
        self._app_ids: Dict[Tuple[int, int], Optional[int]] = {}
        try:
            self._page_mb = os.sysconf("SC_PAGE_SIZE") / 1048576
        except (ValueError, OSError):
            self._page_mb = 4096 / 1048576

    def _p(self, path: str) -> str:
        return os.path.join(self.root, path.lstrip("/"))

    def _total_ticks(self) -> Optional[int]:
        line = (_read(self._p("/proc/stat")) or "").split("\n", 1)[0].split()
        if len(line) < 5 or line[0] != "cpu":
            return None
        return sum(int(x) for x in line[1:9])

    def _app_id(self, pid: int, start: int) -> Optional[int]:
        key = (pid, start)
        if key not in self._app_ids:
            app = None
            raw = _read(self._p(f"/proc/{pid}/environ"), "rb")
            if raw:
                for item in raw.split(b"\0"):
                    if item.startswith(b"SteamAppId="):
                        v = item[11:].decode("ascii", "ignore")
                        if v.isdigit() and int(v) > 0:
                            app = int(v)
                        break
            self._app_ids[key] = app
        return self._app_ids[key]

    @staticmethod
    def _parse_stat(text: str):
        # "pid (comm) S ppid ..." — comm may contain spaces/parens
        lp, rp = text.find("("), text.rfind(")")
        if lp < 0 or rp < lp:
            return None
        f = text[rp + 2:].split()
        if len(f) < 22:
            return None
        return (
            text[lp + 1:rp],
            int(f[6]),                 # flags
            int(f[11]) + int(f[12]),   # utime + stime
            int(f[19]),                # starttime
            int(f[21]),                # rss (pages)
        )

    def get_processes(self, sort: str = "cpu", limit: int = 15) -> Dict[str, Any]:
        sort = sort if sort in ("cpu", "mem") else "cpu"
        limit = limit if isinstance(limit, int) and not isinstance(limit, bool) and 1 <= limit <= MAX_LIMIT else 15
        now = self._clock()
        total = self._total_ticks()
        dtotal = None
        if self._prev_total is not None and total is not None and now - self._prev_at <= STALE_S:
            dtotal = total - self._prev_total
        have_prev = dtotal is not None and dtotal > 0

        cur: Dict[int, int] = {}
        live_keys = set()
        groups: Dict[str, Dict[str, Any]] = {}
        try:
            entries = os.listdir(self._p("/proc"))
        except OSError:
            entries = []
        for e in entries:
            if not e.isdigit():
                continue
            pid = int(e)
            try:
                text = _read(self._p(f"/proc/{pid}/stat"))
                parsed = self._parse_stat(text) if text else None
                if not parsed:
                    continue
                comm, flags, ticks, start, rss = parsed
                if flags & PF_KTHREAD:
                    continue
                cur[pid] = ticks
                live_keys.add((pid, start))
                app = self._app_id(pid, start)
                gkey = f"app:{app}" if app else f"name:{comm}"
                g = groups.setdefault(gkey, {"name": comm, "count": 0, "cpu_ticks": 0, "rss": 0, "has_cpu": True})
                if app:
                    g["app_id"] = app
                g["count"] += 1
                g["rss"] += rss
                if have_prev and pid in self._prev:
                    g["cpu_ticks"] += max(0, ticks - self._prev[pid])
                elif have_prev:
                    g["cpu_ticks"] += 0  # new process: no baseline yet
            except Exception:
                continue  # REQ-407

        self._prev, self._prev_total, self._prev_at = cur, total, now
        self._app_ids = {k: v for k, v in self._app_ids.items() if k in live_keys}

        out: List[Dict[str, Any]] = []
        for key, g in groups.items():
            item = {
                "key": key,
                "name": g["name"],
                "count": g["count"],
                "cpu": round(100.0 * g["cpu_ticks"] / dtotal, 1) if have_prev else None,
                "rss_mb": round(g["rss"] * self._page_mb),
            }
            if "app_id" in g:
                item["app_id"] = g["app_id"]
            out.append(item)
        if sort == "mem":
            out.sort(key=lambda i: i["rss_mb"], reverse=True)
        else:
            out.sort(key=lambda i: (i["cpu"] or 0, i["rss_mb"]), reverse=True)
        return {"sort": sort, "processes": out[:limit]}
