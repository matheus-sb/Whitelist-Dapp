// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Whitelist {
    uint8 public maxWhiteListedAddresses;

    mapping(address => bool) public whiteListedAddresses;

    uint8 public numWhiteListedAddresses;

    constructor(uint8 _maxWhiteListedAddresses) {
        maxWhiteListedAddresses = _maxWhiteListedAddresses;
    }

    function addAddressToWhiteList() public {
        require(numWhiteListedAddresses < maxWhiteListedAddresses, "More addresses cant be added, limit reached");

        address sender = msg.sender;

        require(!whiteListedAddresses[sender], "Sender has already been whitelisted");

        whiteListedAddresses[sender] = true;

        numWhiteListedAddresses++;
    }
}