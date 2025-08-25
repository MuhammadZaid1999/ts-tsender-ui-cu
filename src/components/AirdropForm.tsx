"use client"; 

import { useState } from "react";
import InputField from "@/components/ui/InputField";

export default function AirdropForm() {
    const [tokenAddress, setTokenAddress] = useState<string>("");
    const [recipients, setRecipients] = useState<string>(""); 
    const [amounts, setAmounts] = useState<number>(0); 

    async function handleSubmit() {
        console.log("Token Address:", tokenAddress);
        console.log("Recipients:", recipients);
        console.log("Amounts:", amounts);
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