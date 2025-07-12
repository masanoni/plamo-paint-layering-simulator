import React from 'react';

const EyedropperIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5l.415-.415a1.875 1.875 0 012.652 0l.668.668 2.651-2.652a1.875 1.875 0 012.652 0l.415.415M8.25 7.5l-2.652 2.652a1.875 1.875 0 000 2.652l.668.668a1.875 1.875 0 002.652 0l2.651-2.651M8.25 7.5l2.651 2.651" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 110-18 9 9 0 010 18z" />
  </svg>
);

export default EyedropperIcon;