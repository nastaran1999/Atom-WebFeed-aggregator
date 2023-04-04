import React, { useState, useEffect } from 'react';
import './styles.scss';
import {useLocation} from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

const PAGE_SIZE = 10; // number of items to show per page
const PAGE_RANGE = 5; // number of page buttons to show in the range

function SavedFeeds() {
  const [feedData, setFeedData] = useState([]);

  useEffect(() => {
    let storedArray = JSON.parse(localStorage.getItem("savedFeeds"));
    if(storedArray){
      setFeedData(storedArray)
    }
  }, [])
  
  const [currentPage, setCurrentPage] = useState(1);

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

  const download = () => {
    let storedArray = JSON.parse(localStorage.getItem("savedFeeds"));
    // Convert the array of objects to a JSON string
    let jsonString = JSON.stringify(storedArray);

    // Create a downloadable file using the Blob object
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'savedFeeds.json';
    document.body.appendChild(link);
    link.click();
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
      <div className='info-container'>
        <button className='button download_btn' type="submit" onClick={download}>Download</button>
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
                <div style={{ display: item.tags ? 'flex' : 'none' }}
                  className='tag_container'
                >
                  { Array.isArray(item.tags) ?
                    item.tags.map((tag, index) => {
                      return (
                        <div className="tag"
                             key={index}
                        >
                          {tag}
                        </div>)
                      })
                    : null
                  }
                  </div>
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
        <Link to="/">
          <button className='button navigate_btn'>
              Back
          </button>
        </Link>
      </div>
    </div>
  );
}

export default SavedFeeds;
