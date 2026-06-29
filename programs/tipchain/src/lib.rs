//! TipChain Solana Program
//!
//! On-chain creator monetization for the TipChain platform.
//!
//! ## Instructions
//!
//! - `create_creator` — Register a new creator profile on-chain
//! - `send_sol_tip` — Send a SOL tip to a creator
//! - `close_creator` — Deactivate a creator profile
//!
//! ## Seed Derivation
//!
//! Creator PDAs are derived from `seeds = [b"creator", authority_pubkey, username_bytes]`.
//! The username is part of the seed but not duplicated in account data.

use anchor_lang::prelude::*;

declare_id!("BWVuJNwjRspZNaGN2Ym4v7xMnTvquu9M3UEBFTBvZguh");

// ═══════════════════════════════════════════════════════════════════════════
// ACCOUNTS
// ═══════════════════════════════════════════════════════════════════════════

/// On-chain creator profile.
///
/// Username is embedded in the PDA seed derivation —
/// `seeds = [b"creator", authority, username_bytes]` — and is **not** stored
/// in account data, saving storage rent and stack space.
#[account]
#[derive(InitSpace)]
pub struct CreatorAccount {
    pub authority: Pubkey,       // Wallet that owns this profile
    pub total_tips: u64,      // Lifetime tips received (lamports)
    pub tip_count: u64,         // Total number of tips received
    pub bump: u8,                // PDA bump seed
}

// ═══════════════════════════════════════════════════════════════════════════
// INSTRUCTION CONTEXTS
// ═══════════════════════════════════════════════════════════════════════════

#[derive(Accounts)]
#[instruction(username: String)]
pub struct CreateCreator<'info> {
    #[account(
        init,
        seeds = [b"creator", authority.key().as_ref(), username.as_bytes()],
        bump,
        payer = authority,
        space = 8 + CreatorAccount::INIT_SPACE
    )]
    pub creator_account: Account<'info, CreatorAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(username: String)]
pub struct SendSolTip<'info> {
    #[account(
        mut,
        seeds = [b"creator", creator_account.authority.as_ref(), username.as_bytes()],
        bump = creator_account.bump,
    )]
    pub creator_account: Account<'info, CreatorAccount>,

    #[account(mut)]
    pub sender: Signer<'info>,

    /// The creator's receiving wallet — must match the creator account authority
    #[account(
        mut,
        constraint = receiver.key() == creator_account.authority @ TipChainError::InvalidReceiver,
    )]
    pub receiver: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(username: String)]
pub struct CloseCreator<'info> {
    #[account(
        mut,
        close = authority,
        seeds = [b"creator", authority.key().as_ref(), username.as_bytes()],
        bump
    )]
    pub creator_account: Account<'info, CreatorAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ═══════════════════════════════════════════════════════════════════════════
// INSTRUCTIONS
// ═══════════════════════════════════════════════════════════════════════════

#[program]
pub mod tipchain {
    use super::*;

    /// Register a new creator profile on-chain.
    #[inline(never)]
    pub fn create_creator(ctx: Context<CreateCreator>, _username: String) -> Result<()> {
        let account = &mut ctx.accounts.creator_account;
        account.authority = ctx.accounts.authority.key();
        account.total_tips = 0;
        account.tip_count = 0;
        account.bump = ctx.bumps.creator_account;

        emit!(CreatorRegistered {
            authority: account.authority,
        });

        Ok(())
    }

    /// Send a SOL tip to a creator.
    #[inline(never)]
    pub fn send_sol_tip(ctx: Context<SendSolTip>, amount: u64) -> Result<()> {
        require!(amount > 0, TipChainError::InvalidAmount);

        let account = &mut ctx.accounts.creator_account;

        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.sender.to_account_info(),
                    to: ctx.accounts.receiver.to_account_info(),
                },
            ),
            amount,
        )?;

        account.total_tips = account
            .total_tips
            .checked_add(amount)
            .ok_or(TipChainError::Overflow)?;
        account.tip_count = account
            .tip_count
            .checked_add(1)
            .ok_or(TipChainError::Overflow)?;

        emit!(TipSent {
            sender: ctx.accounts.sender.key(),
            receiver: ctx.accounts.receiver.key(),
            amount,
        });

        Ok(())
    }

    /// Close a creator account and reclaim rent.
    #[inline(never)]
    pub fn close_creator(_ctx: Context<CloseCreator>) -> Result<()> {
        emit!(CreatorClosed {
            authority: _ctx.accounts.authority.key(),
        });
        Ok(())
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════════════════

#[event]
pub struct CreatorRegistered {
    pub authority: Pubkey,
}

#[event]
pub struct TipSent {
    pub sender: Pubkey,
    pub receiver: Pubkey,
    pub amount: u64,
}

#[event]
pub struct CreatorClosed {
    pub authority: Pubkey,
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR CODES
// ═══════════════════════════════════════════════════════════════════════════

#[error_code]
pub enum TipChainError {
    #[msg("Tip amount must be greater than zero")]
    InvalidAmount,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Receiver does not match creator authority")]
    InvalidReceiver,
}
