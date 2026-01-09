import { Link } from 'react-router-dom'
import RiemannSphere from '../../public/library/riemann-sphere-purpose-tree.jsx'

export default function RiemannPurpose() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="fixed top-4 left-4 z-50">
        <Link 
          to="/slidedecks/riemann" 
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-sm transition-colors border border-gray-700"
        >
          ← Back to Slides
        </Link>
      </div>
      <RiemannSphere />
    </div>
  )
}
