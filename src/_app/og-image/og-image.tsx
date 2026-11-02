import 'server-only';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

import { MASCOT_IMAGES } from '@/shared/assets';
import { SITE } from '@/shared/config/site';

import { loadGumiFont, loadSuitFonts } from '../fonts/image-fonts.server';
import { loadImageColors } from '../styles/image-colors.server';

// 링크를 공유할 때 미리보기로 쓰는 이미지. 빌드할 때 한 번 그린다. 구성은 docs/design.md의 "공유 이미지"에 있다.

export const alt = `${SITE.name}: ${SITE.description}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const PADDING = 72;
const MASCOT_SIZE = 460;
const WORDMARK_HEIGHT = 140;

/**
 * 서비스 이름을 낭만있구미체만으로 그린다. 낭만있구미체와 SUIT를 한 ImageResponse에 넣으면 SUIT 굵기가 틀어져서 따로 그린다
 * (docs/specs/recipe-image.md). 화면에 쓰는 크기의 2배로 그리고 절반 크기로 보여 준다
 */
async function drawWordmark(ink: string) {
  const res = new ImageResponse(
    <div
      style={{ display: 'flex', fontFamily: 'GumiRomance', fontSize: WORDMARK_HEIGHT * 2, lineHeight: 1, color: ink }}
    >
      {SITE.name}
    </div>,
    // width, height를 undefined로 넘기면 글자 크기에 맞춰 그린다. 빼면 1200×630이 된다
    { width: undefined, height: undefined, fonts: await loadGumiFont() }
  );
  const png = Buffer.from(await res.arrayBuffer());
  // PNG IHDR의 가로, 세로
  return {
    src: `data:image/png;base64,${png.toString('base64')}`,
    width: png.readUInt32BE(16) / 2,
    height: png.readUInt32BE(20) / 2
  };
}

async function readMascot() {
  const png = await readFile(join(process.cwd(), 'public', MASCOT_IMAGES.default));
  return `data:image/png;base64,${png.toString('base64')}`;
}

/**
 * 글꼴 파일, 색, 서비스 이름 PNG, 다람쥐를 읽어 둔다. 요청마다 파일을 읽지 않고 빌드할 때 한 번 읽도록 캐시한다.
 * cacheComponents가 켜져 있어 캐시하지 않은 파일 읽기가 있으면 이 경로가 요청마다 그려지는 동적 경로가 된다.
 * 캐시는 Buffer를 ArrayBuffer로만 돌려주므로 글꼴 데이터를 ArrayBuffer로 넘긴다
 */
async function loadAssets() {
  'use cache';

  const colors = await loadImageColors();
  const [suit, wordmark, mascot] = await Promise.all([loadSuitFonts(), drawWordmark(colors.ink), readMascot()]);
  const fonts = suit.map(({ data, ...font }) => ({
    ...font,
    data: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
  }));
  return { colors, fonts, wordmark, mascot };
}

export default async function OgImage() {
  const { colors, fonts, wordmark, mascot } = await loadAssets();

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: PADDING,
        backgroundColor: colors.brand,
        color: colors.ink,
        fontFamily: 'SUIT'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40, width: 600 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse는 next/image를 쓰지 못한다 */}
        <img src={wordmark.src} width={wordmark.width} height={wordmark.height} alt="" />
        {/* 한글이 단어 중간에서 줄바꿈되지 않게 한다 */}
        <div style={{ display: 'flex', fontSize: 52, fontWeight: 600, lineHeight: 1.4, wordBreak: 'keep-all' }}>
          {SITE.description}
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse는 next/image를 쓰지 못한다 */}
      <img src={mascot} width={MASCOT_SIZE} height={MASCOT_SIZE} alt="" />
    </div>,
    { ...size, fonts }
  );
}
