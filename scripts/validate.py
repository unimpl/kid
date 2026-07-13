#!/usr/bin/env python3
"""
validate.py — 无依赖的小学知识图谱数据完整性校验。

校验内容：结构、声明计数、学科引用、概念 id 唯一性、依赖端点可解析、
无自依赖、无重复边、有向无环（无环检测）。任一失败即非零退出。

    python3 scripts/validate.py
"""
import json
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"


def load(name):
    with open(DATA / name, encoding="utf-8") as f:
        return json.load(f)


def main():
    errors = []

    def check(cond, msg):
        if not cond:
            errors.append(msg)

    subjects = load("subjects.json")
    concepts = load("concepts.json")
    deps = load("dependencies.json")

    # --- declared counts ---
    check(subjects.get("subjectCount") == len(subjects.get("subjects", [])),
          f"subjects: subjectCount {subjects.get('subjectCount')} != {len(subjects.get('subjects', []))}")
    check(concepts.get("conceptCount") == len(concepts.get("concepts", [])),
          f"concepts: conceptCount {concepts.get('conceptCount')} != {len(concepts.get('concepts', []))}")
    check(deps.get("edgeCount") == len(deps.get("dependencies", [])),
          f"dependencies: edgeCount {deps.get('edgeCount')} != {len(deps.get('dependencies', []))}")

    # --- subjects ---
    subject_keys = set()
    for s in subjects.get("subjects", []):
        check(isinstance(s.get("key"), str) and s["key"],
              f"subject missing key: {s}")
        check(isinstance(s.get("name"), str) and s["name"],
              f"subject {s.get('key')}: missing name")
        check(isinstance(s.get("color"), str) and s["color"].startswith("#"),
              f"subject {s.get('key')}: bad color {s.get('color')}")
        if s.get("key") in subject_keys:
            errors.append(f"duplicate subject key: {s['key']}")
        subject_keys.add(s["key"])

    # --- concepts ---
    concept_ids = set()
    grades = []
    for c in concepts.get("concepts", []):
        cid = c.get("id")
        check(isinstance(cid, str) and cid,
              f"concept missing id: {c}")
        check(c.get("subject") in subject_keys,
              f"concept {cid}: unknown subject {c.get('subject')}")
        check(isinstance(c.get("grade"), int) and 0 <= c["grade"] <= 6,
              f"concept {cid}: bad grade {c.get('grade')}")
        check(isinstance(c.get("domain"), str) and c["domain"],
              f"concept {cid}: missing domain")
        check(isinstance(c.get("title"), str) and c["title"],
              f"concept {cid}: missing title")
        check(isinstance(c.get("question"), str) and c["question"],
              f"concept {cid}: missing question")
        if cid in concept_ids:
            errors.append(f"duplicate concept id: {cid}")
        concept_ids.add(cid)
        grades.append(c["grade"])

    # --- dependencies: referential integrity + self + dup ---
    seen_edges = set()
    for d in deps.get("dependencies", []):
        t, p = d.get("topicId"), d.get("prerequisiteId")
        check(t in concept_ids, f"dependency references unknown topicId {t}")
        check(p in concept_ids, f"dependency references unknown prerequisiteId {p}")
        check(t != p, f"self-dependency on {t}")
        check(d.get("strength") in ("hard", "soft"), f"bad strength {d.get('strength')} at {t}->{p}")
        edge = (t, p)
        if edge in seen_edges:
            errors.append(f"duplicate edge {t} -> {p}")
        seen_edges.add(edge)

    # --- DAG: cycle detection (Kahn's algorithm) ---
    if not errors:
        from collections import defaultdict, deque
        adj = defaultdict(list)
        indeg = {cid: 0 for cid in concept_ids}
        for d in deps.get("dependencies", []):
            adj[d["prerequisiteId"]].append(d["topicId"])
            indeg[d["topicId"]] += 1
        q = deque([cid for cid, g in indeg.items() if g == 0])
        visited = 0
        while q:
            u = q.popleft()
            visited += 1
            for v in adj[u]:
                indeg[v] -= 1
                if indeg[v] == 0:
                    q.append(v)
        check(visited == len(concept_ids),
              f"dependency graph has a cycle (only {visited}/{len(concept_ids)} nodes reachable)")

    # --- report ---
    if errors:
        print(f"✗ {len(errors)} 个问题：", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        sys.exit(1)

    grade_min = min(grades) if grades else "-"
    grade_max = max(grades) if grades else "-"
    print(f"✓ 校验通过 — {len(concept_ids)} 个概念，{len(deps.get('dependencies', []))} 条依赖，"
          f"{len(subject_keys)} 个学科，年级 {grade_min}-{grade_max}。引用完整性 + 无环检测 OK。")


if __name__ == "__main__":
    main()
