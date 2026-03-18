// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Counter {
    uint256 public count;

    function increment() public {
        count += 1;
    }

    function incrementBy(uint256 amount) public {
        count += amount;
    }

    function reset() public {
        count = 0;
    }
}
