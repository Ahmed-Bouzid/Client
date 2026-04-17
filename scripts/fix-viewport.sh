#!/bin/bash
# 📱 Post-build script to fix viewport for app-like experience
# Run after: npx expo export -p web

DIST_HTML="dist/index.html"

if [ ! -f "$DIST_HTML" ]; then
  echo "❌ dist/index.html not found. Run 'npx expo export -p web' first."
  exit 1
fi

# Create the fixed index.html
cat > "$DIST_HTML" << 'EOF'
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <title>SunnyGo</title>
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="format-detection" content="telephone=no" />
    <meta name="theme-color" content="#FF8C42" />
    <meta name="description" content="Commandez directement depuis votre table" />
    <link rel="icon" href="/favicon.ico" />
    <style id="expo-reset">
      html, body { height: 100%; width: 100%; margin: 0; padding: 0; overflow: hidden; overscroll-behavior: none; background-color: #000; }
      #root { display: flex; height: 100%; flex: 1; padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right); box-sizing: border-box; }
      * { touch-action: pan-x pan-y; -webkit-touch-callout: none; }
      body { -webkit-user-select: none; user-select: none; }
      input, textarea { -webkit-user-select: text; user-select: text; touch-action: auto; }
      button, a, [role="button"] { touch-action: manipulation; }
      html { overscroll-behavior: none; position: fixed; width: 100%; height: 100%; }
    </style>
    <script>
      // 🔒 Prevent pinch zoom on iOS Safari (ignores user-scalable=no)
      document.addEventListener('gesturestart', function(e) { e.preventDefault(); });
      document.addEventListener('gesturechange', function(e) { e.preventDefault(); });
      document.addEventListener('gestureend', function(e) { e.preventDefault(); });
      
      // Prevent double-tap zoom
      var lastTouchEnd = 0;
      document.addEventListener('touchend', function(e) {
        var now = Date.now();
        if (now - lastTouchEnd <= 300) { e.preventDefault(); }
        lastTouchEnd = now;
      }, false);
      
      // Prevent pinch zoom via touch
      document.addEventListener('touchmove', function(e) {
        if (e.touches.length > 1) { e.preventDefault(); }
      }, { passive: false });
    </script>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
EOF

# Find and append the script tag
SCRIPT_FILE=$(ls dist/_expo/static/js/web/index-*.js 2>/dev/null | head -1)
if [ -n "$SCRIPT_FILE" ]; then
  SCRIPT_NAME=$(basename "$SCRIPT_FILE")
  echo "  <script src=\"/_expo/static/js/web/$SCRIPT_NAME\" defer></script>" >> "$DIST_HTML"
fi

echo "</body></html>" >> "$DIST_HTML"

echo "✅ dist/index.html patched with anti-zoom viewport + JS!"
