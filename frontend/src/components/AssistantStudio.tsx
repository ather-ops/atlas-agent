import { useState, type ReactNode } from 'react'
import { ArrowUpRight, Shuffle } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useWorkspace } from '../contexts/Workspace'
import { promptSets } from '../data/prompts'
import { PromptArt } from './PromptArt'

export function AssistantStudio({
  children,
  select,
  chat = false,
}: {
  children: ReactNode
  select: (prompt: string) => void
  chat?: boolean
}) {
  const { data } = useWorkspace()
  const name = data.preferences.name
  const [groupIndex, setGroupIndex] = useState(0)
  return (
    <div className="assistant-studio">
      <div className="studio-inner">
        <header className="studio-greeting">
          <div className="orb-stage" aria-hidden="true">
            <span className="orb-haze" />
            <img
              src="/art/lumen-orb.webp"
              width="122"
              height="122"
              alt=""
              className="welcome-orb"
              fetchPriority="high"
            />
            <i className="glint one" />
            <i className="glint two" />
            <i className="orb-speck" />
          </div>
          <p className="hello-line">
            {name ? (
              <>
                Hello, <bdi>{name}</bdi>
              </>
            ) : (
              'Welcome to Atlas'
            )}
          </p>
          <h1>{chat ? 'Where shall we begin?' : 'How can I help you today?'}</h1>
          <p className="studio-subtitle">
            {name ? (
              'Your space to think, create, and get things done.'
            ) : (
              <>
                Make this space yours.{' '}
                <Link to="/settings" state={{ editProfile: true }}>
                  Add your name
                </Link>
              </>
            )}
          </p>
        </header>
        {children}
        <section className="starter-section" aria-label="Suggested prompts">
          <div className="starter-heading">
            <h2>Quick start</h2>
            <button
              onClick={() => setGroupIndex((v) => (v + 1) % promptSets.length)}
              title="Show different prompts"
            >
              <Shuffle size={12} />
              Shuffle
            </button>
          </div>
          <div className="starter-grid">
            {promptSets[groupIndex].map((p) => (
              <motion.button
                key={p.title}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15 }}
                className={'starter-card ' + p.art}
                onClick={() => select(p.prompt)}
              >
                <PromptArt kind={p.art} />
                <ArrowUpRight className="starter-arrow" size={14} />
                <h3>{p.title}</h3>
                <p>{p.description}</p>
              </motion.button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
