import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import BarcodeScanner from './components/BarcodeScanner/BarcodeScanner'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <BarcodeScanner />
      </div>
    </>
  )
}

export default App
