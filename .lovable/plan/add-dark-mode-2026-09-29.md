# Add dark mode

## Changes
- Add a light/dark switch to the bottom section of the sidebar, beside a clear mode label and icon.
- Persist the selected mode in the browser and default to the device preference when no choice has been saved.
- Add dark-theme color tokens for dashboard surfaces, text, borders, maps, sidebar states, and existing status colors without changing the layout or information hierarchy.
- Apply the saved theme before the page becomes visible to avoid a light flash during loading.

## Validation
- Check the switch and saved preference on desktop and mobile sidebar views.
- Review the dashboard and an incident page in both modes for readability and unchanged layout.
- Confirm the preview builds without errors.
