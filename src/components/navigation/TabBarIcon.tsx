import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';

interface TabBarIconProps {
  routeName: string;
  focused: boolean;
  color: string;
  size: number;
}

export function TabBarIcon({ routeName, focused, color, size }: TabBarIconProps) {
  const strokeWidth = focused ? 2.2 : 1.8;

  const renderIcon = () => {
    switch (routeName) {
      case 'Home':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 9.5L12 3L21 9.5V20C21 20.552 20.552 21 20 21H15V16H9V21H4C3.448 21 3 20.552 3 20V9.5Z"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={focused ? `${color}22` : 'none'}
            />
          </Svg>
        );
      case 'Roadmap':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 6L8 3L16 7L21 4V18L16 21L8 17L3 20V6Z"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={focused ? `${color}22` : 'none'}
            />
            <Line x1="8" y1="3" x2="8" y2="17" stroke={color} strokeWidth={strokeWidth} />
            <Line x1="16" y1="7" x2="16" y2="21" stroke={color} strokeWidth={strokeWidth} />
          </Svg>
        );
      case 'Assistant':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
              d="M21 15C21 15.53 20.79 16.04 20.41 16.41C20.04 16.79 19.53 17 19 17H7L3 21V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H19C19.53 3 20.04 3.21 20.41 3.59C20.79 3.96 21 4.47 21 5V15Z"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={focused ? `${color}22` : 'none'}
            />
            <Circle cx="9" cy="10" r="1" fill={color} />
            <Circle cx="12" cy="10" r="1" fill={color} />
            <Circle cx="15" cy="10" r="1" fill={color} />
          </Svg>
        );
      case 'Profile':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle
              cx="12"
              cy="8"
              r="4"
              stroke={color}
              strokeWidth={strokeWidth}
              fill={focused ? `${color}22` : 'none'}
            />
            <Path
              d="M4 20C4 17.239 7.582 15 12 15C16.418 15 20 17.239 20 20"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          </Svg>
        );
      default:
        return null;
    }
  };

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        width: size + 8,
        height: size + 8,
        borderRadius: (size + 8) / 2,
        backgroundColor: focused ? `${color}18` : 'transparent',
      }}
    >
      {renderIcon()}
    </View>
  );
}
