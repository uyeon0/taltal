const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

/** 마지막 글자에 받침이 있으면 "은", 없으면 "는"을 돌려준다. 한글 음절이 아닌 글자로 끝나면 "는"이다 */
export function topicParticle(word: string): '은' | '는' {
  if (word === '') return '는';
  const code = word.charCodeAt(word.length - 1);
  if (code < HANGUL_START || code > HANGUL_END) return '는';
  return (code - HANGUL_START) % 28 === 0 ? '는' : '은';
}
