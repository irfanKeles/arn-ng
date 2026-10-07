import type { ArnResolvedConfig } from './config.types';

/**
 * The single place for library defaults. `locale` comes from Angular `LOCALE_ID`, `direction`
 * from the nearest `Directionality`, `messages` from `DEFAULT_MESSAGES` and `Intl` (see
 * `config.scope.ts`, `messages.ts`).
 */
export const DEFAULT_CONFIG: Omit<ArnResolvedConfig, 'direction' | 'locale' | 'messages'> = {
  size: 'md',
  density: 'comfortable',
  colorScheme: 'system',
  ripple: false,
  forms: { showErrorsOn: 'touched' },
};
