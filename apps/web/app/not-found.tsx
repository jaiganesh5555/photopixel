export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h2 className="text-4xl font-bold mb-4">404 - Page Not Found</h2>
      <p className="text-lg mb-8">The page you're looking for doesn't exist.</p>
      <a
        href="/"
        className="px-4 py-2 bg-black text-white rounded hover:bg-black/90"
      >
        Return Home
      </a>
    </div>
  );
} 