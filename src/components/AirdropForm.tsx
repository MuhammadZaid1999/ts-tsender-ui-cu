"use client"; 

import { useState } from "react";
import InputField from "@/components/ui/InputField";
import { chainsToTsSender, erc20Abi } from "@/constants";
import { useChainId, useConfig, useAccount } from "wagmi";
import { Config, readContract } from "@wagmi/core";

export default function AirdropForm() {
    const [tokenAddress, setTokenAddress] = useState<string>("");
    const [recipients, setRecipients] = useState<string>(""); 
    const [amounts, setAmounts] = useState<number>(0); 

    // Get dynamic data using wagmi hooks
    const account = useAccount();
    const chainId = useChainId();
    const config = useConfig(); // Required for core actions like readContract

    async function handleSubmit() {
        console.log("Token Address:", tokenAddress);
        console.log("Recipients:", recipients);
        console.log("Amounts:", amounts);

        const tSenderAddress = chainsToTsSender[chainId]?.tsender;
        console.log("Current Chain ID:", chainId);
        console.log("TSender Address for this chain:", tSenderAddress);

        if(!account.address) {
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
            const allowance = await readContract(config as Config, {
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

    return (
        <div className="p-4-space-y-4">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <InputField
                    label="Token Address"
                    placeholder="Enter token contract address (e.g., 0x...)"
                    value={tokenAddress}
                    type="text"
                    onChange={e => setTokenAddress(e.target.value)}
                />

                <InputField
                    label="Recipients"
                    placeholder="0x123..., 0x456..."
                    value={recipients}
                    type="text"
                    onChange={e => setRecipients(e.target.value)}
                    large={true} // Example of another prop
                />

                <InputField
                    label="Amounts"
                    placeholder="100, 200, ..."
                    value={amounts}
                    type="number"
                    onChange={e => setAmounts(Number(e.target.value))}
                    large={true}
                />

                <button type="submit">Send Tokens</button>
            </form>
        </div>
    )

}