export const meta = (title: string, description: string) => ({
  meta: [
    { title: `${title} — BFP-PRISM` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — BFP-PRISM` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
