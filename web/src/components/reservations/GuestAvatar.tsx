import React from 'react';

interface GuestAvatarProps {
  name: string;
  accentColorClass: string;
  gradientClass: string;
  className?: string;
}

const GuestAvatar: React.FC<GuestAvatarProps> = ({ name, accentColorClass, gradientClass, className }) => {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl font-bold uppercase shadow-md ${accentColorClass} bg-gradient-to-br ${gradientClass} ${className ?? ''}`}
      aria-hidden
    >
      {name.charAt(0)}
    </div>
  );
};

export default GuestAvatar;
