import React from 'react';

// lucide-react has no dedicated "pants" or "dress" icon, so the app was previously reusing
// unrelated icons (PanelsTopLeft for Bottoms, ShoppingBag for Dresses) which don't read as
// clothing at all. These are small custom outline icons drawn in the same style as lucide
// (24x24 viewBox, currentColor stroke, 2px stroke width) so they drop in as direct replacements.

export function PantsIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 3h12l1 6-1 12h-3.5l-1.2-9-1.3 9H8.7L7.5 12 6.3 21H3l1-12z" />
      <path d="M6.3 9h11.4" />
    </svg>
  );
}

export function DressIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 3h6l1 3-1.5 1.5L17 20a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1l2.5-12.5L8 6z" />
      <path d="M9 3c0 1.5 1 2.5 3 2.5S15 4.5 15 3" />
    </svg>
  );
}
