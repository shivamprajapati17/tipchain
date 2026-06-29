import * as anchor from "@coral-xyz/anchor";
import { Program, Idl } from "@coral-xyz/anchor";
import { expect } from "chai";

// ─── Manual IDL ─────────────────────────────────────────────────────────────

const IDL: Idl = {
  version: "0.1.0",
  name: "tipchain",
  instructions: [
    {
      name: "createCreator",
      accounts: [
        { name: "creatorAccount", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "username", type: "string" }],
    },
    {
      name: "sendSolTip",
      accounts: [
        { name: "creatorAccount", isMut: true, isSigner: false },
        { name: "sender", isMut: true, isSigner: true },
        { name: "receiver", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "username", type: "string" },
        { name: "amount", type: "u64" },
      ],
    },
    {
      name: "closeCreator",
      accounts: [
        { name: "creatorAccount", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "username", type: "string" }],
    },
  ],
  accounts: [
    {
      name: "CreatorAccount",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "totalTips", type: "u64" },
          { name: "tipCount", type: "u64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: "InvalidAmount", msg: "Tip amount must be greater than zero" },
    { code: 6001, name: "Overflow", msg: "Arithmetic overflow" },
    { code: 6002, name: "InvalidReceiver", msg: "Receiver does not match creator authority" },
  ],
  metadata: {
    address: "BWVuJNwjRspZNaGN2Ym4v7xMnTvquu9M3UEBFTBvZguh",
  },
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("tipchain", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new Program(IDL as any, provider);

  const username = "testuser123";
  const username2 = "testuser456";

  function findCreatorPda(uname: string): [anchor.web3.PublicKey, number] {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("creator"),
        provider.wallet.publicKey.toBuffer(),
        Buffer.from(uname),
      ],
      program.programId
    );
  }

  it("creates a creator profile", async () => {
    const [creatorPda] = findCreatorPda(username);

    const txSig = await program.methods
      .createCreator(username)
      .accounts({
        creatorAccount: creatorPda,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("createCreator tx:", txSig);

    const account: any = await program.account.creatorAccount.fetch(creatorPda);

    expect(account.authority.toString()).to.equal(
      provider.wallet.publicKey.toString()
    );
    expect(account.totalTips.toNumber()).to.equal(0);
    expect(account.tipCount.toNumber()).to.equal(0);
  });

  it("rejects zero-amount tip", async () => {
    const [creatorPda] = findCreatorPda(username);
    const amount = new anchor.BN(0);

    try {
      await program.methods
        .sendSolTip(username, amount)
        .accounts({
          creatorAccount: creatorPda,
          sender: provider.wallet.publicKey,
          receiver: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      expect.fail("Expected error for zero-amount tip");
    } catch (err: any) {
      expect(err.message).to.contain("InvalidAmount");
    }
  });

  it("sends a SOL tip", async () => {
    const [creatorPda] = findCreatorPda(username);

    // Get initial balances
    const senderBalanceBefore = await provider.connection.getBalance(
      provider.wallet.publicKey
    );
    console.log("Balance before tip:", senderBalanceBefore);

    // Send 0.01 SOL tip
    const tipAmount = new anchor.BN(10_000_000); // 0.01 SOL

    const txSig = await program.methods
      .sendSolTip(username, tipAmount)
      .accounts({
        creatorAccount: creatorPda,
        sender: provider.wallet.publicKey,
        receiver: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("sendSolTip tx:", txSig);

    // Verify on-chain stats updated
    const account: any = await program.account.creatorAccount.fetch(creatorPda);
    expect(account.totalTips.toString()).to.equal(tipAmount.toString());
    expect(account.tipCount.toNumber()).to.equal(1);
  });

  it("accumulates multiple tips", async () => {
    const [creatorPda] = findCreatorPda(username);
    const amount = new anchor.BN(5_000_000); // 0.005 SOL

    await program.methods
      .sendSolTip(username, amount)
      .accounts({
        creatorAccount: creatorPda,
        sender: provider.wallet.publicKey,
        receiver: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const account: any = await program.account.creatorAccount.fetch(creatorPda);
    // Total should be 0.01 + 0.005 = 0.015 SOL
    expect(account.totalTips.toNumber()).to.equal(15_000_000);
    expect(account.tipCount.toNumber()).to.equal(2); // Second tip increments counter
  });

  it("creates a separate profile for another user", async () => {
    // Generate a new wallet for this test
    const otherWallet = anchor.web3.Keypair.generate();
    const connection = provider.connection;

    // Airdrop SOL to the new wallet for rent
    const airdropSig = await connection.requestAirdrop(
      otherWallet.publicKey,
      1_000_000_000 // 1 SOL
    );
    await connection.confirmTransaction(airdropSig);

    const [otherPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("creator"),
        otherWallet.publicKey.toBuffer(),
        Buffer.from(username2),
      ],
      program.programId
    );

    // Create using the other wallet as authority
    const txSig = await program.methods
      .createCreator(username2)
      .accounts({
        creatorAccount: otherPda,
        authority: otherWallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([otherWallet])
      .rpc();

    console.log("createCreator (other wallet) tx:", txSig);

    const account: any = await program.account.creatorAccount.fetch(otherPda);
    expect(account.authority.toString()).to.equal(
      otherWallet.publicKey.toString()
    );
  });

  it("closes a creator profile", async () => {
    // Close the second profile created by the other wallet
    const otherWallet = anchor.web3.Keypair.generate();
    const connection = provider.connection;

    const airdropSig = await connection.requestAirdrop(
      otherWallet.publicKey,
      1_000_000_000
    );
    await connection.confirmTransaction(airdropSig);

    const [otherPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("creator"),
        otherWallet.publicKey.toBuffer(),
        Buffer.from(username2),
      ],
      program.programId
    );

    // First create it
    await program.methods
      .createCreator(username2)
      .accounts({
        creatorAccount: otherPda,
        authority: otherWallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([otherWallet])
      .rpc();

    // Now close it
    const closeTx = await program.methods
      .closeCreator(username2)
      .accounts({
        creatorAccount: otherPda,
        authority: otherWallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([otherWallet])
      .rpc();

    console.log("closeCreator tx:", closeTx);

    // Verify the account is closed (fetching should fail)
    try {
      await program.account.creatorAccount.fetch(otherPda);
      expect.fail("Expected account to be closed");
    } catch (err: any) {
      expect(err.message).to.contain("Account does not exist");
    }
  });
});
