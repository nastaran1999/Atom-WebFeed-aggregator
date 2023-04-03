import React, { useState, useEffect } from 'react';
import './styles.scss';
import { extract } from '@extractus/feed-extractor'
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// check tag format and save it like an array
// add filter by tag
// fix pagination button styles
// fewer feedData loop -> newFeedData

const PAGE_SIZE = 10; // number of items to show per page
const PAGE_RANGE = 5; // number of page buttons to show in the range

function AllFeeds() {
  const [feedUrl, setFeedUrl] = useState('');
  const [feedData, setFeedData] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFeeds, setSelectedFeeds] = useState([])
  const [tag, setTag] = useState('');

  useEffect(() => {
    // fetching selected feeds from local storage -> in order to show navigation buttons (download and view btns)
    let storedArray = JSON.parse(localStorage.getItem("savedFeeds"));
    if(storedArray){
        setSelectedFeeds(storedArray)
    }
    // fetching previously fetched items
    let storedArray2 = JSON.parse(localStorage.getItem("fetchedFeeds"));
    if(storedArray2){
        setFeedData(storedArray2)
    }
  }, [])
  
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

    // Filter out duplicates
    let uniqueResults = Array.from(new Set(concatFeeds.map(result => result.id)))
                                        .map(id => {
                                        return concatFeeds.find(result => result.id === id);
                                    });
    // adding bookmarked status for newly fetched items 
    uniqueResults = addBookMarkedStatus(uniqueResults)                                
    setFeedData(uniqueResults);
    // updating local storage and saving newly fetched feeds
    localStorage.setItem("fetchedFeeds", JSON.stringify(uniqueResults));
  }

  // calculate the total number of pages
  const totalPages = Math.ceil(feedData.length / PAGE_SIZE);

  // calculate the range of page numbers to display
  let pageRangeStart = Math.max(1, currentPage - PAGE_RANGE);
  let pageRangeEnd = Math.min(totalPages, currentPage + PAGE_RANGE);
  if (pageRangeEnd - pageRangeStart < PAGE_RANGE * 2) {
    // adjust the range if it's too small
    if (pageRangeStart === 1) {
      pageRangeEnd = Math.min(totalPages, pageRangeStart + PAGE_RANGE * 2);
    } else {
      pageRangeStart = Math.max(1, pageRangeEnd - PAGE_RANGE * 2);
    }
  }

  // create an array of page numbers to display
  const pageNumbers = [];
  if (pageRangeStart > 1) {
    pageNumbers.push(1);
    if (pageRangeStart > 2) {
      pageNumbers.push("...");
    }
  }
  for (let i = pageRangeStart; i <= pageRangeEnd; i++) {
    pageNumbers.push(i);
  }
  if (pageRangeEnd < totalPages) {
    if (pageRangeEnd < totalPages - 1) {
      pageNumbers.push("...");
    }
    pageNumbers.push(totalPages);
  }

  // calculate the start and end index of the current page
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;

  const addBookMarkedStatus = (array) => {
    for (let index = 0; index < array.length; index++) {
        if(!array[index].bookmarked){
            array[index].bookmarked = false;
            array[index].tags = '';
        }
    }
    return array;
  }

  // setting identical field names for all types of feeds
  const changeFieldNameOfArray = (old_key, new_key, array) => {
    for (let index = 0; index < array.length; index++) {
      changeFieldNameofObject(array[index], old_key, new_key)
    }
  }

  const changeFieldNameofObject = (obj, old_key, new_key) => {
    if (old_key !== new_key) {
      Object.defineProperty(obj, new_key,
          Object.getOwnPropertyDescriptor(obj, old_key));
      delete obj[old_key];
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
    // adding the feed to selected feed array
    // adding selected tags to the item
    feed.tags = tag;
    setSelectedFeeds([...selectedFeeds,feed]);
    // storing the selected feed in local storage
    let storedArray = JSON.parse(localStorage.getItem("savedFeeds"));
    if(storedArray == null){
        storedArray = []
    }
    storedArray.push(feed)
    setSelectedFeeds(storedArray);
    localStorage.setItem("savedFeeds", JSON.stringify(storedArray));
    // changing bookmarked status of the item in order to disable the button after refresh
    feed.bookmarked = true
    // let newFeedData = feedData;
    // for (let index = 0; index < newFeedData.length; index++) {
    //     if(newFeedData[index].id == feed.id){
    //         newFeedData[index].bookmarked = true;
    //         newFeedData[index].tags = tag;
    //     }
    // }
    localStorage.setItem("fetchedFeeds", JSON.stringify(feedData));
    setTag('');

  }

  const addAuthorInfo = (feeds, type) => {
    if(type == 'atom'){
      for (let index = 0; index < feeds.entry.length; index++) {
        feeds.entry[index].author = feeds.author ? feeds.author.name : '';
        feeds.entry[index].authorLink = feeds.link;
        if(feeds.logo){
          feeds.entry[index].logo = feeds.logo.includes('://') ? feeds.logo : feeds.link + feeds.logo
        }else if(feeds.icon){
          feeds.entry[index].logo = feeds.icon.includes('://') ? feeds.icon : feeds.link + feeds.icon
        }else{
          feeds.logo = ''
        }
      }
    }
    else if(type == 'rss'){
      for (let index = 0; index < feeds.item.length; index++) {
        feeds.item[index].author = feeds['itunes:owner'] ? feeds['itunes:owner']['itunes:name'] : '';
        feeds.item[index].authorLink = feeds['itunes:owner'] ? feeds['itunes:owner']['itunes:email'] : '';
        if(feeds['itunes:image']){
          feeds.item[index].logo = feeds['itunes:image']['url'] ? feeds['itunes:image']['url'] : feeds['itunes:image']['@_href'] ? feeds['itunes:image']['@_href'] : '';
        }else if(feeds['media:thumbnail']){
          feeds.item[index].logo = feeds['media:thumbnail']['url'] ? feeds['media:thumbnail']['url'] : feeds['media:thumbnail']['@_href'] ? feeds['media:thumbnail']['@_href'] : '';
        }else if(feeds['media:content']){
          feeds.item[index].logo = feeds['media:content']['url'] ? feeds['media:content']['url'] : feeds['media:content']['@_href'] ? feeds['media:content']['@_href'] : '';
        }
      }
    }
    else if(type == 'json'){
      for (let index = 0; index < feeds.items.length; index++) {
        feeds.items[index].author = feeds.author.name;
        feeds.items[index].authorLink = feeds.home_page_url;
        if(feeds.items[index].image){
          feeds.items[index].logo = feeds.items[index].image;
        }else if(feeds.items[index].icon){
          feeds.items[index].logo = feeds.items[index].icon;
        }
        else{
          feeds.items[index].logo = '';
        }
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

  const download = () => {
    // Convert the array of objects to a JSON string
    let jsonString = JSON.stringify(selectedFeeds);

    // Create a downloadable file using the Blob object
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'savedFeeds.json';
    document.body.appendChild(link);
    link.click();
  }

  const deleteFetchedFeeds = () => {
    console.log('deleteFetchedFeeds')
    localStorage.setItem("fetchedFeeds", JSON.stringify([]));
  }

  const deleteSavedFeeds = () => {
    let newFeedData = feedData;
    for (let index = 0; index < newFeedData.length; index++) {
        newFeedData[index].bookmarked = false;
    }
    localStorage.setItem("savedFeeds", JSON.stringify([]));
    localStorage.setItem("fetchedFeeds", JSON.stringify(newFeedData));
    setFeedData(newFeedData)
  }
  
  const handleTagsChange = (event) => {
    setTag(event.target.value)
  };

  return (
      <div className="App">
        <form className="form">
          <input className='input' type="text" placeholder="Enter feed URL" value={feedUrl} onChange={(event) => setFeedUrl(event.target.value)} />
          <button className='button' onClick={handleSubmit}>Subscribe</button>
          {
            selectedFeeds.length > 0 ? 
            <div className='btn_container'>
              <button className='button download_btn' onClick={download}>Download</button>
              <Link to="/savedFeeds">
                <button className='button navigate_btn'>
                    View Bookmarked Feeds
                </button>
              </Link>
              <button className='button delete_btn' onClick={deleteFetchedFeeds}>Delete Fetched Feeds</button>
              <button className='button delete_btn' onClick={deleteSavedFeeds}>Delete Bookmarked Feeds</button>
            </div>
            : null
          }
          
             
        </form>
        {error && <div className="error">{error.message}</div>}
        <div className='info-container'>
          <ul>
          {
            feedData.length ? feedData.slice(startIndex, endIndex).map((item, index) => (
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
                <div className='bookmark-button'>
                    <input id={index + '_input'}
                           type="text" 
                           value={item.tags ? item.tags : tag} 
                           onChange={handleTagsChange} 
                           placeholder="Add tags for example Apple, Banana, ..."
                           disabled={item.tags}
                           style={{ display: item.tags ? 'unset' : 'none' }} />
                    <button className="add_btn" 
                        id={index + '_btn'}
                        disabled={item.bookmarked}
                        onClick={() => {
                            let buttonText = document.getElementById(index + '_btn').innerText
                            if(buttonText == 'Save'){
                                addFeed(item)
                            }else{
                                document.getElementById(index + '_btn').innerText = 'Save'
                                document.getElementById(index + '_input').style.display = 'unset'
                            }
                        }}
                    >Bookmark</button>
                    
                </div>
              </li>
            )) : null
          }
          </ul>
          {
            feedData.length ? 
              <div>
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} >
                  First
                </button>
                <button onClick={() => setCurrentPage(prevPage => prevPage - 1)} disabled={currentPage === 1}>
                  Previous
                </button>
                {pageNumbers.map(pageNumber => (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    disabled={currentPage === pageNumber}>
                    {pageNumber}
                  </button>
                ))}
                <button onClick={() => setCurrentPage(prevPage => prevPage + 1)} disabled={currentPage === totalPages}>
                  Next
                </button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                  Last
                </button>
              </div>
            : null
          }
        </div>
      </div>
  );
}

export default AllFeeds;
