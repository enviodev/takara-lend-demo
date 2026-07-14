import assert from "assert";
import { TestHelpers, TokenAccount } from "envio";
const { MockDb, TERC20Delegator, Addresses } = TestHelpers;

describe("Transfers", () => {
  it("Transfer subtracts from sender TokenAccount balance and adds to receiver TokenAccount balance", async () => {
    const mockDbEmpty = MockDb.createMockDb();

    const tokenAddress = Addresses.defaultAddress;
    const userAddress1 = Addresses.mockAddresses[0];
    const userAddress2 = Addresses.mockAddresses[1];

    const tokenAccount1Id = `${tokenAddress}-${userAddress1}`;
    const mockTokenAccount: TokenAccount = {
      id: tokenAccount1Id,
      token_id: tokenAddress,
      account_id: userAddress1,
      balance: 5n,
    };

    const mockDb = mockDbEmpty.entities.TokenAccount.set(mockTokenAccount);

    const mockTransfer = TERC20Delegator.Transfer.createMockEvent({
      from: userAddress1,
      to: userAddress2,
      amount: 3n,
      mockEventData: { srcAddress: tokenAddress },
    });

    const mockDbAfterTransfer = await TERC20Delegator.Transfer.processEvent({
      event: mockTransfer,
      mockDb,
    });

    const account1TokenBalance =
      mockDbAfterTransfer.entities.TokenAccount.get(tokenAccount1Id)?.balance;

    assert.equal(
      2n,
      account1TokenBalance,
      "Should have subtracted transfer amount 3 from userAddress1 balance 5",
    );

    const tokenAccount2Id = `${tokenAddress}-${userAddress2}`;
    const account2TokenBalance =
      mockDbAfterTransfer.entities.TokenAccount.get(tokenAccount2Id)?.balance;

    assert.equal(
      3n,
      account2TokenBalance,
      "Should have added transfer amount 3 to userAddress2 balance 0",
    );
  });
});
