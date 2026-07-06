import "./globals.css";
import Shell from "./components/Shell";

export const metadata = {
  title: "Energy Dashboard",
  description: "Electricity Bill Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </head>
      <body
        style={{
          margin: 0,
          background: "#0F172A",
          color: "#fff",
          fontFamily: "Inter,Segoe UI,Arial,sans-serif",
        }}
      >
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
