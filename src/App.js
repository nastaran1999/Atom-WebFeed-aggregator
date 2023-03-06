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
    console.log(result)
    if(result.entry){
      console.log('atom')
      // sort feeds according to their published date
      result.entry = sortArrayOfObjects(result.entry, "published");
      result = addAuthorInfo(result, 'atom')
      setFeedData([...feedData, {'entry' : result.entry,
                                'info' : 
                                  {'author' : result.author.name ,
                                  'id': result.id,
                                  'link': result.link,
                                  'title': result.title,
                                  // handling uloaded images with relative paths
                                  'logo': result.logo.includes('://') ? result.logo : result.link + result.logo,
                                  'rights': result.rights}
                                }])
    }
    else if(result.item){
      console.log('rss')      // sort feeds according to their published date
      result.item = sortArrayOfObjects(result.item, "pubDate");
      result = addAuthorInfo(result, 'rss')
      setFeedData([...feedData, {'entry' : result.item,
                                'info' : 
                                  {'author' : result['itunes:author'],
                                  'link': result.link,
                                  'title': result.title,
                                  // handling uloaded images with relative paths
                                  'logo': result['itunes:image']['url'] ? result['itunes:image']['url'] : result['itunes:image']['@_href'] ? result['itunes:image']['@_href'] : '',
                                  'rights': result.copyright}
                                }])
    }
    else if(result.items){
      console.log('json')
      result.items = sortArrayOfObjects(result.items, "date_published");
    }

  }

  const sortArrayOfObjects = (arr, key) => {
    return arr.sort((a, b) => {
      return new Date(b[key]) - new Date(a[key]);
    });
  };
  
  const addFeed = (feed) => {
    let storedArray = JSON.parse(localStorage.getItem("savedFeeds"));
    storedArray.push(feed)
    localStorage.setItem("savedFeeds", JSON.stringify(storedArray));
    console.log(JSON.parse(localStorage.getItem("savedFeeds")))
    return true
  }

  const addAuthorInfo = (feeds, type) => {
    if(type == 'atom'){
      for (let index = 0; index < feeds.entry.length; index++) {
        feeds.entry[index].author = feeds.author.name;
        feeds.entry[index].authorLink = feeds.link;
      }
    }
    else if(type == 'rss'){
      for (let index = 0; index < feeds.item.length; index++) {
        feeds.item[index].author = feeds['itunes:owner']['itunes:name'];
        feeds.item[index].authorLink = feeds['itunes:owner']['itunes:email'];
      }
    }
    else if(type == 'json'){
      for (let index = 0; index < feeds.items.length; index++) {
        feeds.items[index].author = feeds.author.name;
        feeds.items[index].authorLink = feeds.home_page_url;
      }
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
              <ul key={index}>
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
                      <div className="date">published: {item.published ? item.published : item.pubDate ? item.pubDate : 'unavailable'}</div>
                      <div className="date">updated: {item.updated ? item.updated : 'unavailable'}</div>
                      <a className="date" href={item.link}>{item.link}</a>
                      <div className="content">{item.content ? item.content : item.description ? item.description : ''}</div>
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
