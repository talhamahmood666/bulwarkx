// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../BulwarkXEscrow.sol";

contract Reenter {
    BulwarkXEscrow public immutable escrow;
    bytes32 public cachedEscrowId;
    bool public attemptedReenter;

    constructor(address escrowAddress) {
        escrow = BulwarkXEscrow(escrowAddress);
    }

    function setEscrowId(bytes32 escrowId) external {
        cachedEscrowId = escrowId;
    }

    function receiveAndReenter(bytes32 escrowId) external {
        cachedEscrowId = escrowId;
    }

    receive() external payable {
        attemptedReenter = true;
        if (cachedEscrowId != bytes32(0)) {
            try escrow.releaseEscrow(cachedEscrowId) {
                // do nothing
            } catch {
                // swallow reentrancy failure
            }
        }
    }
}
