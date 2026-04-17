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
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="format-detection" content="telephone=no" />
    <meta name="theme-color" content="#FF8C42" />
    <meta name="description" content="Commandez directement depuis votre table" />
    <link rel="icon" href="/favicon.ico" />
    <style id="expo-reset">
      /* 📱 Edge-to-edge fullscreen */
      html, body { 
        height: 100%; 
        width: 100%; 
        margin: 0; 
        padding: 0; 
        overflow: hidden; 
        overscroll-behavior: none;
        background: #000;
      }
      body { 
        -webkit-user-select: none; 
        user-select: none;
        min-height: 100vh;
        min-height: 100dvh;
        min-height: -webkit-fill-available;
        overscroll-behavior: none;
      }
      /* #root remplit TOUT l'écran */
      #root { 
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        height: 100dvh;
        display: flex;
        flex-direction: column;
      }
      * { -webkit-touch-callout: none; }
      /* 🔒 Inputs MUST be fully interactive (Chrome + Safari) */
      input, textarea, select { 
        -webkit-user-select: text !important; 
        user-select: text !important; 
        touch-action: auto !important;
        -webkit-appearance: none;
        appearance: none;
        pointer-events: auto !important;
      }
      /* 🔒 Override Safari autofill yellow background */
      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus,
      input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px #1E1E1E inset !important;
        -webkit-text-fill-color: #FFFFFF !important;
        transition: background-color 5000s ease-in-out 0s;
      }
      button, a, [role="button"] { touch-action: manipulation; }
    </style>
    <script>
      // 🔒 Prevent pinch zoom on iOS Safari (ignores user-scalable=no)
      document.addEventListener('gesturestart', function(e) { e.preventDefault(); });
      document.addEventListener('gesturechange', function(e) { e.preventDefault(); });
      document.addEventListener('gestureend', function(e) { e.preventDefault(); });
      
      // Prevent double-tap zoom (but NOT on inputs/textareas)
      var lastTouchEnd = 0;
      document.addEventListener('touchend', function(e) {
        var tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
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
