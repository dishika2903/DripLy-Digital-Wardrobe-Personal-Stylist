import React from 'react';

export default function Logo({ className = 'h-8 w-8', label = 'DripLy' }) {
  return <img src="/hanger-mark.svg" className={className} alt={label} />;
}
