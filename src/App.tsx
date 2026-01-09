import { Routes, Route, Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase, Artifact } from './lib/supabase'

function Gallery() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)

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

  const categories = [...new Set(artifacts.map(a => a.category))]
  const filteredArtifacts = filter 
    ? artifacts.filter(a => a.category === filter)
    : artifacts

  // Group by parent for display
  const standalone = filteredArtifacts.filter(a => !a.parent_id && a.artifact_type !== 'companion')
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-xl text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-gray-900">
      <header className="max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          XQ Showcase
        </h1>
        <p className="text-gray-400 text-lg">
          Interactive mathematical visualizations exploring psycho-social dynamics
        </p>
      </header>

      {categories.length > 1 && (
        <div className="max-w-6xl mx-auto mb-8 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === null
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {standalone.length === 0 ? (
        <div className="max-w-6xl mx-auto text-center py-20">
          <div className="text-6xl mb-4">🔮</div>
          <h2 className="text-2xl font-semibold mb-2 text-white">No artifacts yet</h2>
          <p className="text-gray-400">
            Create an artifact in Claude and push it here to get started.
          </p>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {standalone.map((artifact) => {
            const companions = filteredArtifacts.filter(a => a.parent_id === artifact.id)
            return (
              <Link
                key={artifact.id}
                to={`/artifacts/${artifact.slug}`}
                className="block bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors border border-gray-700 hover:border-purple-500"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-white">{artifact.title}</h3>
                  <div className="flex items-center gap-2">
                    {artifact.featured && (
                      <span className="text-yellow-400">★</span>
                    )}
                    {artifact.artifact_type === 'slideshow' && (
                      <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">slides</span>
                    )}
                  </div>
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
                  {artifact.tags?.slice(0, 2).map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                {companions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-xs text-gray-500 mb-2">Related:</p>
                    <div className="flex flex-wrap gap-1">
                      {companions.map(c => (
                        <span key={c.id} className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
                          {c.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ArtifactView() {
  const { slug } = useParams<{ slug: string }>()
  const [artifact, setArtifact] = useState<Artifact | null>(null)
  const [companions, setCompanions] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCompanion, setActiveCompanion] = useState<string | null>(null)

  useEffect(() => {
    async function fetchArtifact() {
      const { data, error } = await supabase
        .from('artifacts')
        .select('*')
        .eq('slug', slug)
        .single()
      
      if (error) {
        console.error('Error fetching artifact:', error)
      } else {
        setArtifact(data)
        
        // Fetch companions if this is a parent
        if (data) {
          const { data: companionData } = await supabase
            .from('artifacts')
            .select('*')
            .eq('parent_id', data.id)
            .order('display_order', { ascending: true })
          
          setCompanions(companionData || [])
        }
      }
      setLoading(false)
    }
    fetchArtifact()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-xl text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!artifact) {
    return (
      <div className="min-h-screen p-8 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="text-purple-400 hover:text-purple-300 mb-8 inline-block">
            ← Back to Gallery
          </Link>
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold mb-2 text-white">Artifact not found</h2>
          </div>
        </div>
      </div>
    )
  }

  const displayUrl = activeCompanion 
    ? companions.find(c => c.id === activeCompanion)?.embed_url 
    : artifact.embed_url

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="text-purple-400 hover:text-purple-300">
            ← Back
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-white">{artifact.title}</h1>
            {artifact.featured && <span className="text-yellow-400">★</span>}
          </div>
          <div className="w-16" /> {/* spacer */}
        </div>

        {companions.length > 0 && (
          <div className="mb-4 flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveCompanion(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCompanion === null
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {artifact.title}
            </button>
            {companions.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCompanion(c.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCompanion === c.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>
        )}
        
        {displayUrl ? (
          <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
            <iframe
              src={displayUrl}
              title={artifact.title}
              className="w-full h-[80vh]"
              frameBorder="0"
              allow="clipboard-write"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
            <p className="text-gray-400">No embed URL configured for this artifact.</p>
          </div>
        )}

        {artifact.description && (
          <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
            <p className="text-gray-300">{artifact.description}</p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-purple-900/50 text-purple-300 text-sm rounded">
            {artifact.category}
          </span>
          {artifact.tags?.map((tag) => (
            <span key={tag} className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded">
              {tag}
            </span>
          ))}
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
