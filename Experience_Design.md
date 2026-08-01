# Shibashi EFE — Experience Design

## Product idea

Shibashi EFE is a digital Tai Chi dojo. It does not optimize exercise volume, streak anxiety, badges, or screen time. It helps a person arrive, listen, move, and leave more settled than they entered.

The core loop is:

**Arrive → breathe → notice → move → integrate → return to life.**

Every screen must answer six questions before it ships:

1. Why does this moment exist?
2. What should the person feel when it ends?
3. What is the single primary action?
4. What moves, and at what breathing pace?
5. Is sound or haptic genuinely useful here?
6. Which Shen atmosphere supports the moment without requiring explanation?

## Progressive journey

### 1. Arrival — days 1–7

Purpose: create safety and a repeatable daily ritual.

Visible: one daily practice, breath, intention, first posture, first movement.

Available from day one: Bagua, 5 Shen selection, journal, AI/Ghost Teacher, and earned XP. They remain secondary to the first ritual but are never hidden or time-gated.

Feeling: “I can do this; I have arrived somewhere calm.”

### 2. Practice — days 8–20

Purpose: build a gentle practice habit and learn the first 18 movements.

Emphasis shifts toward: movement path, posture history, AI Ghost Teacher when requested, one correction at a time.

Feeling: “My body is learning without being judged.”

### 3. Awareness — days 21–60

Purpose: connect movement with daily life and inner awareness.

Emphasis shifts toward: Bagua, familiar-language 5 Shen insights, journal, breath practices, body patterns.

Feeling: “I recognize what my body and attention need.”

### 4. Mastery — day 60+

Purpose: let the person lead their own practice.

Emphasis shifts toward: flow builder, quiet teacher mode, optional Ghost Teacher, long-term reflection.

Feeling: “The dojo trusts me; it is now a companion.”

## Core experiences

| Moment | Why it exists | Feeling | Motion | Sound | Haptic | Atmosphere |
|---|---|---|---|---|---|---|
| Splash | Mark the threshold from daily life to dojo | Arrival | 1600 ms ink-ring reveal | One distant bell, wind | None | Neutral dawn |
| First silence | Remove urgency before asking anything | Permission to slow down | 1200 ms fade, no controls for first beat | Wind and water | None | Soft mist |
| Breath | Establish the product’s rhythm | Spaciousness | 4–4–6 ring expansion | Quiet breath bed | Soft at inhale start | Current need, not Shen terminology |
| Intention | Hear why the person came | Being understood | Options drift in one by one | None | Selection only | Warm neutral |
| Body check-in | Notice without scoring | Acceptance | Droplet/slider follows touch | Subtle water | Selection at meaningful stops | Stone and water |
| First posture | Create a baseline, not a grade | Curiosity and safety | Slow body outline and scan | Single preparation cue | Success at completion | Neutral charcoal/bronze |
| Daily home | Offer one clear next step | “I know what to do now” | Background breath, one card rise | Optional ambience | None | Active Shen world |
| Practice | Keep attention in the body | Flow | Natural camera/teacher motion | Voice only when needed | Breath and completion only | Active Shen world |
| Completion | Help the practice settle | Quiet accomplishment | Ink circle closes in 1200 ms | Bell + water tail | Soft success | Warm gold |

## Information hierarchy

The first screen after onboarding contains only:

- a human greeting;
- the day’s atmosphere;
- one recommended ritual;
- one secondary path appropriate to the current journey layer.

No percentages appear until a real measurement exists. No traditional term appears before its familiar meaning. The pattern is:

**“Sakin güç” → later: “Gelenekte buna Zhi denir.”**

## Five Shen worlds

- **Hun:** dawn, open horizon, moving air, growth, hope. Motion drifts upward and outward.
- **Po:** earth, weight, breath, trust, centered strength. Motion settles downward.
- **Yi:** mist, soft light, attention, focus, inner balance. Motion narrows and becomes still.
- **Zhi:** night, moonlight, deep water, silence, will. Motion flows slowly beneath the surface.
- **Shen:** synthesis, gold light, harmony, connection. Motion gathers separate particles into one field.

Shen changes atmosphere, rhythm, shape language, and micro-interaction—not only color.

### Visual personality matrix

| World | Contrast | Shape language | Heading behavior | Primary control | Transition character |
| --- | --- | --- | --- | --- | --- |
| Hun | luminous green over forest shadow | lifted corners, organic diagonals | medium, slightly open tracking | fresh leaf-lime | quick upward reveal |
| Po | bronze over deep earth | low, grounded, almost square | semibold, stable tracking | warm clay-gold | short, weighted dissolve |
| Yi | ivory over neutral mist | precise, compact geometry | medium, slightly tight tracking | clear ivory | focused crossfade |
| Zhi | moon blue over deep water | long curves and pill forms | regular, wide tracking | cool moon blue | slow lateral water fade |
| Shen | gold over warm charcoal | circles and complete rings | semibold, ceremonial tracking | bright gold | radial light arrival |

The transition remains calm, but the visual state change must be unmistakable within the first 250 ms. Background, surface, control shape, title rhythm, and accent change together; color never changes alone.

## Visual language

- Backgrounds: `#0B0E12`, `#14181C`, `#20252B`; never pure black.
- Materials: stone, fog, ivory, soft bronze, muted gold.
- Titles: Cormorant Garamond; body: Inter.
- Layout: mobile-first, generous negative space, one dominant action.
- Cards are used only when containment carries meaning. Onboarding is a continuous ritual, not a stack of cards.
- Glass effects are rare and subtle. Borders are quieter than content.

## Motion, sound, and touch

- Motion durations: 600, 900, 1200, 1600 ms.
- Easing: `easeInOut`; spring motion only for direct manipulation.
- Animation must use opacity and transforms where possible and respect reduced-motion preferences.
- Sound begins only after user consent or direct interaction.
- Haptics are reserved for breath start, posture completion, and day completion.
- During active iOS camera use, do not rely on haptics; the system may suppress them.

## Product guardrails

- Never show fake scores, fake history, fake progress, or placeholder health measurements.
- Never expose unavailable functionality as if it works; label it “Kilitli” and explain when it opens.
- Never show more than one correction while a person is moving.
- Never interrupt a quiet moment to teach terminology.
- Never make streak loss feel like failure. Returning is always framed as beginning again.
