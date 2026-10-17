import type { Stage } from './progress';
import type { RomanMode } from './theme';

/** Should the romanization show under a letter, given the setting and how well it's known? */
export function showRoman(mode: RomanMode, stage: Stage) {
  if (mode === 'on') return true;
  if (mode === 'off') return false;
  return stage !== 'familiar' && stage !== 'mastered';
}
