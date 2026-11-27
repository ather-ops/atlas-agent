import { useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { Shell } from './layouts/Shell'
import { WorkspaceDialogs, type DialogName } from './components/WorkspaceDialogs'
import Chat from './pages/Chat'
import Integrations from './pages/Integrations'
import Automations from './pages/Automations'
import Settings from './pages/Settings'
export default function App() {
  const [dialog, setDialog] = useState<DialogName>(null)
  return (
    <>
      <Shell open={setDialog}>
        <Routes>
          <Route path="/" element={<Chat overview open={setDialog} />} />
          <Route path="/chat/:id?" element={<Chat open={setDialog} />} />
          <Route path="/automations" element={<Automations />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/settings" element={<Settings />} />
          <Route
            path="*"
            element={
              <div className="page-wrap empty-block">
                <h1>Page not found</h1>
                <p>This page isn’t part of your workspace.</p>
                <Link className="text-link" to="/">
                  Return to overview →
                </Link>
              </div>
            }
          />
        </Routes>
      </Shell>
      <WorkspaceDialogs open={setDialog} dialog={dialog} close={() => setDialog(null)} />
    </>
  )
}
