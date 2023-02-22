import React, { useState } from 'react';
import './App.css';
import axios from 'axios';
import { parseString } from 'xml2js';


function App() {
  const [feedUrl, setFeedUrl] = useState('');
  const [feedData, setFeedData] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    // fetch and parse the feed here
    axios({
      url: 'http://127.0.0.1:8080/' + feedUrl,
      method: 'get',
    })
    .then(response => {
      const xml = response.data;
      console.log(response.data);
      parseString(xml, (error, result) => {
        if (error) {
          setError(error);
        } else {
          console.log(result.feed.entry)
          console.log(Object.values(result.feed.entry[0].content[0])[0]);
          let items =  result.feed.entry.map( item => {
            // title
            let title = ''
            if(Array.isArray(item.title)){
              if(typeof item.title[0] === "object"){
                title = Object.values(item.title[0])[0]
              }else{
                title = item.title[0]
              }
            }
            // update
            let update = ''
            if(Array.isArray(item.updated)){
              update = new Date(item.updated[0]).toLocaleString()
            }
            // published
            let published = ''
            if(Array.isArray(item.published)){
              published = new Date(item.published[0]).toLocaleString()
            }
            // id
            let id = ''
            if(Array.isArray(item.id)){
              id = item.id[0]
            }
            // // content
            // let content = ''
            // if(Array.isArray(item.content)){
            //   if(typeof item.content[0] === "object"){
            //     content = Object.values(item.content[0])[0]
            //     console.log(content.toString())
            //   }
            // }
            return {
              title: title,
              update: update,
              published: published,
              id: id
              // content: content
            }
          } )
          setFeedData(items);
        }
      });
    })
    .catch(error => {
      setError(error);
    });
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
            <div className="date">published: {item.published === '' ? 'unknown' : item.published}</div>
            <div className="date">updated: {item.update}</div>
            <br />
            <div className="content">{item.id}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
