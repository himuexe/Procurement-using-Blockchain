import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import ProcurementContract from './ProcurementContract.json';
import ProcurementFactory from './ProcurementFactory.json';
import './OwnerPage.css';

const OwnerPage = ({ account }) => {
    const [factoryContract, setFactoryContract] = useState(null);
    const [contractAddress, setContractAddress] = useState('');
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(false);
    const [duration, setDuration] = useState('');
    const [deployedContracts, setDeployedContracts] = useState([]);
    const [whitelistAddress, setWhitelistAddress] = useState('');
    const [contractOwner, setContractOwner] = useState(null);
    const [biddingEndTime, setBiddingEndTime] = useState(null);
    const [whitelistedAddresses, setWhitelistedAddresses] = useState([]);
    const [removeAddress, setRemoveAddress] = useState('');
    const [bids, setBids] = useState([]);
    const [addressNameMap, setAddressNameMap] = useState({});

    const FACTORY_ADDRESS = "0xBa691fF03DBA107CB362A124b4cE7981C4a9963D"; 

    useEffect(() => {
        const init = async () => {
            if (!window.ethereum) {
                toast.error("Please install MetaMask!");
                return;
            }
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const factory = new ethers.Contract(FACTORY_ADDRESS, ProcurementFactory.abi, signer);
            setFactoryContract(factory);

            await fetchDeployedContracts(factory);
        };
        init();
    }, [account]);

    const fetchDeployedContracts = async (factory) => {
        try {
            const contracts = await factory.getContractsByOwner(account);
            setDeployedContracts(contracts);
        } catch (error) {
            console.error("Error fetching deployed contracts:", error);
            toast.error("Failed to fetch deployed contracts.");
        }
    };

    const hexToUtf8 = (hex) => {
        if (hex.startsWith('0x')) {
            hex = hex.slice(2);
        }
        const bytes = [];
        for (let i = 0; i < hex.length; i += 2) {
            bytes.push(String.fromCharCode(parseInt(hex.substr(i, 2), 16)));
        }
        return bytes.join('');
    };

    const fetchContractOwner = async (instance) => {
        try {
            const ownerAddress = await instance.owner();
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const signerAddress = await signer.getAddress();
            setContractOwner(ownerAddress);

            if (ownerAddress.toLowerCase() !== signerAddress.toLowerCase()) {
                toast.error("You are not the contract owner.");
                return false;
            }
            return true;
        } catch (error) {
            console.error("Error fetching owner:", error);
            toast.error("Failed to fetch contract owner.");
            return false;
        }
    };

    const fetchContract = async () => {
        if (!contractAddress || !ethers.isAddress(contractAddress)) {
            toast.error("Please enter a valid contract address.");
            return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        try {
            const instance = new ethers.Contract(contractAddress, ProcurementContract.abi, signer);
            setContract(instance);

            const isOwner = await fetchContractOwner(instance);
            if (!isOwner) return;

            await fetchBiddingEndTime(instance);
            await fetchWhitelistedAddresses(instance); // Fetch whitelisted addresses on load
        } catch (error) {
            console.error("Error fetching contract data:", error);
            toast.error("Failed to load contract data. Please check the contract address.");
        }
    };

    const fetchBiddingEndTime = async (instance) => {
        try {
            const endTime = await instance.biddingEndTime();
            const endTimeNumber = Number(endTime.toString());
            const currentTimestamp = Math.floor(Date.now() / 1000);
            const remainingTime = endTimeNumber - currentTimestamp;

            if (remainingTime < 0) {
                setBiddingEndTime("00:00:00");
            } else {
                const hours = Math.floor(remainingTime / 3600);
                const minutes = Math.floor((remainingTime % 3600) / 60);
                const seconds = remainingTime % 60;
                setBiddingEndTime(`${hours}:${minutes}:${seconds}`);
            }
        } catch (error) {
            console.error("Error fetching bidding end time:", error);
            toast.error("Failed to fetch bidding end time.");
        }
    };

    const createContract = async () => {
        const toastId = toast.loading("Creating contract...");
        try {
            const tx = await factoryContract.createProcurementContract();
            await tx.wait();
            toast.update(toastId, {
                render: "Contract created successfully!",
                type: "success",
                isLoading: false,
                autoClose: 5000,
            });
            fetchDeployedContracts(factoryContract); // Fetch updated list of contracts
        } catch (error) {
            console.error("Error creating contract:", error);
            toast.update(toastId, {
                render: "Failed to create contract. Please try again.",
                type: "error",
                isLoading: false,
                autoClose: 5000,
            });
        }
    };

    const setBidDuration = async () => {
        if (!contract || !duration) {
            toast.error("Please load the contract and enter a valid duration.");
            return;
        }

        const toastId = toast.loading("Setting bid duration...");
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const latestBlock = await provider.getBlock('latest');
            const currentTimestamp = latestBlock.timestamp;

            const endTimeInSeconds = currentTimestamp + parseInt(duration);

            const tx = await contract.setBidDuration(duration);
            await tx.wait();

            toast.update(toastId, {
                render: "Bid duration set successfully!",
                type: "success",
                isLoading: false,
                autoClose: 5000,
            });
        } catch (error) {
            console.error("Error setting bid duration:", error);
            toast.update(toastId, {
                render: "Failed to set bid duration. Please try again.",
                type: "error",
                isLoading: false,
                autoClose: 5000,
            });
        }
    };

    const addToWhitelist = async () => {
        if (!contract || !whitelistAddress) {
            toast.error("Please load the contract and enter a valid address.");
            return;
        }

        const toastId = toast.loading("Adding to whitelist...");
        try {
            const tx = await contract.whitelistBidder(whitelistAddress);
            await tx.wait();
            toast.update(toastId, {
                render: "Address whitelisted successfully!",
                type: "success",
                isLoading: false,
                autoClose: 5000,
            });

            fetchWhitelistedAddresses();
        } catch (error) {
            console.error("Error adding to whitelist:", error);
            toast.update(toastId, {
                render: "Failed to whitelist address. Please try again.",
                type: "error",
                isLoading: false,
                autoClose: 5000,
            });
        }
    };

    const removeFromWhitelist = async () => {
        if (!contract || !removeAddress) {
            toast.error("Please load the contract and enter a valid address.");
            return;
        }
    
        // Check if the address is whitelisted before removing
        try {
            const isWhitelisted = await contract.isWhitelisted(removeAddress);  // assuming this function exists
            if (!isWhitelisted) {
                toast.error("The address is not whitelisted.");
                return;
            }
        } catch (error) {
            console.error("Error checking if address is whitelisted:", error);
            toast.error("Error checking address status.");
            return;
        }
    
        const toastId = toast.loading("Removing from whitelist...");
        try {
            // Ensure the function name matches your contract
            const tx = await contract.removeWhitelistBidder(removeAddress);  // Use correct function name
            await tx.wait();
    
            toast.update(toastId, {
                render: "Address removed from whitelist successfully!",
                type: "success",
                isLoading: false,
                autoClose: 5000,
            });
    
            fetchWhitelistedAddresses();  // Re-fetch the updated whitelist
        } catch (error) {
            console.error("Error removing from whitelist:", error);
            toast.update(toastId, {
                render: `Failed to remove address from whitelist: ${error.message}`,
                type: "error",
                isLoading: false,
                autoClose: 5000,
            });
        }
    };

    const fetchWhitelistedAddresses = async () => {
        if (!contract) return;

        try {
            const addresses = await contract.getWhitelist();
            setWhitelistedAddresses(addresses);
        } catch (error) {
            console.error("Error fetching whitelisted addresses:", error);
            toast.error("Failed to fetch whitelisted addresses.");
        }
    };

    const endBidding = async () => {
        if (!contract) {
            toast.error("Please load the contract to end bidding.");
            return;
        }

        const toastId = toast.loading("Ending bidding...");
        try {
            const tx = await contract.endBidding();
            await tx.wait();
            toast.update(toastId, {
                render: "Bidding ended successfully!",
                type: "success",
                isLoading: false,
                autoClose: 5000,
            });

            fetchBids(); // Update bids after ending
        } catch (error) {
            console.error("Error ending bidding:", error);
            toast.update(toastId, {
                render: "Failed to end bidding. Please try again.",
                type: "error",
                isLoading: false,
                autoClose: 5000,
            });
        }
    };

    const hexToUint8Array = (hex) => {
        const length = hex.length / 2;
        const bytes = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return bytes;
    };

    const getLowestBid = () => {
        if (bids.length === 0) return { address: "No bids yet", amount: "N/A" };
        let lowestBid = { address: "", amount: Infinity };
    
        bids.forEach((bid) => {
            const [address, amount] = bid.split(', Amount: ');
            const bidAmount = parseFloat(amount);
            if (bidAmount < lowestBid.amount) {
                lowestBid = { address: address.replace('Address: ', ''), amount: bidAmount };
            }
        });
    
        return lowestBid;
    };

    const fetchBids = async () => {
        if (!contract) {
            toast.error("Contract is not loaded.");
            return;
        }
    
        try {
            // Fetch encrypted bids and addresses
            const [encryptedBids, encryptedAddresses] = await contract.getBids();
    
            console.log("Encrypted Bids:", encryptedBids);
            console.log("Encrypted Addresses:", encryptedAddresses);
    
            const currentBids = [];
    
            for (let i = 0; i < encryptedBids.length; i++) {
                const encryptedBid = encryptedBids[i];
                const encryptedAddress = encryptedAddresses[i];
    
                // Ensure the encrypted bid and address are not empty
                if (!encryptedBid || !encryptedAddress) {
                    console.warn("Empty encrypted bid or address:", encryptedBid, encryptedAddress);
                    continue; // Skip to the next iteration
                }
    
                // Convert the encrypted bid to a Uint8Array
                const bidBytes = Uint8Array.from(encryptedBid.slice(2).match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
                // Decode the bid bytes back to a string
                const bidAmount = new TextDecoder().decode(bidBytes).trim(); // This should directly give you the string representation of the amount
    
                // Convert the address bytes to hex string
                const addressBytes = Uint8Array.from(encryptedAddress.slice(2).match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
                const addressHex = `0x${Array.from(addressBytes).map(byte => ('0' + byte.toString(16)).slice(-2)).join('')}`;
    
                // Format the bid string for display
                const formattedBid = `Address: ${addressHex}, Amount: ${bidAmount}`; // Display the raw amount as inputted
                currentBids.push(formattedBid);
            }
    
            setBids(currentBids); // Set the bids as formatted strings
        } catch (error) {
            console.error("Error fetching bids:", error);
            toast.error("Failed to fetch bids.");
        }
    };
    
    
      
    return (
        <div className="owner-page">
            <h1 className="page-heading fade-in">Owner Page</h1>
            <div className="input-container">
                <input
                    type="text"
                    placeholder="Contract Address"
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    className="input-field slide-in"
                />
                <div className="button-container">
                    <button onClick={fetchContract} className="action-button zoom-in">Load Contract</button>
                    <button onClick={createContract} className="action-button zoom-in">Create Contract</button>
                </div>
            </div>
    
            {contract && (
                <div className="contract-details">
                    <h2 className="details-heading bounce-in">Contract Details</h2>
                    <div className="contract-info">
                        <p className="contract-owner"><strong>Owner:</strong> {contractOwner}</p>
                        <p className="bidding-end-time"><strong>Bidding Ends In:</strong> {biddingEndTime}</p>
                        <p className="lowest-bid">
                        <strong>Lowest Bid:</strong> {getLowestBid().amount} by {getLowestBid().address}
                        </p>
                    </div>
    
                    <div className="action-section">
                        <input
                            type="text"
                            placeholder="Bid Duration (in seconds)"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="input-field slide-in"
                        />
                        <button onClick={setBidDuration} className="action-button zoom-in">Set Bid Duration</button>
                    </div>
    
                    <div className="action-section">
                        <input
                            type="text"
                            placeholder="Address to Whitelist"
                            value={whitelistAddress}
                            onChange={(e) => setWhitelistAddress(e.target.value)}
                            className="input-field slide-in"
                        />
                        <button onClick={addToWhitelist} className="action-button zoom-in">Add to Whitelist</button>
                    </div>
    
                    <div className="action-section">
                        <input
                            type="text"
                            placeholder="Address to Remove from Whitelist"
                            value={removeAddress}
                            onChange={(e) => setRemoveAddress(e.target.value)}
                            className="input-field slide-in"
                        />
                        <button onClick={removeFromWhitelist} className="action-button zoom-in">Remove from Whitelist</button>
                    </div>
    
                    <h3 className="list-heading highlight fade-in small-heading">Whitelisted Addresses:</h3>
                    <ul className="slide-in">
                        {whitelistedAddresses.map((address, index) => (
                            <li key={index} className="highlight-list-item">{address}</li>
                        ))}
                    </ul>
    
                    <div className="button-container" style={{ marginTop: '20px' }}>
                        <button onClick={() => fetchBids()} className="action-button check-bids-button zoom-in">Check All Bids</button>
                        <button onClick={endBidding} className="action-button end-bidding-button zoom-in">End Bidding</button>
                    </div>
    
                    <h3 className="list-heading bounce-in">Bids:</h3>
                    <table className="bids-table">
                        <thead>
                            <tr>
                                <th>Bidder Address</th>
                                <th>Bid Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bids.map((bid, index) => {
                                const [address, amount] = bid.split(', Amount: ');
                                return (
                                    <tr key={index}>
                                        <td>{address.replace('Address: ', '')}</td>
                                        <td>{amount}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
    
            <h3 className="list-heading fade-in" style={{ marginTop: '40px' }}>Deployed Contracts:</h3>
            <ul className="deployed-contracts-list">
                {deployedContracts.map((addr, index) => (
                    <li key={index} className="fade-in contract-item">
                        {addr}
                    </li>
                ))}
            </ul>
        </div>
    );
    
};    

export default OwnerPage;
