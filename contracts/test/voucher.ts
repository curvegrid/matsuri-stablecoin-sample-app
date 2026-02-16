import { expect } from 'chai';
import { network } from 'hardhat';

const { ethers } = await network.connect();

// Basic tests for ERC721 vouchers.
// ERC721 バウチャーの基本テスト。

describe('MatsuriVoucher', () => {
  it('mints vouchers and tracks balances per event', async () => {
    const [deployer, buyer] = await ethers.getSigners();

    const Stablecoin = await ethers.getContractFactory('MatsuriStablecoin');
    const stablecoin = await Stablecoin.deploy('Matsuri Yen', 'MJPY', deployer.address);
    await stablecoin.waitForDeployment();

    const Voucher = await ethers.getContractFactory('MatsuriVoucher');
    const voucher = await Voucher.deploy(await stablecoin.getAddress(), deployer.address);
    await voucher.waitForDeployment();

    const price = ethers.parseUnits('5', 18);
    await voucher.setEvent(1, price, 10);

    await stablecoin.mint(buyer.address, price);
    await stablecoin.connect(buyer).approve(await voucher.getAddress(), price);

    await voucher.connect(buyer).buyVoucher(1, 1);

    const balance = await voucher.getFunction('balanceOf(address,uint256)')(buyer.address, 1);
    expect(balance).to.equal(1n);
  });

  it('disables transfers', async () => {
    const [deployer, buyer, other] = await ethers.getSigners();

    const Stablecoin = await ethers.getContractFactory('MatsuriStablecoin');
    const stablecoin = await Stablecoin.deploy('Matsuri Yen', 'MJPY', deployer.address);
    await stablecoin.waitForDeployment();

    const Voucher = await ethers.getContractFactory('MatsuriVoucher');
    const voucher = await Voucher.deploy(await stablecoin.getAddress(), deployer.address);
    await voucher.waitForDeployment();

    const price = ethers.parseUnits('5', 18);
    await voucher.setEvent(1, price, 10);

    await stablecoin.mint(buyer.address, price);
    await stablecoin.connect(buyer).approve(await voucher.getAddress(), price);
    await voucher.connect(buyer).buyVoucher(1, 1);

    await expect(voucher.connect(buyer).transferFrom(buyer.address, other.address, 1)).to.be.revertedWith(
      'Transfers disabled'
    );
  });

  it('redeems vouchers by burning tokens', async () => {
    const [deployer, buyer] = await ethers.getSigners();

    const Stablecoin = await ethers.getContractFactory('MatsuriStablecoin');
    const stablecoin = await Stablecoin.deploy('Matsuri Yen', 'MJPY', deployer.address);
    await stablecoin.waitForDeployment();

    const Voucher = await ethers.getContractFactory('MatsuriVoucher');
    const voucher = await Voucher.deploy(await stablecoin.getAddress(), deployer.address);
    await voucher.waitForDeployment();

    const price = ethers.parseUnits('5', 18);
    await voucher.setEvent(1, price, 10);

    await stablecoin.mint(buyer.address, price * 2n);
    await stablecoin.connect(buyer).approve(await voucher.getAddress(), price * 2n);

    await voucher.connect(buyer).buyVoucher(1, 2);
    await voucher.connect(buyer).redeemVoucher(1, 1);

    const balance = await voucher.getFunction('balanceOf(address,uint256)')(buyer.address, 1);
    expect(balance).to.equal(1n);
  });
});
