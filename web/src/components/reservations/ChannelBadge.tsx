import React from 'react';

import { getChannelColor } from '@/utils/channelColors';

interface ChannelBadgeProps {
  channel: string;
  className?: string;
}

const ChannelBadge: React.FC<ChannelBadgeProps> = ({ channel, className }) => {
  const colors = getChannelColor(channel);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm ${className ?? ''}`}
      style={{
        backgroundColor: colors.background,
        color: colors.text,
      }}
    >
      {channel}
    </span>
  );
};

export default ChannelBadge;
