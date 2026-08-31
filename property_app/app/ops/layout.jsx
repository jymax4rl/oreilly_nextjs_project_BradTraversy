export const metadata = {
  title: {
    default: "Operations",
    template: "%s · Kama Ops",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function OpsRootLayout({ children }) {
  return children;
}
