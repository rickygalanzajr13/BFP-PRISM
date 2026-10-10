<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Mock data lives in src/lib/mock-data.ts and all reads/mutations go through src/lib/store.ts — why: swap store bodies for the Node/SQLite API later without touching pages.
- Map uses Leaflet + OpenStreetMap (src/components/prism/GisMap.tsx), lazy-loaded browser-only behind IncidentMap — why: Leaflet needs window; IncidentMap keeps a stable props API. Incident coordinates come from the household record.
- Theme selection uses a root `dark` class and the `bfp-prism-theme` browser preference — why: enables token-based dark mode without changing page components.
- Desktop sidebar collapse uses an icon-only rail and the `bfp-prism-sidebar` browser preference — why: preserves navigation access while giving operational pages more room.

- Household contacts/accessibility tags are mutated only via store.ts (saveContact/removeContact) and shown only in authorized detail views, never in map popups/markers or URLs — why: treated as sensitive household data.
- Fire hydrants seed from src/lib/hydrant-data.ts and are merged by stable ID in store.ts; source coordinates are immutable and only 'Verified' hydrants are mapped or used for nearest-hydrant distance — why: preserve the supplied inventory and avoid plotting unconfirmed locations.
- Project scope is Barangay Commonwealth: map bounds come from src/data/barangay-commonwealth-boundary.json (OSM relation 1762721) and in-scope checks use point-in-polygon in src/lib/geo-scope.ts; out-of-scope records are flagged, never deleted or moved — why: rectangles/radii misrepresent the barangay shape.
