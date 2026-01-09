import { Link } from 'react-router-dom'
import MandelbrotRiemann from '../../public/library/mandelbrot-riemann (1).jsx'

export default function Mandelbrot() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="absolute top-4 left-4 z-50">
        <Link 
          to="/" 
          className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← Back to Gallery
        </Link>
      </div>
      <MandelbrotRiemann />
    </div>
  )
}
