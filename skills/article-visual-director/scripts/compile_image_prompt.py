from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


STYLE_PACK_VERSION = 3
VALID_ASSET_ROLES = {"cover", "concept", "diagram"}
REQUIRED_NON_COPY_FIELDS = {"labels", "numbers", "nodes", "topology", "example_story"}
REQUIRED_PROMPT_BLOCKS = (
    "OUTPUT CONTRACT",
    "ARTICLE SEMANTICS",
    "ROLE COMPOSITION",
    "VISUAL DNA",
    "REFERENCE CONTRACT",
    "TEXT POLICY",
    "NEGATIVE CONSTRAINTS",
    "ACCEPTANCE CHECK",
)
BLOCK_FIELDS = {
    "OUTPUT CONTRACT": "output_contract",
    "ARTICLE SEMANTICS": "semantics",
    "ROLE COMPOSITION": "role_composition",
    "VISUAL DNA": "visual_dna",
    "REFERENCE CONTRACT": "reference_contract",
    "TEXT POLICY": "text_policy",
    "NEGATIVE CONSTRAINTS": "negative_constraints",
    "ACCEPTANCE CHECK": "acceptance_checks",
}


class PromptCompileError(ValueError):
    pass


def _error(code: str, path: str, message: str) -> dict[str, str]:
    return {"code": code, "path": path, "message": message}


def _raise_compile_error(code: str, path: str, message: str) -> None:
    raise PromptCompileError(
        json.dumps(_error(code, path, message), ensure_ascii=False)
    )


def _load_json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        _raise_compile_error("STYLE_IDENTITY_DRIFT", str(path), str(exc))
    if not isinstance(data, dict):
        _raise_compile_error(
            "STYLE_IDENTITY_DRIFT", str(path), "Expected a JSON object."
        )
    return data


def _safe_child(base: Path, relative: object, path: str) -> Path:
    if not isinstance(relative, str) or not relative or Path(relative).is_absolute():
        _raise_compile_error(
            "STYLE_IDENTITY_DRIFT", path, "Style Pack path must be relative."
        )
    base = base.resolve()
    target = (base / relative).resolve()
    try:
        target.relative_to(base)
    except ValueError:
        _raise_compile_error(
            "STYLE_IDENTITY_DRIFT",
            path,
            "Style Pack path must remain inside the Skill root.",
        )
    if not target.is_file():
        _raise_compile_error(
            "STYLE_IDENTITY_DRIFT", path, f"Style Pack file is missing: {relative}"
        )
    return target


def _dedupe_strings(*values: object) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for value in values:
        if not isinstance(value, list):
            continue
        for item in value:
            if isinstance(item, str) and item.strip() and item not in seen:
                seen.add(item)
                result.append(item)
    return result


def _load_registered_pack(
    skill_root: Path, profile_id: object
) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any], dict[str, Any]]:
    registry = _load_json(skill_root / "references" / "style-registry.json")
    profiles = registry.get("profiles")
    if not isinstance(profile_id, str) or not profile_id.strip():
        _raise_compile_error(
            "STYLE_IDENTITY_DRIFT", "profile_id", "A registered profile_id is required."
        )
    if not isinstance(profiles, list):
        _raise_compile_error(
            "STYLE_IDENTITY_DRIFT", "profiles", "Style registry profiles are invalid."
        )
    matches = [
        profile
        for profile in profiles
        if isinstance(profile, dict) and profile.get("profile_id") == profile_id
    ]
    if len(matches) != 1:
        _raise_compile_error(
            "STYLE_IDENTITY_DRIFT",
            "profile_id",
            f"Profile is not uniquely registered: {profile_id}",
        )
    profile = matches[0]
    if profile.get("style_pack_version") != STYLE_PACK_VERSION:
        _raise_compile_error(
            "STYLE_IDENTITY_DRIFT",
            "style_pack_version",
            "Structured prompt compilation requires Style Pack v3.",
        )
    adapters = profile.get("adapter_ids")
    if not isinstance(adapters, list) or "gpt-image" not in adapters:
        _raise_compile_error(
            "STYLE_IDENTITY_DRIFT",
            "adapter_ids",
            "The selected profile does not register the gpt-image adapter.",
        )

    documents: list[dict[str, Any]] = []
    for field in (
        "visual_dna_path",
        "role_contracts_path",
        "reference_matrix_path",
    ):
        target = _safe_child(skill_root, profile.get(field), field)
        document = _load_json(target)
        if (
            document.get("profile_id") != profile_id
            or document.get("style_pack_version") != STYLE_PACK_VERSION
        ):
            _raise_compile_error(
                "STYLE_IDENTITY_DRIFT",
                field,
                "Style Pack document identity/version does not match the registry.",
            )
        documents.append(document)
    return profile, documents[0], documents[1], documents[2]


def _valid_frozen_graph(value: object) -> bool:
    if not isinstance(value, dict):
        return False
    nodes = value.get("nodes")
    edges = value.get("edges")
    if (
        not isinstance(nodes, list)
        or not nodes
        or not all(isinstance(node, str) and node.strip() for node in nodes)
        or len(nodes) != len(set(nodes))
        or not isinstance(edges, list)
    ):
        return False
    node_ids = set(nodes)
    return all(
        isinstance(edge, dict)
        and edge.get("from") in node_ids
        and edge.get("to") in node_ids
        for edge in edges
    )


def lint_prompt_ir(prompt_ir: dict[str, Any]) -> list[dict[str, str]]:
    errors: list[dict[str, str]] = []
    for field in ("profile_id", "asset_role", "objective"):
        if not isinstance(prompt_ir.get(field), str) or not prompt_ir[field].strip():
            errors.append(
                _error(
                    "PROMPT_BLOCK_MISSING",
                    field,
                    f"Prompt IR requires a non-empty {field}.",
                )
            )
    for block, field in BLOCK_FIELDS.items():
        if field not in prompt_ir or prompt_ir.get(field) in (None, "", [], {}):
            errors.append(
                _error(
                    "PROMPT_BLOCK_MISSING",
                    field,
                    f"Prompt IR is missing the {block} block.",
                )
            )

    if prompt_ir.get("style_pack_version") != STYLE_PACK_VERSION:
        errors.append(
            _error(
                "STYLE_IDENTITY_DRIFT",
                "style_pack_version",
                "Prompt IR must preserve Style Pack version 3.",
            )
        )
    role = prompt_ir.get("asset_role")
    if role not in VALID_ASSET_ROLES:
        errors.append(
            _error("ROLE_LAYOUT_DRIFT", "asset_role", "Asset role is invalid.")
        )

    output = prompt_ir.get("output_contract")
    if isinstance(output, dict):
        for field in ("platform", "aspect_ratio", "occupancy", "crop_rules", "output_count"):
            if output.get(field) in (None, "", [], {}):
                errors.append(
                    _error(
                        "ROLE_LAYOUT_DRIFT",
                        f"output_contract.{field}",
                        "Output contract is incomplete.",
                    )
                )

    semantics = prompt_ir.get("semantics")
    if isinstance(semantics, dict):
        for field in ("confirmed", "simplifications", "blocked"):
            value = semantics.get(field)
            if not isinstance(value, list):
                errors.append(
                    _error(
                        "SEMANTIC_TOPOLOGY_DRIFT",
                        f"semantics.{field}",
                        "Semantic fact lists must be explicit arrays.",
                    )
                )
        if role == "diagram" and not _valid_frozen_graph(semantics.get("frozen_graph")):
            errors.append(
                _error(
                    "SEMANTIC_TOPOLOGY_DRIFT",
                    "semantics.frozen_graph",
                    "Diagrams require a frozen graph whose edges reference declared nodes.",
                )
            )

    reference = prompt_ir.get("reference_contract")
    if isinstance(reference, dict):
        required = reference.get("required_references")
        same_role_goldens = (
            [
                item
                for item in required
                if isinstance(item, dict)
                and item.get("kind") == "golden"
                and item.get("role") == role
            ]
            if isinstance(required, list)
            else []
        )
        if len(same_role_goldens) != 1:
            errors.append(
                _error(
                    "SERIES_CONTINUITY_DRIFT",
                    "reference_contract.required_references",
                    "Exactly one same-role golden reference is required.",
                )
            )
        must_not_copy = reference.get("must_not_copy")
        if not isinstance(must_not_copy, list) or not REQUIRED_NON_COPY_FIELDS.issubset(
            must_not_copy
        ):
            errors.append(
                _error(
                    "GOLDEN_CONTENT_COPY",
                    "reference_contract.must_not_copy",
                    "Golden example labels, numbers, nodes, topology, and story must stay blocked.",
                )
            )

    text_policy = prompt_ir.get("text_policy")
    if isinstance(text_policy, dict):
        exact_text = text_policy.get("exact_text")
        if exact_text and not text_policy.get("deterministic_overlay"):
            errors.append(
                _error(
                    "TEXT_POLICY_VIOLATION",
                    "text_policy.deterministic_overlay",
                    "Exact text requires deterministic typography overlay.",
                )
            )
    return errors


def compile_prompt_ir(skill_root: Path, request: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(request, dict):
        _raise_compile_error(
            "PROMPT_BLOCK_MISSING", "request", "Prompt request must be an object."
        )
    skill_root = Path(skill_root).resolve()
    profile, visual_dna, role_contracts, reference_matrix = _load_registered_pack(
        skill_root, request.get("profile_id")
    )
    role = request.get("asset_role")
    if role not in VALID_ASSET_ROLES:
        _raise_compile_error(
            "ROLE_LAYOUT_DRIFT", "asset_role", "Asset role must be cover, concept, or diagram."
        )
    roles = role_contracts.get("roles")
    role_contract = roles.get(role) if isinstance(roles, dict) else None
    if not isinstance(role_contract, dict):
        _raise_compile_error(
            "ROLE_LAYOUT_DRIFT", "role_contract", "Registered role contract is missing."
        )
    references = reference_matrix.get("references")
    role_references = (
        [
            item
            for item in references
            if isinstance(item, dict) and item.get("role") == role
        ]
        if isinstance(references, list)
        else []
    )
    if len(role_references) != 1:
        _raise_compile_error(
            "SERIES_CONTINUITY_DRIFT",
            "reference_matrix",
            "Exactly one registered same-role golden reference is required.",
        )
    role_reference = role_references[0]
    golden_id = role_reference.get("golden_asset_id")
    requested_goldens = request.get("golden_reference_ids")
    if requested_goldens != [golden_id]:
        _raise_compile_error(
            "SERIES_CONTINUITY_DRIFT",
            "golden_reference_ids",
            "The request must attach only the registered same-role golden reference.",
        )

    semantics = request.get("semantics")
    if not isinstance(semantics, dict):
        _raise_compile_error(
            "SEMANTIC_TOPOLOGY_DRIFT", "semantics", "Confirmed article semantics are required."
        )
    if role == "diagram" and not _valid_frozen_graph(semantics.get("frozen_graph")):
        _raise_compile_error(
            "SEMANTIC_TOPOLOGY_DRIFT",
            "semantics.frozen_graph",
            "Diagram generation requires a valid frozen semantic graph.",
        )

    platform = request.get("platform")
    if not isinstance(platform, dict):
        _raise_compile_error(
            "ROLE_LAYOUT_DRIFT", "platform", "A complete platform contract is required."
        )
    anchors = request.get("article_anchor_reference_ids", [])
    if not isinstance(anchors, list) or not all(
        isinstance(anchor, str) and anchor.strip() for anchor in anchors
    ):
        _raise_compile_error(
            "SERIES_CONTINUITY_DRIFT",
            "article_anchor_reference_ids",
            "Article anchor reference IDs must be an array of IDs.",
        )

    required_references = [{"id": golden_id, "kind": "golden", "role": role}]
    required_references.extend(
        {"id": anchor, "kind": "article_anchor", "role": role}
        for anchor in anchors
    )
    prompt_ir = {
        "profile_id": profile["profile_id"],
        "style_pack_version": STYLE_PACK_VERSION,
        "adapter_id": "gpt-image",
        "adapter_version": 1,
        "asset_role": role,
        "objective": request.get("objective"),
        "output_contract": {
            "platform": platform.get("name"),
            "aspect_ratio": platform.get("aspect_ratio"),
            "occupancy": platform.get("occupancy"),
            "crop_rules": platform.get("crop_rules"),
            "output_count": platform.get("output_count"),
        },
        "semantics": semantics,
        "role_composition": {
            "stability": role_contract.get("stability"),
            "instructions": request.get("composition"),
            "must_preserve": role_contract.get("must_preserve"),
            "may_vary": role_contract.get("may_vary"),
        },
        "visual_dna": visual_dna,
        "reference_contract": {
            "required_references": required_references,
            "must_preserve": role_reference.get("must_preserve"),
            "may_vary": role_reference.get("may_vary"),
            "must_not_copy": role_reference.get("must_not_copy"),
            "example_content_authoritative": False,
        },
        "text_policy": request.get("text_policy"),
        "negative_constraints": _dedupe_strings(
            visual_dna.get("forbidden_traits"),
            role_contract.get("must_not_include"),
            semantics.get("blocked"),
        ),
        "acceptance_checks": _dedupe_strings(
            role_contract.get("acceptance_checks"),
            visual_dna.get("required_traits"),
        ),
    }
    errors = lint_prompt_ir(prompt_ir)
    if errors:
        raise PromptCompileError(json.dumps(errors, ensure_ascii=False))
    return prompt_ir


def render_gpt_image_prompt(prompt_ir: dict[str, Any]) -> str:
    errors = lint_prompt_ir(prompt_ir)
    if errors:
        raise PromptCompileError(json.dumps(errors, ensure_ascii=False))
    sections: list[str] = []
    for block in REQUIRED_PROMPT_BLOCKS:
        field = BLOCK_FIELDS[block]
        payload = json.dumps(prompt_ir[field], ensure_ascii=False, indent=2)
        sections.append(f"[{block}]\n{payload}")
    return "\n\n".join(sections) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Compile a Style Pack v3 request into Prompt IR and a GPT Image prompt."
    )
    parser.add_argument("--request", type=Path, required=True)
    parser.add_argument("--out-ir", type=Path, required=True)
    parser.add_argument("--out-prompt", type=Path, required=True)
    parser.add_argument(
        "--skill-root", type=Path, default=Path(__file__).resolve().parents[1]
    )
    args = parser.parse_args()
    try:
        request = _load_json(args.request)
        prompt_ir = compile_prompt_ir(args.skill_root, request)
        rendered = render_gpt_image_prompt(prompt_ir)
        args.out_ir.parent.mkdir(parents=True, exist_ok=True)
        args.out_prompt.parent.mkdir(parents=True, exist_ok=True)
        args.out_ir.write_text(
            json.dumps(prompt_ir, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        args.out_prompt.write_text(rendered, encoding="utf-8")
    except PromptCompileError as exc:
        print(json.dumps({"overall": "failed", "errors": str(exc)}, ensure_ascii=False))
        return 1
    print(
        json.dumps(
            {
                "overall": "passed",
                "prompt_ir": str(args.out_ir),
                "compiled_prompt": str(args.out_prompt),
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
