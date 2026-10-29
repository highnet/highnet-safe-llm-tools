"""Two-component PCA in plain numpy, fitted at ingest; the same transform places each query
on a 2D map at request time (the RAG corpus map, the Scope map)."""

import numpy as np


# snippet: map_project | Fit PCA at ingest
def fit_pca(vectors: np.ndarray) -> tuple[np.ndarray, np.ndarray, tuple[float, float]]:
    """Returns (mean, components with shape (2, dims), explained variance ratio of PC1, PC2)."""
    x = vectors.astype(np.float64)
    mean = x.mean(axis=0)
    centered = x - mean
    _, singular, vt = np.linalg.svd(centered, full_matrices=False)
    variance = singular**2
    ratio = variance / variance.sum() if variance.sum() else variance
    return (
        mean.astype(np.float32),
        vt[:2].astype(np.float32),
        (float(ratio[0]), float(ratio[1]) if len(ratio) > 1 else 0.0),
    )


# /snippet


def project(vectors: np.ndarray, mean: np.ndarray, components: np.ndarray) -> np.ndarray:
    return (vectors - mean) @ components.T
