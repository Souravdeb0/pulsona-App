const fs = require('fs');
const { execSync } = require('child_process');

const srcDir = '/Users/souravdeb/Desktop/polsona Healthcare/pulsona-app/src';
const files = execSync(`find "${srcDir}" -name "*.tsx" -o -name "*.ts"`).toString().split('\n').filter(Boolean);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.match(/const scheme = \(\);/)) {
    content = content.replace(/const scheme = \(\);/g, 'const { isDark } = useAppTheme();');
    changed = true;
  }

  // Also remove old use-theme usage, just in case
  if (content.match(/import \{ as useRNColorScheme \} from 'react-native';/)) {
     content = content.replace(/import \{ as useRNColorScheme \} from 'react-native';/g, "import { useColorScheme as useRNColorScheme } from 'react-native';");
     changed = true;
  }
  if (content.match(/export function \(\) \{/)) {
     content = content.replace(/export function \(\) \{/g, "export function useColorScheme() {");
     changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
}
