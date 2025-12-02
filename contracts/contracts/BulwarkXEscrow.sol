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

    function createEscrow(
        address _payee,
        address _arbiter,
        uint256 _autoReleaseSeconds
    ) external payable returns (bytes32) {
        require(_payee != address(0), "invalid payee");
        require(_arbiter != address(0), "invalid arbiter");
        require(_autoReleaseSeconds > 0, "auto release must be set");
        require(msg.value > 0, "amount must be > 0");

        bytes32 escrowId = keccak256(
            abi.encodePacked(msg.sender, _payee, msg.value, block.timestamp)
        );

        Escrow storage escrow = escrows[escrowId];
        escrow.payer = msg.sender;
        escrow.payee = _payee;
        escrow.arbiter = _arbiter;
        escrow.token = address(0);
        escrow.amount = msg.value;
        escrow.createdAt = uint64(block.timestamp);
        escrow.autoReleaseAt = uint64(block.timestamp + _autoReleaseSeconds);
        escrow.status = EscrowStatus.Funded;

        emit EscrowCreated(
            escrowId,
            msg.sender,
            _payee,
            address(0),
            msg.value,
            escrow.autoReleaseAt
        );
        emit EscrowFunded(escrowId);

        return escrowId;
    }

    function releaseEscrow(bytes32 escrowId) external {
        Escrow storage escrow = escrows[escrowId];
        require(
            escrow.status != EscrowStatus.Uninitialized,
            "escrow not found"
        );
        require(
            escrow.status == EscrowStatus.Funded ||
                (escrow.status == EscrowStatus.Disputed &&
                    msg.sender == escrow.arbiter),
            "cannot release"
        );

        if (escrow.status == EscrowStatus.Funded) {
            require(
                msg.sender == escrow.payer ||
                    (msg.sender == escrow.payee &&
                        block.timestamp >= escrow.autoReleaseAt),
                "not authorized"
            );
        }

        escrow.status = EscrowStatus.Released;

        (bool ok, ) = escrow.payee.call{value: escrow.amount}("");
        require(ok, "ETH transfer failed");

        emit EscrowReleased(escrowId, escrow.payee);
    }

    function refundEscrow(bytes32 escrowId) external {
        Escrow storage escrow = escrows[escrowId];
        require(
            escrow.status != EscrowStatus.Uninitialized,
            "escrow not found"
        );
        require(
            escrow.status == EscrowStatus.Funded ||
                (escrow.status == EscrowStatus.Disputed &&
                    msg.sender == escrow.arbiter),
            "cannot refund"
        );

        if (escrow.status == EscrowStatus.Funded) {
            require(msg.sender == escrow.payee, "not authorized");
        }

        escrow.status = EscrowStatus.Refunded;

        (bool ok, ) = escrow.payer.call{value: escrow.amount}("");
        require(ok, "ETH transfer failed");

        emit EscrowRefunded(escrowId, escrow.payer);
    }

    function openDispute(bytes32 escrowId) external {
        Escrow storage escrow = escrows[escrowId];
        require(
            escrow.status != EscrowStatus.Uninitialized,
            "escrow not found"
        );
        require(escrow.status == EscrowStatus.Funded, "wrong status");
        require(
            msg.sender == escrow.payer || msg.sender == escrow.payee,
            "not party"
        );

        escrow.status = EscrowStatus.Disputed;

        emit EscrowDisputed(escrowId, msg.sender);
    }
}
