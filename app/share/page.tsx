import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TiktokIcon, InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/social-icons"

export default function SharePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text">
            Share Your Video
          </h1>
          <p className="text-center text-gray-400">Connect your accounts and share your video with one click</p>
        </header>

        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
              <img
                src="/placeholder.svg?height=360&width=640&text=Your+Video"
                alt="Your generated video"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-600 text-transparent bg-clip-text">
                Final Video
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  Download
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 border-0"
                >
                  Edit Video
                </Button>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-pink-500 to-purple-600 text-transparent bg-clip-text">
            Connect Your Accounts
          </h2>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <SocialCard icon={<TiktokIcon />} title="TikTok" connected={false} />
            <SocialCard icon={<InstagramIcon />} title="Instagram Reels" connected={false} />
            <SocialCard icon={<YoutubeIcon />} title="YouTube Shorts" connected={false} />
            <SocialCard icon={<FacebookIcon />} title="Facebook" connected={false} />
          </div>

          <div className="text-center">
            <Link href="/">
              <Button variant="outline" className="mr-2 border-gray-600 text-gray-300 hover:bg-gray-700">
                Back to Editor
              </Button>
            </Link>
            <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0">
              Share to Selected Platforms
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}

interface SocialCardProps {
  icon: React.ReactNode
  title: string
  connected: boolean
}

function SocialCard({ icon, title, connected }: SocialCardProps) {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">{connected ? "Connected" : "Not connected"}</span>
          <Button
            variant={connected ? "outline" : "default"}
            size="sm"
            className={
              connected
                ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                : "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 border-0"
            }
          >
            {connected ? "Disconnect" : "Connect"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
