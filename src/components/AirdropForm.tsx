"use client";

import { useState, useMemo, useEffect } from "react";
import InputField from "@/components/ui/InputField";
import { chainsToTsSender, erc20Abi, tsenderAbi } from "@/constants";
import { useChainId, useConfig, useAccount, useReadContracts } from "wagmi";
import { readContract, waitForTransactionReceipt } from "@wagmi/core";
import { calculateTotal } from '@/utils'; // Import using the barrel file path
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CgSpinner } from "react-icons/cg"

export default function AirdropForm() {
    const [tokenAddress, setTokenAddress] = useState<string>("");
    const [recipients, setRecipients] = useState<string>("");
    const [amounts, setAmounts] = useState<string>("");

    // Get dynamic data using wagmi hooks
    const account = useAccount();
    const chainId = useChainId();
    const config = useConfig(); // Required for core actions like readContract
    const { data: hash, isPending, error, writeContractAsync } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed, isError } = useWaitForTransactionReceipt({
        hash,
        confirmations: 1,
    });
    const { data: tokenDetails, isLoading: isLoadingTokenDetails } = useReadContracts({
        contracts: [
            {
                abi: erc20Abi,
                address: tokenAddress as `0x${string}`,
                functionName: "decimals",
            },
            {
                abi: erc20Abi,
                address: tokenAddress as `0x${string}`,
                functionName: "name",
            },
            {
                abi: erc20Abi,
                address: tokenAddress as `0x${string}`,
                functionName: "symbol"
            },
            {
                abi: erc20Abi,
                address: tokenAddress as `0x${string}`,
                functionName: "balanceOf",
                args: [account.address],
            },
        ],
    })

    // Calculate the total only when the 'amounts' string changes
    const totalAmountNeeded: number = useMemo(() => {
        // We'll define the calculation logic in a separate function
        return calculateTotal(amounts);
    }, [amounts]); // Dependency array: recalculate only if 'amounts' changes

    async function handleSubmit() {
        console.log("Token Address:", tokenAddress);
        console.log("Recipients:", recipients);
        console.log("Amounts:", amounts);

        const tSenderAddress = chainsToTsSender[chainId]?.tsender;
        console.log("Current Chain ID:", chainId);
        console.log("TSender Address for this chain:", tSenderAddress);

        if (!account.address) {
            alert("Please connect your wallet.");
            return;
        }

        if (!tSenderAddress) {
            alert("TSender contract not found for the connected network. Please switch networks.");
            return;
        }

        if (!tokenAddress || !/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
            alert("Please enter a valid ERC20 token address (0x...).");
            return;
        }

        // --- Step 1: Check Allowance ---
        try {
            // Using 'as `0x${string}`' for type assertion required by wagmi/viem
            const approvedAmount = await getAppprovedAmount(
                tSenderAddress as `0x${string}`,
                tokenAddress as `0x${string}`,
                account.address
            )
            console.log(`Current allowance: ${approvedAmount}`);

            // Conditional check
            if (approvedAmount < totalAmountNeeded) {
                // Need to perform an approve transaction
                try {
                    console.log(`Approval needed: Current ${approvedAmount}, Required ${totalAmountNeeded}`);
                    // Initiate Approve Transaction
                    const approvalHash = await writeContractAsync({
                        abi: erc20Abi,
                        address: tokenAddress as `0x${string}`,
                        functionName: 'approve',
                        args: [tSenderAddress as `0x${string}`, BigInt(totalAmountNeeded)], // Spender, Amount
                    });
                    console.log("Approval transaction hash:", approvalHash);

                    console.log("Waiting for approval confirmation...");
                    const approvalReceipt = await waitForTransactionReceipt(config, {
                        hash: approvalHash,
                    });
                    console.log("Approval confirmed:", approvalReceipt);

                    // Optional: Check receipt status for success
                    if (approvalReceipt.status === 'success') {
                        console.log("Approval successful, proceeding to airdrop.");
                        await executeAirdrop(tSenderAddress as `0x${string}`); // Call airdrop AFTER successful approval
                    } else {
                        console.error("Approval transaction failed.");
                        // Handle UI feedback
                    }

                } catch (err) {
                    console.error("Approval failed:", err);
                    // Handle UI feedback for error
                    return; // Stop the process if approval fails
                }
            } else {
                console.log(`Sufficient allowance: ${approvedAmount}`);
                await executeAirdrop(tSenderAddress as `0x${string}`); // Call airdrop directly
            }

        } catch (error) {
            console.error("Error during submission process:", error);
            alert("An error occurred. Check the console for details.");
        }
    }

    async function getAppprovedAmount(
        spenderAddress: `0x${string}`,
        erc20TokenAddress: `0x${string}`,
        ownerAddress: `0x${string}`
    ): Promise<bigint> {
        console.log(`Checking allowance for token ${erc20TokenAddress}`);
        console.log(`Owner: ${ownerAddress}`);
        console.log(`Spender: ${spenderAddress}`);

        try {
            const allowance = await readContract(config, {
                abi: erc20Abi,
                address: erc20TokenAddress,       // The address of the ERC20 token contract
                functionName: 'allowance',
                args: [ownerAddress, spenderAddress], // Arguments: owner, spender
            });
            console.log("Raw allowance response:", allowance);

            return allowance as bigint;

        } catch (error) {
            console.error("Error fetching allowance:", error);
            // Rethrow or handle error appropriately
            throw new Error("Failed to fetch token allowance:", error as Error);
        }
    }

    const executeAirdrop = async (tSenderAddress: `0x${string}`) => {
        try {
            console.log("Executing airdropERC20...");
            // Prepare arguments - requires parsing user input
            const recipientAddresses = recipients // Assuming 'recipients' is a string like "addr1, addr2\naddr3"
                .split(/[, \n]+/) // Split by commas, spaces, or newlines
                .map(addr => addr.trim()) // Remove extra whitespace
                .filter(addr => addr !== "") // Remove empty entries
                .map(addr => addr as `0x${string}`); // Type assertion for wagmi

            const transferAmounts = amounts
                .split(/[, \n]+/)
                .map(amt => amt.trim())
                .filter(amt => amt !== "")
                .map(amt => BigInt(parseFloat(amt))); // Convert to BigInt

            if (recipientAddresses.length !== transferAmounts.length) {
                throw new Error("Recipients and amounts count do not match.");
            }

            // Initiate Airdrop Transaction
            const airdropHash = await writeContractAsync({
                abi: tsenderAbi,
                address: tSenderAddress,
                functionName: 'airdropERC20',
                args: [
                    tokenAddress as `0x${string}`, // 1. Token being sent
                    recipientAddresses,  // 2. Array of recipient addresses
                    transferAmounts,  // 3. Array of amounts to send
                    BigInt(totalAmountNeeded)
                ],
            });
            console.log("Airdrop transaction hash:", airdropHash);

            // Optional: Wait for airdrop confirmation if needed for further UI updates
            console.log("Waiting for airdrop confirmation...");
            const airdropReceipt = await waitForTransactionReceipt(config, {
                hash: airdropHash
            });
            console.log("Airdrop confirmed:", airdropReceipt);
            // Update UI based on success/failure

        } catch (err) {
            console.error("Airdrop failed:", err);
            // Handle UI feedback for error
        }
    }

    function getButtonContent() {
        if (isPending) {
            return (
                <div className="flex items-center justify-center gap-2 w-full">
                    <CgSpinner className="animate-spin" size={20} />
                    <span>Confirming in wallet...</span>
                </div>
            )
        }
        if (isConfirming) {
            return (
                <div className="flex items-center justify-center gap-2 w-full">
                    <CgSpinner className="animate-spin" size={20} />
                    <span>Sending transaction...</span>
                </div>
            )
        }
        if (error || isError) {
            return (
                <div className="flex items-center justify-center gap-2 w-full">
                    <span>{"Error occurred."}</span>
                </div>
            )
        }
        if (isConfirmed) {
            return <span>Transaction Confirmed!</span>
        }

        // Default button text
        return "Send Tokens";
    }

    // Retrieve data on component mount
    useEffect(() => {
        const savedAddress = localStorage.getItem("tokenAddress");
        const savedRecipients = localStorage.getItem("recipients");
        const savedAmounts = localStorage.getItem("amounts");
        if(savedAddress) setTokenAddress(savedAddress);
        if(savedRecipients) setRecipients(savedRecipients);
        if(savedAmounts) setAmounts(savedAmounts);
    },[])

    useEffect(() => {
        if(tokenAddress) localStorage.setItem("tokenAddress", tokenAddress);
    },[tokenAddress])

    useEffect(() => {
        if(recipients) localStorage.setItem("recipients", recipients);
    },[recipients])

    useEffect(() => {
        if(amounts) localStorage.setItem("amounts", amounts);
    },[amounts])

    return (
        <div className="p-4-space-y-4 gap-6">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <InputField
                    label="Token Address"
                    placeholder="Enter token contract address (e.g., 0x...)"
                    value={tokenAddress}
                    type="text"
                    onChange={e => setTokenAddress(e.target.value)}
                />
                <br />

                <InputField
                    label="Recipients"
                    placeholder="0x123..., 0x456..."
                    value={recipients}
                    type="text"
                    onChange={e => setRecipients(e.target.value)}
                    large={true} // Example of another prop
                />
                <br />

                <InputField
                    label="Amounts"
                    placeholder="Enter amounts, separated by commas or newlines..."
                    value={amounts}
                    type="number"
                    onChange={e => setAmounts(e.target.value)}
                    large={true}
                />
                <br />

                <div className="bg-white border border-zinc-300 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-zinc-900 mb-3">Transaction Details</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-600">Token Name:</span>
                            <span className="font-mono text-zinc-900">
                                {tokenDetails?.[1]?.result as string}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-600">Amount (wei):</span>
                            <span className="font-mono text-zinc-900">{totalAmountNeeded}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-600">Amount (tokens):</span>
                            <span className="font-mono text-zinc-900">
                                {totalAmountNeeded / Math.pow(10, tokenDetails?.[0]?.result as number)} {tokenDetails?.[2]?.result as string}
                            </span>
                        </div>
                    </div>
                </div>
                <br/>

                <button type="submit" disabled={isPending || isConfirming} className="cursor-pointer py-3 px-3 rounded-[9px] text-white transition-colors font-semibold relative border bg-blue-500 hover:bg-blue-600 border-blue-500">
                    {getButtonContent()}
                </button>
            </form>
        </div>
    )

}