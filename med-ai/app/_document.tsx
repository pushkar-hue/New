import { Html, Head, Main, NextScript } from "next/document"

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preload critical assets */}
        <link
          rel="preload"
          href={process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}
          as="fetch"
          crossOrigin="anonymous"
        />
        {/* Add meta tags for better SEO and performance */}
        <meta name="application-name" content="MediScan AI" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MediScan AI" />
        <meta name="description" content="AI-powered medical diagnosis platform" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0ea5e9" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
