# RoadView Scene Graph & Creator Flow

## Overview

This document defines the initial JSON scene graph schema and outlines the creator workflow for building interactive "infographic + video" lessons in RoadView. The goal is to give engineering and design teams a concrete blueprint for implementing the SceneBuilder, VisualGen, and related services described in the product concept brief.

## Design Principles

- **Composable blocks**: Scenes are composed of reusable blocks (script, visuals, voice, citations, quizzes) that the editor can arrange along a timeline.
- **Separation of content and presentation**: Content is stored in structured JSON to enable multiple renderers (web player, export pipeline) to interpret it consistently.
- **Traceability**: Every claim and data point can link back to a source, reinforcing the "trust by design" differentiator.
- **Interactivity-first**: Hotspots, quizzes, code cards, and variable controls are first-class citizens in the scene graph.

## Scene Graph Schema (Draft)

### Root Structure

```json
{
  "version": "1.0.0",
  "meta": {
    "title": "string",
    "slug": "string",
    "description": "string",
    "duration": 0,
    "tags": ["string"],
    "level": "beginner | intermediate | advanced",
    "estimated_time": 0,
    "cover_art": {
      "thumbnail_url": "string",
      "badges": [
        { "label": "Level", "value": "B1" },
        { "label": "Time", "value": "10m" },
        { "label": "Sources", "value": "5" }
      ]
    }
  },
  "chapters": [
    {
      "id": "chapter-uuid",
      "title": "string",
      "summary": "string",
      "start_time": 0,
      "end_time": 0,
      "scenes": ["scene-uuid"]
    }
  ],
  "scenes": {
    "scene-uuid": {
      "id": "scene-uuid",
      "type": "standard | code | timeline | quiz",
      "label": "string",
      "start_time": 0,
      "end_time": 0,
      "script": {
        "blocks": [
          {
            "id": "script-block-uuid",
            "type": "narration | quote | bullet | code",
            "content": "markdown",
            "voice_track": "voice-track-uuid",
            "captions": [
              {
                "start": 0,
                "end": 0,
                "text": "string"
              }
            ]
          }
        ]
      },
      "visuals": [
        {
          "id": "visual-uuid",
          "kind": "chart | diagram | media | code_diff | timeline | table",
          "source": "auto | upload | external",
          "payload": {},
          "layout": {
            "x": 0,
            "y": 0,
            "width": 0,
            "height": 0,
            "z_index": 0
          },
          "transitions": [
            {
              "type": "fade | slide | draw",
              "start": 0,
              "end": 0,
              "easing": "string"
            }
          ],
          "hotspots": [
            {
              "id": "hotspot-uuid",
              "timecode": 0,
              "position": { "x": 0, "y": 0 },
              "label": "string",
              "body": "markdown",
              "actions": [
                {
                  "type": "open_source | show_definition | copy_code | trigger_quiz",
                  "payload": {}
                }
              ]
            }
          ]
        }
      ],
      "citations": [
        {
          "id": "citation-uuid",
          "label": "[1]",
          "source_type": "url | book | dataset | paper",
          "reference": {
            "title": "string",
            "author": "string",
            "publisher": "string",
            "year": 0,
            "url": "string"
          },
          "linked_elements": ["visual-uuid", "script-block-uuid"]
        }
      ],
      "assessments": [
        {
          "id": "quiz-uuid",
          "type": "multiple_choice | free_response | slider",
          "prompt": "markdown",
          "options": [
            {
              "id": "option-uuid",
              "label": "string",
              "is_correct": true,
              "explanation": "markdown"
            }
          ],
          "trigger_time": 0,
          "reward": { "coins": 0 },
          "retry_policy": {
            "max_attempts": 2,
            "feedback": "detailed | minimal"
          }
        }
      ],
      "code_cards": [
        {
          "id": "code-card-uuid",
          "language": "string",
          "title": "string",
          "description": "markdown",
          "snippets": [
            {
              "id": "snippet-uuid",
              "label": "Before",
              "code": "string",
              "highlight_ranges": [[0, 3]]
            },
            {
              "id": "snippet-uuid",
              "label": "After",
              "code": "string",
              "highlight_ranges": [[4, 7]]
            }
          ],
          "sandbox_url": "string"
        }
      ]
    }
  },
  "assets": {
    "voices": [
      {
        "id": "voice-track-uuid",
        "source": "tts | upload",
        "url": "string",
        "duration": 0,
        "speaker": "string"
      }
    ],
    "datasets": [
      {
        "id": "dataset-uuid",
        "name": "string",
        "type": "csv | json | gist",
        "source_url": "string",
        "schema": [
          { "field": "string", "type": "string" }
        ],
        "refresh_policy": "manual | roadsync"
      }
    ]
  }
}
```

### Payload Types

- **Charts**: specify chart type, axes, data bindings, annotations, optional animation steps.
- **Diagrams**: node/edge definitions, layout hints, callout order.
- **Media**: references to images or videos; include playback controls and accessibility descriptions.
- **Code Diff**: base and revised snippets, inline comments, diff metadata.
- **Timeline**: events array with dates, media attachments, highlight ranges.
- **Table**: column schema, row data, sort/filter options.

### Timing Model

- All time fields are in milliseconds relative to the start of the scene unless otherwise noted.
- `start_time` and `end_time` on scenes enable the editor to snap visuals to the main voice track.
- Hotspots can trigger relative to time or to user interactions (e.g., on pause).

### Extensibility Hooks

- `custom` field on any entity allows experimental features without breaking schema.
- Schema version increments when breaking changes occur; renderers should advertise supported versions.

## Creator Flow Wireframe (Narrative)

1. **ScriptBuilder**
   - Left pane: hierarchical outline of headings and subpoints.
   - Center editor: rich markdown with comment sidebar for reviewer feedback.
   - Right rail: research tray showing citations, datasets, and previous lesson references.
   - Primary actions: import markdown, sync from Google Docs, lock script for storyboard.

2. **Auto-Storyboards**
   - Upon locking the script, headings are parsed into scene cards.
   - Grid view displays suggested visual types (chart, timeline, code) based on content tags.
   - Creator can accept suggestions or swap templates; quick-add buttons for code cards and quizzes.

3. **VoiceSynth**
   - Timeline view with auto-generated narration segments per script block.
   - Options to upload recorded audio or choose neural TTS voice; real-time preview with captions.
   - Captions editor allows fine-grained timing adjustments and pronunciation tweaks.

4. **VisualGen**
   - Dual-pane layout: left for data/configuration, right for live preview.
   - Data panel supports RoadSync imports (CSV/JSON/Gist) and manual tables.
   - Component palette for charts, timelines, diagrams, and code diffs with parameter controls.
   - Inline citation picker connects visuals to source references.

5. **SceneEditor**
   - Split-screen canvas showing infographic on left, video/voice timeline on right.
   - Tracks for script, visuals, hotspots, quizzes, and citations with draggable handles.
   - Contextual inspector to adjust layout, transitions, and interactivity settings.
   - Preview mode simulates hover hotspots, copy events, and quiz flows.

6. **Publish to RoadView**
   - Publishing checklist verifies citations, accessibility (alt text, caption coverage), and dataset sync status.
   - SEO card builder generates signature thumbnail with diagram fragment and title lockup.
   - Distribution options: public lesson, curriculum pack inclusion, export to LMS.
   - Analytics dashboard stub shows expected metrics (completion rate, heatmaps, RoadCoin earned).

## Next Steps

- Validate schema with engineering leads; refine payload definitions for each visual type.
- Design low-fidelity wireframes for each flow step using the narrative above.
- Prioritize golden templates (e.g., math proof, code walkthrough) and produce sample scene graph files to test rendering pipelines.

