import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BidderPage from './BidderPage';
import OwnerPage from './OwnerPage';
import HomePage from './HomePage';

const App = () => {
    const [account, setAccount] = useState('');
    const [loading, setLoading] = useState(true);
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        const init = async () => {
            if (!window.ethereum) {
                toast.error("Please install MetaMask!");
                setLoading(false);
                return;
            }

            try {
                const provider = new ethers.BrowserProvider(window.ethereum);

                if (!isRequesting) {
                    setIsRequesting(true);

                    await window.ethereum.request({ method: 'eth_requestAccounts' });
                    const signer = await provider.getSigner();
                    const userAddress = await signer.getAddress();
                    setAccount(userAddress);
                    toast.success("Wallet connected successfully!");
                }
            } catch (error) {
                if (error.code === -32002) {
                    toast.info("MetaMask is already processing a connection request. Please check MetaMask.");
                } else {
                    console.error("Error connecting wallet:", error);
                    toast.error("Failed to connect wallet.");
                }
            } finally {
                setLoading(false);
                setIsRequesting(false);
            }
        };

        init();

        window.ethereum?.on('accountsChanged', (accounts) => {
            if (accounts.length > 0) {
                setAccount(accounts[0]);
                toast.info("Account switched.");
            } else {
                setAccount('');
                toast.warn("Disconnected from MetaMask.");
            }
        });

        return () => {
            window.ethereum?.removeListener('accountsChanged', () => {});
        };
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-lg text-gray-700">Connecting to wallet...</p>
                </div>
            </div>
        );
    }

    return (
        <Router>
            <ToastContainer position="top-right" autoClose={5000} />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <header className="bg-white shadow-md">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold text-indigo-700">Tender Management System</h1>
                            <div className="bg-blue-50 px-3 py-2 rounded-md text-sm font-medium text-blue-700 truncate max-w-xs">
                                {account ? account : 'Not Connected'}
                            </div>
                        </div>
                    </div>
                </header>
                
                <nav className="bg-indigo-600 shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-center space-x-8">
                            <Link to="/" className="px-5 py-3 text-white hover:bg-indigo-500 rounded-md font-medium transition-colors">Home</Link>
                            <Link to="/bidder" className="px-5 py-3 text-white hover:bg-indigo-500 rounded-md font-medium transition-colors">Bidder Page</Link>
                            <Link to="/owner" className="px-5 py-3 text-white hover:bg-indigo-500 rounded-md font-medium transition-colors">Owner Page</Link>
                        </div>
                    </div>
                </nav>
                
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/bidder" element={<BidderPage account={account} />} />
                        <Route path="/owner" element={<OwnerPage account={account} />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
};

export default App;