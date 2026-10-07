// @ts-check
import eslint from '@eslint/js';
import angular from 'angular-eslint';
import tseslint from 'typescript-eslint';

// §4: decorator tabanlı API ve NgModule yasak
const restrictedAngularImports = [
  {
    name: '@angular/core',
    importNames: ['Input', 'Output'],
    message: 'input(), output(), model() kullan (SKILL §4).',
  },
  {
    name: '@angular/core',
    importNames: ['HostBinding', 'HostListener'],
    message: 'host: { ... } metadata kullan (SKILL §4).',
  },
  {
    name: '@angular/core',
    importNames: ['NgModule'],
    message: 'NgModule yok, tüm bileşenler standalone (SKILL §3).',
  },
];

// §15: testler Jasmine'e özgü API kullanmaz (Vitest'e geçişi kolaylaştırmak için)
const jasmineOnlyMessage =
  "Jasmine'e özgü API; describe/it/beforeEach/afterEach/expect ile yetin (SKILL §15).";
const jasmineOnlyGlobals = [
  'jasmine',
  'spyOn',
  'spyOnProperty',
  'spyOnAllFunctions',
  'expectAsync',
  'fail',
  'pending',
  'fdescribe',
  'fit',
  'xdescribe',
  'xit',
];

// Kurallar .claude/skills/arn-ui-library/SKILL.md ile eşleşir; bölüm numaraları oraya atıftır.
export default tseslint.config(
  {
    ignores: ['dist/', '.angular/', 'coverage/', 'out-tsc/'],
  },
  {
    files: ['**/*.mjs'],
    extends: [eslint.configs.recommended],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      ...angular.configs.tsRecommended,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    processor: angular.processInlineTemplates,
    rules: {
      'no-restricted-imports': ['error', { paths: restrictedAngularImports }],
      // §4: SSR güvenliği
      'no-restricted-globals': [
        'error',
        {
          name: 'window',
          message: 'inject(DOCUMENT).defaultView veya afterNextRender kullan (SKILL §4).',
        },
        { name: 'document', message: 'inject(DOCUMENT) kullan (SKILL §4).' },
        {
          name: 'localStorage',
          message: 'Doğrudan erişme; platform kontrolüyle sarmala (SKILL §4).',
        },
      ],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-standalone': 'error',
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-output-emitter-ref': 'error',
      '@angular-eslint/prefer-inject': 'error',
      '@angular-eslint/use-lifecycle-interface': 'error',
      // Gövdesi boş Angular sınıfları (bileşen, directive) meşru
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
    },
  },
  {
    files: ['projects/ui/**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'arn', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'arn', style: 'kebab-case' },
      ],
      // §2: element sınıfı `ArnButton`, directive `ArnButtonDirective`
      '@angular-eslint/component-class-suffix': 'off',
      // Stiller ayrı dosyada dursun ki Stylelint görebilsin
      '@angular-eslint/component-max-inline-declarations': ['error', { styles: 0 }],
    },
  },
  {
    files: ['projects/docs/**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'docs', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'docs', style: 'kebab-case' },
      ],
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      // Spec'lerde document/window serbest; yasak olan Jasmine'e özgü global'ler
      'no-restricted-globals': [
        'error',
        ...jasmineOnlyGlobals.map((name) => ({ name, message: jasmineOnlyMessage })),
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            ...restrictedAngularImports,
            {
              name: '@angular/core/testing',
              importNames: ['fakeAsync', 'waitForAsync', 'tick', 'flush', 'flushMicrotasks'],
              message: 'zone.js gerektirir; testler zoneless koşar (SKILL §15).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/prefer-control-flow': 'error',
    },
  },
);
