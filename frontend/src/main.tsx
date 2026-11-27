import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { WorkspaceProvider } from './contexts/Workspace'
import App from './App'
import './styles.css'
import './styles/shell.css'
import './styles/overview.css'
import './styles/dialogs.css'
import './styles/chat.css'
import './styles/pages.css'
import './styles/night.css'
import './styles/responsive.css'
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <MotionConfig reducedMotion="user">
      <WorkspaceProvider>
        <App />
      </WorkspaceProvider>
    </MotionConfig>
  </BrowserRouter>,
)
