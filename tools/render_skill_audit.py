"""Render a dated skill audit from its authored evidence and HTML template."""

import argparse
import csv
import html
import io
import json
from collections import Counter
from pathlib import Path


STATUS_CLASSES = {
    "明确证据": "used",
    "历史使用": "historical",
    "间接证据": "indirect",
    "未见明确证据": "missing",
    "无法判定": "unknown",
}
STATUS_ORDER = ["未见明确证据", "间接证据", "明确证据", "历史使用", "无法判定"]


def load_report(source):
    report = json.loads((source / "metadata.json").read_text(encoding="utf-8"))
    records = []
    for path in sorted(source.glob("task-*.json")) + sorted(source.glob("principle-*.json")):
        records.extend(json.loads(path.read_text(encoding="utf-8")))
    if len({row["name"] for row in records}) != len(records):
        raise ValueError("Duplicate skill in audit evidence")
    if dict(Counter(row["status"] for row in records)) != report["counts"]:
        raise ValueError("Evidence does not match the recorded status counts")
    report["skills"] = sorted(records, key=lambda row: row["name"])
    return report


def render_row(row, removed):
    escape = html.escape
    name = escape(row["name"])
    if row["name"] in removed:
        skill = f'<span class="skill">{name}（已移除）</span>'
    else:
        skill = f'<a class="skill" href="{escape(row["source"])}">{name}</a>'
    evidence = "".join(
        f'<li><a href="{escape(item["url"])}">{escape(item["session_id"][:8])}'
        f' · 消息 {item["index"]}</a> — {escape(item["note"])}</li>'
        for item in row["evidence"]
    ) or "<li>未找到可引用的明确采用声明。</li>"
    candidate = row["kind"] == "任务" and row["status"] in STATUS_ORDER[:2]
    return (
        f'<tr data-state="{escape(row["status"])}" data-kind="{escape(row["kind"])}"'
        f' data-candidate="{str(candidate).lower()}"><td>{skill}'
        f'<small>{escape(row["kind"])} · 加入于 {escape(row["added"])}</small></td>'
        f'<td><span class="tag {STATUS_CLASSES[row["status"]]}">{escape(row["status"])}</span>'
        '<details><summary>原因与证据</summary>'
        f'<p>{escape(row["reason"])}</p><ul>{evidence}</ul></details></td>'
        f'<td>{escape(row["action"])}</td></tr>'
    )


def render_csv(records):
    output = io.StringIO(newline="")
    writer = csv.writer(output, lineterminator="\n")
    writer.writerow(["技能", "类型", "状态", "优先级", "原因", "建议", "证据", "加入日期", "源文件SHA256"])
    for row in records:
        evidence = "; ".join(
            item["url"] + " #message-" + str(item["index"])
            for item in row["evidence"]
        )
        writer.writerow([
            row["name"], row["kind"], row["status"], row["priority"],
            row["reason"], row["action"], evidence, row["added"], row["sha256"],
        ])
    return output.getvalue().encode("utf-8-sig")


def render(source):
    report = load_report(source)
    rows = sorted(report["skills"], key=lambda row: (STATUS_ORDER.index(row["status"]), row["name"]))
    page = (source / "report.template.html").read_text(encoding="utf-8")
    replacements = {
        "__ROWS__": "\n".join(render_row(row, report.get("removed_after_audit", [])) for row in rows),
        "__STYLE__": (source / "report.css").read_text(encoding="utf-8").rstrip("\n"),
        "__SCRIPT__": (source / "report.js").read_text(encoding="utf-8").rstrip("\n"),
    }
    for placeholder, content in replacements.items():
        if page.count(placeholder) != 1:
            raise ValueError(f"Expected one {placeholder} in report template")
        page = page.replace(placeholder, content)
    return {
        ".html": page.encode("utf-8"),
        ".csv": render_csv(report["skills"]),
        ".json": (json.dumps(report, ensure_ascii=False, indent=2) + "\n").encode("utf-8"),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Dated audit source directory")
    parser.add_argument("--check", action="store_true", help="Check exports without changing them")
    args = parser.parse_args()
    for suffix, content in render(args.source).items():
        target = args.source.parent / (args.source.name + suffix)
        if args.check:
            if not target.is_file() or target.read_bytes() != content:
                raise SystemExit(f"Stale audit export: {target}")
        else:
            target.write_bytes(content)
    print(f"{'Checked' if args.check else 'Rendered'} 3 audit exports: {args.source.name}")


if __name__ == "__main__":
    main()
