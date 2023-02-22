import React, { useState } from 'react';
import './App.css';
import axios from 'axios';
// import { parseString } from 'xml2js';
import { extract } from '@extractus/feed-extractor'

function App() {
  const [feedUrl, setFeedUrl] = useState('');
  const [feedData, setFeedData] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    // fetch and parse the feed here
    const result = await extract('http://127.0.0.1:8080/' + feedUrl)
    setFeedData(result.entries);
  }

  return (
    <div className="App">
      <form onSubmit={handleSubmit} className="form">
        <input className='input' type="text" placeholder="Enter feed URL" value={feedUrl} onChange={(event) => setFeedUrl(event.target.value)} />
        <button className='button' type="submit">Subscribe</button>
      </form>
      {error && <div className="error">{error.message}</div>}
      <ul>
        {feedData && feedData.map((item, index) => (
          <li key={index}>
            <div className="title">{item.title}</div>
            <div className="date">{item.published}</div>
            <div className="content">id: {item.id}</div>
            <a className="content" href={item.link}>{item.link}</a>
            <div className="content">description: {item.description}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
