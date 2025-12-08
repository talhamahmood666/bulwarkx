use anchor_lang::prelude::*;

declare_id!("BulwarkXEscrow11111111111111111111111111111111");

#[program]
pub mod bulwarkx_escrow {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, merchant: Pubkey, arbiter: Pubkey, amount: u64) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.payer = *ctx.accounts.payer.key;
        escrow.merchant = merchant;
        escrow.arbiter = arbiter;
        escrow.amount = amount;
        escrow.status = EscrowStatus::Pending as u8;
        Ok(())
    }

    pub fn release(ctx: Context<Settle>) -> Result<()> {
        ctx.accounts.escrow.status = EscrowStatus::Released as u8;
        Ok(())
    }

    pub fn refund(ctx: Context<Settle>) -> Result<()> {
        ctx.accounts.escrow.status = EscrowStatus::Refunded as u8;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = payer, space = 8 + Escrow::LEN)]
    pub escrow: Account<'info, Escrow>;
    #[account(mut)]
    pub payer: Signer<'info>;
    pub system_program: Program<'info, System>;
}

#[derive(Accounts)]
pub struct Settle<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>;
}

#[account]
pub struct Escrow {
    pub payer: Pubkey;
    pub merchant: Pubkey;
    pub arbiter: Pubkey;
    pub amount: u64;
    pub status: u8;
}

impl Escrow {
    pub const LEN: usize = 32 + 32 + 32 + 8 + 1;
}

#[repr(u8)]
pub enum EscrowStatus {
    Pending = 0,
    Released = 1,
    Refunded = 2,
}
