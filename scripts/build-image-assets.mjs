// 기록 저장소의 재료 그림, 다람쥐, 파비콘 원본을 줄여 public/에 넣고 재료 그림 경로 파일을 만든다.
// 사용법: node scripts/build-image-assets.mjs <기록 저장소의 1차프로젝트 폴더>
// 그림 선택이 바뀌면 다시 실행한다. 기준은 docs/specs/app-foundation.md의 "이미지 자산"이다.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as prettier from 'prettier';
import sharp from 'sharp';

const INGREDIENT_SIZE = 256;
const MASCOT_SIZE = 640;
const FAVICON_SIZE = 64;
const APPLE_ICON_SIZE = 180;

// docs/design.md의 다람쥐 식별자 표
const MASCOT_FILES = {
  default: 'squirrel-v2.png',
  discovery: 'squirrel-discovery-v1.png',
  thinking: 'squirrel-thinking-v3.png',
  meal: 'squirrel-meal-v1.png',
  retry: 'squirrel-retry-straight-v4.png',
  question: 'question-mark-v1.png'
};

const recordDir = process.argv[2];
if (!recordDir) {
  console.error('기록 저장소의 1차프로젝트 폴더를 인자로 넣어 주세요.');
  process.exit(1);
}

const repoDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const designDir = join(recordDir, 'design');
const manifest = JSON.parse(readFileSync(join(designDir, 'ingredient-illustrations/delivery-manifest.json'), 'utf8'));

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

// 데이터가 바뀌어도 없는 ID는 대체 그림을 쓰므로 멈추지 않는다
const dataPath = join(repoDir, 'data/app/ingredients.json');
if (existsSync(dataPath) && sha256(dataPath) !== manifest.source_sha256) {
  console.warn('경고: data/app/ingredients.json이 그림 매핑을 만든 데이터와 다릅니다. 없는 재료는 대체 그림을 씁니다.');
}

async function resize(source, target, size) {
  mkdirSync(dirname(target), { recursive: true });
  await sharp(source).resize(size, size, { fit: 'contain' }).png({ compressionLevel: 9 }).toFile(target);
}

// 원본을 모두 확인한 뒤에 출력 폴더를 지운다. 중간에 멈추면 커밋된 그림이 지워진 채 남기 때문이다
const ingredientAssets = Object.values(manifest.assets);
const mascotSources = Object.values(MASCOT_FILES).map((file) => join(designDir, 'mascot', file));
for (const source of mascotSources) {
  if (!existsSync(source)) throw new Error(`다람쥐 원본이 없습니다: ${source}`);
}
for (const asset of ingredientAssets) {
  if (sha256(join(recordDir, asset.source)) !== asset.sha256)
    throw new Error(`해시가 manifest와 다릅니다: ${asset.source}`);
}

const ingredientDir = join(repoDir, 'public/images/ingredients');
rmSync(ingredientDir, { recursive: true, force: true });
for (const asset of ingredientAssets) {
  await resize(join(recordDir, asset.source), join(ingredientDir, asset.file), INGREDIENT_SIZE);
}

for (const [pose, file] of Object.entries(MASCOT_FILES)) {
  await resize(join(designDir, 'mascot', file), join(repoDir, `public/images/mascot/${pose}.png`), MASCOT_SIZE);
}

// 로고 파일이 오기 전까지 기본 다람쥐를 파비콘으로 쓴다
const faviconSource = join(designDir, 'mascot', MASCOT_FILES.default);
await resize(faviconSource, join(repoDir, 'public/brand/favicon.png'), FAVICON_SIZE);
await resize(faviconSource, join(repoDir, 'public/brand/apple-icon.png'), APPLE_ICON_SIZE);

const toPath = (hash) => `/images/ingredients/${manifest.assets[hash].file}`;
const entries = Object.entries(manifest.ingredients)
  .sort(([a], [b]) => a.localeCompare(b, 'ko'))
  .map(([id, hash]) => `  ${JSON.stringify(id)}: ${JSON.stringify(toPath(hash))}`);

const pathsFile = join(repoDir, 'src/entities/ingredient/model/ingredient-images.ts');
const pathsSource = `// scripts/build-image-assets.mjs가 만든 파일이다. 직접 고치지 않는다.

/** 재료 ID → 재료 그림 경로. 비슷한 재료는 그림 하나를 함께 쓴다 */
export const INGREDIENT_IMAGES: Readonly<Record<string, string>> = {
${entries.join(',\n')}
};

/** 그림이 없거나 불러오지 못한 재료의 공통 대체 그림(접힌 종이봉투) */
export const INGREDIENT_FALLBACK_IMAGE = ${JSON.stringify(toPath(manifest.fallback))};
`;
// 커밋할 때 lint-staged가 다시 포맷하지 않도록 저장소의 Prettier 설정으로 맞춘다
const prettierOptions = await prettier.resolveConfig(pathsFile);
writeFileSync(pathsFile, await prettier.format(pathsSource, { ...prettierOptions, filepath: pathsFile }));

console.log(
  `재료 그림 ${Object.keys(manifest.assets).length}개, 재료 ${entries.length}개, 다람쥐 ${Object.keys(MASCOT_FILES).length}개를 만들었습니다.`
);
