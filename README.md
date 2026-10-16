# Roaring Society

A Three.js museum about social conflict and civil liberties in 1920s America. Historical narrative, source descriptions, dialogue and quest learning content remain in `js/data.js`.

## Run

Run `python -m http.server 8765` from this directory, then open http://localhost:8765/#play-now. No application build step is required.

## Visitor improvements

1. One Libre Franklin typography system. Body copy, buttons, navigation and dialog text use the same 16px base size; headings use a consistent hierarchy. Text-size accessibility settings still apply.
2. A 4096px atlas with photo-style marble, plaster, walnut and patinated metal, plus detailed shelves, papers, glazing and joinery. Surface roughness and metalness differ by material. Museum fog starts farther away and station labels replace floating pixel icons.
3. Visitors plan routes around furniture using A*, check the full body width along every step and yield to visitors and the player.
4. Every quest objective lists actual exhibit or station locations, including gallery, room, floor and artwork wall. Pinned quests point to their next unread source. Written activities explain where to study and how to answer in the Quest Book.
5. Teleports select a nearby landing in the intended wing with body clearance and at least two directions to walk away. Saved positions are checked on load.
6. All source viewers, activity dialogs and docent dialogs release pointer lock and clear held movement. Gameplay pauses while dialogs are open. Click the view to capture the mouse again.
7. Secret-panel inspection requires close range and a small joinery target. Undiscovered doors do not have a distinctive minimap color or quest coordinate marker.
8. A persistent HUD shows Curator Points: 25 per quest, 5 per new area/floor and 25 per hidden room. The optional makers' signature awards 20 bonus points. Rewards are paid once; old saved scores and completed quests are preserved.
9. The welcome dialog gives a step-by-step visit plan. Its action buttons remain visible while directions scroll on smaller screens.
10. Anish Mhaskar, Aarav Mishra, Manvi Mishra, and Myra Mehrotra are credited on the website and in-game credits. A physical signature plaque is hidden in the Archive Stacks.

## Validation

`tests/browser-check.cjs` checks real pointer lock and release, consistent body/control typography, all nine teleport destinations and escape directions, thirty simulated seconds of visitor collision checks, location guidance for all 44 quests, secret-panel inspection range, scoring and duplicate prevention, save/reload behavior, existing-save migration, creator-plaque interaction and mobile overflow.

Run a local server first. With Playwright installed, run `node tests/browser-check.cjs`. Optional environment variables: `PLAYWRIGHT_MODULE` (module path), `BROWSER_PATH` (Chromium or Edge executable), `TEST_URL` (default localhost:8765), `TEST_OUTPUT` (default work/verification).

This is a procedural 3D museum with photo-style materials; its geometry is not a photographic scan. Screenshots were reviewed at desktop and mobile sizes. Browser checks do not replace a complete story playthrough or testing on every mobile GPU.

## Texture asset

`assets/museum-materials.png` was created with the built-in image generation tool and is bundled locally. Its exact generation prompt is in `assets/museum-materials-prompt.txt`. Historical source imagery remains credited separately in each Source Card and has not been replaced by generated historical images.

## Smooth movement and rendering

The museum atlas is uploaded once. Fountain ripples use a separate small texture and an animated shader uniform, so water animation never reuploads the 4096px atlas. NPC details are combined into six animated meshes per character; visitors behind walls are not rendered. Only the two nearest chandelier lights are evaluated, and high-density displays use a bounded rendering resolution.

Player physics advances at 120Hz with camera-position interpolation and frame-independent acceleration. Up to 250ms of normal frame delay is simulated instead of discarding movement time after 50ms. NPC routing and interaction checks run once per rendered frame, with at most one new visitor route per frame. Head bob is gentler.

`tests/performance-check.cjs` verifies identical walking distance at 30/60/144 FPS and with a schedule containing 100ms stalls, six meshes per NPC, animated water without recurring texture uploads, two active gallery lights and bounded rendering resolution. Run it with the same Playwright environment variables as the main browser check.

A short local headless Edge comparison at 1019x759 and pixel ratio 1 measured 686 versus 137 draw calls, and a maximum sampled frame interval of 187.4ms versus 7.4ms after the fix. These are measurements from that local run, not a guaranteed frame rate on every device.

## Gallery-entry narration

The original gallery introduction plays once on entry to a gallery, by walking or teleporting. Moving between rooms or floors, or teleporting inside the same gallery, does not restart it. Leaving and re-entering the gallery plays it again. Master volume and captions are respected; old saved intro flags do not suppress a new gallery visit.

`tests/narration-check.cjs` captures speech-synthesis requests to check old-save startup, all nine destinations, quiet transitions within a gallery, walking between galleries, repeat-entry behavior and muted/caption behavior. It also verifies that the Bibliography Wall renders the planned book titles in italics rather than displaying literal HTML tags. No audio device is required for these checks.

## Recorded voice

Narration uses recorded clips in `assets/voice/line-NN.mp3` (lines 1-50). `js/voice.js` maps each moment to its clip: gallery intros (1-9), Radio Room readings (10-14), room introductions (15-46) and cues for quest complete, hidden room, first Source Card and leaving the museum (47-50). Captions show the same text. If a clip is missing or the browser blocks playback, the browser's built-in voice reads the same text instead. Room lines play the first time each room is entered during a visit, and after a gallery intro finishes. Delete the `rooms` entry in `js/voice.js` to switch room lines off.

`tests/voice-check.cjs` checks that all 50 clips load, each moment plays the right clip, the browser-voice fallback and volume 0. The Entrance Hall has only one detected room, so lines 16-18 (Visitor Directory, Museum Store, Ticket Desk) are recorded but not yet triggered.

## Background music and credits video

Five 1920s recordings in `assets/music/` play in a loop for the whole visit, starting on a random track. Volume is the Music setting times 0.4 (about 20% of full at the default of 0.5), so it stays quiet under the narration. Music pauses while the credits video plays. If a track cannot load, the built-in synth music plays instead. Edit `TRACKS` and `BGM_LEVEL` in `js/game.js` to change the playlist or loudness. Tracks: Whiteman, "Whispering"; Eubie Blake, "Charleston Rag"; Broadway Nitelites, "I Wanna Be Loved"; "2 to 2"; Alexander, "Where's That Band".

Easter egg: after the final quest (all five gallery stamps and the Curator's Argument), the Curator's Argument dialog shows "One more thing…", which opens the credits video (`assets/video/credits.mp4`, a 720x1280 web copy of the original). It can be replayed from the Curator's Office certificate screen. The video has no captions.

## Student parody films

Two student-made films hang as secondary-source exhibits (silver frames, upper level), each marked with a "Parody · modern, not a 1920s source" badge and a Source Card with a short blurb and an MLA citation:

- `g3-16` *Nosferatu* (student parody), Gallery III, Hall of Fear, upper level. A parody of the 1922 film.
- `g5-14` *Temperance* (student parody), Gallery V, Newsroom, upper level (next to the speakeasy exhibit). A parody of speakeasies and the temperance movement.

Files are in `assets/video/` (`*-parody.mp4` plus a `*-poster.jpg` used on the wall painting and as the video poster). To add another film, add an entry in `js/data.js` with `video`, `poster`, `parody:1` and an `mla` string; no other code changes are needed. Music and narration pause while a video plays. The films have no captions. Creator names on the cards are copied from each film's title card (first names only).
