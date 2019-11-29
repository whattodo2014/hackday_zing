import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { run, onPlay } from './js/webcamera.js';

class App extends Component {
  componentDidMount() {
    console.log('start'
    );
    run();
    console.log('well done!');
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <div className="margin">
            <video id="inputVideo" style={{ width: '50%', position: 'relative' }} onPlay={onPlay} autoPlay muted />
            <canvas id="overlay" />
          </div>
          <p>
            <button className="all_list_brands_title_details_btn" id="brands_button" >
              <span>借</span>
            </button>
            <button className="all_list_brands_title_details_btn" id="brands_button" >
              <span>还</span>
            </button>
            <button className="all_list_brands_title_details_btn" id="brands_button" >
              <span>享</span>
            </button>
            <button className="all_list_brands_title_details_btn" id="brands_button" >
              <span>查</span>
            </button>
          </p>
          <a
            className="App-link"
            href="https://www.moodys.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Moody's Shenzhen
          </a>
        </header>    
      </div>
    );
  }
}

export default App;
