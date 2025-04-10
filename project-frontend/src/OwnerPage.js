import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import ProcurementContract from './ProcurementContract.json';
import ProcurementFactory from './ProcurementFactory.json';

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

        setLoading(true);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        try {
            const instance = new ethers.Contract(contractAddress, ProcurementContract.abi, signer);
            setContract(instance);

            const isOwner = await fetchContractOwner(instance);
            if (!isOwner) {
                setLoading(false);
                return;
            }

            await fetchBiddingEndTime(instance);
            await fetchWhitelistedAddresses(instance);
            await fetchBids(instance);
        } catch (error) {
            console.error("Error fetching contract data:", error);
            toast.error("Failed to load contract data. Please check the contract address.");
        } finally {
            setLoading(false);
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
        setLoading(true);
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
            fetchDeployedContracts(factoryContract);
        } catch (error) {
            console.error("Error creating contract:", error);
            toast.update(toastId, {
                render: "Failed to create contract. Please try again.",
                type: "error",
                isLoading: false,
                autoClose: 5000,
            });
        } finally {
            setLoading(false);
        }
    };

    const setBidDuration = async () => {
        if (!contract || !duration) {
            toast.error("Please load the contract and enter a valid duration.");
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Setting bid duration...");
        try {
            const tx = await contract.setBidDuration(duration);
            await tx.wait();

            toast.update(toastId, {
                render: "Bid duration set successfully!",
                type: "success",
                isLoading: false,
                autoClose: 5000,
            });
            
            await fetchBiddingEndTime(contract);
        } catch (error) {
            console.error("Error setting bid duration:", error);
            toast.update(toastId, {
                render: "Failed to set bid duration. Please try again.",
                type: "error",
                isLoading: false,
                autoClose: 5000,
            });
        } finally {
            setLoading(false);
        }
    };

    const addToWhitelist = async () => {
        if (!contract || !whitelistAddress) {
            toast.error("Please load the contract and enter a valid address.");
            return;
        }

        setLoading(true);
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

            await fetchWhitelistedAddresses(contract);
            setWhitelistAddress('');
        } catch (error) {
            console.error("Error adding to whitelist:", error);
            toast.update(toastId, {
                render: "Failed to whitelist address. Please try again.",
                type: "error",
                isLoading: false,
                autoClose: 5000,
            });
        } finally {
            setLoading(false);
        }
    };

    const removeFromWhitelist = async () => {
        if (!contract || !removeAddress) {
            toast.error("Please load the contract and enter a valid address.");
            return;
        }
    
        setLoading(true);
        const toastId = toast.loading("Removing from whitelist...");
        try {
            const tx = await contract.removeWhitelistBidder(removeAddress);
            await tx.wait();
    
            toast.update(toastId, {
                render: "Address removed from whitelist successfully!",
                type: "success",
                isLoading: false,
                autoClose: 5000,
            });
    
            await fetchWhitelistedAddresses(contract);
            setRemoveAddress('');
        } catch (error) {
            console.error("Error removing from whitelist:", error);
            toast.update(toastId, {
                render: `Failed to remove address from whitelist: ${error.message}`,
                type: "error",
                isLoading: false,
                autoClose: 5000,
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchWhitelistedAddresses = async (contractInstance = contract) => {
        if (!contractInstance) return;

        try {
            const addresses = await contractInstance.getWhitelist();
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

        setLoading(true);
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

            await fetchBids();
            await fetchBiddingEndTime(contract);
        } catch (error) {
            console.error("Error ending bidding:", error);
            toast.update(toastId, {
                render: "Failed to end bidding. Please try again.",
                type: "error",
                isLoading: false,
                autoClose: 5000,
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchBids = async (contractInstance = contract) => {
        if (!contractInstance) return;
    
        try {
            const [encryptedBids, encryptedAddresses] = await contractInstance.getBids();
            const currentBids = [];
    
            for (let i = 0; i < encryptedBids.length; i++) {
                const encryptedBid = encryptedBids[i];
                const encryptedAddress = encryptedAddresses[i];
    
                if (!encryptedBid || !encryptedAddress) {
                    continue;
                }
    
                const bidBytes = Uint8Array.from(encryptedBid.slice(2).match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
                const bidAmount = new TextDecoder().decode(bidBytes).trim();
    
                const addressBytes = Uint8Array.from(encryptedAddress.slice(2).match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
                const addressHex = `0x${Array.from(addressBytes).map(byte => ('0' + byte.toString(16)).slice(-2)).join('')}`;
    
                const formattedBid = `Address: ${addressHex}, Amount: ${bidAmount}`;
                currentBids.push(formattedBid);
            }
    
            setBids(currentBids);
        } catch (error) {
            console.error("Error fetching bids:", error);
            toast.error("Failed to fetch bids.");
        }
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

    const shortenAddress = (address) => {
        if (!address) return "";
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 bg-indigo-700 text-white">
                <h1 className="text-2xl font-bold">Owner Dashboard</h1>
                <p className="text-indigo-200 mt-1">Manage your procurement contracts</p>
            </div>
            
            <div className="p-6">
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contract Address
                        </label>
                        <input
                            type="text"
                            placeholder="Contract Address"
                            value={contractAddress}
                            onChange={(e) => setContractAddress(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex gap-2 items-end">
                        <button 
                            onClick={fetchContract} 
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Load Contract'}
                        </button>
                        <button 
                            onClick={createContract} 
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Contract'}
                        </button>
                    </div>
                </div>

                {contract && (
                    <div className="space-y-8">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Contract Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-3 rounded border border-gray-200">
                                    <p className="text-xs text-gray-500">Owner</p>
                                    <p className="text-sm font-medium truncate" title={contractOwner}>
                                        {contractOwner ? shortenAddress(contractOwner) : 'N/A'}
                                    </p>
                                </div>
                                <div className="bg-white p-3 rounded border border-gray-200">
                                    <p className="text-xs text-gray-500">Bidding Ends In</p>
                                    <p className="text-sm font-medium text-indigo-600">
                                        {biddingEndTime || '00:00:00'}
                                    </p>
                                </div>
                                <div className="bg-white p-3 rounded border border-gray-200">
                                    <p className="text-xs text-gray-500">Lowest Bid</p>
                                    <p className="text-sm font-medium">
                                        {getLowestBid().amount !== "N/A" ? 
                                            `$${getLowestBid().amount} by ${shortenAddress(getLowestBid().address)}` : 
                                            'No bids yet'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Bid Duration</h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Duration in seconds"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button 
                                        onClick={setBidDuration} 
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        disabled={loading}
                                    >
                                        Set Duration
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Bid Management</h3>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={fetchBids} 
                                        className="flex-1 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                    >
                                        Refresh Bids
                                    </button>
                                    <button 
                                        onClick={endBidding} 
                                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                        disabled={loading}
                                    >
                                        End Bidding
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Whitelist Management</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Add to Whitelist
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Bidder Address"
                                                value={whitelistAddress}
                                                onChange={(e) => setWhitelistAddress(e.target.value)}
                                                className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <button 
                                                onClick={addToWhitelist} 
                                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                                disabled={loading}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Remove from Whitelist
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Bidder Address"
                                                value={removeAddress}
                                                onChange={(e) => setRemoveAddress(e.target.value)}
                                                className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <button 
                                                onClick={removeFromWhitelist} 
                                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                                disabled={loading}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Whitelisted Addresses</h3>
                                {whitelistedAddresses.length > 0 ? (
                                    <div className="max-h-40 overflow-y-auto bg-gray-50 rounded border border-gray-200">
                                        <ul className="divide-y divide-gray-200">
                                            {whitelistedAddresses.map((address, index) => (
                                                <li key={index} className="px-4 py-2 hover:bg-gray-100 truncate" title={address}>
                                                    {address}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">No addresses whitelisted yet</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Submitted Bids</h3>
                            {bids.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-300">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Bidder Address</th>
                                                <th scope="col" className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900">Bid Amount (USD)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {bids.map((bid, index) => {
                                                const [address, amount] = bid.split(', Amount: ');
                                                return (
                                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                        <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 truncate" title={address.replace('Address: ', '')}>
                                                            {address.replace('Address: ', '')}
                                                        </td>
                                                        <td className="py-4 px-3 text-sm text-gray-500">
                                                            ${amount}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">No bids submitted yet</p>
                            )}
                        </div>
                    </div>
                )}
                
                {!contract && (
                    <div className="bg-gray-50 p-8 rounded-lg text-center border border-gray-200">
                        <p className="text-lg text-gray-600">
                            Load an existing contract or create a new one to get started
                        </p>
                    </div>
                )}
                
                <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Your Deployed Contracts</h3>
                    {deployedContracts.length > 0 ? (
                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 max-h-60 overflow-y-auto">
                            <ul className="divide-y divide-gray-200">
                                {deployedContracts.map((addr, index) => (
                                    <li 
                                        key={index} 
                                        className="py-3 flex items-center justify-between hover:bg-gray-100 px-3 rounded cursor-pointer"
                                        onClick={() => setContractAddress(addr)}
                                    >
                                        <span className="text-sm font-medium text-gray-900 truncate" title={addr}>
                                            {addr}
                                        </span>
                                        <button 
                                            className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setContractAddress(addr);
                                                fetchContract();
                                            }}
                                        >
                                            Load
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No contracts deployed yet</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OwnerPage;