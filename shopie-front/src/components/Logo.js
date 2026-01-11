import React from 'react';
import { View, Text } from 'react-native';

const Logo = ({ size = 60, style = {} }) => {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Text style={{
        fontSize: size * 0.8,
        textAlign: 'center',
        lineHeight: size,
      }}>
        🛍️
      </Text>
    </View>
  );
};

export default Logo;