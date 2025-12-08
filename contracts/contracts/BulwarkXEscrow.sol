// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

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
    using SafeERC20 for IERC20;

    enum EscrowStatus {
        Uninitialized,
        Funded,
        Released,
        Refunded,
        Disputed
    }

    struct Escrow {
        address payer; // buyer
        address payee; // merchant
        address arbiter; // BulwarkX or third-party
        address token; // address(0) for native, ERC20 otherwise
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

    function createEscrowToken(
        address _token,
        address _payee,
        address _arbiter,
        uint256 _amount,
        uint256 _autoReleaseSeconds
    ) external returns (bytes32) {
        require(_token != address(0), "invalid token");
        require(_payee != address(0), "invalid payee");
        require(_arbiter != address(0), "invalid arbiter");
        require(_autoReleaseSeconds > 0, "auto release must be set");
        require(_amount > 0, "amount must be > 0");

        bytes32 escrowId = keccak256(
            abi.encodePacked(msg.sender, _payee, _token, _amount, block.timestamp)
        );

        Escrow storage escrow = escrows[escrowId];
        escrow.payer = msg.sender;
        escrow.payee = _payee;
        escrow.arbiter = _arbiter;
        escrow.token = _token;
        escrow.amount = _amount;
        escrow.createdAt = uint64(block.timestamp);
        escrow.autoReleaseAt = uint64(block.timestamp + _autoReleaseSeconds);
        escrow.status = EscrowStatus.Funded;

        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        emit EscrowCreated(
            escrowId,
            msg.sender,
            _payee,
            _token,
            _amount,
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

        _payout(escrow.payee, escrow.token, escrow.amount);

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

        _payout(escrow.payer, escrow.token, escrow.amount);

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

    function _payout(
        address recipient,
        address token,
        uint256 amount
    ) internal {
        if (token == address(0)) {
            (bool ok, ) = payable(recipient).call{value: amount}("");
            require(ok, "ETH transfer failed");
        } else {
            IERC20(token).safeTransfer(recipient, amount);
        }
    }
}
