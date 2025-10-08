import type { Channel } from '@/types';

interface ChannelColor {
  background: string;
  text: string;
}

const CHANNEL_COLOR_MAP: Record<Channel, ChannelColor> = {
  airbnb: { background: '#FF5A5F', text: '#ffffff' },
  vrbo: { background: '#003B95', text: '#ffffff' },
  direct: { background: '#10B981', text: '#0b3d2c' },
};

const DEFAULT_COLOR: ChannelColor = { background: '#6B7280', text: '#ffffff' };

export const getChannelColor = (channel: Channel | string | undefined): ChannelColor => {
  if (!channel) {
    return DEFAULT_COLOR;
  }

  const key = channel.toLowerCase() as Channel;
  return CHANNEL_COLOR_MAP[key] ?? DEFAULT_COLOR;
};

export const CHANNEL_COLOR_HEX = (channel: Channel | string | undefined): string => getChannelColor(channel).background;

