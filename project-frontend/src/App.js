import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BidderPage from './BidderPage';
import OwnerPage from './OwnerPage';
import HomePage from './HomePage';
import './App.css';

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
        return <div className="loading-screen">Connecting to wallet...</div>;
    }

    return (
        <Router>
            <ToastContainer position="top-right" autoClose={5000} />
            <div className="app-container">
                <h1 className="main-heading">Tender Management System</h1>
                <div className="nav-box">
                    <nav className="navigation">
                        <Link to="/" className="nav-link">Home</Link>
                        <Link to="/bidder" className="nav-link">Bidder Page</Link>
                        <Link to="/owner" className="nav-link">Owner Page</Link>
                    </nav>
                </div>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/bidder" element={<BidderPage account={account} />} />
                    <Route path="/owner" element={<OwnerPage account={account} />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;
