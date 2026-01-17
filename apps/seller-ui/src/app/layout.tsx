import './global.css';
import Providers from './provider';

export const metadata = {
    title: "Subkuch.store seller",
    description: "Sukuch.store E-commerce Application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        </body>
    </html>
  )
}
