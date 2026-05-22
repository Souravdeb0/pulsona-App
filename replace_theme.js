const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all tsx files
const srcDir = '/Users/souravdeb/Desktop/polsona Healthcare/pulsona-app/src';
const files = execSync(`find "${srcDir}" -name "*.tsx" -o -name "*.ts"`).toString().split('\n').filter(Boolean);

for (const file of files) {
  if (file.includes('ThemeContext.tsx') || file.includes('_layout.tsx')) continue;

  let content = fs.readFileSync(file, 'utf8');

  // Skip if doesn't use useColorScheme
  if (!content.includes('useColorScheme')) {
    continue;
  }

  // 1. Remove useColorScheme from react-native imports
  content = content.replace(/useColorScheme,?\s*/g, '');
  
  // 2. Add useAppTheme import below react-native import, avoiding duplicates
  if (!content.includes('useAppTheme')) {
    // try to append after the first react-native or expo-router import block
    content = content.replace(/import {.*?}.*?from 'react-native';\n/s, (match) => match + "import { useAppTheme } from '@/context/ThemeContext';\n");
  }

  // 3. Replace the hook usage
  // We look for: const scheme = useColorScheme();
  content = content.replace(/const scheme = useColorScheme\(\);/g, 'const { isDark } = useAppTheme();');

  // 4. Sometimes it uses variables like 'isDark', which conflicts if there's const isDark = scheme === 'dark'.
  if (content.match(/const isDark = (scheme === 'dark'|!isDark)/g)) {
    // If it already had `const isDark = scheme === 'dark';`, remove it because we extracted it.
    content = content.replace(/const isDark = scheme === 'dark';\n?/g, '');
    content = content.replace(/const isDark = scheme === 'light';\n?/g, '');
  }

  // 5. Replace scheme === 'dark' with isDark and scheme === 'light' with !isDark
  content = content.replace(/scheme === 'dark'/g, 'isDark');
  content = content.replace(/scheme === 'light'/g, '!isDark');

  fs.writeFileSync(file, content);
  console.log('Updated', file);
}
