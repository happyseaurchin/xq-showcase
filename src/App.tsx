import { Routes, Route, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase, Artifact } from './lib/supabase'

function Gallery() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchArtifacts() {
      const { data, error } = await supabase
        .from('artifacts')
        .select('*')
        .order('display_order', { ascending: true })
      
      if (error) {
        console.error('Error fetching artifacts:', error)
      } else {
        setArtifacts(data || [])
      }
      setLoading(false)
    }
    fetchArtifacts()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <header className="max-w-6xl mx-auto mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          XQ Showcase
        </h1>
        <p className="text-gray-400 text-lg">
          Interactive mathematical visualizations exploring psycho-social dynamics
        </p>
      </header>

      {artifacts.length === 0 ? (
        <div className="max-w-6xl mx-auto text-center py-20">
          <div className="text-6xl mb-4">🔮</div>
          <h2 className="text-2xl font-semibold mb-2">No artifacts yet</h2>
          <p className="text-gray-400">
            Create an artifact in Claude and push it here to get started.
          </p>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artifacts.map((artifact) => (
            <Link
              key={artifact.id}
              to={`/artifacts/${artifact.slug}`}
              className="block bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors border border-gray-700 hover:border-purple-500"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-semibold text-white">{artifact.title}</h3>
                {artifact.featured && (
                  <span className="text-yellow-400">★</span>
                )}
              </div>
              {artifact.description && (
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {artifact.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-purple-900/50 text-purple-300 text-xs rounded">
                  {artifact.category}
                </span>
                {artifact.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function ArtifactView() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="text-purple-400 hover:text-purple-300 mb-8 inline-block">
          ← Back to Gallery
        </Link>
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
          <p className="text-gray-400">
            Artifact viewer coming soon. JSX artifacts will render here.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Gallery />} />
      <Route path="/artifacts/:slug" element={<ArtifactView />} />
    </Routes>
  )
}
