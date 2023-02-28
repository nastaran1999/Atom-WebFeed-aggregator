import React, { useState, useEffect } from 'react';
import './App.scss';
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
    let result = await extract('http://127.0.0.1:8080/' + feedUrl, {
      normalization: false
    })
    console.log(result)
    console.log(result.entry)
    result.entry = result.entry.sort(compare);
    setFeedData(result);
  }

  // handling uloaded images with relative paths
  useEffect(() => {
    let imgElement = document.getElementsByTagName('img')[0]
    if(imgElement){
      if(!imgElement.complete && imgElement.naturalHeight == 0){
        imgElement.src = feedData.link + feedData.logo
      }
    }
  }, [feedData])

  // sorting items according to published dates
  const compare = (a, b) => {
    if ( a.published < b.published ){
      return 1;
    }
    if ( a.published > b.published ){
      return -1;
    }
    return 0;
  }
  

  return (
    <div className="App">
      <form onSubmit={handleSubmit} className="form">
        <input className='input' type="text" placeholder="Enter feed URL" value={feedUrl} onChange={(event) => setFeedUrl(event.target.value)} />
        <button className='button' type="submit">Subscribe</button>
      </form>
      {error && <div className="error">{error.message}</div>}
      {
        feedData ? 
        <div className='info-container'>
          <div className='info-upper-container'>
            <div className='info-upper-left'>
              <p>author: {feedData.author.name}</p>
              <p>id: {feedData.id}</p>
              <p>link: {feedData.link}</p>
              <p>title: {feedData.title}</p>
            </div>
            <img src={feedData.logo} />
          </div>
          <p>subtitle: {feedData.subtitle}</p>
          <p>rights: {feedData.rights}</p>
          <p>updated: {feedData.updated}</p>
        </div>
        :
        null
      }
      
      <ul>
        {feedData && feedData.entry.map((item, index) => (
          <li key={index}>
            <div className="title">{item.title}</div>
            <div className="date">{item.published}</div>
            <div className="content">id: {item.id}</div>
            <a className="content" href={item.link}>{item.link}</a>
            <div className="content">description: {item.content}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
