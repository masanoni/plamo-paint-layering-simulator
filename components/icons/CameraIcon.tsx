import React from 'react';

const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.825L4.087 16.51a2.887 2.887 0 002.888 3.334H17.02a2.887 2.887 0 002.888-3.334l-1.099-8.685a2.31 2.31 0 01-1.64-1.651L16.21 4.5a2.31 2.31 0 00-2.219-1.833H9.997a2.31 2.31 0 00-2.22 1.833L6.827 6.175z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
  </svg>
);

export default CameraIcon;