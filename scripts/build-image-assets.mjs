// 이미지 입력 폴더의 다람쥐, 재료 그림, 브랜드 이미지를 앱에 넣고 재료 그림 경로 파일을 만든다.
// 사용법: node scripts/build-image-assets.mjs <입력 폴더>
// 입력 폴더의 형식은 docs/specs/brand-images.md의 "입력 폴더 형식"이다. 그림이 바뀌면 다시 실행한다.
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as prettier from 'prettier';
import sharp from 'sharp';

const INGREDIENT_SIZE = 256;
const MASCOT_SIZE = 640;

// 앱이 쓰는 다람쥐 식별자. docs/design.md의 "다람쥐" 표와 같다
const MASCOT_POSES = ['default', 'discovery', 'thinking', 'meal', 'retry'];

// 브랜드 이미지: 입력 폴더의 이름 → 앱 저장소 안의 자리. 크기를 정한 파일은 크기를 확인한다
const BRAND_FILES = [
  { name: 'favicon.ico', target: 'public/brand/favicon.ico' },
  { name: 'favicon-32x32.png', target: 'public/brand/favicon-32x32.png', size: [32, 32] },
  { name: 'apple-touch-icon.png', target: 'public/brand/apple-touch-icon.png', size: [180, 180] },
  { name: 'opengraph-image.png', target: 'app/opengraph-image.png', size: [1200, 630] }
];

const inputArg = process.argv[2];
if (!inputArg) {
  console.error('이미지 입력 폴더를 인자로 넣어 주세요.');
  process.exit(1);
}

const repoDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const inputDir = resolve(inputArg);
const mapping = JSON.parse(readFileSync(join(inputDir, 'ingredients.json'), 'utf8'));
const ingredientFiles = [...new Set([...Object.values(mapping.ingredients), mapping.fallback])].sort();

// 원본을 모두 확인한 뒤에 출력 폴더를 지운다. 중간에 멈추면 커밋된 그림이 지워진 채 남기 때문이다
const required = [
  ...MASCOT_POSES.map((pose) => join(inputDir, 'mascot', `${pose}.png`)),
  ...BRAND_FILES.map(({ name }) => join(inputDir, 'brand', name)),
  ...ingredientFiles.map((file) => join(inputDir, 'ingredients', file))
];
const missing = required.filter((path) => !existsSync(path));
if (missing.length > 0) throw new Error(`입력 폴더에 없는 파일이 있습니다:\n${missing.join('\n')}`);
for (const { name, size } of BRAND_FILES) {
  if (!size) continue;
  const { width, height } = await sharp(join(inputDir, 'brand', name)).metadata();
  if (width !== size[0] || height !== size[1])
    throw new Error(`${name}은 ${size[0]}×${size[1]}이어야 합니다. 지금은 ${width}×${height}입니다.`);
}

async function resize(source, target, size) {
  mkdirSync(dirname(target), { recursive: true });
  await sharp(source).resize(size, size, { fit: 'contain' }).png({ compressionLevel: 9 }).toFile(target);
}

const ingredientDir = join(repoDir, 'public/images/ingredients');
rmSync(ingredientDir, { recursive: true, force: true });
for (const file of ingredientFiles) {
  await resize(join(inputDir, 'ingredients', file), join(ingredientDir, file), INGREDIENT_SIZE);
}

const mascotDir = join(repoDir, 'public/images/mascot');
rmSync(mascotDir, { recursive: true, force: true });
for (const pose of MASCOT_POSES) {
  await resize(join(inputDir, 'mascot', `${pose}.png`), join(mascotDir, `${pose}.png`), MASCOT_SIZE);
}

for (const { name, target } of BRAND_FILES) {
  mkdirSync(dirname(join(repoDir, target)), { recursive: true });
  copyFileSync(join(inputDir, 'brand', name), join(repoDir, target));
}

const toPath = (file) => `/images/ingredients/${file}`;
const entries = Object.entries(mapping.ingredients)
  .sort(([a], [b]) => a.localeCompare(b, 'ko'))
  .map(([id, file]) => `  ${JSON.stringify(id)}: ${JSON.stringify(toPath(file))}`);

const pathsFile = join(repoDir, 'src/entities/ingredient/model/ingredient-images.ts');
const pathsSource = `// scripts/build-image-assets.mjs가 만든 파일이다. 직접 고치지 않는다.

/** 재료 ID → 재료 그림 경로. 비슷한 재료는 그림 하나를 함께 쓴다 */
export const INGREDIENT_IMAGES: Readonly<Record<string, string>> = {
${entries.join(',\n')}
};

/** 그림이 없거나 불러오지 못한 재료의 공통 대체 그림(접힌 종이봉투) */
export const INGREDIENT_FALLBACK_IMAGE = ${JSON.stringify(toPath(mapping.fallback))};
`;
// 커밋할 때 lint-staged가 다시 포맷하지 않도록 저장소의 Prettier 설정으로 맞춘다
const prettierOptions = await prettier.resolveConfig(pathsFile);
writeFileSync(pathsFile, await prettier.format(pathsSource, { ...prettierOptions, filepath: pathsFile }));

console.log(
  `재료 그림 ${ingredientFiles.length}개, 재료 ${entries.length}개, 다람쥐 ${MASCOT_POSES.length}개, 브랜드 이미지 ${BRAND_FILES.length}개를 넣었습니다.`
);
