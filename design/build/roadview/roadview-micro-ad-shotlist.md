# RoadView Micro-Ad Shot List & Edit Template

This ready-to-edit package translates the storyboard into Premiere Pro or CapCut timelines you can drop footage and titles into immediately. The structure supports both 9:16 (primary) and 16:9 (alt) exports with synchronized beats (30s master timeline with 27s content + 3s logo out).

## Project Setup
- **Sequence presets**
  - `RoadView_9x16_Master`: 1080x1920, 30fps, 30.00s duration, safe margins 10% top/bottom.
  - `RoadView_16x9_Master`: 1920x1080, 30fps, nested from 9x16 master for quick reframing.
- **Tracks**
  - V1: Footage / gradient openers.
  - V2: Overlay assets (brand gradient adjustment layer, UI composites).
  - V3: Motion Titles (PNG placeholders or text layers).
  - A1: Music bed (royalty-free, 90–105 BPM).
  - A2: SFX hits (markers align at 2s, 6s, 10s, 18s, 24s).
  - A3: Voiceover (optional).
- **Adjustment layers**
  - `BR_GradientOverlay`: 1080x1920 solid with 20–30% opacity angular gradient (#FF4FD8 → #0096FF → #FDBA2D).
  - `CaptionSafe`: guide layer for captions, disabled on export.
- **Marker track**
  - Markers labeled `Beat01` (2s), `Beat02` (6s), `Beat03` (10s), `Beat04` (18s), `Beat05` (24s) for SFX and title timing.

## Deliverable Checklist
- Cut length: 00:27 content + 00:03 logo hold.
- Exports: H.264 High, VBR 2-pass 12–16 Mbps, AAC 320 kbps, Rec.709.
- Output: `RoadView_Teaser_9x16.mp4`, `RoadView_Teaser_16x9.mp4`, captions burned-in + `.srt` from transcript.

## Beat-by-Beat Shot List
| Time (mm:ss) | Section | Visual Direction | Placeholder Asset | Title / On-Screen Copy | Notes |
|--------------|---------|------------------|-------------------|------------------------|-------|
| 00:00–00:02 | **Open** | Slow push on BlackRoad gradient; subtle shimmer. | `PNG_Title_01.png` (“What if learning paid you back?” centered) | “What if learning paid you back?” | Fade in music (ambient pads). Maintain 20% gradient overlay. |
| 00:02–00:06 | **Spark** | Quick triple-cut: student notes → coder debugging → creator editing. | `PNG_LowerThird_01.png` (“Curiosity → Credits.”) | “Curiosity → Credits.” | Add 1–2 frame whip cuts between shots. Introduce light percussion at 6s. |
| 00:06–00:10 | **Loop** | Animated arrow loop (Learn → Create → Earn → Repeat). | `PNG_Title_02.png` (top third) | “Earn by being curious.” | Use ease-in/out for loop motion. Music adds warm synth pulse. |
| 00:10–00:14 | **Proof** | Dashboard micro-UI: credits counter ticking +1.2, RoadCoin icon pulsing. | `PNG_Title_03.png` (right aligned) | “No tracking. Just value.” | UI numbers animate with smooth ease-out. Layer subtle HUD glow. |
| 00:14–00:18 | **Community** | Montage of faces/avatars; dots connecting into abstract network map. | `PNG_Title_04.png` (left aligned) | “Built with you, not for you.” | Apply quick cut rhythm; add soft camera shake on beat. |
| 00:18–00:24 | **Reveal** | RoadView interface hero, parallax camera move. | `PNG_Title_05.png` (center) | “RoadView — learn. share. earn.” | Sync with swell at 18s. Depth blur ramp to focus UI. |
| 00:24–00:27 | **CTA** | CTA button hover highlight on gradient background. | `PNG_Title_06.png` (button label) | “BlackRoad.io • Join the beta” | Add gentle click SFX at 24s; VO optional. |
| 00:27–00:30 | **Logo Out** | BlackRoad wordmark on gradient, subtle shimmer exit. | `PNG_Title_07.png` (logo lockup) | — | Music tail reverb, fade to black at 30s. |

## Placeholder Asset Package
Use these filename conventions for quick swapping (export transparent PNGs at 2160px height for versatility):
1. `PNG_Title_01.png` – centered bold text (Medium sans, tracking +3, line height 112%).
2. `PNG_LowerThird_01.png` – lower-third bar with rounded 12px corners, 70% opacity fill.
3. `PNG_Title_02.png` – top third caption.
4. `PNG_Title_03.png` – right-aligned caption.
5. `PNG_Title_04.png` – left-aligned caption.
6. `PNG_Title_05.png` – center stacked lockup with accent underline.
7. `PNG_Title_06.png` – CTA button (240x72px) with hover glow.
8. `PNG_Title_07.png` – BlackRoad wordmark + RoadView mark.

Add optional `PNG_Subcaption_xx.png` files for localized captions; link text layers to captions via master style `BR_MedSans`.

## Audio Notes
- Track music at -14 LUFS integrated. Dip music to -6 dB under VO segments (ducking keyframes at 2s, 6s, 10s, 18s, 24s).
- Layer soft whoosh SFX aligned with title transitions; ensure hits coincide with beat markers.
- Leave -2 dB true peak headroom on export.

## Captions & Accessibility
- Source transcript from VO lines listed below.
- Generate captions (Premiere Text panel or CapCut Auto) → style with 70% black backing at 50% opacity.
- Sample `.srt` stub:
  ```
  1
  00:00:00,000 --> 00:00:02,500
  What if learning paid you back?

  2
  00:00:06,000 --> 00:00:09,000
  Earn by being curious.
  ```
- Verify caption safe area inside 10% margins for both aspect ratios.

## Voiceover Script (Optional)
1. “What if learning paid you back?”
2. “Earn by being curious.”
3. “No tracking. Just value.”
4. “RoadView — learn. share. earn.”
5. “Join the beta at BlackRoad.io.”

## Reuse Template Instructions
1. Duplicate timeline; swap footage clips per beat.
2. Update placeholder PNGs or text layers via the Motion Titles master style.
3. Adjust beat markers only if new pacing differs; otherwise keep 2/6/10/18/24s for SFX alignment.
4. Export both aspect ratios from the master sequence; verify CTA visibility in vertical safe zone.

This template lets you drag new footage into V1, replace PNG titles on V3, relink audio, and export within a single editing pass.
