import json
import sys
from datetime import datetime
from pathlib import Path


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except json.JSONDecodeError as exc:
        print(f"prompt_log.py: invalid JSON input: {exc}", file=sys.stderr)
        return 0

    prompt = str(data.get("prompt") or "").strip()
    if not prompt:
        return 0

    cwd = Path(str(data.get("cwd") or Path.cwd())).resolve()
    project_name = cwd.name
    now = datetime.now()

    log_dir = cwd / "prompt-logs"
    log_dir.mkdir(exist_ok=True)

    log_file = log_dir / f"{now:%Y-%m-%d}.md"
    metadata = []
    if data.get("model"):
        metadata.append(f"model: `{data['model']}`")
    if data.get("session_id"):
        metadata.append(f"session: `{data['session_id']}`")
    if data.get("turn_id"):
        metadata.append(f"turn: `{data['turn_id']}`")

    metadata_block = ""
    if metadata:
        metadata_block = "\n" + " - ".join(metadata) + "\n"

    entry = f"## {now:%H:%M} - {project_name}\n{metadata_block}\n{prompt}\n\n---\n\n"
    with log_file.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(entry)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
