import React, { useState, useEffect } from 'react';
import './App.scss';
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
    addAuthorInfo(result)
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
    return true
  }

  const addAuthorInfo = (feeds) => {
    for (let index = 0; index < feeds.entry.length; index++) {
      feeds.entry[index].author = feeds.author.name;
      feeds.entry[index].authorLink = feeds.link;
    }
    return feeds;
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
              <ul>
              {
                feedDataItem.entry.map((item, index) => (
                  <li key={index}>
                    <div className="author_container">
                      <img className='author_img' src={feedDataItem.info.logo} />
                      <div className='author_info_wrapper'>
                        <p className='author_info_title'>{item.title}</p>
                        <p className='author_info_name'>{item.author} - <a href={item.authorLink}>{item.authorLink}</a></p>
                      </div>
                    </div>
                    <div className='content_container'>
                      <div className="date">published: {item.published ? item.published : 'unavailable'}</div>
                      <div className="date">updated: {item.updated}</div>
                      <a className="date" href={item.link}>{item.link}</a>
                      <div className="content">{item.content}</div>
                    </div>
                    <button className="add_btn" 
                      id={index + '_btn'}
                      onClick={() => {
                        let successfullyAdded = addFeed(item)
                        if(successfullyAdded){
                          document.getElementById(index + '_btn').disabled = true
                        }
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
