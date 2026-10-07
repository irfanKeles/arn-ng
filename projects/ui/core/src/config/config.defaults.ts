import type { ArnResolvedConfig } from './config.types';

/**
 * The single place for library defaults. `locale` comes from Angular `LOCALE_ID`, `messages`
 * from `DEFAULT_MESSAGES` and `Intl` (see `config.scope.ts`, `messages.ts`).
 */
export const DEFAULT_CONFIG: Omit<ArnResolvedConfig, 'locale' | 'messages'> = {
  size: 'md',
  density: 'comfortable',
  colorScheme: 'system',
  direction: 'auto',
  ripple: false,
  forms: { showErrorsOn: 'touched' },
};
