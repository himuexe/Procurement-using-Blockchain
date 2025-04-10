import React, { useState } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import ProcurementContract from './ProcurementContract.json';

const BidderPage = ({ account }) => {
    const [contractAddress, setContractAddress] = useState('');
    const [contract, setContract] = useState(null);
    const [isWhitelisted, setIsWhitelisted] = useState(false);
    const [durationLeft, setDurationLeft] = useState('');
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
            await getDurationLeft(instance);
            await checkContractStatus(instance);
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
            
            setDurationLeft(formatDuration(secondsLeft));
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
    
        const bidInString = bidAmount.toString();
        const encryptedBid = new TextEncoder().encode(bidInString);
    
        const toastId = toast.loading("Submitting bid...");
        try {
            const tx = await contract.submitBid(encryptedBid);
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
        <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 bg-blue-700 rounded-t-lg">
                <h2 className="text-2xl font-bold text-white">Bidder Portal</h2>
            </div>
            
            <div className="p-6">
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contract Address</label>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Enter procurement contract address"
                            value={contractAddress}
                            onChange={(e) => setContractAddress(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button 
                            onClick={fetchContract} 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition-colors"
                        >
                            Load Contract
                        </button>
                    </div>
                </div>

                {contract && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                <p className="text-sm text-gray-500 mb-1">Whitelisted Status</p>
                                <div className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full mr-2 ${isWhitelisted ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <p className="font-medium">{isWhitelisted ? "Whitelisted" : "Not Whitelisted"}</p>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                <p className="text-sm text-gray-500 mb-1">Owner Address</p>
                                <p className="font-medium truncate">{ownerAddress || 'N/A'}</p>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                <p className="text-sm text-gray-500 mb-1">Bidding Time Left</p>
                                <p className={`font-medium ${durationLeft === 'Expired' || durationLeft === '0h 0m 0s' ? 'text-red-600' : 'text-green-600'}`}>
                                    {durationLeft || 'Expired'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <button 
                                    onClick={checkIfWhitelisted} 
                                    className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium py-3 px-4 rounded-md transition-colors"
                                >
                                    Check Whitelisted Status
                                </button>
                            </div>
                            
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Your Bid</h3>
                                
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Bid Amount (USD)</label>
                                    <input
                                        type="text"
                                        placeholder="Enter your bid amount"
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                
                                <button 
                                    onClick={submitBid}
                                    disabled={!isActive || !isWhitelisted} 
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md shadow-sm transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    {!isActive ? "Bidding Closed" : !isWhitelisted ? "Not Whitelisted" : "Submit Bid"}
                                </button>
                                
                                {!isWhitelisted && (
                                    <p className="mt-2 text-sm text-red-600">
                                        You need to be whitelisted by the contract owner to submit a bid.
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                )}
                
                {!contract && (
                    <div className="bg-blue-50 p-6 rounded-lg text-center">
                        <p className="text-blue-700">
                            Load a procurement contract to place your bid
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BidderPage;