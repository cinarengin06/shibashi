# Living Bagua responsive geometry fix

- Trigram nodes now use explicit circular x/y coordinates instead of percentage translation on each button.
- Node labels counter-rotate as the wheel turns, so the eight cards remain readable.
- Desktop wheel is capped at 590px and centered inside the stage.
- Tablet and mobile receive dedicated wheel, node, center, header and panel sizing.
- Mobile Bagua stage now has a stable aspect ratio and no longer collapses/disappears.
- AI badge, center card and captions were reduced for narrow screens.

Build note: dependencies were not present in this extracted package, so a complete local Next.js build could not be run in this environment.
