"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import config from "@/rainbowKitConfig";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {

    // Hydration safety check: ensure component mounts on client before rendering children
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>
                    {/* Only render children after client-side mounting */}
                    {mounted ? children : null}
                </RainbowKitProvider>
            </QueryClientProvider>    
        </WagmiProvider>
    );
}