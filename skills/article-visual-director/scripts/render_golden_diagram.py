from __future__ import annotations

import argparse
import html
import json
from pathlib import Path
from typing import Any


LABELS = ["能力 10", "AI ×100", "输出 1000", "能力 1", "输出 100", "差距 900"]


def _first_color(mapping: dict[str, Any], keys: tuple[str, ...], fallback: str) -> str:
    for key in keys:
        value = mapping.get(key)
        if isinstance(value, str) and value.startswith("#"):
            return value.upper()
    return fallback.upper()


def build_scene(tokens: dict[str, Any]) -> dict[str, Any]:
    surface = tokens.get("surface", {})
    palette = tokens.get("palette", {})
    line = tokens.get("line", {})
    geometry = tokens.get("geometry", {})
    typography = tokens.get("typography", {})
    texture = tokens.get("texture", {})
    roles = tokens.get("semantic_color_roles", {})
    ink = _first_color(line, ("primary",), "#171717")
    background = _first_color(surface, ("background",), "#F4F1E6")
    start_color = _first_color(
        roles,
        (
            "reference_or_context", "primary_signal", "concept_a", "module",
            "primary_structure", "signal_path", "support",
        ),
        _first_color(palette, ("blue", "primary", "ink"), "#66AEE8"),
    )
    multiplier_color = _first_color(
        roles,
        (
            "pressure_or_payload", "human_or_exception", "active_transition",
            "thesis_accent", "emphasis", "active_route",
        ),
        _first_color(palette, ("orange", "warm", "accent", "ochre"), "#F59E0B"),
    )
    output_color = _first_color(
        roles,
        (
            "durable_or_available", "active_system", "active_route", "highlight",
            "concept_b", "module", "primary_signal",
        ),
        _first_color(palette, ("green", "primary", "sage"), "#58B978"),
    )
    risk_color = _first_color(
        roles,
        ("risk_or_failure", "human_or_exception", "active_transition", "thesis_accent"),
        _first_color(palette, ("red", "warm", "accent"), "#D75A4A"),
    )
    secondary_color = _first_color(
        roles,
        ("secondary_concept",),
        _first_color(palette, ("lavender",), "#D9C8EA"),
    )
    highlight_color = _first_color(
        roles,
        ("emphasis_highlight",),
        _first_color(palette, ("yellow",), "#F4E59C"),
    )
    soft_start_color = _first_color(
        roles, ("soft_reference",), _first_color(palette, ("pastel_blue",), "#BFDDEE")
    )
    soft_output_color = _first_color(
        roles, ("soft_persistence",), _first_color(palette, ("pastel_green",), "#CFE8C7")
    )
    soft_multiplier_color = _first_color(
        roles, ("soft_pressure",), _first_color(palette, ("pastel_orange",), "#F3D39A")
    )
    return {
        "width": 1600,
        "height": 900,
        "profile_id": tokens.get("profile_id", "unknown"),
        "labels": list(LABELS),
        "colors": {
            "background": background,
            "ink": ink,
            "start": start_color,
            "multiplier": multiplier_color,
            "output": output_color,
            "risk": risk_color,
            "secondary": secondary_color,
            "highlight": highlight_color,
            "soft_start": soft_start_color,
            "soft_output": soft_output_color,
            "soft_multiplier": soft_multiplier_color,
        },
        "line_width": int(line.get("width_px", 3)),
        "corner_radius": int(geometry.get("corner_radius_px", 10)),
        "label_style": geometry.get("label_style", "quiet-caption"),
        "font_family": typography.get("family_zh", "sans-serif"),
        "texture_pattern": texture.get("pattern", "none"),
        "annotations": ["起点结构更强", "起点结构较弱", "同一个 AI 乘数"],
        "lanes": [
            {
                "y": 245,
                "start": {"x": 120, "y": 190, "w": 250, "h": 120, "label": "能力 10"},
                "multiplier": {"cx": 635, "cy": 250, "w": 210, "h": 130, "label": "AI ×100"},
                "output": {"x": 895, "y": 175, "w": 310, "h": 150, "label": "输出 1000"},
            },
            {
                "y": 575,
                "start": {"x": 120, "y": 520, "w": 250, "h": 120, "label": "能力 1"},
                "multiplier": {"cx": 635, "cy": 580, "w": 210, "h": 130, "label": "AI ×100"},
                "output": {"x": 895, "y": 505, "w": 310, "h": 150, "label": "输出 100"},
            },
        ],
        "gap": {"x": 1345, "y1": 250, "y2": 580, "label": "差距 900"},
    }


def _svg_text(x: int, y: int, label: str, size: int, fill: str, family: str) -> str:
    return (
        f'<text x="{x}" y="{y}" text-anchor="middle" dominant-baseline="middle" '
        f'font-family="{html.escape(family, quote=True)}" font-size="{size}" '
        f'font-weight="700" fill="{fill}">{html.escape(label)}</text>'
    )


def render_svg(scene: dict[str, Any], output_path: Path) -> None:
    colors = scene["colors"]
    stroke = scene["line_width"]
    radius = scene["corner_radius"]
    family = scene["font_family"]
    section_tabs = scene["label_style"] in {"black-tab", "highlight-or-section-tab"}
    pattern = ""
    background_fill = colors["background"]
    if scene["texture_pattern"] in {"subtle-dot-paper", "subtle-warm-paper-grain"}:
        pattern = (
            '<pattern id="paper-dots" width="24" height="24" patternUnits="userSpaceOnUse">'
            f'<circle cx="2" cy="2" r="0.8" fill="{colors["ink"]}" opacity="0.055"/>'
            '</pattern>'
        )
    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{scene["width"]}" height="{scene["height"]}" viewBox="0 0 {scene["width"]} {scene["height"]}">',
        '<defs>',
        f'<marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto"><path d="M0,0 L12,6 L0,12 z" fill="{colors["ink"]}"/></marker>',
        pattern,
        '</defs>',
        f'<rect width="1600" height="900" fill="{background_fill}"/>',
    ]
    if pattern:
        parts.append('<rect width="1600" height="900" fill="url(#paper-dots)"/>')
    parts.extend([
        f'<rect x="414" y="42" width="772" height="58" rx="10" fill="{colors["highlight"]}" opacity="0.72" transform="rotate(-0.4 800 71)"/>',
        _svg_text(800, 72, "同样放大 100 倍，绝对差距被拉大", 42, colors["ink"], family),
        f'<line x1="92" y1="122" x2="1508" y2="122" stroke="{colors["ink"]}" stroke-width="{stroke}" stroke-dasharray="10 12" opacity="0.55"/>',
        f'<rect class="architecture-boundary" x="70" y="136" width="1180" height="586" rx="22" fill="none" stroke="{colors["start"]}" stroke-width="{stroke}" stroke-dasharray="10 10" opacity="0.9"/>',
        f'<g class="annotation" font-family="{html.escape(family, quote=True)}" fill="{colors["ink"]}">',
        f'<rect x="320" y="138" width="190" height="42" rx="8" fill="{colors["secondary"]}" opacity="0.72" transform="rotate(-1 415 159)"/>',
        '<text x="415" y="160" text-anchor="middle" font-size="23">先看起点结构</text>',
        f'<path d="M415 181 Q360 194 310 216" fill="none" stroke="{colors["ink"]}" stroke-width="{stroke}" marker-end="url(#arrow)" stroke-linecap="round"/>',
        '</g>',
    ])
    if section_tabs:
        parts.extend([
            f'<rect x="142" y="146" width="154" height="34" rx="7" fill="{colors["ink"]}" transform="rotate(-0.7 219 163)"/>',
            _svg_text(219, 164, "起点结构", 21, colors["background"], family),
        ])
    for lane in scene["lanes"]:
        start = lane["start"]
        multiplier = lane["multiplier"]
        output = lane["output"]
        parts.append(
            f'<rect x="{start["x"]}" y="{start["y"]}" width="{start["w"]}" height="{start["h"]}" rx="{radius}" fill="{colors["start"]}" stroke="{colors["ink"]}" stroke-width="{stroke}" stroke-linecap="round"/>'
        )
        points = [
            (multiplier["cx"], multiplier["cy"] - multiplier["h"] // 2),
            (multiplier["cx"] + multiplier["w"] // 2, multiplier["cy"]),
            (multiplier["cx"], multiplier["cy"] + multiplier["h"] // 2),
            (multiplier["cx"] - multiplier["w"] // 2, multiplier["cy"]),
        ]
        point_text = " ".join(f"{x},{y}" for x, y in points)
        parts.append(
            f'<polygon points="{point_text}" fill="{colors["multiplier"]}" stroke="{colors["ink"]}" stroke-width="{stroke}" stroke-linejoin="round"/>'
        )
        parts.append(
            f'<rect x="{output["x"]}" y="{output["y"]}" width="{output["w"]}" height="{output["h"]}" rx="{radius}" fill="{colors["output"]}" stroke="{colors["ink"]}" stroke-width="{stroke}"/>'
        )
        parts.append(
            f'<line x1="{start["x"] + start["w"] + 22}" y1="{lane["y"]}" x2="{multiplier["cx"] - multiplier["w"] // 2 - 22}" y2="{lane["y"]}" stroke="{colors["ink"]}" stroke-width="{stroke}" marker-end="url(#arrow)" stroke-linecap="round"/>'
        )
        parts.append(
            f'<line x1="{multiplier["cx"] + multiplier["w"] // 2 + 22}" y1="{lane["y"]}" x2="{output["x"] - 22}" y2="{lane["y"]}" stroke="{colors["ink"]}" stroke-width="{stroke}" marker-end="url(#arrow)" stroke-linecap="round"/>'
        )
        for shape, label in ((start, start["label"]), (output, output["label"])):
            cx = shape["x"] + shape["w"] // 2
            cy = shape["y"] + shape["h"] // 2
            parts.append(_svg_text(cx, cy, label, 32, colors["ink"], family))
        parts.append(
            _svg_text(multiplier["cx"], multiplier["cy"] + 1, multiplier["label"], 30, colors["ink"], family)
        )
    gap = scene["gap"]
    parts.extend([
        f'<g class="annotation" font-family="{html.escape(family, quote=True)}" fill="{colors["ink"]}">',
        f'<rect x="142" y="322" width="205" height="38" rx="8" fill="{colors["soft_start"]}" opacity="0.82"/><text x="244" y="342" text-anchor="middle" font-size="21">{scene["annotations"][0]}</text>',
        f'<rect x="142" y="652" width="205" height="38" rx="8" fill="{colors["soft_output"]}" opacity="0.82"/><text x="244" y="672" text-anchor="middle" font-size="21">{scene["annotations"][1]}</text>',
        f'<rect x="522" y="398" width="226" height="42" rx="8" fill="{colors["soft_multiplier"]}" opacity="0.88" transform="rotate(-1 635 419)"/><text x="635" y="420" text-anchor="middle" font-size="22">{scene["annotations"][2]}</text>',
        '</g>',
        f'<path class="failure-path" d="M740 250 C820 365 820 470 740 580 C920 720 1130 710 1345 580" fill="none" stroke="{colors["risk"]}" stroke-width="{stroke}" stroke-dasharray="10 9" stroke-linecap="round" opacity="0.9"/>',
        f'<line x1="{gap["x"]}" y1="{gap["y1"]}" x2="{gap["x"]}" y2="{gap["y2"]}" stroke="{colors["risk"]}" stroke-width="{stroke + 1}"/>',
        f'<line x1="{gap["x"] - 22}" y1="{gap["y1"]}" x2="{gap["x"] + 22}" y2="{gap["y1"]}" stroke="{colors["risk"]}" stroke-width="{stroke + 1}"/>',
        f'<line x1="{gap["x"] - 22}" y1="{gap["y2"]}" x2="{gap["x"] + 22}" y2="{gap["y2"]}" stroke="{colors["risk"]}" stroke-width="{stroke + 1}"/>',
        f'<rect x="1382" y="376" width="170" height="80" rx="{radius}" fill="{colors["risk"]}" stroke="{colors["ink"]}" stroke-width="{stroke}"/>',
        _svg_text(1467, 417, gap["label"], 30, colors["background"], family),
        _svg_text(800, 800, "AI 是乘数，不是平均器", 36, colors["ink"], family),
        f'<path d="M550 829 Q800 839 1053 827" fill="none" stroke="{colors["risk"]}" stroke-width="{stroke + 1}" stroke-linecap="round"/>',
        '</svg>',
    ])
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(parts) + "\n", encoding="utf-8")


def render_png(scene: dict[str, Any], output_path: Path, font_path: Path) -> None:
    from PIL import Image, ImageDraw, ImageFont

    colors = scene["colors"]
    image = Image.new("RGB", (scene["width"], scene["height"]), colors["background"])
    draw = ImageDraw.Draw(image)
    font_path = Path(font_path)

    def font(size: int):
        if font_path.is_file():
            return ImageFont.truetype(str(font_path), size=size)
        return ImageFont.load_default()

    def centered_text(box: tuple[int, int, int, int], label: str, size: int, fill: str) -> None:
        text_font = font(size)
        bounds = draw.textbbox((0, 0), label, font=text_font)
        width = bounds[2] - bounds[0]
        height = bounds[3] - bounds[1]
        x = box[0] + (box[2] - box[0] - width) / 2
        y = box[1] + (box[3] - box[1] - height) / 2 - bounds[1]
        draw.text((x, y), label, font=text_font, fill=fill)

    if scene["texture_pattern"] in {"subtle-dot-paper", "subtle-warm-paper-grain"}:
        for x in range(2, 1600, 24):
            for y in range(2, 900, 24):
                draw.ellipse((x, y, x + 2, y + 2), fill="#D2CCBA")
    draw.rounded_rectangle((414, 42, 1186, 100), radius=10, fill=colors["highlight"])
    centered_text((200, 35, 1400, 109), "同样放大 100 倍，绝对差距被拉大", 42, colors["ink"])
    draw.line((92, 122, 1508, 122), fill=colors["ink"], width=max(1, scene["line_width"] - 1))
    stroke = scene["line_width"]
    radius = scene["corner_radius"]
    section_tabs = scene["label_style"] in {"black-tab", "highlight-or-section-tab"}

    # Architecture diagrams stay human-free: grouping, arrows, and exceptions
    # carry the teaching load.
    for x in range(70, 1250, 20):
        draw.line((x, 136, min(x + 10, 1250), 136), fill=colors["start"], width=stroke)
        draw.line((x, 722, min(x + 10, 1250), 722), fill=colors["start"], width=stroke)
    for y in range(136, 722, 20):
        draw.line((70, y, 70, min(y + 10, 722)), fill=colors["start"], width=stroke)
        draw.line((1250, y, 1250, min(y + 10, 722)), fill=colors["start"], width=stroke)
    draw.rounded_rectangle((320, 138, 510, 180), radius=8, fill=colors["secondary"])
    centered_text((320, 138, 510, 180), "先看起点结构", 23, colors["ink"])
    draw.arc((300, 168, 450, 234), 200, 342, fill=colors["ink"], width=stroke)
    if section_tabs:
        draw.rounded_rectangle((142, 146, 296, 180), radius=7, fill=colors["ink"])
        centered_text((142, 146, 296, 180), "起点结构", 21, colors["background"])

    def arrow(x1: int, y: int, x2: int) -> None:
        draw.line((x1, y, x2 - 18, y), fill=colors["ink"], width=stroke)
        draw.polygon([(x2, y), (x2 - 22, y - 13), (x2 - 22, y + 13)], fill=colors["ink"])

    for lane in scene["lanes"]:
        start = lane["start"]
        mult = lane["multiplier"]
        output = lane["output"]
        start_box = (start["x"], start["y"], start["x"] + start["w"], start["y"] + start["h"])
        output_box = (output["x"], output["y"], output["x"] + output["w"], output["y"] + output["h"])
        draw.rounded_rectangle(start_box, radius=radius, fill=colors["start"], outline=colors["ink"], width=stroke)
        points = [
            (mult["cx"], mult["cy"] - mult["h"] // 2),
            (mult["cx"] + mult["w"] // 2, mult["cy"]),
            (mult["cx"], mult["cy"] + mult["h"] // 2),
            (mult["cx"] - mult["w"] // 2, mult["cy"]),
        ]
        draw.polygon(points, fill=colors["multiplier"], outline=colors["ink"])
        draw.line(points + [points[0]], fill=colors["ink"], width=stroke, joint="curve")
        draw.rounded_rectangle(output_box, radius=radius, fill=colors["output"], outline=colors["ink"], width=stroke)
        arrow(start["x"] + start["w"] + 22, lane["y"], mult["cx"] - mult["w"] // 2 - 22)
        arrow(mult["cx"] + mult["w"] // 2 + 22, lane["y"], output["x"] - 22)
        for box, label in ((start_box, start["label"]), (output_box, output["label"])):
            centered_text(box, label, 32, colors["ink"])
        centered_text((mult["cx"] - 105, mult["cy"] - 55, mult["cx"] + 105, mult["cy"] + 55), mult["label"], 30, colors["ink"])
    draw.rounded_rectangle((142, 322, 347, 360), radius=8, fill=colors["soft_start"])
    centered_text((142, 322, 347, 360), scene["annotations"][0], 21, colors["ink"])
    draw.rounded_rectangle((142, 652, 347, 690), radius=8, fill=colors["soft_output"])
    centered_text((142, 652, 347, 690), scene["annotations"][1], 21, colors["ink"])
    draw.rounded_rectangle((522, 398, 748, 440), radius=8, fill=colors["soft_multiplier"])
    centered_text((522, 398, 748, 440), scene["annotations"][2], 22, colors["ink"])
    for x in range(760, 1320, 26):
        draw.line((x, 704, min(x + 13, 1320), 704), fill=colors["risk"], width=stroke)
    gap = scene["gap"]
    draw.line((gap["x"], gap["y1"], gap["x"], gap["y2"]), fill=colors["risk"], width=stroke + 1)
    draw.line((gap["x"] - 22, gap["y1"], gap["x"] + 22, gap["y1"]), fill=colors["risk"], width=stroke + 1)
    draw.line((gap["x"] - 22, gap["y2"], gap["x"] + 22, gap["y2"]), fill=colors["risk"], width=stroke + 1)
    gap_box = (1382, 376, 1552, 456)
    draw.rounded_rectangle(gap_box, radius=radius, fill=colors["risk"], outline=colors["ink"], width=stroke)
    centered_text(gap_box, gap["label"], 30, colors["background"])
    centered_text((400, 760, 1200, 840), "AI 是乘数，不是平均器", 36, colors["ink"])
    draw.arc((550, 817, 1053, 843), 5, 175, fill=colors["risk"], width=stroke + 1)
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path, format="PNG")


def main() -> int:
    parser = argparse.ArgumentParser(description="Render the canonical capability-gap golden diagram.")
    parser.add_argument("--tokens", type=Path, required=True)
    parser.add_argument("--svg", type=Path, required=True)
    parser.add_argument("--png", type=Path, required=True)
    parser.add_argument("--font", type=Path, default=Path(r"C:\Windows\Fonts\msyh.ttc"))
    args = parser.parse_args()
    tokens = json.loads(args.tokens.read_text(encoding="utf-8"))
    scene = build_scene(tokens)
    render_svg(scene, args.svg)
    render_png(scene, args.png, args.font)
    print(json.dumps({"overall": "passed", "svg": str(args.svg), "png": str(args.png)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
