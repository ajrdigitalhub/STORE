
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 0,
    "route": "/"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-G6EICLGQ.js",
      "chunk-5VYPVQOD.js"
    ],
    "route": "/products"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-SGHNREZZ.js"
    ],
    "route": "/products/*"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-TUY43RON.js"
    ],
    "route": "/cart"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-JKTLEW3K.js",
      "chunk-5VYPVQOD.js",
      "chunk-MVAGINI2.js"
    ],
    "route": "/checkout"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-DIRSM75Q.js",
      "chunk-5VYPVQOD.js"
    ],
    "route": "/login"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-SUGYAVT2.js",
      "chunk-MVAGINI2.js"
    ],
    "route": "/profile"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-T4EXU736.js",
      "chunk-5VYPVQOD.js",
      "chunk-MVAGINI2.js"
    ],
    "route": "/admin"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-Q3JEZRK6.js"
    ],
    "route": "/about"
  },
  {
    "renderMode": 0,
    "preload": [
      "chunk-KGMPJ46X.js",
      "chunk-5VYPVQOD.js"
    ],
    "route": "/contact"
  },
  {
    "renderMode": 0,
    "redirectTo": "/",
    "route": "/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 34502, hash: '3df7663e6cf9cbc7db777c8583265982421ddbf86a502a621ea74a15f28c55a3', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1433, hash: '7bca3be5b4429e47e2923ce93b180e910b1a875ad8132e50a22d04b3593dc4b0', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-MD5WV2OU.css': {size: 76270, hash: 'Y+tZtrvnpjY', text: () => import('./assets-chunks/styles-MD5WV2OU_css.mjs').then(m => m.default)}
  },
};
