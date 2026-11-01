/**
 * 요청 본문을 maxBytes까지만 읽어 JSON으로 바꾼다. 넘거나, 끝까지 읽지 못하거나, JSON이 아니면 null이다.
 * request.json()은 본문 전체를 읽은 뒤에야 크기를 알 수 있어서, 큰 요청이 메모리에 다 올라간다.
 */
export async function readJsonBody(request: Request, maxBytes: number): Promise<unknown> {
  const declared = Number(request.headers.get('content-length'));
  if (declared > maxBytes) return null;
  if (!request.body) return null;

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    // 업로드 중 연결이 끊기는 등 본문을 끝까지 읽지 못하면 잘못된 요청으로 본다
    return null;
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}
