use anchor_lang::prelude::*;

declare_id!("BulwarkXEscrow1111111111111111111111111111111");

#[program]
pub mod bulwarkx_escrow {
    use super::*;

    pub fn create_escrow(ctx: Context<CreateEscrow>, amount: u64, auto_release_at: i64) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.payer = ctx.accounts.payer.key();
        escrow.payee = ctx.accounts.payee.key();
        escrow.arbiter = ctx.accounts.arbiter.key();
        escrow.amount = amount;
        escrow.auto_release_at = auto_release_at;
        escrow.status = EscrowStatus::Funded;
        Ok(())
    }

    pub fn release_escrow(_ctx: Context<UpdateEscrowStatus>) -> Result<()> {
        // TODO: implement token transfers using anchor_spl::token
        Ok(())
    }

    pub fn refund_escrow(_ctx: Context<UpdateEscrowStatus>) -> Result<()> {
        // TODO: implement token transfers using anchor_spl::token
        Ok(())
    }
}

#[account]
pub struct Escrow {
    pub payer: Pubkey,
    pub payee: Pubkey,
    pub arbiter: Pubkey,
    pub amount: u64,
    pub auto_release_at: i64,
    pub status: EscrowStatus,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EscrowStatus {
    Uninitialized,
    Funded,
    Released,
    Refunded,
    Disputed,
}

#[derive(Accounts)]
pub struct CreateEscrow<'info> {
    #[account(init, payer = payer, space = 8 + 32*3 + 8 + 8 + 1)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: payee is an external account
    pub payee: UncheckedAccount<'info>,
    /// CHECK: arbiter is an external account
    pub arbiter: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateEscrowStatus<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,
    pub arbiter: Signer<'info>,
}
