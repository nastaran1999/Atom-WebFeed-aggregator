import React from 'react';
import './App.scss';
import { BrowserRouter as Router, Routes, Route }from 'react-router-dom';
import AllFeeds from './pages';
import SavedFeeds from './pages/savedFeeds';

function App() {
return (
	<Router>
    <Routes>
      <Route exact path='/' exact element={<AllFeeds />} />
      <Route path='/savedFeeds' element={<SavedFeeds/>} />
    </Routes>
	</Router>
);
}

export default App;