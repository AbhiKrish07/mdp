# Deskbot — Simulator Frontend Plan

## Product approach

Build a frontend-only interactive simulator for a desk companion robot intended to be built in real life. The central user journey is issuing a natural-language voice/text command or a simulated hand gesture and watching the robot interpret the intent, choose a safe action, move or gesture in its simulated desk scene, and report what happened. This is not a hardware setup/control panel. No server/API, physical hardware, external integrations, credentials, or real device I/O will be added; mock service and sensor states will be clearly labeled as simulated. Browser speech recognition may be used only after an explicit mic-button action and where supported, with a typed-command fallback.

## Scope and implementation

- Use the initialized React + TypeScript + Vite project; implement the simulator in client code, without database or backend changes.
- Replace the starter home page with a cohesive responsive simulator workspace and reusable UI sections/components. Keep global app state local to the client: selected view, robot state/location, privacy/mic state, interaction transcript, pending mission, agent mock activity, integrations, servo/sensor values, and event log.
- Provide main navigation for Workstation, Robot Sim, Vision, Agents, Integrations, and Diagnostics. Keep a robot status preview and privacy cutoff accessible globally.
- Workstation is the default, command-centered daily-driver view: a prominent desk scene with robot and safe perimeter, a conversational command area, recent intent/action feedback, face/state preview, and useful agent/telemetry cards.
- Robot Sim presents a stylized 90cm × 60cm top-down desk with furniture/object obstacles, a mobile robot marker and trajectory, edge safety region, selectable destinations/gesture requests, and simulated auto-halt. Controls should be framed as scenario/command inputs to the simulation, not direct physical servo control.
- Voice/text commands share an intent dispatcher that recognizes a useful demo vocabulary (e.g., navigate to the laptop, inspect the mug, wave, celebrate, stop, return home) and shows interpreted intent, response, robot state change, trajectory, and event history. Include speech capture via native browser speech recognition if present, with graceful text entry when not.
- Gesture interaction is a safe, explicitly simulated input lane. Provide a live-feeling gesture pad with recognizable semantic gestures (open palm = stop, point = navigate/inspect target, thumbs up = confirm/continue, wave = greet), and route those through the same intent dispatcher as voice/text. Do not suggest that a webcam or robot is being operated when none is connected.
- Vision view simulates camera framing, pan/tilt, recognition regions, extracted text, and example inspection prompts/outcomes.
- Agents view shows Code, Research, Executive, and Robot Hardware mock agents, a tool registry, and transparent action/observation/resolution events. Show observable action summaries only; do not claim to reveal private chain-of-thought.
- Integrations view displays illustrative connection states, simulated webhook test feedback, and masked example configuration fields/snippet export. It never transmits real service requests or stores real API keys.
- Diagnostics view offers simulated servo/sensor values, serial packet samples and filterable audit events, clearly labeled mock telemetry.
- Respect browser microphone permission by asking only when the user explicitly starts speech input. A hard privacy cutoff must stop speech capture and visibly indicate that listening is disabled.

## Design

- **Design Movement:** Industrial sci-fi instrumentation meets a calm, premium robotics lab console; credible enough for an engineering bench, approachable enough for conversational use.
- **Core Principles:** (1) intent first, configuration second; (2) every command produces legible feedback; (3) simulated vs. connected states are never ambiguous; (4) safety and privacy remain one action away.
- **Color Philosophy:** Deep graphite/navy surfaces establish focus; warm amber marks the robot's identity and in-progress missions; cyan denotes sensing/telemetry; green is reserved for confirmed safe completion; coral/red communicates stop, fault, and privacy cutoff.
- **Layout Paradigm:** Asymmetric desktop control-room layout with a slim navigation rail, wide center stage for the robot/desk simulation, and a narrower context/command rail. On small screens, stack scene, command interface, and status into a single scrollable flow.
- **Signature Elements:** A softly glowing amber robot visor; a fine cyan desk-grid with amber trajectory arc; compact event chips that distinguish voice, gesture, and safety-originated actions.
- **Interaction Philosophy:** Every input describes or demonstrates intent; a compact “heard → understood → acted → result” chain makes the simulation understandable. Provide visible stop/cutoff states and reversible scenario actions.
- **Animation:** Slow ambient visor idle pulse; short eye/mouth changes per state; command events enter with a restrained fade/slide; a dashed robot path animates only during simulated motion; no continuous distracting movement.
- **Typography System:** Use a clean UI sans-serif stack for content and labels, paired with a system monospace stack for coordinates, telemetry and event traces. Use sentence case, compact labels, and a clear numeric hierarchy.
- **Brand Essence:** “A rehearsal desk for a robot that understands how you ask.” Personality: curious, precise, reassuring.
- **Brand Voice:** Clear and conversational, never pretending simulated hardware is real. Example: “I heard: inspect the mug.” and “Edge detected — I stopped before the desk boundary.”
- **Wordmark & Logo:** Deskbot wordmark paired with a small two-eye visor mark and orbit/trajectory slash, rendered in CSS/SVG rather than generic emoji.
- **Signature Brand Color:** Signal amber, used as a focused highlight rather than a broad background.

## Project structure

- `client/src/pages/Home.tsx` — workspace composition, navigation, and coordination of the simulation state.
- `client/src/components/simulator/` — reusable robot face, desk map, command composer/gesture pad, activity feed, and screen panels.
- `client/src/lib/` — typed demo data and deterministic intent/gesture-to-action simulation helpers.
- `client/src/index.css` — global visual system, layout responsiveness, and state animations.
- `public/manus-routes.json` — complete page-route manifest (`/` only).

## Serving

Serve through the initialized Vite static frontend using `pnpm dev:static` on the configured port. No database or backend changes are needed. The frontend is a self-contained simulator and any future backend wiring is outside this iteration.
