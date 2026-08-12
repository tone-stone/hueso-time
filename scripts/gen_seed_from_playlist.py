#!/usr/bin/env python3
"""Generate data/seedBarraLibre.ts from the playlist xlsx on the Desktop."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("pip install openpyxl", file=sys.stderr)
    raise

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "seedBarraLibre.ts"
DEFAULT_XLSX = Path.home() / "Desktop" / "playlist_musical_google_sheets(1).xlsx"

VALID = ["C", "C#", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
ALIASES = {
    "A#": "Bb",
    "BB": "Bb",
    "GB": "F#",
    "DB": "C#",
    "EB": "Eb",
    "AB": "Ab",
    "D#": "Eb",
    "G#": "Ab",
}


def parse_tono(raw: str) -> tuple[str, str, str | None]:
    cleaned = (raw or "").strip()
    if not cleaned:
        return "C", "major", None
    first = re.split(r"[/\-–]", cleaned)[0].strip()
    m = re.match(r"^([A-Ga-g](?:#|b)?)(m|min|minor|maj|major|m7|7)?", first, re.I)
    if not m:
        return "C", "major", f"Tono original: {cleaned}"
    root = m.group(1)
    if len(root) > 1:
        root = root[0].upper() + root[1].lower()
    else:
        root = root.upper()
    mapped = ALIASES.get(root.upper(), root)
    q = (m.group(2) or "").lower()
    mode = "minor" if q in ("m", "min", "minor", "m7") else "major"
    key = mapped if mapped in VALID else "C"
    notes = (
        f"Tono original: {cleaned}"
        if ("/" in cleaned or "-" in cleaned or cleaned != first)
        else None
    )
    return key, mode, notes


def parse_dur(raw) -> int | None:
    if raw is None or raw == "":
        return None
    v = str(raw).strip()
    if re.match(r"^\d+:\d{1,2}$", v):
        m, s = v.split(":")
        return max(1, int(m) * 60 + int(s))
    return None


def map_genre(g: str, sub: str) -> str:
    blob = f"{g or ''} {sub or ''}".lower()
    if "punk" in blob:
        return "punk"
    if "metal" in blob:
        return "metal"
    if "funk" in blob:
        return "funk"
    if any(x in blob for x in ("regional", "norte", "banda", "corrido")):
        return "regionalMexicano"
    if any(x in blob for x in ("cumbia", "bailable", "reggae", "ska")):
        return "latin"
    if "salsa" in blob:
        return "salsa"
    if "electr" in blob or "synth" in blob:
        return "pop"
    if any(x in blob for x in ("grunge", "alternative", "indie")):
        return "indie"
    if "pop" in blob:
        return "pop"
    if "rock" in blob:
        return "rock"
    return "other"


def load_rows(xlsx: Path) -> list[dict]:
    wb = openpyxl.load_workbook(xlsx, data_only=True)
    ws = wb["Canciones"]
    rows_raw = list(ws.iter_rows(values_only=True))
    out: list[dict] = []
    for r in rows_raw[1:]:
        if not r or not r[1] or not r[2]:
            continue
        artist = str(r[1]).strip()
        title = str(r[2]).strip()
        bpm = r[5]
        duration = r[6]
        key_raw = str(r[7]).strip() if r[7] else ""
        genre = str(r[8]).strip() if r[8] else "Rock"
        subgenre = str(r[9]).strip() if r[9] else ""
        notes_cell = str(r[26]).strip() if r[26] else ""

        key, mode, tono_notes = parse_tono(key_raw)
        notes_parts: list[str] = []
        if tono_notes:
            notes_parts.append(tono_notes)
        if notes_cell:
            notes_parts.append(notes_cell)
        if subgenre:
            notes_parts.append(subgenre)
        notes = " | ".join(notes_parts) if notes_parts else None

        out.append(
            {
                "artist": artist,
                "title": title,
                "bpm": int(bpm) if bpm is not None else 118,
                "key": key,
                "keyMode": mode,
                "genre": map_genre(genre, subgenre),
                "durationSec": parse_dur(duration) or 210,
                "notes": notes,
            }
        )
    return out


def write_ts(rows: list[dict]) -> None:
    lines: list[str] = [
        "import { DEFAULT_SONG_DURATION_SEC } from '@/constants/defaults';",
        "import { createId, nowIso } from '@/lib/id';",
        "import type { Genre, KeyMode, MusicalKey, Song, SongInput } from '@/types/models';",
        "",
        "/** Enriched playlist from playlist_musical_google_sheets.xlsx */",
        "type SeedRow = {",
        "  artist: string;",
        "  title: string;",
        "  bpm: number;",
        "  key: MusicalKey;",
        "  keyMode: KeyMode;",
        "  genre: Genre;",
        "  durationSec: number;",
        "  notes?: string;",
        "};",
        "",
        "const ROWS: SeedRow[] = [",
    ]
    for r in rows:
        base = (
            f"  {{ artist: {json.dumps(r['artist'], ensure_ascii=False)}, "
            f"title: {json.dumps(r['title'], ensure_ascii=False)}, "
            f"bpm: {r['bpm']}, key: '{r['key']}', keyMode: '{r['keyMode']}', "
            f"genre: '{r['genre']}', durationSec: {r['durationSec']}"
        )
        if r["notes"]:
            base += f", notes: {json.dumps(r['notes'], ensure_ascii=False)}"
        base += " },"
        lines.append(base)

    lines.extend(
        [
            "];",
            "",
            "function toSongInput(row: SeedRow): SongInput {",
            "  return {",
            "    title: row.title,",
            "    artist: row.artist,",
            "    bpm: row.bpm || 118,",
            "    key: row.key,",
            "    keyMode: row.keyMode,",
            "    genre: row.genre,",
            "    durationSec: row.durationSec || DEFAULT_SONG_DURATION_SEC,",
            "    notes: row.notes,",
            "  };",
            "}",
            "",
            "export function buildBarraLibreSeedSongs(): Song[] {",
            "  const stamp = nowIso();",
            "  return ROWS.map((row, index) => {",
            "    const input = toSongInput(row);",
            "    return {",
            "      ...input,",
            "      id: createId(`seed_${index}`),",
            "      createdAt: stamp,",
            "      updatedAt: stamp,",
            "    };",
            "  });",
            "}",
            "",
            "export function buildBarraLibreSongInputs(): SongInput[] {",
            "  return ROWS.map((row) => toSongInput(row));",
            "}",
            "",
            "export const BARRA_LIBRE_COUNT = ROWS.length;",
            "",
        ]
    )
    OUT.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    xlsx = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_XLSX
    if not xlsx.exists():
        raise SystemExit(f"File not found: {xlsx}")
    rows = load_rows(xlsx)
    write_ts(rows)
    print(f"wrote {OUT} ({len(rows)} songs) from {xlsx}")


if __name__ == "__main__":
    main()
