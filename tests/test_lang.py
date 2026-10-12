import os

from sm_lang import steam_language


def reg(home, rel, text):
    p = os.path.join(home, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w") as f:
        f.write(text)


VDF = '''"Registry"
{
\t"HKCU"
\t{
\t\t"Software"
\t\t{
\t\t\t"Valve"
\t\t\t{
\t\t\t\t"Steam"
\t\t\t\t{
\t\t\t\t\t"language"\t\t"Brazilian"
\t\t\t\t}
\t\t\t}
\t\t}
\t}
}
'''


def test_reads_language_lowercased_REQ509(tmp_path):
    reg(str(tmp_path), ".steam/registry.vdf", VDF)
    assert steam_language(str(tmp_path)) == "brazilian"


def test_falls_back_to_other_known_paths(tmp_path):
    reg(str(tmp_path), ".local/share/Steam/registry.vdf", VDF.replace("Brazilian", "spanish"))
    assert steam_language(str(tmp_path)) == "spanish"


def test_missing_or_garbage_is_none(tmp_path):
    assert steam_language(str(tmp_path)) is None
    reg(str(tmp_path), ".steam/registry.vdf", "no language here")
    assert steam_language(str(tmp_path)) is None
