'use client'

import { useEffect, useRef, useState, useMemo } from 'react'

interface HtmlIframeProps {
  content: string
}

/** Inject a resize reporter script into the HTML content. */
function withResizeScript(html: string): string {
  const resizeScript = `
<script>
(function() {
  function postHeight() {
    var h = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.scrollHeight
    );
    parent.postMessage({ type: 'stonkie-resize', height: h }, '*');
  }
  // Report after load and on resize
  window.addEventListener('load', function() { setTimeout(postHeight, 100); });
  window.addEventListener('resize', postHeight);
  // Also report on mutation (for Chart.js async rendering)
  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(postHeight).observe(document.body, { childList: true, subtree: true });
  }
  // Initial report
  setTimeout(postHeight, 50);
})();
</script>`

  // Insert before </body> if present, otherwise append
  if (html.includes('</body>')) {
    return html.replace('</body>', resizeScript + '</body>')
  }
  return html + resizeScript
}

export default function HtmlIframe({ content }: HtmlIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(200)

  const srcDoc = useMemo(() => withResizeScript(content), [content])

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (
        event.data?.type === 'stonkie-resize' &&
        typeof event.data.height === 'number' &&
        iframeRef.current &&
        event.source === iframeRef.current.contentWindow
      ) {
        // Clamp between 100 and 600
        setHeight(Math.min(600, Math.max(100, event.data.height)))
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      className="w-full my-4 border-0 rounded-lg"
      style={{ height: `${height}px` }}
      title="Visual content"
    />
  )
}
