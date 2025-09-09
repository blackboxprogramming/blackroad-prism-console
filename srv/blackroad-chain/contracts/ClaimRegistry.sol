// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ClaimRegistry is ERC721, Ownable {
    uint256 public nextId = 1;

    struct Claim {
        bytes32 contentHash;   // sha256 or keccak256 of normalized claim JSON
        string  uri;           // ipfs:// or https:// archive url
        string  claimType;     // e.g., "defensive-publication", "provisional-draft"
        uint64  timestamp;     // block time at mint
    }

    mapping(uint256 => Claim) public claims;
    mapping(uint256 => bytes32) public dailyRoot; // YYYYMMDD => Merkle root anchored

    event ClaimRegistered(uint256 indexed tokenId, address indexed owner, bytes32 contentHash, string uri, string claimType, uint64 timestamp);
    event DailyRootCommitted(uint256 indexed yyyymmdd, bytes32 root);

    constructor() ERC721("BlackRoad Claim", "BRCLAIM") Ownable(msg.sender) {}

    function registerClaim(
        address to,
        bytes32 contentHash,
        string calldata uri,
        string calldata claimType
    ) external onlyOwner returns (uint256 tokenId) {
        tokenId = nextId++;
        _safeMint(to, tokenId);
        claims[tokenId] = Claim({
            contentHash: contentHash,
            uri: uri,
            claimType: claimType,
            timestamp: uint64(block.timestamp)
        });
        emit ClaimRegistered(tokenId, to, contentHash, uri, claimType, uint64(block.timestamp));
    }

    // Anchor a day's Merkle root (owner or designated relayer)
    function commitDailyRoot(uint256 yyyymmdd, bytes32 root) external onlyOwner {
        require(dailyRoot[yyyymmdd] == bytes32(0), "root already set");
        dailyRoot[yyyymmdd] = root;
        emit DailyRootCommitted(yyyymmdd, root);
    }
}
