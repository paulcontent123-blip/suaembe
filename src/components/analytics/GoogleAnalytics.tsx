import Script from "next/script";

// Chỉ render khi có NEXT_PUBLIC_GA_MEASUREMENT_ID (guard giống các tích hợp
// bên thứ ba khác trong dự án — thiếu biến thì im lặng bỏ qua, không throw,
// vì đây là tracking không bắt buộc để app chạy được).
export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!measurementId) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}
