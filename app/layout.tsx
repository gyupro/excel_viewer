import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '롯데 중고차도매 차량 출품 리스트',
  description: '롯데 중고차도매 차량 출품 리스트 뷰어',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
