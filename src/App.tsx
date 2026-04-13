import { Routes, Route } from 'react-router-dom'
import Builder from './Builder'
import CardLanding from './CardLanding'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Builder />} />
      <Route path="/card" element={<CardLanding />} />
    </Routes>
  )
}
