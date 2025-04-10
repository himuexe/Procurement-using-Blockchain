import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
    return (
        <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-indigo-800 mb-4">Welcome to the Procurement DApp</h2>
            <p className="text-lg text-gray-700 mb-8">Choose a page to get started:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold text-blue-700 mb-3">Bidder Portal</h3>
                    <p className="text-gray-600 mb-6">Place bids and view ongoing procurement projects. Participate in tenders and track your bidding status.</p>
                    <Link to="/bidder">
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                            Go to Bidder Page
                        </button>
                    </Link>
                </div>
                
                <div className="bg-indigo-50 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold text-indigo-700 mb-3">Owner Dashboard</h3>
                    <p className="text-gray-600 mb-6">Manage contracts, set durations, whitelist bidders, and review submitted bids for your procurement projects.</p>
                    <Link to="/owner">
                        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                            Go to Owner Page
                        </button>
                    </Link>
                </div>
            </div>
            
            <div className="mt-12 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">About This DApp</h3>
                <p className="text-gray-600">
                    This decentralized application leverages blockchain technology to create a transparent and secure 
                    tender management system. It enables fair bidding processes while maintaining privacy of bid amounts 
                    until the bidding period ends.
                </p>
            </div>
        </div>
    );
};

export default HomePage;