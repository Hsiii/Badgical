# Badgical Builder Audit

Date: 2026-06-15
Surface: `http://localhost:5173/`
Mode: Combined UX and accessibility audit from screenshots
Capture tool: Codex in-app Browser

## Captured Steps

1. Search entry
   - Screenshot: `01-search-entry.png`
   - Health: Good, with one clarity risk.
   - Notes: The primary workflow is visible in one screen: search, variants, frames, preview, and export. The result pane is capped to about 2.5 card rows, which gives the lower controls room. The screen can still show a previous selected brand while the user is browsing the catalog, so the relationship between current selection and visible search results needs to stay clear.

2. Brand selected
   - Screenshot: `02-brand-selected.png`
   - Health: Good.
   - Notes: Selecting a brand updates the selected card, variants, and Add Frame action. There is a short loading gap before previews settle, but the final state is understandable. The two available variants keep the choice focused.

3. Inverse variant selected
   - Screenshot: `03-inverse-variant.png`
   - Health: Good, with an affordance risk.
   - Notes: The checkmark communicates the selected variant, and the side-by-side previews make comparison quick. The variant controls are image-only with no visible text labels, so users must infer Brand vs Inverse from the preview itself unless they use assistive labels.

4. Custom controls
   - Screenshot: `04-custom-controls.png`
   - Health: Mixed.
   - Notes: Moving custom controls into a separate tab helps keep the variant section focused. The controls are grouped by Badge, Logo, and Text. The logo preview dominates the panel, which helps inspection but pushes the action area lower. The color inputs and hex fields are clear for technical users, but there is little guidance for users who do not know what Badge, Logo, and Text each affect.

5. Frame added and preview enabled
   - Screenshot: `05-frame-added-preview.png`
   - Health: Good.
   - Notes: Adding a frame updates the frame count, frame rail, preview, and export button. This is a strong confirmation loop. The frame row is compact and has edit/delete actions, but the icons are small and rely on hover/title or accessible names for meaning.

6. Frame editing
   - Screenshot: `06-frame-editing.png`
   - Health: Good.
   - Notes: Clicking edit opens the Custom tab and changes the primary action to Update Frame. This makes the editing mode visible without opening a modal. The active frame itself is not visually highlighted in the rail, so editing context could become unclear once there are multiple frames.

7. Export dialog
   - Screenshot: `07-export-dialog.png`
   - Health: Good.
   - Notes: The export dialog gives repository/folder inputs, raw URL, README HTML, copy actions, and download. The modal content is clear and task-focused. The raw URL field is long and horizontally constrained; users may not easily inspect the end of the URL. The dimmed background confirms modality.

## Strengths

- The core workflow is compact and efficient: choose a logo, choose a variant, add a frame, preview, export.
- The Search/Custom split reduces cognitive load in the main variant section.
- The frame rail and preview provide immediate confirmation after adding a frame.
- Export options are practical for the expected GitHub README use case.
- The UI uses restrained spacing, clear panels, and consistent icon buttons.

## UX Risks

1. Variant options are visually clear but not text-labeled on screen.
   - Evidence: Steps 2 and 3.
   - Impact: Users may not know which preview is Brand or Inverse without trying both.
   - Recommendation: Add compact visible labels near each preview, or show the selected label in the variant header.

2. The Custom tab may feel disconnected from the selected brand.
   - Evidence: Step 4.
   - Impact: Users can edit colors and source, but the relationship to the current frame or selected search result is implicit.
   - Recommendation: Add a small selected-brand label or badge in Custom, especially when editing an existing frame.

3. Editing a frame lacks a strong rail-level selection state.
   - Evidence: Step 6.
   - Impact: With multiple frames, users may lose track of which frame Update Frame will modify.
   - Recommendation: Highlight the active frame card while editing and consider changing the rail action icon state.

4. The logo preview is very large in Custom.
   - Evidence: Step 4.
   - Impact: It helps inspect the logo, but it competes with text and color controls in a dense builder.
   - Recommendation: Consider capping the logo preview height or using a split preview/detail layout inside Custom.

## Accessibility Risks

1. Some visible controls rely on icon-only meaning.
   - Evidence: Steps 5 and 6.
   - Screenshot evidence shows edit and delete as icons only. Accessible names may exist, but screenshots alone cannot confirm keyboard focus order or screen reader output.
   - Recommendation: Verify keyboard focus, accessible names, and tooltip behavior for frame edit/delete and export copy actions.

2. Variant choices lack visible text labels.
   - Evidence: Steps 2 and 3.
   - Users with cognitive or low-vision needs may benefit from visible labels in addition to preview images.
   - Recommendation: Add visible labels or a selected-state label that does not rely only on image comparison.

3. Color contrast needs live verification.
   - Evidence: Steps 3, 4, and 7.
   - The screenshots show red text on white and muted text over dimmed backdrops. Screenshots are not enough to prove WCAG contrast.
   - Recommendation: Run automated contrast checks against token values and generated badge colors.

4. Dialog focus behavior could not be verified from screenshots.
   - Evidence: Step 7.
   - The modal looks visually modal, but screenshots do not prove focus trap, Escape behavior, or return focus.
   - Recommendation: Test keyboard-only open, tab order, close, and return focus.

## Evidence Limits

- Screenshots do not prove screen reader semantics, keyboard navigation, focus order, focus visibility, or color contrast ratios.
- The audit did not inspect network failures, slow-loading SVGs, malformed SVG input, or validation errors.
- The audit used one desktop viewport from the current in-app browser. Mobile and zoom reflow were not checked.
- The audit captured one representative brand and one frame. Multi-frame animation timing and long frame lists need separate testing.

## Recommendations

1. Add visible labels for Brand and Inverse variant previews.
2. Highlight the frame being edited and keep Update Frame tied to that visual state.
3. Add a compact selected-brand/current-frame indicator inside Custom.
4. Reduce or constrain the Custom logo preview height if it crowds controls on shorter viewports.
5. Run a focused accessibility pass for keyboard flow, modal focus trapping, contrast, and generated badge accessible names.
