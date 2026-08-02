#!/usr/bin/env python3
"""Apply a validated visual manifest to a guarded Markdown output."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import tempfile
from pathlib import Path
from typing import Any, Iterator

from validate_manifest import load_manifest, validate_manifest


HEADING_RE = re.compile(r"^(#{1,6})[ \t]+.+?\s*$")
FENCE_RE = re.compile(r"^[ \t]*(`{3,}|~{3,})")
START_MARKER_RE = re.compile(r"^<!-- article-visual:start ([a-z0-9]+(?:-[a-z0-9]+)*) -->$")
END_MARKER_RE = re.compile(r"^<!-- article-visual:end ([a-z0-9]+(?:-[a-z0-9]+)*) -->$")
UTF8_BOM = b"\xef\xbb\xbf"


class ApplyVisualPlanError(RuntimeError):
    """A fail-closed integration error with a stable machine-readable code."""

    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(f"{code}: {message}")


def sha256_bytes(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def _normalize_newlines(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n")


def _frontmatter_end(lines: list[str]) -> int:
    if not lines or lines[0].strip() != "---":
        return 0
    for index in range(1, len(lines)):
        if lines[index].strip() in {"---", "..."}:
            return index + 1
    raise ApplyVisualPlanError(
        "unterminated_frontmatter", "Markdown frontmatter has no closing delimiter"
    )


def _unprotected_lines(lines: list[str]) -> Iterator[tuple[int, str]]:
    start_index = _frontmatter_end(lines)
    fence_character: str | None = None
    fence_length = 0
    for index, line in enumerate(lines):
        if index < start_index:
            continue
        fence_match = FENCE_RE.match(line)
        if fence_match:
            marker = fence_match.group(1)
            if fence_character is None:
                fence_character = marker[0]
                fence_length = len(marker)
            elif marker[0] == fence_character and len(marker) >= fence_length:
                fence_character = None
                fence_length = 0
            continue
        if fence_character is None:
            yield index, line
    if fence_character is not None:
        raise ApplyVisualPlanError(
            "unterminated_code_fence", "Markdown contains an unterminated code fence"
        )


def _headings(text: str) -> list[tuple[int, int, str]]:
    lines = _normalize_newlines(text).split("\n")
    headings: list[tuple[int, int, str]] = []
    for index, line in _unprotected_lines(lines):
        heading_match = HEADING_RE.match(line)
        if heading_match:
            headings.append((index, len(heading_match.group(1)), line))
    return headings


def find_headings(lines: list[str]) -> list[tuple[int, str]]:
    """Return ATX headings outside frontmatter and fenced code blocks."""
    return [(index, line) for index, _, line in _headings("\n".join(lines))]


def _find_anchor_section(
    text: str, heading: str, occurrence: int
) -> tuple[int, int]:
    headings = _headings(text)
    matches = [item for item in headings if item[2] == heading]
    if occurrence < 1 or len(matches) < occurrence:
        raise ApplyVisualPlanError(
            "anchor_not_found",
            f"could not find occurrence {occurrence} of exact heading {heading!r}",
        )
    start, level, _ = matches[occurrence - 1]
    end = len(_normalize_newlines(text).split("\n"))
    for next_start, next_level, _ in headings:
        if next_start > start and next_level <= level:
            end = next_start
            break
    return start, end


def section_context_sha256(
    lines: list[str], heading_index: int, next_heading_index: int
) -> str:
    context = "\n".join(lines[heading_index:next_heading_index]).rstrip("\n")
    return hashlib.sha256(context.encode("utf-8")).hexdigest()


def anchor_context_sha256(text: str, heading: str, occurrence: int) -> str:
    """Hash the normalized Markdown section identified by an exact heading."""
    normalized = _normalize_newlines(text)
    lines = normalized.split("\n")
    start, end = _find_anchor_section(normalized, heading, occurrence)
    return section_context_sha256(lines, start, end)


def decode_source(content: bytes, encoding: str) -> tuple[str, bytes]:
    """Decode declared UTF-8 while returning the exact BOM prefix."""
    has_bom = content.startswith(UTF8_BOM)
    if encoding == "utf-8-sig" and not has_bom:
        raise ApplyVisualPlanError(
            "encoding_mismatch", "manifest expects UTF-8 BOM but the source has none"
        )
    if encoding == "utf-8" and has_bom:
        raise ApplyVisualPlanError(
            "encoding_mismatch", "source has UTF-8 BOM but manifest declares utf-8"
        )
    if encoding not in {"utf-8", "utf-8-sig"}:
        raise ApplyVisualPlanError(
            "unsupported_encoding", "encoding must be utf-8 or utf-8-sig"
        )
    try:
        text = content.decode("utf-8-sig" if has_bom else "utf-8")
    except UnicodeDecodeError as exc:
        raise ApplyVisualPlanError(
            "source_decode_failed", f"source is not valid UTF-8: {exc}"
        ) from exc
    return text, UTF8_BOM if has_bom else b""


def _detect_line_ending(source_bytes: bytes) -> str:
    without_crlf = source_bytes.replace(b"\r\n", b"")
    if b"\r" in without_crlf:
        raise ApplyVisualPlanError(
            "mixed_line_endings", "source contains unsupported bare CR line endings"
        )
    if b"\n" in without_crlf and b"\r\n" in source_bytes:
        raise ApplyVisualPlanError(
            "mixed_line_endings", "source mixes LF and CRLF line endings"
        )
    return "crlf" if b"\r\n" in source_bytes else "lf"


def _encode_output(text: str, bom: bytes, line_ending: str) -> bytes:
    separator = "\r\n" if line_ending == "crlf" else "\n"
    normalized = _normalize_newlines(text)
    return bom + normalized.replace("\n", separator).encode("utf-8")


def _safe_markdown_text(value: str) -> str:
    return " ".join(value.splitlines()).strip()


def render_asset_block(asset: dict[str, Any], newline: str) -> str:
    """Render one stable Markdown insertion block."""
    asset_id = asset["id"]
    alt = _safe_markdown_text(asset["alt"]).replace("]", "\\]")
    markdown_path = asset["markdown_path"].replace("\\", "/")
    lines = [
        "",
        f"<!-- article-visual:start {asset_id} -->",
        f"![{alt}]({markdown_path})",
    ]
    caption = asset.get("caption")
    if caption:
        lines.append(f"*{_safe_markdown_text(caption)}*")
    lines.extend([f"<!-- article-visual:end {asset_id} -->", ""])
    return newline.join(lines)


def _marker_state(text: str, asset_ids: list[str]) -> str:
    """Return none/all, or fail closed for any partial or malformed marker set."""
    lines = _normalize_newlines(text).split("\n")
    expected = set(asset_ids)
    starts: dict[str, list[int]] = {}
    ends: dict[str, list[int]] = {}
    events: list[tuple[str, str, int]] = []
    for index, line in _unprotected_lines(lines):
        start_match = START_MARKER_RE.fullmatch(line)
        end_match = END_MARKER_RE.fullmatch(line)
        if start_match:
            starts.setdefault(start_match.group(1), []).append(index)
            events.append(("start", start_match.group(1), index))
        elif end_match:
            ends.setdefault(end_match.group(1), []).append(index)
            events.append(("end", end_match.group(1), index))

    observed = set(starts) | set(ends)
    if not observed:
        return "none"
    if observed - expected:
        raise ApplyVisualPlanError(
            "partial_integration",
            f"unexpected article-visual markers: {sorted(observed - expected)}",
        )
    open_asset: str | None = None
    for event, asset_id, _ in events:
        if event == "start":
            if open_asset is not None:
                raise ApplyVisualPlanError(
                    "partial_integration",
                    f"nested or interleaved markers for {open_asset} and {asset_id}",
                )
            open_asset = asset_id
        elif open_asset != asset_id:
            raise ApplyVisualPlanError(
                "partial_integration",
                f"marker end for {asset_id} does not match open marker {open_asset}",
            )
        else:
            open_asset = None
    if open_asset is not None:
        raise ApplyVisualPlanError(
            "partial_integration", f"marker for {open_asset} has no matching end"
        )
    complete: set[str] = set()
    for asset_id in expected:
        start_positions = starts.get(asset_id, [])
        end_positions = ends.get(asset_id, [])
        if (
            len(start_positions) == 1
            and len(end_positions) == 1
            and start_positions[0] < end_positions[0]
        ):
            complete.add(asset_id)
        elif start_positions or end_positions:
            raise ApplyVisualPlanError(
                "partial_integration",
                f"incomplete, duplicated, or misordered markers for {asset_id}",
            )
    if complete == expected:
        return "all"
    raise ApplyVisualPlanError(
        "partial_integration",
        f"only {len(complete)} of {len(expected)} assets are integrated",
    )


def _render_markdown(source_text: str, assets: list[dict[str, Any]]) -> str:
    normalized = _normalize_newlines(source_text)
    lines = normalized.split("\n")
    insertions: dict[int, list[str]] = {}
    for asset in assets:
        anchor = asset["anchor"]
        heading = anchor["heading"]
        occurrence = anchor["occurrence"]
        actual_context_hash = anchor_context_sha256(normalized, heading, occurrence)
        if actual_context_hash.lower() != anchor["context_sha256"].lower():
            raise ApplyVisualPlanError(
                "anchor_context_mismatch",
                f"section content changed for asset {asset['id']} at {heading!r}",
            )
        start, end = _find_anchor_section(normalized, heading, occurrence)
        insertion_index = start + 1 if anchor["placement"] == "after_heading" else end
        insertions.setdefault(insertion_index, []).append(
            render_asset_block(asset, "\n")
        )

    output_lines: list[str] = []
    for index in range(len(lines) + 1):
        for block in insertions.get(index, []):
            output_lines.extend(block.split("\n"))
        if index < len(lines):
            output_lines.append(lines[index])
    return "\n".join(output_lines)


def _atomic_write(path: Path, content: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    file_descriptor, temporary_name = tempfile.mkstemp(
        prefix=f".{path.name}.", suffix=".tmp", dir=path.parent
    )
    try:
        with os.fdopen(file_descriptor, "wb") as handle:
            handle.write(content)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary_name, path)
    finally:
        temporary_path = Path(temporary_name)
        if temporary_path.exists():
            temporary_path.unlink()


def versioned_path(path: Path) -> Path:
    """Return path when absent, otherwise the first available -vN sibling."""
    if not path.exists():
        return path
    version = 2
    while True:
        candidate = path.with_name(f"{path.stem}-v{version}{path.suffix}")
        if not candidate.exists():
            return candidate
        version += 1


def _mark_inserted(
    manifest: dict[str, Any], manifest_path: Path, output_path: Path
) -> bool:
    changed = False
    for asset in manifest["assets"]:
        if asset.get("insertion_status") != "inserted":
            asset["insertion_status"] = "inserted"
            changed = True
    integration = manifest.setdefault("integration", {})
    if integration.get("status") != "complete":
        integration["status"] = "complete"
        changed = True
    if integration.get("verification_status") != "passed":
        integration["verification_status"] = "passed"
        changed = True
    manifest_root = manifest_path.parent.resolve()
    source_value = manifest.get("source", {}).get("path")
    source_path = (
        (manifest_root / source_value).resolve() if source_value else None
    )
    if output_path.resolve() != source_path:
        try:
            actual_relative = output_path.resolve().relative_to(manifest_root).as_posix()
        except ValueError as exc:
            raise ApplyVisualPlanError(
                "output_path_escape",
                f"actual output cannot be persisted outside the manifest directory: {output_path}",
            ) from exc
        outputs = manifest.setdefault("outputs", {})
        if outputs.get("actual_illustrated_markdown") != actual_relative:
            outputs["actual_illustrated_markdown"] = actual_relative
            changed = True
    if changed:
        manifest_bytes = (
            json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
        ).encode("utf-8")
        _atomic_write(manifest_path, manifest_bytes)
    return changed


def _resolve_relative(path: Path, base: Path) -> Path:
    return path.resolve() if path.is_absolute() else (base / path).resolve()


def _require_contained(path: Path, root: Path, code: str, label: str) -> None:
    try:
        path.relative_to(root)
    except ValueError as exc:
        raise ApplyVisualPlanError(code, f"{label} escapes its allowed root: {path}") from exc


def _plan_asset_copies(
    manifest: dict[str, Any],
    manifest_path: Path,
    source_path: Path,
    requested_output: Path,
    actual_output: Path,
) -> list[tuple[Path, Path]]:
    manifest_root = manifest_path.parent.resolve()
    article_root = source_path.parent.resolve()
    protected = {
        source_path.resolve(),
        manifest_path.resolve(),
        requested_output.resolve(),
        actual_output.resolve(),
    }
    artifacts: list[Path] = []
    destinations: list[Path] = []
    for asset in manifest["assets"]:
        artifact = (manifest_root / asset["artifact_path"]).resolve()
        destination = (article_root / asset["markdown_path"]).resolve()
        _require_contained(
            artifact,
            manifest_root,
            "artifact_path_escape",
            f"artifact {asset['id']}",
        )
        _require_contained(
            destination,
            article_root,
            "asset_destination_escape",
            f"destination {asset['id']}",
        )
        artifacts.append(artifact)
        destinations.append(destination)

    artifact_set = set(artifacts)
    if artifact_set & protected:
        collision = next(iter(artifact_set & protected))
        raise ApplyVisualPlanError(
            "artifact_path_collision", f"artifact collides with a protected file: {collision}"
        )
    if len(destinations) != len(set(destinations)):
        raise ApplyVisualPlanError(
            "duplicate_asset_destination", "two assets resolve to the same Markdown path"
        )
    for destination in destinations:
        if destination in protected or destination in artifact_set:
            raise ApplyVisualPlanError(
                "asset_destination_collision",
                f"asset destination collides with a protected or source artifact file: {destination}",
            )

    operations: list[tuple[Path, Path]] = []
    for artifact, destination in zip(artifacts, destinations, strict=True):
        if not artifact.is_file():
            raise ApplyVisualPlanError(
                "artifact_missing", f"validated artifact is missing: {artifact}"
            )
        if destination.exists():
            if destination.read_bytes() != artifact.read_bytes():
                raise ApplyVisualPlanError(
                    "asset_output_conflict",
                    f"asset destination already has different content: {destination}",
                )
        else:
            operations.append((artifact, destination))
    return operations


def _verify_integrated_assets(
    manifest: dict[str, Any], manifest_path: Path, article_path: Path
) -> None:
    manifest_root = manifest_path.parent.resolve()
    article_root = article_path.parent.resolve()
    for asset in manifest["assets"]:
        artifact = (manifest_root / asset["artifact_path"]).resolve()
        destination = (article_root / asset["markdown_path"]).resolve()
        if not destination.is_file():
            raise ApplyVisualPlanError(
                "integrated_asset_missing",
                f"marker exists but published asset is missing: {destination}",
            )
        if destination.read_bytes() != artifact.read_bytes():
            raise ApplyVisualPlanError(
                "integrated_asset_mismatch",
                f"marker exists but published asset differs from the validated artifact: {destination}",
            )


def apply_plan(
    manifest_path: Path,
    source_path: Path,
    output_path: Path,
    allow_source_overwrite: bool = False,
) -> dict[str, Any]:
    """Apply one integration-ready manifest with explicit source and output paths."""
    manifest_path = manifest_path.resolve()
    source_path = source_path.resolve()
    requested_output = output_path.resolve()
    _require_contained(
        source_path,
        manifest_path.parent.resolve(),
        "source_path_escape",
        "source",
    )
    _require_contained(
        requested_output,
        manifest_path.parent.resolve(),
        "output_path_escape",
        "output",
    )
    manifest = load_manifest(manifest_path)
    errors = validate_manifest(manifest, manifest_path, "integration")
    if errors:
        summary = "; ".join(
            f"{error['code']} at {error['path']}" for error in errors
        )
        raise ApplyVisualPlanError(errors[0]["code"], summary)
    if not source_path.is_file():
        raise ApplyVisualPlanError(
            "source_missing", f"source Markdown does not exist: {source_path}"
        )

    source_metadata = manifest["source"]
    source_bytes = source_path.read_bytes()
    source_text, bom = decode_source(source_bytes, source_metadata["encoding"])
    marker_state = _marker_state(
        source_text, [asset["id"] for asset in manifest["assets"]]
    )
    if marker_state == "all":
        _verify_integrated_assets(manifest, manifest_path, source_path)
        manifest_changed = _mark_inserted(manifest, manifest_path, source_path)
        return {
            "ok": True,
            "status": "unchanged",
            "changed": False,
            "manifest_changed": manifest_changed,
            "output_path": source_path,
            "copied_assets": [],
        }

    if source_path == requested_output and not allow_source_overwrite:
        raise ApplyVisualPlanError(
            "source_output_collision",
            "source overwrite requires the explicit --allow-source-overwrite flag",
        )
    actual_source_hash = sha256_bytes(source_bytes)
    if actual_source_hash.lower() != source_metadata["sha256"].lower():
        raise ApplyVisualPlanError(
            "source_hash_mismatch",
            "source bytes changed after the visual manifest was approved",
        )
    actual_line_ending = _detect_line_ending(source_bytes)
    if actual_line_ending != source_metadata["line_ending"]:
        raise ApplyVisualPlanError(
            "line_ending_mismatch",
            f"manifest declares {source_metadata['line_ending']} but source is {actual_line_ending}",
        )

    if source_path == requested_output:
        actual_output = requested_output
    else:
        actual_output = versioned_path(requested_output)

    rendered_text = _render_markdown(source_text, manifest["assets"])
    rendered_bytes = _encode_output(rendered_text, bom, source_metadata["line_ending"])
    copy_operations = _plan_asset_copies(
        manifest, manifest_path, source_path, requested_output, actual_output
    )

    for artifact, destination in copy_operations:
        _atomic_write(destination, artifact.read_bytes())
    _atomic_write(actual_output, rendered_bytes)
    manifest_changed = _mark_inserted(manifest, manifest_path, actual_output)
    return {
        "ok": True,
        "status": "created",
        "changed": True,
        "manifest_changed": manifest_changed,
        "output_path": actual_output,
        "copied_assets": [str(destination) for _, destination in copy_operations],
    }


def apply_visual_plan(
    manifest_path: Path, output_path: Path | None = None
) -> dict[str, Any]:
    """Apply using the manifest source and the default illustrated sibling."""
    manifest_path = manifest_path.resolve()
    manifest = load_manifest(manifest_path)
    source_path = (manifest_path.parent / manifest["source"]["path"]).resolve()
    recorded_output = manifest.get("outputs", {}).get("actual_illustrated_markdown")
    if recorded_output:
        actual_output = _resolve_relative(Path(recorded_output), manifest_path.parent)
        if not actual_output.is_file():
            raise ApplyVisualPlanError(
                "recorded_output_missing",
                f"manifest records an illustrated output that no longer exists: {actual_output}",
            )
        return apply_plan(manifest_path, actual_output, actual_output)
    if output_path is not None:
        requested_output = _resolve_relative(output_path, manifest_path.parent)
    else:
        configured_output = manifest.get("outputs", {}).get("illustrated_markdown")
        requested_output = (
            _resolve_relative(Path(configured_output), manifest_path.parent)
            if configured_output
            else source_path.with_name(
                f"{source_path.stem}-illustrated{source_path.suffix}"
            )
        )

    if requested_output.exists() and requested_output != source_path:
        try:
            probe_text = requested_output.read_bytes().decode("utf-8-sig")
        except UnicodeDecodeError:
            probe_text = ""
        state = _marker_state(
            probe_text, [asset["id"] for asset in manifest.get("assets", [])]
        )
        if state == "all":
            return apply_plan(manifest_path, requested_output, requested_output)
    return apply_plan(manifest_path, source_path, requested_output)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--source", type=Path)
    parser.add_argument("--out", "--output", dest="output", type=Path)
    parser.add_argument(
        "--allow-source-overwrite",
        action="store_true",
        help="allow --source and --out to name the same file after explicit approval",
    )
    args = parser.parse_args(argv)

    try:
        if args.source is None:
            if args.allow_source_overwrite:
                raise ApplyVisualPlanError(
                    "missing_explicit_source",
                    "--allow-source-overwrite requires explicit --source and --out paths",
                )
            result = apply_visual_plan(args.manifest, args.output)
        else:
            manifest_base = args.manifest.resolve().parent
            source = _resolve_relative(args.source, manifest_base)
            output = (
                _resolve_relative(args.output, manifest_base)
                if args.output is not None
                else source.with_name(f"{source.stem}-illustrated{source.suffix}")
            )
            result = apply_plan(
                args.manifest,
                source,
                output,
                allow_source_overwrite=args.allow_source_overwrite,
            )
    except (ApplyVisualPlanError, OSError, UnicodeError, json.JSONDecodeError) as exc:
        payload = {
            "ok": False,
            "error": getattr(exc, "code", "apply_failed"),
            "message": str(exc),
        }
        json.dump(payload, sys.stdout, ensure_ascii=False, indent=2)
        sys.stdout.write("\n")
        return 1

    serializable = dict(result)
    serializable["output_path"] = str(serializable["output_path"])
    json.dump(serializable, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
