import os

from sm_procmon import ProcessSampler


def w(root, path, data, mode="w"):
    p = os.path.join(root, path.lstrip("/"))
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, mode) as f:
        f.write(data)


def stat(pid, comm, ticks, rss, flags=0, start=100):
    # fields after ")" per proc(5): index 0=state(3) ... 6=flags 11=utime 12=stime 19=starttime 21=rss
    f = ["0"] * 22
    f[0], f[1], f[6], f[11], f[19], f[21] = "S", "1", str(flags), str(ticks), str(start), str(rss)
    return f"{pid} ({comm}) " + " ".join(f)


def proc(root, pid, comm, ticks, rss, app=None, **kw):
    w(root, f"/proc/{pid}/stat", stat(pid, comm, ticks, rss, **kw))
    env = b"HOME=/x\0" + (f"SteamAppId={app}\0".encode() if app else b"")
    w(root, f"/proc/{pid}/environ", env, "wb")


def total(root, busy):
    w(root, "/proc/stat", f"cpu  {busy} 0 0 {1000 - 0} 0 0 0 0\n")


class Clock:
    t = 0.0
    def __call__(self):
        return self.t


def setup(tmp):
    r = str(tmp)
    total(r, 0)
    proc(r, 10, "game.exe", 100, 2560, app=1234)
    proc(r, 11, "reaper", 10, 256, app=1234)
    proc(r, 20, "firefox", 50, 5120)
    proc(r, 21, "firefox", 50, 5120)
    proc(r, 30, "kworker/0:1", 999, 0, flags=0x00200000)
    return r


def test_first_sample_has_null_cpu_and_groups(tmp_path):  # REQ-402/404/405
    r = setup(tmp_path)
    res = ProcessSampler(r, Clock()).get_processes("mem")
    names = {p["key"]: p for p in res["processes"]}
    assert set(names) == {"app:1234", "name:firefox"}  # kthread skipped
    assert names["app:1234"]["count"] == 2 and names["app:1234"]["app_id"] == 1234
    assert names["app:1234"]["cpu"] is None
    assert names["name:firefox"]["rss_mb"] == 40  # 2 x 5120 pages x 4 KiB
    assert res["processes"][0]["rss_mb"] >= res["processes"][1]["rss_mb"]  # sorted by mem


def test_cpu_percent_of_total(tmp_path):  # REQ-402
    r, clk = setup(tmp_path), Clock()
    s = ProcessSampler(r, clk)
    s.get_processes()
    w(r, "/proc/stat", "cpu  0 0 0 1000 0 0 0 0\n")
    w(r, "/proc/stat", "cpu  0 0 0 1400 0 0 0 0\n")  # dtotal = 400
    proc(r, 10, "game.exe", 200, 2560, app=1234)     # +100
    proc(r, 11, "reaper", 30, 256, app=1234)         # +20
    clk.t = 1
    res = s.get_processes("cpu")
    top = res["processes"][0]
    assert top["key"] == "app:1234" and top["cpu"] == 30.0  # 120/400


def test_stale_gap_resets(tmp_path):  # REQ-402
    r, clk = setup(tmp_path), Clock()
    s = ProcessSampler(r, clk)
    s.get_processes()
    w(r, "/proc/stat", "cpu  0 0 0 1400 0 0 0 0\n")
    clk.t = 60
    assert s.get_processes()["processes"][0]["cpu"] is None


def test_limit_sort_sanitized_and_comm_with_parens(tmp_path):  # REQ-400
    r = str(tmp_path)
    total(r, 0)
    for i in range(1, 8):
        proc(r, i, f"p{i}", 1, i * 100)
    proc(r, 50, "we ird) name", 1, 1)
    res = ProcessSampler(r, Clock()).get_processes("bogus", 3)
    assert res["sort"] == "cpu" and len(res["processes"]) == 3
    assert len(ProcessSampler(r, Clock()).get_processes("mem", -5)["processes"]) == 8  # falls back to 15
    assert any(p["name"] == "we ird) name" for p in ProcessSampler(r, Clock()).get_processes("cpu", 50)["processes"])


def test_bad_pid_isolated_and_cache_pruned(tmp_path):  # REQ-406/407
    r = setup(tmp_path)
    w(r, "/proc/99/stat", "garbage")
    os.makedirs(os.path.join(r, "proc/77"))  # no stat file
    s = ProcessSampler(r, Clock())
    assert len(s.get_processes()["processes"]) == 2
    assert len(s._app_ids) == 4
    import shutil
    shutil.rmtree(os.path.join(r, "proc/10"))
    s.get_processes()
    assert len(s._app_ids) == 3
