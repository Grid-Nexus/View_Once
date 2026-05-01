"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, User, Settings, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import NewMessageModal from "@/components/ui/NewMessageModal";
interface Message { 
  id: string;
  sender_id: string;
  senderEmail: string;
  content_encrypted: string;
  status: string;
  sent_at: string;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [userEmail, setUserEmail] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || '')
        await fetchMessages(user.id)
      }
    }
    init()
  }, [])

  async function fetchMessages(userId: string) {
    setLoading(true)

    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        content_encrypted,
        status,
        sent_at,
        users!messages_sender_id_fkey (email)
      `)
      .eq('receiver_id', userId)
      .neq('status', 'deleted')
      .order('sent_at', { ascending: false })

    if (!error && data) {
      const formatted = data.map((m: any) => ({
        id: m.id,
        sender_id: m.sender_id,
        senderEmail: m.users?.email || 'Unknown',
        content_encrypted: m.content_encrypted,
        status: m.status,
        sent_at: m.sent_at,
      }))
      setMessages(formatted)
    }

    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function getStatusColor(status: string) {
    const colors: { [key: string]: string } = {
      pending: "bg-gray-200 text-gray-700",
      delivered: "bg-blue-100 text-blue-700",
      read: "bg-green-100 text-green-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const filteredMessages = activeTab === 'unread'
    ? messages.filter(m => m.status === 'pending')
    : messages

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <h1 className="text-2xl font-bold text-blue-600">View_Once</h1>
        </div>

        <div className="flex-1 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search messages"
              className="w-full pl-10 bg-slate-100 border-none focus:bg-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <User className="w-5 h-5" />
            <span>{userEmail}</span>
          </div>
          <button title="Settings" className="text-slate-600 hover:text-slate-900">
            <Settings className="w-6 h-6" />
          </button>
          <button 
            title="Logout" 
            onClick={handleLogout}
            className="text-red-400 hover:text-red-600"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-8 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-slate-900 mb-2">Messages</h2>
          <p className="text-slate-600">Your secure, self-destructing inbox.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              activeTab === "all"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Messages
          </button>
          <button
            onClick={() => setActiveTab("unread")}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              activeTab === "unread"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Unread
          </button>
        </div>

        {/* Messages */}
        {loading ? (
          <div className="text-center text-slate-400 py-20">Loading messages...</div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center text-slate-400 py-20">
            <p className="text-xl mb-2">No messages yet</p>
            <p className="text-sm">Send a secret message to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                onClick={() => router.push(`/message/${message.id}`)}
                className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                    {message.senderEmail.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 truncate">
                      {message.senderEmail}
                    </h3>
                    <p className="text-sm text-slate-400">Tap to read • vanishes after</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(message.status)}`}>
                    {message.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500">{timeAgo(message.sent_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8">
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 shadow-lg flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          New Message
        </Button>
      </div>

      <NewMessageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSent={async () => {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) fetchMessages(user.id)
        }}
      />
    </div>
  );
}