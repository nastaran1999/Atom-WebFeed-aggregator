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
    let concatFeeds = null;
    if(result.entry){
      console.log('atom')
      result = addAuthorInfo(result, 'atom')
      // handling feeds without published date (only updated date)
      if(!result.entry[0].published){
        changeFieldNameOfArray('updated', 'published', result.entry)
      }
      concatFeeds = feedData.concat(result.entry);
    }
    else if(result.item){
      console.log('rss')      
      result = addAuthorInfo(result, 'rss')
      changeFieldNameOfArray('pubDate', 'published', result.item)
      concatFeeds = feedData.concat(result.item);
    }
    else if(result.items){
      console.log('json')
      result = addAuthorInfo(result, 'json')
      // normalizing json fields
      changeFieldNameOfArray('date_published', 'published', result.items)
      changeFieldNameOfArray('content_html', 'content', result.items)
      changeFieldNameOfArray('url', 'link', result.items)
      concatFeeds = feedData.concat(result.items);
    }
    concatFeeds = sortAccordingToDate(concatFeeds);
    setFeedData(concatFeeds)
  }

  // setting identical field names for all types of feeds
  const changeFieldNameOfArray = (old_key, new_key, array) => {
    for (let index = 0; index < array.length; index++) {
      if (old_key !== new_key) {
        Object.defineProperty(array[index], new_key,
            Object.getOwnPropertyDescriptor(array[index], old_key));
        delete array[index][old_key];
      }
    }
  }

  const sortAccordingToDate = (arr) => {
    arr.sort((a, b) => {
      const dateA = new Date(Date.parse(a.published));
      const dateB = new Date(Date.parse(b.published));
      return dateB - dateA;
    })
    return arr;
  }
  
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
        feeds.entry[index].logo = feeds.logo.includes('://') ? feeds.logo : feeds.link + feeds.logo
      }
    }
    else if(type == 'rss'){
      for (let index = 0; index < feeds.item.length; index++) {
        feeds.item[index].author = feeds['itunes:owner']['itunes:name'];
        feeds.item[index].authorLink = feeds['itunes:owner']['itunes:email'];
        feeds.item[index].logo = feeds['itunes:image']['url'] ? feeds['itunes:image']['url'] : feeds['itunes:image']['@_href'] ? feeds['itunes:image']['@_href'] : '';
      }
    }
    else if(type == 'json'){
      for (let index = 0; index < feeds.items.length; index++) {
        feeds.items[index].author = feeds.author.name;
        feeds.items[index].authorLink = feeds.home_page_url;
        feeds.items[index].logo = '';
      }
    }
    return feeds;
  }

  const contentHandler = (item) => {
    if(item.content){
      if(item.content.includes('\n')){
        item.content = item.content.replaceAll('\n', '<br>')
      }
      return (<div dangerouslySetInnerHTML={{__html: item.content}} />)
    }
    else if(item.description){
      if(item.description.includes('\n')){
        item.description = item.description.replaceAll('\n', '<br>')
      }
      return (<div dangerouslySetInnerHTML={{__html: item.description}} />)
    }
  }

  return (
    <div className="App">
      <form onSubmit={handleSubmit} className="form">
        <input className='input' type="text" placeholder="Enter feed URL" value={feedUrl} onChange={(event) => setFeedUrl(event.target.value)} />
        <button className='button' type="submit">Subscribe</button>
      </form>
      {error && <div className="error">{error.message}</div>}
            <div className='info-container'>
              <ul>
              {
                feedData.length && feedData.map((item, index) => (
                  <li key={index}>
                    <div className="author_container">
                      <img className='author_img' src={item.logo} />
                      <div className='author_info_wrapper'>
                        <p className='author_info_title'>{item.title}</p>
                        <p className='author_info_name'>{item.author} - <a href={item.authorLink}>{item.authorLink}</a></p>
                      </div>
                    </div>
                    <div className='content_container'>
                      <div className="date">{item.published ? item.published : 'unavailable'}</div>
                      <a className="date" href={item.link}>{item.link}</a>
                      <div className="content">{contentHandler(item)}</div>
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
    </div>
  );
}

export default App;
