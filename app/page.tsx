"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Video, Sparkles, Zap, Globe, Smartphone, CheckCircle } from "lucide-react"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0F] text-zinc-100 overflow-hidden">
      {/* Gradient background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-violet-900/20 via-transparent to-transparent" />
        <div className="absolute bottom-0 right-0 w-full h-[500px] bg-gradient-to-tl from-cyan-900/20 via-transparent to-transparent" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <header className="flex justify-between items-center mb-16 pt-4">
          <div className="flex items-center">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full blur-md bg-gradient-to-r from-violet-600 to-cyan-600 opacity-70"></div>
              <div className="relative bg-black rounded-full p-2">
                <Video className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
            <h1 className="ml-3 text-2xl font-bold bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 text-transparent bg-clip-text">
              Nebula
            </h1>
          </div>
          <nav>
            <ul className="flex gap-8">
              <li>
                <Link href="#features" className="text-zinc-300 hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="text-zinc-300 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/generate">
                  <Button className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white border-0">
                    Get Started
                  </Button>
                </Link>
              </li>
            </ul>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="py-20 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-cyan-600/10 rounded-3xl blur-3xl pointer-events-none"></div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 text-transparent bg-clip-text">
            Create Viral Videos <br />with AI
          </h1>
          
          <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-12">
            Transform your stories into stunning videos with automatic captions,
            professional editing, and AI-powered content creation.
          </p>
          
          <Link href="/generate">
            <Button size="lg" className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white border-0 shadow-lg shadow-violet-900/20 text-lg px-8 py-6 h-auto font-medium">
              Generate Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0F] to-[#0A0A0F] pointer-events-none z-10 h-20 bottom-0 top-auto"></div>
            <img 
              src="/placeholder.svg?height=600&width=1200&text=App+Preview+Screenshot" 
              alt="App Preview" 
              className="w-full max-w-5xl mx-auto rounded-xl border border-zinc-800 shadow-2xl"
            />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-cyan-400 text-transparent bg-clip-text">
              Powerful Features
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Everything you need to create professional-quality videos in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            <div className="bg-[#12121A] border border-[#2A2A35] rounded-xl p-6 shadow-xl">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-500/10 flex items-center justify-center mb-5">
                <Sparkles className="h-6 w-6 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">AI Story Generation</h3>
              <p className="text-zinc-400">
                Generate creative and engaging stories with our AI-powered story generator.
              </p>
            </div>

            <div className="bg-[#12121A] border border-[#2A2A35] rounded-xl p-6 shadow-xl">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 flex items-center justify-center mb-5">
                <Zap className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Automatic Captions</h3>
              <p className="text-zinc-400">
                Convert your text to speech and automatically generate perfect captions.
              </p>
            </div>

            <div className="bg-[#12121A] border border-[#2A2A35] rounded-xl p-6 shadow-xl">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-fuchsia-500/10 flex items-center justify-center mb-5">
                <Smartphone className="h-6 w-6 text-fuchsia-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Mobile Optimized</h3>
              <p className="text-zinc-400">
                Create videos in multiple aspect ratios perfect for any social media platform.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-cyan-400 text-transparent bg-clip-text">
              How It Works
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Create professional videos in just three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-12 relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-600/50 via-cyan-600/50 to-violet-600/50 transform -translate-y-1/2 z-0"></div>
            
            <div className="relative z-10 bg-[#12121A] border border-[#2A2A35] rounded-xl p-6 shadow-xl">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center mb-5 mx-auto">
                <span className="text-white font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white text-center">Generate Story</h3>
              <p className="text-zinc-400 text-center">
                Choose a theme and length, or write your own story.
              </p>
            </div>

            <div className="relative z-10 bg-[#12121A] border border-[#2A2A35] rounded-xl p-6 shadow-xl">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 flex items-center justify-center mb-5 mx-auto">
                <span className="text-white font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white text-center">Customize</h3>
              <p className="text-zinc-400 text-center">
                Select backgrounds, adjust captions, and preview your video.
              </p>
            </div>

            <div className="relative z-10 bg-[#12121A] border border-[#2A2A35] rounded-xl p-6 shadow-xl">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 flex items-center justify-center mb-5 mx-auto">
                <span className="text-white font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white text-center">Export & Share</h3>
              <p className="text-zinc-400 text-center">
                Download your video and share it on your favorite platforms.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 mb-10">
          <div className="bg-gradient-to-r from-violet-900/20 via-fuchsia-900/20 to-cyan-900/20 rounded-3xl p-10 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-600/30 to-transparent rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-cyan-600/30 to-transparent rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-center text-white">
                Ready to Create Amazing Videos?
              </h2>
              <p className="text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto text-center mb-10">
                No design skills needed. Get started now and create your first video in minutes.
              </p>
              <div className="flex justify-center">
                <Link href="/generate">
                  <Button size="lg" className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 text-white border-0 shadow-lg shadow-violet-900/20 text-lg px-8 py-6 h-auto font-medium">
                    Generate Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#2A2A35] py-8 text-center text-zinc-500">
          <p>© 2025 Nebula. All rights reserved.</p>
        </footer>
      </div>
    </main>
  )
}
