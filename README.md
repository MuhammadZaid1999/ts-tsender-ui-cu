### Smart Contract Airdrop Function
function airdropERC20(
    address tokenAddress,          // The address of the ERC20 token
    address[] calldata recipients, // Addresses to receive the tokens
    uint256[] calldata amounts,    // Amounts each recipient gets
    uint256 totalAmount          // Sum of all amounts (for verification)
) external {
    // ... implementation details transferring tokens ...
}
•	recipients = [address_A, address_B]
•	amounts = [50, 150]


### 1. Create a basic React/Next.js application.
### 2. Implemet a Wallet Connection.
### 3. Implement the airdropERC20 interaction.
### 4. Deploy to Fleek 