# Figma Setup (First Time, 10 Minutes)

This guide sets up a clean recruiter design workspace that matches the app.

## 1. Create Your File

1. In Figma, click `New design file`.
2. Name it `Touchpoint Grid - Recruiter UI`.
3. Create these pages:
   - `01 Foundations`
   - `02 Components`
   - `03 Screens`

## 2. Install the Plugin

1. In Figma, open `Resources` (top bar) then `Plugins`.
2. Search for `Tokens Studio for Figma`.
3. Install and run it in your new file.

## 3. Import the Tokens

Use this file:
- `/Users/k.far.88/Downloads/touchpoint-grid-repo-20260313/design/figma-tokens.json`

In Tokens Studio:
1. Open plugin menu.
2. Choose `Import`.
3. Select `JSON`.
4. Paste the JSON content from `figma-tokens.json`.
5. Confirm import and set theme to `Recruiter Daylight`.

## 4. Build Foundations Page

On page `01 Foundations`, make these sections:

1. `Color`
   - Surface: 0 through 4
   - Text: primary, secondary, tertiary
   - Accent: default, dim, muted
   - Priority: critical/high/medium/standard/low

2. `Typography`
   - Label XS: 10/14, medium
   - Body SM: 14/20, regular
   - Heading: 18/24, semibold
   - Mono Data: 11/16, medium

3. `Spacing + Radius`
   - spacing 4, 8, 12, 16, 20, 24
   - radius 6, 8, 12

## 5. Build Components Page

On `02 Components`, create reusable components:

1. `Pill Filter`
   - Height: 28
   - States: default, hover, selected

2. `Stat Card`
   - Compact card with label + number
   - Variants: neutral, critical, high, overdue, rebooked

3. `Table Row (Compact)`
   - Header height: 32
   - Row height target: 36
   - Include action icon buttons at 24x24

4. `Action Cluster`
   - Call, Text, Email, Copy, Nova, Log
   - Default and disabled states

## 6. Build Screen Page

On `03 Screens`:
1. Add one desktop frame at `1600 x 1100`.
2. Add layout grid: `12 columns`, `24 margin`, `24 gutter`.
3. Build:
   - Sticky top command bar
   - Stat cards row
   - Filter command row
   - Dense candidate table

## 7. Fast QA Checklist

Before handoff:
1. Is every color using a token (not random hex)?
2. Are table rows readable at laptop zoom (90-100%)?
3. Is urgency visible in under 2 seconds?
4. Are action buttons obvious but not noisy?
5. Is there enough contrast on text and badges?

## 8. Handoff Back to Code

When ready, share:
1. Figma file link.
2. One screenshot of `Foundations`.
3. One screenshot of final screen.

I can then map it directly to Tailwind classes and keep implementation pixel-tight.
