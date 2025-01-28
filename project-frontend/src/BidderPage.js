// BidderPage.js
import React, { useState } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import ProcurementContract from './ProcurementContract.json';
import './BidderPage.css'; // Import custom styles

const BidderPage = ({ account }) => {
    const [contractAddress, setContractAddress] = useState('');
    const [contract, setContract] = useState(null);
    const [isWhitelisted, setIsWhitelisted] = useState(false);
    const [durationLeft, setDurationLeft] = useState(''); // Changed to string for formatted output
    const [bidAmount, setBidAmount] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [ownerAddress, setOwnerAddress] = useState('');

    const fetchContract = async () => {
        if (!contractAddress) {
            toast.error("Please enter a valid contract address.");
            return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const instance = new ethers.Contract(contractAddress, ProcurementContract.abi, signer);
        setContract(instance);

        try {
            const owner = await instance.owner();
            setOwnerAddress(owner);
            await getDurationLeft(instance); // Pass instance to getDurationLeft
            await checkContractStatus(instance); // Pass instance to checkContractStatus
        } catch (error) {
            console.error("Error fetching contract data:", error);
            toast.error("Failed to load contract data. Please check the contract address.");
        }
    };

    const formatDuration = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours}h ${minutes}m ${seconds}s`;
    };

    const getDurationLeft = async (contractInstance) => {
        if (!contractInstance) {
            console.error("Contract is not initialized.");
            toast.error("Contract is not loaded.");
            return;
        }
        try {
            const timeLeft = await contractInstance.getDurationLeft();
            
            // Ensure timeLeft is processed correctly
            const secondsLeft = typeof timeLeft === 'bigint' ? Number(timeLeft) : Number(timeLeft.toString());
            
            setDurationLeft(formatDuration(secondsLeft)); // Format the duration
        } catch (error) {
            console.error("Error getting duration left:", error);
            toast.error("Error getting duration left. Please ensure the contract is valid and the function is accessible.");
        }
    };
    

    const checkContractStatus = async (contractInstance) => {
        if (!contractInstance) return;
        try {
            const ended = await contractInstance.ended();
            setIsActive(!ended);
        } catch (error) {
            console.error("Error checking contract status:", error);
            toast.error("Error checking contract status");
        }
    };

    const checkIfWhitelisted = async () => {
        if (!contract) {
            toast.error("Please load the contract first.");
            return;
        }
        try {
            const whitelisted = await contract.checkIfWhitelisted(account);
            setIsWhitelisted(whitelisted);
            toast.success(whitelisted ? "You are whitelisted!" : "You are not whitelisted.");
        } catch (error) {
            console.error("Error checking whitelisted status:", error);
            toast.error("Error checking whitelisted status.");
        }
    };

    const submitBid = async () => {
        if (!contract) {
            toast.error("Please load the contract first.");
            return;
        }
        if (!bidAmount || isNaN(bidAmount) || parseFloat(bidAmount) <= 0) {
            toast.error("Please enter a valid bid amount greater than 0.");
            return;
        }
    
        // Instead of converting to wei, use the bid amount as is.
        const bidInString = bidAmount.toString(); // Ensure it's a string
    
        // Optionally encrypt the bid; ensure the encryption logic is compatible with the contract's expectations
        const encryptedBid = new TextEncoder().encode(bidInString); // Encode as a string directly
    
        const toastId = toast.loading("Submitting bid...");
        try {
            const tx = await contract.submitBid(encryptedBid); // Submit the bid using the encrypted value
            await tx.wait();
    
            toast.update(toastId, {
                render: "Bid submitted successfully!",
                type: "success",
                isLoading: false,
                autoClose: 5000,
            });
        } catch (error) {
            console.error("Error submitting bid:", error);
            toast.update(toastId, {
                render: "Failed to submit bid. Please try again.",
                type: "error",
                isLoading: false,
                autoClose: 5000,
            });
        }
    };
    
    return (
        <div className="bidder-page-container">
            <h2 className="page-title">Bidder Page</h2>
            <input
                type="text"
                placeholder="Procurement Contract Address"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                className="input-field"
            />
            <button onClick={fetchContract} className="load-contract-button">
                Load Contract
            </button>
            <div className="status-info">
                <p>Whitelisted: <span className={isWhitelisted ? "status-yes" : "status-no"}>{isWhitelisted ? "Yes" : "No"}</span></p>
                <p>Owner Address: {ownerAddress || 'N/A'}</p>
                <p>Duration Left: {durationLeft || 'Expired'}</p> {/* Updated to show formatted duration */}
            </div>
            <button onClick={checkIfWhitelisted} className="check-whitelist-button">
                Check Whitelisted Status
            </button>
            <input
                type="text"
                placeholder="Bid Amount (USD)"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="input-field"
            />
            <button onClick={submitBid} className="submit-bid-button">
                Submit Bid
            </button>
        </div>
    );
};

export default BidderPage;
