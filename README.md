# TIDEFRAME — Premium Cinematic Marketing Technology V3.4

Complete replacement files for the V3.4 performance and closing-layout pass.

## V3.4 fixes
- Hero video has an explicit source and eager preload so playback can begin immediately.
- All cinematic videos are muted/autoplay/loop/playsinline with eager buffering.
- Video switching waits for the incoming video to be ready before pausing the previous video.
- Videos are no longer paused because an individual IntersectionObserver entry briefly leaves the viewport.
- Video playback is not tied to hover state.
- Hero particles are lighter and hover-repulse is disabled to prevent pointer/hover frame drops.
- Scroll pin duration reduced for a tighter cinematic rhythm.
- Signal bridge reduced to a short visual transition.
- Final CTA compressed substantially so there is no oversized empty black area before the footer.
- Footer pulled directly after the final CTA.
- Existing TIDEFRAME structure and asset filenames preserved.

## Replace
Replace these complete files:
- index.html
- styles.css
- script.js
- README.md

Keep the existing `assets/` folder unchanged.

This release is designed to be uploaded as full-file replacements rather than incremental patches.


## V3.6
Final closing transition compressed so the signal bridge no longer creates a large black gap before THE NEXT MOVE.
