// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title BulwarkXEscrow
 * @notice Non-custodial on-chain escrow for merchants & buyers.
 *
 * MVP goals:
 * - Create escrow for a specific merchant & buyer
 * - Lock ERC20 or native token
 * - Release funds to merchant on approval or timeout
 * - Refund to buyer if cancelled/disputed & arbiter decides
 *
 * NOTE: This is a skeleton. Fill in the core logic in a later step.
 */
contract BulwarkXEscrow {
    enum EscrowStatus {
        Uninitialized,
        Funded,
        Released,
        Refunded,
        Disputed
    }

    struct Escrow {
        address payer;        // buyer
        address payee;        // merchant
        address arbiter;      // BulwarkX or third-party
        address token;        // address(0) for native, ERC20 otherwise
        uint256 amount;
        uint64 createdAt;
        uint64 autoReleaseAt; // timestamp when merchant can auto-release
        EscrowStatus status;
    }

    mapping(bytes32 => Escrow) public escrows;

    event EscrowCreated(
        bytes32 indexed escrowId,
        address indexed payer,
        address indexed payee,
        address token,
        uint256 amount,
        uint64 autoReleaseAt
    );

    event EscrowFunded(bytes32 indexed escrowId);
    event EscrowReleased(bytes32 indexed escrowId, address indexed payee);
    event EscrowRefunded(bytes32 indexed escrowId, address indexed payer);
    event EscrowDisputed(bytes32 indexed escrowId, address indexed caller);

    // TODO: Implement core functions in later iterations:
    // - function createEscrow(...) external returns (bytes32)
    // - function fundEscrow(bytes32 escrowId) external payable
    // - function releaseEscrow(bytes32 escrowId) external
    // - function refundEscrow(bytes32 escrowId) external
    // - function openDispute(bytes32 escrowId) external
}
