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