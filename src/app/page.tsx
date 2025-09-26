'use client'; // Required for client-side hooks like useAccount

import HomeContent from "@/components/ui/HomeContent";
import { useAccount } from "wagmi"; // Import the wagmi hook 

export default function Home() {
    const {isConnected} = useAccount(); // Example usage of wagmi hook
    
    return (
        <main className="p-4">
            {/* The Header is already handled by layout.tsx */}
            {isConnected ? (
                <div>
                    <HomeContent />
                </div> 
            ) : (
                <div className="justify-center text-center text-zinc-800">
                    Please connect a wallet...
                </div>
            )}
        </main>
    )
}
