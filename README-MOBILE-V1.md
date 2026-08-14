# TIDEFRAME — Phone Optimization

This pass is designed specifically for phones without changing the desktop cinematic composition.

### Changes
- Dedicated mobile CSS for 800px and below.
- Desktop pinning is removed on phones to eliminate scroll jumps and address-bar viewport issues.
- Hero typography and CTA controls are resized for one-handed use.
- Cinematic sections are shortened to reduce excessive vertical scrolling.
- Mobile navigation is tightened and touch targets are kept large enough for reliable tapping.
- Non-hero videos use metadata preload to reduce initial data usage.
- Mobile video playback is re-woken after page visibility changes and on first touch.
- Decorative bridge remains removed; the CTA flows directly into the footer.
- Stats are arranged as a clean 2×2 mobile grid.

Keep the existing `assets/` folder unchanged.
