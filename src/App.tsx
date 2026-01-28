import { Routes, Route } from 'react-router-dom'
import FrontPage from './components/FrontPage'
import NapkinLayout from './components/NapkinLayout'
import Napkin from './components/Napkin'

function App() {
  return (
    <Routes>
      <Route path="/" element={<FrontPage />} />
      <Route path="/napkin" element={<NapkinLayout />}>
        <Route index element={<Napkin />} />
        <Route path=":id" element={<Napkin />} />
      </Route>
    </Routes>
  )
}

export default App
