"""Self-update from the project's own GitHub releases (specs/009)."""
import hashlib
import io
import json
import os
import re
import shutil
import ssl
import stat
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
import zipfile
from typing import Any, Callable, Dict, Optional, Tuple

REPO = "paulorband/decky-system-monitor"
API_LATEST = f"https://api.github.com/repos/{REPO}/releases/latest"
DOWNLOAD_PREFIX = f"https://github.com/{REPO}/releases/download/"
ASSET_NAME = "decky-system-monitor.zip"
ZIP_ROOT = "decky-system-monitor"
PLUGIN_NAME = "System Monitor"
PAYLOAD = ("plugin.json", "package.json", "main.py", "LICENSE", "dist", "py_modules")
MAX_ZIP = 10 * 1024 * 1024
MAX_UNPACKED = 30 * 1024 * 1024
TIMEOUT = 10
CACHE_SECONDS = 6 * 3600

_SEMVER = re.compile(r"^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$")


class UpdateError(Exception):
    pass


# --- versions (REQ-601) ---
def parse_version(s: Any) -> Optional[Tuple[int, int, int, Optional[str]]]:
    m = _SEMVER.match(s.strip()) if isinstance(s, str) else None
    return (int(m[1]), int(m[2]), int(m[3]), m[4]) if m else None


def is_newer(latest: str, current: str) -> bool:
    a, b = parse_version(latest), parse_version(current)
    if not a or not b:
        return False
    if a[:3] != b[:3]:
        return a[:3] > b[:3]
    return a[3] is None and b[3] is not None  # 1.0.0 supersedes 1.0.0-rc1


def read_version(plugin_dir: str) -> str:
    try:
        with open(os.path.join(plugin_dir, "package.json")) as f:
            v = json.load(f).get("version")
        return v if parse_version(v) else "0.0.0"
    except (OSError, ValueError, AttributeError):
        return "0.0.0"


# --- network ---
CA_BUNDLES = (
    "/etc/ssl/certs/ca-certificates.crt",  # Debian/Arch/SteamOS
    "/etc/pki/tls/certs/ca-bundle.crt",  # Fedora/Bazzite
    "/etc/ssl/ca-bundle.pem",
)


def _contexts():
    """Default first (honours SSL_CERT_FILE and the system store), then certifi/known bundles."""
    yield ssl.create_default_context()
    candidates = []
    try:
        import certifi  # type: ignore
        candidates.append(certifi.where())
    except Exception:
        pass
    candidates.extend(CA_BUNDLES)
    for cafile in candidates:
        if cafile and os.path.isfile(cafile):
            try:
                yield ssl.create_default_context(cafile=cafile)
            except (ssl.SSLError, OSError):
                continue


def _open(url: str, urlopen: Callable, accept: str):
    """Retry with alternative CA bundles only on certificate errors."""
    req = urllib.request.Request(url, headers={"Accept": accept, "User-Agent": "decky-system-monitor-updater"})
    last: Optional[Exception] = None
    for ctx in _contexts():
        try:
            return urlopen(req, timeout=TIMEOUT, context=ctx)
        except urllib.error.URLError as e:
            if not isinstance(getattr(e, "reason", None), ssl.SSLError):
                raise
            last = e
    raise last  # type: ignore[misc]


def fetch_latest(urlopen: Callable = urllib.request.urlopen) -> Dict[str, Any]:
    """REQ-600/631: latest stable release and its zip asset."""
    with _open(API_LATEST, urlopen, "application/vnd.github+json") as r:
        data = json.loads(r.read(1024 * 1024))
    tag = data.get("tag_name")
    if not parse_version(tag) or data.get("prerelease") or data.get("draft"):
        raise UpdateError("no stable release")
    info: Dict[str, Any] = {"tag": tag, "version": tag.lstrip("v"), "asset_url": None, "digest": None}
    for a in data.get("assets") or []:
        url = a.get("browser_download_url") or ""
        if a.get("name") == ASSET_NAME and url.startswith(DOWNLOAD_PREFIX):
            info["asset_url"], info["digest"] = url, a.get("digest")
            break
    return info


def download_verified(info: Dict[str, Any], urlopen: Callable = urllib.request.urlopen) -> bytes:
    """REQ-631/632: fail closed without a matching sha256 digest."""
    url, digest = info.get("asset_url"), info.get("digest") or ""
    if not url or not url.startswith(DOWNLOAD_PREFIX):
        raise UpdateError("release has no valid zip asset")
    if not digest.startswith("sha256:") or len(digest) != 71:
        raise UpdateError("release asset has no sha256 digest")
    with _open(url, urlopen, "application/octet-stream") as r:
        data = r.read(MAX_ZIP + 1)
    if len(data) > MAX_ZIP:
        raise UpdateError("zip too large")
    if hashlib.sha256(data).hexdigest() != digest[7:].lower():
        raise UpdateError("sha256 mismatch")
    return data


# --- extract / validate / apply ---
def safe_extract(data: bytes, dest: str) -> str:
    """REQ-633: no absolute paths, '..', symlinks or files outside the zip root."""
    try:
        zf = zipfile.ZipFile(io.BytesIO(data))
    except zipfile.BadZipFile as e:
        raise UpdateError("invalid zip") from e
    with zf:
        total = 0
        for m in zf.infolist():
            name = m.filename
            parts = name.split("/")
            if name.startswith("/") or ".." in parts or "\\" in name or parts[0] != ZIP_ROOT:
                raise UpdateError(f"unsafe path: {name}")
            if stat.S_ISLNK(m.external_attr >> 16):
                raise UpdateError(f"symlink not allowed: {name}")
            total += m.file_size
            if total > MAX_UNPACKED:
                raise UpdateError("unpacked size too large")
        for m in zf.infolist():
            target = os.path.join(dest, m.filename)
            if m.is_dir():
                os.makedirs(target, exist_ok=True)
            else:
                os.makedirs(os.path.dirname(target), exist_ok=True)
                with zf.open(m) as src, open(target, "wb") as out:
                    shutil.copyfileobj(src, out)
    return os.path.join(dest, ZIP_ROOT)


def validate(root: str, expected_version: Optional[str] = None) -> None:
    """REQ-634."""
    try:
        with open(os.path.join(root, "plugin.json")) as f:
            name = json.load(f).get("name")
        with open(os.path.join(root, "package.json")) as f:
            version = json.load(f).get("version")
    except (OSError, ValueError, AttributeError) as e:
        raise UpdateError("package metadata missing") from e
    if name != PLUGIN_NAME:
        raise UpdateError("not a System Monitor package")
    for need in ("main.py", os.path.join("dist", "index.js")):
        if not os.path.isfile(os.path.join(root, need)):
            raise UpdateError(f"package missing {need}")
    if expected_version and version != expected_version:
        raise UpdateError("package version does not match release")


def _remove(path: str) -> None:
    if os.path.isdir(path) and not os.path.islink(path):
        shutil.rmtree(path)
    elif os.path.lexists(path):
        os.remove(path)


def _copy(src: str, dst: str) -> None:
    if os.path.isdir(src):
        shutil.copytree(src, dst)
    else:
        shutil.copy2(src, dst)


def apply_package(root: str, plugin_dir: str) -> None:
    """REQ-635: replace payload items; restore the backup on any failure."""
    backup = tempfile.mkdtemp(prefix="sysmon-bak-", dir=os.path.dirname(os.path.abspath(plugin_dir)))
    try:
        for item in PAYLOAD:
            cur = os.path.join(plugin_dir, item)
            if os.path.lexists(cur):
                _copy(cur, os.path.join(backup, item))
        try:
            for item in PAYLOAD:
                src = os.path.join(root, item)
                if os.path.lexists(src):
                    dst = os.path.join(plugin_dir, item)
                    _remove(dst)
                    _copy(src, dst)
        except Exception:
            for item in PAYLOAD:
                _remove(os.path.join(plugin_dir, item))
                saved = os.path.join(backup, item)
                if os.path.lexists(saved):
                    _copy(saved, os.path.join(plugin_dir, item))
            raise
    finally:
        shutil.rmtree(backup, ignore_errors=True)


# --- orchestration ---
def check(plugin_dir: str, urlopen: Callable = urllib.request.urlopen) -> Dict[str, Any]:
    """REQ-600..603: never raises; errors are reported in the state."""
    current = read_version(plugin_dir)
    state: Dict[str, Any] = {"current": current, "available": False, "checked": True, "checked_at": time.time()}
    try:
        info = fetch_latest(urlopen)
        state["latest"] = info["version"]
        state["available"] = is_newer(info["version"], current) and bool(info["asset_url"])
    except Exception as e:  # network, JSON, rate limit...
        state["error"] = f"{type(e).__name__}: {e}"[:200]
    return state


def install(plugin_dir: str, urlopen: Callable = urllib.request.urlopen) -> str:
    """REQ-630: refetch, require newer, download, verify, validate, apply. Returns new version."""
    if not os.access(plugin_dir, os.W_OK) or not os.access(os.path.dirname(os.path.abspath(plugin_dir)), os.W_OK):
        raise UpdateError("plugin folder is not writable: the backend must run as root (plugin.json flags)")
    current = read_version(plugin_dir)
    info = fetch_latest(urlopen)
    if not is_newer(info["version"], current):
        raise UpdateError("already up to date")
    data = download_verified(info, urlopen)
    tmp = tempfile.mkdtemp(prefix="sysmon-upd-")
    try:
        root = safe_extract(data, tmp)
        validate(root, info["version"])
        apply_package(root, plugin_dir)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return info["version"]


def schedule_decky_restart(delay: int = 3) -> None:
    """REQ-636: detached, so it survives our own process being stopped."""
    subprocess.Popen(
        ["sh", "-c", f"sleep {int(delay)}; systemctl restart plugin_loader"],
        start_new_session=True,
        stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
