import React, { useState, useEffect } from 'react';
import './App.scss';
import axios from 'axios';
import { extract } from '@extractus/feed-extractor'

function App() {
  const [feedUrl, setFeedUrl] = useState('');
  const [feedData, setFeedData] = useState([]);
  const [error, setError] = useState(null);
  localStorage.setItem("savedFeeds", JSON.stringify([]));

  const handleSubmit = async (event) => {
    event.preventDefault();
    // fetch and parse the feed here
    let result = await extract('http://127.0.0.1:8080/' + feedUrl, {
      normalization: false
    })

    // sort feeds according to their published date
    result.entry = result.entry.sort(compare);
    setFeedData([...feedData, {'entry' : result.entry,
                              'info' : {'author' : result.author.name ,
                              'id': result.id,
                              'link': result.link,
                              'title': result.title,
                              // handling uloaded images with relative paths
                              'logo': result.logo.includes('://') ? result.logo : result.link + result.logo,
                              'subtitle': result.subtitle,
                              'rights': result.rights,
                              'updated': result.updated}
                              }])
  }

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
  
  const addFeed = (feed) => {
    let storedArray = JSON.parse(localStorage.getItem("savedFeeds"));
    storedArray.push(feed)
    localStorage.setItem("savedFeeds", JSON.stringify(storedArray));
    console.log(JSON.parse(localStorage.getItem("savedFeeds")))
    // return true
  }

  return (
    <div className="App">
      <form onSubmit={handleSubmit} className="form">
        <input className='input' type="text" placeholder="Enter feed URL" value={feedUrl} onChange={(event) => setFeedUrl(event.target.value)} />
        <button className='button' type="submit">Subscribe</button>
      </form>
      {error && <div className="error">{error.message}</div>}
         {feedData.length && feedData.map((feedDataItem, index) => { 
          return(
            <div className='info-container'>
              <div className='info-upper-container'>
                <div className='info-upper-left'>
                  test
                  <p>author: {feedDataItem.info.author}</p>
                  <p>id: {feedDataItem.info.id}</p>
                  <p>link: {feedDataItem.info.link}</p>
                  <p>title: {feedDataItem.info.title}</p>
                </div>
                <img src={feedDataItem.info.logo} />
              </div>
              <p>subtitle: {feedDataItem.info.subtitle}</p>
              <p>rights: {feedDataItem.info.rights}</p>
              <p>updated: {feedDataItem.info.updated}</p>
              <ul>
              {
                feedDataItem.entry.map((item, index) => (
                  <li key={index}>
                    <img className='author_img' src={feedDataItem.info.logo} />
                    <div className="title">{item.title}</div>
                    <div className="date">published: {item.published}</div>
                    <div className="date">updated: {item.updated}</div>
                    <div className="content">id: {item.id}</div>
                    <a className="content" href={item.link}>{item.link}</a>
                    <div className="content">description: {item.content}</div>
                    <button className="add_btn" 
                      onClick={() => {
                        let successfullyAdded = addFeed(item)
                        // if(successfullyAdded){
                        //   this.disabled = true;
                        // }
                      }}
                      >Add</button>
                  </li>
                ))
              }
              </ul>
            </div>
          )
        })} 
    </div>
  );
}

export default App;
