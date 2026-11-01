import 'server-only';

// 앱 데이터 JSON을 읽는다. 서버에서만 쓴다.
// data/app/(또는 APP_DATA_DIR)에 파일이 없으면 null을 돌려준다. 이때 각 entity가 가짜 데이터를 쓴다.

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const dataDir = process.env.APP_DATA_DIR ?? path.join(process.cwd(), 'data', 'app');

// 데이터 폴더는 next.config.ts의 outputFileTracingIncludes로 배포에 넣는다. 그래서 아래 경로는 추적하지 않는다
export async function readAppJson<T>(file: string): Promise<T | null> {
  const filePath = path.join(/*turbopackIgnore: true*/ dataDir, file);
  if (!existsSync(/*turbopackIgnore: true*/ filePath)) return null;
  return JSON.parse(await readFile(/*turbopackIgnore: true*/ filePath, 'utf-8')) as T;
}
