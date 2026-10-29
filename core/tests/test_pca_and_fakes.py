"""The 2D PCA and the offline embedder and reranker."""

import numpy as np
import pytest

from highnet_core.pca import fit_pca, project
from highnet_core.providers.fake import (
    FakeEmbedder,
    FakeReranker,
    approx_tokens,
    hashed_vector,
    words,
)


def test_pca_finds_the_main_axis_and_projects_onto_it() -> None:
    vectors = np.array([[0.0, 0.0, 1.0], [2.0, 0.0, 1.0], [4.0, 0.1, 1.0]])
    mean, components, (pc1, pc2) = fit_pca(vectors)
    assert components.shape == (2, 3) and pc1 > 0.99 and pc1 + pc2 == pytest.approx(1.0)
    xy = project(vectors, mean, components)
    assert xy.shape == (3, 2) and abs(xy[0, 0] - xy[2, 0]) == pytest.approx(4.0, abs=0.01)


def test_pca_of_identical_or_one_dimensional_vectors() -> None:
    _, _, ratio = fit_pca(np.ones((3, 4)))
    assert ratio == (0.0, 0.0)
    _, components, (pc1, pc2) = fit_pca(np.array([[1.0], [3.0]]))
    assert components.shape == (1, 1) and (pc1, pc2) == (1.0, 0.0)


async def test_the_fake_embedder_is_a_deterministic_bag_of_words() -> None:
    assert words("The Normans, and castles") == ["norman", "castle"]
    assert approx_tokens("") == 1 and approx_tokens("one two three") == 4
    assert not hashed_vector("the and of", 16).any()
    result = await FakeEmbedder(16).embed(["Normans castles", "castles Normans"], "query")
    assert result.vectors.shape == (2, 16) and result.tokens == 6
    assert np.allclose(result.vectors[0], result.vectors[1])
    assert np.linalg.norm(result.vectors[0]) == pytest.approx(1.0)


async def test_the_fake_reranker_scores_word_overlap() -> None:
    ranked = await FakeReranker().rerank("norman castle", ["castle", "norman castle", "x"], 2)
    assert [r.index for r in ranked.results] == [1, 0]
    assert ranked.results[0].relevance == 1.0
    assert (await FakeReranker().rerank("", ["a"], 1)).results[0].relevance == 0.0
