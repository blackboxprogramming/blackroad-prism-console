import { createBrowserRouter } from 'react-router-dom'
import Layout from './ui/Layout.jsx'
import Home from './pages/Home.jsx'
import Docs from './pages/Docs.jsx'
import StatusPage from './pages/StatusPage.jsx'
import SnapshotPage from './pages/SnapshotPage.jsx'
import Portal from './pages/Portal.jsx'
import Playground from './pages/Playground.jsx'
import Contact from './pages/Contact.jsx'
import Tutorials from './pages/Tutorials.jsx'
import Roadmap from './pages/Roadmap.jsx'
import Changelog from './pages/Changelog.jsx'
import Blog from './pages/Blog.jsx'
import Post from './pages/Post.jsx'
import NotFound from './pages/NotFound.jsx'

export const router = createBrowserRouter([
  {
    path: '/:lang(en|es)?',
    element: <Layout />,
    errorElement: <Layout><NotFound/></Layout>,
    children: [
      { index: true, element: <Home /> },
      { path: 'docs', element: <Docs /> },
      { path: 'status', element: <StatusPage /> },
      { path: 'snapshot', element: <SnapshotPage /> },
      { path: 'portal', element: <Portal /> },
      { path: 'playground', element: <Playground /> },
      { path: 'contact', element: <Contact /> },
      { path: 'tutorials', element: <Tutorials /> },
      { path: 'roadmap', element: <Roadmap /> },
      { path: 'changelog', element: <Changelog /> },
      { path: 'blog', element: <Blog /> },
      { path: 'blog/:slug', element: <Post /> },
      { path: '*', element: <NotFound /> }
    ]
  }
])
