export const metadata = {
  title: 'DailyCare · Today’s care',
  description: 'Record Margaret’s daily care and prepare an update for her family.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="stylesheet" href="/styles.css" />
        <link rel="stylesheet" href="/shifts.css" />
      </head>
      <body className="app-page">{children}</body>
    </html>
  );
}
