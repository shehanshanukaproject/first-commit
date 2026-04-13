import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata = {
  title: 'LectureAI — Turn Any Lecture Into Study Notes Instantly',
  description: 'Upload your CS lecture audio and get AI-generated study notes, key concepts, exam tips, and a personal tutor chatbot in under 2 minutes.',
  openGraph: {
    title: 'LectureAI — Turn Any Lecture Into Study Notes Instantly',
    description: 'Upload your CS lecture audio and get AI-generated study notes, key concepts, exam tips, and a personal tutor chatbot in under 2 minutes.',
    url: 'https://lectureai.cc',
    siteName: 'LectureAI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}