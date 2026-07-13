#!/usr/bin/env python3
"""
build_bundle.py — 由 data/*.json 生成 manifest.json 与 dist/data.js。

- manifest.json：计数、年龄范围、各文件 SHA-256 校验和。
- dist/data.js：把三份数据合并为 `window.KID_DATA = {...}`，供 index.html
  通过 <script src> 直接加载（兼容 file:// 本地打开，无需服务器）。

    python3 scripts/build_bundle.py
"""
import json
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
DIST = ROOT / "dist"
DIST.mkdir(exist_ok=True)


def load(name):
    with open(DATA / name, encoding="utf-8") as f:
        return json.load(f)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    subjects = load("subjects.json")
    concepts = load("concepts.json")
    deps = load("dependencies.json")

    grades = [c["grade"] for c in concepts["concepts"]]
    by_subject = {}
    for c in concepts["concepts"]:
        by_subject[c["subject"]] = by_subject.get(c["subject"], 0) + 1

    files = {}
    for name in ("subjects.json", "concepts.json", "dependencies.json"):
        p = DATA / name
        files[name] = {"bytes": p.stat().st_size, "sha256": sha256(p)}

    manifest = {
        "dataset": "小学知识图谱",
        "version": "v1",
        "gradeRange": {"min": min(grades), "max": max(grades)},
        "counts": {
            "subjects": len(subjects["subjects"]),
            "concepts": len(concepts["concepts"]),
            "dependencies": len(deps["dependencies"]),
            "conceptsBySubject": by_subject,
        },
        "files": files,
    }
    with open(DATA / "manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write("\n")

    bundle = {
        "subjects": subjects["subjects"],
        "concepts": concepts["concepts"],
        "dependencies": deps["dependencies"],
        "gradeMin": min(grades),
        "gradeMax": max(grades),
    }
    payload = json.dumps(bundle, ensure_ascii=False, separators=(",", ":"))
    js = "/* 由 scripts/build_bundle.py 自动生成，请勿手改。改 data/*.json 后重新构建。 */\nwindow.KID_DATA=" + payload + ";\n"
    with open(DIST / "data.js", "w", encoding="utf-8") as f:
        f.write(js)

    print(f"✓ manifest.json 已生成（{len(concepts['concepts'])} 概念 / {len(deps['dependencies'])} 依赖）")
    print(f"✓ dist/data.js 已生成（{len(js)} 字节）")


if __name__ == "__main__":
    main()
