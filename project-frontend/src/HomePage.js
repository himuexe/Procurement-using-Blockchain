import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
    return (
        <div className="homepage-container">
            <h2 className="homepage-title">Welcome to the Procurement DApp</h2>
            <p className="homepage-description">Choose a page to get started:</p>
            <div className="button-group">
                <div className="button-item">
                    <Link to="/bidder">
                        <button className="navigation-button bidder-button">Go to Bidder Page</button>
                    </Link>
                    <p className="button-description">Place bids and view ongoing procurement projects.</p>
                </div>
                <div className="button-item">
                    <Link to="/owner">
                        <button className="navigation-button owner-button">Go to Owner Page</button>
                    </Link>
                    <p className="button-description">Manage contracts, set durations, and whitelist bidders.</p>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
