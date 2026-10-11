import os

from sysmon import Sampler


def w(root, path, text):
    p = os.path.join(root, path.lstrip("/"))
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w") as f:
        f.write(text)


def full_fixture(root):
    w(root, "/proc/stat", "cpu  100 0 100 800 0 0 0 0\ncpu0 1 1 1 1 0 0 0 0\n")
    w(root, "/proc/meminfo", "MemTotal: 16777216 kB\nMemAvailable: 8388608 kB\nSwapTotal: 2097152 kB\nSwapFree: 1048576 kB\n")
    w(root, "/sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq", "2000000")
    w(root, "/sys/devices/system/cpu/cpu1/cpufreq/scaling_cur_freq", "3000000")
    w(root, "/sys/class/hwmon/hwmon0/name", "k10temp")
    w(root, "/sys/class/hwmon/hwmon0/temp1_input", "65500")
    w(root, "/sys/class/hwmon/hwmon1/name", "amdgpu")
    w(root, "/sys/class/hwmon/hwmon1/temp1_input", "58000")
    w(root, "/sys/class/hwmon/hwmon1/power1_average", "7500000")
    w(root, "/sys/class/hwmon/hwmon2/name", "steamdeck_hwmon")
    w(root, "/sys/class/hwmon/hwmon2/fan1_input", "3200")
    d = "/sys/class/drm/card0/device/"
    w(root, d + "vendor", "0x1002")
    w(root, d + "gpu_busy_percent", "42")
    w(root, d + "pp_dpm_sclk", "0: 200Mhz\n1: 1100Mhz *\n2: 1600Mhz\n")
    w(root, d + "mem_info_vram_used", str(1024 * 1048576))
    w(root, d + "mem_info_vram_total", str(4096 * 1048576))
    b = "/sys/class/power_supply/BAT1/"
    w(root, b + "type", "Battery")
    w(root, b + "capacity", "77")
    w(root, b + "status", "Discharging")
    w(root, b + "current_now", "-1500000")
    w(root, b + "voltage_now", "8000000")


def test_full(tmp_path):
    r = str(tmp_path)
    full_fixture(r)
    s = Sampler(r)
    first = s.get_stats()
    assert "usage" not in first["cpu"]  # REQ-002 first call
    w(r, "/proc/stat", "cpu  200 0 200 900 0 0 0 0\n")  # +200 busy, +100 idle
    st = s.get_stats()
    assert st["cpu"]["usage"] == 66.7
    assert st["cpu"]["freq_mhz"] == 2500
    assert st["cpu"]["temp_c"] == 65.5
    assert st["mem"] == {"used_mb": 8192, "total_mb": 16384, "percent": 50.0}
    assert st["swap"] == {"used_mb": 1024, "total_mb": 2048}
    g = st["gpu"]
    assert (g["usage"], g["freq_mhz"], g["temp_c"], g["power_w"]) == (42, 1100, 58.0, 7.5)
    assert (g["vram_used_mb"], g["vram_total_mb"]) == (1024, 4096)
    assert st["battery"] == {"percent": 77, "status": "Discharging", "power_w": 12.0}
    assert st["fan"] == {"rpm": 3200}


def test_empty_system_degrades(tmp_path):
    st = Sampler(str(tmp_path)).get_stats()
    assert st == {}  # REQ-001/004: nothing available, no errors


def test_cpu_temp_fallback_thermal_zone(tmp_path):
    r = str(tmp_path)
    w(r, "/sys/class/thermal/thermal_zone0/type", "x86_pkg_temp")
    w(r, "/sys/class/thermal/thermal_zone0/temp", "50000")
    assert Sampler(r).get_stats()["cpu"]["temp_c"] == 50.0


def test_collector_failure_isolated(tmp_path):
    r = str(tmp_path)
    full_fixture(r)
    s = Sampler(r)
    s._gpu = lambda: 1 / 0  # type: ignore
    st = s.get_stats()
    assert "gpu" not in st and "mem" in st and "battery" in st  # REQ-008


def test_battery_power_now_and_zero_fan_ignored(tmp_path):
    r = str(tmp_path)
    b = "/sys/class/power_supply/BAT0/"
    w(r, b + "type", "Battery")
    w(r, b + "power_now", "9000000")
    w(r, "/sys/class/hwmon/hwmon0/fan1_input", "0")
    st = Sampler(r).get_stats()
    assert st["battery"]["power_w"] == 9.0
    assert "fan" not in st
