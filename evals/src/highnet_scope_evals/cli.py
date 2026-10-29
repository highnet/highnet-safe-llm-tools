"""`highnet-scope-evals` command line: run, schema."""

import argparse
import asyncio
import json
import subprocess
from datetime import UTC, datetime
from pathlib import Path

RESULTS_DIR = Path("evals/results/scope")


def git_sha() -> str:
    try:
        return subprocess.run(
            ["git", "rev-parse", "HEAD"], capture_output=True, text=True, check=True
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return "unknown"


def cmd_run(args: argparse.Namespace) -> None:
    from highnet_scope.api import build_models
    from highnet_scope.config import get_scope_settings
    from highnet_scope.presets import PRESET_IDS
    from highnet_scope.store import ScopeStore
    from highnet_scope_evals.runner import ScopeEvaluator

    settings = get_scope_settings().model_copy(update={"scope_live": True})
    if args.fake:
        settings = settings.model_copy(update={"fake_providers": True, "embed_dims": 64})
    store = ScopeStore(Path(args.db or settings.scope_db_path), readonly=True)
    # The judge's calls are cached in their own file, so a rerun costs nothing.
    cache = ScopeStore(Path(args.cache))
    models = build_models(settings, cache)
    presets = tuple(args.presets.split(",")) if args.presets else PRESET_IDS
    evaluator = ScopeEvaluator(store, models, concurrency=args.concurrency)  # type: ignore[arg-type]
    results = asyncio.run(evaluator.run(git_sha(), presets, args.limit))

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    body = results.model_dump_json(indent=2) + "\n"
    day = datetime.now(UTC).strftime("%Y-%m-%d")
    (out / "latest.json").write_text(body, encoding="utf-8")
    (out / f"{day}.json").write_text(body, encoding="utf-8")
    details = "".join(json.dumps(d, ensure_ascii=False) + "\n" for d in evaluator.details)
    (out / f"{day}.details.jsonl").write_text(details, encoding="utf-8")
    print(f"\nWrote {out / 'latest.json'}, {day}.json and {day}.details.jsonl")
    for m in results.methods:
        r = m.rates
        print(
            f"  {m.method:6} accuracy {r.accuracy:.3f}  false refusal {r.false_refusal:.3f}  "
            f"over-compliance {r.over_compliance:.3f}  injections missed {r.injection_missed:.3f}"
        )
    for line in results.cost:
        print(f"  {line.provider}/{line.model}: {line.calls} calls, ${line.cost_usd:.4f}")
    print(f"  calls used by this run: ${results.total_usd:.4f}")


def cmd_schema(args: argparse.Namespace) -> None:
    from highnet_scope_evals.results import ScopeEvalResults

    schema = ScopeEvalResults.model_json_schema(mode="serialization")
    schema["title"] = "Scope eval results"
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(schema, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {out}")


def main() -> None:
    parser = argparse.ArgumentParser(prog="highnet-scope-evals")
    sub = parser.add_subparsers(required=True)

    p = sub.add_parser("run", help="score rules, kNN, the judge and the fused pipeline")
    p.add_argument("--db", default="", help="scope.sqlite (default: SCOPE_DB_PATH)")
    p.add_argument("--cache", default="data/scope-evals.sqlite", help="the judge's call cache")
    p.add_argument("--out", default=str(RESULTS_DIR))
    p.add_argument("--presets", default="", help="comma-separated preset ids (default: all)")
    p.add_argument("--limit", type=int, default=0, help="only the first N prompts per preset")
    p.add_argument("--concurrency", type=int, default=6)
    p.add_argument("--fake", action="store_true", help="offline stand-ins; illustrative numbers")
    p.set_defaults(func=cmd_run)

    p = sub.add_parser("schema", help="export the results JSON Schema for the frontend")
    p.add_argument("--out", default="web/lib/generated/scope-evals.schema.json")
    p.set_defaults(func=cmd_schema)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
