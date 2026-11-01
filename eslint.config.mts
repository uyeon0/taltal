import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';
import importPlugin from 'eslint-plugin-import';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import type { Linter } from 'eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import { existsSync, readdirSync } from 'node:fs';

// FSD 레이어. 앞쪽이 상위 레이어다. 규칙은 docs/architecture.md를 따른다.
const FSD_LAYERS = ['_app', '_pages', 'widgets', 'features', 'entities', 'shared'];
const SLICED_LAYERS = ['_pages', 'widgets', 'features', 'entities'];

// 레이어 폴더가 아직 없으면 슬라이스가 없는 것으로 본다
function listSlices(layer: string): string[] {
  const dir = `src/${layer}`;
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function restrictImports(files: string, group: string[]): Linter.Config {
  return {
    files: [files],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group, message: '상위 레이어, 같은 레이어의 다른 슬라이스, 슬라이스 내부 파일은 import하지 않는다.' }
          ]
        }
      ]
    }
  };
}

// 슬라이스 내부 파일을 직접 import하지 못하게 막는다. 서버 전용 공개 API(index.server)는 허용한다
const sliceInternalPatterns = SLICED_LAYERS.flatMap((layer) => [`@/${layer}/*/*`, `!@/${layer}/*/index.server`]);

// 슬라이스마다 상위 레이어와 같은 레이어의 다른 슬라이스를 막는다
const sliceBoundaryConfigs = SLICED_LAYERS.flatMap((layer) => {
  const upperLayers = FSD_LAYERS.slice(0, FSD_LAYERS.indexOf(layer)).map((upperLayer) => `@/${upperLayer}`);
  const slices = listSlices(layer);

  return slices.map((slice) => {
    const otherSlices = slices
      .filter((otherSlice) => otherSlice !== slice)
      .map((otherSlice) => `@/${layer}/${otherSlice}`);
    return restrictImports(`src/${layer}/${slice}/**`, [...upperLayers, ...otherSlices, ...sliceInternalPatterns]);
  });
});
// 상대 경로는 no-restricted-imports가 위치를 알 수 없어서, 실제 파일 위치로 판단하는 규칙으로 막는다
const relativeBoundaryZones = FSD_LAYERS.flatMap((layer, layerIndex) => {
  const upperLayerZones = FSD_LAYERS.slice(0, layerIndex).map((upperLayer) => ({
    target: `./src/${layer}`,
    from: `./src/${upperLayer}`
  }));
  if (!SLICED_LAYERS.includes(layer)) return upperLayerZones;

  const slices = listSlices(layer);
  const sliceZones = slices.flatMap((slice) =>
    slices
      .filter((otherSlice) => otherSlice !== slice)
      .map((otherSlice) => ({ target: `./src/${layer}/${slice}`, from: `./src/${layer}/${otherSlice}` }))
  );
  return [...upperLayerZones, ...sliceZones];
});
const sharedBoundaryConfig = restrictImports(
  'src/shared/**',
  FSD_LAYERS.slice(0, -1).map((layer) => `@/${layer}`)
);
// 슬라이스가 없는 _app과 Next.js 라우트(app/)도 슬라이스의 공개 API로만 가져온다
const appBoundaryConfigs = ['src/_app/**', 'app/**'].map((files) => restrictImports(files, sliceInternalPatterns));

export default defineConfig([
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'docs/**']),
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } }
  },
  tseslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  { settings: { react: { version: 'detect' } } },
  reactHooks.configs.flat.recommended,
  nextPlugin.configs['core-web-vitals'],
  { plugins: { import: importPlugin } },
  {
    rules: {
      // rules-of-hooks는 기본값이 error로 설정되어 있다.
      // 핵심 규칙이므로 error로 올린다.
      'react-hooks/exhaustive-deps': 'error',
      '@next/next/no-async-client-component': 'error',
      '@next/next/no-img-element': 'error',
      '@next/next/no-location-assign-relative-destination': 'error',
      'import/no-anonymous-default-export': 'error'
    }
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    settings: { 'import/resolver': { node: { extensions: ['.ts', '.tsx'] } } },
    rules: { 'import/no-restricted-paths': ['error', { zones: relativeBoundaryZones }] }
  },
  ...sliceBoundaryConfigs,
  sharedBoundaryConfig,
  ...appBoundaryConfigs,
  eslintConfigPrettier
]);
