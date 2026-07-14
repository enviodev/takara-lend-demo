import { indexer } from "envio";
import { Token, TokenAccount, Approval } from "envio";

const tokenAccountId = (tokenAddress: string, accountAddress: string) =>
  `${tokenAddress}-${accountAddress}`;
const approvalId = (tokenAddress: string, owner: string, spender: string) =>
  `${tokenAddress}-${owner}-${spender}`;

indexer.onEvent(
  { contract: "TERC20Delegator", event: "Approval" },
  async ({ event, context }) => {
  const tokenAddress = event.srcAddress.toLowerCase();
  const owner = event.params.owner.toString();
  const spender = event.params.spender.toString();
  const amount = event.params.amount;

  await context.Token.getOrCreate({ id: tokenAddress });

  let ownerAccount = await context.Account.get(owner);
  if (ownerAccount === undefined) {
    context.Account.set({ id: owner });
  }

  let spenderAccount = await context.Account.get(spender);
  if (spenderAccount === undefined) {
    context.Account.set({ id: spender });
  }

  const approval: Approval = {
    id: approvalId(tokenAddress, owner, spender),
    token_id: tokenAddress,
    amount,
    owner_id: owner,
    spender_id: spender,
  };
  context.Approval.set(approval);
}
);

indexer.onEvent(
  { contract: "TERC20Delegator", event: "Transfer" },
  async ({ event, context }) => {
  const tokenAddress = event.srcAddress.toLowerCase();
  const from = event.params.from.toString();
  const to = event.params.to.toString();
  const amount = event.params.amount;

  await context.Token.getOrCreate({ id: tokenAddress });

  const fromTokenAccountId = tokenAccountId(tokenAddress, from);
  let fromTokenAccount = await context.TokenAccount.get(fromTokenAccountId);

  if (fromTokenAccount === undefined) {
    context.TokenAccount.set({
      id: fromTokenAccountId,
      token_id: tokenAddress,
      account_id: from,
      balance: 0n - amount,
    });
  } else {
    context.TokenAccount.set({
      ...fromTokenAccount,
      balance: fromTokenAccount.balance - amount,
    });
  }

  let fromAccount = await context.Account.get(from);
  if (fromAccount === undefined) {
    context.Account.set({ id: from });
  }

  const toTokenAccountId = tokenAccountId(tokenAddress, to);
  let toTokenAccount = await context.TokenAccount.get(toTokenAccountId);

  if (toTokenAccount === undefined) {
    context.TokenAccount.set({
      id: toTokenAccountId,
      token_id: tokenAddress,
      account_id: to,
      balance: amount,
    });
  } else {
    context.TokenAccount.set({
      ...toTokenAccount,
      balance: toTokenAccount.balance + amount,
    });
  }

  let toAccount = await context.Account.get(to);
  if (toAccount === undefined) {
    context.Account.set({ id: to });
  }
}
);
