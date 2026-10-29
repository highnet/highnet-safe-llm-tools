"""Scope's HTTP routes, mounted on the same FastAPI app as the RAG API (one Fly machine):

- `GET /api/scope/config`: presets, example messages, defaults, models, when it was recorded;
- `GET /api/scope/run`: one message through the twelve steps, as server-sent events.
"""

from typing import Annotated, Any

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse

from highnet_core.budget import budget_state, hash_ip
from highnet_core.providers.fake import FakeEmbedder
from highnet_core.providers.gateway import GatewayDecisionModel
from highnet_core.providers.voyage import VoyageClient, VoyageEmbedder
from highnet_core.sse import client_ip, event_stream
from highnet_core.storage.state import SqliteStateStore
from highnet_scope.config import ScopeSettings
from highnet_scope.fusion import Thresholds, Weights
from highnet_scope.models import (
    FakeDecisionModel,
    FakeTextModel,
    LiveModels,
    RecordedModels,
    ScopeModels,
)
from highnet_scope.pipeline import ScopeDeps, ScopeParams, run_scope
from highnet_scope.presets import TopicClass, all_presets
from highnet_scope.store import ScopeStore


def build_models(settings: ScopeSettings, store: ScopeStore) -> ScopeModels:
    if settings.fake_providers:
        embed, text = ("fake", FakeEmbedder.model), ("fake", FakeTextModel.model)
        decider = ("fake", FakeDecisionModel.model)
    else:
        embed = ("voyage", settings.voyage_embed_model)
        text = ("anthropic", settings.judge_model)
        decider = (GatewayDecisionModel.provider, settings.decision_model)
    if not settings.scope_live:
        return RecordedModels(store, embed, text, decider)
    from highnet_core.providers.claude import ClaudeTextModel

    if settings.fake_providers:
        return LiveModels(
            store,
            FakeEmbedder(settings.embed_dims),
            FakeTextModel(),
            FakeDecisionModel(),
            settings,
        )
    embedder = VoyageEmbedder(
        VoyageClient(settings), settings.voyage_embed_model, settings.embed_dims
    )
    return LiveModels(
        store,
        embedder,
        ClaudeTextModel(settings, settings.judge_model),
        GatewayDecisionModel(settings, settings.decision_model),
        settings,
    )


def build_scope_deps(settings: ScopeSettings) -> tuple[ScopeDeps | None, str | None]:
    """The deps, or why there are none (no `scope.sqlite` yet): the RAG API still starts."""
    try:
        store = ScopeStore(settings.scope_db_path, readonly=not settings.scope_live)
    except FileNotFoundError as exc:
        return None, str(exc)
    state = SqliteStateStore(settings.state_db_path)
    return ScopeDeps(settings, store, state, build_models(settings, store)), None


def parse_edit(edit: str) -> dict[str, TopicClass]:
    """`topic:class,topic:class` -> {topic: class}; anything malformed is a 422."""
    overrides: dict[str, TopicClass] = {}
    for part in filter(None, edit.split(",")):
        topic, _, cls = part.partition(":")
        if cls not in ("in", "adjacent", "out") or not topic:
            raise HTTPException(422, detail=f"Bad scope edit {part!r}: use topic:in|adjacent|out")
        overrides[topic] = cls  # type: ignore[assignment]
    return overrides


def get_scope(request: Request) -> ScopeDeps:
    deps: ScopeDeps | None = request.app.state.scope
    if deps is None:
        raise HTTPException(503, detail=request.app.state.scope_error or "Scope is not loaded.")
    return deps


def scope_router() -> APIRouter:
    router = APIRouter(prefix="/api/scope")

    @router.get("/config")
    def config(request: Request) -> dict[str, Any]:
        deps = get_scope(request)
        models = deps.models
        return {
            "presets": [p.model_dump(by_alias=True) for p in all_presets()],
            "examples": [
                {
                    "id": e.id,
                    "preset": e.preset,
                    "text": e.text,
                    "context": e.context,
                    "note": e.note,
                    "rag_question": e.rag_question,
                }
                for e in deps.store.examples()
            ],
            "defaults": {
                "weights": Weights().model_dump(),
                "thresholds": Thresholds().model_dump(),
                "k": ScopeParams.model_fields["k"].default,
            },
            "models": {
                "embed": {"provider": models.embed_provider, "model": models.embed_model},
                "judge": {"provider": models.text_provider, "model": models.text_model},
                "decide": {"provider": models.decide_provider, "model": models.decide_model},
            },
            "live": models.live,
            "illustrative": deps.settings.fake_providers,
            "recorded_at": deps.store.recorded_at(),
            "build": deps.store.meta(),
            "budget": budget_state(deps.state, deps.settings).as_dict(),
            "max_chars": deps.settings.scope_max_message_chars,
        }

    @router.get("/run")
    async def run(
        request: Request,
        preset: Annotated[str, Query(min_length=1, max_length=32)],
        example: Annotated[str | None, Query(max_length=64)] = None,
        text: Annotated[str | None, Query(max_length=4000)] = None,
        context: bool = True,
        rules: bool = True,
        knn: bool = True,
        judge: bool = True,
        decide: bool = True,
        w_rules: Annotated[float, Query(ge=0, le=1)] = Weights().rules,
        w_knn: Annotated[float, Query(ge=0, le=1)] = Weights().knn,
        w_judge: Annotated[float, Query(ge=0, le=1)] = Weights().judge,
        w_decide: Annotated[float, Query(ge=0, le=1)] = Weights().decide,
        t_block: Annotated[float, Query(ge=0, le=1)] = Thresholds().block,
        t_answer: Annotated[float, Query(ge=0, le=1)] = Thresholds().answer,
        t_brief: Annotated[float, Query(ge=0, le=1)] = Thresholds().brief,
        k: Annotated[int, Query(ge=1, le=15)] = 7,
        edit: Annotated[str, Query(max_length=600)] = "",
    ) -> StreamingResponse:
        deps = get_scope(request)
        if not deps.models.live and example is None:
            raise HTTPException(404, detail="Pick one of the listed messages.")
        params = ScopeParams(
            preset=preset,
            example_id=example,
            text=None if example else text,
            use_context=context,
            rules=rules,
            knn=knn,
            judge=judge,
            decide=decide,
            weights=Weights(rules=w_rules, knn=w_knn, judge=w_judge, decide=w_decide),
            thresholds=Thresholds(block=t_block, answer=t_answer, brief=t_brief),
            k=k,
            overrides=parse_edit(edit),
        )
        ip_hash = hash_ip(client_ip(request), deps.settings)
        return event_stream(run_scope(params, deps, ip_hash), deps.settings.sse_keepalive_seconds)

    return router
