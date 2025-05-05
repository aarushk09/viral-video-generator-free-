export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0F] text-zinc-100">
      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-cyan-400 text-transparent bg-clip-text">
        404 - Page Not Found
      </h1>
      <p className="text-zinc-400 mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <a 
        href="/"
        className="px-6 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-lg font-medium"
      >
        Go to Home
      </a>
    </div>
  )
}