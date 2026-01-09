import { Link } from 'react-router-dom'
import { useEffect } from 'react'

export default function RiemannSlideshow() {
  useEffect(() => {
    // Redirect to the static HTML file
    window.location.href = '/slidedecks/riemann-sphere-slideshow.html'
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-gray-400 mb-4">Loading slideshow...</div>
        <Link to="/" className="text-purple-400 hover:text-purple-300 text-sm">
          ← Back to Gallery
        </Link>
      </div>
    </div>
  )
}
