# QR Studio

Browser-based QR code platform. No backend required.

## Run locally
Serve the folder with any static server:
`python3 -m http.server 8080` then open http://localhost:8080

## Features
- 11 QR types
- Customization (colors, shapes, logos placeholder)
- Exports PNG/JPG/SVG/PDF via library
- Camera + image scanning
- Templates, Library (IndexedDB), Bulk CSV, Tools, Settings
- PWA manifest + service worker

## Dependencies (CDN)
qr-code-styling, html5-qrcode, papaparse, jszip, jspdf
