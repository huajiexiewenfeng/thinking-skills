from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


SKILL_ROOT = Path(__file__).resolve().parents[2]
EXPECTED_PROFILES = [
    (1, "technical-editorial-minimal", "Technical Editorial Minimal", "技术编辑简约"),
    (
        2,
        "white-green-editorial-minimal",
        "White-Green Editorial Minimal",
        "白底绿色编辑简约",
    ),
    (3, "neon-systems", "Neon Systems", "霓虹系统科技"),
    (4, "blueprint-linework", "Polished Tech Explainer", "质感科技图解"),
    (
        5,
        "isometric-infrastructure",
        "Isometric Infrastructure",
        "等距基础设施",
    ),
    (6, "cinematic-conceptual", "Cinematic Conceptual", "电影感概念视觉"),
    (7, "soft-technical-sketch", "Soft Technical Sketch", "柔和技术手绘"),
    (
        8,
        "handwritten-systems-explainer",
        "Handwritten Systems Explainer",
        "手写系统解释图",
    ),
    (9, "dense-technical-infographic", "Dense Technical Infographic", "高密度技术信息图"),
]
REQUIRED_PROTOCOL_HEADINGS = [
    "Identity",
    "Use When",
    "Do Not Use When",
    "Mode Boundary",
    "Required Visual Traits",
    "Allowed Variation",
    "Forbidden Traits",
    "Cover Contract",
    "Concept Contract",
    "Deterministic Diagram Contract",
    "Imagegen Prompt Contract",
    "Reference Use Contract",
    "Validation Rubric",
]
REQUIRED_TOKEN_KEYS = {
    "profile_id",
    "protocol_version",
    "surface",
    "palette",
    "line",
    "typography",
    "geometry",
    "depth",
    "texture",
    "spacing",
    "semantic_color_roles",
    "forbidden_traits",
}


class SkillContractTests(unittest.TestCase):
    def load_registry(self) -> dict:
        return json.loads(
            (SKILL_ROOT / "references" / "style-registry.json").read_text(
                encoding="utf-8"
            )
        )

    def load_tokens(self, profile_id: str) -> dict:
        registry = self.load_registry()
        item = next(
            profile for profile in registry["profiles"]
            if profile["profile_id"] == profile_id
        )
        return json.loads((SKILL_ROOT / item["tokens_path"]).read_text(encoding="utf-8"))

    def test_registry_locks_profile_identity_and_declared_paths(self) -> None:
        registry = json.loads(
            (SKILL_ROOT / "references" / "style-registry.json").read_text(
                encoding="utf-8"
            )
        )

        actual = [
            (item["ordinal"], item["profile_id"], item["name_en"], item["name_zh"])
            for item in registry["profiles"]
        ]
        self.assertEqual(1, registry["registry_version"])
        self.assertEqual(EXPECTED_PROFILES, actual)
        self.assertEqual(9, len({item["profile_id"] for item in registry["profiles"]}))

        for item in registry["profiles"]:
            ordinal = item["ordinal"]
            profile_id = item["profile_id"]
            prefix = f"references/styles/{ordinal:02d}-{profile_id}"
            self.assertEqual(f"{prefix}.md", item["protocol_path"])
            self.assertEqual(f"{prefix}.tokens.json", item["tokens_path"])
            self.assertEqual(
                f"assets/style-anchors/{profile_id}/golden-set.json",
                item["golden_set_path"],
            )

    def test_style_gate_and_catalog_expose_the_same_nine_profiles(self) -> None:
        skill_text = (SKILL_ROOT / "SKILL.md").read_text(encoding="utf-8")
        catalog_text = (SKILL_ROOT / "references" / "style-catalog.md").read_text(
            encoding="utf-8"
        )

        menu_profiles = re.findall(
            r"^\d+\. \*\*([^（*]+)（[^）]+）\*\*", skill_text, flags=re.MULTILINE
        )
        catalog_profiles = re.findall(
            r"^\| \d+ \| ([^|]+?) \|", catalog_text, flags=re.MULTILINE
        )
        registry = json.loads(
            (SKILL_ROOT / "references" / "style-registry.json").read_text(
                encoding="utf-8"
            )
        )
        registry_profiles = [item["name_en"] for item in registry["profiles"]]

        self.assertEqual(9, len(menu_profiles))
        self.assertEqual(9, len(catalog_profiles))
        self.assertEqual(
            {profile.split("（", 1)[0] for profile in menu_profiles},
            set(catalog_profiles),
        )
        self.assertEqual(registry_profiles, catalog_profiles)
        self.assertIn("Handwritten Systems Explainer", catalog_profiles)
        self.assertIn("9. **Dense Technical Infographic（高密度技术信息图）**", skill_text)
        self.assertIn("高密度技术信息图", catalog_text)
        self.assertEqual(9, len(EXPECTED_PROFILES))

    def test_style_selection_gate_renders_verified_golden_cover_for_each_option(
        self,
    ) -> None:
        skill_text = (SKILL_ROOT / "SKILL.md").read_text(encoding="utf-8")

        self.assertIn("scripts/list_style_previews.py", skill_text)
        self.assertIn(
            "one verified golden cover immediately after each Style",
            skill_text,
        )
        self.assertIn("黄金图暂不可用", skill_text)
        self.assertIn("absolute local filesystem path", skill_text)
        self.assertIn("Do not substitute", skill_text)
        self.assertIn("registry and golden cover metadata only", skill_text)

    def test_skill_routes_x_article_as_a_first_class_platform(self) -> None:
        skill_text = (SKILL_ROOT / "SKILL.md").read_text(encoding="utf-8")
        platform_text = (
            SKILL_ROOT / "references" / "platform-profiles.md"
        ).read_text(encoding="utf-8")
        schema_text = (SKILL_ROOT / "references" / "manifest-schema.md").read_text(
            encoding="utf-8"
        )

        self.assertIn("`x-article`", skill_text)
        self.assertIn("## X Articles", platform_text)
        self.assertIn("`x-article`", schema_text)

    def test_every_registered_protocol_and_token_file_satisfies_schema(self) -> None:
        for item in self.load_registry()["profiles"]:
            with self.subTest(profile_id=item["profile_id"]):
                protocol_path = SKILL_ROOT / item["protocol_path"]
                tokens_path = SKILL_ROOT / item["tokens_path"]
                self.assertTrue(protocol_path.is_file())
                self.assertTrue(tokens_path.is_file())

                protocol_text = protocol_path.read_text(encoding="utf-8")
                headings = re.findall(r"^## (.+)$", protocol_text, flags=re.MULTILINE)
                self.assertEqual(REQUIRED_PROTOCOL_HEADINGS, headings)

                tokens = json.loads(tokens_path.read_text(encoding="utf-8"))
                self.assertEqual(REQUIRED_TOKEN_KEYS, set(tokens))
                self.assertEqual(item["profile_id"], tokens["profile_id"])
                self.assertEqual(item["protocol_version"], tokens["protocol_version"])

    def test_soft_sketch_and_handwritten_explainer_remain_visibly_distinct(self) -> None:
        soft = self.load_tokens("soft-technical-sketch")
        handwritten = self.load_tokens("handwritten-systems-explainer")

        self.assertEqual("low", soft["palette"]["saturation"])
        self.assertEqual("controlled-variable", handwritten["palette"]["saturation"])
        self.assertEqual("fine-soft", soft["line"]["weight_class"])
        self.assertEqual("fine-variable", handwritten["line"]["weight_class"])
        self.assertEqual("high", handwritten["geometry"]["annotation_density"])
        self.assertEqual(
            "highlight-or-section-tab", handwritten["geometry"]["label_style"]
        )
        self.assertEqual("#6CAFE0", handwritten["palette"]["blue"])
        self.assertEqual("#65BD82", handwritten["palette"]["green"])
        self.assertEqual("#BFDDEE", handwritten["palette"]["pastel_blue"])
        self.assertEqual("#CFE8C7", handwritten["palette"]["pastel_green"])
        self.assertEqual("#D9C8EA", handwritten["palette"]["lavender"])
        self.assertEqual("#F4E59C", handwritten["palette"]["yellow"])
        self.assertNotEqual(
            soft["geometry"]["label_style"],
            handwritten["geometry"]["label_style"],
        )

        protocol = (
            SKILL_ROOT
            / "references"
            / "styles"
            / "08-handwritten-systems-explainer.md"
        ).read_text(encoding="utf-8")
        self.assertIn("non-human explanatory primitives", protocol)
        self.assertIn("handwritten formulas", protocol)
        self.assertIn("annotation-led technical whiteboard", protocol)
        self.assertIn("black section tabs", protocol)
        self.assertIn("pastel-to-medium", protocol)
        self.assertIn("Architecture diagrams contain no people", protocol)

    def test_style_8_defaults_to_non_human_explanatory_subjects(self) -> None:
        protocol = (
            SKILL_ROOT
            / "references"
            / "styles"
            / "08-handwritten-systems-explainer.md"
        ).read_text(encoding="utf-8").lower()
        anchor_root = (
            SKILL_ROOT
            / "assets"
            / "style-anchors"
            / "handwritten-systems-explainer"
        )
        roles = json.loads(
            (anchor_root / "role-contracts.json").read_text(encoding="utf-8")
        )["roles"]
        references = json.loads(
            (anchor_root / "reference-matrix.json").read_text(encoding="utf-8")
        )["references"]
        visual_dna = json.loads(
            (anchor_root / "visual-dna.json").read_text(encoding="utf-8")
        )

        self.assertIn("human-free by default", protocol)
        self.assertIn("non-human explanatory primitives", protocol)
        self.assertIn("article semantics explicitly require a human actor", protocol)
        self.assertIn("approved asset brief", protocol)

        for role_name in ("cover", "concept"):
            forbidden = " ".join(roles[role_name]["must_not_include"]).lower()
            allowed = " ".join(roles[role_name]["may_vary"]).lower()
            self.assertIn("no unapproved people", forbidden)
            self.assertIn("no recurring instructor narrator or mascot", forbidden)
            self.assertIn("no inherited character identity", forbidden)
            self.assertIn("article semantics explicitly require a human actor", allowed)
            self.assertIn("approved brief", allowed)

        diagram_forbidden = " ".join(roles["diagram"]["must_not_include"]).lower()
        self.assertIn("no people", diagram_forbidden)

        protected_character_traits = {
            "character_identity",
            "face",
            "pose",
            "silhouette",
            "people_count",
        }
        for reference in references:
            if reference["role"] in {"cover", "concept"}:
                self.assertTrue(
                    protected_character_traits.issubset(reference["must_not_copy"])
                )

        required_traits = " ".join(visual_dna["required_traits"]).lower()
        forbidden_traits = " ".join(visual_dna["forbidden_traits"]).lower()
        self.assertIn("non-human explanatory subjects", required_traits)
        self.assertIn("recurring instructor narrator mascot", forbidden_traits)

        cover_prompt = (anchor_root / "golden-cover.prompt.md").read_text(
            encoding="utf-8"
        ).lower()
        concept_prompt = (anchor_root / "golden-concept.prompt.md").read_text(
            encoding="utf-8"
        ).lower()
        self.assertIn("non-human annotation key", cover_prompt)
        self.assertIn("document-and-message relay", concept_prompt)
        for prompt in (cover_prompt, concept_prompt):
            for forbidden_subject in (
                "people",
                "faces",
                "hands",
                "instructors",
                "narrators",
                "mascots",
                "characters",
                "anthropomorphic robots",
                "face-like ai icons",
            ):
                self.assertIn(forbidden_subject, prompt)

    def test_style_8_human_free_golden_migration_is_versioned_and_approved(self) -> None:
        registry_item = next(
            item
            for item in self.load_registry()["profiles"]
            if item["profile_id"] == "handwritten-systems-explainer"
        )
        protocol = (
            SKILL_ROOT
            / registry_item["protocol_path"]
        ).read_text(encoding="utf-8")
        tokens = json.loads(
            (SKILL_ROOT / registry_item["tokens_path"]).read_text(encoding="utf-8")
        )
        golden = json.loads(
            (SKILL_ROOT / registry_item["golden_set_path"]).read_text(
                encoding="utf-8"
            )
        )
        references = json.loads(
            (SKILL_ROOT / registry_item["reference_matrix_path"]).read_text(
                encoding="utf-8"
            )
        )["references"]

        self.assertEqual(3, registry_item["protocol_version"])
        self.assertEqual(3, tokens["protocol_version"])
        self.assertIn("Protocol version: `3`", protocol)
        self.assertEqual(2, golden["golden_set_version"])
        self.assertEqual(3, golden["protocol_version"])
        self.assertEqual("approved", golden["status"])
        self.assertEqual("approved", golden["user_approval"]["status"])
        approval_notes = " ".join(golden["user_approval"]["revision_notes"]).lower()
        self.assertIn("human-free", approval_notes)

        golden_ids = {asset["role"]: asset["id"] for asset in golden["assets"]}
        self.assertEqual(
            "handwritten-systems-explainer-cover-v2",
            golden_ids["cover"],
        )
        self.assertEqual(
            "handwritten-systems-explainer-concept-v2",
            golden_ids["concept"],
        )
        self.assertEqual(
            "handwritten-systems-explainer-diagram-v1",
            golden_ids["diagram"],
        )
        reference_ids = {item["role"]: item["golden_asset_id"] for item in references}
        self.assertEqual(golden_ids, reference_ids)

    def test_workflow_loads_protocol_and_separates_style_responsibilities(self) -> None:
        skill_text = (SKILL_ROOT / "SKILL.md").read_text(encoding="utf-8")

        self.assertIn("load selected protocol and approved golden set", skill_text)
        self.assertIn("publication_theme", skill_text)
        self.assertIn("visual_profile", skill_text)
        self.assertIn("asset_semantics", skill_text)
        self.assertIn("any imagegen asset", skill_text)
        self.assertNotIn("when 3+ imagegen assets", skill_text)

    def test_visual_density_modes_require_section_coverage_before_asset_count(self) -> None:
        skill_text = (SKILL_ROOT / "SKILL.md").read_text(encoding="utf-8")

        self.assertIn("### 3. Choose a coverage-aware visual rhythm", skill_text)
        self.assertNotIn("### 3. Choose a sparse visual rhythm", skill_text)
        for mode in ("Sparse", "Balanced", "Chapter-led"):
            self.assertIn(f"**{mode}**", skill_text)

        self.assertIn("Balanced is the default", skill_text)
        self.assertIn("Use this selection priority", skill_text)
        self.assertIn("user-explicit density or coverage requirement", skill_text)
        self.assertIn(
            "approved reference, platform convention, or visual direction",
            skill_text,
        )
        self.assertIn(
            "article type, length, section structure, and comprehension difficulty",
            skill_text,
        )
        self.assertIn("major sections carry distinct conceptual jobs", skill_text)

        self.assertIn(
            "Before proposing an asset count, audit every substantive section",
            skill_text,
        )
        self.assertIn(
            "| Section | Role | Visual need | Coverage | Asset role | Rationale |",
            skill_text,
        )
        coverage_states = set(
            re.findall(
                r"^- `(?P<state>dedicated|shared|existing-aid|none)`: ",
                skill_text,
                flags=re.MULTILINE,
            )
        )
        self.assertEqual(
            {"dedicated", "shared", "existing-aid", "none"},
            coverage_states,
        )

        self.assertIn("There is no hard maximum image count", skill_text)
        self.assertIn("Do not use a fixed images-per-word ratio", skill_text)
        self.assertIn("The asset count is an output of the coverage audit", skill_text)
        self.assertIn(
            "Tables, formulas, and code blocks are reading aids, but they do not automatically satisfy an explicit request for section images",
            skill_text,
        )

    def test_chapter_led_benchmark_covers_seven_sections_without_fixed_total(self) -> None:
        case_path = (
            SKILL_ROOT.parents[1]
            / "benchmarks"
            / "article-visual-director"
            / "chapter-led-seven-section-x-article.json"
        )
        benchmark = json.loads(case_path.read_text(encoding="utf-8"))

        self.assertEqual(
            "article-visual-chapter-led-seven-section-001",
            benchmark["id"],
        )
        self.assertEqual("response", benchmark["kind"])
        self.assertEqual("article-visual-director", benchmark["skill"])
        self.assertIn("Chapter-led", benchmark["expected"])
        self.assertIn("Coverage", benchmark["expected"])
        for section in (
            "开篇冲突",
            "Repository Context 与 Project Knowledge",
            "Project Knowledge Lifecycle",
            "Lifecycle Contract",
            "Agent Runtime",
            "Failure Diagnosis",
            "开放问题",
        ):
            self.assertIn(section, benchmark["prompt"])

        rubric = " ".join(benchmark["human_rubric"])
        self.assertIn("all seven substantive sections", rubric)
        self.assertIn("cover separately", rubric)
        self.assertIn("not a universal fixed eight-image rule", rubric)
        self.assertIn("coverage audit", rubric)

    def test_golden_diagram_style_never_supplies_article_topology(self) -> None:
        skill_text = (SKILL_ROOT / "SKILL.md").read_text(encoding="utf-8")
        protocol = (
            SKILL_ROOT
            / "references"
            / "styles"
            / "08-handwritten-systems-explainer.md"
        ).read_text(encoding="utf-8")

        self.assertIn("golden content is non-authoritative", skill_text)
        self.assertIn("article-specific semantic graph", skill_text)
        self.assertIn("Never infer article-specific nodes or edges", skill_text)
        self.assertIn("style-only reference", protocol)
        self.assertIn("golden topology is non-authoritative", protocol)
        self.assertIn("semantic graph", protocol)

    def test_style_pack_v3_reference_contracts_exist(self) -> None:
        required = {
            "references/style-pack-schema.md": [
                "visual-dna.json",
                "role-contracts.json",
                "reference-matrix.json",
            ],
            "references/prompt-ir-schema.md": [
                "OUTPUT CONTRACT",
                "ARTICLE SEMANTICS",
                "ROLE COMPOSITION",
                "VISUAL DNA",
                "REFERENCE CONTRACT",
                "TEXT POLICY",
                "NEGATIVE CONSTRAINTS",
                "ACCEPTANCE CHECK",
                "bootstrap_reference",
                "semantic_authority",
            ],
            "references/adapters/gpt-image.md": [
                "same-role golden",
                "must_preserve",
                "must_not_copy",
                "bootstrap candidate",
            ],
        }
        for relative, phrases in required.items():
            with self.subTest(relative=relative):
                text = (SKILL_ROOT / relative).read_text(encoding="utf-8")
                for phrase in phrases:
                    self.assertIn(phrase, text)

    def test_style_9_native_copy_exception_is_documented(self) -> None:
        expected = {
            "references/prompt-ir-schema.md": [
                "native-generated-copy-with-validation",
                "copy_ledger_status",
                "does not add an execution policy",
                "omits `model_policy`",
                "frozen_graph",
            ],
            "references/style-pack-schema.md": [
                "dense-technical-infographic",
                "native generated copy",
                "validation failure",
                "never selects a model or execution path",
            ],
            "references/adapters/gpt-image.md": [
                "does not select or encode an image runtime",
                "runtime's image-generation skill",
                "correct-one-isolated-copy-defect-otherwise-regenerate",
                "wrong text",
            ],
            "references/manifest-schema.md": [
                "native_text_validation",
                "native-generated",
                "dense-technical-infographic",
                "semantic_graph_status",
                "renderer exception",
            ],
            "SKILL.md": [
                "dense-technical-infographic",
                "copy ledger",
                "validation failure never",
            ],
        }
        for relative, phrases in expected.items():
            with self.subTest(relative=relative):
                text = (SKILL_ROOT / relative).read_text(encoding="utf-8")
                for phrase in phrases:
                    self.assertIn(phrase, text)

        for relative in (
            "SKILL.md",
            "references/prompt-ir-schema.md",
            "references/style-pack-schema.md",
            "references/adapters/gpt-image.md",
            "references/styles/09-dense-technical-infographic.md",
        ):
            text = (SKILL_ROOT / relative).read_text(encoding="utf-8")
            self.assertNotIn("gpt-image-2", text)

    def test_style_8_v3_preserves_approved_identity(self) -> None:
        root = (
            SKILL_ROOT
            / "assets"
            / "style-anchors"
            / "handwritten-systems-explainer"
        )
        dna = json.loads((root / "visual-dna.json").read_text(encoding="utf-8"))
        roles = json.loads(
            (root / "role-contracts.json").read_text(encoding="utf-8")
        )
        matrix = json.loads(
            (root / "reference-matrix.json").read_text(encoding="utf-8")
        )

        joined = json.dumps(dna, ensure_ascii=False)
        for phrase in ("warm ivory", "fine lively", "pastel", "handwritten"):
            self.assertIn(phrase, joined)
        self.assertEqual("strict", roles["roles"]["diagram"]["stability"])
        self.assertEqual("family", roles["roles"]["cover"]["stability"])
        self.assertIn(
            "no people",
            " ".join(roles["roles"]["diagram"]["must_not_include"]),
        )
        for reference in matrix["references"]:
            self.assertIn("topology", reference["must_not_copy"])

    def test_style_9_v3_preserves_dense_technical_infographic_identity(self) -> None:
        root = (
            SKILL_ROOT
            / "assets"
            / "style-anchors"
            / "dense-technical-infographic"
        )
        visual = json.loads((root / "visual-dna.json").read_text(encoding="utf-8"))
        roles = json.loads(
            (root / "role-contracts.json").read_text(encoding="utf-8")
        )
        references = json.loads(
            (root / "reference-matrix.json").read_text(encoding="utf-8")
        )
        combined = json.dumps([visual, roles, references], ensure_ascii=False)
        for phrase in (
            "fully opaque pure white",
            "oversized deep navy title",
            "flat vector-like",
            "eighty-five to ninety-two percent",
            "bottom takeaway rail",
            "native generated copy",
            "mechanism-poster",
            "architecture-flow",
            "layered-comparison",
            "no people",
            "Style 4",
            "Style 8",
        ):
            self.assertIn(phrase, combined)
        self.assertEqual({"cover", "concept", "diagram"}, set(roles["roles"]))
        self.assertEqual(3, len(references["references"]))

    def test_v3_workflow_compiles_and_fails_closed(self) -> None:
        skill_text = (SKILL_ROOT / "SKILL.md").read_text(encoding="utf-8")
        cases_text = (
            SKILL_ROOT.parents[1] / "evals" / "article-visual-director-cases.md"
        ).read_text(encoding="utf-8")

        self.assertIn("scripts/compile_image_prompt.py", skill_text)
        self.assertIn("style_pack_not_qualified", skill_text)
        self.assertIn("never delete a failing block", skill_text)
        self.assertIn("PROMPT_BLOCK_MISSING", cases_text)
        self.assertIn("REFERENCE CONTRACT", cases_text)

    def test_style_1_v3_candidate_preserves_editorial_minimal_identity(self) -> None:
        root = (
            SKILL_ROOT
            / "assets"
            / "style-anchors"
            / "technical-editorial-minimal"
        )
        dna = json.loads((root / "visual-dna.json").read_text(encoding="utf-8"))
        roles = json.loads(
            (root / "role-contracts.json").read_text(encoding="utf-8")
        )
        matrix = json.loads(
            (root / "reference-matrix.json").read_text(encoding="utf-8")
        )

        joined = json.dumps(dna, ensure_ascii=False)
        for phrase in (
            "off-white matte",
            "ink-blue",
            "uniform crisp",
            "negative space",
            "one warm",
        ):
            self.assertIn(phrase, joined)
        self.assertEqual("family", roles["roles"]["cover"]["stability"])
        self.assertEqual("strict", roles["roles"]["diagram"]["stability"])
        self.assertIn("emerald", joined)
        for reference in matrix["references"]:
            self.assertIn("topology", reference["must_not_copy"])

    def test_style_1_separates_editorial_2_5d_from_flat_diagram_depth(self) -> None:
        root = (
            SKILL_ROOT
            / "assets"
            / "style-anchors"
            / "technical-editorial-minimal"
        )
        dna = json.loads((root / "visual-dna.json").read_text(encoding="utf-8"))
        roles = json.loads(
            (root / "role-contracts.json").read_text(encoding="utf-8")
        )["roles"]

        self.assertIn("role-sensitive", dna["material_and_texture"]["depth"])
        self.assertIn("2.5D", " ".join(roles["cover"]["may_vary"]))
        self.assertIn("2.5D", " ".join(roles["concept"]["may_vary"]))
        self.assertIn("flat", " ".join(roles["diagram"]["must_preserve"]))
        self.assertIn("no perspective", " ".join(roles["diagram"]["must_not_include"]))

    def test_style_2_v3_candidate_preserves_green_led_wide_identity(self) -> None:
        root = (
            SKILL_ROOT
            / "assets"
            / "style-anchors"
            / "white-green-editorial-minimal"
        )
        dna = json.loads((root / "visual-dna.json").read_text(encoding="utf-8"))
        roles = json.loads(
            (root / "role-contracts.json").read_text(encoding="utf-8")
        )["roles"]
        matrix = json.loads(
            (root / "reference-matrix.json").read_text(encoding="utf-8")
        )

        joined = json.dumps(dna, ensure_ascii=False)
        for phrase in (
            "emerald-led",
            "both outer bands",
            "pale mint",
            "no leaves",
            "empty outer bands",
        ):
            self.assertIn(phrase, joined)
        self.assertEqual("family", roles["cover"]["stability"])
        self.assertEqual("strict", roles["diagram"]["stability"])
        self.assertIn("no people", " ".join(roles["diagram"]["must_not_include"]))
        for reference in matrix["references"]:
            self.assertIn("topology", reference["must_not_copy"])

    def test_style_7_v3_candidate_stays_soft_and_distinct_from_style_8(self) -> None:
        root = SKILL_ROOT / "assets" / "style-anchors" / "soft-technical-sketch"
        dna = json.loads((root / "visual-dna.json").read_text(encoding="utf-8"))
        roles = json.loads(
            (root / "role-contracts.json").read_text(encoding="utf-8")
        )["roles"]
        matrix = json.loads(
            (root / "reference-matrix.json").read_text(encoding="utf-8")
        )

        joined = json.dumps(dna, ensure_ascii=False)
        for phrase in (
            "warm watercolor paper",
            "fine soft",
            "translucent watercolor",
            "low density",
            "no black label tabs",
            "Style 8",
        ):
            self.assertIn(phrase, joined)
        self.assertEqual("family", roles["cover"]["stability"])
        self.assertEqual("strict", roles["diagram"]["stability"])
        self.assertIn("no people", " ".join(roles["diagram"]["must_not_include"]))
        for reference in matrix["references"]:
            self.assertIn("topology", reference["must_not_copy"])

    def test_style_4_v3_preserves_polished_tech_explainer_identity(self) -> None:
        root = SKILL_ROOT / "assets" / "style-anchors" / "blueprint-linework"
        dna = json.loads((root / "visual-dna.json").read_text(encoding="utf-8"))
        roles = json.loads(
            (root / "role-contracts.json").read_text(encoding="utf-8")
        )["roles"]
        matrix = json.loads(
            (root / "reference-matrix.json").read_text(encoding="utf-8")
        )

        joined = json.dumps(dna, ensure_ascii=False)
        for phrase in (
            "cool white technology canvas",
            "faint blue drafting grid",
            "cobalt blue",
            "polished glass-acrylic",
            "soft spatial shadow",
            "navy information hierarchy",
            "deterministic text overlay",
            "semantic state colors",
            "technology product visual",
            "flat infographic",
            "content-rich information design",
            "blank title and subtitle zones",
            "two-stage text workflow",
            "text-free image-generation background",
            "deterministic final overlay",
            "golden references include readable example copy",
            "deterministic annotation overlay",
            "no dark cyanotype",
            "no neon cyberpunk",
            "Style 5",
            "Style 1",
            "Style 2",
        ):
            self.assertIn(phrase, joined)
        self.assertEqual("family", roles["cover"]["stability"])
        cover_contract = json.dumps(roles["cover"], ensure_ascii=False)
        self.assertIn("hybrid 2.5D technology scene", cover_contract)
        self.assertIn("frosted glass", cover_contract)
        concept_contract = json.dumps(roles["concept"], ensure_ascii=False)
        self.assertIn("polished modular technology explainer", concept_contract)
        self.assertIn("one visual thesis", concept_contract)
        self.assertEqual("strict", roles["diagram"]["stability"])
        self.assertIn(
            "flat infographic",
            json.dumps(roles["diagram"], ensure_ascii=False),
        )
        diagram_contract = json.dumps(roles["diagram"], ensure_ascii=False)
        for information_layer in (
            "blank eyebrow",
            "blank step-index discs",
            "blank caption rails",
            "blank explanatory strip",
        ):
            self.assertIn(information_layer, diagram_contract)
        self.assertIn("no people", " ".join(roles["diagram"]["must_not_include"]))
        for reference in matrix["references"]:
            self.assertIn("topology", reference["must_not_copy"])

    def test_style_5_v3_preserves_editorial_isometric_identity(self) -> None:
        root = (
            SKILL_ROOT
            / "assets"
            / "style-anchors"
            / "isometric-infrastructure"
        )
        dna = json.loads((root / "visual-dna.json").read_text(encoding="utf-8"))
        roles = json.loads(
            (root / "role-contracts.json").read_text(encoding="utf-8")
        )["roles"]
        matrix = json.loads(
            (root / "reference-matrix.json").read_text(encoding="utf-8")
        )

        joined = json.dumps(dna, ensure_ascii=False)
        for phrase in (
            "pale gray matte ground",
            "fixed 30-degree isometric",
            "substantial modules",
            "single amber",
            "shared shadow direction",
            "Style 4",
            "Style 3",
        ):
            self.assertIn(phrase, joined)
        self.assertEqual("family", roles["cover"]["stability"])
        self.assertEqual("strict", roles["diagram"]["stability"])
        self.assertIn("no people", " ".join(roles["diagram"]["must_not_include"]))
        for reference in matrix["references"]:
            self.assertIn("topology", reference["must_not_copy"])

    def test_style_6_v3_preserves_cinematic_narrative_identity(self) -> None:
        root = (
            SKILL_ROOT
            / "assets"
            / "style-anchors"
            / "cinematic-conceptual"
        )
        dna = json.loads((root / "visual-dna.json").read_text(encoding="utf-8"))
        roles = json.loads(
            (root / "role-contracts.json").read_text(encoding="utf-8")
        )["roles"]
        matrix = json.loads(
            (root / "reference-matrix.json").read_text(encoding="utf-8")
        )

        joined = json.dumps(dna, ensure_ascii=False)
        for phrase in (
            "cinematic narrative landscape",
            "layered teal-blue valley",
            "restrained 35 mm elevated wide perspective",
            "one winding journey line",
            "single warm golden horizon light",
            "small rear-view human silhouette",
            "deterministic title overlay",
            "Style 3",
            "Style 5",
            "Style 1",
        ):
            self.assertIn(phrase, joined)
        self.assertEqual("family", roles["cover"]["stability"])
        self.assertEqual("strict", roles["diagram"]["stability"])
        self.assertIn("no people", " ".join(roles["diagram"]["must_not_include"]))
        for reference in matrix["references"]:
            self.assertIn("topology", reference["must_not_copy"])

    def test_style_3_v3_preserves_editorial_signal_architecture_identity(self) -> None:
        root = SKILL_ROOT / "assets" / "style-anchors" / "neon-systems"
        dna = json.loads((root / "visual-dna.json").read_text(encoding="utf-8"))
        roles = json.loads(
            (root / "role-contracts.json").read_text(encoding="utf-8")
        )["roles"]
        matrix = json.loads(
            (root / "reference-matrix.json").read_text(encoding="utf-8")
        )

        joined = json.dumps(dna, ensure_ascii=False)
        for phrase in (
            "deep navy signal architecture",
            "fully opaque dark technical substrate",
            "front-oblique cutaway perspective",
            "one dominant cyan route",
            "acid green only for the single active state",
            "substantial extruded modules",
            "deterministic title overlay",
            "Style 5",
            "Style 6",
            "Style 4",
        ):
            self.assertIn(phrase, joined)
        self.assertEqual("family", roles["cover"]["stability"])
        self.assertEqual("strict", roles["diagram"]["stability"])
        self.assertIn("no people", " ".join(roles["diagram"]["must_not_include"]))
        for reference in matrix["references"]:
            self.assertIn("topology", reference["must_not_copy"])


if __name__ == "__main__":
    unittest.main()
