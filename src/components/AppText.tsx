import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';

interface AppTextProps extends RNTextProps {
  weight?: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'bold' | 'normal';
}

/**
 * A custom Text component that enforces the 'Outfit' font family.
 * It automatically maps standard `fontWeight` styles to the corresponding font family variant.
 * Example: style={{ fontWeight: 'bold' }} -> fontFamily: 'Outfit_700Bold'
 */
export function AppText(props: AppTextProps) {
  const { style, weight, children, ...rest } = props;

  // Flatten the style array/object to read the target fontWeight
  const flattenedStyle = StyleSheet.flatten(style || {});
  const resolvedWeight = weight || flattenedStyle.fontWeight || '400';

  let fontFamily = 'Outfit_400Regular';

  switch (resolvedWeight) {
    case '100':
      fontFamily = 'Outfit_100Thin';
      break;
    case '200':
      fontFamily = 'Outfit_200ExtraLight';
      break;
    case '300':
      fontFamily = 'Outfit_300Light';
      break;
    case '400':
    case 'normal':
      fontFamily = 'Outfit_400Regular';
      break;
    case '500':
      fontFamily = 'Outfit_500Medium';
      break;
    case '600':
      fontFamily = 'Outfit_600SemiBold';
      break;
    case '700':
    case 'bold':
      fontFamily = 'Outfit_700Bold';
      break;
    case '800':
      fontFamily = 'Outfit_800ExtraBold';
      break;
    case '900':
      fontFamily = 'Outfit_900Black';
      break;
    default:
      fontFamily = 'Outfit_400Regular';
  }

  return (
    <RNText 
      {...rest} 
      style={[flattenedStyle, { fontFamily, fontWeight: undefined }]}
    >
      {children}
    </RNText>
  );
}
