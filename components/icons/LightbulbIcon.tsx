import React from 'react';

const LightbulbIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-1.125 6.01 6.01 0 00-1.5-1.125m-1.5 2.25a6.01 6.01 0 011.5-1.125m5.121 2.25a6.04 6.04 0 01-.504 2.125M12 18v-5.25m-3.375-3.375a6.011 6.011 0 017.25-3.375m-3.875 5.25a6.011 6.011 0 00-7.25-3.375M12 18v-5.25m0 0a6.01 6.01 0 01-1.5-1.125 6.01 6.01 0 011.5-1.125m1.5 2.25a6.01 6.01 0 00-1.5-1.125M12 18v-5.25m3.375-3.375a6.011 6.011 0 00-7.25-3.375m-3.875 5.25a6.011 6.011 0 017.25-3.375" />
    </svg>
);

export default LightbulbIcon;