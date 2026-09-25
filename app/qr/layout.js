// Table-QR entry points are per-table utility URLs, not search landing pages.
export const metadata = {
  robots: { index: false, follow: false },
};

export default function QrLayout({ children }) {
  return children;
}
