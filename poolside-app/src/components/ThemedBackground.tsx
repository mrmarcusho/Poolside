import React from 'react';
import { ProfileTheme } from '../api/services/users';
import { PoolWaterBackground } from './PoolWaterBackground';
import { FlamesBackground } from './FlamesBackground';
import { MarbleBackground } from './MarbleBackground';

interface ThemedBackgroundProps {
  theme: ProfileTheme;
  style?: object;
}

export const ThemedBackground: React.FC<ThemedBackgroundProps> = ({ theme, style }) => {
  switch (theme) {
    case 'pool_water':
      return <PoolWaterBackground style={style} />;
    case 'flames':
      return <FlamesBackground style={style} />;
    case 'marble':
      return <MarbleBackground style={style} />;
    default:
      return <PoolWaterBackground style={style} />;
  }
};
