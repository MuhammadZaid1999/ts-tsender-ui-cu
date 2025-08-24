import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Home() {
    return (
        <main style={{ padding: "2rem" }}>
            <div style={{display: "flex", justifyContent:"flex-end", marginBottom:"1rem"}}>
                <ConnectButton/>
            </div>
            <h1> Hi </h1>
        </main>
    );
}
