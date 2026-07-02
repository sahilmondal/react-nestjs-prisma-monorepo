import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'

import './styles.css'
import { getRouter } from './router'

const rootElement = document.getElementById('app')!
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement)
  root.render(
    <StrictMode>
      <RouterProvider router={getRouter()} />
    </StrictMode>,
  )
}
