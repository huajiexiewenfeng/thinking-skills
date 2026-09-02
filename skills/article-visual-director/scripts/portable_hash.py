from __future__ import annotations

import hashlib
from pathlib import Path


def sha256_bytes(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def sha256_matches_file(
    path: Path,
    expected: str,
    *,
    normalize_line_endings: bool = False,
) -> bool:
    content = path.read_bytes()
    if sha256_bytes(content) == expected.lower():
        return True
    if not normalize_line_endings:
        return False

    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        return False

    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    candidates = (
        normalized.encode("utf-8"),
        normalized.replace("\n", "\r\n").encode("utf-8"),
    )
    return any(sha256_bytes(candidate) == expected.lower() for candidate in candidates)
