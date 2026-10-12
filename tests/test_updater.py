import hashlib
import io
import json
import os
import zipfile

import pytest

import updater
from updater import UpdateError


def make_zip(files, root="decky-system-monitor", extra=None):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        for name, data in files.items():
            z.writestr(f"{root}/{name}" if root else name, data)
        for name, data in (extra or {}).items():
            z.writestr(name, data)
    return buf.getvalue()


def good_files(version="0.2.0"):
    return {
        "plugin.json": json.dumps({"name": "System Monitor"}),
        "package.json": json.dumps({"version": version}),
        "main.py": "# new",
        "LICENSE": "x",
        "dist/index.js": "new js",
        "py_modules/sysmon.py": "new",
    }


class Resp:
    def __init__(self, data):
        self._d = data
    def read(self, n=-1):
        return self._d if n < 0 else self._d[:n]
    def __enter__(self):
        return self
    def __exit__(self, *a):
        pass


def fake_urlopen(release=None, zip_bytes=b""):
    def _open(req, timeout=None):
        url = req.full_url
        if url == updater.API_LATEST:
            if release is None:
                raise OSError("offline")
            return Resp(json.dumps(release).encode())
        return Resp(zip_bytes)
    return _open


def release(zip_bytes, tag="v0.2.0", **kw):
    a = {
        "name": updater.ASSET_NAME,
        "browser_download_url": updater.DOWNLOAD_PREFIX + f"{tag}/{updater.ASSET_NAME}",
        "digest": "sha256:" + hashlib.sha256(zip_bytes).hexdigest(),
    }
    a.update(kw.pop("asset", {}))
    r = {"tag_name": tag, "prerelease": False, "draft": False, "assets": [a]}
    r.update(kw)
    return r


def installed(tmp_path, version="0.1.1"):
    d = tmp_path / "plugins" / "System Monitor"
    (d / "dist").mkdir(parents=True)
    (d / "py_modules").mkdir()
    (d / "package.json").write_text(json.dumps({"version": version}))
    (d / "plugin.json").write_text(json.dumps({"name": "System Monitor"}))
    (d / "main.py").write_text("# old")
    (d / "dist" / "index.js").write_text("old js")
    (d / "py_modules" / "stale.py").write_text("stale")
    (d / "settings-keep.txt").write_text("keep")
    return str(d)


def test_semver_REQ601():
    assert updater.is_newer("v0.1.2", "0.1.1")
    assert updater.is_newer("1.0.0", "0.9.9")
    assert updater.is_newer("v0.10.0", "0.9.0")  # numeric, not lexicographic
    assert not updater.is_newer("0.1.1", "0.1.1")
    assert not updater.is_newer("0.1.0", "0.1.1")
    assert updater.is_newer("1.0.0", "1.0.0-rc1")
    assert not updater.is_newer("1.0.0-rc2", "1.0.0")
    assert not updater.is_newer("garbage", "0.1.1")
    assert not updater.is_newer("v9.9.9", "garbage")


def test_read_version(tmp_path):
    assert updater.read_version(installed(tmp_path)) == "0.1.1"
    assert updater.read_version(str(tmp_path / "nope")) == "0.0.0"


def test_check_available_and_uptodate_and_error_REQ602(tmp_path):
    d = installed(tmp_path)
    z = make_zip(good_files())
    st = updater.check(d, fake_urlopen(release(z), z))
    assert st["available"] and st["latest"] == "0.2.0" and st["current"] == "0.1.1" and "error" not in st
    st = updater.check(d, fake_urlopen(release(z, tag="v0.1.1"), z))
    assert not st["available"] and st["latest"] == "0.1.1"
    st = updater.check(d, fake_urlopen(None))  # offline: no raise
    assert not st["available"] and st["error"] and st["checked"]


def test_prerelease_and_bad_tag_ignored_REQ600(tmp_path):
    d = installed(tmp_path)
    z = make_zip(good_files())
    assert "error" in updater.check(d, fake_urlopen(release(z, prerelease=True), z))
    assert "error" in updater.check(d, fake_urlopen(release(z, tag="test-build"), z))


def test_foreign_asset_url_not_offered_REQ631(tmp_path):
    d = installed(tmp_path)
    z = make_zip(good_files())
    r = release(z, asset={"browser_download_url": "https://evil.example/decky-system-monitor.zip"})
    assert not updater.check(d, fake_urlopen(r, z))["available"]
    r = release(z, asset={"name": "other.zip"})
    assert not updater.check(d, fake_urlopen(r, z))["available"]


def test_install_happy_path_and_payload_replaced_REQ635(tmp_path):
    d = installed(tmp_path)
    z = make_zip(good_files())
    v = updater.install(d, fake_urlopen(release(z), z))
    assert v == "0.2.0"
    assert open(os.path.join(d, "main.py")).read() == "# new"
    assert open(os.path.join(d, "dist/index.js")).read() == "new js"
    assert updater.read_version(d) == "0.2.0"
    assert not os.path.exists(os.path.join(d, "py_modules/stale.py"))  # replaced wholesale
    assert open(os.path.join(d, "settings-keep.txt")).read() == "keep"  # non-payload untouched
    assert os.listdir(os.path.dirname(d)) == ["System Monitor"]  # backup cleaned


def test_install_requires_newer_REQ630(tmp_path):
    d = installed(tmp_path)
    z = make_zip(good_files("0.1.1"))
    with pytest.raises(UpdateError):
        updater.install(d, fake_urlopen(release(z, tag="v0.1.1"), z))


def test_digest_missing_or_mismatch_fails_closed_REQ632(tmp_path):
    d = installed(tmp_path)
    z = make_zip(good_files())
    r = release(z)
    r["assets"][0]["digest"] = None
    with pytest.raises(UpdateError, match="digest"):
        updater.install(d, fake_urlopen(r, z))
    r = release(z, asset={"digest": "sha256:" + "0" * 64})
    with pytest.raises(UpdateError, match="mismatch"):
        updater.install(d, fake_urlopen(r, z))
    assert open(os.path.join(d, "main.py")).read() == "# old"  # untouched


def test_zip_slip_symlink_and_foreign_root_REQ633(tmp_path):
    for bad in (
        make_zip(good_files(), extra={"decky-system-monitor/../evil.py": "x"}),
        make_zip(good_files(), extra={"/abs.py": "x"}),
        make_zip(good_files(), root="other"),
    ):
        with pytest.raises(UpdateError):
            updater.safe_extract(bad, str(tmp_path / "x"))
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        zi = zipfile.ZipInfo("decky-system-monitor/link")
        zi.external_attr = (0o120777) << 16
        z.writestr(zi, "/etc/passwd")
    with pytest.raises(UpdateError, match="symlink"):
        updater.safe_extract(buf.getvalue(), str(tmp_path / "y"))
    assert not (tmp_path / "evil.py").exists()


def test_validate_REQ634(tmp_path):
    for mutate in (
        lambda f: f.update({"plugin.json": json.dumps({"name": "Other"})}),
        lambda f: f.pop("main.py"),
        lambda f: f.pop("dist/index.js"),
    ):
        f = good_files()
        mutate(f)
        root = updater.safe_extract(make_zip(f), str(tmp_path / str(id(mutate))))
        with pytest.raises(UpdateError):
            updater.validate(root)
    root = updater.safe_extract(make_zip(good_files("0.9.0")), str(tmp_path / "v"))
    with pytest.raises(UpdateError, match="version"):
        updater.validate(root, "0.2.0")


def test_rollback_on_failure_REQ635(tmp_path, monkeypatch):
    d = installed(tmp_path)
    z = make_zip(good_files())
    real = updater._copy
    calls = {"n": 0}

    def flaky(src, dst):
        # let the backup phase succeed, fail midway through the apply phase
        if os.sep + "decky-system-monitor" + os.sep in src or src.endswith("decky-system-monitor"):
            calls["n"] += 1
            if calls["n"] == 3:
                raise OSError("disk full")
        return real(src, dst)

    monkeypatch.setattr(updater, "_copy", flaky)
    with pytest.raises(OSError):
        updater.install(d, fake_urlopen(release(z), z))
    assert open(os.path.join(d, "main.py")).read() == "# old"
    assert open(os.path.join(d, "dist/index.js")).read() == "old js"
    assert os.path.exists(os.path.join(d, "py_modules/stale.py"))
    assert updater.read_version(d) == "0.1.1"
    assert os.listdir(os.path.dirname(d)) == ["System Monitor"]
