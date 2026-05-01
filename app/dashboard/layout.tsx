"use client"

import { SidebarProvider, Sidebar } from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}