export default function manifest() {
  return {
    name: 'ScanEat — QR Menu',
    short_name: 'ScanEat',
    description: 'Scan, browse the menu, and order — digital menus for restaurants.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#00c951',
    icons: [
      {
        src: '/icon-only-logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
