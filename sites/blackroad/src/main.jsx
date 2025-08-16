import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router.jsx'
import './ui/styles.css'

createRoot(document.getElementById('root')).render(<RouterProvider router={router} />)
