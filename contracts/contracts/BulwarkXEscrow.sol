// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

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
contract BulwarkXEscrow is ReentrancyGuard {
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
    mapping(address => uint256) public nonces;

    uint64 public constant DEFAULT_AUTO_RELEASE_SECONDS = 3600;

    event EscrowCreated(
        bytes32 indexed escrowId,
        address indexed payer,
        address indexed payee,
        address arbiter,
        address token,
        uint256 amount,
        EscrowStatus status,
        uint64 createdAt,
        uint64 autoReleaseAt
    );

    event EscrowFunded(bytes32 indexed escrowId);

    event EscrowReleased(
        bytes32 indexed escrowId,
        address indexed payer,
        address indexed payee,
        address arbiter,
        address token,
        uint256 amount,
        EscrowStatus status,
        uint64 timestamp
    );

    event EscrowRefunded(
        bytes32 indexed escrowId,
        address indexed payer,
        address indexed payee,
        address arbiter,
        address token,
        uint256 amount,
        EscrowStatus status,
        uint64 timestamp
    );

    event EscrowDisputed(
        bytes32 indexed escrowId,
        address indexed caller,
        address indexed payer,
        address payee,
        address arbiter,
        address token,
        uint256 amount,
        EscrowStatus status,
        uint64 timestamp
    );

    function createEscrow(
        address _payee,
        address _arbiter,
        uint64 _autoReleaseSeconds
    ) external payable returns (bytes32) {
        bytes32 orderId = keccak256(
            abi.encodePacked(msg.sender, _payee, _arbiter, _autoReleaseSeconds, block.timestamp)
        );

        return
            createEscrowWithId(
                orderId,
                _payee,
                _arbiter,
                msg.value,
                _autoReleaseSeconds
            );
    }

    function createEscrowToken(
        address _payee,
        address _arbiter,
        address _token,
        uint256 _amount,
        uint64 _autoReleaseSeconds
    ) external returns (bytes32) {
        bytes32 orderId = keccak256(
            abi.encodePacked(msg.sender, _payee, _token, _amount, _autoReleaseSeconds, block.timestamp)
        );

        return
            createEscrowTokenWithId(
                orderId,
                _token,
                _payee,
                _arbiter,
                _amount,
                _autoReleaseSeconds
            );
    }

    function createEscrowWithId(
        bytes32 orderId,
        address _payee,
        address _arbiter,
        uint256 _amount
    ) external payable returns (bytes32) {
        return createEscrowWithId(orderId, _payee, _arbiter, _amount, DEFAULT_AUTO_RELEASE_SECONDS);
    }

    function createEscrowWithId(
        bytes32 orderId,
        address _payee,
        address _arbiter,
        uint256 _amount,
        uint64 _autoReleaseSeconds
    ) public payable returns (bytes32) {
        require(_payee != address(0), "invalid payee");
        require(_arbiter != address(0), "invalid arbiter");
        require(_amount > 0, "amount must be > 0");
        require(_autoReleaseSeconds > 0, "auto release must be set");
        require(msg.value == _amount, "incorrect msg.value");

        uint256 nonce = nonces[msg.sender];
        bytes32 escrowId = _deriveEscrowId(
            orderId,
            msg.sender,
            _payee,
            address(0),
            _amount,
            nonce
        );

        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Uninitialized, "escrow exists");

        nonces[msg.sender] = nonce + 1;

        escrow.payer = msg.sender;
        escrow.payee = _payee;
        escrow.arbiter = _arbiter;
        escrow.token = address(0);
        escrow.amount = _amount;
        escrow.createdAt = uint64(block.timestamp);
        escrow.autoReleaseAt = uint64(block.timestamp + _autoReleaseSeconds);
        escrow.status = EscrowStatus.Funded;

        emit EscrowCreated(
            escrowId,
            msg.sender,
            _payee,
            _arbiter,
            address(0),
            _amount,
            escrow.status,
            escrow.createdAt,
            escrow.autoReleaseAt
        );
        emit EscrowFunded(escrowId);

        return escrowId;
    }

    function createEscrowTokenWithId(
        bytes32 orderId,
        address _token,
        address _payee,
        address _arbiter,
        uint256 _amount
    ) external returns (bytes32) {
        return
            createEscrowTokenWithId(
                orderId,
                _token,
                _payee,
                _arbiter,
                _amount,
                DEFAULT_AUTO_RELEASE_SECONDS
            );
    }

    function createEscrowTokenWithId(
        bytes32 orderId,
        address _token,
        address _payee,
        address _arbiter,
        uint256 _amount,
        uint64 _autoReleaseSeconds
    ) public returns (bytes32) {
        require(_payee != address(0), "invalid payee");
        require(_arbiter != address(0), "invalid arbiter");
        require(_token != address(0), "invalid token");
        require(_amount > 0, "amount must be > 0");
        require(_autoReleaseSeconds > 0, "auto release must be set");

        uint256 nonce = nonces[msg.sender];
        bytes32 escrowId = _deriveEscrowId(
            orderId,
            msg.sender,
            _payee,
            _token,
            _amount,
            nonce
        );

        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Uninitialized, "escrow exists");

        nonces[msg.sender] = nonce + 1;

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
            _arbiter,
            _token,
            _amount,
            escrow.status,
            escrow.createdAt,
            escrow.autoReleaseAt
        );
        emit EscrowFunded(escrowId);

        return escrowId;
    }

    function releaseEscrow(bytes32 escrowId) external nonReentrant {
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

        emit EscrowReleased(
            escrowId,
            escrow.payer,
            escrow.payee,
            escrow.arbiter,
            escrow.token,
            escrow.amount,
            escrow.status,
            uint64(block.timestamp)
        );
    }

    function refundEscrow(bytes32 escrowId) external nonReentrant {
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

        emit EscrowRefunded(
            escrowId,
            escrow.payer,
            escrow.payee,
            escrow.arbiter,
            escrow.token,
            escrow.amount,
            escrow.status,
            uint64(block.timestamp)
        );
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

        emit EscrowDisputed(
            escrowId,
            msg.sender,
            escrow.payer,
            escrow.payee,
            escrow.arbiter,
            escrow.token,
            escrow.amount,
            escrow.status,
            uint64(block.timestamp)
        );
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

    function _deriveEscrowId(
        bytes32 orderId,
        address payer,
        address payee,
        address token,
        uint256 amount,
        uint256 nonce
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(orderId, payer, payee, token, amount, nonce)
            );
    }
}
