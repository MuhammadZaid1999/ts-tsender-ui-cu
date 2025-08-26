interface ContractsConfig {
    [chainId: number]: {
        tsender: string,
    }
};

export const chainsToTsSender: ContractsConfig = {
    31337: {
        tsender: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    },
    1: {
        tsender: ""
    }
};

export const erc20Abi = [
    { constant: true, inputs: [{ name: "_owner", type: "address" }, { name: "_spender", type: "address" }], name: "allowance", outputs: [{ name: "remaining", type: "uint256" }], type: "function" },
    { constant: false, inputs: [{ name: "_spender", type: "address" }, { name: "_value", type: "uint256" }], name: "approve", outputs: [{ name: "success", type: "bool" }], type: "function" },
]; 

export const tsenderAbi = [
  { type: "function", name: "airdropERC20", inputs: [/*...*/], outputs: [], stateMutability: "payable" },
] 
