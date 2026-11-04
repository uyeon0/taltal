import 'server-only';

// 앱 데이터 JSON을 읽는다. 서버에서만 쓴다.
// data/app/(또는 APP_DATA_DIR)에 파일이 없으면 MissingAppDataError를 던진다. 가짜 데이터로 대신하지 않는다.

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const dataDir = process.env.APP_DATA_DIR || path.join(process.cwd(), 'data', 'app');

export class MissingAppDataError extends Error {
  constructor(file: string) {
    super(
      `앱 데이터 ${file}이 없다. 비공개 데이터 저장소의 app/*.json을 data/app/에 두거나 APP_DATA_DIR로 폴더를 지정한다.`
    );
    this.name = 'MissingAppDataError';
  }
}

// 데이터 폴더는 next.config.ts의 outputFileTracingIncludes로 배포에 넣는다. 그래서 아래 경로는 추적하지 않는다
/** 앱 데이터 파일의 경로. 테스트도 이 함수로 같은 폴더를 찾는다 */
export const appDataPath = (file: string) => path.join(/*turbopackIgnore: true*/ dataDir, file);

/** 파일이 없으면 MissingAppDataError를 던진다. readAppJson을 부르기 전에 이 함수로 확인한다 */
export function assertAppData(file: string): void {
  if (!existsSync(/*turbopackIgnore: true*/ appDataPath(file))) throw new MissingAppDataError(file);
}

/** 파일이 있는지는 부르는 쪽이 assertAppData로 먼저 확인한다 */
export async function readAppJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(/*turbopackIgnore: true*/ appDataPath(file), 'utf-8')) as T;
}
