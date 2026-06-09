import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Gallery from './pages/Gallery';
import MemeGenerator from './pages/MemeGenerator';
import WhackyPod from './pages/WhackyPod';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/meme-generator" element={<MemeGenerator />} />
        <Route path="/whacky-pod" element={<WhackyPod />} />
      </Routes>
    </BrowserRouter>
  );
}
