"""`highnet-scope` command line: ingest, record, export, schema."""

import argparse
import asyncio
import json
from pathlib import Path
from typing import Any

from highnet_scope.config import ScopeSettings, get_scope_settings

DATASET_OUT = Path("web/public/scope/dataset.json")
VERDICTS_OUT = Path("web/lib/generated/scope-verdicts.json")


def settings_for(args: argparse.Namespace) -> ScopeSettings:
    settings = get_scope_settings()
    update: dict[str, Any] = {"scope_db_path": Path(args.db)} if args.db else {}
    if getattr(args, "fake", False):
        update |= {"fake_providers": True, "embed_dims": 64}
    return settings.model_copy(update=update)


def live_models(settings: ScopeSettings, store: Any) -> Any:
    from highnet_scope.api import build_models

    return build_models(settings.model_copy(update={"scope_live": True}), store)


def cmd_ingest(args: argparse.Namespace) -> None:
    from highnet_scope.ingest import build_scope, load_examples, load_golden
    from highnet_scope.store import ScopeStore

    settings = settings_for(args)
    store = ScopeStore(settings.scope_db_path)
    models = live_models(settings, store)
    rows, examples = load_golden(Path(args.golden)), load_examples(Path(args.examples))
    asyncio.run(build_scope(rows, examples, store, models.embedder, settings))


def cmd_record(args: argparse.Namespace) -> None:
    from highnet_core.storage.state import SqliteStateStore
    from highnet_scope.pipeline import ScopeDeps
    from highnet_scope.recorder import record_examples
    from highnet_scope.store import ScopeStore

    settings = settings_for(args)
    store = ScopeStore(settings.scope_db_path)
    models = live_models(settings, store)
    examples = [e for e in store.examples() if not args.only or e.id in args.only.split(",")]
    deps = ScopeDeps(settings, store, SqliteStateStore(settings.state_db_path), models)
    report = asyncio.run(record_examples(examples, deps, models))
    print(f"\n{report.runs} runs recorded; {report.calls} calls paid, ${report.cost_usd:.6f}")
    for failure in report.failed:
        print(f"  failed: {failure}")
    if report.failed:
        raise SystemExit(1)


async def verdicts(settings: ScopeSettings) -> dict[str, Any]:
    """The default-settings Scope run of every message under the RAG corpus assistant preset,
    by example id and, for RAG's own recorded questions, by question id (RAG's request step)."""
    from highnet_core.trace import TraceEvent
    from highnet_scope.api import build_scope_deps
    from highnet_scope.pipeline import ScopeParams, run_scope

    deps, error = build_scope_deps(settings.model_copy(update={"scope_replay_speed": 1e9}))
    if deps is None:
        raise SystemExit(error)
    by_question: dict[str, Any] = {}
    by_example: dict[str, Any] = {}
    for example in deps.store.examples():
        if example.preset != "rag":
            continue
        steps: dict[str, TraceEvent] = {}
        params = ScopeParams(preset="rag", example_id=example.id)
        # One caller per run, so the export never meets the per-IP rate limit.
        async for item in run_scope(params, deps, f"export-{example.id}"):
            if isinstance(item, TraceEvent):
                steps[item.stage] = item
        judge = steps["judge"].data.get("verdict")
        verdict = {
            "example_id": example.id,
            "action": steps["thresholds"].data["action"],
            "scope_score": steps["thresholds"].data["scope_score"],
            "p_injection": steps["thresholds"].data["p_injection"],
            "label": steps["fuse"].data["label"],
            "confidence": steps["fuse"].data["confidence"],
            "judge": judge,
            "ms": sum(s.ms for s in steps.values()),
            "cost_usd": round(sum(s.cost_usd for s in steps.values()), 6),
        }
        by_example[example.id] = verdict
        if example.rag_question:
            by_question[example.rag_question] = verdict
    return {
        "recorded_at": deps.store.recorded_at(),
        "verdicts": by_question,
        "examples": by_example,
    }


def cmd_export(args: argparse.Namespace) -> None:
    from highnet_scope.presets import PRESET_IDS
    from highnet_scope.store import ScopeStore

    settings = settings_for(args)
    store = ScopeStore(settings.scope_db_path, readonly=True)
    meta = store.meta()
    presets: dict[str, Any] = {}
    for preset in PRESET_IDS:
        _, prompts = store.prompts(preset)
        presets[preset] = {
            "explained_variance": list(store.projection(preset).explained_variance),
            "rows": [
                {
                    "id": p.id,
                    "label": p.label,
                    "topic": p.topic,
                    "text": p.text,
                    "context": p.context,
                    "tags": p.tags,
                    "lang": p.lang,
                    "x": round(p.x, 5),
                    "y": round(p.y, 5),
                }
                for p in prompts
            ],
        }
    body = {
        "build": {k: meta[k] for k in ("build_id", "built_at", "embed_model", "prompts")},
        "drafted_by": "Claude",
        "presets": presets,
    }
    out = Path(args.dataset_out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(body, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"Wrote {out}")
    found = asyncio.run(verdicts(settings))
    vout = Path(args.verdicts_out)
    vout.parent.mkdir(parents=True, exist_ok=True)
    vout.write_text(json.dumps(found, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {vout} ({len(found['verdicts'])} RAG questions)")


def cmd_schema(args: argparse.Namespace) -> None:
    from pydantic.json_schema import models_json_schema

    from highnet_core.trace import RunDone
    from highnet_scope.trace import ScopeTraceEvent

    _, schema = models_json_schema(
        [(ScopeTraceEvent, "serialization"), (RunDone, "serialization")],
        title="Scope trace events",
    )
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(schema, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {out}")


def main() -> None:
    parser = argparse.ArgumentParser(prog="highnet-scope")
    sub = parser.add_subparsers(required=True)

    p = sub.add_parser("ingest", help="embed the labeled prompts and build scope.sqlite")
    p.add_argument("--golden", default="evals/golden/scope")
    p.add_argument("--examples", default="recordings/scope/examples.json")
    p.add_argument("--db", default="", help="scope.sqlite (default: SCOPE_DB_PATH)")
    p.add_argument("--fake", action="store_true", help="offline embeddings; illustrative only")
    p.set_defaults(func=cmd_ingest)

    p = sub.add_parser("record", help="record every example message with the real models")
    p.add_argument("--db", default="")
    p.add_argument("--only", default="", help="comma-separated example ids")
    p.add_argument("--fake", action="store_true")
    p.set_defaults(func=cmd_record)

    p = sub.add_parser("export", help="write the dataset JSON and RAG verdicts for the web app")
    p.add_argument("--db", default="")
    p.add_argument("--dataset-out", default=str(DATASET_OUT))
    p.add_argument("--verdicts-out", default=str(VERDICTS_OUT))
    p.add_argument("--fake", action="store_true")
    p.set_defaults(func=cmd_export)

    p = sub.add_parser("schema", help="export Scope's trace-event JSON Schema for the frontend")
    p.add_argument("--out", default="web/lib/generated/scope-trace.schema.json")
    p.set_defaults(func=cmd_schema)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
