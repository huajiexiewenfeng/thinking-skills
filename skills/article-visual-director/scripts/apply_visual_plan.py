#!/usr/bin/env python3
"""Apply a validated visual manifest to a non-destructive Markdown copy."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import sys
import tempfile
from pathlib import Path
from typing import Any

from validate_manifest import load_manifest, validate_manifest


HEADING_RE = re.compile(r"^(#{1,6})[ \t]+.+?\s*$")
FENCE_RE = re.compile(r"^[ \t]*(`{3,}|~{3,})")
UTF8_BOM = b"\xef\xbb\xbf"


class ApplyVisualPlanError(RuntimeError):
    """A fail-closed integration error with a stable machine-readable code."""

    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(f"{code}: {message}")


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


def _headings(text: str) -> list[tuple[int, int, str]]:
    lines = _normalize_newlines(text).split("\n")
    start_index = _frontmatter_end(lines)
    headings: list[tuple[int, int, str]] = []
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
        if fence_character is not None:
            continue
        heading_match = HEADING_RE.match(line)
        if heading_match:
            headings.append((index, len(heading_match.group(1)), line))
    if fence_character is not None:
        raise ApplyVisualPlanError(
            "unterminated_code_fence", "Markdown contains an unterminated code fence"
        )
    return headings


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


def anchor_context_sha256(text: str, heading: str, occurrence: int) -> str:
    """Hash the normalized Markdown section identified by an exact heading."""
    normalized = _normalize_newlines(text)
    lines = normalized.split("\n")
    start, end = _find_anchor_section(normalized, heading, occurrence)
    context = "\n".join(lines[start:end]).rstrip("\n")
    return hashlib.sha256(context.encode("utf-8")).hexdigest()


def _decode_source(source_bytes: bytes, encoding: str) -> str:
    has_bom = source_bytes.startswith(UTF8_BOM)
    if encoding == "utf-8-sig" and not has_bom:
        raise ApplyVisualPlanError(
            "encoding_mismatch", "manifest expects UTF-8 BOM but the source has none"
        )
    if encoding == "utf-8" and has_bom:
        raise ApplyVisualPlanError(
            "encoding_mismatch", "source has UTF-8 BOM but manifest declares utf-8"
        )
    try:
        return source_bytes.decode("utf-8-sig" if has_bom else "utf-8")
    except UnicodeDecodeError as exc:
        raise ApplyVisualPlanError(
            "source_decode_failed", f"source is not valid UTF-8: {exc}"
        ) from exc


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


def _encode_output(text: str, encoding: str, line_ending: str) -> bytes:
    separator = "\r\n" if line_ending == "crlf" else "\n"
    normalized = _normalize_newlines(text)
    payload = normalized.replace("\n", separator).encode("utf-8")
    return UTF8_BOM + payload if encoding == "utf-8-sig" else payload


def _safe_markdown_text(value: str) -> str:
    return " ".join(value.splitlines()).strip()


def _image_block(asset: dict[str, Any]) -> list[str]:
    asset_id = asset["id"]
    alt = _safe_markdown_text(asset["alt"]).replace("]", "\\]")
    markdown_path = asset["markdown_path"].replace("\\", "/")
    block = [
        "",
        f"<!-- article-visual:{asset_id}:start -->",
        f"![{alt}]({markdown_path})",
    ]
    caption = asset.get("caption")
    if caption:
        block.append(f"*{_safe_markdown_text(caption)}*")
    block.extend([f"<!-- article-visual:{asset_id}:end -->", ""])
    return block


def _render_markdown(source_text: str, assets: list[dict[str, Any]]) -> str:
    normalized = _normalize_newlines(source_text)
    lines = normalized.split("\n")
    insertions: dict[int, list[list[str]]] = {}

    for asset in assets:
        asset_id = asset["id"]
        start_marker = f"<!-- article-visual:{asset_id}:start -->"
        end_marker = f"<!-- article-visual:{asset_id}:end -->"
        if start_marker in normalized or end_marker in normalized:
            if start_marker in normalized and end_marker in normalized:
                continue
            raise ApplyVisualPlanError(
                "incomplete_existing_marker",
                f"source contains only one marker for asset {asset_id}",
            )

        anchor = asset["anchor"]
        heading = anchor["heading"]
        occurrence = anchor["occurrence"]
        actual_context_hash = anchor_context_sha256(normalized, heading, occurrence)
        if actual_context_hash.lower() != anchor["context_sha256"].lower():
            raise ApplyVisualPlanError(
                "anchor_context_mismatch",
                f"section content changed for asset {asset_id} at {heading!r}",
            )
        start, end = _find_anchor_section(normalized, heading, occurrence)
        insertion_index = start + 1 if anchor["placement"] == "after_heading" else end
        insertions.setdefault(insertion_index, []).append(_image_block(asset))

    output_lines: list[str] = []
    for index in range(len(lines) + 1):
        for block in insertions.get(index, []):
            output_lines.extend(block)
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


def _resolve_output(
    manifest_path: Path, source_path: Path, output_path: Path | None
) -> Path:
    if output_path is None:
        return source_path.with_name(f"{source_path.stem}-illustrated{source_path.suffix}")
    return output_path if output_path.is_absolute() else manifest_path.parent / output_path


def apply_visual_plan(
    manifest_path: Path,
    output_path: Path | None = None,
    *,
    replace_output: bool = False,
) -> dict[str, Any]:
    """Verify, copy assets, and create an idempotent illustrated Markdown copy."""
    manifest_path = manifest_path.resolve()
    manifest = load_manifest(manifest_path)
    errors = validate_manifest(manifest, manifest_path, "integration")
    if errors:
        summary = "; ".join(
            f"{error['code']} at {error['path']}" for error in errors
        )
        raise ApplyVisualPlanError("manifest_invalid", summary)

    source_metadata = manifest["source"]
    source_path = (manifest_path.parent / source_metadata["path"]).resolve()
    if not source_path.is_file():
        raise ApplyVisualPlanError(
            "source_missing", f"source Markdown does not exist: {source_path}"
        )
    source_bytes = source_path.read_bytes()
    actual_source_hash = hashlib.sha256(source_bytes).hexdigest()
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
    source_text = _decode_source(source_bytes, source_metadata["encoding"])

    resolved_output = _resolve_output(manifest_path, source_path, output_path).resolve()
    if resolved_output == source_path:
        raise ApplyVisualPlanError(
            "source_output_collision", "output path must never overwrite the source Markdown"
        )

    rendered_text = _render_markdown(source_text, manifest["assets"])
    rendered_bytes = _encode_output(
        rendered_text, source_metadata["encoding"], source_metadata["line_ending"]
    )

    output_changed = not resolved_output.exists()
    if resolved_output.exists():
        current_output = resolved_output.read_bytes()
        if current_output != rendered_bytes:
            if not replace_output:
                raise ApplyVisualPlanError(
                    "output_conflict",
                    "illustrated output exists with different content; use --replace-output only after review",
                )
            output_changed = True
        else:
            output_changed = False

    copy_operations: list[tuple[Path, Path]] = []
    for asset in manifest["assets"]:
        artifact = (manifest_path.parent / asset["artifact_path"]).resolve()
        destination = (source_path.parent / asset["markdown_path"]).resolve()
        source_root = source_path.parent.resolve()
        try:
            destination.relative_to(source_root)
        except ValueError as exc:
            raise ApplyVisualPlanError(
                "asset_destination_escape",
                f"asset destination leaves the article directory: {destination}",
            ) from exc
        if destination.exists():
            if destination.read_bytes() != artifact.read_bytes():
                if not replace_output:
                    raise ApplyVisualPlanError(
                        "asset_output_conflict",
                        f"asset destination already has different content: {destination}",
                    )
                copy_operations.append((artifact, destination))
        else:
            copy_operations.append((artifact, destination))

    for artifact, destination in copy_operations:
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(artifact, destination)
    if output_changed:
        _atomic_write(resolved_output, rendered_bytes)

    manifest_changed = False
    for asset in manifest["assets"]:
        if asset.get("insertion_status") != "inserted":
            asset["insertion_status"] = "inserted"
            manifest_changed = True
    if manifest_changed:
        manifest_bytes = (
            json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
        ).encode("utf-8")
        _atomic_write(manifest_path, manifest_bytes)

    return {
        "ok": True,
        "changed": output_changed or bool(copy_operations) or manifest_changed,
        "output_path": resolved_output,
        "copied_assets": [str(destination) for _, destination in copy_operations],
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    parser.add_argument(
        "--replace-output",
        action="store_true",
        help="replace a conflicting illustrated copy or copied asset after explicit review",
    )
    args = parser.parse_args(argv)

    try:
        result = apply_visual_plan(
            args.manifest, args.output, replace_output=args.replace_output
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
