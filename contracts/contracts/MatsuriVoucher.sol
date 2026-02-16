// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { ERC721 } from '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';

// Voucher contract backed by the stablecoin (ERC721, non-transferable).
// ステーブルコインで購入するバウチャー（ERC721、譲渡不可）。
contract MatsuriVoucher is ERC721, Ownable {
    struct EventInfo {
        uint256 price;
        uint256 available;
    }

    // The stablecoin used for payment.
    // 支払いに使うステーブルコイン。
    IERC20 public immutable stablecoin;

    // Treasury receives the stablecoin payments.
    // 支払いを受け取るトレジャリー。
    address public treasury;

    // Event configuration and per-user balances.
    // イベント設定とユーザー別バランス。
    mapping(uint256 => EventInfo) private events;
    mapping(address => mapping(uint256 => uint256)) private balances;

    // Token bookkeeping: tokenId -> eventId and per-user stacks for redemption.
    // tokenId -> eventId と、償却用のユーザー別スタック。
    mapping(uint256 => uint256) private tokenEvent;
    mapping(address => mapping(uint256 => uint256[])) private ownedEventTokens;
    uint256 private nextTokenId = 1;

    event EventConfigured(uint256 indexed eventId, uint256 price, uint256 available);
    event VoucherPurchased(address indexed buyer, uint256 indexed eventId, uint256 quantity);
    event VoucherRedeemed(address indexed holder, uint256 indexed eventId, uint256 quantity);

    constructor(address stablecoinAddress, address issuerTreasury)
        ERC721('Matsuri Voucher', 'MVCHR')
        Ownable(issuerTreasury)
    {
        stablecoin = IERC20(stablecoinAddress);
        treasury = issuerTreasury;
    }

    // Configure or update an event (issuer only).
    // イベント設定・更新（発行者のみ）。
    function setEvent(uint256 eventId, uint256 price, uint256 available) external onlyOwner {
        events[eventId] = EventInfo({ price: price, available: available });
        emit EventConfigured(eventId, price, available);
    }

    // Buy vouchers with stablecoin. Each voucher is an ERC721 token.
    // ステーブルコインでバウチャー購入（1枚=1トークン）。
    function buyVoucher(uint256 eventId, uint256 quantity) external {
        EventInfo storage info = events[eventId];
        require(info.price > 0, 'Event not found');
        require(info.available >= quantity, 'Not enough availability');

        uint256 totalCost = info.price * quantity;
        require(stablecoin.transferFrom(msg.sender, treasury, totalCost), 'Payment failed');

        info.available -= quantity;

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = nextTokenId++;
            _safeMint(msg.sender, tokenId);
            tokenEvent[tokenId] = eventId;
            ownedEventTokens[msg.sender][eventId].push(tokenId);
            balances[msg.sender][eventId] += 1;
        }

        emit VoucherPurchased(msg.sender, eventId, quantity);
    }

    // Redeem vouchers by burning tokens.
    // バウチャーを利用し、トークンを焼却する。
    function redeemVoucher(uint256 eventId, uint256 quantity) external {
        uint256 current = balances[msg.sender][eventId];
        require(current >= quantity, 'Insufficient vouchers');

        for (uint256 i = 0; i < quantity; i++) {
            uint256[] storage stack = ownedEventTokens[msg.sender][eventId];
            uint256 tokenId = stack[stack.length - 1];
            stack.pop();
            delete tokenEvent[tokenId];
            _burn(tokenId);
            balances[msg.sender][eventId] -= 1;
        }

        emit VoucherRedeemed(msg.sender, eventId, quantity);
    }

    // Disable transfers to keep vouchers bound to the buyer.
    // 譲渡を禁止して購入者に紐付ける。
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = super._update(to, tokenId, auth);
        require(from == address(0) || to == address(0), 'Transfers disabled');
        return from;
    }

    // View helper for UI (balance per event).
    // UI 向けの参照関数（イベント別残高）。
    function balanceOf(address owner, uint256 eventId) external view returns (uint256) {
        return balances[owner][eventId];
    }

    function eventInfo(uint256 eventId) external view returns (uint256 price, uint256 available) {
        EventInfo storage info = events[eventId];
        return (info.price, info.available);
    }
}
