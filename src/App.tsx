import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

// Lazy load components to keep initial bundle small
const FrontPage = lazy(() => import('./components/FrontPage'))
const NapkinLayout = lazy(() => import('./components/NapkinLayout'))
const Napkin = lazy(() => import('./components/Napkin'))

function App() {
  return (
    <Suspense fallback={
      <div className="flex h-dvh w-full items-center justify-center bg-[#FCFBF4]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    }>
      <Routes>
        <Route path="/" element={<FrontPage />} />
        <Route path="/napkin" element={<NapkinLayout />}>
          <Route index element={<Napkin />} />
          <Route path=":id" element={<Napkin />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
