import { Route, Routes } from 'react-router-dom';
import { Landing } from './routes/Landing';
import { Analyzer } from './routes/Analyzer';
import { Docs } from './routes/Docs';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/analyzer" element={<Analyzer />} />
      <Route path="/docs" element={<Docs />} />
    </Routes>
  );
}
