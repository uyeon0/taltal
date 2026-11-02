'use client';

import { useEffect, useState } from 'react';

/**
 * 마운트한 다음 작업에서 true가 된다. 화면 읽기 프로그램은 처음부터 글자를 담고 나타난 live region을 읽지 않을 수 있어서,
 * live region을 비운 채 그리고 이 값이 true가 된 뒤에 글자를 넣는다. 같은 작업 안에서 채우면 나타남과 합쳐져 읽히지 않을 수 있다.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);
  return mounted;
}
