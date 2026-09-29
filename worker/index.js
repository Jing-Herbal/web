// Serves the site's static files, adding HTTP range support for media under /img/.
// iPhone browsers (Safari and Chrome, both WebKit) only play <video> from a server that answers
// Range requests with 206 Partial Content; the static asset server was replying 200 with the
// whole file, so no video played on iPhone. Everything else passes straight through.
export default {
  async fetch(request, env) {
    const res = await env.ASSETS.fetch(request);
    try {
      const range = request.headers.get('Range');
      if (res.status !== 200) return res;
      if (!range) {
        const h = new Headers(res.headers);
        h.set('Accept-Ranges', 'bytes');
        return new Response(res.body, { status: 200, headers: h });
      }
      const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
      if (!m || (m[1] === '' && m[2] === '')) return res;
      const buf = await res.arrayBuffer();
      const size = buf.byteLength;
      let start, end;
      if (m[1] === '') { start = Math.max(0, size - Number(m[2])); end = size - 1; }
      else { start = Number(m[1]); end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1); }
      const h = new Headers(res.headers);
      h.set('Accept-Ranges', 'bytes');
      if (start >= size || start > end) {
        h.set('Content-Range', `bytes */${size}`);
        h.delete('Content-Length');
        return new Response(null, { status: 416, headers: h });
      }
      h.set('Content-Range', `bytes ${start}-${end}/${size}`);
      h.set('Content-Length', String(end - start + 1));
      return new Response(buf.slice(start, end + 1), { status: 206, headers: h });
    } catch {
      return env.ASSETS.fetch(request);
    }
  },
};
