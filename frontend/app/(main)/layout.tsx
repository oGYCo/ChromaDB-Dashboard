import { ReactNode } from 'react'

export default function MainLayout({
  children,
  sidebar,
}: {
  children: ReactNode
  sidebar: ReactNode
}) {
  return (
    <div className="flex h-screen bg-background">
      <div className="w-80 border-r bg-card">{sidebar}</div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
