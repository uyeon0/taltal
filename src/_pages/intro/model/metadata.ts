import type { Metadata } from 'next';
import { copy } from '@/shared/copy';

/** 브라우저 탭의 제목. 서비스 이름은 루트 레이아웃의 title.template이 붙인다 */
export const metadata: Metadata = { title: copy.pageTitle.intro };
