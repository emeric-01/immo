import "server-only";

import sanitizeHtml from "sanitize-html";

const propertyDescriptionTags = [
  "p",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "b",
  "i",
  "br",
  "blockquote",
  "hr",
];

export function sanitizePropertyDescription(value: string) {
  return sanitizeHtml(value, {
    allowedAttributes: {},
    allowedTags: propertyDescriptionTags,
    disallowedTagsMode: "discard",
  });
}
